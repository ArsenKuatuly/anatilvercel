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
        const slug = req.query.slug;

        if (!slug) {
            return res.status(400).json({ success: false, message: "Missing slug" });
        }

        // 1) курс
        const c = await db.query(
            `SELECT id, slug, title, level, position FROM courses WHERE slug = $1 LIMIT 1`,
            [slug]
        );

        const course = c.rows[0];
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        // 2) модули
        const m = await db.query(
            `
      SELECT id, course_id, title, position, COALESCE(is_locked, true) AS is_locked
      FROM modules
      WHERE course_id = $1
      ORDER BY position ASC NULLS LAST, id ASC
      `,
            [course.id]
        );

        const modules = m.rows;

        // 3) уроки одним запросом
        const l = await db.query(
            `
      SELECT l.id, l.module_id, l.title, l.position
      FROM lessons l
      JOIN modules m ON m.id = l.module_id
      WHERE m.course_id = $1
      ORDER BY m.position ASC NULLS LAST, l.position ASC NULLS LAST, l.id ASC
      `,
            [course.id]
        );

        const lessons = l.rows;

        // 4) прогресс пользователя по урокам курса
        const p = await db.query(
            `
      SELECT ulp.lesson_id, ulp.completed
      FROM user_lesson_progress ulp
      JOIN lessons l ON l.id = ulp.lesson_id
      JOIN modules m ON m.id = l.module_id
      WHERE ulp.user_id = $1
        AND m.course_id = $2
      `,
            [user.id, course.id]
        );

        const completedSet = new Set(p.rows.filter(r => r.completed).map(r => r.lesson_id));

        // 5) соберём modules -> lessons + логика lock
        const lessonsByModule = new Map();
        for (const lesson of lessons) {
            if (!lessonsByModule.has(lesson.module_id)) lessonsByModule.set(lesson.module_id, []);
            lessonsByModule.get(lesson.module_id).push({
                id: lesson.id,
                title: lesson.title,
                completed: completedSet.has(lesson.id),
            });
        }

        // helper: модуль completed если все уроки completed
        const moduleCompletedFlags = [];
        for (const mod of modules) {
            const modLessons = lessonsByModule.get(mod.id) || [];
            const total = modLessons.length;
            const done = modLessons.filter(x => x.completed).length;
            moduleCompletedFlags.push(total > 0 && done === total);
        }

        // lock: первый модуль открыт, остальные — если предыдущий модуль завершён
        const outModules = modules.map((mod, idx) => {
            const prevDone = idx === 0 ? true : moduleCompletedFlags[idx - 1];
            const locked = idx === 0 ? false : !prevDone;

            const modLessons = lessonsByModule.get(mod.id) || [];

            return {
                id: mod.id,
                title: mod.title,
                locked,
                lessons: modLessons,
            };
        });

        return res.status(200).json({
            success: true,
            course,
            modules: outModules,
        });
    } catch (err) {
        console.error("course/[slug] error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
