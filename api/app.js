const { setCors } = require("../lib/cors");
const { readJson } = require("../lib/body");

// ===== AUTH =====
const authLogin = require("../server/routes/auth/login");
const authRegister = require("../server/routes/auth/register");
const authMe = require("../server/routes/auth/me");

// ===== PROFILE =====
const profile = require("../server/routes/profile/profile");
const profileAvatar = require("../server/routes/profile/avatar");

// ===== RESULTS / TESTS =====
const myResult = require("../server/routes/my-result");
const testHistory = require("../server/routes/test-history");
const saveResult = require("../server/routes/save-result");

// ===== COURSES =====
const myCourse = require("../server/routes/my-course");
const myActiveCourse = require("../server/routes/my-active-course");
const courseBySlug = require("../server/routes/course/[slug]");
const courseTask = require("../server/routes/course/[courseId]/task");

// ===== LESSONS =====
const progressCurrent = require("../server/routes/lessons/progress/current");
const lessonById = require("../server/routes/lesson/[id]");
const lessonComplete = require("../server/routes/lesson/complete");
const continueLesson = require("../server/routes/continue-lesson");

// ===== TASKS =====
const taskGet = require("../server/routes/task/[taskId]");
const taskQuestions = require("../server/routes/task/[taskId]/questions");
const taskSubmit = require("../server/routes/task/[taskId]/submit");

// ===== util =====
function matchPath(pathname, pattern) {
    const a = pathname.split("/").filter(Boolean);
    const b = pattern.split("/").filter(Boolean);
    if (a.length !== b.length) return null;

    const params = {};
    for (let i = 0; i < b.length; i++) {
        if (b[i].startsWith(":")) params[b[i].slice(1)] = a[i];
        else if (a[i] !== b[i]) return null;
    }
    return params;
}

module.exports = async (req, res) => {
    try {
        if (setCors(req, res)) return;

        // ===== BODY =====
        if (["POST", "PUT", "PATCH"].includes(req.method)) {
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

        // query params (на будущее)
        req.query = Object.fromEntries(url.searchParams.entries());

        // ===== AUTH =====
        if (path === "/api/auth/login" && method === "POST") return authLogin(req, res);
        if (path === "/api/auth/register" && method === "POST") return authRegister(req, res);
        if (path === "/api/auth/me" && method === "GET") return authMe(req, res);

        // ===== PROFILE =====
        if (path === "/api/profile" && (method === "GET" || method === "POST"))
            return profile(req, res);

        if (path === "/api/profile/avatar" && method === "POST")
            return profileAvatar(req, res);

        // ===== RESULTS =====
        if (path === "/api/my-result" && method === "GET") return myResult(req, res);
        if (path === "/api/test-history" && method === "GET") return testHistory(req, res);
        if (path === "/api/save-result" && method === "POST") return saveResult(req, res);

        // ===== COURSES =====
        if (path === "/api/my-course" && method === "GET") return myCourse(req, res);
        if (path === "/api/my-active-course" && method === "GET") return myActiveCourse(req, res);

        {
            const p = matchPath(path, "/api/course/:slug");
            if (p && method === "GET") {
                req.query.slug = p.slug;
                return courseBySlug(req, res);
            }
        }

        {
            const p = matchPath(path, "/api/course/:courseId/task");
            if (p && method === "GET") {
                req.query.courseId = p.courseId;
                return courseTask(req, res);
            }
        }

        // ===== LESSONS =====
        if (path === "/api/lessons/progress/current" && method === "GET")
            return progressCurrent(req, res);

        if (path === "/api/lesson/complete" && method === "POST")
            return lessonComplete(req, res);

        if (path === "/api/continue-lesson" && method === "GET")
            return continueLesson(req, res);

        {
            const p = matchPath(path, "/api/lesson/:id");
            if (p && method === "GET") {
                req.query.id = p.id;
                return lessonById(req, res);
            }
        }

        // ===== TASKS =====
        {
            const p = matchPath(path, "/api/task/:taskId");
            if (p && method === "GET") {
                req.query.taskId = p.taskId;
                return taskGet(req, res);
            }
        }

        {
            const p = matchPath(path, "/api/task/:taskId/questions");
            if (p && method === "GET") {
                req.query.taskId = p.taskId;
                return taskQuestions(req, res);
            }
        }

        {
            const p = matchPath(path, "/api/task/:taskId/submit");
            if (p && method === "POST") {
                req.query.taskId = p.taskId;
                return taskSubmit(req, res);
            }
        }

        return res.status(404).json({ success: false, message: "Not found" });

    } catch (err) {
        console.error("api/app error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
