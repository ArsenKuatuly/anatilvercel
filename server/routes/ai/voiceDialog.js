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

function buildVoiceMessages(body) {
  const message = String(body?.message || "").trim();
  const history = Array.isArray(body?.history) ? body.history.slice(-6) : [];
  const scenario = String(body?.scenario || "Обычный разговор");
  const level = String(body?.level || body?.meta?.level || "A1");
  const action = String(body?.action || "message");

  const messages = [
    {
      role: "system",
      content: [
        "Ты — голосовой ИИ-репетитор платформы AnaTil для изучения казахского языка.",
        "Это именно голосовой диалог, а не текстовый разбор.",
        "Отвечай коротко, естественно и по ситуации.",
        "Основная реплика всегда на казахском.",
        "Для уровня A1 используй очень простые фразы.",
        "Для A2 — простые бытовые фразы.",
        "Для B1 — чуть естественнее, но без перегруза.",
        `Сценарий: ${scenario}.`,
        `Уровень: ${level}.`,
        "Если речь пользователя неясная, странная или похожа на ошибку распознавания, не пытайся угадывать смысл слишком далеко.",
        "В таком случае вежливо попроси повторить на казахском.",
        "Верни строго JSON без markdown.",
        "Формат:",
        '{"assistantText":"...","correction":{"hasIssue":false,"better":"","explanation":"","translation":""},"meta":{"shouldRepeat":false,"isUnclearInput":false}}',
        "assistantText: короткий ответ собеседника на казахском.",
        "correction.hasIssue: true только если ошибка пользователя понятна и действительно можно мягко исправить.",
        "correction.better: улучшенный вариант фразы пользователя на казахском.",
        "correction.explanation: короткое объяснение на русском.",
        "correction.translation: русский перевод улучшенного варианта, если уместно, иначе пустая строка.",
        "meta.shouldRepeat: true если нужно попросить повторить.",
        "meta.isUnclearInput: true если фраза похожа на плохое распознавание речи.",
        "Не добавляй никаких других полей."
      ].join("\n")
    }
  ];

  history.forEach((item) => {
    if (!item || !item.role || !item.text) return;
    messages.push({
      role: item.role === "assistant" ? "assistant" : "user",
      content: String(item.text)
    });
  });

  messages.push({
    role: "user",
    content: `action=${action}\nФраза пользователя: ${message}`
  });

  return messages;
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
    if (!message || !String(message).trim()) {
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

    const openai = new OpenAI({ apiKey, timeout: 20000 });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: buildVoiceMessages(req.body),
      temperature: 0.4,
      response_format: { type: "json_object" }
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        assistantText: "Кешіріңіз, қайталап айта аласыз ба?",
        correction: {
          hasIssue: false,
          better: "",
          explanation: "Не удалось корректно разобрать ответ модели.",
          translation: ""
        },
        meta: {
          shouldRepeat: true,
          isUnclearInput: true
        }
      };
    }

    const safe = {
      assistantText: String(parsed?.assistantText || "Кешіріңіз, қайталап айта аласыз ба?"),
      correction: {
        hasIssue: !!parsed?.correction?.hasIssue,
        better: String(parsed?.correction?.better || ""),
        explanation: String(parsed?.correction?.explanation || ""),
        translation: String(parsed?.correction?.translation || "")
      },
      meta: {
        shouldRepeat: !!parsed?.meta?.shouldRepeat,
        isUnclearInput: !!parsed?.meta?.isUnclearInput
      }
    };

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
            [sid, message, safe.assistantText]
          );
        }
      }
    }

    const used = await getTodayUsed(user.id);

    return res.json({
      success: true,
      assistantText: safe.assistantText,
      correction: safe.correction,
      meta: safe.meta,
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
