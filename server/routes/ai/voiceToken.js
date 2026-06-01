const { requireUser } = require("../../../lib/jwt");
const db = require("../../../lib/db");

const DAILY_LIMIT = 50;

async function getTodayUsed(userId) {
  const q = await db.query(
    `select used from ai_daily_usage where user_id = $1 and day = current_date`,
    [userId]
  );
  return Number(q.rows[0]?.used || 0);
}

function createInstructions(body, user) {
  const scenario = String(body?.scenario || "Знакомство");
  const level = String(body?.level || "A1");
  const lessonMode = body?.lessonMode ? String(body.lessonMode) : "";
  const showTranslation = Boolean(body?.options?.showTranslation);
  const gentleCorrection = body?.options?.gentleCorrection !== false;
  const hints = body?.options?.hints !== false;
  const slowSpeech = Boolean(body?.options?.slowSpeech);
  const lessonTitle = body?.lessonTitle ? String(body.lessonTitle) : "";
  const lessonCourseTitle = body?.lessonCourseTitle ? String(body.lessonCourseTitle) : "";

  return [
    "Ты — голосовой AI-репетитор платформы AnaTil для изучения казахского языка.",
    "Главная цель: помочь русскоязычному пользователю уверенно говорить по-казахски без страха ошибок.",
    `Сценарий разговора: ${scenario}.`,
    `Уровень ученика: ${level}.`,
    lessonMode ? `Особый режим: разговор по уроку. Тема урока: ${lessonMode}.` : "",
    lessonTitle ? `Текущий урок: ${lessonTitle}.` : "",
    lessonCourseTitle ? `Курс: ${lessonCourseTitle}.` : "",
    `Имя пользователя: ${user?.name || user?.email || 'ученик'}.`,
    "Отвечай в основном на казахском языке.",
    "Если пользователь явно запутался, можно кратко помочь на русском.",
    gentleCorrection
      ? "Если ученик ошибся, мягко исправь 1 короткой фразой и сразу продолжай диалог. Не превращай ответ в длинный урок."
      : "Не акцентируй внимание на ошибках, если они не мешают пониманию.",
    showTranslation
      ? "Иногда после ключевой фразы можно дать очень короткий перевод на русский одной строкой, но не после каждой реплики."
      : "Не добавляй перевод без явной необходимости.",
    hints
      ? "Если пользователь молчит или просит помощи, предложи короткий пример ответа или следующий шаг."
      : "Не подсказывай, если пользователь сам не просит помощи.",
    slowSpeech
      ? "Говори очень просто, короткими фразами, в медленном и понятном стиле для новичка."
      : "Сохраняй естественный, но понятный темп речи.",
    "Держи ответы короткими: обычно 1-3 предложения.",
    "Веди живую сценку, задавай уместные встречные вопросы.",
    "Не используй смайлики.",
    "Если пользователь говорит по-русски, мягко переведи его к казахскому и предложи простой вариант ответа на казахском.",
    "Начни разговор первым: коротко поздоровайся и задай уместный первый вопрос по выбранному сценарию."
  ].filter(Boolean).join("\n");
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

    const used = await getTodayUsed(user.id);
    if (used >= DAILY_LIMIT) {
      return res.status(429).json({
        error: "Daily limit reached",
        details: "AI лимит на сегодня исчерпан",
        usage: { used, limit: DAILY_LIMIT, remaining: 0 },
      });
    }

    const voice = String(req.body?.voice || "marin");
    const sessionPayload = {
      session: {
        type: "realtime",
        model: "gpt-realtime",
        modalities: ["audio", "text"],
        voice,
        instructions: createInstructions(req.body || {}, user),
        input_audio_transcription: { model: "whisper-1" },
        audio: {
          input: {
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 700,
            },
          },
        },
        temperature: 0.6,
        max_response_output_tokens: 220,
      },
    };

    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionPayload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Failed to create realtime session",
        details: "Не удалось создать голосовую сессию",
      });
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

    const usage = await getTodayUsed(user.id);

    return res.json({
      ok: true,
      client_secret: data?.client_secret || null,
      value: data?.client_secret?.value || data?.value || null,
      expires_at: data?.client_secret?.expires_at || data?.expires_at || null,
      session: {
        id: data?.id || null,
        model: data?.model || "gpt-realtime",
        voice,
      },
      usage: { used: usage, limit: DAILY_LIMIT, remaining: Math.max(DAILY_LIMIT - usage, 0) },
    });
  } catch (error) {
    console.error("[ai/voice/token] error:", error?.message || error);
    return res.status(500).json({
      error: "Voice token error",
      details: "Внутренняя ошибка голосового сервиса",
    });
  }
};
