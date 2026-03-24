const { requireUser } = require("../../lib/jwt");
const db = require("../../lib/db");

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

    const result = await db.query(
      `
      SELECT
        c.id,
        c.slug,
        c.title,
        c.level,
        COALESCE(ucp.final_score, 0) AS final_score,
        COALESCE(ucp.completed_at, uc.completed_at, NOW()) AS issued_at,
        (COALESCE(ucp.final_passed, FALSE) OR COALESCE(ucp.completed, FALSE) OR COALESCE(uc.final_passed, FALSE) OR COALESCE(uc.completed, FALSE)) AS has_certificate
      FROM courses c
      LEFT JOIN user_course_progress ucp
        ON ucp.course_id = c.id AND ucp.user_id = $1
      LEFT JOIN user_courses uc
        ON uc.course_id = c.id AND uc.user_id = $1
      WHERE (COALESCE(ucp.final_passed, FALSE) OR COALESCE(ucp.completed, FALSE) OR COALESCE(uc.final_passed, FALSE) OR COALESCE(uc.completed, FALSE)) = TRUE
      ORDER BY COALESCE(ucp.completed_at, uc.completed_at, NOW()) DESC, c.id DESC
      `,
      [userId]
    );

    const certificates = result.rows.map((row) => {
      const meta = LEVEL_META[row.level] || { cefr: String(row.level || "").toUpperCase(), label: row.level || "" };
      return {
        courseId: row.id,
        courseSlug: row.slug,
        courseTitle: row.title || "Курс казахского языка",
        level: row.level,
        levelLabel: meta.label,
        cefr: meta.cefr,
        finalScore: Number(row.final_score || 0),
        issuedAt: formatIssuedAt(row.issued_at),
        issuedAtRaw: row.issued_at,
        certificateNumber: `ANATIL-${row.id}-${userId}`,
        url: `/certificate.html?courseId=${row.id}`,
      };
    });

    return res.json({ success: true, certificates });
  } catch (e) {
    console.error("my-certificates error:", e);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
