const requireAdmin = require("./_requireAdmin");
const db = require("../../../lib/db");

// GET /api/admin/courses
module.exports = async (req, res) => {
  try {
    requireAdmin(req);

    const c = await db.query(
      `SELECT id, slug, title, level, position
       FROM courses
       ORDER BY position ASC NULLS LAST, id ASC`,
      []
    );

    return res.status(200).json({ success: true, courses: c.rows });
  } catch (e) {
    const code = e?.status || (String(e?.message || "").toLowerCase().includes("unauthorized") ? 401 : 500);
    return res.status(code).json({ success: false, message: e?.message || "Server error" });
  }
};
