const requireAdmin = require("./_requireAdmin");
const db = require("../../../lib/db");

// PATCH /api/admin/tasks/:taskId
module.exports = async (req, res) => {
  try {
    requireAdmin(req);

    const taskId = Number(req.query?.taskId || req.params?.taskId);
    if (!taskId) return res.status(400).json({ success: false, message: "taskId is required" });

    const body = req.body || {};
    const patch = {};
    if (body.name !== undefined) patch.title = String(body.name);
    if (body.description !== undefined) patch.description = String(body.description);
    if (body.passingScore !== undefined) patch.pass_score = Math.max(0, Math.min(100, Number(body.passingScore || 0)));
    if (body.courseId !== undefined) patch.course_id = Number(body.courseId);

    const fields = Object.keys(patch);
    if (!fields.length) return res.status(400).json({ success: false, message: "No fields to update" });

    const sets = [];
    const vals = [taskId];
    let idx = 2;
    for (const f of fields) {
      sets.push(`${f} = $${idx++}`);
      vals.push(patch[f]);
    }

    const q = await db.query(
      `UPDATE course_tasks
       SET ${sets.join(", ")}
       WHERE id = $1
       RETURNING id, course_id, title, description, pass_score`,
      vals
    );

    if (!q.rows[0]) return res.status(404).json({ success: false, message: "Task not found" });

    const row = q.rows[0];
    return res.status(200).json({
      success: true,
      task: {
        id: row.id,
        courseId: row.course_id,
        name: row.title,
        description: row.description,
        passingScore: row.pass_score,
      },
    });
  } catch (e) {
    const code = e?.status || (String(e?.message || "").toLowerCase().includes("unauthorized") ? 401 : 500);
    return res.status(code).json({ success: false, message: e?.message || "Server error" });
  }
};
