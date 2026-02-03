document.addEventListener("DOMContentLoaded", async () => {

    const logoBtn = document.getElementById("logoBtn");
    if (logoBtn) {
        logoBtn.addEventListener("click", async () => {
            const r = await apiFetch("/api/auth/me", { method: "GET", headers: {} });
            window.location.href = r && r.res.ok ? "/dashboard.html" : "/index.html";
        });
    }

    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            localStorage.removeItem("token");
            window.location.href = "/index.html";
        });
    }

    let user = null;
    const me = await apiFetch("/api/auth/me", { method: "GET", headers: {} });
    if (me && me.data && me.data.success) user = me.data.user;

    if (user?.role === "admin") {
        const adminBtn = document.getElementById("adminBtn");
        if (adminBtn) adminBtn.style.display = "inline-block";
    }

    await applyWelcomeFromProfile();
    await loadCourseProgress();
});

async function applyWelcomeFromProfile() {
    const titleEl = document.querySelector(".welcome__title");
    const userSpan = document.querySelector(".welcome__user");
    if (!titleEl && !userSpan) return;

    try {
        const out = await apiFetch("/api/profile", { method: "GET" });
        if (!out?.data?.success) {
            if (titleEl) titleEl.textContent = "Добро пожаловать!";
            return;
        }

        const p = out.data.profile || null;

        const first = (p?.first_name || "").trim();
        const last = (p?.last_name || "").trim();
        const fullName = [first, last].filter(Boolean).join(" ").trim();

        if (fullName) {
            if (titleEl) {
                titleEl.innerHTML = `Добро пожаловать, <span class="welcome__user"></span>!`;
                const span = titleEl.querySelector(".welcome__user");
                if (span) span.textContent = fullName;
            } else if (userSpan) {
                userSpan.textContent = fullName;
            }
        } else {
            if (titleEl) titleEl.textContent = "Добро пожаловать!";
        }
    } catch (err) {
        console.error("Ошибка загрузки профиля", err);
        if (titleEl) titleEl.textContent = "Добро пожаловать!";
    }
}

function formatLevel(level) {
    const map = {
        elementary: "A1 Elementary",
        basic: "A2 Basic",
        intermediate: "B1 Intermediate",
        upper: "B2 Upper",
        advanced: "C1 Advanced",
    };
    const key = String(level || "").toLowerCase().trim();
    return map[key] || "—";
}

async function loadCourseProgress() {
    const percentEl = document.getElementById("lessonPercent");
    const courseTitleEl = document.getElementById("courseTitle");
    const courseDescEl = document.getElementById("courseDesc");
    const lastLessonEl = document.getElementById("lastLesson");
    const nextLessonEl = document.getElementById("nextLesson");
    const circleEl = document.querySelector(".course-progress__circle");
    const btn = document.getElementById("goToCourseBtn");
    const levelEl = document.querySelector(".welcome__level");

    if (!percentEl && !courseTitleEl && !btn && !levelEl) return;

    try {
        const out = await apiFetch("/api/lessons/progress/current", { method: "GET" });
        if (!out) return;

        const { data } = out;
        if (!data?.success) return;

        if (!data.course) {
            if (percentEl) percentEl.textContent = "0%";
            if (courseTitleEl) courseTitleEl.textContent = "Курс пока не назначен";
            if (courseDescEl) courseDescEl.textContent = "";
            if (lastLessonEl) lastLessonEl.textContent = "—";
            if (nextLessonEl) nextLessonEl.textContent = "—";
            if (levelEl) levelEl.textContent = "—";
            if (btn) {
                btn.setAttribute("href", "#");
                btn.style.pointerEvents = "none";
                btn.style.opacity = "0.6";
            }
            return;
        }

        const percent = Number(data.percent || 0);
        const completed = Number(data.completedLessons || 0);
        const total = Number(data.totalLessons || 0);

        if (percentEl) percentEl.textContent = `${percent}%`;
        if (courseTitleEl) courseTitleEl.textContent = data.course.title || "Ваш текущий курс";

        if (courseDescEl) {
            courseDescEl.textContent = total > 0
                ? `Пройдено уроков: ${completed} из ${total}`
                : "Продолжайте обучение";
        }

        if (lastLessonEl) lastLessonEl.textContent = data.lastLesson ? data.lastLesson.title : "—";
        if (nextLessonEl) nextLessonEl.textContent = data.nextLesson ? data.nextLesson.title : "Все уроки пройдены";

        if (levelEl) levelEl.textContent = formatLevel(data.course.level);

        if (circleEl) {
            const deg = Math.max(0, Math.min(100, percent)) * 3.6;
            circleEl.style.background = `conic-gradient(#2563eb ${deg}deg, #e6e8ee 0deg)`;
            circleEl.style.border = "none";
            circleEl.style.padding = "6px";
            circleEl.style.boxSizing = "border-box";
            circleEl.style.position = "relative";
            circleEl.style.overflow = "hidden";

            const span = circleEl.querySelector("span");
            if (span) {
                span.style.background = "#fff";
                span.style.borderRadius = "999px";
                span.style.width = "100%";
                span.style.height = "100%";
                span.style.display = "grid";
                span.style.placeItems = "center";
            }
        }

        if (btn) {
            const href = `/courses/${data.course.slug}`;
            btn.setAttribute("href", href);
            btn.addEventListener("click", (e) => {
                if (btn.getAttribute("href") === "#") {
                    e.preventDefault();
                    window.location.href = href;
                }
            });
        }
    } catch (err) {
        console.error("Ошибка загрузки прогресса", err);
    }
}
