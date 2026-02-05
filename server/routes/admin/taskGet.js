const requireAdmin = require("./_requireAdmin");
const db = require("../../../lib/db");

// GET /api/admin/tasks/:taskId
module.exports = async (req, res) => {
  try {
    requireAdmin(req);

    const taskId = Number(req.query?.taskId || req.params?.taskId);
    if (!taskId) return res.status(400).json({ success: false, message: "taskId is required" });

    const t = await db.query(
      `SELECT id, course_id, title, description, pass_score
       FROM course_tasks
       WHERE id = $1
       LIMIT 1`,
      [taskId]
    );
    const task = t.rows[0];
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    const q = await db.query(
      `SELECT id, task_id, question, options, correct_answer
       FROM task_questions
       WHERE task_id = $1
       ORDER BY id ASC`,
      [taskId]
    );

    const questions = q.rows.map((row) => ({
      id: row.id,
      taskId: row.task_id,
      question: row.question,
      options: JSON.stringify(row.options),
      correctAnswer: row.correct_answer,
    }));

    return res.status(200).json({
      success: true,
      task: {
        id: task.id,
        courseId: task.course_id,
        name: task.title,
        description: task.description,
        passingScore: task.pass_score,
      },
      questions,
    });
  } catch (e) {
    const code = e?.status || (String(e?.message || "").toLowerCase().includes("unauthorized") ? 401 : 500);
    return res.status(code).json({ success: false, message: e?.message || "Server error" });
  }
};
