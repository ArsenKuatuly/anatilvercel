const { requireUser } = require("../../../../lib/jwt");
const db = require("../../../../lib/db");

module.exports = async (req, res) => {
    try {
        const user = requireUser(req);

        const taskId = Number(req.query?.taskId || req.params?.taskId);
        if (!taskId) {
            return res.status(400).json({ success: false, message: "taskId is required" });
        }

        // ✅ ВАЖНО: колонка называется question, а не question_text
        const result = await db.query(
            `
      SELECT id, question, options
      FROM task_questions
      WHERE task_id = $1
      ORDER BY id
      `,
            [taskId]
        );

        return res.json({ success: true, questions: result.rows });
    } catch (e) {
        console.error("task/questions error:", e);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
