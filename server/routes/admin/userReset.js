const requireAdmin = require("./_requireAdmin");
const db = require("../../../lib/db");

// POST /api/admin/users/:id/reset
module.exports = async (req, res) => {
  try {
    requireAdmin(req);

    const id = Number(req.query?.id || req.params?.id);
    if (!id) return res.status(400).json({ success: false, message: "id is required" });


    const statements = [
      `DELETE FROM user_lesson_progress WHERE user_id = $1`,
      `DELETE FROM user_module_progress WHERE user_id = $1`,
      `DELETE FROM user_course_progress WHERE user_id = $1`,
      `DELETE FROM user_task_results WHERE user_id = $1`,
      `DELETE FROM user_courses WHERE user_id = $1`,
      `DELETE FROM test_results WHERE user_id = $1`
    ];

    for (const sql of statements) {
      await db.query(sql, [id]);
    }


    try {
      await db.query(`DELETE FROM library_user_state WHERE user_id = $1`, [id]);
    } catch {}

    return res.status(200).json({ success: true });
  } catch (e) {
    const code = e?.status || (String(e?.message || "").toLowerCase().includes("unauthorized") ? 401 : 500);
    return res.status(code).json({ success: false, message: e?.message || "Server error" });
  }
};
