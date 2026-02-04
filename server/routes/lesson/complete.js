const { requireUser } = require("../../../lib/jwt");
const db = require("../../../lib/db");

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

        const lessonId = Number(req.body?.lessonId);
        if (!lessonId) {
            return res.status(400).json({ success: false, message: "Invalid lessonId" });
        }

        const info = await db.query(
            `
                SELECT l.id AS lesson_id, l.module_id, m.course_id
                FROM lessons l
                         JOIN modules m ON m.id = l.module_id
                WHERE l.id = $1
                    LIMIT 1
            `,
            [lessonId]
        );

        const row = info.rows[0];
        if (!row) {
            return res.status(404).json({ success: false, message: "Lesson not found" });
        }

        await db.query(
            `
                INSERT INTO user_lesson_progress (user_id, lesson_id, completed, completed_at)
                VALUES ($1, $2, true, NOW())
                    ON CONFLICT DO NOTHING
            `,
            [user.id, lessonId]
        );

        await db.query(
            `
                UPDATE user_lesson_progress
                SET completed = true,
                    completed_at = COALESCE(completed_at, NOW())
                WHERE user_id = $1 AND lesson_id = $2
            `,
            [user.id, lessonId]
        );

        const lessonsCountRes = await db.query(
            `
                SELECT COUNT(*)::int AS completed
                FROM user_lesson_progress
                WHERE user_id = $1 AND completed = true
            `,
            [user.id]
        );

        const completedLessons = lessonsCountRes.rows[0]?.completed || 0;

        const modStats = await db.query(
            `
                SELECT
                    COUNT(l.id)::int AS total,
                    COUNT(ulp.lesson_id)::int AS done
                FROM lessons l
                         LEFT JOIN user_lesson_progress ulp
                                   ON ulp.lesson_id = l.id
                                       AND ulp.user_id = $1
                                       AND ulp.completed = true
                WHERE l.module_id = $2
            `,
            [user.id, row.module_id]
        );

        const moduleCompleted =
            modStats.rows[0]?.total > 0 &&
            modStats.rows[0]?.done === modStats.rows[0]?.total;

        const courseStats = await db.query(
            `
            SELECT
              COUNT(l.id)::int AS total,
              COUNT(ulp.lesson_id)::int AS done
            FROM lessons l
            JOIN modules m ON m.id = l.module_id
            LEFT JOIN user_lesson_progress ulp
              ON ulp.lesson_id = l.id
             AND ulp.user_id = $1
             AND ulp.completed = true
            WHERE m.course_id = $2
            `,
            [user.id, row.course_id]
        );

        const courseCompleted =
            courseStats.rows[0]?.total > 0 &&
            courseStats.rows[0]?.done === courseStats.rows[0]?.total;

        if (courseCompleted) {
            await db.query(
                `
                INSERT INTO user_course_progress (user_id, course_id, completed, completed_at)
                VALUES ($1, $2, true, NOW())
                ON CONFLICT DO NOTHING
                `,
                [user.id, row.course_id]
            );

            await db.query(
                `
                UPDATE user_course_progress
                SET completed = true,
                    completed_at = COALESCE(completed_at, NOW())
                WHERE user_id = $1 AND course_id = $2
                `,
                [user.id, row.course_id]
            );
        }

        const unlocked = [];
        if (completedLessons === 1) unlocked.push("FIRST_LESSON");
        if (moduleCompleted) unlocked.push("FIRST_MODULE");
        if (courseCompleted) unlocked.push("FIRST_COURSE");

        return res.status(200).json({
            success: true,
            moduleCompleted,
            courseCompleted,
            unlocked,
            courseId: row.course_id,
        });
    } catch (err) {
        console.error("lesson/complete error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
