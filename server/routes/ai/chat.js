const { requireUser } = require("../../../lib/jwt");
const db = require("../../../lib/db");
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

const DAILY_LIMIT = 5000;

async function getTodayUsed(userId) {
    const q = await db.query(
        `select used from ai_daily_usage where user_id = $1 and day = current_date`,
        [userId]
    );
    return Number(q.rows[0]?.used || 0);
}

module.exports = async (req, res) => {
    const t0 = Date.now();

    try {
        console.log("[ai/chat] start", req.method);

        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        // Auth
        let user;
        try {
            user = requireUser(req);
        } catch {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        console.log("[ai/chat] key:", apiKey ? "OK" : "MISSING");
        if (!apiKey) {
            return res.status(500).json({ error: "OPENAI_API_KEY missing" });
        }

        const { message, sessionId } = req.body || {};
        if (!message) return res.status(400).json({ error: "Message is required" });

        // Daily limit guard (before OpenAI)
        const used0 = await getTodayUsed(user.id);
        if (used0 >= DAILY_LIMIT) {
            return res.status(429).json({
                error: "Daily limit reached",
                details: "AI лимит на сегодня исчерпан",
                usage: { used: used0, limit: DAILY_LIMIT, remaining: 0 },
            });
        }

        // OpenAI (timeout 20 sec)
        const openai = new OpenAI({ apiKey, timeout: 20000 });

        console.log("[ai/chat] calling openai...");
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: AI_SYSTEM_PROMPT },
                { role: "user", content: message },
            ],
            temperature: 0.4,
        });

        const reply = completion.choices?.[0]?.message?.content || "";

        // 1) increment daily usage (1 = одна пара user+assistant)
        await db.query(
            `
      insert into ai_daily_usage (user_id, day, used)
      values ($1, current_date, 1)
      on conflict (user_id, day)
      do update set used = ai_daily_usage.used + 1
      `,
            [user.id]
        );

        // 2) attach to session + store messages (optional)
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
                        `
            insert into ai_messages (session_id, role, content)
            values ($1,'user',$2), ($1,'assistant',$3)
            `,
                        [sid, message, reply]
                    );
                }
            }
        }

        // 3) return fresh usage
        const used = await getTodayUsed(user.id);

        console.log("[ai/chat] done in", Date.now() - t0, "ms");
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