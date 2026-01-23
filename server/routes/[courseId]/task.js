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
        const courseId = Number(req.query.courseId);
        if (!courseId) return res.status(400).json({ success: false, message: "Invalid courseId" });

        const t = await db.query(
            `
      SELECT id, course_id, title, description, pass_score
      FROM course_tasks
      WHERE course_id = $1
      ORDER BY id ASC
      LIMIT 1
      `,
            [courseId]
        );

        return res.status(200).json({
            success: true,
            task: t.rows[0] || null,
        });
    } catch (err) {
        console.error("course/[courseId]/task error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
