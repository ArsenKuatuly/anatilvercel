const { requireUser } = require("../lib/jwt");
const db = require("../lib/db");

module.exports = async (req, res) => {
    let user;
    try {
        user = requireUser(req);
    } catch (e) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        if (req.method === "GET") {
            const { rows } = await db.query(
                `
                    SELECT
                        u.id,
                        u.login,
                        COALESCE(p.first_name, '') AS first_name,
                        COALESCE(p.last_name, '')  AS last_name,
                        COALESCE(p.phone, '')      AS phone,
                        COALESCE(p.email, '')      AS email,
                        COALESCE(p.location, '')   AS location,
                        COALESCE(p.avatar, u.avatar, '') AS avatar
                    FROM users u
                             LEFT JOIN user_profiles p ON p.user_id = u.id
                    WHERE u.id = $1
                        LIMIT 1
                `,
                [user.id]
            );

            const r = rows[0];
            return res.status(200).json({
                success: true,
                profile: r
                    ? {
                        first_name: r.first_name,
                        last_name: r.last_name,
                        phone: r.phone,
                        email: r.email,
                        location: r.location,
                        avatar: r.avatar,
                    }
                    : null,
            });
        }

        if (req.method === "POST") {
            const body = req.body || {};
            const first_name = (body.first_name || "").trim();
            const last_name = (body.last_name || "").trim();
            const phone = (body.phone || "").trim();
            const email = (body.email || "").trim();
            const location = (body.location || "").trim();

            // update, если профиль есть; иначе insert
            await db.query(
                `
                    WITH updated AS (
                    UPDATE user_profiles
                    SET first_name = $1,
                        last_name  = $2,
                        phone      = $3,
                        email      = $4,
                        location   = $5,
                        updated_at = NOW()
                    WHERE user_id = $6
                        RETURNING id
        )
                    INSERT INTO user_profiles (user_id, first_name, last_name, phone, email, location, updated_at)
                    SELECT $6, $1, $2, $3, $4, $5, NOW()
                        WHERE NOT EXISTS (SELECT 1 FROM updated)
                `,
                [first_name, last_name, phone, email, location, user.id]
            );

            return res.status(200).json({ success: true });
        }

        res.setHeader("Allow", "GET, POST");
        return res.status(405).json({ success: false, message: "Method Not Allowed" });
    } catch (err) {
        console.error("profile error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
