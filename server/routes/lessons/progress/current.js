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
        // 1) определяем "текущий уровень" пользователя
        const u = await db.query(
            `SELECT id, current_level FROM users WHERE id = $1 LIMIT 1`,
            [user.id]
        );
        const currentLevel = u.rows[0]?.current_level || "elementary";

        // 2) берём курс этого уровня (самый ранний по position)
        const c = await db.query(
            `
      SELECT id, slug, title, level, position
      FROM courses
      WHERE level = $1
      ORDER BY position ASC, id ASC
      LIMIT 1
      `,
            [currentLevel]
        );

        const course = c.rows[0];
        if (!course) {
            return res.status(200).json({
                success: true,
                course: null,
                totalLessons: 0,
                completedLessons: 0,
                modulesCount: 0,
                percent: 0,
                lastLesson: null,
                nextLesson: null,
            });
        }

        // 3) считаем модули и уроки в этом курсе
        const stats = await db.query(
            `
      SELECT
        COUNT(DISTINCT m.id)::int AS modules_count,
        COUNT(DISTINCT l.id)::int AS total_lessons
      FROM modules m
      LEFT JOIN lessons l ON l.module_id = m.id
      WHERE m.course_id = $1
      `,
            [course.id]
        );

        const modulesCount = Number(stats.rows[0]?.modules_count || 0);
        const totalLessons = Number(stats.rows[0]?.total_lessons || 0);

        // 4) сколько уроков пользователь завершил в этом курсе
        const done = await db.query(
            `
      SELECT COUNT(DISTINCT ulp.lesson_id)::int AS completed_lessons
      FROM user_lesson_progress ulp
      JOIN lessons l ON l.id = ulp.lesson_id
      JOIN modules m ON m.id = l.module_id
      WHERE ulp.user_id = $1
        AND ulp.completed = true
        AND m.course_id = $2
      `,
            [user.id, course.id]
        );

        const completedLessons = Number(done.rows[0]?.completed_lessons || 0);

        const percent =
            totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;

        // 5) lastLesson (последний завершенный)
        const last = await db.query(
            `
      SELECT l.id, l.title
      FROM user_lesson_progress ulp
      JOIN lessons l ON l.id = ulp.lesson_id
      JOIN modules m ON m.id = l.module_id
      WHERE ulp.user_id = $1
        AND ulp.completed = true
        AND m.course_id = $2
      ORDER BY ulp.completed_at DESC NULLS LAST, ulp.id DESC
      LIMIT 1
      `,
            [user.id, course.id]
        );

        const lastLesson = last.rows[0] || null;

        // 6) nextLesson (первый НЕ завершенный по порядку модуля/урока)
        const next = await db.query(
            `
      SELECT l.id, l.title
      FROM lessons l
      JOIN modules m ON m.id = l.module_id
      LEFT JOIN user_lesson_progress ulp
        ON ulp.lesson_id = l.id AND ulp.user_id = $1 AND ulp.completed = true
      WHERE m.course_id = $2
        AND ulp.lesson_id IS NULL
      ORDER BY m.position ASC NULLS LAST, l.position ASC NULLS LAST, l.id ASC
      LIMIT 1
      `,
            [user.id, course.id]
        );

        const nextLesson = next.rows[0] || null;

        return res.status(200).json({
            success: true,
            course,
            totalLessons,
            completedLessons,
            modulesCount,
            percent,
            lastLesson,
            nextLesson,
        });
    } catch (err) {
        console.error("progress/current error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
