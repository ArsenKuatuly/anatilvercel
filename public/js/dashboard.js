document.addEventListener("DOMContentLoaded", async () => {

    const dash = document.getElementById("dash");

    function setState(name) {
        if (!dash) return;
        dash.querySelectorAll(".dash__state").forEach((s) => {
            s.classList.toggle("is-active", s.dataset.state === name);
        });
    }


    setState("loading");


    const logoBtn = document.getElementById("logoBtn");
    if (logoBtn) {
        logoBtn.addEventListener("click", async () => {
            const r = await apiFetch("/api/auth/me", { method: "GET", headers: {} });
            window.location.href = r && r.res && r.res.ok ? "/dashboard.html" : "/index.html";
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
    try {
        const me = await apiFetch("/api/auth/me", { method: "GET", headers: {} });
        if (me && me.data && me.data.success) user = me.data.user;

        if (user?.role === "admin") {
            const adminBtn = document.getElementById("adminBtn");
            if (adminBtn) adminBtn.style.display = "inline-block";
        }
    } catch (e) {

        setState("empty");
        return;
    }


    const hasData = await loadCourseProgress(setState);


    setState(hasData ? "data" : "empty");
});

async function loadCourseProgress(setState) {
    const percentEl = document.getElementById("lessonPercent");
    const courseTitleEl = document.getElementById("courseTitle");
    const courseDescEl = document.getElementById("courseDesc");
    const lastLessonEl = document.getElementById("lastLesson");
    const nextLessonEl = document.getElementById("nextLesson");
    const circleEl = document.querySelector(".course-progress__circle");
    const btn = document.getElementById("goToCourseBtn");


    if (!percentEl && !courseTitleEl && !btn) return false;

    try {
        const out = await apiFetch("/api/lessons/progress/current", { method: "GET" });
        if (!out) return false;

        const { data } = out;
        if (!data?.success) return false;


        if (!data.course) {
            if (percentEl) percentEl.textContent = "0%";
            if (courseTitleEl) courseTitleEl.textContent = "Курс пока не назначен";
            if (courseDescEl) courseDescEl.textContent = "";
            if (lastLessonEl) lastLessonEl.textContent = "—";
            if (nextLessonEl) nextLessonEl.textContent = "—";
            if (btn) {
                btn.setAttribute("href", "#");
                btn.style.pointerEvents = "none";
                btn.style.opacity = "0.6";
            }
            return false;
        }


        const percent = Number(data.percent || 0);
        const completed = Number(data.completedLessons || 0);
        const total = Number(data.totalLessons || 0);

        if (percentEl) percentEl.textContent = `${percent}%`;
        if (courseTitleEl) courseTitleEl.textContent = data.course.title || "Ваш текущий курс";

        if (courseDescEl) {
            courseDescEl.textContent =
                total > 0 ? `Пройдено уроков: ${completed} из ${total}` : "Продолжайте обучение";
        }

        if (lastLessonEl) lastLessonEl.textContent = data.lastLesson ? data.lastLesson.title : "—";
        if (nextLessonEl)
            nextLessonEl.textContent = data.nextLesson ? data.nextLesson.title : "Все уроки пройдены";


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
            btn.style.pointerEvents = "";
            btn.style.opacity = "";

            // заменяем обработчик безопасно
            btn.onclick = (e) => {
                const h = btn.getAttribute("href");
                if (!h || h === "#") {
                    e.preventDefault();
                    return;
                }

            };
        }

        return true;
    } catch (err) {
        console.error("Ошибка загрузки прогресса", err);
        if (typeof setState === "function") setState("empty");
        return false;
    }
}
