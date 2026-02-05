const requireAdmin = require("./_requireAdmin");
const db = require("../../../lib/db");

// GET /api/admin/tasks
module.exports = async (req, res) => {
  try {
    requireAdmin(req);

    const q = await db.query(
      `SELECT t.id, t.course_id, t.title, t.description, t.pass_score,
              c.title as course_title
       FROM course_tasks t
       JOIN courses c ON c.id = t.course_id
       ORDER BY c.position ASC NULLS LAST, t.id ASC`,
      []
    );

    const tasks = q.rows.map((r) => ({
      id: r.id,
      courseId: r.course_id,
      course: r.course_title,
      name: r.title,
      description: r.description,
      passingScore: r.pass_score,
    }));

    return res.status(200).json({ success: true, tasks });
  } catch (e) {
    const code = e?.status || (String(e?.message || "").toLowerCase().includes("unauthorized") ? 401 : 500);
    return res.status(code).json({ success: false, message: e?.message || "Server error" });
  }
};
