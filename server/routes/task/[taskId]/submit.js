const { requireUser } = require("../../../../lib/jwt");
const db = require("../../../../lib/db");
const { LEVELS } = require("../../../../backend_src/config/levels");

module.exports = async (req, res) => {
    try {
        const user = requireUser(req);

        const userId = user.id;
        const taskId = Number(req.query?.taskId || req.params?.taskId);

        if (!taskId) {
            return res.status(400).json({ success: false, message: "taskId is required" });
        }

        const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
        if (!answers.length) {
            return res.status(400).json({ success: false, message: "answers is required" });
        }

        // 1) таск
        const taskRes = await db.query(
            `SELECT id, pass_score, course_id FROM course_tasks WHERE id = $1 LIMIT 1`,
            [taskId]
        );
        const task = taskRes.rows[0];
        if (!task) return res.status(404).json({ success: false, message: "Task not found" });

        // 2) правильные ответы
        const qIds = answers
            .map((a) => Number(a.questionId))
            .filter((n) => Number.isFinite(n) && n > 0);

        if (!qIds.length) {
            return res.status(400).json({ success: false, message: "No valid questionIds" });
        }

        // ✅ correct_answer (по твоим данным именно так логично хранится правильный ответ)
        const qRes = await db.query(
            `
      SELECT id, correct_answer
      FROM task_questions
      WHERE task_id = $1 AND id = ANY($2::int[])
      `,
            [taskId, qIds]
        );

        const correctMap = new Map(qRes.rows.map((r) => [Number(r.id), String(r.correct_answer ?? "")]));

        let score = 0;
        for (const a of answers) {
            const qid = Number(a.questionId);
            const given = String(a.answer ?? "");
            const correct = correctMap.get(qid);
            if (correct != null && given === correct) score += 1;
        }

        const total = correctMap.size; // сколько вопросов реально нашли
        const passScore = Number(task.pass_score || 0);
        const passed = score >= passScore;

        // 3) сохраним результат (без ON CONFLICT, чтобы не упасть если нет unique)
        // сначала UPDATE, если 0 строк — INSERT
        const upd = await db.query(
            `
      UPDATE user_task_results
      SET score = $3, passed = $4, completed_at = NOW()
      WHERE user_id = $1 AND task_id = $2
      `,
            [userId, taskId, score, passed]
        );

        if (upd.rowCount === 0) {
            await db.query(
                `
        INSERT INTO user_task_results (user_id, task_id, score, passed, completed_at)
        VALUES ($1, $2, $3, $4, NOW())
        `,
                [userId, taskId, score, passed]
            );
        }

        let nextLevel = null;

        if (passed) {
            // 4) пометим финальное задание как пройденное
            await db.query(
                `
        UPDATE user_course_progress
        SET final_passed = TRUE
        WHERE user_id = $1 AND course_id = $2
        `,
                [userId, task.course_id]
            );

            // 5) повысим уровень (как у тебя было в MySQL)
            const cRes = await db.query(`SELECT level FROM courses WHERE id = $1 LIMIT 1`, [task.course_id]);
            const courseLevel = cRes.rows[0]?.level;

            if (courseLevel) {
                const idx = LEVELS.indexOf(courseLevel);
                const nl = idx >= 0 ? LEVELS[idx + 1] : null;

                if (nl) {
                    nextLevel = nl;
                    await db.query(`UPDATE users SET current_level = $1 WHERE id = $2`, [nl, userId]);
                }
            }
        }

        return res.json({
            success: true,
            passed,
            score,
            total,
            passScore,
            nextLevel
        });
    } catch (e) {
        console.error("task/submit error:", e);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
