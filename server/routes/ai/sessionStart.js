const { requireUser } = require("../../../lib/jwt");
const db = require("../../../lib/db");

module.exports = async (req, res) => {
    let user;
    try {
        user = requireUser(req);
    } catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.method !== "POST") {
        return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    const { mode, lessonId, scenario } = req.body || {};
    if (!mode || !["sentence", "dialog", "tutor"].includes(mode)) {
        return res.status(400).json({ success: false, message: "mode is required" });
    }

    try {
        const r = await db.query(
            `
      insert into ai_sessions (user_id, mode, lesson_id, scenario)
      values ($1, $2, $3, $4)
      returning id, mode, lesson_id, scenario, started_at, message_pairs
      `,
            [user.id, mode, lessonId ? Number(lessonId) : null, scenario || null]
        );

        return res.json({ success: true, session: r.rows[0] });
    } catch (e) {
        return res.status(500).json({ success: false, message: "DB error", details: e.message });
    }
};