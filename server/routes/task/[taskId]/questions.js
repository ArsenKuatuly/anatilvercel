const db = require("../../../../lib/db");
const { requireUser } = require("../../../../lib/jwt");

module.exports = async (req, res) => {
    try {
        const user = await requireUser(req, res);
        if (!user) return;

        const taskId = req.query?.taskId;
        if (!taskId) {
            return res.status(400).json({ success: false, message: "taskId is required" });
        }

        // ✅ твоя схема из MySQL/seed: question, options
        const result = await db.query(
            `
      SELECT id, question, options
      FROM task_questions
      WHERE task_id = $1
      ORDER BY id
      `,
            [taskId]
        );

        return res.json({ success: true, questions: result.rows || [] });
    } catch (err) {
        console.error("task/questions error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
