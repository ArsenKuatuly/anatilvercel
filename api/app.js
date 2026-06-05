const { setCors } = require("../lib/cors");
const { readJson } = require("../lib/body");
const myCertificates = require("../server/routes/my-certificates.js");


const authLogin = require("../server/routes/auth/login.js");
const authRegister = require("../server/routes/auth/register.js");
const authForgotPassword = require("../server/routes/auth/forgot-password.js");
const authResetPassword = require("../server/routes/auth/reset-password.js");
const authMe = require("../server/routes/auth/me.js");
const authConfig = require("../server/routes/auth/config.js");
const brandLogo = require("../server/routes/brand/logo.js");

const aiChat = require("../server/routes/ai/chat.js");
const aiVoiceDialog = require("../server/routes/ai/voiceDialog.js");
const aiTts = require("../server/routes/ai/tts.js");

const profile = require("../server/routes/profile.js");
const profileAvatar = require("../server/routes/profile/avatar.js");

const myResult = require("../server/routes/my-result.js");
const testHistory = require("../server/routes/test-history.js");
const saveResult = require("../server/routes/save-result.js");

const myCourse = require("../server/routes/my-course.js");
const myActiveCourse = require("../server/routes/my-active-course.js");
const myCourses = require("../server/routes/my-courses.js");

const progressCurrent = require("../server/routes/lessons/progress/current.js");

const courseBySlug = require("../server/routes/course/[slug].js");

const lessonById = require("../server/routes/lesson/[id].js");
const lessonComplete = require("../server/routes/lesson/complete.js");
const continueLesson = require("../server/routes/continue-lesson.js");

const courseTask = require("../server/routes/[courseId]/task.js");

const taskGet = require("../server/routes/task/[taskId].js");
const taskQuestions = require("../server/routes/task/[taskId]/questions.js");
const taskSubmit = require("../server/routes/task/[taskId]/submit.js");
const certificateByCourse = require("../server/routes/certificate/[courseId].js");

const myAchievements = require("../server/routes/achievements/my");

const libraryMaterials = require("../server/routes/library/materials.js");
const libraryState = require("../server/routes/library/state.js");

const adminUsers = require("../server/routes/admin/users.js");
const adminUserUpdate = require("../server/routes/admin/userUpdate.js");
const adminUserReset = require("../server/routes/admin/userReset.js");

const adminCourses = require("../server/routes/admin/courses.js");
const adminCourseModules = require("../server/routes/admin/courseModules.js");
const adminModuleLessons = require("../server/routes/admin/moduleLessons.js");
const adminLessonUpdate = require("../server/routes/admin/lessonUpdate.js");

const adminTasks = require("../server/routes/admin/tasks.js");
const adminTaskGet = require("../server/routes/admin/taskGet.js");
const adminTaskUpdate = require("../server/routes/admin/taskUpdate.js");
const adminQuestionUpdate = require("../server/routes/admin/questionUpdate.js");

const adminLibraryMaterials = require("../server/routes/admin/libraryMaterials.js");
const adminLibraryMaterialUpdate = require("../server/routes/admin/libraryMaterialUpdate.js");

