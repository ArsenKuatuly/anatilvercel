const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("../../../lib/db");

function hashToken(token) {
    return crypto.createHash("sha256").update(String(token)).digest("hex");
}

module.exports = async (req, res) => {
    try {
        if (req.method !== "POST") {
            res.setHeader("Allow", "POST");
            return res.status(405).json({ success: false, message: "Method not allowed" });
        }

        const token = String(req.body?.token || "").trim();
        const password = String(req.body?.password || "");

        if (!token || !password) {
            return res.status(400).json({ success: false, message: "Укажите токен и новый пароль" });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Пароль должен содержать минимум 6 символов" });
        }

        const tokenHash = hashToken(token);
        const { rows } = await db.query(
            `
                SELECT id, user_id
                FROM password_reset_tokens
                WHERE token_hash = $1
                  AND used_at IS NULL
                  AND expires_at > NOW()
                ORDER BY id DESC
                LIMIT 1
            `,
            [tokenHash]
        );

        const record = rows[0];
        if (!record) {
            return res.status(400).json({ success: false, message: "Ссылка недействительна или срок её действия истёк" });
        }

        const hash = await bcrypt.hash(password, 10);
        await db.query(`UPDATE users SET password = $1 WHERE id = $2`, [hash, record.user_id]);
        await db.query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`, [record.id]);
        await db.query(`DELETE FROM password_reset_tokens WHERE user_id = $1 AND id <> $2`, [record.user_id, record.id]);

        return res.status(200).json({ success: true, message: "Пароль успешно обновлён" });
    } catch (err) {
        console.error("reset-password error:", err);
        return res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
};
