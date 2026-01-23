const { requireUser } = require("../lib/jwt");
const db = require("../lib/db");

module.exports = async (req, res) => {
    let user;
    try {
        user = requireUser(req);
    } catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        // берём текущий уровень пользователя и первый курс этого уровня
        const u = await db.query(`SELECT current_level FROM users WHERE id = $1 LIMIT 1`, [user.id]);
        const level = u.rows[0]?.current_level || "elementary";

        const c = await db.query(
            `
      SELECT id
      FROM courses
      WHERE level = $1
      ORDER BY position ASC, id ASC
      LIMIT 1
      `,
            [level]
        );

        const courseId = c.rows[0]?.id;
        if (!courseId) return res.status(200).json({ success: false });

        // следующий урок = первый НЕ завершённый по порядку
        const next = await db.query(
            `
      SELECT l.id
      FROM lessons l
      JOIN modules m ON m.id = l.module_id
      LEFT JOIN user_lesson_progress ulp
        ON ulp.lesson_id = l.id
       AND ulp.user_id = $1
       AND ulp.completed = true
      WHERE m.course_id = $2
        AND ulp.lesson_id IS NULL
      ORDER BY m.position ASC NULLS LAST, l.position ASC NULLS LAST, l.id ASC
      LIMIT 1
      `,
            [user.id, courseId]
        );

        const lessonId = next.rows[0]?.id;
        if (!lessonId) return res.status(200).json({ success: false });

        return res.status(200).json({ success: true, lessonId });
    } catch (err) {
        console.error("continue-lesson error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