const aiSessionStart = require("../server/routes/ai/sessionStart.js");
const aiUsageToday = require("../server/routes/ai/usageToday.js");
const testWritingScore = require("../server/routes/ai/testWritingScore.js");

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
        if (setCors(req, res)) return;

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

        if (path === "/api/auth/login" && method === "POST") return authLogin(req, res);
        if (path === "/api/auth/register" && method === "POST") return authRegister(req, res);
        if (path === "/api/auth/forgot-password" && method === "POST") return authForgotPassword(req, res);
        if (path === "/api/auth/reset-password" && method === "POST") return authResetPassword(req, res);
        if (path === "/api/auth/me" && method === "GET") return authMe(req, res);
        if (path === "/api/auth/config" && method === "GET") return authConfig(req, res);
        if (path === "/api/brand/logo" && method === "GET") return brandLogo(req, res);

        if (path === "/api/ai/chat" && method === "POST") return aiChat(req, res);
        if (path === "/api/ai/voice-dialog" && method === "POST") return aiVoiceDialog(req, res);
        if (path === "/api/ai/tts" && method === "POST") return aiTts(req, res);
        if (path === "/api/ai/session/start" && method === "POST") return aiSessionStart(req, res);
        if (path === "/api/ai/usage/today" && method === "GET") return aiUsageToday(req, res);
        if (path === "/api/ai/test-writing-score" && method === "POST") return testWritingScore(req, res);

        if (path === "/api/profile" && (method === "GET" || method === "POST")) return profile(req, res);
        if (path === "/api/profile/avatar" && method === "POST") return profileAvatar(req, res);

        if (path === "/api/my-result" && method === "GET") return myResult(req, res);
        if (path === "/api/test-history" && method === "GET") return testHistory(req, res);
        if (path === "/api/save-result" && method === "POST") return saveResult(req, res);

        if (path === "/api/my-course" && method === "GET") return myCourse(req, res);
        if (path === "/api/my-active-course" && method === "GET") return myActiveCourse(req, res);
        if (path === "/api/my-courses" && method === "GET") return myCourses(req, res);

        if (path === "/api/lessons/progress/current" && method === "GET") return progressCurrent(req, res);
        if (path === "/api/lesson/complete" && method === "POST") return lessonComplete(req, res);
        if (path === "/api/continue-lesson" && method === "GET") return continueLesson(req, res);

        if (path === "/api/achievements/my" && method === "GET") return myAchievements(req, res);

        if (path === "/api/library/materials" && method === "GET") return libraryMaterials(req, res);
        if (path === "/api/library/state" && method === "POST") return libraryState(req, res);

        if (path === "/api/admin/users" && method === "GET") return adminUsers(req, res);
        if (path === "/api/admin/courses" && method === "GET") return adminCourses(req, res);
        if (path === "/api/admin/tasks" && method === "GET") return adminTasks(req, res);
        if (path === "/api/admin/library/materials" && method === "GET") return adminLibraryMaterials(req, res);

        if (path === "/api/my-certificates" && method === "GET") {
            return myCertificates(req, res);
        }

        {
            const p = matchPath(path, "/api/admin/users/:id");
            if (p && method === "PATCH") {
                req.query = req.query || {};
                req.query.id = p.id;
                return adminUserUpdate(req, res);
            }
        }

        {
            const p = matchPath(path, "/api/admin/users/:id/reset");
            if (p && method === "POST") {
                req.query = req.query || {};
                req.query.id = p.id;
                return adminUserReset(req, res);
            }
        }

        {
            const p = matchPath(path, "/api/admin/courses/:courseId/modules");
            if (p && method === "GET") {
                req.query = req.query || {};
                req.query.courseId = p.courseId;
                return adminCourseModules(req, res);
            }
        }

        {
            const p = matchPath(path, "/api/admin/modules/:moduleId/lessons");
            if (p && method === "GET") {
                req.query = req.query || {};
                req.query.moduleId = p.moduleId;
                return adminModuleLessons(req, res);
            }
        }

        {
            const p = matchPath(path, "/api/admin/lessons/:lessonId");
            if (p && method === "PATCH") {
                req.query = req.query || {};
                req.query.lessonId = p.lessonId;
                return adminLessonUpdate(req, res);
            }
        }

        {
            const p = matchPath(path, "/api/admin/tasks/:taskId");
            if (p && method === "GET") {
                req.query = req.query || {};
                req.query.taskId = p.taskId;
                return adminTaskGet(req, res);
            }
            if (p && method === "PATCH") {
                req.query = req.query || {};
                req.query.taskId = p.taskId;
                return adminTaskUpdate(req, res);
            }
        }

        {
            const p = matchPath(path, "/api/admin/questions/:questionId");
            if (p && method === "PATCH") {
                req.query = req.query || {};
                req.query.questionId = p.questionId;
                return adminQuestionUpdate(req, res);
            }
        }

        {
            const p = matchPath(path, "/api/admin/library/materials/:id");
            if (p && method === "PATCH") {
                req.query = req.query || {};
                req.query.id = p.id;
                return adminLibraryMaterialUpdate(req, res);
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
            const p = matchPath(path, "/api/lesson/:id");
            if (p && method === "GET") {
                req.query = req.query || {};
                req.query.id = p.id;
                return lessonById(req, res);
            }
        }

        {
            const p = matchPath(path, "/api/:courseId/task");
            if (p && method === "GET") {
                req.query = req.query || {};
                req.query.courseId = p.courseId;
                return courseTask(req, res);
            }
        }

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

        {
            const p = matchPath(path, "/api/certificate/:courseId");
            if (p && method === "GET") {
                req.query = req.query || {};
                req.query.courseId = p.courseId;
                return certificateByCourse(req, res);
            }
        }

        return res.status(404).json({ success: false, message: "Not found" });
    } catch (err) {
        console.error("api/app error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
