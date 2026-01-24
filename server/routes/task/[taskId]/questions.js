const db = require("../../../../lib/db");
const { requireAuth } = require("../../../../lib/auth");

module.exports = async (req, res) => {
    try {
        const user = await requireAuth(req, res);
        if (!user) return;

        const taskId = Number(req.query?.taskId || req.params?.taskId);
        if (!taskId) {
            return res.status(400).json({ success: false, message: "taskId is required" });
        }

        const result = await db.query(
            `
      SELECT id, question, options
      FROM task_questions
      WHERE task_id = $1
      ORDER BY id
      `,
            [taskId]
        );

        res.json({ success: true, questions: result.rows });
    } catch (err) {
        console.error("task/questions error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
