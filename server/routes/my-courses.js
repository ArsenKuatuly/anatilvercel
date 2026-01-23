const { requireUser } = require("../../lib/jwt");
const db = require("../../lib/db");

module.exports = async (req, res) => {
    let user;
    try {
        user = requireUser(req);
    } catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        // текущий уровень пользователя (если поле есть)
        const u = await db.query(`SELECT current_level FROM users WHERE id = $1 LIMIT 1`, [user.id]);
        const currentLevel = u.rows[0]?.current_level || null;

        // берём курсы (если currentLevel есть — сначала его, но отдаём все)
        const coursesQ = await db.query(
            `
      SELECT id, slug, title, level, position
      FROM courses
      ORDER BY
        CASE WHEN $1 IS NOT NULL AND level = $1 THEN 0 ELSE 1 END,
        position ASC NULLS LAST,
        id ASC
      `,
            [currentLevel]
        );

        const courses = coursesQ.rows;

        if (courses.length === 0) {
            return res.status(200).json({ success: true, currentLevel, courses: [] });
        }

        // считаем уроки и завершенные уроки по каждому курсу
        const statsQ = await db.query(
            `
      SELECT
        c.id AS course_id,
        COUNT(DISTINCT l.id)::int AS total_lessons,
        COUNT(DISTINCT CASE WHEN ulp.completed = true THEN l.id END)::int AS completed_lessons
      FROM courses c
      LEFT JOIN modules m ON m.course_id = c.id
      LEFT JOIN lessons l ON l.module_id = m.id
      LEFT JOIN user_lesson_progress ulp
        ON ulp.lesson_id = l.id
       AND ulp.user_id = $1
      GROUP BY c.id
      `,
            [user.id]
        );

        const byCourse = new Map(
            statsQ.rows.map(r => [Number(r.course_id), { total: Number(r.total_lessons||0), done: Number(r.completed_lessons||0) }])
        );

        // nextLesson по каждому курсу (первый незавершенный в порядке модуль/урок)
        const nextQ = await db.query(
            `
      SELECT DISTINCT ON (c.id)
        c.id AS course_id,
        l.id AS lesson_id,
        l.title AS lesson_title
      FROM courses c
      JOIN modules m ON m.course_id = c.id
      JOIN lessons l ON l.module_id = m.id
      LEFT JOIN user_lesson_progress ulp
        ON ulp.lesson_id = l.id
       AND ulp.user_id = $1
       AND ulp.completed = true
      WHERE ulp.lesson_id IS NULL
      ORDER BY
        c.id,
        m.position ASC NULLS LAST, l.position ASC NULLS LAST, l.id ASC
      `,
            [user.id]
        );

        const nextByCourse = new Map(
            nextQ.rows.map(r => [Number(r.course_id), { id: Number(r.lesson_id), title: r.lesson_title }])
        );

        const out = courses.map(c => {
            const s = byCourse.get(Number(c.id)) || { total: 0, done: 0 };
            const percent = s.total > 0 ? Math.min(100, Math.round((s.done / s.total) * 100)) : 0;

            return {
                id: c.id,
                slug: c.slug,
                title: c.title,
                level: c.level,
                position: c.position,
                totalLessons: s.total,
                completedLessons: s.done,
                percent,
                nextLesson: nextByCourse.get(Number(c.id)) || null
            };
        });

        return res.status(200).json({
            success: true,
            currentLevel,
            courses: out
        });
    } catch (err) {
        console.error("my-courses error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
