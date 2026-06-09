const { requireUser } = require("../../../lib/jwt");
const db = require("../../../lib/db");
const OpenAI = require("openai");

const DAILY_LIMIT = 50;

const SCENARIO_CONFIG = {
  intro: {
    title: "Знакомство",
    role: "Ты новый знакомый. Нужно мягко познакомиться, спросить имя, город, учебу, работу или интересы.",
    flow: "Начинай с приветствия. Потом задавай по одному простому вопросу о человеке. Не уходи в другие темы.",
    fallback: "Сәлем! Сіздің атыңыз кім?",
    followups: [
      "Сіз қай қаладан келдіңіз?",
      "Сіз студентсіз бе, әлде жұмыс істейсіз бе?",
      "Бос уақытыңызда не істейсіз?"
    ]
  },
  cafe: {
    title: "Кафе",
    role: "Ты официант в кафе. Нужно помочь сделать заказ.",
    flow: "Спрашивай, что человек хочет заказать, какой напиток, нужно ли что-то еще, спроси про оплату или завершение заказа.",
    fallback: "Сәлеметсіз бе! Не қалайсыз?",
    followups: [
      "Қандай сусын қалайсыз?",
      "Тағы не аласыз?",
      "Тапсырысыңыз дайын, тағы бір нәрсе керек пе?"
    ]
  },
  shop: {
    title: "Магазин",
    role: "Ты продавец в магазине. Нужно помочь найти и купить товар.",
    flow: "Спрашивай, какой товар нужен, сколько нужно, какой размер, вкус или цвет, и нужна ли еще помощь.",
    fallback: "Сәлеметсіз бе! Сізге не керек?",
    followups: [
      "Қанша дана керек?",
      "Үлкені керек пе, кішісі керек пе?",
      "Тағы бір нәрсе қарайсыз ба?"
    ]
  },
  taxi: {
    title: "Такси",
    role: "Ты водитель такси. Нужно уточнить адрес, маршрут и место остановки.",
    flow: "Спрашивай адрес, куда ехать, сколько ждать, где остановить, нужен ли другой маршрут.",
    fallback: "Қайда барамыз?",
    followups: [
      "Мекенжайды айтыңызшы.",
      "Осы жерге тоқтаймын ба?",
      "Жылдам жолмен барайық па?"
    ]
  },
  university: {
    title: "Университет",
    role: "Ты одногруппник или преподаватель в университете. Нужно говорить про пары, аудиторию, расписание и задания.",
    flow: "Спрашивай про занятие, аудиторию, преподавателя, домашнее задание или понимание темы.",
    fallback: "Сәлем! Бүгін қай сабақ бар?",
    followups: [
      "Дәріс қай аудиторияда болады?",
      "Үй тапсырмасы бар ма?",
      "Түсінбесеңіз, мен қайта айтып беремін."
    ]
  },
  work: {
    title: "Работа",
    role: "Ты коллега или руководитель на работе. Нужно обсуждать простые рабочие задачи.",
    flow: "Спрашивай про задачу, сроки, готовность, помощь, встречу или следующий шаг.",
    fallback: "Сәлем! Бүгін қандай тапсырма бар?",
    followups: [
      "Тапсырма дайын болды ма?",
      "Қашан аяқтайсыз?",
      "Көмек керек болса, айтыңыз."
    ]
  }
};

async function getTodayUsed(userId) {
  const q = await db.query(
    `select used from ai_daily_usage where user_id = $1 and day = current_date`,
    [userId]
  );
  return Number(q.rows[0]?.used || 0);
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .trim();
}

function resolveVoiceOptions(body) {
  const options = body?.options || {};
  const meta = body?.meta || {};

  const readBool = (value, fallback) =>
    typeof value === "boolean" ? value : fallback;

  return {
    showTranslation: readBool(options.showTranslation, readBool(meta.translation, true)),
    gentleCorrection: readBool(options.gentleCorrection, readBool(meta.correction, true)),
    hints: readBool(options.hints, readBool(meta.hints, true)),
    slowSpeech: readBool(options.slowSpeech, readBool(meta.speed === "slow", false)),
  };
}

function isLikelyUnclearInput(text) {
  const value = normalizeText(text);
  if (!value) return true;
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length === 1 && value.length < 4) return true;
  const weirdRatio = (value.match(/[^\p{L}\p{N}\s.,!?\-]/gu) || []).length / Math.max(value.length, 1);
  if (weirdRatio > 0.18) return true;
  const tinyWords = words.filter((w) => w.length <= 2).length;
  if (words.length >= 3 && tinyWords === words.length) return true;
  return false;
}

