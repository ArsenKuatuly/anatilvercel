const requireAdmin = require("./_requireAdmin");
const db = require("../../../lib/db");

// GET /api/admin/library/materials
module.exports = async (req, res) => {
  try {
    requireAdmin(req);

    const q = await db.query(
      `SELECT id, title, description, type, category, level, duration, icon, sort_order, created_at
       FROM library_materials
       ORDER BY sort_order ASC NULLS LAST, created_at ASC NULLS LAST, id ASC`,
      []
    );

    return res.status(200).json({ success: true, materials: q.rows });
  } catch (e) {
    // If library tables aren't installed yet, return a soft error.
    const msg = String(e?.message || e || "Server error");
    const code = e?.status || (msg.toLowerCase().includes("unauthorized") ? 401 : 500);
    return res.status(code).json({ success: false, message: msg });
  }
};
