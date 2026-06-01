const { requireUser } = require("../../../lib/jwt");
const db = require("../../../lib/db");

const LEVEL_META = {
  elementary: { cefr: "A1", label: "Элементарный уровень" },
  basic: { cefr: "A2", label: "Базовый уровень" },
  intermediate: { cefr: "B1", label: "Средний уровень" },
  upper: { cefr: "B2", label: "Уровень выше среднего" },
  advanced: { cefr: "C1", label: "Высокий уровень" },
};

function formatIssuedAt(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Qyzylorda",
  }).format(date);
}

module.exports = async (req, res) => {
  try {
    const user = requireUser(req);
    const userId = user.id;
    const courseId = Number(req.query?.courseId || req.params?.courseId);

    if (!courseId) {
      return res.status(400).json({ success: false, message: "courseId is required" });
    }

    const result = await db.query(
      `
      SELECT
        c.id,
        c.slug,
        c.title,
        c.level,
        (COALESCE(ucp.final_passed, FALSE) OR COALESCE(ucp.completed, FALSE) OR COALESCE(uc.final_passed, FALSE) OR COALESCE(uc.completed, FALSE)) AS has_certificate,
        (COALESCE(ucp.final_passed, FALSE) OR COALESCE(uc.final_passed, FALSE)) AS final_passed,
        ucp.final_score,
        COALESCE(ucp.completed_at, uc.completed_at, NOW()) AS issued_at,
        COALESCE(NULLIF(TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))), ''), u.login) AS full_name,
        u.login
      FROM courses c
      LEFT JOIN user_course_progress ucp
        ON ucp.course_id = c.id AND ucp.user_id = $1
      LEFT JOIN user_courses uc
        ON uc.course_id = c.id AND uc.user_id = $1
      JOIN users u ON u.id = $1
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE c.id = $2
      LIMIT 1
      `,
      [userId, courseId]
    );

    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (!row.has_certificate) {
      return res.status(403).json({ success: false, message: "Certificate is not available yet" });
    }

    const levelMeta = LEVEL_META[row.level] || { cefr: String(row.level || "").toUpperCase(), label: row.level || "" };

    return res.json({
      success: true,
      certificate: {
        courseId: row.id,
        courseSlug: row.slug,
        courseTitle: row.title || "Курс казахского языка",
        level: row.level,
        levelLabel: levelMeta.label,
        cefr: levelMeta.cefr,
        fullName: row.full_name,
        score: row.final_score,
        issuedAt: formatIssuedAt(row.issued_at),
        issuedAtRaw: row.issued_at,
        certificateNumber: `ANATIL-${row.id}-${userId}`,
      },
    });
  } catch (e) {
    console.error("certificate/[courseId] error:", e);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
