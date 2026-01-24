
const db = require("../lib/db");


async function resetAllProgress(userId) {
    await db.query("DELETE FROM user_lesson_progress WHERE user_id = $1", [userId]);
    await db.query("DELETE FROM user_module_progress WHERE user_id = $1", [userId]);
    await db.query("DELETE FROM user_course_progress WHERE user_id = $1", [userId]);
}

module.exports = { resetAllProgress };
