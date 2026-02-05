const requireAdmin = require("./_requireAdmin");
const db = require("../../../lib/db");

// GET /api/admin/modules/:moduleId/lessons
module.exports = async (req, res) => {
  try {
    requireAdmin(req);

    const moduleId = Number(req.query?.moduleId || req.params?.moduleId);
    if (!moduleId) return res.status(400).json({ success: false, message: "moduleId is required" });

    const l = await db.query(
      `SELECT id, module_id, title, position, content
       FROM lessons
       WHERE module_id = $1
       ORDER BY position ASC NULLS LAST, id ASC`,
      [moduleId]
    );

    return res.status(200).json({ success: true, lessons: l.rows });
  } catch (e) {
    const code = e?.status || (String(e?.message || "").toLowerCase().includes("unauthorized") ? 401 : 500);
    return res.status(code).json({ success: false, message: e?.message || "Server error" });
  }
};
