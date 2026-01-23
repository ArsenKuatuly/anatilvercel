const { requireUser } = require("../../../../lib/jwt");
const db = require("../../../../lib/db");

module.exports = async (req, res) => {
    let user;
    try {
        user = requireUser(req);
    } catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        if (req.method !== "POST") {
            res.setHeader("Allow", "POST");
            return res.status(405).json({ success: false, message: "Method Not Allowed" });
        }

        const taskId = Number(req.query.taskId);
        if (!taskId) return res.status(400).json({ success: false, message: "Invalid taskId" });


        const body = req.body || {};
        const answersInput = body.answers;


        const q = await db.query(
            `
      SELECT id, correct_option
      FROM task_questions
      WHERE task_id = $1
      `,
            [taskId]
        );

        const correctById = new Map(q.rows.map(r => [Number(r.id), String(r.correct_option)]));


        const answersMap = new Map();

        if (Array.isArray(answersInput)) {
            for (const a of answersInput) {
                const qid = Number(a.questionId ?? a.id ?? a.question_id);
                if (!qid) continue;
                answersMap.set(qid, String(a.answer ?? a.value ?? ""));
            }
        } else if (answersInput && typeof answersInput === "object") {
            for (const [k, v] of Object.entries(answersInput)) {
                const qid = Number(k);
                if (!qid) continue;
                answersMap.set(qid, String(v ?? ""));
            }
        } else if (body && typeof body === "object") {
            // fallback: если фронт шлёт сразу { "1": "A", "2": "B" }
            for (const [k, v] of Object.entries(body)) {
                const qid = Number(k);
                if (!qid) continue;
                answersMap.set(qid, String(v ?? ""));
            }
        }


        let total = correctById.size;
        let correct = 0;

        for (const [qid, corr] of correctById.entries()) {
            const given = answersMap.get(qid);
            if (given != null && String(given) === String(corr)) correct++;
        }

        const score = total > 0 ? Math.round((correct / total) * 100) : 0;


        const t = await db.query(
            `SELECT id, course_id, pass_score FROM course_tasks WHERE id = $1 LIMIT 1`,
            [taskId]
        );

        const task = t.rows[0];
        const passScore = Number(task?.pass_score ?? 60);
        const passed = score >= passScore;


        await db.query(
            `
      INSERT INTO task_attempts (user_id, task_id, score, passed, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      `,
            [user.id, taskId, score, passed]
        );

        return res.status(200).json({
            success: true,
            score,
            correct,
            total,
            passed,
            passScore,
            courseId: task?.course_id ?? null,
        });
    } catch (err) {
        console.error("task/submit error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
