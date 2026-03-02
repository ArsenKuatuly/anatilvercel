const { requireUser } = require("../../../lib/jwt");
const db = require("../../../lib/db");

const DAILY_LIMIT = 50;

module.exports = async (req, res) => {
    let user;
    try {
        user = requireUser(req);
    } catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.method !== "GET") {
        return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    try {
        const q = await db.query(
            `select used from ai_daily_usage where user_id = $1 and day = current_date`,
            [user.id]
        );

        const used = Number(q.rows[0]?.used || 0);
        return res.json({
            success: true,
            used,
            limit: DAILY_LIMIT,
            remaining: Math.max(DAILY_LIMIT - used, 0),
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: "DB error", details: e.message });
    }
};