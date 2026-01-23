const { requireUser } = require("../../lib/jwt");

module.exports = async (req, res) => {
    try {
        requireUser(req);
        return res.status(501).json({ success: false, message: "Avatar upload not migrated yet" });
    } catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
};