function getScenario(body) {
  const key = normalizeText(body?.scenarioKey || "").toLowerCase();
  if (SCENARIO_CONFIG[key]) return { key, ...SCENARIO_CONFIG[key] };
  const title = normalizeText(body?.scenario || "");
  const found = Object.entries(SCENARIO_CONFIG).find(([, cfg]) => cfg.title.toLowerCase() === title.toLowerCase());
  if (found) return { key: found[0], ...found[1] };
  return { key: "intro", ...SCENARIO_CONFIG.intro };
}


function extractTopicFragment(message) {
  const text = normalizeText(message).toLowerCase();
  if (!text) return "";
  const patterns = [
    /маған\s+(.+?)\s+(беріңізші|беріңіз|қажет|керек)$/i,
    /маған\s+(.+?)$/i,
    /бір\s+(.+?)\s+(беріңізші|беріңіз)$/i,
    /(.+?)\s+(керек|қажет)$/i,
    /(.+?)\s+(алайын|аламын)$/i
  ];
  for (const rx of patterns) {
    const m = text.match(rx);
    if (m && m[1]) return normalizeText(m[1]);
  }
  return "";
}

function buildNaturalScenarioReply(message, body) {
  const scenario = getScenario(body);
  const topic = extractTopicFragment(message);
  switch (scenario.key) {
    case "cafe":
      if (topic) return `Әрине, ${topic}. Тағы не аласыз?`;
      return "Әрине. Тағы не аласыз?";
    case "shop":
      if (topic) return `${topic[0] ? topic[0].toUpperCase() + topic.slice(1) : topic} бар. Тағы бір нәрсе керек пе?`;
      return "Жақсы, қарап көрейік. Тағы не керек?";
    case "taxi":
      return "Жақсы, мекенжайды нақтырақ айтыңызшы.";
    case "university":
      return "Жақсы, осы тақырып бойынша нақты не керек?";
    case "work":
      return "Жақсы, қазір қай бөлігін істеп жатырсыз?";
    default:
      return scenario.followups[0] || scenario.fallback;
  }
}

function looksLikeParrotReply(userMessage, assistantText) {
  const user = normalizeText(userMessage).toLowerCase();
  const assistant = normalizeText(assistantText).toLowerCase();
  if (!user || !assistant) return false;
  if (assistant === user) return true;
  if (assistant.startsWith(user + ',') || assistant.startsWith(user + '.') || assistant.startsWith(user + ' ')) return true;
  const userWords = user.split(/\s+/).filter(Boolean);
  if (userWords.length >= 3) {
    const overlapStart = userWords.slice(0, Math.min(userWords.length, 5)).join(' ');
    if (assistant.startsWith(overlapStart)) return true;
  }
  return false;
}

function looksLikeLearnerAnswer(body, assistantText, correction) {
  const scenario = getScenario(body);
  const text = normalizeText(assistantText).toLowerCase();
  if (!text) return false;

  const hasCorrection = !!(correction && (correction.hasIssue || correction.better));

  if (scenario.key === 'intro') {
    if (/^менің атым\b/.test(text) || /^мен\s+[а-яәіңғүұқөһa-z]/i.test(text)) {
      return hasCorrection;
    }
    if (/^сәлеметсіз бе[,!]?\s*менің атым\b/.test(text)) return true;
  }

  if (scenario.key === 'cafe') {
    if (/^маған\b/.test(text) || /^бір\s+.+\s+(беріңізші|беріңіз)\b/.test(text)) return true;
  }

  if (scenario.key === 'shop') {
    if (/^маған\b.+\b(керек|қажет)\b/.test(text)) return true;
  }

  if (scenario.key === 'taxi') {
    if (/^мына\s+мекенжайға\b/.test(text) || /^осы\s+жерге\s+тоқтаңызшы\b/.test(text)) return true;
  }

  if (scenario.key === 'university') {
    if (/^дәріс\s+қайда\b/.test(text) || /^үй\s+тапсырмасы\s+бар\s+ма\b/.test(text)) return true;
  }

  if (scenario.key === 'work') {
    if (/^мен\s+тапсырманы\b/.test(text) || /^маған\s+көмек\s+керек\b/.test(text)) return true;
  }

  return false;
}

