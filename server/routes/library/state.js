const { requireUser } = require("../../../lib/jwt");
const db = require("../../../lib/db");

function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
}

module.exports = async (req, res) => {
    try {
        const user = requireUser(req);
        const userId = user.id;

        const body = req.body || {};
        const materialId = String(body.materialId || "").trim();

        if (!materialId) {
            return res.status(400).json({ success: false, message: "materialId is required" });
        }


        const mat = await db.query(`SELECT id FROM library_materials WHERE id = $1 LIMIT 1`, [materialId]);
        if (!mat.rows[0]) {
            return res.status(404).json({ success: false, message: "Material not found" });
        }

        const currentRes = await db.query(
            `SELECT progress, is_saved, words_saved
             FROM library_user_state
             WHERE user_id = $1 AND material_id = $2
             LIMIT 1`,
            [userId, materialId]
        );
        const current = currentRes.rows[0] || {};

        const hasProgress = body.progress !== undefined && body.progress !== null && body.progress !== "";
        const hasSaved = body.isSaved !== undefined && body.isSaved !== null;
        const hasWordsSaved = body.wordsSaved !== undefined && body.wordsSaved !== null;

        const nextProgress = hasProgress ? clamp(Number(body.progress) || 0, 0, 100) : clamp(Number(current.progress) || 0, 0, 100);
        const nextIsSaved = hasSaved ? !!body.isSaved : !!current.is_saved;
        const nextWordsSaved = hasWordsSaved ? (typeof body.wordsSaved === "object" ? body.wordsSaved : {}) : (current.words_saved || {});

        await db.query(
            `INSERT INTO library_user_state (user_id, material_id, progress, is_saved, words_saved, updated_at)
             VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
             ON CONFLICT (user_id, material_id)
             DO UPDATE SET
               progress = EXCLUDED.progress,
               is_saved = EXCLUDED.is_saved,
               words_saved = EXCLUDED.words_saved,
               updated_at = NOW()`,
            [userId, materialId, nextProgress, nextIsSaved, JSON.stringify(nextWordsSaved)]
        );

        return res.status(200).json({
            success: true,
            materialId,
            progress: nextProgress,
            isSaved: nextIsSaved,
            wordsSaved: nextWordsSaved
        });
    } catch (e) {
        const msg = String(e && e.message ? e.message : "Server error");
        const code = msg.toLowerCase().includes("unauthorized") ? 401 : 500;
        return res.status(code).json({ success: false, message: code === 401 ? "Unauthorized" : "Server error" });
    }
};
