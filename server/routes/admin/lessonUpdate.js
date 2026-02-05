const requireAdmin = require("./_requireAdmin");
const db = require("../../../lib/db");

// PATCH /api/admin/lessons/:lessonId
module.exports = async (req, res) => {
  try {
    requireAdmin(req);

    const lessonId = Number(req.query?.lessonId || req.params?.lessonId);
    if (!lessonId) return res.status(400).json({ success: false, message: "lessonId is required" });

    const body = req.body || {};
    const patch = {};
    if (body.title !== undefined) patch.title = String(body.title);
    if (body.position !== undefined) patch.position = body.position === null || body.position === "" ? null : Number(body.position);
    if (body.content !== undefined) patch.content = String(body.content);

    const fields = Object.keys(patch);
    if (!fields.length) return res.status(400).json({ success: false, message: "No fields to update" });

    const sets = [];
    const vals = [lessonId];
    let idx = 2;
    for (const f of fields) {
      sets.push(`${f} = $${idx++}`);
      vals.push(patch[f]);
    }

    const q = await db.query(
      `UPDATE lessons SET ${sets.join(", ")}
       WHERE id = $1
       RETURNING id, module_id, title, position, content`,
      vals
    );

    if (!q.rows[0]) return res.status(404).json({ success: false, message: "Lesson not found" });
    return res.status(200).json({ success: true, lesson: q.rows[0] });
  } catch (e) {
    const code = e?.status || (String(e?.message || "").toLowerCase().includes("unauthorized") ? 401 : 500);
    return res.status(code).json({ success: false, message: e?.message || "Server error" });
  }
};
