const { setCors } = require("../lib/cors");
const { readJson } = require("../lib/body");

// ===== STATIC REQUIRES (ВАЖНО ДЛЯ VERCEL) =====
const authLogin = require("../server/routes/auth/login.js");
const authRegister = require("../server/routes/auth/register.js");
const authMe = require("../server/routes/auth/me.js");

const aiChat = require("../server/routes/ai/chat.js");

const profile = require("../server/routes/profile.js");
const profileAvatar = require("../server/routes/profile/avatar.js");

const myResult = require("../server/routes/my-result.js");
const testHistory = require("../server/routes/test-history.js");
const saveResult = require("../server/routes/save-result.js");

const myCourse = require("../server/routes/my-course.js");
const myActiveCourse = require("../server/routes/my-active-course.js");
const myCourses = require("../server/routes/my-courses.js"); // если файла нет — удали 1 строку и роут ниже

const progressCurrent = require("../server/routes/lessons/progress/current.js");

const courseBySlug = require("../server/routes/course/[slug].js");

const lessonById = require("../server/routes/lesson/[id].js");
const lessonComplete = require("../server/routes/lesson/complete.js");
const continueLesson = require("../server/routes/continue-lesson.js");

const courseTask = require("../server/routes/[courseId]/task.js");

const taskGet = require("../server/routes/task/[taskId].js");
const taskQuestions = require("../server/routes/task/[taskId]/questions.js");
const taskSubmit = require("../server/routes/task/[taskId]/submit.js");

// ===== tiny router =====
function matchPath(pathname, pattern) {
    const a = String(pathname).split("/").filter(Boolean);
    const b = String(pattern).split("/").filter(Boolean);
    if (a.length !== b.length) return null;

    const params = {};
    for (let i = 0; i < b.length; i++) {
        const seg = b[i];
        if (seg.startsWith(":")) params[seg.slice(1)] = a[i];
        else if (seg !== a[i]) return null;
    }
    return params;
}

module.exports = async (req, res) => {
    try {
        // CORS + preflight
        if (setCors(req, res)) return;

        // parse JSON body once
        if (["POST", "PATCH", "PUT"].includes(req.method)) {
            const ct = String(req.headers["content-type"] || "");
            if (ct.includes("application/json")) {
                try {
                    req.body = await readJson(req);
                } catch {
                    req.body = {};
                }
            } else {
                req.body = {};
            }
        } else {
            req.body = {};
        }

        const url = new URL(req.url, "http://localhost");
        const path = url.pathname;
        const method = req.method;

        // ===== AUTH =====
        if (path === "/api/auth/login" && method === "POST") return authLogin(req, res);
        if (path === "/api/auth/register" && method === "POST") return authRegister(req, res);
        if (path === "/api/auth/me" && method === "GET") return authMe(req, res);

        // ===== AI =====
        if (path === "/api/ai/chat" && method === "POST") return aiChat(req, res);

        // ===== PROFILE =====
        if (path === "/api/profile" && (method === "GET" || method === "POST")) return profile(req, res);
        if (path === "/api/profile/avatar" && method === "POST") return profileAvatar(req, res);

        // ===== RESULTS =====
        if (path === "/api/my-result" && method === "GET") return myResult(req, res);
        if (path === "/api/test-history" && method === "GET") return testHistory(req, res);
        if (path === "/api/save-result" && method === "POST") return saveResult(req, res);

        // ===== COURSES =====
        if (path === "/api/my-course" && method === "GET") return myCourse(req, res);
        if (path === "/api/my-active-course" && method === "GET") return myActiveCourse(req, res);
        if (path === "/api/my-courses" && method === "GET") return myCourses(req, res);

        // ===== LESSONS =====
        if (path === "/api/lessons/progress/current" && method === "GET") return progressCurrent(req, res);
        if (path === "/api/lesson/complete" && method === "POST") return lessonComplete(req, res);
        if (path === "/api/continue-lesson" && method === "GET") return continueLesson(req, res);

        // /api/lesson/:id
        {
            const p = matchPath(path, "/api/lesson/:id");
            if (p && method === "GET") {
                req.query = req.query || {};
                req.query.id = p.id;
                return lessonById(req, res);
            }
        }

        // /api/course/:slug
        {
            const p = matchPath(path, "/api/course/:slug");
            if (p && method === "GET") {
                req.query = req.query || {};
                req.query.slug = p.slug;
                return courseBySlug(req, res);
            }
        }

        // /api/course/:courseId/task
        {
            const p = matchPath(path, "/api/course/:courseId/task");
            if (p && method === "GET") {
                req.query = req.query || {};
                req.query.courseId = p.courseId;
                return courseTask(req, res);
            }
        }

        // ===== TASK =====
        {
            const p = matchPath(path, "/api/task/:taskId");
            if (p && method === "GET") {
                req.query = req.query || {};
                req.query.taskId = p.taskId;
                return taskGet(req, res);
            }
        }

        {
            const p = matchPath(path, "/api/task/:taskId/questions");
            if (p && method === "GET") {
                req.query = req.query || {};
                req.query.taskId = p.taskId;
                return taskQuestions(req, res);
            }
        }

        {
            const p = matchPath(path, "/api/task/:taskId/submit");
            if (p && method === "POST") {
                req.query = req.query || {};
                req.query.taskId = p.taskId;
                return taskSubmit(req, res);
            }
        }

        return res.status(404).json({ success: false, message: "Not found" });
    } catch (e) {
        console.error("api/app error:", e);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
