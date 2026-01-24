const { requireUser } = require("../../../../lib/jwt");
const db = require("../../../../lib/db");
const { LEVELS } = require("../../../../backend_src/config/levels");

module.exports = async (req, res) => {
    let user;
    try {
        user = requireUser(req);
    } catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        if (req.method !== "POST") {
            res.setHeader("Allow", "POST");
            return res.status(405).json({ success: false, message: "Method Not Allowed" });
        }

        const taskId = Number(req.query.taskId);
        if (!taskId) return res.status(400).json({ success: false, message: "Invalid taskId" });


        const body = req.body || {};
        const answersInput = body.answers;


        const q = await db.query(
            `
      SELECT id, correct_option
      FROM task_questions
      WHERE task_id = $1
      `,
            [taskId]
        );

        const correctById = new Map(q.rows.map(r => [Number(r.id), String(r.correct_option)]));


        const answersMap = new Map();

        if (Array.isArray(answersInput)) {
            for (const a of answersInput) {
                const qid = Number(a.questionId ?? a.id ?? a.question_id);
                if (!qid) continue;
                answersMap.set(qid, String(a.answer ?? a.value ?? ""));
            }
        } else if (answersInput && typeof answersInput === "object") {
            for (const [k, v] of Object.entries(answersInput)) {
                const qid = Number(k);
                if (!qid) continue;
                answersMap.set(qid, String(v ?? ""));
            }
        } else if (body && typeof body === "object") {
            // fallback: если фронт шлёт сразу { "1": "A", "2": "B" }
            for (const [k, v] of Object.entries(body)) {
                const qid = Number(k);
                if (!qid) continue;
                answersMap.set(qid, String(v ?? ""));
            }
        }


        let total = correctById.size;
        let correct = 0;

        for (const [qid, corr] of correctById.entries()) {
            const given = answersMap.get(qid);
            if (given != null && String(given) === String(corr)) correct++;
        }

        const score = total > 0 ? Math.round((correct / total) * 100) : 0;


        const t = await db.query(
            `SELECT id, course_id, pass_score FROM course_tasks WHERE id = $1 LIMIT 1`,
            [taskId]
        );

        const task = t.rows[0];
        const passScore = Number(task?.pass_score ?? 60);
        const passed = score >= passScore;


        // 1) сохраняем результат финального задания
        await db.query(
            `
      INSERT INTO user_task_results (user_id, task_id, score, passed, completed_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, task_id)
      DO UPDATE SET score = EXCLUDED.score,
                    passed = EXCLUDED.passed,
                    completed_at = NOW()
      `,
            [user.id, taskId, score, passed]
        );

        // 2) фиксируем в прогрессе курса, что финал пройден/не пройден
        // В текущей схеме user_course_progress НЕ имеет unique(user_id, course_id),
        // поэтому делаем: если строки нет — вставляем, иначе — обновляем.
        if (task?.course_id) {
            const exists = await db.query(
                `SELECT id FROM user_course_progress WHERE user_id = $1 AND course_id = $2 LIMIT 1`,
                [user.id, task.course_id]
            );

            if (exists.rows.length === 0) {
                await db.query(
                    `
          INSERT INTO user_course_progress (user_id, course_id, completed, completed_at, final_passed, final_score)
          VALUES ($1, $2, false, NULL, $3, $4)
          `,
                    [user.id, task.course_id, passed, score]
                );
            } else {
                await db.query(
                    `
          UPDATE user_course_progress
          SET final_passed = $3,
              final_score = $4
          WHERE user_id = $1 AND course_id = $2
          `,
                    [user.id, task.course_id, passed, score]
                );
            }
        }

        // 3) если passed — повышаем уровень пользователя (как было в MySQL)
        let nextLevel = null;
        if (passed && task?.course_id) {
            const c = await db.query(`SELECT level FROM courses WHERE id = $1 LIMIT 1`, [task.course_id]);
            const courseLevel = c.rows[0]?.level || null;
            const idx = courseLevel ? LEVELS.indexOf(courseLevel) : -1;
            nextLevel = idx >= 0 ? LEVELS[idx + 1] : null;
            if (nextLevel) {
                await db.query(`UPDATE users SET current_level = $1 WHERE id = $2`, [nextLevel, user.id]);
            }
        }

        return res.status(200).json({
            success: true,
            score,
            correct,
            total,
            passed,
            passScore,
            courseId: task?.course_id ?? null,
            nextLevel,
        });
    } catch (err) {
        console.error("task/submit error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
