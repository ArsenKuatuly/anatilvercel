const { requireUser } = require("../lib/jwt");

module.exports = async (req, res) => {
    try {
        requireUser(req);
        return res.status(200).json({ success: true, result: null });
    } catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
};
