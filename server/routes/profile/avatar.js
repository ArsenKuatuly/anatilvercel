const { requireUser } = require("../../../lib/jwt");
const db = require("../../../lib/db");

const { createClient } = require("@supabase/supabase-js");
const { IncomingForm } = require("formidable");
const fs = require("fs");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function publicAvatarUrl(path) {
    return `${process.env.SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
}

function pickFirstFile(files) {
    if (!files || typeof files !== "object") return null;

    // сначала пробуем стандартное имя поля
    let f = files.avatar;

    // если нет — берём первый попавшийся файл
    if (!f) {
        const firstKey = Object.keys(files)[0];
        f = firstKey ? files[firstKey] : null;
    }

    // formidable иногда возвращает массив
    if (Array.isArray(f)) f = f[0];

    return f || null;
}

function getFilePath(file) {
    if (!file) return null;

    // разные версии formidable
    return (
        file.filepath ||
        file.path ||
        file?.toJSON?.().filepath ||
        file?.toJSON?.().path ||
        null
    );
}

function getMimeType(file) {
    return (
        file?.mimetype ||
        file?.type ||
        file?.toJSON?.().mimetype ||
        "application/octet-stream"
    );
}

function extFromMime(mimetype) {
    const mt = String(mimetype || "").toLowerCase();
    if (mt.includes("jpeg") || mt.includes("jpg")) return "jpg";
    if (mt.includes("png")) return "png";
    if (mt.includes("webp")) return "webp";
    if (mt.includes("gif")) return "gif";
    return "png";
}

module.exports = async (req, res) => {
    let user;
    try {
        user = requireUser(req);
    } catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ success: false, message: "Method Not Allowed" });
    }

    try {
        const form = new IncomingForm({
            multiples: false,
            maxFileSize: 2 * 1024 * 1024, // 2MB
            // на некоторых окружениях помогает явно
            keepExtensions: true,
            filter: (part) => part.mimetype && part.mimetype.startsWith("image/")
        });

        const { files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) return reject(err);
                resolve({ fields, files });
            });
        });

        const file = pickFirstFile(files);
        if (!file) {
            return res.status(400).json({ success: false, message: "Avatar file required" });
        }

        const filepath = getFilePath(file);
        if (!filepath) {
            console.error("Formidable file object:", file);
            return res.status(400).json({
                success: false,
                message: "Upload failed: file path missing"
            });
        }

        const mimetype = getMimeType(file);
        const ext = extFromMime(mimetype);

        const storagePath = `user_${user.id}/${Date.now()}.${ext}`;
        const buffer = fs.readFileSync(filepath);

        const upload = await supabase.storage
            .from("avatars")
            .upload(storagePath, buffer, {
                contentType: mimetype,
                upsert: true
            });

        if (upload.error) {
            console.error("Supabase upload error:", upload.error);
            return res.status(500).json({ success: false, message: "Upload failed" });
        }

        const avatarUrl = publicAvatarUrl(storagePath);

        await db.query(
            `
                INSERT INTO user_profiles (user_id, avatar, updated_at)
                VALUES ($1, $2, NOW())
                    ON CONFLICT (user_id)
      DO UPDATE SET avatar = EXCLUDED.avatar, updated_at = NOW()
            `,
            [user.id, avatarUrl]
        );

        return res.status(200).json({ success: true, avatar: avatarUrl });
    } catch (err) {
        console.error("profile/avatar error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
