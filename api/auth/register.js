const bcrypt = require("bcrypt");
const db = require("../../lib/db");
const { signToken } = require("../../lib/jwt");

async function hasColumn(table, column) {
    const [rows] = await db.execute(
        `SELECT COUNT(*) AS cnt
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
        [table, column]
    );
    return Number(rows[0]?.cnt || 0) > 0;
}

module.exports = async (req, res) => {
    try {
        if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

        const { login, password } = req.body || {};
        if (!login || !password) return res.status(400).json({ success: false, message: "Некорректные данные" });

        const hash = await bcrypt.hash(password, 10);

        const roleExists = await hasColumn("users", "role");

        if (roleExists) {
            await db.execute(
                "INSERT INTO users (login, password, role) VALUES (?, ?, 'user')",
                [login, hash]
            );
        } else {
            await db.execute(
                "INSERT INTO users (login, password) VALUES (?, ?)",
                [login, hash]
            );
        }

        const [rows] = await db.execute("SELECT * FROM users WHERE login = ?", [login]);
        const user = rows[0];

        const role = user?.role || "user";
        const token = signToken({ id: user.id, login: user.login, role });

        return res.json({
            success: true,
            token,
            user: { id: user.id, login: user.login, role }
        });
    } catch (err) {
        if (err?.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ success: false, message: "Пользователь уже существует" });
        }
        console.error("register error:", err);
        return res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
};
