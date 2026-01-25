// server/routes/task/[taskId]/submit.js
const { requireUser } = require("../../../../lib/jwt");
const db = require("../../../../lib/db");
const { LEVELS } = require("../../../../backend_src/config/levels");

module.exports = async (req, res) => {
    try {
        const user = requireUser(req);
        const userId = user.id;

        const taskId = Number(req.query?.taskId || req.params?.taskId);
        if (!taskId) return res.status(400).json({ success: false, message: "taskId is required" });

        const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
        if (!answers.length) return res.status(400).json({ success: false, message: "answers is required" });

        const taskRes = await db.query(
            `SELECT id, pass_score, course_id FROM course_tasks WHERE id = $1 LIMIT 1`,
            [taskId]
        );
        const task = taskRes.rows[0];
        if (!task) return res.status(404).json({ success: false, message: "Task not found" });

        const qIds = answers
            .map((a) => Number(a.questionId))
            .filter((n) => Number.isFinite(n) && n > 0);

        if (!qIds.length) {
            return res.status(400).json({ success: false, message: "No valid questionIds" });
        }


        const totalRes = await db.query(
            `SELECT COUNT(*)::int AS total FROM task_questions WHERE task_id = $1`,
            [taskId]
        );
        const total = Number(totalRes.rows[0]?.total || 0);


        const qRes = await db.query(
            `
        SELECT id, correct_answer
        FROM task_questions
        WHERE task_id = $1 AND id = ANY($2::int[])
      `,
            [taskId, qIds]
        );

        const correctMap = new Map(
            qRes.rows.map((r) => [Number(r.id), String(r.correct_answer ?? "")])
        );

        const norm = (v) => String(v ?? "").trim();

        let score = 0;
        for (const a of answers) {
            const qid = Number(a.questionId);
            const given = norm(a.answer);
            const correct = correctMap.get(qid);
            if (correct != null && given === norm(correct)) score += 1;
        }

        const answered = qIds.length;


        const passScore = Number(task.pass_score || 0);
        const requiredCorrect = total > 0 ? Math.ceil((total * passScore) / 100) : 0;
        const percent = total > 0 ? Math.round((score / total) * 100) : 0;
        const passed = total > 0 ? score >= requiredCorrect : false;


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

            const upCourse = await db.query(
                `
                    UPDATE user_course_progress
                    SET final_passed = TRUE,
                        completed = TRUE,
                        final_score = $3,
                        completed_at = NOW()
                    WHERE user_id = $1 AND course_id = $2
                `,
                [userId, task.course_id, percent]
            );

            if (upCourse.rowCount === 0) {
                await db.query(
                    `
                        INSERT INTO user_course_progress (user_id, course_id, completed, final_passed, final_score, completed_at)
                        VALUES ($1, $2, TRUE, TRUE, $3, NOW())
                    `,
                    [userId, task.course_id, percent]
                );
            }


            const upUserCourses = await db.query(
                `
                    UPDATE user_courses
                    SET completed = TRUE,
                        final_passed = TRUE,
                        completed_at = NOW()
                    WHERE user_id = $1 AND course_id = $2
                `,
                [userId, task.course_id]
            );

            if (upUserCourses.rowCount === 0) {
                await db.query(
                    `
            INSERT INTO user_courses (user_id, course_id, completed, final_passed, started_at, completed_at)
            VALUES ($1, $2, TRUE, TRUE, NOW(), NOW())
          `,
                    [userId, task.course_id]
                );
            }

            // найти следующий уровень и обновить current_level
            const cRes = await db.query(
                `SELECT level FROM courses WHERE id = $1 LIMIT 1`,
                [task.course_id]
            );
            const courseLevel = cRes.rows[0]?.level;

            if (courseLevel) {
                const idx = LEVELS.indexOf(courseLevel);
                const nl = idx >= 0 ? LEVELS[idx + 1] : null;

                if (nl) {
                    nextLevel = nl;
                    await db.query(`UPDATE users SET current_level = $1 WHERE id = $2`, [nl, userId]);

                    // добавить следующий курс (если есть)
                    const nextCourseRes = await db.query(
                        `SELECT id FROM courses WHERE level = $1 ORDER BY position ASC, id ASC LIMIT 1`,
                        [nextLevel]
                    );
                    const nextCourseId = nextCourseRes.rows[0]?.id;

                    if (nextCourseId) {
                        const nextUcUpd = await db.query(
                            `UPDATE user_courses SET completed = completed WHERE user_id = $1 AND course_id = $2`,
                            [userId, nextCourseId]
                        );
                        if (nextUcUpd.rowCount === 0) {
                            await db.query(
                                `
                  INSERT INTO user_courses (user_id, course_id, completed, final_passed, started_at)
                  VALUES ($1, $2, FALSE, FALSE, NOW())
                `,
                                [userId, nextCourseId]
                            );
                        }

                        const nextPUpd = await db.query(
                            `UPDATE user_course_progress SET completed = completed WHERE user_id = $1 AND course_id = $2`,
                            [userId, nextCourseId]
                        );
                        if (nextPUpd.rowCount === 0) {
                            await db.query(
                                `
                  INSERT INTO user_course_progress (user_id, course_id, completed, final_passed)
                  VALUES ($1, $2, FALSE, FALSE)
                `,
                                [userId, nextCourseId]
                            );
                        }
                    }
                }
            }
        }

        return res.json({
            success: true,
            passed,
            answered,
            score,
            total,
            passScore,
            requiredCorrect,
            percent,
            nextLevel,
        });
    } catch (e) {
        console.error("task/submit error:", e);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
