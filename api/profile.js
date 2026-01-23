const { requireUser } = require("../lib/jwt");
const db = require("../lib/db");

module.exports = async (req, res) => {
    try {
        const user = requireUser(req);

        if (req.method === "GET") {
            const [rows] = await db.query(
                "SELECT id, login, first_name, last_name, avatar FROM users WHERE id=? LIMIT 1",
                [user.id]
            );

            const u = rows && rows[0];
            return res.status(200).json({
                success: true,
                profile: u
                    ? {
                        first_name: u.first_name || "",
                        last_name: u.last_name || "",
                        avatar: u.avatar || "",
                    }
                    : null,
            });
        }

        if (req.method === "POST") {
            const body = req.body || {};
            const first_name = (body.first_name || "").trim();
            const last_name = (body.last_name || "").trim();

            await db.query("UPDATE users SET first_name=?, last_name=? WHERE id=?", [
                first_name,
                last_name,
                user.id,
            ]);

            return res.status(200).json({ success: true });
        }

        res.setHeader("Allow", "GET,POST");
        return res.status(405).json({ success: false, message: "Method Not Allowed" });
    } catch (e) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
};
