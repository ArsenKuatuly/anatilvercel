const crypto = require("crypto");
const db = require("../../../lib/db");

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function hashToken(token) {
    return crypto.createHash("sha256").update(String(token)).digest("hex");
}

async function sendResetEmail(to, resetUrl) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESET_FROM_EMAIL || "onboarding@resend.dev";

    if (!apiKey) {
        return { delivered: false, reason: "missing_api_key" };
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to: [to],
            subject: "Сброс пароля AnaTil",
            html: `
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
                    <h2 style="margin:0 0 16px">Сброс пароля</h2>
                    <p>Нажмите на кнопку ниже, чтобы задать новый пароль для аккаунта AnaTil.</p>
                    <p style="margin:24px 0">
                        <a href="${resetUrl}" style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;display:inline-block">Сбросить пароль</a>
                    </p>
                    <p>Если кнопка не открывается, используйте эту ссылку:</p>
                    <p><a href="${resetUrl}">${resetUrl}</a></p>
                    <p>Ссылка действует ограниченное время.</p>
                </div>
            `,
        }),
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Resend error: ${response.status} ${text}`);
    }

    return { delivered: true };
}

module.exports = async (req, res) => {
    try {
        if (req.method !== "POST") {
            res.setHeader("Allow", "POST");
            return res.status(405).json({ success: false, message: "Method not allowed" });
        }

        const email = String(req.body?.email || "").trim().toLowerCase();
        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, message: "Введите корректный email" });
        }

        const { rows } = await db.query(
            `
                SELECT u.id, u.login, p.email
                FROM users u
                INNER JOIN user_profiles p ON p.user_id = u.id
                WHERE lower(p.email) = $1
                LIMIT 1
            `,
            [email]
        );

        const user = rows[0];
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "Если такой email существует, мы отправили письмо со ссылкой для сброса пароля",
            });
        }

        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = hashToken(rawToken);
        const ttlMinutes = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 30);
        const appUrl = (process.env.APP_URL || "").replace(/\/$/, "");
        const resetUrl = `${appUrl || ""}/reset-password.html?token=${encodeURIComponent(rawToken)}`;

        await db.query(
            `DELETE FROM password_reset_tokens WHERE user_id = $1 OR expires_at < NOW() OR used_at IS NOT NULL`,
            [user.id]
        );

        await db.query(
            `
                INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
                VALUES ($1, $2, NOW() + ($3::text || ' minutes')::interval, NOW())
            `,
            [user.id, tokenHash, String(ttlMinutes)]
        );

        let delivered = false;
        try {
            const sendResult = await sendResetEmail(user.email, resetUrl);
            delivered = !!sendResult.delivered;
        } catch (emailError) {
            console.error("forgot-password email error:", emailError);
        }

        return res.status(200).json({
            success: true,
            message: delivered
                ? "Письмо для сброса пароля отправлено"
                : "Ссылка для сброса создана. Подключите Resend, чтобы письма отправлялись автоматически",
            resetUrl: delivered ? undefined : resetUrl,
        });
    } catch (err) {
        console.error("forgot-password error:", err);
        return res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
};
