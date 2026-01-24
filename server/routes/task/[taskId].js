const { requireUser } = require("../../../lib/jwt");
const db = require("../../../lib/db");

// GET /api/task/:taskId
module.exports = async (req, res) => {
  try {
    requireUser(req);
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const taskId = Number(req.query.taskId);
    if (!taskId) return res.status(400).json({ success: false, message: "Invalid taskId" });

    const { rows } = await db.query(
      `
      SELECT id, course_id, title, description, pass_score
      FROM course_tasks
      WHERE id = $1
      LIMIT 1
      `,
      [taskId]
    );

    const task = rows[0] || null;
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    return res.status(200).json({ success: true, task });
  } catch (err) {
    console.error("task/[taskId] error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
