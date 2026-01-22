const OpenAI = require("openai");

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
    const t0 = Date.now();

    try {
        console.log("[ai/chat] start", req.method);

        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        console.log("[ai/chat] key:", apiKey ? "OK" : "MISSING");
        if (!apiKey) {
            return res.status(500).json({ error: "OPENAI_API_KEY missing" });
        }

        const { message } = req.body || {};
        if (!message) return res.status(400).json({ error: "Message is required" });

        // Таймаут на OpenAI (20 сек)
        const openai = new OpenAI({ apiKey, timeout: 20000 });

        console.log("[ai/chat] calling openai...");
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: AI_SYSTEM_PROMPT },
                { role: "user", content: message }
            ],
            temperature: 0.4
        });

        const reply = completion.choices?.[0]?.message?.content || "";
        console.log("[ai/chat] done in", Date.now() - t0, "ms");

        return res.json({ reply });
    } catch (err) {
        console.error("[ai/chat] error:", err?.message || err);
        return res.status(500).json({
            error: "AI error",
            details: err?.message || String(err)
        });
    }
};
