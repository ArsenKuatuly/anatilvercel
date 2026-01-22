const OpenAI = require("openai");
const { setCors } = require("../../lib/cors");
const { readJson } = require("../../lib/body");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const AI_SYSTEM_PROMPT = `
Ты — ИИ-ассистент образовательной платформы AnaTil.

Правила:
- Язык ответов: русский
- Стиль: дружелюбный, спокойный, профессиональный
- Отвечай кратко, по шагам
- Если вопрос про урок — объясни тему и приведи пример
- Если пользователь просит ответ на тест или задание — НЕ давай готовый ответ,
  а помоги понять, как его решить
- Если вопрос непонятен — задай уточняющий вопрос
- Не используй смайлики
- Не выдумывай факты, которых нет
`;

module.exports = async (req, res) => {
  if (setCors(req, res)) return;

  try {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.end(JSON.stringify({ error: "Method not allowed" }));
    }

    if (!process.env.OPENAI_API_KEY) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.end(JSON.stringify({ error: "OPENAI_API_KEY is not set" }));
    }

    const { message } = await readJson(req);

    if (!message) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.end(JSON.stringify({ error: "Message is required" }));
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: AI_SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      temperature: 0.4
    });

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ reply: completion.choices[0].message.content }));
  } catch (err) {
    console.error("❌ AI error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "AI error" }));
  }
};
