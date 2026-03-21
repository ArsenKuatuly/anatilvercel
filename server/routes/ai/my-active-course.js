const { requireUser } = require("../../../lib/jwt");
const db = require("../../../lib/db");

module.exports = async (req, res) => {
    let user;
    try {
        user = requireUser(req);
    } catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const q = await db.query(
            `
      SELECT c.slug
      FROM user_course_progress ucp
      JOIN courses c ON c.id = ucp.course_id
      WHERE ucp.user_id = $1
        AND ucp.completed = false
      ORDER BY ucp.id DESC
      LIMIT 1
      `,
            [user.id]
        );

        const slug = q.rows[0]?.slug;
        if (!slug) return res.status(200).json({ success: false });

        return res.status(200).json({ success: true, slug });
    } catch (err) {
        console.error("my-active-course error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
