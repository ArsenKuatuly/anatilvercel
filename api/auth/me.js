const { verifyToken } = require("../../lib/jwt");

module.exports = async (req, res) => {
    if (req.method !== "GET") {
        return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    try {
        const auth = req.headers.authorization || "";
        const m = auth.match(/^Bearer\s+(.+)$/i);
        if (!m) return res.status(401).json({ success: false, message: "Unauthorized" });

        const token = m[1];
        const payload = verifyToken(token);

        return res.json({
            success: true,
            user: {
                id: payload.id,
                login: payload.login,
                role: payload.role || "user"
            }
        });
    } catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
};
