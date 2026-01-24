const { requireUser } = require("../../../lib/jwt");
const db = require("../../../lib/db");

// GET /api/task/:taskId
module.exports = async (req, res) => {
    try {
        requireUser(req);
    } catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const taskId = Number(req.query?.taskId);
        if (!Number.isFinite(taskId)) {
            return res.status(400).json({ success: false, message: "Invalid taskId" });
        }

        const result = await db.query(
            `SELECT id, title, description, pass_score, course_id
       FROM course_tasks
       WHERE id = $1`,
            [taskId]
        );

        const task = result.rows[0];
        if (!task) return res.status(404).json({ success: false, message: "Task not found" });

        res.json({ success: true, task });
    } catch (err) {
        console.error("task/[taskId] error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
