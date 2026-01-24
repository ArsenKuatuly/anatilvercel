
async function resetAllProgress(db, userId) {

    if (db && typeof db.query !== "function") {
        throw new Error("resetAllProgress: first argument must be db with .query()");
    }

    const uid = Number(userId);
    if (!Number.isInteger(uid) || uid <= 0) {
        throw new Error(`resetAllProgress: invalid userId = ${JSON.stringify(userId)}`);
    }

    await db.query("DELETE FROM user_lesson_progress WHERE user_id = $1", [uid]);
    await db.query("DELETE FROM user_module_progress WHERE user_id = $1", [uid]);
    await db.query("DELETE FROM user_course_progress WHERE user_id = $1", [uid]);
}

module.exports = { resetAllProgress };
