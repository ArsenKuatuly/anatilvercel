const { setCors } = require("../lib/cors");
const { readJson } = require("../lib/body");

const authLogin = require("../server/routes/auth/login");
const authRegister = require("../server/routes/auth/register");
const authMe = require("../server/routes/auth/me");

const profile = require("../server/routes/profile");
const profileAvatar = require("../server/routes/profile/avatar");

const myResult = require("../server/routes/my-result");
const testHistory = require("../server/routes/test-history");
const saveResult = require("../server/routes/save-result");

const progressCurrent = require("../server/routes/lessons/progress/current");

const courseBySlug = require("../server/routes/course/[slug]");
const lessonById = require("../server/routes/lesson/[id]");
const lessonComplete = require("../server/routes/lesson/complete");
const continueLesson = require("../server/routes/continue-lesson");

const courseTask = require("../server/routes/[courseId]/task");

const myCourse = require("../server/routes/my-course");
const myActiveCourse = require("../server/routes/my-active-course");


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

module.exports = async (req, res) => {
    try {
        if (setCors(req, res)) return;

        // body
        if (["POST", "PATCH", "PUT"].includes(req.method)) {
            const ct = String(req.headers["content-type"] || "");
            if (ct.includes("application/json")) {
                try { req.body = await readJson(req); }
                catch { req.body = {}; }
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

        // ===== PROFILE =====
        if (path === "/api/profile" && (method === "GET" || method === "POST")) return profile(req, res);
        if (path === "/api/profile/avatar" && method === "POST") return profileAvatar(req, res);

        // ===== RESULTS =====
        if (path === "/api/my-result" && method === "GET") return myResult(req, res);
        if (path === "/api/test-history" && method === "GET") return testHistory(req, res);
        if (path === "/api/save-result" && method === "POST") return saveResult(req, res);

        // ===== LESSONS =====
        if (path === "/api/lessons/progress/current" && method === "GET") return progressCurrent(req, res);
        if (path === "/api/lesson/complete" && method === "POST") return lessonComplete(req, res);
        if (path === "/api/continue-lesson" && method === "GET") return continueLesson(req, res);

        if (path === "/api/my-course" && method === "GET") return myCourse(req, res);
        if (path === "/api/my-active-course" && method === "GET") return myActiveCourse(req, res);


        {
            const p = matchPath(path, "/api/lesson/:id");
            if (p && method === "GET") {
                req.query = req.query || {};
                req.query.id = p.id;
                return lessonById(req, res);
            }
        }


        {
            const p = matchPath(path, "/api/course/:slug");
            if (p && method === "GET") {
                req.query = req.query || {};
                req.query.slug = p.slug;
                return courseBySlug(req, res);
            }
        }

        {
            const p = matchPath(path, "/api/course/:courseId/task");
            if (p && method === "GET") {
                req.query = req.query || {};
                req.query.courseId = p.courseId;
                return courseTask(req, res);
            }
        }



        return res.status(404).json({ success: false, message: "Not found" });
    } catch (e) {
        console.error("api/app error:", e);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
