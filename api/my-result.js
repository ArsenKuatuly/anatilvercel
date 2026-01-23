const { requireUser } = require("../lib/jwt");
const db = require("../lib/db");

module.exports = async (req, res) => {
    let user;
    try {
        user = requireUser(req);
    } catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const { rows } = await db.query(
            `
      SELECT id, user_id, total_score, level, reading_score, listening_score, math_score, created_at
      FROM test_results
      WHERE user_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT 1
      `,
            [user.id]
        );

        return res.status(200).json({
            success: true,
            result: rows[0] || null,
        });
    } catch (err) {
        console.error("my-result error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
