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
        const id = Number(req.query.id);
        if (!id) return res.status(400).json({ success: false, message: "Invalid lesson id" });

        const q = await db.query(
            `
      SELECT
        l.id,
        l.title,
        l.content,
        l.position,
        m.id AS module_id,
        m.position AS module_position,
        c.id AS course_id,
        c.slug AS course_slug
      FROM lessons l
      JOIN modules m ON m.id = l.module_id
      JOIN courses c ON c.id = m.course_id
      WHERE l.id = $1
      LIMIT 1
      `,
            [id]
        );

        const row = q.rows[0];
        if (!row) return res.status(404).json({ success: false, message: "Lesson not found" });

        // проверка доступа: модуль не должен быть "закрыт" по логике предыдущих модулей
        // (если модуль не первый — предыдущий модуль должен быть завершён)
        const prev = await db.query(
            `
      SELECT m2.id
      FROM modules m2
      WHERE m2.course_id = $1
        AND COALESCE(m2.position, 0) < COALESCE($2, 0)
      ORDER BY m2.position DESC NULLS LAST, m2.id DESC
      LIMIT 1
      `,
            [row.course_id, row.module_position]
        );

        const prevModule = prev.rows[0];
        if (prevModule) {
            const prevLessons = await db.query(
                `
        SELECT l.id
        FROM lessons l
        WHERE l.module_id = $1
        `,
                [prevModule.id]
            );

            const ids = prevLessons.rows.map(r => r.id);
            if (ids.length > 0) {
                const done = await db.query(
                    `
          SELECT COUNT(*)::int AS cnt
          FROM user_lesson_progress
          WHERE user_id = $1
            AND completed = true
            AND lesson_id = ANY($2::int[])
          `,
                    [user.id, ids]
                );

                if (done.rows[0].cnt !== ids.length) {
                    return res.status(403).json({ success: false, message: "Module is locked" });
                }
            }
        }

        return res.status(200).json({
            success: true,
            lesson: {
                id: row.id,
                title: row.title,
                content: row.content || "",
                courseSlug: row.course_slug,
                courseId: row.course_id,
            },
        });
    } catch (err) {
        console.error("lesson/[id] error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
