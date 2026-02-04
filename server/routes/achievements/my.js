const { requireUser } = require("../../lib/jwt");
const db = require("../../lib/db");

module.exports = async (req, res) => {
    try {
        const user = requireUser(req);
        const userId = user.id;

        // прогресс по урокам
        const lessonsRes = await db.query(
            `SELECT COUNT(*) FILTER (WHERE completed = true) AS completed_lessons
       FROM lesson_progress
       WHERE user_id = $1`,
            [userId]
        );

        const completedLessons = Number(lessonsRes.rows[0]?.completed_lessons || 0);

        // завершённые модули
        const modulesRes = await db.query(
            `SELECT COUNT(*) AS completed_modules
       FROM course_modules cm
       WHERE NOT EXISTS (
         SELECT 1 FROM lessons l
         LEFT JOIN lesson_progress lp
           ON lp.lesson_id = l.id AND lp.user_id = $1
         WHERE l.module_id = cm.id AND COALESCE(lp.completed, false) = false
       )`,
            [userId]
        );

        const completedModules = Number(modulesRes.rows[0]?.completed_modules || 0);

        // завершённые курсы
        const coursesRes = await db.query(
            `SELECT COUNT(*) AS completed_courses
       FROM courses c
       WHERE NOT EXISTS (
         SELECT 1 FROM lessons l
         LEFT JOIN lesson_progress lp
           ON lp.lesson_id = l.id AND lp.user_id = $1
         WHERE l.course_id = c.id AND COALESCE(lp.completed, false) = false
       )`,
            [userId]
        );

        const completedCourses = Number(coursesRes.rows[0]?.completed_courses || 0);

        const achievements = [];

        if (completedLessons >= 1) {
            achievements.push({
                code: "FIRST_LESSON",
                title: "Первый урок",
                description: "Ты завершил свой первый урок 🎉",
                icon: "award",
            });
        }

        if (completedModules >= 1) {
            achievements.push({
                code: "FIRST_MODULE",
                title: "Первый модуль",
                description: "Первый модуль полностью пройден 💪",
                icon: "star",
            });
        }

        if (completedCourses >= 1) {
            achievements.push({
                code: "FIRST_COURSE",
                title: "Первый курс",
                description: "Ты завершил свой первый курс 🏆",
                icon: "trophy",
            });
        }

        return res.json({ success: true, achievements });
    } catch (e) {
        console.error("achievements/my error:", e);
        return res.status(401).json({ success: false });
    }
};
