const db = require("../../lib/db");
const { requireUser } = require("../../lib/jwt");
const { resetAllProgress } = require("../../utils/resetProgress");

// POST /api/save-result
// body: { totalScore, level, reading, listening, math }
module.exports = async (req, res) => {
  let user;
  try {
    user = requireUser(req);
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { totalScore, level, reading, listening, math } = req.body || {};

  // minimal validation to avoid breaking inserts
  if (typeof totalScore !== "number" || !level) {
    return res.status(400).json({ success: false, message: "Некорректные данные" });
  }

  try {
    // 1) сброс прогресса (как в старом MySQL API)
    await resetAllProgress(db, user.id);

    // 2) обновление уровня пользователя
    await db.query(
      `UPDATE users SET current_level = $1 WHERE id = $2`,
      [level, user.id]
    );

    // 3) сохранение результата
    await db.query(
      `
        INSERT INTO test_results
          (user_id, total_score, level, reading_score, listening_score, math_score)
        VALUES
          ($1, $2, $3, $4, $5, $6)
      `,
      [user.id, totalScore, level, reading ?? null, listening ?? null, math ?? null]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("save-result error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
