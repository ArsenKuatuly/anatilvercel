const requireAdmin = require("./_requireAdmin");
const db = require("../../../lib/db");

// PATCH /api/admin/library/materials/:id
module.exports = async (req, res) => {
  try {
    requireAdmin(req);

    const id = Number(req.query?.id || req.params?.id);
    if (!id) return res.status(400).json({ success: false, message: "id is required" });

    const body = req.body || {};
    const patch = {};
    if (body.title !== undefined) patch.title = String(body.title);
    if (body.description !== undefined) patch.description = String(body.description);
    if (body.type !== undefined) patch.type = String(body.type);
    if (body.category !== undefined) patch.category = String(body.category);
    if (body.level !== undefined) patch.level = String(body.level);
    if (body.duration !== undefined) patch.duration = String(body.duration);
    if (body.icon !== undefined) patch.icon = String(body.icon);
    if (body.sortOrder !== undefined) patch.sort_order = Number(body.sortOrder);

    const fields = Object.keys(patch);
    if (!fields.length) return res.status(400).json({ success: false, message: "No fields to update" });

    const sets = [];
    const vals = [id];
    let idx = 2;
    for (const f of fields) {
      sets.push(`${f} = $${idx++}`);
      vals.push(patch[f]);
    }

    const q = await db.query(
      `UPDATE library_materials
       SET ${sets.join(", ")}
       WHERE id = $1
       RETURNING id, title, description, type, category, level, duration, icon, sort_order`,
      vals
    );

    if (!q.rows[0]) return res.status(404).json({ success: false, message: "Material not found" });
    return res.status(200).json({ success: true, material: q.rows[0] });
  } catch (e) {
    const msg = String(e?.message || e || "Server error");
    const code = e?.status || (msg.toLowerCase().includes("unauthorized") ? 401 : 500);
    return res.status(code).json({ success: false, message: msg });
  }
};
