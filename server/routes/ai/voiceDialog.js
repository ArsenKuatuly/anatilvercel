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

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .trim();
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

function buildVoiceMessages(body) {
  const message = normalizeText(body?.message || "");
  const history = Array.isArray(body?.history) ? body.history.slice(-8) : [];
  const scenario = normalizeText(body?.scenario || "Обычный разговор");
  const goal = normalizeText(body?.scenarioGoal || "Поддержать короткий диалог");
  const level = normalizeText(body?.level || body?.meta?.level || "A1");
  const action = normalizeText(body?.action || "message");
  const phrases = Array.isArray(body?.supportPhrases) ? body.supportPhrases.slice(0, 8).map(normalizeText).filter(Boolean) : [];

  const messages = [
    {
      role: "system",
      content: [
        "Ты — голосовой ИИ-репетитор платформы AnaTil для изучения казахского языка.",
        "Это именно короткий разговорный voice-диалог, а не длинный урок.",
        `Сценарий: ${scenario}.`,
        `Цель: ${goal}.`,
        `Уровень ученика: ${level}.`,
        phrases.length ? `Полезные фразы по теме: ${phrases.join(" | ")}.` : "",
        "Главная реплика всегда должна быть на казахском.",
        "Говори естественно, просто и коротко: 1–2 предложения.",
        "Для A1 используй очень простые слова и короткие вопросы.",
        "Для A2 — бытовой разговор без сложных конструкций.",
        "Для B1 — естественная речь, но без перегруза.",
        "Если речь ученика неясная, странная или похожа на ошибку распознавания, не пытайся глубоко угадывать смысл.",
        "В таком случае вежливо попроси повторить по-казахски короткой фразой.",
        "Если action=hint, дай пример краткого ответа ученика на казахском и короткий перевод на русском.",
        "Если action=repeat, повтори вопрос проще на казахском и дай короткий перевод на русском.",
        "Если action=explain, очень кратко объясни на русском и дай улучшенный вариант ответа на казахском.",
        "Верни строго один JSON-объект без markdown и без лишнего текста.",
        'Формат: {"assistantText":"...","ttsText":"...","translation":"...","correction":{"hasIssue":false,"better":"","explanation":""},"meta":{"shouldRepeat":false,"isUnclearInput":false}}',
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
  const scenario = normalizeText(body?.scenario || "Знакомство");
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

  if (scenario === "Кафе") {
    return {
      assistantText: "Жақсы, тағы не қалайсыз?",
      ttsText: "Жақсы, тағы не қалайсыз?",
      translation: "Хорошо, что еще хотите?",
      correction: { hasIssue: false, better: "", explanation: "" },
      meta: { shouldRepeat: false, isUnclearInput: false }
    };
  }

  return {
    assistantText: "Жақсы. Тағы бір сөйлем айтыңызшы.",
    ttsText: "Жақсы. Тағы бір сөйлем айтыңызшы.",
    translation: "Хорошо. Скажите еще одно предложение.",
    correction: { hasIssue: false, better: "", explanation: "" },
    meta: { shouldRepeat: false, isUnclearInput: false }
  };
}

function sanitizeReply(raw, message, body) {
  try {
    const parsed = JSON.parse(raw || "{}");
    return {
      assistantText: normalizeText(parsed?.assistantText || "Кешіріңіз, қайталап айта аласыз ба?"),
      ttsText: normalizeText(parsed?.ttsText || parsed?.assistantText || "Кешіріңіз, қайталап айта аласыз ба?"),
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
