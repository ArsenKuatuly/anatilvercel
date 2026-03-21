const { requireUser } = require("../../../lib/jwt");
const OpenAI = require("openai");

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(10, Math.round(n)));
}

function fallbackScore(text) {
  const clean = String(text || "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const hasKazakh = /[әіңғүұқөһі]/i.test(clean);
  const sentences = clean.split(/[.!?\n]+/).map((s) => s.trim()).filter(Boolean).length;

  let score = 1;
  if (wordCount >= 5) score = 2;
  if (wordCount >= 10) score = 4;
  if (wordCount >= 18) score = 5;
  if (wordCount >= 28) score = 6;
  if (wordCount >= 40) score = 7;
  if (hasKazakh) score += 1;
  if (sentences >= 3) score += 1;

  return Math.max(1, Math.min(10, score));
}

function fallbackLevel(totalScore) {
  if (totalScore <= 6) return "elementary";
  if (totalScore <= 12) return "basic";
  if (totalScore <= 18) return "intermediate";
  if (totalScore <= 24) return "upper";
  return "advanced";
}

function fallbackFeedback(score) {
  if (score >= 8) {
    return "Текст понятный и достаточно связный. Есть хороший запас слов и базовый контроль над конструкциями.";
  }
  if (score >= 5) {
    return "Основная мысль понятна, но заметны ошибки в формах слов, порядке слов или словарном запасе. Для уровня старта этого достаточно.";
  }
  return "Пока видно начальный уровень: текст короткий или очень простой. Это нормально — платформа подберёт стартовый уровень и поможет постепенно улучшить письмо.";
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    try {
      requireUser(req);
    } catch {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const text = String(req.body?.text || "").trim();
    const totalScoreWithoutWriting = Number(req.body?.totalScoreWithoutWriting || 0);

    if (text.length < 20) {
      return res.status(400).json({
        success: false,
        message: "Текст слишком короткий для оценки. Попросите пользователя написать хотя бы 20 символов.",
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const score = fallbackScore(text);
      const predictedLevel = fallbackLevel(totalScoreWithoutWriting + score);
      return res.status(200).json({
        success: true,
        score,
        feedback: fallbackFeedback(score),
        predictedLevel,
        fallback: true,
      });
    }

    const openai = new OpenAI({ apiKey, timeout: 20000 });

    const systemPrompt = `Ты — проверяющий письменной части теста казахского языка для платформы AnaTil.

Пользователь пишет короткий текст о себе на казахском языке.
Нужно оценить только этот текст по шкале от 0 до 10.

Оценивай по критериям:
1. Насколько текст действительно написан на казахском
2. Понимание базовых грамматических конструкций
3. Связность и логичность
4. Словарный запас
5. Количество и серьёзность ошибок

Важно:
- Не завышай оценку
- Если есть сомнение между двумя баллами, выбирай меньший
- Очень короткий, почти пустой или написанный не на казахском текст должен получать низкий балл
- Не исправляй текст полностью
- Дай короткий комментарий на русском языке, 1-3 предложения

Верни только JSON:
{
  "score": 0,
  "feedback": "краткий комментарий на русском языке"
}`;

    const userPrompt = `Оцени этот текст пользователя по шкале от 0 до 10:\n\n${text}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || "{}";
    const parsed = safeJsonParse(content) || {};

    const score = clampScore(parsed.score) ?? fallbackScore(text);
    const feedback = typeof parsed.feedback === "string" && parsed.feedback.trim()
      ? parsed.feedback.trim()
      : fallbackFeedback(score);
    const predictedLevel = fallbackLevel(totalScoreWithoutWriting + score);

    return res.status(200).json({
      success: true,
      score,
      feedback,
      predictedLevel,
    });
  } catch (err) {
    console.error("test writing score error:", err);

    const text = String(req.body?.text || "").trim();
    const totalScoreWithoutWriting = Number(req.body?.totalScoreWithoutWriting || 0);
    const score = fallbackScore(text);
    const predictedLevel = fallbackLevel(totalScoreWithoutWriting + score);

    return res.status(200).json({
      success: true,
      score,
      feedback: fallbackFeedback(score),
      predictedLevel,
      fallback: true,
    });
  }
};
