const bcrypt = require("bcrypt");
const db = require("../../../lib/db");
const { signToken } = require("../../../lib/jwt");

module.exports = async (req, res) => {
    try {
        if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

        const { login, password } = req.body || {};
        if (!login || !password) return res.status(400).json({ success: false, message: "Некорректные данные" });

        const result = await db.query("SELECT * FROM users WHERE login = $1", [login]);
        const user = result.rows[0];


        if (!user) return res.status(401).json({ success: false, message: "Неверный логин или пароль" });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ success: false, message: "Неверный логин или пароль" });

        const role = user.role || "user";
        const token = signToken({ id: user.id, login: user.login, role });

        return res.json({
            success: true,
            token,
            user: { id: user.id, login: user.login, role }
        });
    } catch (err) {
        console.error("login error:", err);
        return res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
};
