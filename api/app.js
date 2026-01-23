const { requireUser } = require("../lib/jwt");

// Подключаем реальные хендлеры НЕ из /api (иначе Vercel их тоже посчитает функциями)
const authLogin = require("../server/routes/auth/login");
const authRegister = require("../server/routes/auth/register");
const authMe = require("../server/routes/auth/me");

const profile = require("../server/routes/profile");

const myResult = require("../server/routes/my-result");
const testHistory = require("../server/routes/test-history");
const progressCurrent = require("../server/routes/lessons/progress-current");

// если ты уже делал: course/lesson/complete/continue/task — подключишь так же
// const courseBySlug = require("../server/routes/course/by-slug");
// const lessonById = require("../server/routes/lesson/by-id");
// const lessonComplete = require("../server/routes/lesson/complete");
// const continueLesson = require("../server/routes/continue-lesson");

module.exports = async (req, res) => {
    try {
        const url = new URL(req.url, "http://localhost");
        const path = url.pathname;          // например: /api/auth/login
        const method = req.method;

        // роутинг
        if (path === "/api/auth/login" && method === "POST") return authLogin(req, res);
        if (path === "/api/auth/register" && method === "POST") return authRegister(req, res);
        if (path === "/api/auth/me" && method === "GET") return authMe(req, res);

        if (path === "/api/profile" && (method === "GET" || method === "POST")) return profile(req, res);

        if (path === "/api/my-result" && method === "GET") return myResult(req, res);
        if (path === "/api/test-history" && method === "GET") return testHistory(req, res);
        if (path === "/api/lessons/progress/current" && method === "GET") return progressCurrent(req, res);

        // пример для динамики (когда добавим):
        // if (path.startsWith("/api/course/") && method === "GET") return courseBySlug(req, res);
        // if (path.startsWith("/api/lesson/") && method === "GET") return lessonById(req, res);

        return res.status(404).json({ success: false, message: "Not found" });
    } catch (e) {
        console.error("api/app error:", e);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
