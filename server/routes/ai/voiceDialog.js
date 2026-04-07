const { requireUser } = require("../../../lib/jwt");
const db = require("../../../lib/db");
const OpenAI = require("openai");

const DAILY_LIMIT = 50;

const SCENARIOS = {
  intro: {
    title: "Знакомство",
    role: "Новый знакомый",
    setting: "Первая встреча и короткое знакомство",
    ask: ["имя", "откуда пользователь", "чем занимается", "интересы"],
    avoid: ["сложные грамматические объяснения", "длинные монологи"],
    starter: "Сәлеметсіз бе! Атыңыз кім?"
  },
  cafe: {
    title: "Кафе",
    role: "Официант или кассир",
    setting: "Заказ еды и напитков в кафе",
    ask: ["что заказать", "размер", "цена", "нужно ли что-то еще"],
    avoid: ["темы вне заказа", "абстрактные вопросы"],
    starter: "Сәлеметсіз бе! Не тапсырыс бересіз?"
  },
  shop: {
    title: "Магазин",
    role: "Продавец",
    setting: "Покупка товара в магазине",
    ask: ["какой товар нужен", "количество", "цена", "размер или вкус"],
    avoid: ["долгие описания", "посторонние темы"],
    starter: "Сәлеметсіз бе! Сізге не керек?"
  },
  taxi: {
    title: "Такси",
    role: "Водитель такси",
    setting: "Поездка по адресу",
    ask: ["адрес", "время", "где остановиться", "маршрут"],
    avoid: ["сложные рассуждения", "лишние подробности не по поездке"],
    starter: "Сәлеметсіз бе! Қай мекенжайға барамыз?"
  },
  university: {
    title: "Университет",
    role: "Одногруппник или преподаватель",
    setting: "Разговор об учебе, занятии, аудитории или домашнем задании",
    ask: ["какой предмет", "где аудитория", "есть ли домашнее задание", "нужно ли повторить"],
    avoid: ["неучебные темы", "слишком сложные академические формулировки"],
    starter: "Сәлем! Қандай пән немесе сабақ туралы сөйлесеміз?"
  },
  work: {
    title: "Работа",
    role: "Коллега или руководитель",
    setting: "Короткий рабочий разговор",
    ask: ["какая задача", "срок", "готовность", "нужна ли помощь"],
    avoid: ["лишняя формальность", "долгие объяснения"],
    starter: "Сәлеметсіз бе! Бүгін қандай тапсырма бар?"
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

function resolveScenario(body) {
  const key = normalizeText(body?.scenarioKey || "").toLowerCase();
  if (SCENARIOS[key]) return { key, ...SCENARIOS[key] };
  const title = normalizeText(body?.scenario || "").toLowerCase();
  if (title.includes("знаком")) return { key: "intro", ...SCENARIOS.intro };
  if (title.includes("кафе")) return { key: "cafe", ...SCENARIOS.cafe };
  if (title.includes("магаз")) return { key: "shop", ...SCENARIOS.shop };
  if (title.includes("такси")) return { key: "taxi", ...SCENARIOS.taxi };
  if (title.includes("универ") || title.includes("оқу") || title.includes("сабақ")) return { key: "university", ...SCENARIOS.university };
  if (title.includes("работ") || title.includes("жұмыс")) return { key: "work", ...SCENARIOS.work };
  return { key: "intro", ...SCENARIOS.intro };
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

function scenarioInstruction(scenario, level, body) {
  const phrases = Array.isArray(body?.supportPhrases) ? body.supportPhrases.slice(0, 8).map(normalizeText).filter(Boolean) : [];
  const hints = Array.isArray(body?.scenarioHints) ? body.scenarioHints.slice(0, 6).map(normalizeText).filter(Boolean) : [];
  const prompt = normalizeText(body?.scenarioPrompt || "");
  return [
    `Активный сценарий: ${scenario.title}.`,
    `Твоя роль: ${scenario.role}.`,
    `Контекст: ${scenario.setting}.`,
    `Что нужно мягко выяснять по ходу: ${scenario.ask.join(", ")}.`,
    `Чего избегать: ${scenario.avoid.join(", ")}.`,
    prompt ? `Сценарная подсказка: ${prompt}.` : "",
    phrases.length ? `Полезные фразы по теме: ${phrases.join(" | ")}.` : "",
    hints.length ? `Подсказки для ученика: ${hints.join(" | ")}.` : "",
    level === "A1" ? "Говори очень просто: 1 короткий вопрос или 1 короткая реплика за раз." : "",
    level === "A2" ? "Говори просто и бытово, можешь добавить 1 короткое уточнение." : "",
    level === "B1" ? "Говори естественно, но не перегружай длинными фразами." : ""
  ].filter(Boolean).join("\n");
}

function buildVoiceMessages(body) {
  const message = normalizeText(body?.message || "");
  const history = Array.isArray(body?.history) ? body.history.slice(-8) : [];
  const level = normalizeText(body?.meta?.level || body?.level || "A1");
  const action = normalizeText(body?.action || "message");
  const scenario = resolveScenario(body);

  const messages = [
    {
      role: "system",
      content: [
        "Ты — голосовой ИИ-репетитор платформы AnaTil для изучения казахского языка.",
        "Это короткий разговорный тренажер, а не длинный урок.",
        `Уровень ученика: ${level}.`,
        scenarioInstruction(scenario, level, body),
        "Главная реплика всегда на казахском.",
        "Отвечай как персонаж выбранного сценария, а не как учитель в общем чате.",
        "Держись только темы активного сценария.",
        "Если action=message, продолжай именно эту сцену и задавай следующий уместный вопрос по сценарию.",
        "Если action=hint, дай пример короткого ответа ученика на казахском и короткий перевод на русском.",
        "Если action=repeat, повтори свою последнюю мысль проще на казахском и дай короткий перевод.",
        "Если action=explain, очень кратко объясни на русском и дай улучшенный вариант ответа ученика на казахском.",
        "Если реплика ученика неясная или похожа на плохое распознавание речи, вежливо попроси повторить на казахском.",
        "Не уходи в другие темы и не меняй роль сценария.",
        "Верни строго один JSON-объект без markdown и без лишнего текста.",
        '{"assistantText":"...","ttsText":"...","translation":"...","correction":{"hasIssue":false,"better":"","explanation":""},"meta":{"shouldRepeat":false,"isUnclearInput":false}}'
      ].join("\n")
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
    content: `action=${action}\nСценарий=${scenario.title}\nРеплика ученика: ${message}`
  });

  return messages;
}

function fallbackByScenario(body, unclear) {
  const scenario = resolveScenario(body);
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

  const map = {
    intro: ["Танысқаныма қуаныштымын. Сіз қай қаладан келдіңіз?", "Приятно познакомиться. Из какого вы города?"],
    cafe: ["Жақсы, тағы не қалайсыз?", "Хорошо, что еще хотите?"],
    shop: ["Қандай тауар керек? Бағасын да айта аламын.", "Какой товар нужен? Я могу сказать и цену."],
    taxi: ["Жақсы, нақты мекенжайды айтыңызшы.", "Хорошо, скажите точный адрес, пожалуйста."],
    university: ["Сабақ қай уақытта басталады деп ойлайсыз?", "Как вы думаете, во сколько начинается занятие?"],
    work: ["Жақсы, бұл тапсырманы қашан аяқтайсыз?", "Хорошо, когда вы закончите эту задачу?"]
  };

  const [assistantText, translation] = map[scenario.key] || map.intro;

  return {
    assistantText,
    ttsText: assistantText,
    translation,
    correction: { hasIssue: false, better: "", explanation: "" },
    meta: { shouldRepeat: false, isUnclearInput: false }
  };
}

function sanitizeReply(raw, body) {
  try {
    const parsed = JSON.parse(raw || "{}");
    return {
      assistantText: normalizeText(parsed?.assistantText || fallbackByScenario(body, false).assistantText),
      ttsText: normalizeText(parsed?.ttsText || parsed?.assistantText || fallbackByScenario(body, false).assistantText),
      translation: normalizeText(parsed?.translation || ""),
      correction: {
        hasIssue: !!parsed?.correction?.hasIssue,
        better: normalizeText(parsed?.correction?.better || ""),
        explanation: normalizeText(parsed?.correction?.explanation || "")
      },
      meta: {
        shouldRepeat: !!parsed?.meta?.shouldRepeat,
        isUnclearInput: !!parsed?.meta?.isUnclearInput
      }
    };
  } catch {
    return fallbackByScenario(body, false);
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

    const { message, sessionId } = req.body || {};
    const cleanMessage = normalizeText(message);
    if (!cleanMessage) {
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
    if (isLikelyUnclearInput(cleanMessage)) {
      reply = fallbackByScenario(req.body, true);
    } else {
      const openai = new OpenAI({ apiKey, timeout: 25000 });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: buildVoiceMessages(req.body),
        temperature: 0.45,
        response_format: { type: "json_object" }
      });
      reply = sanitizeReply(completion.choices?.[0]?.message?.content || "{}", req.body);
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
          await db.query(
            `insert into ai_messages (session_id, role, content) values ($1,'user',$2), ($1,'assistant',$3)`,
            [sid, cleanMessage, reply.assistantText]
          );
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
      details: err?.message || String(err)
    });
  }
};