function looksLikeRoleBreak(body, assistantText) {
  const scenario = getScenario(body);
  const text = normalizeText(assistantText).toLowerCase();
  if (!text) return true;
  if (text.startsWith('{') || text.includes('"assistantText"')) return true;
  if (scenario.key === 'cafe') {
    if (/бағасы .*шот беріңізші/.test(text)) return true;
    if (/қандай сусын қалайсыз/.test(text) && /кофе/.test(text)) return true;
  }
  return false;
}

function buildVoiceMessages(body) {
  const message = normalizeText(body?.message || "");
  const history = Array.isArray(body?.history) ? body.history.slice(-8) : [];
  const scenario = getScenario(body);
  const goal = normalizeText(body?.scenarioGoal || "Поддержать короткий диалог");
  const level = normalizeText(body?.level || body?.meta?.level || "A1");
  const action = normalizeText(body?.action || "message");
  const phrases = Array.isArray(body?.supportPhrases) ? body.supportPhrases.slice(0, 8).map(normalizeText).filter(Boolean) : [];
  const opts = resolveVoiceOptions(body);

  const messages = [
    {
      role: "system",
      content: [
        "Ты — голосовой ИИ-репетитор платформы AnaTil для изучения казахского языка.",
        "Это именно короткий разговорный voice-диалог, а не длинный урок.",
        `Сценарий: ${scenario.title}.`,
        `Роль: ${scenario.role}`,
        `Как вести разговор: ${scenario.flow}`,
        `Цель: ${goal}.`,
        `Уровень ученика: ${level}.`,
        opts.slowSpeech
          ? "Режим медленной речи включен: используй максимально простые слова и очень короткие фразы."
          : "Говори естественно и понятно для уровня ученика.",
        opts.showTranslation
          ? "Можно добавить короткий перевод в поле translation, если это действительно помогает."
          : "Поле translation по умолчанию оставляй пустым.",
        opts.gentleCorrection
          ? "Если ученик допустил заметную ошибку, можно мягко указать улучшенный вариант в correction."
          : "Исправления отключены: в обычном режиме оставляй correction пустым и не акцентируй ошибки.",
        opts.hints
          ? "Подсказки включены: при action=hint дай короткий уместный пример ответа."
          : "Подсказки отключены: при action=hint не давай готовый ответ, мягко предложи ученику ответить самостоятельно.",
        phrases.length ? `Полезные фразы по теме: ${phrases.join(" | ")}.` : "",
        scenario.followups.length ? `Примеры уместных следующих реплик: ${scenario.followups.join(" | ")}.` : "",
        "Главная реплика всегда должна быть на казахском.",
        "Говори естественно, просто и коротко: 1–2 предложения.",
        "Не выходи из текущего сценария. Не начинай темы из других сценариев.",
        "Для A1 используй очень простые слова и короткие вопросы.",
        "Для A2 — бытовой разговор без сложных конструкций.",
        "Для B1 — естественная речь, но без перегруза.",
        "Если речь ученика неясная, странная или похожа на ошибку распознавания, не пытайся глубоко угадывать смысл.",
        "В таком случае вежливо попроси повторить по-казахски короткой фразой.",
        "Отвечай именно как собеседник по роли, а не как проверка предложения.",
        "Не копируй целиком фразу ученика в assistantText. Не начинай ответ с дословного повторения его реплики. Не говори за ученика и не подсказывай его реплику как будто это твой ответ.",
        "Если ученик что-то просит или заказывает, сначала естественно подтверди или отреагируй, потом задай один следующий уместный вопрос. Ты всегда остаешься в роли официанта, продавца, водителя или другого собеседника из сценария.",
        "Исправление фразы ученика можно писать только в correction.better, но не в assistantText.",
        "Пример для кафе: ученик=«Маған бір латте беріңізші» -> assistantText=«Әрине, бір латте. Тағы не аласыз?».",
        "Плохой пример для кафе: assistantText=«Маған бір латте беріңізші, тағы не аласыз?» — так нельзя.",
        "Если action=hint, дай пример краткого ответа ученика на казахском и короткий перевод на русском именно по текущему сценарию.",
        "Если action=repeat, повтори вопрос проще на казахском и дай короткий перевод на русском именно по текущему сценарию.",
        "Если action=explain, очень кратко объясни на русском и дай улучшенный вариант ответа на казахском.",
        "Верни строго один JSON-объект без markdown и без лишнего текста.",
        '{"assistantText":"...","ttsText":"...","translation":"...","correction":{"hasIssue":false,"better":"","explanation":""},"meta":{"shouldRepeat":false,"isUnclearInput":false}}',
        "assistantText: основная реплика собеседника на казахском.",
        "ttsText: как правило то же самое, что assistantText. Можно слегка упростить для более естественной озвучки, но смысл должен совпадать.",
        "translation: короткий перевод assistantText на русский, если он полезен. Иначе пустая строка.",
        "correction.hasIssue: true только если ошибка ученика понятна и реально можно мягко исправить.",
        "correction.better: исправленный или более естественный вариант реплики ученика на казахском.",
        "correction.explanation: короткое объяснение на русском.",
        "meta.shouldRepeat: true если лучше попросить повторить.",
        "meta.isUnclearInput: true если фраза похожа на плохое распознавание речи.",
        "Не добавляй никаких других полей."
      ].filter(Boolean).join("\n")
    }
  ];

  history.forEach((item) => {
    if (!item || !item.role || !item.text) return;
    messages.push({
      role: item.role === "assistant" ? "assistant" : "user",
      content: normalizeText(item.text)
    });
  });

  messages.push({
    role: "user",
    content: `action=${action}\nРеплика ученика: ${message}`
  });

  return messages;
}

