// api/app.js
const { URL } = require("url");

// handlers
const authLogin = require("../server/routes/auth/login");
const authRegister = require("../server/routes/auth/register");
const authMe = require("../server/routes/auth/me");

const profile = require("../server/routes/profile");
const profileAvatar = require("../server/routes/profile/avatar");

const myResult = require("../server/routes/my-result");
const testHistory = require("../server/routes/test-history");
const progressCurrent = require("../server/routes/lessons/progress/current");

const aiChat = require("../server/routes/ai/chat");

const courseBySlug = require("../server/routes/course/[slug]");
const lessonById = require("../server/routes/lesson/[id]");
const lessonComplete = require("../server/routes/lesson/complete");
const continueLesson = require("../server/routes/continue-lesson");

const courseTaskByCourseId = require("../server/routes/[courseId]/task");

const taskQuestions = require("../server/routes/task/[taskId]/questions");
const taskSubmit = require("../server/routes/task/[taskId]/submit");


function matchPath(pathname, pattern) {

    const pParts = pattern.split("/").filter(Boolean);
    const uParts = pathname.split("/").filter(Boolean);
    if (pParts.length !== uParts.length) return null;

    const params = {};
    for (let i = 0; i < pParts.length; i++) {
        const p = pParts[i];
        const u = uParts[i];
        if (p.startsWith(":")) params[p.slice(1)] = decodeURIComponent(u);
        else if (p !== u) return null;
    }
    return params;
}

module.exports = async (req, res) => {
    try {
        const url = new URL(req.url, "http://localhost");
        const path = url.pathname;
        const method = req.method;

        // --- AUTH ---
        if (path === "/api/auth/login" && method === "POST") return authLogin(req, res);
        if (path === "/api/auth/register" && method === "POST") return authRegister(req, res);
        if (path === "/api/auth/me" && method === "GET") return authMe(req, res);

        // --- PROFILE ---
        if (path === "/api/profile" && (method === "GET" || method === "POST")) return profile(req, res);
        if (path === "/api/profile/avatar" && method === "POST") return profileAvatar(req, res);

        // --- RESULTS / PROGRESS ---
        if (path === "/api/my-result" && method === "GET") return myResult(req, res);
        if (path === "/api/test-history" && method === "GET") return testHistory(req, res);
        if (path === "/api/lessons/progress/current" && method === "GET") return progressCurrent(req, res);

        // --- AI ---
        if (path === "/api/ai/chat" && method === "POST") return aiChat(req, res);

        // --- LEARNING FLOW ---
        // GET /api/course/:slug
        {
            const params = matchPath(path, "/api/course/:slug");
            if (params && method === "GET") {
                req.query = req.query || {};
                req.query.slug = params.slug;
                return courseBySlug(req, res);
            }
        }

        // GET /api/lesson/:id
        {
            const params = matchPath(path, "/api/lesson/:id");
            if (params && method === "GET") {
                req.query = req.query || {};
                req.query.id = params.id;
                return lessonById(req, res);
            }
        }

        // POST /api/lesson/complete
        if (path === "/api/lesson/complete" && method === "POST") return lessonComplete(req, res);

        // GET /api/continue-lesson
        if (path === "/api/continue-lesson" && method === "GET") return continueLesson(req, res);

        // GET /api/course/:courseId/task
        {
            const params = matchPath(path, "/api/course/:courseId/task");
            if (params && method === "GET") {
                req.query = req.query || {};
                req.query.courseId = params.courseId;
                return courseTaskByCourseId(req, res);
            }
        }

        // GET /api/task/:taskId/questions
        {
            const params = matchPath(path, "/api/task/:taskId/questions");
            if (params && method === "GET") {
                req.query = req.query || {};
                req.query.taskId = params.taskId;
                return taskQuestions(req, res);
            }
        }

// POST /api/task/:taskId/submit
        {
            const params = matchPath(path, "/api/task/:taskId/submit");
            if (params && method === "POST") {
                req.query = req.query || {};
                req.query.taskId = params.taskId;
                return taskSubmit(req, res);
            }
        }


        return res.status(404).json({ success: false, message: "Not found" });
    } catch (e) {
        console.error("api/app error:", e);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
