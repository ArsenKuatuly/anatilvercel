const { requireUser } = require("../../../lib/jwt");
const db = require("../../../lib/db");
const OpenAI = require("openai");

const DAILY_LIMIT = 50;

async function getTodayUsed(userId) {
  const q = await db.query(
    `select used from ai_daily_usage where user_id = $1 and day = current_date`,
    [userId]
  );
  return Number(q.rows[0]?.used || 0);
}

function buildMessages(body) {
  const mode = String(body?.mode || "general");
  const message = String(body?.message || "").trim();
  const history = Array.isArray(body?.history) ? body.history.slice(-8) : [];

  const baseSystem = [
    "Ты — ИИ-ассистент образовательной платформы AnaTil для изучения казахского языка.",
    "Главная задача: отвечать строго по выбранному режиму и не уходить в сторону.",
    "Язык объяснений: русский. Примеры и реплики на практике: казахский.",
    "Тон: дружелюбный, спокойный, профессиональный.",
    "Не используй смайлики.",
    "Не выдумывай правила. Если не уверен, выбирай простое и безопасное объяснение.",
  ].join("\n");

  if (mode === "sentence_check") {
    const lesson = body?.lessonTitle ? `Текущий урок: ${body.lessonTitle}.` : "";
    const course = body?.lessonCourseTitle ? `Курс: ${body.lessonCourseTitle}.` : "";
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
          "errors: массив коротких ошибок и объяснений на русском. Если ошибок нет, верни [\"Серьёзных ошибок нет\"].",
          "rule: одно понятное правило на русском.",
          "examples: 3 коротких примера на казахском с переводом в одной строке через тире.",
          "task: одно короткое задание по этой же теме.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [lesson, course, extra, `Предложение ученика: ${message}`].filter(Boolean).join("\n"),
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
          "Отвечай как собеседник в выбранной ситуации.",
          "Основная реплика должна быть на казахском и короткой: 1–3 предложения.",
          "После основной реплики можно дать 1 короткий блок на русском ТОЛЬКО если нужно исправить ошибку или объяснить ответ.",
          "Если action=hint: дай короткий пример возможного ответа ученика на казахском и 1 краткое объяснение на русском.",
          "Если action=repeat: повтори вопрос проще на казахском и добавь русский перевод одной строкой.",
          "Если action=explain: объясни на русском, как ответить естественнее, и дай улучшенный вариант ответа на казахском.",
          "Если action=message: продолжай сценку. Если в реплике ученика есть ошибка, мягко поправь её одной короткой строкой после ответа.",
          "Не превращай ответ в длинный урок. Это именно живой диалог.",
        ].filter(Boolean).join("\n"),
      },
    ];

    history.forEach((item) => {
      if (!item || !item.role || !item.text) return;
      messages.push({ role: item.role === "assistant" ? "assistant" : "user", content: String(item.text) });
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

    return [
      {
        role: "system",
        content: [
          baseSystem,
          "Режим: репетитор по уроку.",
          `Текущий урок: ${lesson}.`,
          `Курс: ${course}.`,
          `Прогресс по теме: ${progress}%.`,
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
          "exampleTranslation — короткий перевод на русском.",
          "В test.word используй одно из слов из списка, а options сделай из 3 вариантов, где первый — правильный перевод.",
        ].join("\n"),
      },
      {
        role: "user",
        content: `Тема словаря: ${topic}`,
      },
    ];
  }

  return [
    { role: "system", content: baseSystem },
    { role: "user", content: message },
  ];
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
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const used0 = await getTodayUsed(user.id);
    if (used0 >= DAILY_LIMIT) {
      return res.status(429).json({
        error: "Daily limit reached",
        details: "AI лимит на сегодня исчерпан",
        usage: { used: used0, limit: DAILY_LIMIT, remaining: 0 },
      });
    }

    const openai = new OpenAI({ apiKey, timeout: 20000 });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: buildMessages(req.body),
      temperature: 0.35,
      response_format: req.body?.mode === "sentence_check" || req.body?.mode === "vocabulary"
        ? { type: "json_object" }
        : undefined,
    });

    const reply = completion.choices?.[0]?.message?.content || "";

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
            [sid, message, reply]
          );
        }
      }
    }

    const used = await getTodayUsed(user.id);
    return res.json({
      reply,
      usage: { used, limit: DAILY_LIMIT, remaining: Math.max(DAILY_LIMIT - used, 0) },
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
