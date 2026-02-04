// myprogress.js
(() => {
    const root = document.getElementById("myprogress");
    if (!root) return;

    const states = Array.from(root.querySelectorAll(".myprogress__state"));

    const setState = (name) => {
        states.forEach((s) => s.classList.toggle("is-active", s.dataset.state === name));
    };


    const mockData = {
        course: {
            name: "A2 — Базовый уровень",
            level: "A2",
            status: "в процессе",
            progress: 35,
            lessonsCompleted: 7,
            totalLessons: 20,
        },
        activity: [
            { icon: "book", label: "Последний пройденный урок", value: "Урок 7: Прошедшее время" },
            { icon: "clock", label: "Следующий урок", value: "Урок 8: Будущее время" },
            { icon: "calendar", label: "Последняя дата обучения", value: "2 февраля 2026" },
            { icon: "timer", label: "Время обучения за неделю", value: "3 часа 45 минут" },
        ],
        modules: [
            { number: 1, name: "Модуль 1: Основы грамматики", progress: 80, locked: false },
            { number: 2, name: "Модуль 2: Времена глаголов", progress: 20, locked: false },
            { number: 3, name: "Модуль 3: Разговорная практика", progress: 0, locked: true },
            { number: 4, name: "Модуль 4: Письменная речь", progress: 0, locked: true },
        ],
        achievements: [
            { icon: "award", title: "Первый урок", description: "Начало пути" },
            { icon: "star", title: "5 уроков", description: "Отличный старт" },
            { icon: "trophy", title: "Тест пройден", description: "Первый успех" },
        ],
    };

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

    const clampPct = (n) => Math.max(0, Math.min(100, Number(n) || 0));

    const render = (data) => {
        // Course
        const courseName = document.getElementById("courseName");
        const courseLevel = document.getElementById("courseLevel");
        const courseStatus = document.getElementById("courseStatus");
        const courseProgressValue = document.getElementById("courseProgressValue");
        const courseProgressFill = document.getElementById("courseProgressFill");
        const lessonsText = document.getElementById("lessonsText");

        const pct = clampPct(data.course.progress);

        if (courseName) courseName.textContent = data.course.name;
        if (courseLevel) courseLevel.textContent = `Уровень: ${data.course.level}`;
        if (courseStatus) courseStatus.textContent = `Статус: ${data.course.status}`;
        if (courseProgressValue) courseProgressValue.textContent = `${pct}%`;
        if (courseProgressFill) courseProgressFill.style.width = `${pct}%`;
        if (lessonsText) lessonsText.textContent = `Пройдено уроков: ${data.course.lessonsCompleted} из ${data.course.totalLessons}`;

        // aria-valuenow on progressbar
        const progressbar = root.querySelector('.progressbar[role="progressbar"]');
        if (progressbar) progressbar.setAttribute("aria-valuenow", String(pct));

        // Modules
        const modulesList = document.getElementById("modulesList");
        if (modulesList) {
            modulesList.innerHTML = data.modules
                .map((m) => {
                    const mp = clampPct(m.progress);
                    const locked = !!m.locked;

                    return `
            <div class="module ${locked ? "module--locked" : ""}">
              <div class="module__top">
                <div class="module__left">
                  ${
                        locked
                            ? `<div class="module__iconbox module__iconbox--locked">${icons.lock}</div>`
                            : `<div class="module__iconbox module__iconbox--open"><span class="module__number">${m.number}</span></div>`
                    }
                  <div class="module__text">
                    <h3 class="module__name">${escapeHtml(m.name)}</h3>
                  </div>
                </div>
                ${
                        locked
                            ? ``
                            : `<span class="module__pct">${mp}%</span>`
                    }
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

        // Activity
        const activityList = document.getElementById("activityList");
        if (activityList) {
            activityList.innerHTML = data.activity
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

        // Achievements
        const achievementsList = document.getElementById("achievementsList");
        if (achievementsList) {
            achievementsList.innerHTML = data.achievements
                .map((a) => {
                    const ic = icons[a.icon] || icons.award;
                    const desc = a.description
                        ? `<p class="ach__desc">${escapeHtml(a.description)}</p>`
                        : "";
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
    };

    const escapeHtml = (s) => {
        return String(s)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    };

    // Кнопки
    const continueBtn = document.getElementById("continueCourseBtn");
    if (continueBtn) {
        continueBtn.addEventListener("click", () => {
            // тут поставь свою навигацию
            console.log("Переход к курсу");
            // window.location.href = "/course.html";
        });
    }

    const startTestBtn = document.getElementById("startTestBtn");
    if (startTestBtn) {
        startTestBtn.addEventListener("click", () => {
            console.log("Начать тест");
            // window.location.href = "/test.html";
        });
    }


    setState("loading");


    window.setTimeout(() => {


        render(mockData);
        setState("normal");
    }, 450);
})();
