const requireAdmin = require("./_requireAdmin");
const db = require("../../../lib/db");

// PATCH /api/admin/questions/:id
module.exports = async (req, res) => {
  try {
    requireAdmin(req);

    const id = Number(req.query?.id || req.params?.id);
    if (!id) return res.status(400).json({ success: false, message: "id is required" });

    const body = req.body || {};
    const patch = {};
    if (body.question !== undefined) patch.question = String(body.question);
    if (body.options !== undefined) {
      // options may come as a JSON string or array
      let opts = body.options;
      if (typeof opts === "string") {
        try { opts = JSON.parse(opts); } catch { opts = null; }
      }
      if (!Array.isArray(opts)) {
        return res.status(400).json({ success: false, message: "options must be a JSON array" });
      }
      patch.options = JSON.stringify(opts);
    }
    if (body.correctAnswer !== undefined) patch.correct_answer = String(body.correctAnswer);

    const fields = Object.keys(patch);
    if (!fields.length) return res.status(400).json({ success: false, message: "No fields to update" });

    const sets = [];
    const vals = [id];
    let idx = 2;
    for (const f of fields) {
      if (f === "options") {
        sets.push(`${f} = $${idx++}::jsonb`);
      } else {
        sets.push(`${f} = $${idx++}`);
      }
      vals.push(patch[f]);
    }

    const q = await db.query(
      `UPDATE task_questions
       SET ${sets.join(", ")}
       WHERE id = $1
       RETURNING id, task_id, question, options, correct_answer`,
      vals
    );

    if (!q.rows[0]) return res.status(404).json({ success: false, message: "Question not found" });

    const row = q.rows[0];
    return res.status(200).json({
      success: true,
      question: {
        id: row.id,
        taskId: row.task_id,
        question: row.question,
        options: JSON.stringify(row.options),
        correctAnswer: row.correct_answer,
      },
    });
  } catch (e) {
    const code = e?.status || (String(e?.message || "").toLowerCase().includes("unauthorized") ? 401 : 500);
    return res.status(code).json({ success: false, message: e?.message || "Server error" });
  }
};
