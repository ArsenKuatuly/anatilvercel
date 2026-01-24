const db = require("../../../../lib/db");

module.exports = async (req, res) => {
    try {
        const taskId = Number(req.query?.taskId || req.params?.taskId);

        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: "taskId is required"
            });
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

        return res.json({
            success: true,
            questions: result.rows
        });
    } catch (err) {
        console.error("task/questions error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
