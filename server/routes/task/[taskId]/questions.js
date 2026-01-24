const { requireUser } = require("../../../../lib/jwt");
const db = require("../../../../lib/db");

module.exports = async (req, res) => {
    let user;
    try {
        user = requireUser(req);
    } catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const taskId = Number(req.query.taskId);
        if (!taskId) return res.status(400).json({ success: false, message: "Invalid taskId" });

        const { rows } = await db.query(
            `
      SELECT id, task_id, question_text, options, correct_option
      FROM task_questions
      WHERE task_id = $1
      ORDER BY id ASC
      `,
            [taskId]
        );

        // ВАЖНО: correct_option на фронт лучше не отдавать
        // Фронт (public/js/finallytask.js) ожидает поле `question`
        const questions = rows.map((q) => ({
            id: q.id,
            task_id: q.task_id,
            question: q.question_text,
            options: q.options, // json array или строка
        }));

        return res.status(200).json({ success: true, questions });
    } catch (err) {
        console.error("task/questions error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
