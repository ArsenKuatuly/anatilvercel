const requireAdmin = require("./_requireAdmin");
const db = require("../../../lib/db");

// GET /api/admin/courses/:courseId/modules
module.exports = async (req, res) => {
  try {
    requireAdmin(req);

    const courseId = Number(req.query?.courseId || req.params?.courseId);
    if (!courseId) return res.status(400).json({ success: false, message: "courseId is required" });

    const m = await db.query(
      `SELECT id, course_id, title, position
       FROM modules
       WHERE course_id = $1
       ORDER BY position ASC NULLS LAST, id ASC`,
      [courseId]
    );

    return res.status(200).json({ success: true, modules: m.rows });
  } catch (e) {
    const code = e?.status || (String(e?.message || "").toLowerCase().includes("unauthorized") ? 401 : 500);
    return res.status(code).json({ success: false, message: e?.message || "Server error" });
  }
};
