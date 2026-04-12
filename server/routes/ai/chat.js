const { requireUser } = require("../../../lib/jwt");
const db = require("../../../lib/db");
const OpenAI = require("openai");

const DAILY_LIMIT = 50;
const PUBLIC_MAX_CHARS = 1500;

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

function detectReplyLanguage(text, preferredLanguage) {
  const preferred = String(preferredLanguage || "").toLowerCase();
  if (preferred === "kz" || preferred === "kk") return "kz";
  if (preferred === "ru") return "ru";

  const value = normalizeText(text);
  const hasKazakhLetters = /[әіңғүұқөһӘІҢҒҮҰҚӨҺ]/.test(value);
  if (hasKazakhLetters) return "kz";

  const kazakhWords = [
    "сәлем", "рахмет", "қалай", "қазақ", "тілі", "үйрен", "үйрену", "сөйлеу",
    "бола", "керек", "маған", "сіз", "біз", "мен", "қайда", "неге", "қашан"
  ];
  const normalized = value.toLowerCase();
  if (kazakhWords.some((word) => normalized.includes(word))) return "kz";

  return "ru";
}

function makeBaseSystem({ replyLanguage = "ru", scope = "protected" } = {}) {
  const isKazakh = replyLanguage === "kz";
  const languageRule = isKazakh
    ? "Пользователь пишет на казахском. Отвечай на казахском языке. Если нужно объяснить термин, можешь коротко уточнить его простыми словами."
    : "По умолчанию отвечай на русском языке. Если в ответе нужен пример на казахском, сначала дай краткое объяснение на русском, потом пример.";

  const scopeRule = scope === "public_index"
    ? "Ты работаешь в публичном чате главной страницы. Здесь нельзя уходить в полноценное обучение, глубокую проверку текстов и длинные упражнения."
    : "Ты работаешь во внутреннем чате после регистрации. Здесь можно помогать по обучению, грамматике, лексике, переводу и навигации по платформе.";

  return [
    "Ты - AI помощник платформы AnaTil для изучения казахского языка.",
    scopeRule,
    languageRule,
    "Не используй удлиненный дефис.",
    "Не используй смайлики.",
    "Пиши естественно, дружелюбно и понятно.",
    "Не выдумывай функции платформы и не обещай то, чего точно нет.",
  ].join("\n");
}

