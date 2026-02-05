const requireAdmin = require("./_requireAdmin");
const db = require("../../../lib/db");

// PATCH /api/admin/users/:id
module.exports = async (req, res) => {
  try {
    requireAdmin(req);

    const id = Number(req.query?.id || req.params?.id);
    if (!id) return res.status(400).json({ success: false, message: "id is required" });

    const body = req.body || {};
    const allowedRoles = new Set(["user", "admin", "teacher"]);

    const role = body.role !== undefined ? String(body.role).trim() : null;
    const level = body.level !== undefined ? String(body.level).trim() : null;

    if (role !== null && !allowedRoles.has(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const current = await db.query(`SELECT id, role, current_level FROM users WHERE id=$1 LIMIT 1`, [id]);
    if (!current.rows[0]) return res.status(404).json({ success: false, message: "User not found" });

    const nextRole = role !== null ? role : (current.rows[0].role || "user");
    const nextLevel = level !== null ? level : (current.rows[0].current_level || null);

    await db.query(
      `UPDATE users
       SET role = $2,
           current_level = $3
       WHERE id = $1`,
      [id, nextRole, nextLevel]
    );

    return res.status(200).json({ success: true, user: { id, role: nextRole, level: nextLevel } });
  } catch (e) {
    const code = e?.status || (String(e?.message || "").toLowerCase().includes("unauthorized") ? 401 : 500);
    return res.status(code).json({ success: false, message: e?.message || "Server error" });
  }
};