function fallbackVoiceReply(message, body) {
  const text = normalizeText(message);
  const scenario = getScenario(body);
  const opts = resolveVoiceOptions(body);
  const unclear = isLikelyUnclearInput(text);
  if (unclear) {
    return {
      assistantText: "Кешіріңіз, сөзіңізді толық түсінбедім. Қайталап айта аласыз ба?",
      ttsText: "Кешіріңіз, сөзіңізді толық түсінбедім. Қайталап айта аласыз ба?",
      translation: "Извините, я не до конца понял. Можете повторить?",
      correction: {
        hasIssue: false,
        better: "",
        explanation: "Речь распознана неясно. Попробуйте сказать медленнее и короче."
      },
      meta: {
        shouldRepeat: true,
        isUnclearInput: true
      }
    };
  }

  const action = normalizeText(body?.action || "message");
  if (action === "hint") {
    if (!opts.hints) {
      return {
        assistantText: "Өзіңіз қысқа жауап беріп көріңіз. Қажет болса, кейін көмек беремін.",
        ttsText: "Өзіңіз қысқа жауап беріп көріңіз. Қажет болса, кейін көмек беремін.",
        translation: opts.showTranslation ? "Попробуйте ответить самостоятельно, потом подскажу." : "",
        correction: { hasIssue: false, better: "", explanation: "" },
        meta: { shouldRepeat: false, isUnclearInput: false }
      };
    }

    const hintMap = {
      intro: ["Менің атым Арсен.", "Мен Алматыданмын."],
      cafe: ["Маған бір кофе беріңізші.", "Шай емес, кофе аламын."],
      shop: ["Маған нан керек.", "Мынау қанша тұрады?"],
      taxi: ["Мына мекенжайға барыңызшы.", "Осы жерде тоқтаңызшы."],
      university: ["Дәріс қайда болады?", "Үй тапсырмасы бар ма?"],
      work: ["Мен тапсырманы аяқтадым.", "Маған көмек керек."]
    };
    const sample = (hintMap[scenario.key] || hintMap.intro)[0];
    return {
      assistantText: sample,
      ttsText: sample,
      translation: "Пример короткого ответа по этой ситуации.",
      correction: { hasIssue: false, better: "", explanation: "" },
      meta: { shouldRepeat: false, isUnclearInput: false }
    };
  }

  if (action === "repeat") {
    const line = scenario.followups[0] || scenario.fallback;
    return {
      assistantText: line,
      ttsText: line,
      translation: "Повтор вопроса проще по текущему сценарию.",
      correction: { hasIssue: false, better: "", explanation: "" },
      meta: { shouldRepeat: false, isUnclearInput: false }
    };
  }

  if (action === "explain") {
    return {
      assistantText: scenario.followups[0] || scenario.fallback,
      ttsText: scenario.followups[0] || scenario.fallback,
      translation: "Короткий вариант по теме.",
      correction: {
        hasIssue: false,
        better: "",
        explanation: "Старайтесь отвечать коротко и по теме текущего сценария."
      },
      meta: { shouldRepeat: false, isUnclearInput: false }
    };
  }

  return {
    assistantText: scenario.fallback,
    ttsText: scenario.fallback,
    translation: "Короткий ответ по текущему сценарию.",
    correction: { hasIssue: false, better: "", explanation: "" },
    meta: { shouldRepeat: false, isUnclearInput: false }
  };
}

