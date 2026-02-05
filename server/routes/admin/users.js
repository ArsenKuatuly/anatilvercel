const requireAdmin = require("./_requireAdmin");
const db = require("../../../lib/db");

// GET /api/admin/users
module.exports = async (req, res) => {
  try {
    requireAdmin(req);

    const q = await db.query(
      `SELECT id, login, role, current_level, created_at
       FROM users
       ORDER BY id ASC`,
      []
    );

    const users = q.rows.map((u) => ({
      id: u.id,
      login: u.login,
      role: u.role || "user",
      level: u.current_level || null,
      createdAt: u.created_at,
    }));

    return res.status(200).json({ success: true, users });
  } catch (e) {
    const code = e?.status || (String(e?.message || "").toLowerCase().includes("unauthorized") ? 401 : 500);
    return res.status(code).json({ success: false, message: e?.message || "Server error" });
  }
};
