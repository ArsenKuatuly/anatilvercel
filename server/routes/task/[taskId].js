const { requireUser } = require("../../../lib/jwt");
const db = require("../../../lib/db");

module.exports = async (req, res) => {
    try {
        const user = requireUser(req);

        const taskId = Number(req.query?.taskId || req.query?.id || req.params?.taskId);
        if (!taskId) {
            return res.status(400).json({ success: false, message: "taskId is required" });
        }

        const result = await db.query(
            `
      SELECT id, title, description, pass_score, course_id
      FROM course_tasks
      WHERE id = $1
      LIMIT 1
      `,
            [taskId]
        );

        const task = result.rows[0];
        if (!task) return res.status(404).json({ success: false, message: "Task not found" });

        return res.json({ success: true, task });
    } catch (e) {
        console.error("task/[taskId] error:", e);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
