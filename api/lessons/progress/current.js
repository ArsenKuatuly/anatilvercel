const { requireUser } = require("../../../lib/jwt");

module.exports = async (req, res) => {
    try {
        requireUser(req);
        return res.status(200).json({
            success: true,
            course: null,
            totalLessons: 0,
            completedLessons: 0,
            modulesCount: 0,
            percent: 0,
            nextLesson: null,
        });
    } catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
};
