const bcrypt = require("bcrypt");
const db = require("../../../lib/db");
const { signToken } = require("../../../lib/jwt");

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

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

        const login = String(req.body?.login || "").trim();
        const password = String(req.body?.password || "");
        const email = String(req.body?.email || "").trim().toLowerCase();

        if (!login || !password || !email) {
            return res.status(400).json({ success: false, message: "Заполните логин, email и пароль" });
        }

        if (login.length < 3) {
            return res.status(400).json({ success: false, message: "Логин должен содержать минимум 3 символа" });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Пароль должен содержать минимум 6 символов" });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, message: "Введите корректный email" });
        }

        const hash = await bcrypt.hash(password, 10);
        const roleExists = await hasColumn("users", "role");

        let query;
        if (roleExists) {
            query = `
                WITH new_user AS (
                    INSERT INTO users (login, password, role)
                    VALUES ($1, $2, 'user')
                    RETURNING id, login, role
                ), new_profile AS (
                    INSERT INTO user_profiles (user_id, email, updated_at)
                    SELECT id, $3, NOW()
                    FROM new_user
                    RETURNING user_id
                )
                SELECT id, login, role
                FROM new_user
                LIMIT 1
            `;
        } else {
            query = `
                WITH new_user AS (
                    INSERT INTO users (login, password)
                    VALUES ($1, $2)
                    RETURNING id, login
                ), new_profile AS (
                    INSERT INTO user_profiles (user_id, email, updated_at)
                    SELECT id, $3, NOW()
                    FROM new_user
                    RETURNING user_id
                )
                SELECT id, login, 'user' AS role
                FROM new_user
                LIMIT 1
            `;
        }

        const ins = await db.query(query, [login, hash, email]);
        const user = ins.rows[0];
        const token = signToken({ id: user.id, login: user.login, role: user.role || "user" });

        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                login: user.login,
                email,
                role: user.role || "user",
            },
        });
    } catch (err) {
        if (err?.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Пользователь с таким логином или email уже существует",
            });
        }

        console.error("register error:", err);
        return res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
};
