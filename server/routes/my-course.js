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
        
        const u = await db.query(
            `SELECT current_level FROM users WHERE id = $1 LIMIT 1`,
            [user.id]
        );
        const currentLevel = u.rows[0]?.current_level;

        if (!currentLevel) {
            return res.status(200).json({
                success: false,
                message: "Уровень пользователя не найден"
            });
        }


        const c = await db.query(
            `
      SELECT id, title, slug, level
      FROM courses
      WHERE level = $1
      ORDER BY position ASC NULLS LAST, id ASC
      LIMIT 1
      `,
            [currentLevel]
        );
        const course = c.rows[0];

        if (!course) {
            return res.status(200).json({
                success: false,
                message: "Курс для уровня не найден"
            });
        }


        await db.query(
            `
      INSERT INTO user_course_progress (user_id, course_id, completed)
      VALUES ($1, $2, false)
      ON CONFLICT (user_id, course_id) DO NOTHING
      `,
            [user.id, course.id]
        );

        return res.status(200).json({ success: true, course });
    } catch (err) {
        console.error("my-course error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
