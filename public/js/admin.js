(() => {
    const $ = (s, r = document) => r.querySelector(s);

    const icons = {
        menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>`,
        x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>`,
        users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
        clip: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11h6"/><path d="M9 15h6"/><path d="M8 3h8l2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/></svg>`,
        chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14v4"/><path d="M11 10v8"/><path d="M15 6v12"/><path d="M19 12v6"/></svg>`,
        lib: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 6h10"/><path d="M8 10h10"/></svg>`,
        ext: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v7H3V3h7"/></svg>`,
        chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
        back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
        save: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>`,
        edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>`,
        shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>`
    };

    const state = {
        activeTab: "users",
        mobileOpen: false
    };

    const usersState = {
        loading: false,
        items: [
            { id: 1, login: "user_001", role: "user", level: "A1" },
            { id: 2, login: "admin_master", role: "admin", level: "C1" },
            { id: 3, login: "student_ivanov", role: "user", level: "B2" },
            { id: 4, login: "teacher_petrov", role: "teacher", level: "C2" },
            { id: 5, login: "user_002", role: "user", level: "A2" }
        ]
    };

    const coursesState = {
        view: "courses",
        selectedCourse: null,
        selectedModule: null,
        courses: [
            { id: 1, name: "Основы турецкого языка", level: "A1" },
            { id: 2, name: "Разговорный турецкий", level: "A2" },
            { id: 3, name: "Продвинутая грамматика", level: "B1" },
            { id: 4, name: "Деловой турецкий", level: "B2" }
        ],
        modules: [
            { id: 1, name: "Модуль 1: Алфавит и произношение", courseId: 1 },
            { id: 2, name: "Модуль 2: Базовые фразы", courseId: 1 },
            { id: 3, name: "Модуль 3: Глаголы настоящего времени", courseId: 1 },
            { id: 4, name: "Модуль 1: Повседневные диалоги", courseId: 2 },
            { id: 5, name: "Модуль 2: В кафе и ресторане", courseId: 2 },
            { id: 6, name: "Модуль 1: Падежи и окончания", courseId: 3 }
        ],
        lessons: [
            { id: 1, name: "Урок 1: Буквы и звуки", content: "Контент урока...\n\nПример текста.", moduleId: 1 },
            { id: 2, name: "Урок 2: Ударение", content: "Контент урока...\n\nПравила ударения.", moduleId: 1 },
            { id: 3, name: "Урок 1: Приветствие", content: "Merhaba!\nNasılsın?", moduleId: 2 },
            { id: 4, name: "Урок 1: Настоящее время", content: "-iyor/ -ıyor ...", moduleId: 3 }
        ]
    };

    const tasksState = {
        view: "list",
        selectedTask: null,
        tasks: [
            { id: 1, name: "Тест: Алфавит", course: "Основы турецкого языка", description: "Проверка знаний алфавита", passingScore: 70 },
            { id: 2, name: "Тест: Базовые фразы", course: "Основы турецкого языка", description: "Повседневные выражения", passingScore: 80 },
            { id: 3, name: "Тест: Глаголы", course: "Разговорный турецкий", description: "Спряжение глаголов", passingScore: 75 }
        ],
        questions: [
            { id: 1, taskId: 1, question: "Сколько букв в турецком алфавите?", options: '["28","29","30","31"]' },
            { id: 2, taskId: 1, question: "Какой буквы нет в турецком алфавите?", options: '["Q","X","W","Все перечисленные"]' },
            { id: 3, taskId: 1, question: "Как произносится буква Ç?", options: '["ч","ш","дж","ц"]' }
        ]
    };

    const libraryState = {
        view: "list",
        selectedMaterial: null,
        types: ["Слова", "Грамматика", "Чтение", "Диалоги", "Упражнения"],
        levels: ["A1", "A2", "B1", "B2", "C1", "C2"],
        materials: [
            { id: 1, name: "Основные глаголы движения", type: "Слова", level: "A1", description: "Список самых важных глаголов для начинающих", content: "gitmek - идти\ngelmek - приходить\nkoşmak - бежать\n..." },
            { id: 2, name: "Времена глаголов", type: "Грамматика", level: "A2", description: "Обзор основных временных форм", content: "Настоящее время: -iyor\nПрошедшее: -di/-dı\n..." },
            { id: 3, name: "Текст: В магазине", type: "Чтение", level: "B1", description: "Практический текст для чтения", content: "Ahmet dükkana gitti. Ekmek ve süt aldı..." }
        ]
    };

    function escapeHtml(s) {
        return String(s)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function fmtNumber(n) {
        try { return Number(n).toLocaleString("ru-RU"); } catch { return String(n); }
    }

    function isDesktop() {
        return window.matchMedia("(min-width: 1024px)").matches;
    }

    function setMobileIcon() {
        const el = $("#mobileMenuIcon");
        if (!el) return;
        el.innerHTML = state.mobileOpen ? icons.x : icons.menu;
    }

    function openMobile(open) {
        state.mobileOpen = !!open;
        const overlay = $("#overlay");
        const drawer = $("#drawer");
        if (overlay) overlay.hidden = !state.mobileOpen;
        if (drawer) drawer.hidden = !state.mobileOpen;
        setMobileIcon();
        if (state.mobileOpen) renderDrawer();
    }

    function renderSidebar(targetEl, opts) {
        const isMobile = !!opts?.isMobile;
        const showTop = !isMobile;

        const items = [
            { id: "users", label: "Пользователи", icon: icons.users },
            { id: "courses", label: "Курсы", icon: icons.book },
            { id: "tasks", label: "Задания", icon: icons.clip },
            { id: "stats", label: "Статистика", icon: icons.chart },
            { id: "library", label: "Библиотека", icon: icons.lib }
        ];

        targetEl.innerHTML = `
      <div class="sidebar__inner">
        ${showTop ? `
          <div class="sidebar__top">
            <h1 class="sidebar__title">AnaTil Admin</h1>
          </div>
        ` : ``}

        <nav class="sidebar__nav">
          ${items.map(it => {
            const active = state.activeTab === it.id;
            return `
              <button class="sidebar__btn ${active ? "sidebar__btn--active" : ""}" data-tab="${it.id}" type="button">
                ${active ? `<span class="sidebar__activebar"></span>` : ``}
                <span class="sidebar__icon">${it.icon}</span>
                <span class="sidebar__label">${it.label}</span>
              </button>
            `;
        }).join("")}
        </nav>

        <div class="sidebar__bottom">
          <a class="sidebar__link" href="/">
            ${icons.ext}
            На сайт
          </a>
        </div>
      </div>
    `;

        targetEl.querySelectorAll("[data-tab]").forEach(btn => {
            btn.addEventListener("click", () => {
                state.activeTab = btn.getAttribute("data-tab");
                renderAll();
                if (isMobile) openMobile(false);
            });
        });
    }

    function renderDrawer() {
        const drawer = $("#drawer");
        if (!drawer) return;
        drawer.innerHTML = `<aside class="sidebar sidebar--mobile"></aside>`;
        const aside = $(".sidebar", drawer);
        renderSidebar(aside, { isMobile: true });
    }

    function renderUsers() {
        if (usersState.loading) {
            return `
        <div>
          <h2 class="page__title">Пользователи</h2>
          <div class="card card--p6">
            <div class="stack">
              ${[1,2,3,4,5].map(() => `<div style="height:56px;background:#F3F4F6;border-radius:16px;"></div>`).join("")}
            </div>
          </div>
        </div>
      `;
        }

        const rows = usersState.items.map(u => `
      <tr>
        <td style="font-weight:600;">${u.id}</td>
        <td>${escapeHtml(u.login)}</td>
        <td>
          <select class="control control--sm" data-user-role="${u.id}">
            <option value="user" ${u.role==="user"?"selected":""}>User</option>
            <option value="admin" ${u.role==="admin"?"selected":""}>Admin</option>
            <option value="teacher" ${u.role==="teacher"?"selected":""}>Teacher</option>
          </select>
        </td>
        <td><span class="badge badge--blue">${escapeHtml(u.level)}</span></td>
        <td>
          <button class="btn btn--danger" data-user-reset="${u.id}" type="button">Сброс</button>
        </td>
      </tr>
    `).join("");

        const cards = usersState.items.map(u => `
      <div class="ucard">
        <div class="ucard__top">
          <div>
            <p class="ucard__name">${escapeHtml(u.login)}</p>
            <p class="ucard__id">ID: ${u.id}</p>
          </div>
          <span class="badge badge--blue">${escapeHtml(u.level)}</span>
        </div>

        <div class="stack">
          <div>
            <label class="field__label">Role</label>
            <select class="control" data-user-role="${u.id}">
              <option value="user" ${u.role==="user"?"selected":""}>User</option>
              <option value="admin" ${u.role==="admin"?"selected":""}>Admin</option>
              <option value="teacher" ${u.role==="teacher"?"selected":""}>Teacher</option>
            </select>
          </div>

          <button class="btn btn--danger" data-user-reset="${u.id}" type="button">Сброс</button>
        </div>
      </div>
    `).join("");

        return `
      <div>
        <h2 class="page__title">Пользователи</h2>

        <div class="card tablecard" data-only-desktop>
          <div class="tablewrap">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Login</th>
                  <th>Role</th>
                  <th>Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>

        <div class="cards" data-only-mobile>
          ${cards}
        </div>

        ${usersState.items.length === 0 ? `<div class="card card__empty">Нет данных</div>` : ``}
      </div>
    `;
    }

    function coursesBreadcrumbs() {
        const c = coursesState.courses.find(x => x.id === coursesState.selectedCourse);
        const m = coursesState.modules.find(x => x.id === coursesState.selectedModule);

        const parts = [];
        parts.push(`<button class="breadcrumbs__btn" data-courses-nav="courses" type="button">Курсы</button>`);
        if (coursesState.view !== "courses" && c) {
            parts.push(`<span class="breadcrumbs__sep">/</span>`);
            parts.push(`<button class="breadcrumbs__btn" data-courses-nav="modules" type="button">${escapeHtml(c.name)}</button>`);
        }
        if (coursesState.view === "lessons" && m) {
            parts.push(`<span class="breadcrumbs__sep">/</span>`);
            parts.push(`<span>${escapeHtml(m.name)}</span>`);
        }
        return `<div class="breadcrumbs">${parts.join("")}</div>`;
    }

    function renderCourses() {
        const view = coursesState.view;

        if (view === "courses") {
            const items = coursesState.courses.map(c => `
        <button class="itembtn" type="button" data-course-open="${c.id}">
          <div>
            <p class="itembtn__title">${escapeHtml(c.name)}</p>
            <p class="itembtn__sub">Уровень: ${escapeHtml(c.level)}</p>
          </div>
          <div class="itembtn__right">
            <span class="badge badge--blue">${escapeHtml(c.level)}</span>
            <span class="sidebar__icon">${icons.chevronRight}</span>
          </div>
        </button>
      `).join("");

            return `
        <div>
          <h2 class="page__title">Курсы</h2>
          <div class="card card--p6">
            <div class="list">${items}</div>
          </div>
        </div>
      `;
        }

        if (view === "modules") {
            const course = coursesState.courses.find(c => c.id === coursesState.selectedCourse);
            const modules = coursesState.modules.filter(m => m.courseId === coursesState.selectedCourse);

            const items = modules.map(m => `
        <button class="itembtn" type="button" data-module-open="${m.id}">
          <div>
            <p class="itembtn__title">${escapeHtml(m.name)}</p>
            <p class="itembtn__sub">${course ? escapeHtml(course.name) : ""}</p>
          </div>
          <div class="itembtn__right">
            <span class="sidebar__icon">${icons.chevronRight}</span>
          </div>
        </button>
      `).join("");

            return `
        <div>
          <h2 class="page__title">Курсы</h2>
          ${coursesBreadcrumbs()}
          <div class="card card--p6">
            <div class="row row--between row--wrap" style="margin-bottom:12px;">
              <div class="card__muted">Модули курса</div>
              <button class="btn btn--ghost" type="button" data-courses-back="courses">
                <span class="sidebar__icon">${icons.back}</span>
                Назад
              </button>
            </div>
            <div class="list">${items || `<div class="card__empty">Нет модулей</div>`}</div>
          </div>
        </div>
      `;
        }

        const module = coursesState.modules.find(m => m.id === coursesState.selectedModule);
        const lessons = coursesState.lessons.filter(l => l.moduleId === coursesState.selectedModule);

        const lessonItems = lessons.map(l => `
      <button class="itembtn" type="button" data-lesson-open="${l.id}">
        <div>
          <p class="itembtn__title">${escapeHtml(l.name)}</p>
          <p class="itembtn__sub">${module ? escapeHtml(module.name) : ""}</p>
        </div>
        <div class="itembtn__right">
          <span class="sidebar__icon">${icons.edit}</span>
        </div>
      </button>
    `).join("");

        const currentLessonId = Number(coursesState.currentLessonId || 0);
        const currentLesson = coursesState.lessons.find(l => l.id === currentLessonId) || lessons[0] || null;
        if (currentLesson && !coursesState.currentLessonId) coursesState.currentLessonId = currentLesson.id;

        return `
      <div>
        <h2 class="page__title">Курсы</h2>
        ${coursesBreadcrumbs()}
        <div class="grid grid--2" style="align-items:start;">
          <div class="card card--p6">
            <div class="row row--between row--wrap" style="margin-bottom:12px;">
              <div class="card__muted">Уроки</div>
              <button class="btn btn--ghost" type="button" data-courses-back="modules">
                <span class="sidebar__icon">${icons.back}</span>
                Назад
              </button>
            </div>
            <div class="list">${lessonItems || `<div class="card__empty">Нет уроков</div>`}</div>
          </div>

          <div class="card card--p6">
            <div class="row row--between row--wrap" style="margin-bottom:12px;">
              <div>
                <div style="font-weight:700;">${currentLesson ? escapeHtml(currentLesson.name) : "Выберите урок"}</div>
                <div class="smallnote">${module ? escapeHtml(module.name) : ""}</div>
              </div>
              <div class="editor__actions">
                <button class="btn btn--primary" type="button" data-course-save>
                  <span class="sidebar__icon">${icons.save}</span>
                  Сохранить
                </button>
              </div>
            </div>

            <label class="field__label" style="margin-top:8px;">Контент урока</label>
            <textarea class="textarea" data-lesson-content>${currentLesson ? escapeHtml(currentLesson.content) : ""}</textarea>
            <div class="smallnote" style="margin-top:8px;">Изменения сохраняются в демо-стейте (без backend).</div>
          </div>
        </div>
      </div>
    `;
    }

    function renderTasks() {
        if (tasksState.view === "list") {
            const items = tasksState.tasks.map(t => `
        <button class="itembtn" type="button" data-task-edit="${t.id}">
          <div>
            <p class="itembtn__title">${escapeHtml(t.name)}</p>
            <p class="itembtn__sub">${escapeHtml(t.course)} • Проходной балл: ${t.passingScore}%</p>
          </div>
          <div class="itembtn__right">
            <span class="sidebar__icon">${icons.edit}</span>
          </div>
        </button>
      `).join("");

            return `
        <div>
          <h2 class="page__title">Задания</h2>
          <div class="card card--p6">
            <div class="list">${items || `<div class="card__empty">Нет заданий</div>`}</div>
          </div>
        </div>
      `;
        }

        const task = tasksState.tasks.find(t => t.id === tasksState.selectedTask);
        const q = tasksState.questions.filter(x => x.taskId === tasksState.selectedTask);

        return `
      <div>
        <h2 class="page__title">Задания</h2>

        <div class="breadcrumbs">
          <button class="breadcrumbs__btn" data-task-nav="list" type="button">Список</button>
          <span class="breadcrumbs__sep">/</span>
          <span>${task ? escapeHtml(task.name) : "Редактирование"}</span>
        </div>

        <div class="card card--p6">
          <div class="row row--between row--wrap" style="margin-bottom:12px;">
            <button class="btn btn--ghost" type="button" data-task-nav="list">
              <span class="sidebar__icon">${icons.back}</span>
              Назад
            </button>
            <button class="btn btn--primary" type="button" data-task-save>
              <span class="sidebar__icon">${icons.save}</span>
              Сохранить
            </button>
          </div>

          <div class="grid grid--2">
            <div class="stack">
              <div>
                <label class="field__label">Название</label>
                <input class="control" data-task-name value="${task ? escapeHtml(task.name) : ""}" />
              </div>
              <div>
                <label class="field__label">Курс</label>
                <input class="control" data-task-course value="${task ? escapeHtml(task.course) : ""}" />
              </div>
            </div>

            <div class="stack">
              <div>
                <label class="field__label">Проходной балл (%)</label>
                <input class="control" type="number" min="0" max="100" data-task-score value="${task ? task.passingScore : 0}" />
              </div>
              <div>
                <label class="field__label">Описание</label>
                <input class="control" data-task-desc value="${task ? escapeHtml(task.description) : ""}" />
              </div>
            </div>
          </div>

          <div class="divider" style="margin:18px 0;"></div>

          <div class="row row--between row--wrap" style="margin-bottom:10px;">
            <div style="font-weight:700;">Вопросы</div>
            <div class="smallnote">options — JSON-массив строк</div>
          </div>

          <div class="stack">
            ${q.map(qq => `
              <div class="card card--p4" style="border:1px solid var(--border);">
                <div class="stack">
                  <div>
                    <label class="field__label">Вопрос</label>
                    <input class="control" data-q-question="${qq.id}" value="${escapeHtml(qq.question)}" />
                  </div>
                  <div>
                    <label class="field__label">Options</label>
                    <input class="control" data-q-options="${qq.id}" value="${escapeHtml(qq.options)}" />
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
    }

    function renderLibrary() {
        if (libraryState.view === "list") {
            const items = libraryState.materials.map(m => `
        <button class="itembtn" type="button" data-material-edit="${m.id}">
          <div>
            <p class="itembtn__title">${escapeHtml(m.name)}</p>
            <p class="itembtn__sub">${escapeHtml(m.type)} • ${escapeHtml(m.level)} • ${escapeHtml(m.description)}</p>
          </div>
          <div class="itembtn__right">
            <span class="badge badge--blue">${escapeHtml(m.level)}</span>
            <span class="sidebar__icon">${icons.edit}</span>
          </div>
        </button>
      `).join("");

            return `
        <div>
          <h2 class="page__title">Библиотека</h2>
          <div class="card card--p6">
            <div class="list">${items || `<div class="card__empty">Нет материалов</div>`}</div>
          </div>
        </div>
      `;
        }

        const material = libraryState.materials.find(m => m.id === libraryState.selectedMaterial);

        return `
      <div>
        <h2 class="page__title">Библиотека</h2>

        <div class="breadcrumbs">
          <button class="breadcrumbs__btn" data-lib-nav="list" type="button">Список</button>
          <span class="breadcrumbs__sep">/</span>
          <span>${material ? escapeHtml(material.name) : "Редактирование"}</span>
        </div>

        <div class="card card--p6">
          <div class="row row--between row--wrap" style="margin-bottom:12px;">
            <button class="btn btn--ghost" type="button" data-lib-nav="list">
              <span class="sidebar__icon">${icons.back}</span>
              Назад
            </button>
            <button class="btn btn--primary" type="button" data-lib-save>
              <span class="sidebar__icon">${icons.save}</span>
              Сохранить
            </button>
          </div>

          <div class="grid grid--2">
            <div class="stack">
              <div>
                <label class="field__label">Название</label>
                <input class="control" data-lib-name value="${material ? escapeHtml(material.name) : ""}" />
              </div>
              <div>
                <label class="field__label">Описание</label>
                <input class="control" data-lib-desc value="${material ? escapeHtml(material.description) : ""}" />
              </div>
            </div>

            <div class="stack">
              <div>
                <label class="field__label">Тип</label>
                <select class="control" data-lib-type>
                  ${libraryState.types.map(t => `<option value="${escapeHtml(t)}" ${material && material.type===t ? "selected":""}>${escapeHtml(t)}</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="field__label">Уровень</label>
                <select class="control" data-lib-level>
                  ${libraryState.levels.map(l => `<option value="${escapeHtml(l)}" ${material && material.level===l ? "selected":""}>${escapeHtml(l)}</option>`).join("")}
                </select>
              </div>
            </div>
          </div>

          <div style="margin-top:14px;">
            <label class="field__label">Контент</label>
            <textarea class="textarea" data-lib-content>${material ? escapeHtml(material.content) : ""}</textarea>
            <div class="smallnote" style="margin-top:8px;">Изменения сохраняются в демо-стейте (без backend).</div>
          </div>
        </div>
      </div>
    `;
    }

    function renderStats() {
        const stats = [
            { label: "Пользователи", value: 1247, icon: icons.users, bg: "rgba(37,99,235,.1)", color: "#2563EB" },
            { label: "Админы", value: 12, icon: icons.shield, bg: "rgba(22,163,74,.12)", color: "#16A34A" },
            { label: "Тестов пройдено", value: 3584, icon: icons.check, bg: "rgba(147,51,234,.12)", color: "#7C3AED" }
        ];

        return `
      <div>
        <h2 class="page__title">Статистика</h2>
        <div class="card card--p6">
          <div class="stack">
            ${stats.map(s => `
              <div class="kpi">
                <div class="kpi__icon" style="background:${s.bg}; color:${s.color};">${s.icon}</div>
                <div style="flex:1;">
                  <p class="kpi__label">${escapeHtml(s.label)}</p>
                  <p class="kpi__value">${fmtNumber(s.value)}</p>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
    }

    function renderContent() {
        if (state.activeTab === "users") return renderUsers();
        if (state.activeTab === "courses") return renderCourses();
        if (state.activeTab === "tasks") return renderTasks();
        if (state.activeTab === "stats") return renderStats();
        if (state.activeTab === "library") return renderLibrary();
        return renderUsers();
    }

    function wireUsers(root) {
        root.querySelectorAll("[data-user-role]").forEach(sel => {
            sel.addEventListener("change", (e) => {
                const id = Number(sel.getAttribute("data-user-role"));
                const val = e.target.value;
                usersState.items = usersState.items.map(u => u.id === id ? { ...u, role: val } : u);
                renderAll();
            });
        });

        root.querySelectorAll("[data-user-reset]").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = Number(btn.getAttribute("data-user-reset"));
                if (confirm("Сбросить прогресс этого пользователя?")) {
                    console.log("Reset user:", id);
                }
            });
        });
    }

    function wireCourses(root) {
        root.querySelectorAll("[data-course-open]").forEach(btn => {
            btn.addEventListener("click", () => {
                coursesState.selectedCourse = Number(btn.getAttribute("data-course-open"));
                coursesState.selectedModule = null;
                coursesState.view = "modules";
                delete coursesState.currentLessonId;
                renderAll();
            });
        });

        root.querySelectorAll("[data-module-open]").forEach(btn => {
            btn.addEventListener("click", () => {
                coursesState.selectedModule = Number(btn.getAttribute("data-module-open"));
                coursesState.view = "lessons";
                delete coursesState.currentLessonId;
                renderAll();
            });
        });

        root.querySelectorAll("[data-lesson-open]").forEach(btn => {
            btn.addEventListener("click", () => {
                coursesState.currentLessonId = Number(btn.getAttribute("data-lesson-open"));
                renderAll();
            });
        });

        root.querySelectorAll("[data-courses-back]").forEach(btn => {
            btn.addEventListener("click", () => {
                const target = btn.getAttribute("data-courses-back");
                if (target === "courses") {
                    coursesState.view = "courses";
                    coursesState.selectedCourse = null;
                    coursesState.selectedModule = null;
                    delete coursesState.currentLessonId;
                } else {
                    coursesState.view = "modules";
                    coursesState.selectedModule = null;
                    delete coursesState.currentLessonId;
                }
                renderAll();
            });
        });

        root.querySelectorAll("[data-courses-nav]").forEach(btn => {
            btn.addEventListener("click", () => {
                const target = btn.getAttribute("data-courses-nav");
                if (target === "courses") {
                    coursesState.view = "courses";
                    coursesState.selectedCourse = null;
                    coursesState.selectedModule = null;
                    delete coursesState.currentLessonId;
                } else if (target === "modules") {
                    coursesState.view = "modules";
                    coursesState.selectedModule = null;
                    delete coursesState.currentLessonId;
                }
                renderAll();
            });
        });

        const textarea = root.querySelector("[data-lesson-content]");
        if (textarea) {
            textarea.addEventListener("input", () => {
                const id = Number(coursesState.currentLessonId || 0);
                coursesState.lessons = coursesState.lessons.map(l => l.id === id ? { ...l, content: textarea.value } : l);
            });
        }

        const saveBtn = root.querySelector("[data-course-save]");
        if (saveBtn) {
            saveBtn.addEventListener("click", () => {
                console.log("Save lesson demo:", coursesState.currentLessonId);
            });
        }
    }

    function wireTasks(root) {
        root.querySelectorAll("[data-task-edit]").forEach(btn => {
            btn.addEventListener("click", () => {
                tasksState.selectedTask = Number(btn.getAttribute("data-task-edit"));
                tasksState.view = "edit";
                renderAll();
            });
        });

        root.querySelectorAll("[data-task-nav]").forEach(btn => {
            btn.addEventListener("click", () => {
                tasksState.view = btn.getAttribute("data-task-nav");
                if (tasksState.view === "list") tasksState.selectedTask = null;
                renderAll();
            });
        });

        const task = tasksState.tasks.find(t => t.id === tasksState.selectedTask);
        if (!task) return;

        const name = root.querySelector("[data-task-name]");
        const course = root.querySelector("[data-task-course]");
        const score = root.querySelector("[data-task-score]");
        const desc = root.querySelector("[data-task-desc]");

        const commit = () => {
            tasksState.tasks = tasksState.tasks.map(t => {
                if (t.id !== task.id) return t;
                return {
                    ...t,
                    name: name ? name.value : t.name,
                    course: course ? course.value : t.course,
                    passingScore: score ? Math.max(0, Math.min(100, Number(score.value || 0))) : t.passingScore,
                    description: desc ? desc.value : t.description
                };
            });
        };

        [name, course, score, desc].filter(Boolean).forEach(el => el.addEventListener("input", commit));

        root.querySelectorAll("[data-q-question]").forEach(inp => {
            inp.addEventListener("input", () => {
                const id = Number(inp.getAttribute("data-q-question"));
                tasksState.questions = tasksState.questions.map(q => q.id === id ? { ...q, question: inp.value } : q);
            });
        });

        root.querySelectorAll("[data-q-options]").forEach(inp => {
            inp.addEventListener("input", () => {
                const id = Number(inp.getAttribute("data-q-options"));
                tasksState.questions = tasksState.questions.map(q => q.id === id ? { ...q, options: inp.value } : q);
            });
        });

        const save = root.querySelector("[data-task-save]");
        if (save) {
            save.addEventListener("click", () => {
                commit();
                console.log("Save task demo:", tasksState.selectedTask);
            });
        }
    }

    function wireLibrary(root) {
        root.querySelectorAll("[data-material-edit]").forEach(btn => {
            btn.addEventListener("click", () => {
                libraryState.selectedMaterial = Number(btn.getAttribute("data-material-edit"));
                libraryState.view = "edit";
                renderAll();
            });
        });

        root.querySelectorAll("[data-lib-nav]").forEach(btn => {
            btn.addEventListener("click", () => {
                libraryState.view = btn.getAttribute("data-lib-nav");
                if (libraryState.view === "list") libraryState.selectedMaterial = null;
                renderAll();
            });
        });

        const material = libraryState.materials.find(m => m.id === libraryState.selectedMaterial);
        if (!material) return;

        const name = root.querySelector("[data-lib-name]");
        const desc = root.querySelector("[data-lib-desc]");
        const type = root.querySelector("[data-lib-type]");
        const level = root.querySelector("[data-lib-level]");
        const content = root.querySelector("[data-lib-content]");

        const commit = () => {
            libraryState.materials = libraryState.materials.map(m => {
                if (m.id !== material.id) return m;
                return {
                    ...m,
                    name: name ? name.value : m.name,
                    description: desc ? desc.value : m.description,
                    type: type ? type.value : m.type,
                    level: level ? level.value : m.level,
                    content: content ? content.value : m.content
                };
            });
        };

        [name, desc, type, level, content].filter(Boolean).forEach(el => el.addEventListener("input", commit));
        if (type) type.addEventListener("change", commit);
        if (level) level.addEventListener("change", commit);

        const save = root.querySelector("[data-lib-save]");
        if (save) {
            save.addEventListener("click", () => {
                commit();
                console.log("Save library material demo:", libraryState.selectedMaterial);
            });
        }
    }

    function applyResponsiveVisibility(root) {
        const onlyDesktop = root.querySelectorAll("[data-only-desktop]");
        const onlyMobile = root.querySelectorAll("[data-only-mobile]");
        const desktop = window.matchMedia("(min-width: 768px)").matches;

        onlyDesktop.forEach(el => { el.style.display = desktop ? "" : "none"; });
        onlyMobile.forEach(el => { el.style.display = desktop ? "none" : ""; });
    }

    function wireContent() {
        const root = $("#content");
        if (!root) return;

        applyResponsiveVisibility(root);

        if (state.activeTab === "users") wireUsers(root);
        if (state.activeTab === "courses") wireCourses(root);
        if (state.activeTab === "tasks") wireTasks(root);
        if (state.activeTab === "library") wireLibrary(root);
    }

    function renderAll() {
        const desktopSidebar = $("#desktopSidebar");
        if (desktopSidebar) renderSidebar(desktopSidebar, { isMobile: false });

        const content = $("#content");
        if (content) content.innerHTML = renderContent();

        wireContent();

        if (isDesktop()) openMobile(false);
    }

    document.addEventListener("DOMContentLoaded", () => {
        const btn = $("#mobileMenuBtn");
        const overlay = $("#overlay");

        setMobileIcon();

        if (btn) btn.addEventListener("click", () => openMobile(!state.mobileOpen));
        if (overlay) overlay.addEventListener("click", () => openMobile(false));

        window.addEventListener("resize", () => {
            renderAll();
        });

        renderAll();
    });
})();
