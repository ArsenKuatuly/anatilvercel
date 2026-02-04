const { requireUser } = require("../../../lib/jwt");
const db = require("../../../lib/db");

module.exports = async (req, res) => {
    try {
        const user = requireUser(req);
        const userId = user.id;

        const lessonsRes = await db.query(
            `SELECT COUNT(*) FILTER (WHERE completed = true) AS completed_lessons
             FROM user_lesson_progress
             WHERE user_id = $1`,
            [userId]
        );

        const completedLessons = Number(lessonsRes.rows[0]?.completed_lessons || 0);

        const modulesRes = await db.query(
            `SELECT COUNT(*)::int AS completed_modules
             FROM modules m
             WHERE EXISTS (
                 SELECT 1 FROM lessons l WHERE l.module_id = m.id
             )
               AND NOT EXISTS (
                 SELECT 1
                 FROM lessons l
                          LEFT JOIN user_lesson_progress ulp
                                    ON ulp.lesson_id = l.id AND ulp.user_id = $1 AND ulp.completed = true
                 WHERE l.module_id = m.id AND ulp.lesson_id IS NULL
             )`,
            [userId]
        );

        const completedModules = Number(modulesRes.rows[0]?.completed_modules || 0);

        const coursesRes = await db.query(
            `SELECT COUNT(*)::int AS completed_courses
             FROM courses c
             WHERE EXISTS (
                 SELECT 1 FROM modules m JOIN lessons l ON l.module_id = m.id WHERE m.course_id = c.id
             )
               AND NOT EXISTS (
                 SELECT 1
                 FROM lessons l
                          JOIN modules m ON m.id = l.module_id
                          LEFT JOIN user_lesson_progress ulp
                                    ON ulp.lesson_id = l.id AND ulp.user_id = $1 AND ulp.completed = true
                 WHERE m.course_id = c.id AND ulp.lesson_id IS NULL
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
