const { requireUser } = require("../../../lib/jwt");
const db = require("../../../lib/db");

module.exports = async (req, res) => {
    try {
        const user = requireUser(req);
        const userId = user.id;

        const matsRes = await db.query(
            `SELECT id, title, description, type, category, level, duration, icon, sort_order
             FROM library_materials
             ORDER BY sort_order ASC, created_at ASC`,
            []
        );

        const stateRes = await db.query(
            `SELECT material_id, progress, is_saved, words_saved, updated_at
             FROM library_user_state
             WHERE user_id = $1`,
            [userId]
        );

        const stateById = new Map();
        let lastOpenedId = null;
        let lastOpenedAt = null;

        for (const s of stateRes.rows) {
            const id = String(s.material_id);
            stateById.set(id, {
                progress: Number(s.progress || 0),
                isSaved: !!s.is_saved,
                wordsSaved: s.words_saved || {},
                updatedAt: s.updated_at
            });

            if (s.updated_at && (!lastOpenedAt || new Date(s.updated_at) > new Date(lastOpenedAt))) {
                lastOpenedAt = s.updated_at;
                lastOpenedId = id;
            }
        }

        const materials = matsRes.rows.map((m) => {
            const id = String(m.id);
            const st = stateById.get(id);
            return {
                id,
                title: m.title,
                description: m.description,
                type: m.type,
                category: m.category,
                level: m.level,
                duration: m.duration,
                icon: m.icon,
                sortOrder: Number(m.sort_order || 0),
                progress: st ? Math.max(0, Math.min(100, Number(st.progress || 0))) : 0,
                isSaved: st ? !!st.isSaved : false,
                wordsSaved: st ? (st.wordsSaved || {}) : {}
            };
        });

        return res.status(200).json({
            success: true,
            lastOpenedId,
            materials
        });
    } catch (e) {
        const msg = String(e && e.message ? e.message : "Server error");
        const code = msg.toLowerCase().includes("unauthorized") ? 401 : 500;
        return res.status(code).json({ success: false, message: code === 401 ? "Unauthorized" : "Server error" });
    }
};
