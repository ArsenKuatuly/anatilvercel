const bcrypt = require("bcrypt");
const db = require("../../../lib/db");
const { signToken } = require("../../../lib/jwt");

// Check column existence in Postgres (Supabase)
async function hasColumn(tableName, columnName, schema = "public") {
    const q = `
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = $1
      AND table_name = $2
      AND column_name = $3
    LIMIT 1
  `;
    const { rows } = await db.query(q, [schema, tableName, columnName]);
    return rows.length > 0;
}

module.exports = async (req, res) => {
    try {
        if (req.method !== "POST") {
            res.setHeader("Allow", "POST");
            return res.status(405).json({ success: false, message: "Method not allowed" });
        }

        const { login, password } = req.body || {};
        const cleanLogin = (login || "").trim();

        if (!cleanLogin || !password) {
            return res.status(400).json({ success: false, message: "Некорректные данные" });
        }

        const hash = await bcrypt.hash(password, 10);

        // Safe-guard: if role column exists, set it on insert.
        const roleExists = await hasColumn("users", "role");

        let user;

        if (roleExists) {
            const ins = await db.query(
                "INSERT INTO users (login, password, role) VALUES ($1, $2, 'user') RETURNING id, login, role",
                [cleanLogin, hash]
            );
            user = ins.rows[0];
        } else {
            const ins = await db.query(
                "INSERT INTO users (login, password) VALUES ($1, $2) RETURNING id, login",
                [cleanLogin, hash]
            );
            user = ins.rows[0];
            user.role = "user";
        }

        const role = user?.role || "user";
        const token = signToken({ id: user.id, login: user.login, role });

        return res.json({
            success: true,
            token,
            user: { id: user.id, login: user.login, role },
        });
    } catch (err) {
        // Postgres unique_violation
        if (err?.code === "23505") {
            return res.status(409).json({ success: false, message: "Пользователь уже существует" });
        }

        console.error("register error:", err);
        return res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
};
