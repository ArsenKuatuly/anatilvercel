

(() => {
    const root = document.getElementById("myprogress");
    if (!root) return;

    const states = Array.from(root.querySelectorAll(".myprogress__state"));
    const setState = (name) => {
        states.forEach((s) => s.classList.toggle("is-active", s.dataset.state === name));
    };

    const escapeHtml = (s) =>
        String(s ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    const clampPct = (n) => Math.max(0, Math.min(100, Number(n) || 0));

    // SVG (в стиле lucide)
    const icons = {
        clock: `
      <svg class="activity__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 6v6l4 2"></path>
      </svg>
    `,
        book: `
      <svg class="activity__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 7v14"></path>
        <path d="M3 18a2 2 0 0 0 2 2h7"></path>
        <path d="M3 6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2"></path>
        <path d="M12 4h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7"></path>
      </svg>
    `,
        calendar: `
      <svg class="activity__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2"></rect>
        <path d="M16 2v4"></path>
        <path d="M8 2v4"></path>
        <path d="M3 10h18"></path>
      </svg>
    `,
        timer: `
      <svg class="activity__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M10 2h4"></path>
        <path d="M12 14l2-2"></path>
        <circle cx="12" cy="14" r="8"></circle>
      </svg>
    `,
        lock: `
      <svg class="module__lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    `,
        award: `
      <svg class="ach__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="6"></circle>
        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
      </svg>
    `,
        star: `
      <svg class="ach__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"></path>
      </svg>
    `,
        trophy: `
      <svg class="ach__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M8 21h8"></path>
        <path d="M12 17v4"></path>
        <path d="M7 4h10v3a5 5 0 0 1-10 0V4z"></path>
        <path d="M5 7a4 4 0 0 1-2-3V4h4"></path>
        <path d="M19 7a4 4 0 0 0 2-3V4h-4"></path>
      </svg>
    `,
    };

    const el = (id) => document.getElementById(id);

    function setText(id, text) {
        const node = el(id);
        if (node) node.textContent = text;
    }

    function renderActivity(items) {
        const activityList = el("activityList");
        if (!activityList) return;
        activityList.innerHTML = (items || [])
            .map((a) => {
                const ic = icons[a.icon] || icons.clock;
                return `
          <div class="activity__item">
            <div class="activity__iconbox">${ic}</div>
            <div class="activity__content">
              <p class="activity__label">${escapeHtml(a.label)}</p>
              <p class="activity__value">${escapeHtml(a.value)}</p>
            </div>
          </div>
        `;
            })
            .join("");
    }

    function renderAchievements(items) {
        const achievementsList = el("achievementsList");
        if (!achievementsList) return;
        achievementsList.innerHTML = (items || [])
            .map((a) => {
                const ic = icons[a.icon] || icons.award;
                const desc = a.description ? `<p class="ach__desc">${escapeHtml(a.description)}</p>` : "";
                return `
          <div class="ach">
            <div class="ach__row">
              <div class="ach__iconbox">${ic}</div>
              <div class="ach__text">
                <p class="ach__title">${escapeHtml(a.title)}</p>
                ${desc}
              </div>
            </div>
          </div>
        `;
            })
            .join("");
    }

    function renderModules(modules) {
        const modulesList = el("modulesList");
        if (!modulesList) return;

        modulesList.innerHTML = (modules || [])
            .map((m, idx) => {
                const locked = !!m.locked;
                const lessons = Array.isArray(m.lessons) ? m.lessons : [];
                const total = lessons.length;
                const done = lessons.filter((l) => Number(l.completed) === 1 || l.completed === true).length;
                const mp = total > 0 ? clampPct(Math.round((done / total) * 100)) : 0;

                return `
          <div class="module ${locked ? "module--locked" : ""}">
            <div class="module__top">
              <div class="module__left">
                ${
                    locked
                        ? `<div class="module__iconbox module__iconbox--locked">${icons.lock}</div>`
                        : `<div class="module__iconbox module__iconbox--open"><span class="module__number">${idx + 1}</span></div>`
                }
                <div class="module__text">
                  <h3 class="module__name">${escapeHtml(m.title || "")}</h3>
                </div>
              </div>
              ${locked ? "" : `<span class="module__pct">${mp}%</span>`}
            </div>

            ${
                    locked
                        ? `<p class="module__hint">Модуль закрыт</p>`
                        : `
                  <div class="progressbar progressbar--h2">
                    <div class="progressbar__fill" style="width:${mp}%"></div>
                  </div>
                `
                }
          </div>
        `;
            })
            .join("");
    }

    function buildAchievements({ completedLessons, percent, modulesCount, completedModules }) {
        const out = [];
        if ((completedLessons || 0) >= 1) out.push({ icon: "award", title: "Первый урок", description: "Начало пути" });
        if ((completedLessons || 0) >= 5) out.push({ icon: "star", title: "5 уроков", description: "Хороший темп" });
        if ((completedModules || 0) >= 1) out.push({ icon: "star", title: "Первый модуль", description: "Отличная работа" });
        if ((modulesCount || 0) > 0 && (completedModules || 0) === (modulesCount || 0)) out.push({ icon: "trophy", title: "Все модули", description: "Курс почти завершён" });
        if ((percent || 0) >= 100) out.push({ icon: "trophy", title: "Курс завершён", description: "Поздравляем!" });
        return out.slice(0, 6);
    }

    async function setAdminVisibility() {
        const adminBtn = document.getElementById("adminBtn");
        if (!adminBtn) return;
        try {
            const me = await window.authFetch("/api/auth/me", { method: "GET" });
            if (me?.data?.success && me.data.user?.role === "admin") {
                adminBtn.style.display = "inline-block";
            }
        } catch {

        }
    }

    async function loadAchievements() {
        const res = await authFetch("/api/achievements/my", { method: "GET" });
        if (!res?.data?.success) return;

        const list = document.getElementById("achievementsList");
        if (!list) return;

        list.innerHTML = res.data.achievements.length
            ? res.data.achievements
                .map(
                    (a) => `
          <div class="ach">
            <p class="ach__title">${a.title}</p>
            <p class="ach__desc">${a.description}</p>
          </div>
        `
                )
                .join("")
            : `<p class="muted">Пока нет достижений</p>`;
    }


    function bindButtons(slug) {
        const continueBtn = el("continueCourseBtn");
        if (continueBtn) {
            continueBtn.onclick = () => {
                if (!slug) return;
                window.location.href = `/coursemodul.html?slug=${encodeURIComponent(slug)}`;
            };
        }

        const startTestBtn = el("startTestBtn");
        if (startTestBtn) {
            startTestBtn.onclick = () => {
                window.location.href = "/test.html";
            };
        }
    }

    async function load() {
        if (!window.authFetch) {
            console.error("authFetch не найден (подключи /js/authFetch.js)");
            return;
        }

        setState("loading");
        await setAdminVisibility();

        try {
            const prog = await window.authFetch("/api/lessons/progress/current", { method: "GET" });
            const p = prog?.data;

            if (!p?.success) {
                setState("empty");
                bindButtons(null);
                return;
            }


            if (!p.course) {
                setState("empty");
                bindButtons(null);
                return;
            }

            const slug = p.course.slug;
            bindButtons(slug);


            let modulesPayload = null;
            try {
                const courseRes = await window.authFetch(`/api/course/${encodeURIComponent(slug)}`, { method: "GET" });
                modulesPayload = courseRes?.data;
            } catch (e) {
                console.warn("Не удалось загрузить модули курса:", e);
            }

            const courseTitle = modulesPayload?.course?.title || p.course.title || "Курс";
            const courseLevel = modulesPayload?.course?.level || p.course.level || "";

            const percent = clampPct(p.percent);
            const completedLessons = Number(p.completedLessons || 0);
            const totalLessons = Number(p.totalLessons || 0);

            const statusText =
                modulesPayload?.course?.completed || percent >= 100
                    ? "завершён"
                    : "в процессе";

            setText("courseName", courseTitle);
            setText("courseLevel", courseLevel ? `Уровень: ${courseLevel}` : "Уровень: —");
            setText("courseStatus", `Статус: ${statusText}`);
            setText("courseProgressValue", `${percent}%`);

            const fill = el("courseProgressFill");
            if (fill) fill.style.width = `${percent}%`;

            const progressbar = root.querySelector('.progressbar[role="progressbar"]');
            if (progressbar) progressbar.setAttribute("aria-valuenow", String(percent));

            setText("lessonsText", `Пройдено уроков: ${completedLessons} из ${totalLessons}`);


            renderModules(Array.isArray(modulesPayload?.modules) ? modulesPayload.modules : []);


            const activity = [];
            activity.push({
                icon: "book",
                label: "Последний пройденный урок",
                value: p.lastLesson?.title ? p.lastLesson.title : "—",
            });
            activity.push({
                icon: "clock",
                label: "Следующий урок",
                value: p.nextLesson?.title ? p.nextLesson.title : "—",
            });
            activity.push({
                icon: "calendar",
                label: "Модули",
                value: `${Number(p.completedModules || 0)} из ${Number(p.modulesCount || 0)} завершено`,
            });
            activity.push({
                icon: "timer",
                label: "Уроки",
                value: `${completedLessons} из ${totalLessons} завершено`,
            });
            renderActivity(activity);


            renderAchievements(
                buildAchievements({
                    completedLessons,
                    percent,
                    modulesCount: Number(p.modulesCount || 0),
                    completedModules: Number(p.completedModules || 0),
                })
            );

            setState("normal");
        } catch (err) {
            console.error("myprogress load error:", err);

            setState("empty");
            bindButtons(null);
        }
    }

    load();
    loadAchievements();

})();