function sanitizeReply(raw, message, body) {
  try {
    const opts = resolveVoiceOptions(body);
    const action = normalizeText(body?.action || "message");
    const parsed = JSON.parse(raw || "{}");
    let assistantText = normalizeText(parsed?.assistantText || "Кешіріңіз, қайталап айта аласыз ба?");
    let ttsText = normalizeText(parsed?.ttsText || parsed?.assistantText || assistantText);
    const translation = opts.showTranslation ? normalizeText(parsed?.translation || "") : "";
    const correction = {
      hasIssue: !!parsed?.correction?.hasIssue,
      better: normalizeText(parsed?.correction?.better || ""),
      explanation: normalizeText(parsed?.correction?.explanation || "")
    };
    const meta = {
      shouldRepeat: !!parsed?.meta?.shouldRepeat,
      isUnclearInput: !!parsed?.meta?.isUnclearInput
    };

    if (
      action === 'message' &&
      (
        looksLikeParrotReply(message, assistantText) ||
        looksLikeLearnerAnswer(body, assistantText, correction) ||
        looksLikeRoleBreak(body, assistantText)
      )
    ) {
      assistantText = buildNaturalScenarioReply(message, body);
      ttsText = assistantText;
    }

    if (!opts.hints && action === "hint") {
      assistantText = "Өзіңіз қысқа жауап беріп көріңіз.";
      ttsText = assistantText;
    }

    if (!opts.gentleCorrection && action !== "explain") {
      correction.hasIssue = false;
      correction.better = "";
      correction.explanation = "";
    }

    return { assistantText, ttsText, translation, correction, meta };
  } catch {
    return fallbackVoiceReply(message, body);
  }
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    let user;
    try {
      user = requireUser(req);
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY missing" });
    }

    const { sessionId } = req.body || {};
    const action = normalizeText(req.body?.action || "message");
    const rawMessage = req.body?.message ?? req.body?.text ?? req.body?.userText ?? "";
    const cleanMessage = normalizeText(rawMessage);
    if (action !== "start" && !cleanMessage) {
      return res.status(400).json({ error: "Message is required" });
    }

    const used0 = await getTodayUsed(user.id);
    if (used0 >= DAILY_LIMIT) {
      return res.status(429).json({
        error: "Daily limit reached",
        details: "AI лимит на сегодня исчерпан",
        usage: { used: used0, limit: DAILY_LIMIT, remaining: 0 }
      });
    }

    let reply;
    if (action === "start") {
      reply = fallbackVoiceReply("ok", req.body);
    } else if (isLikelyUnclearInput(cleanMessage)) {
      reply = fallbackVoiceReply(cleanMessage, req.body);
    } else {
      const openai = new OpenAI({ apiKey, timeout: 25000 });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: buildVoiceMessages(req.body),
        temperature: 0.4,
        response_format: { type: "json_object" }
      });
      reply = sanitizeReply(completion.choices?.[0]?.message?.content || "{}", cleanMessage, req.body);
    }

    await db.query(
      `
      insert into ai_daily_usage (user_id, day, used)
      values ($1, current_date, 1)
      on conflict (user_id, day)
      do update set used = ai_daily_usage.used + 1
      `,
      [user.id]
    );

    let session = null;
    if (sessionId) {
      const sid = Number(sessionId);
      if (!Number.isNaN(sid) && sid > 0) {
        const s = await db.query(
          `
          update ai_sessions
          set message_pairs = message_pairs + 1
          where id = $1 and user_id = $2
          returning id, mode, lesson_id, scenario, started_at, ended_at, message_pairs
          `,
          [sid, user.id]
        );

        if (s.rows[0]) {
          session = s.rows[0];
          if (action === "start") {
            await db.query(
              `insert into ai_messages (session_id, role, content) values ($1,'assistant',$2)`,
              [sid, reply.assistantText]
            );
          } else {
            await db.query(
              `insert into ai_messages (session_id, role, content) values ($1,'user',$2), ($1,'assistant',$3)`,
              [sid, cleanMessage, reply.assistantText]
            );
          }
        }
      }
    }

    const used = await getTodayUsed(user.id);
    return res.json({
      success: true,
      assistantText: reply.assistantText,
      ttsText: reply.ttsText,
      translation: reply.translation,
      correction: reply.correction,
      meta: reply.meta,
      usage: { used, limit: DAILY_LIMIT, remaining: Math.max(DAILY_LIMIT - used, 0) },
      session
    });
  } catch (err) {
    console.error("[ai/voice-dialog] error:", err?.message || err);
    return res.status(500).json({
      error: "AI error",
      details: "Внутренняя ошибка AI сервиса"
    });
  }
};
