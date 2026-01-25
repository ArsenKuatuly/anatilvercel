document.addEventListener("DOMContentLoaded", async () => {
    const dash = document.getElementById("dash");

    function setState(name) {
        if (!dash) return;
        dash.querySelectorAll(".dash__state").forEach((s) => {
            s.classList.toggle("is-active", s.dataset.state === name);
        });
    }

    // ====== DEFAULT ======
    setState("loading");

    // ====== HEADER ACTIONS ======
    const logoBtn = document.getElementById("logoBtn");
    if (logoBtn) {
        logoBtn.addEventListener("click", async (e) => {
            e.preventDefault();
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

    // ====== USER / ROLE / AVATAR ======
    let user = null;
    try {
        const me = await apiFetch("/api/auth/me", { method: "GET", headers: {} });
        if (me && me.data && me.data.success) user = me.data.user;

        // admin
        if (user?.role === "admin") {
            const adminBtn = document.getElementById("adminBtn");
            if (adminBtn) adminBtn.style.display = "inline-block";
        }

        // avatar letter
        const initialEl = document.getElementById("userInitial");
        if (initialEl) {
            const base =
                (user?.name && String(user.name).trim()) ||
                (user?.login && String(user.login).trim()) ||
                "A";
            initialEl.textContent = base.slice(0, 1).toUpperCase();
        }
    } catch (e) {
        setState("empty");
        return;
    }

    // ====== MODAL (TEST) ======
    setupTestModal();

    // ====== COURSE PROGRESS ======
    const hasData = await loadCourseProgress(setState);
    setState(hasData ? "data" : "empty");
});

function setupTestModal() {
    const openBtn = document.getElementById("takeTestBtn");
    const modal = document.getElementById("testModal");
    const confirmBtn = document.getElementById("confirmTestBtn");

    if (!modal) return;

    const close = () => {
        modal.hidden = true;
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
    };

    const open = () => {
        modal.hidden = false;
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
    };

    // open
    if (openBtn) {
        openBtn.addEventListener("click", () => open());
    }

    // close by elements with data-close="1"
    modal.addEventListener("click", (e) => {
        const t = e.target;
        if (!(t instanceof HTMLElement)) return;
        if (t.closest('[data-close="1"]')) close();
    });

    // close by Esc
    document.addEventListener("keydown", (e) => {
        if (!modal.hidden && e.key === "Escape") close();
    });

    // confirm
    if (confirmBtn) {
        confirmBtn.addEventListener("click", () => {
            // TODO: поставь нужный переход
            // например: window.location.href = "/tests";
            close();
        });
    }
}

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

        // ====== EMPTY ======
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

        // ====== DATA ======
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
        if (nextLessonEl) {
            nextLessonEl.textContent = data.nextLesson
                ? data.nextLesson.title
                : "Все уроки пройдены";
        }

        // circle
        if (circleEl) {
            const deg = Math.max(0, Math.min(100, percent)) * 3.6;
            circleEl.style.background = `conic-gradient(#2563eb ${deg}deg, #e6e8ee 0deg)`;

            // подстраховка для внутреннего span
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

        // button to course
        if (btn) {
            const href = `/courses/${data.course.slug}`;
            btn.setAttribute("href", href);
            btn.style.pointerEvents = "";
            btn.style.opacity = "";

            btn.onclick = (e) => {
                const h = btn.getAttribute("href");
                if (!h || h === "#") {
                    e.preventDefault();
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
