const { setCors } = require("../lib/cors");
const { readJson } = require("../lib/body");

// ================= SAFE REQUIRE (чтобы деплой не падал) =================
function safeRequire(path) {
    try {
        return require(path);
    } catch (e) {
        // важно: не ломаем деплой из-за отсутствующего файла
        console.warn("safeRequire missing:", path);
        return null;
    }
}

function notImplemented(name) {
    return (req, res) => res.status(501).json({ success: false, message: `Route not implemented: ${name}` });
}

// ================= ROUTES =================

// AUTH
const authLogin = safeRequire("../server/routes/auth/login") || notImplemented("auth/login");
const authRegister = safeRequire("../server/routes/auth/register") || notImplemented("auth/register");
const authMe = safeRequire("../server/routes/auth/me") || notImplemented("auth/me");

// AI
const aiChat = safeRequire("../server/routes/ai/chat") || notImplemented("ai/chat");

// PROFILE
const profile = safeRequire("../server/routes/profile") || notImplemented("profile");
const profileAvatar = safeRequire("../server/routes/profile/avatar") || notImplemented("profile/avatar");

// RESULTS / TESTS
const myResult = safeRequire("../server/routes/my-result") || notImplemented("my-result");
const testHistory = safeRequire("../server/routes/test-history") || notImplemented("test-history");
const saveResult = safeRequire("../server/routes/save-result") || notImplemented("save-result");

// COURSES (верхние)
const myCourse = safeRequire("../server/routes/my-course") || notImplemented("my-course");
const myActiveCourse = safeRequire("../server/routes/my-active-course") || notImplemented("my-active-course");
const myCourses = safeRequire("../server/routes/my-courses") || notImplemented("my-courses");

// PROGRESS
const progressCurrent =
    safeRequire("../server/routes/lessons/progress/current") || notImplemented("lessons/progress/current");

// COURSE BY SLUG
const courseBySlug = safeRequire("../server/routes/course/[slug]") || notImplemented("course/[slug]");

// LESSON
const lessonById = safeRequire("../server/routes/lesson/[id]") || notImplemented("lesson/[id]");
const lessonComplete = safeRequire("../server/routes/lesson/complete") || notImplemented("lesson/complete");
const continueLesson = safeRequire("../server/routes/continue-lesson") || notImplemented("continue-lesson");

// FINAL TASK for COURSE (у тебя это в routes/[courseId]/task.js)
const courseTask = safeRequire("../server/routes/[courseId]/task") || notImplemented("[courseId]/task");

// TASK
const taskGet = safeRequire("../server/routes/task/[taskId]") || notImplemented("task/[taskId]");
const taskQuestions = safeRequire("../server/routes/task/[taskId]/questions") || notImplemented("task/[taskId]/questions");
const taskSubmit = safeRequire("../server/routes/task/[taskId]/submit") || notImplemented("task/[taskId]/submit");

// ================= HELPERS =================
function matchPath(pathname, pattern) {
    const a = pathname.split("/").filter(Boolean);
    const b = pattern.split("/").filter(Boolean);
    if (a.length !== b.length) return null;

    const params = {};
    for (let i = 0; i < b.length; i++) {
        const seg = b[i];
        if (seg.startsWith(":")) params[seg.slice(1)] = a[i];
        else if (seg !== a[i]) return null;
    }
    return params;
}

// ================= MAIN HANDLER =================
module.exports = async (req, res) => {
    try {
        if (setCors(req, res)) return;

        // body
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

        // ===== COURSES (user) =====
        if (path === "/api/my-course" && method === "GET") return myCourse(req, res);
        if (path === "/api/my-active-course" && method === "GET") return myActiveCourse(req, res);
        if (path === "/api/my-courses" && method === "GET") return myCourses(req, res);

        // ===== PROGRESS =====
        if (path === "/api/lessons/progress/current" && method === "GET") return progressCurrent(req, res);

        // ===== CONTINUE LESSON =====
        if (path === "/api/continue-lesson" && method === "GET") return continueLesson(req, res);

        // ===== LESSON BY ID =====
        {
            const p = matchPath(path, "/api/lesson/:id");
            if (p && method === "GET") {
                req.query = req.query || {};
                req.query.id = p.id;
                return lessonById(req, res);
            }
        }

        // ===== LESSON COMPLETE =====
        if (path === "/api/lesson/complete" && method === "POST") return lessonComplete(req, res);

        // ===== COURSE BY SLUG =====
        {
            const p = matchPath(path, "/api/course/:slug");
            if (p && method === "GET") {
                req.query = req.query || {};
                req.query.slug = p.slug;
                return courseBySlug(req, res);
            }
        }

        // ===== COURSE TASK =====
        {
            const p = matchPath(path, "/api/course/:courseId/task");
            if (p && method === "GET") {
                req.query = req.query || {};
                req.query.courseId = p.courseId;
                return courseTask(req, res);
            }
        }

        // ===== TASK GET =====
        {
            const p = matchPath(path, "/api/task/:taskId");
            if (p && method === "GET") {
                req.query = req.query || {};
                req.query.taskId = p.taskId;
                return taskGet(req, res);
            }
        }

        // ===== TASK QUESTIONS =====
        {
            const p = matchPath(path, "/api/task/:taskId/questions");
            if (p && method === "GET") {
                req.query = req.query || {};
                req.query.taskId = p.taskId;
                return taskQuestions(req, res);
            }
        }

        // ===== TASK SUBMIT =====
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
