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
      SELECT id, user_id, total_score, level, created_at
      FROM test_results
      WHERE user_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT 50
      `,
            [user.id]
        );

        return res.status(200).json({
            success: true,
            results: rows || [],
        });
    } catch (err) {
        console.error("test-history error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
