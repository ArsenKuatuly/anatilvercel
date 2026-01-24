const db = require("../../../../lib/db");
const { requireUser } = require("../../../../lib/jwt");
const { LEVELS } = require("../../../../backend_src/config/levels");

module.exports = async (req, res) => {
    try {
        const user = await requireUser(req, res);
        if (!user) return;

        const taskId = req.query?.taskId;
        const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];

        if (!taskId) {
            return res.status(400).json({ success: false, message: "taskId is required" });
        }
        if (answers.length === 0) {
            return res.status(400).json({ success: false, message: "answers is required" });
        }

        // 1) pass_score + course_id
        const taskRow = await db.query(
            `SELECT id, pass_score, course_id FROM course_tasks WHERE id = $1 LIMIT 1`,
            [taskId]
        );
        const task = taskRow.rows?.[0];
        if (!task) return res.status(404).json({ success: false, message: "Task not found" });

        // 2) вытаскиваем правильные ответы
        const qIds = answers
            .map((a) => Number(a.questionId))
            .filter((n) => Number.isFinite(n));

        if (qIds.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid questionId list" });
        }

        const qRes = await db.query(
            `
      SELECT id, correct_answer
      FROM task_questions
      WHERE task_id = $1 AND id = ANY($2::int[])
      `,
            [taskId, qIds]
        );

        const correctMap = new Map();
        for (const row of qRes.rows || []) correctMap.set(Number(row.id), String(row.correct_answer ?? ""));

        // 3) считаем score
        let score = 0;
        for (const a of answers) {
            const qid = Number(a.questionId);
            const given = String(a.answer ?? "");
            const correct = correctMap.get(qid);
            if (correct != null && given === correct) score++;
        }

        const passScore = Number(task.pass_score || 0);
        const passed = score >= passScore;

        // 4) сохраняем результат в user_task_results (UPDATE -> INSERT)
        const upd = await db.query(
            `
      UPDATE user_task_results
      SET score = $3, passed = $4, completed_at = NOW()
      WHERE user_id = $1 AND task_id = $2
      `,
            [user.id, taskId, score, passed]
        );

        if ((upd.rowCount || 0) === 0) {
            await db.query(
                `
        INSERT INTO user_task_results (user_id, task_id, score, passed, completed_at)
        VALUES ($1, $2, $3, $4, NOW())
        `,
                [user.id, taskId, score, passed]
            );
        }

        // 5) если прошёл — отмечаем final_passed и повышаем уровень
        let nextLevel = null;

        if (passed) {
            await db.query(
                `
        UPDATE user_course_progress
        SET final_passed = 1
        WHERE user_id = $1 AND course_id = $2
        `,
                [user.id, task.course_id]
            );

            const courseRes = await db.query(`SELECT level FROM courses WHERE id = $1 LIMIT 1`, [
                task.course_id
            ]);
            const level = courseRes.rows?.[0]?.level;

            const idx = LEVELS.indexOf(level);
            if (idx !== -1 && LEVELS[idx + 1]) {
                nextLevel = LEVELS[idx + 1];
                await db.query(`UPDATE users SET current_level = $1 WHERE id = $2`, [nextLevel, user.id]);
            }
        }

        return res.json({ success: true, passed, score, pass_score: passScore, nextLevel });
    } catch (err) {
        console.error("task/submit error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
