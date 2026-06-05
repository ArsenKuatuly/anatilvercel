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


    const c = await db.query(
      `SELECT id, slug, title, level, position
       FROM courses
       WHERE slug = $1
       LIMIT 1`,
      [slug]
    );

    const courseRow = c.rows[0];
    if (!courseRow) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }


    await db.query(
      `INSERT INTO user_course_progress (user_id, course_id, completed, final_passed)
       VALUES ($1, $2, false, false)
       ON CONFLICT (user_id, course_id) DO NOTHING`,
      [user.id, courseRow.id]
    );


    const prog = await db.query(
      `SELECT completed, final_passed, final_score
       FROM user_course_progress
       WHERE user_id = $1 AND course_id = $2
       LIMIT 1`,
      [user.id, courseRow.id]
    );

    const progress = prog.rows[0] || { completed: false, final_passed: false, final_score: null };

    const course = {
      ...courseRow,
      completed: !!progress.completed,
      final_passed: !!progress.final_passed,
      final_score: progress.final_score,
    };

    const m = await db.query(
      `SELECT id, course_id, title, position
       FROM modules
       WHERE course_id = $1
       ORDER BY position ASC NULLS LAST, id ASC`,
      [course.id]
    );
    const modules = m.rows;

    const l = await db.query(
      `SELECT l.id, l.module_id, l.title, l.position
       FROM lessons l
       JOIN modules m ON m.id = l.module_id
       WHERE m.course_id = $1
       ORDER BY m.position ASC NULLS LAST, l.position ASC NULLS LAST, l.id ASC`,
      [course.id]
    );
    const lessons = l.rows;


    const p = await db.query(
      `SELECT ulp.lesson_id, ulp.completed
       FROM user_lesson_progress ulp
       JOIN lessons l ON l.id = ulp.lesson_id
       JOIN modules m ON m.id = l.module_id
       WHERE ulp.user_id = $1
         AND m.course_id = $2`,
      [user.id, course.id]
    );

    const completedSet = new Set(p.rows.filter(r => r.completed).map(r => r.lesson_id));

    const lessonsByModule = new Map();
    for (const lesson of lessons) {
      if (!lessonsByModule.has(lesson.module_id)) lessonsByModule.set(lesson.module_id, []);
      lessonsByModule.get(lesson.module_id).push({
        id: lesson.id,
        title: lesson.title,
        position: lesson.position,
        completed: completedSet.has(lesson.id),
      });
    }

    const moduleCompletedFlags = modules.map(mod => {
      const modLessons = lessonsByModule.get(mod.id) || [];
      return modLessons.length > 0 && modLessons.every(x => !!x.completed);
    });


    const outModules = modules.map((mod, idx) => {
      const locked = idx === 0 ? false : !moduleCompletedFlags[idx - 1];
      const modLessons = lessonsByModule.get(mod.id) || [];

      return {
        id: mod.id,
        title: mod.title,
        position: mod.position,
        locked,
        completed: !!moduleCompletedFlags[idx],
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
