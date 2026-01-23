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

module.exports = async (req, res) => {
    let user;
    try {
        user = requireUser(req);
    } catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ success: false });
    }

    try {
        const form = new IncomingForm({
            multiples: false,
            maxFileSize: 2 * 1024 * 1024, // 2MB
            filter: (part) =>
                part.mimetype && part.mimetype.startsWith("image/")
        });

        const { files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) return reject(err);
                resolve({ fields, files });
            });
        });

        const file = files.avatar;
        if (!file) {
            return res.status(400).json({ success: false, message: "Avatar file required" });
        }

        const filepath = file.filepath || file.path;
        const mimetype = file.mimetype || "image/png";

        const ext =
            mimetype.includes("jpeg") ? "jpg" :
                mimetype.includes("png") ? "png" :
                    mimetype.includes("webp") ? "webp" :
                        "png";

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

        return res.json({ success: true, avatar: avatarUrl });
    } catch (err) {
        console.error("profile/avatar error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