function extractJsonObject(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch {}
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
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

function buildScenarioFallbackReply(body, message) {
  const scenario = normalizeText(body?.scenario || "").toLowerCase();
  const topic = extractTopicFragment(message);
  const normalizedMessage = normalizeText(message).toLowerCase();

  if (scenario.includes("каф")) {
    if (/осымен болды|болды|жетеді/.test(normalizedMessage)) {
      return "Жақсы, түсіндім. Тағы ештеңе керек емес пе?";
    }
    if (/бағасы|қанша/.test(normalizedMessage)) {
      return "Бағасы үш жүз теңге. Тағы бірдеңе аласыз ба?";
    }
    if (/сәлем/.test(normalizedMessage) && /кофе|латте|шай|капучино/.test(normalizedMessage)) {
      return "Сәлеметсіз бе! Жақсы, бір кофе. Тағы не аласыз?";
    }
    if (topic) return `Жақсы, бір ${topic}. Тағы не аласыз?`;
    return "Жақсы, не қалайтыныңызды айтыңызшы.";
  }

  if (scenario.includes("магаз")) {
    if (/қанша|бағасы/.test(normalizedMessage)) return "Бағасы осы жерде жазылған. Тағы қандай тауар керек?";
    return "Жақсы, қай тауар керек екенін айтыңызшы.";
  }
  if (scenario.includes("такси")) return "Жақсы, нақты мекенжайды айтыңызшы.";
  if (scenario.includes("универс")) return "Жақсы, қандай сұрағыңыз бар?";
  if (scenario.includes("знаком") || scenario.includes("кездес") || scenario.includes("meeting")) return "Сәлем! Өзіңіз туралы қысқаша айтып беріңізші.";
  return "Жақсы, нақтырақ айтып көріңізші.";
}

function looksLikeBrokenDialogReply(userMessage, assistantText) {
  const user = normalizeText(userMessage).toLowerCase();
  const assistant = normalizeText(assistantText).toLowerCase();
  if (!assistant) return true;
  if (assistant.startsWith("{") || assistant.includes('"correction"')) return true;
  if (/^жақсы,\s*жалғастырайық\.?$/.test(assistant)) return true;
  if (/^жалғастырайық\.?$/.test(assistant)) return true;
  if (/^жақсы\.?$/.test(assistant)) return true;
  if (/сценарий:/.test(assistant)) return true;
  if (!user) return false;
  if (assistant === user) return true;
  if (assistant.startsWith(user + ",") || assistant.startsWith(user + ".") || assistant.startsWith(user + " ")) return true;
  const userWords = user.split(/\s+/).filter(Boolean);
  if (userWords.length >= 2) {
    const overlap = userWords.slice(0, Math.min(userWords.length, 4)).join(" ");
    if (assistant.startsWith(overlap)) return true;
  }
  return false;
}

function sanitizeDialogPayload(raw, body, message) {
  const parsed = extractJsonObject(raw) || {};
  let reply = normalizeText(parsed?.reply || "");
  const correction = {
    hasIssue: !!parsed?.correction?.hasIssue,
    better: normalizeText(parsed?.correction?.better || ""),
    explanation: normalizeText(parsed?.correction?.explanation || "")
  };

  if (looksLikeBrokenDialogReply(message, reply)) {
    reply = buildScenarioFallbackReply(body, message);
  }

  return {
    reply: reply || buildScenarioFallbackReply(body, message),
    correction
  };
}

function buildPublicIndexMessages(body) {
  const message = normalizeText(body?.message).slice(0, PUBLIC_MAX_CHARS);
  const replyLanguage = detectReplyLanguage(message, body?.preferredLanguage);

  return [
    {
      role: "system",
      content: [
        makeBaseSystem({ replyLanguage, scope: "public_index" }),
        "Роль: помощник на главной странице AnaTil.",
        "Объясняй, что платформа помогает русскоязычным пользователям изучать казахский язык через уроки, упражнения, тесты и AI практику.",
        "Объясняй, чему пользователь сможет научиться: грамматика, лексика, полезные фразы, понимание речи и более уверенное общение.",
        "Помогай понять, с чего начать: зарегистрироваться, войти, пройти тест на уровень или начать обучение.",
        "Если пользователь спрашивает, что есть на сайте, рассказывай про курсы, уроки, AI практику, профиль и прогресс, но только как про доступные разделы платформы без лишних деталей.",
        "Если вопрос требует полноценной проверки фраз, глубокого разбора грамматики, длительной практики или диалога, мягко скажи, что после регистрации бот сможет помочь подробнее.",
        "Если пользователь задает общий вопрос по знаниям о казахском языке, можешь кратко ответить, но не превращай ответ в полноценный урок на много абзацев.",
        "Обычно отвечай в 2-5 предложениях.",
        "Если человек спрашивает, куда нажать или что делать дальше, давай конкретный следующий шаг.",
      ].join("\n"),
    },
    {
      role: "user",
      content: message,
    },
  ];
}

function buildProtectedGeneralMessages(body) {
  const message = normalizeText(body?.message);
  const replyLanguage = detectReplyLanguage(message, body?.preferredLanguage);
  const history = Array.isArray(body?.history) ? body.history.slice(-8) : [];

  const messages = [
    {
      role: "system",
      content: [
        makeBaseSystem({ replyLanguage, scope: "protected" }),
        "Роль: основной AI помощник пользователя внутри платформы AnaTil.",
        "Помогай по грамматике, лексике, переводу, построению фраз, кратким объяснениям и учебной навигации.",
        "Если пользователь просит проверить фразу, сначала дай исправленный вариант, затем коротко объясни ошибку и при необходимости дай 1 пример.",
        "Если пользователь просит объяснить тему, сначала дай прямой ответ, потом короткое объяснение и пример, если он нужен.",
        "Если пользователь спрашивает, что делать на платформе дальше, подскажи подходящий следующий шаг: урок, тест, AI практика, профиль или прогресс.",
        "По умолчанию не делай ответы слишком длинными. Обычно 2-6 предложений, если пользователь не просит подробнее.",
      ].join("\n"),
    },
  ];

  history.forEach((item) => {
    if (!item || !item.role || !item.text) return;
    messages.push({
      role: item.role === "assistant" ? "assistant" : "user",
      content: String(item.text),
    });
  });

  messages.push({ role: "user", content: message });
  return messages;
}

function buildMessages(body) {
  const mode = String(body?.mode || "general");
  const message = normalizeText(body?.message);
  const history = Array.isArray(body?.history) ? body.history.slice(-8) : [];
  const scope = String(body?.scope || "").toLowerCase();

  if (scope === "public_index") {
    return buildPublicIndexMessages(body);
  }

  const replyLanguage = detectReplyLanguage(message, body?.preferredLanguage);
  const baseSystem = makeBaseSystem({ replyLanguage, scope: "protected" });

  if (mode === "sentence_check") {
    const lesson = body?.lessonTitle ? `Текущий урок: ${body.lessonTitle}.` : "";
    const course = body?.lessonCourseTitle ? `Курс: ${body.lessonCourseTitle}.` : "";
    const lessonContent = body?.lessonContent ? `Краткий материал урока: ${String(body.lessonContent).slice(0, 2500)}.` : "";
    const extra = body?.extraInstruction ? `Доп. инструкция: ${body.extraInstruction}.` : "";
    return [
      {
        role: "system",
        content: [
          baseSystem,
          "Режим: проверка предложения.",
          "Проверь казахское предложение ученика.",
          "Ответь СТРОГО одним JSON-объектом без markdown и без пояснений вокруг.",
          "Формат JSON:",
          '{"corrected":"...","errors":["..."],"rule":"...","examples":["...","...","..."],"task":"..."}',
          "corrected: исправленный вариант предложения на казахском.",
          'errors: массив коротких ошибок и объяснений на русском. Если ошибок нет, верни ["Серьёзных ошибок нет"].',
          "rule: одно понятное правило на русском.",
          "examples: 3 коротких примера на казахском с переводом в одной строке через обычный дефис.",
          "task: одно короткое задание по этой же теме.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [lesson, course, lessonContent, extra, `Предложение ученика: ${message}`].filter(Boolean).join("\n"),
      },
    ];
  }

  if (mode === "dialog") {
    const scenario = body?.scenario || "Обычный разговор";
    const goal = body?.scenarioGoal || "Поддержать короткий диалог";
    const difficulty = body?.scenarioDifficulty || "Лёгкий";
    const action = body?.action || "message";
    const support = Array.isArray(body?.supportPhrases) ? body.supportPhrases.join(" | ") : "";

    const messages = [
      {
        role: "system",
        content: [
          baseSystem,
          "Режим: диалоговый тренажёр.",
          `Сценарий: ${scenario}.`,
          `Цель ученика: ${goal}.`,
          `Сложность: ${difficulty}.`,
          support ? `Полезные фразы: ${support}.` : "",
          "Ты должен отвечать как реальный собеседник в этой ситуации.",
          "Не пиши 'Сценарий:', 'Исправление:' и другие служебные слова в обычной реплике.",
          "Главная реплика должна быть естественной, короткой и живой, как в настоящем разговоре.",
          "Самое важное: reply - это ВСЕГДА только следующий ход собеседника по сценарию, а не повтор и не исправленный вариант фразы ученика.",
          "Даже если ученик ошибся, ты сначала мысленно понимаешь его намерение, а в reply продолжаешь диалог дальше по ситуации. Не отвечай JSON-строкой внутри reply.",
          "Никогда не копируй correction.better в поле reply. Никогда не показывай пользователю сырой JSON в обычной реплике.",
          "Никогда не отвечай одной лишь переформулированной фразой ученика.",
          "Если ученик сказал 'Маған латте', нормальный reply официанта может быть вроде 'Жақсы, бір латте. Тағы не аласыз?'",
          "Для сценария кафе веди себя именно как официант: приветствие, принятие заказа, короткое уточнение, завершение заказа. Не отвечай пустыми фразами вроде 'Жақсы, жалғастырайық'.",
          "Если ученик пишет неполно или с ошибками, всё равно пойми намерение и ответь по ситуации. Например: 'Сәлеметсіз бе, кофе' -> 'Сәлеметсіз бе! Жақсы, бір кофе. Тағы не аласыз?'",
          "Если action=message, ответь СТРОГО одним JSON-объектом без markdown.",
          "Формат JSON для action=message:",
          '{"reply":"...","correction":{"hasIssue":true,"better":"...","explanation":"..."}}',
          "reply: только следующая естественная реплика собеседника на казахском, 1-2 короткие реплики. Не пиши текст от лица ученика.",
          "correction.hasIssue: true если у ученика есть заметная ошибка, иначе false.",
          "correction.better: более естественный или исправленный вариант фразы ученика на казахском. Если ошибок нет, верни пустую строку.",
          "correction.explanation: очень короткое объяснение на русском. Если ошибок нет, верни пустую строку.",
          "Если action=hint, ответь СТРОГО JSON-объектом:",
          '{"reply":"...","correction":{"hasIssue":false,"better":"","explanation":""}}',
          "В reply дай короткий пример того, как ученик может ответить по-казахски.",
          "Если action=repeat, ответь СТРОГО JSON-объектом:",
          '{"reply":"...","correction":{"hasIssue":false,"better":"","explanation":""}}',
          "В reply повтори последний вопрос проще на казахском.",
          "Если action=explain, ответь СТРОГО JSON-объектом:",
          '{"reply":"...","correction":{"hasIssue":false,"better":"...","explanation":"..."}}',
          "В reply дай очень короткий совет на русском.",
          "В better дай более естественный вариант ответа ученика на казахском.",
          "В explanation дай короткое объяснение на русском.",
          "Не превращай ответ в длинный урок.",
          "Не дублируй исправление внутри reply.",
        ].filter(Boolean).join("\n"),
      },
    ];

    history.forEach((item) => {
      if (!item || !item.role || !item.text) return;
      messages.push({
        role: item.role === "assistant" ? "assistant" : "user",
        content: String(item.text),
      });
    });

    messages.push({
      role: "user",
      content: `action=${action}\nПоследняя реплика/запрос ученика: ${message}`,
    });

    return messages;
  }

  if (mode === "lesson_tutor") {
    const lesson = body?.lessonTitle || "не указан";
    const course = body?.lessonCourseTitle || "не указан";
    const progress = Number(body?.lessonProgress || 0);
    const action = body?.action || "default";
    const lessonContent = body?.lessonContent ? String(body.lessonContent).slice(0, 5000) : "";

    return [
      {
        role: "system",
        content: [
          baseSystem,
          "Режим: репетитор по уроку.",
          `Текущий урок: ${lesson}.`,
          `Курс: ${course}.`,
          `Прогресс по теме: ${progress}%.`,
          lessonContent ? `Материал урока: ${lessonContent}.` : "",
          "Отвечай строго по теме текущего урока или максимально близко к ней.",
          "Структура ответа всегда такая:",
          "1. Короткое объяснение темы простыми словами.",
          "2. 2 примера на казахском с коротким переводом.",
          "3. Частая ошибка или подсказка.",
          "4. Мини-практика: 1 маленькое задание.",
          "Если вопрос ученика слишком общий, всё равно привяжи ответ к текущему уроку.",
          "Если action=exercise, сделай упор на задание.",
          "Если action=check, задай маленькую проверку понимания.",
          "Если action=simpler, объясни ещё проще.",
          "Если action=examples, дай больше примеров.",
        ].join("\n"),
      },
      {
        role: "user",
        content: `Запрос ученика: ${message}`,
      },
    ];
  }

  if (mode === "vocabulary") {
    const topic = body?.topic || body?.meta?.theme || "общая тема";
    const count = Math.max(3, Math.min(12, Number(body?.count || body?.meta?.count || 6)));
    return [
      {
        role: "system",
        content: [
          baseSystem,
          "Режим: словарь.",
          "Ответь СТРОГО одним JSON-объектом без markdown.",
          "Формат JSON:",
          '{"words":[{"word":"...","translation":"...","example":"...","exampleTranslation":"...","category":"...","saved":false}],"test":{"word":"...","options":["..."]}}',
          `Сгенерируй ${count} полезных слов по теме.`,
          "example должен быть коротким предложением на казахском.",
          "exampleTranslation - короткий перевод на русском.",
          "В test.word используй одно из слов из списка, а options сделай из 3 вариантов, где первый - правильный перевод.",
        ].join("\n"),
      },
      {
        role: "user",
        content: `Тема словаря: ${topic}`,
      },
    ];
  }

  return buildProtectedGeneralMessages(body);
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY missing" });
    }

    const { message, sessionId } = req.body || {};
    const scope = String(req.body?.scope || "").toLowerCase();
    const isPublicIndex = scope === "public_index";

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    let user = null;
    if (!isPublicIndex) {
      try {
        user = requireUser(req);
      } catch {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const used0 = await getTodayUsed(user.id);
      if (used0 >= DAILY_LIMIT) {
        return res.status(429).json({
          error: "Daily limit reached",
          details: "AI лимит на сегодня исчерпан",
          usage: { used: used0, limit: DAILY_LIMIT, remaining: 0 },
        });
      }
    }

    const openai = new OpenAI({ apiKey, timeout: 20000 });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: buildMessages(req.body),
      temperature: isPublicIndex ? 0.35 : 0.25,
      response_format:
        req.body?.mode === "sentence_check" ||
        req.body?.mode === "vocabulary" ||
        req.body?.mode === "dialog"
          ? { type: "json_object" }
          : undefined,
    });

    const rawReply = completion.choices?.[0]?.message?.content || "";
    const dialogPayload = req.body?.mode === "dialog" ? sanitizeDialogPayload(rawReply, req.body, message) : null;
    const reply = dialogPayload ? dialogPayload.reply : rawReply;

    let session = null;
    if (!isPublicIndex && user) {
      await db.query(
        `
        insert into ai_daily_usage (user_id, day, used)
        values ($1, current_date, 1)
        on conflict (user_id, day)
        do update set used = ai_daily_usage.used + 1
        `,
        [user.id]
      );

      if (sessionId) {
        const sid = Number(sessionId);
        if (Number.isFinite(sid) && sid > 0) {
          const s = await db.query(
            `select id, title, mode from ai_sessions where id = $1 and user_id = $2 limit 1`,
            [sid, user.id]
          );
          if (s.rows[0]) {
            session = s.rows[0];
            await db.query(
              `insert into ai_messages (session_id, role, content) values ($1,'user',$2), ($1,'assistant',$3)`,
              [sid, message, reply]
            );
          }
        }
      }
    }

    const used = user ? await getTodayUsed(user.id) : 0;
    return res.json({
      reply,
      correction: dialogPayload ? dialogPayload.correction : undefined,
      usage: user
        ? { used, limit: DAILY_LIMIT, remaining: Math.max(DAILY_LIMIT - used, 0) }
        : null,
      session,
    });
  } catch (err) {
    console.error("[ai/chat] error:", err?.message || err);
    return res.status(500).json({
      error: "AI error",
      details: err?.message || String(err),
    });
  }
};
