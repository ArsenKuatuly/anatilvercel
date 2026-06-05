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
    mobileOpen: false,
    me: null,
    busy: false,
    toast: null
  };

  const usersState = { loading: true, items: [] };
  const coursesState = {
    loading: true,
    view: "courses",
    selectedCourse: null,
    selectedModule: null,
    currentLessonId: null,
    courses: [],
    modules: [],
    lessons: []
  };
  const tasksState = {
    loading: true,
    view: "list",
    selectedTask: null,
    tasks: [],
    questions: []
  };
  const libraryState = {
    loading: true,
    view: "list",
    selectedMaterial: null,
    materials: [],

    types: ["Слова", "Грамматика", "Чтение", "Диалоги", "Упражнения"],
    levels: ["A1", "A2", "B1", "B2", "C1", "C2"]
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

  function toast(msg, type = "info") {
    state.toast = { msg, type, ts: Date.now() };
    renderAll();
    setTimeout(() => {
      if (state.toast && Date.now() - state.toast.ts >= 2900) {
        state.toast = null;
        renderAll();
      }
    }, 3000);
  }

  async function safeAuthFetch(url, opts) {
    try {
      state.busy = true;
      renderAll();
      return await window.authFetch(url, opts);
    } finally {
      state.busy = false;
      renderAll();
    }
  }

  async function ensureAdmin() {
    const r = await safeAuthFetch("/api/auth/me", { method: "GET" });
    const me = r?.data?.user;
    state.me = me || null;
    if (!me || me.role !== "admin") {
      location.replace("/dashboard.html");
      return false;
    }
    return true;
  }

  async function loadUsers() {
    usersState.loading = true;
    renderAll();
    const r = await safeAuthFetch("/api/admin/users", { method: "GET" });
    usersState.items = (r?.data?.users || []).map((u) => ({
      id: u.id,
      login: u.login,
      role: u.role,
      level: u.level || "elementary"
    }));
    usersState.loading = false;
  }

  async function loadCourses() {
    coursesState.loading = true;
    renderAll();
    const r = await safeAuthFetch("/api/admin/courses", { method: "GET" });
    coursesState.courses = (r?.data?.courses || []).map((c) => ({
      id: c.id,
      name: c.title,
      slug: c.slug,
      level: c.level,
      position: c.position
    }));
    coursesState.loading = false;
  }

  async function loadModules(courseId) {
    coursesState.loading = true;
    renderAll();
    const r = await safeAuthFetch(`/api/admin/courses/${courseId}/modules`, { method: "GET" });
    coursesState.modules = (r?.data?.modules || []).map((m) => ({
      id: m.id,
      name: m.title,
      position: m.position,
      courseId: m.course_id
    }));
    coursesState.loading = false;
  }

  async function loadLessons(moduleId) {
    coursesState.loading = true;
    renderAll();
    const r = await safeAuthFetch(`/api/admin/modules/${moduleId}/lessons`, { method: "GET" });
    coursesState.lessons = (r?.data?.lessons || []).map((l) => ({
      id: l.id,
      name: l.title,
      content: l.content || "",
      position: l.position,
      moduleId: l.module_id
    }));
    coursesState.loading = false;
  }

  async function loadTasks() {
    tasksState.loading = true;
    renderAll();
    const r = await safeAuthFetch("/api/admin/tasks", { method: "GET" });
    tasksState.tasks = (r?.data?.tasks || []).map((t) => ({
      id: t.id,
      name: t.name,
      course: t.course,
      courseId: t.courseId,
      description: t.description || "",
      passingScore: Number(t.passingScore || 0)
    }));
    tasksState.loading = false;
  }

  async function loadTaskDetail(taskId) {
    tasksState.loading = true;
    renderAll();
    const r = await safeAuthFetch(`/api/admin/tasks/${taskId}`, { method: "GET" });
    const t = r?.data?.task;
    const qs = r?.data?.questions || [];
    const idx = tasksState.tasks.findIndex((x) => x.id === taskId);
    if (idx >= 0 && t) {
      tasksState.tasks[idx] = {
        ...tasksState.tasks[idx],
        name: t.name,
        courseId: t.courseId,
        description: t.description || "",
        passingScore: Number(t.passingScore || 0)
      };
    }
    tasksState.questions = qs.map((q) => ({
      id: q.id,
      taskId: q.taskId,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer
    }));
    tasksState.loading = false;
  }

  async function loadLibrary() {
    libraryState.loading = true;
    renderAll();
    const r = await safeAuthFetch("/api/admin/library/materials", { method: "GET" });
    libraryState.materials = (r?.data?.materials || []).map((m) => ({
      id: m.id,
      name: m.title,
      description: m.description || "",
      type: m.type || "",
      level: m.level || "",
      category: m.category || "",
      duration: m.duration || "",
      icon: m.icon || "",
      sortOrder: Number(m.sort_order || 0)
    }));
    libraryState.loading = false;
  }

  async function loadActiveTab() {
    if (state.activeTab === "users") return loadUsers();
    if (state.activeTab === "courses") return loadCourses();
    if (state.activeTab === "tasks") return loadTasks();
    if (state.activeTab === "library") return loadLibrary();
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
            ${state.me ? `<div class="sidebar__sub">${escapeHtml(state.me.login)} • admin</div>` : ``}
          </div>
        ` : ``}

        <nav class="sidebar__nav">
          ${items
            .map((it) => {
              const active = state.activeTab === it.id;
              return `
                <button class="sidebar__btn ${active ? "sidebar__btn--active" : ""}" data-tab="${it.id}" type="button">
                  ${active ? `<span class="sidebar__activebar"></span>` : ``}
                  <span class="sidebar__icon">${it.icon}</span>
                  <span class="sidebar__label">${it.label}</span>
                </button>
              `;
            })
            .join("")}
        </nav>

        <div class="sidebar__bottom">
          <a class="sidebar__link" href="/dashboard.html">
            ${icons.ext}
            На сайт
          </a>
        </div>
      </div>
    `;

    targetEl.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const next = btn.getAttribute("data-tab");
        if (!next) return;
        state.activeTab = next;


        if (next === "courses") {
          coursesState.view = "courses";
          coursesState.selectedCourse = null;
          coursesState.selectedModule = null;
          coursesState.currentLessonId = null;
          coursesState.modules = [];
          coursesState.lessons = [];
        }
        if (next === "tasks") {
          tasksState.view = "list";
          tasksState.selectedTask = null;
          tasksState.questions = [];
        }
        if (next === "library") {
          libraryState.view = "list";
          libraryState.selectedMaterial = null;
        }

        renderAll();
        await loadActiveTab().catch((e) => {
          console.error(e);
          toast(e?.data?.message || e?.message || "Ошибка загрузки", "error");
        });

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
            <div class="stack">${[1,2,3,4,5].map(() => `<div style="height:56px;background:#F3F4F6;border-radius:16px;"></div>`).join("")}</div>
          </div>
        </div>
      `;
    }

    const rows = usersState.items
      .map(
        (u) => `
          <tr>
            <td style="font-weight:600;">${u.id}</td>
            <td>${escapeHtml(u.login)}</td>
            <td>
              <select class="control control--sm" data-user-role="${u.id}" ${state.busy ? "disabled" : ""}>
                <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
                <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
                <option value="teacher" ${u.role === "teacher" ? "selected" : ""}>Teacher</option>
              </select>
            </td>
            <td><span class="badge badge--blue">${escapeHtml(u.level)}</span></td>
            <td>
              <button class="btn btn--danger" data-user-reset="${u.id}" type="button" ${state.busy ? "disabled" : ""}>Сброс</button>
            </td>
          </tr>
        `
      )
      .join("");

    const cards = usersState.items
      .map(
        (u) => `
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
                <select class="control" data-user-role="${u.id}" ${state.busy ? "disabled" : ""}>
                  <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
                  <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
                  <option value="teacher" ${u.role === "teacher" ? "selected" : ""}>Teacher</option>
                </select>
              </div>

              <button class="btn btn--danger" data-user-reset="${u.id}" type="button" ${state.busy ? "disabled" : ""}>Сброс</button>
            </div>
          </div>
        `
      )
      .join("");

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
    const c = coursesState.courses.find((x) => x.id === coursesState.selectedCourse);
    const m = coursesState.modules.find((x) => x.id === coursesState.selectedModule);

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
    if (coursesState.loading && coursesState.courses.length === 0) {
      return `
        <div>
          <h2 class="page__title">Курсы</h2>
          <div class="card card--p6">
            <div class="stack">${[1,2,3,4].map(() => `<div style="height:56px;background:#F3F4F6;border-radius:16px;"></div>`).join("")}</div>
          </div>
        </div>
      `;
    }

    const view = coursesState.view;

    if (view === "courses") {
      const items = coursesState.courses
        .map(
          (c) => `
            <button class="itembtn" type="button" data-course-open="${c.id}" ${state.busy ? "disabled" : ""}>
              <div>
                <p class="itembtn__title">${escapeHtml(c.name)}</p>
                <p class="itembtn__sub">Уровень: ${escapeHtml(c.level || "")}</p>
              </div>
              <div class="itembtn__right">
                <span class="badge badge--blue">${escapeHtml(c.level || "")}</span>
                <span class="sidebar__icon">${icons.chevronRight}</span>
              </div>
            </button>
          `
        )
        .join("");

      return `
        <div>
          <h2 class="page__title">Курсы</h2>
          <div class="card card--p6">
            <div class="list">${items || `<div class="card__empty">Нет курсов</div>`}</div>
          </div>
        </div>
      `;
    }

    if (view === "modules") {
      const course = coursesState.courses.find((c) => c.id === coursesState.selectedCourse);
      const modules = coursesState.modules;
      const items = modules
        .map(
          (m) => `
            <button class="itembtn" type="button" data-module-open="${m.id}" ${state.busy ? "disabled" : ""}>
              <div>
                <p class="itembtn__title">${escapeHtml(m.name)}</p>
                <p class="itembtn__sub">${course ? escapeHtml(course.name) : ""}</p>
              </div>
              <div class="itembtn__right">
                <span class="sidebar__icon">${icons.chevronRight}</span>
              </div>
            </button>
          `
        )
        .join("");

      return `
        <div>
          <h2 class="page__title">Курсы</h2>
          ${coursesBreadcrumbs()}
          <div class="card card--p6">
            <div class="row row--between row--wrap" style="margin-bottom:12px;">
              <div class="card__muted">Модули курса</div>
              <button class="btn btn--ghost" type="button" data-courses-back="courses" ${state.busy ? "disabled" : ""}>
                <span class="sidebar__icon">${icons.back}</span>
                Назад
              </button>
            </div>
            <div class="list">${items || `<div class="card__empty">Нет модулей</div>`}</div>
          </div>
        </div>
      `;
    }

    const module = coursesState.modules.find((m) => m.id === coursesState.selectedModule);
    const lessons = coursesState.lessons;

    const lessonItems = lessons
      .map(
        (l) => `
          <button class="itembtn" type="button" data-lesson-open="${l.id}" ${state.busy ? "disabled" : ""}>
            <div>
              <p class="itembtn__title">${escapeHtml(l.name)}</p>
              <p class="itembtn__sub">${module ? escapeHtml(module.name) : ""}</p>
            </div>
            <div class="itembtn__right">
              <span class="sidebar__icon">${icons.edit}</span>
            </div>
          </button>
        `
      )
      .join("");

    const currentLessonId = Number(coursesState.currentLessonId || 0);
    const currentLesson = lessons.find((l) => l.id === currentLessonId) || lessons[0] || null;
    if (currentLesson && !coursesState.currentLessonId) coursesState.currentLessonId = currentLesson.id;

    return `
      <div>
        <h2 class="page__title">Курсы</h2>
        ${coursesBreadcrumbs()}
        <div class="grid grid--2" style="align-items:start;">
          <div class="card card--p6">
            <div class="row row--between row--wrap" style="margin-bottom:12px;">
              <div class="card__muted">Уроки</div>
              <button class="btn btn--ghost" type="button" data-courses-back="modules" ${state.busy ? "disabled" : ""}>
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
                <button class="btn btn--primary" type="button" data-course-save ${state.busy || !currentLesson ? "disabled" : ""}>
                  <span class="sidebar__icon">${icons.save}</span>
                  Сохранить
                </button>
              </div>
            </div>

            <label class="field__label" style="margin-top:8px;">Контент урока</label>
            <textarea class="textarea" data-lesson-content ${state.busy || !currentLesson ? "disabled" : ""}>${currentLesson ? escapeHtml(currentLesson.content) : ""}</textarea>
            <div class="smallnote" style="margin-top:8px;">Сохраняется прямо в базу данных.</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderTasks() {
    if (tasksState.loading && tasksState.tasks.length === 0) {
      return `
        <div>
          <h2 class="page__title">Задания</h2>
          <div class="card card--p6">
            <div class="stack">${[1,2,3].map(() => `<div style="height:56px;background:#F3F4F6;border-radius:16px;"></div>`).join("")}</div>
          </div>
        </div>
      `;
    }

    if (tasksState.view === "list") {
      const items = tasksState.tasks
        .map(
          (t) => `
            <button class="itembtn" type="button" data-task-edit="${t.id}" ${state.busy ? "disabled" : ""}>
              <div>
                <p class="itembtn__title">${escapeHtml(t.name)}</p>
                <p class="itembtn__sub">${escapeHtml(t.course)} • Проходной балл: ${escapeHtml(t.passingScore)}%</p>
              </div>
              <div class="itembtn__right"><span class="sidebar__icon">${icons.edit}</span></div>
            </button>
          `
        )
        .join("");

      return `
        <div>
          <h2 class="page__title">Задания</h2>
          <div class="card card--p6">
            <div class="list">${items || `<div class="card__empty">Нет заданий</div>`}</div>
          </div>
        </div>
      `;
    }

    const task = tasksState.tasks.find((t) => t.id === tasksState.selectedTask);
    const q = tasksState.questions;

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
            <button class="btn btn--ghost" type="button" data-task-nav="list" ${state.busy ? "disabled" : ""}>
              <span class="sidebar__icon">${icons.back}</span>
              Назад
            </button>
            <button class="btn btn--primary" type="button" data-task-save ${state.busy ? "disabled" : ""}>
              <span class="sidebar__icon">${icons.save}</span>
              Сохранить
            </button>
          </div>

          <div class="grid grid--2">
            <div class="stack">
              <div>
                <label class="field__label">Название</label>
                <input class="control" data-task-name value="${task ? escapeHtml(task.name) : ""}" ${state.busy ? "disabled" : ""} />
              </div>
              <div>
                <label class="field__label">ID курса (course_id)</label>
                <input class="control" data-task-courseid value="${task ? escapeHtml(task.courseId) : ""}" ${state.busy ? "disabled" : ""} />
                <div class="smallnote" style="margin-top:6px;">Список курсов смотрите во вкладке «Курсы» (ID).</div>
              </div>
            </div>

            <div class="stack">
              <div>
                <label class="field__label">Проходной балл (%)</label>
                <input class="control" type="number" min="0" max="100" data-task-score value="${task ? escapeHtml(task.passingScore) : 0}" ${state.busy ? "disabled" : ""} />
              </div>
              <div>
                <label class="field__label">Описание</label>
                <input class="control" data-task-desc value="${task ? escapeHtml(task.description || "") : ""}" ${state.busy ? "disabled" : ""} />
              </div>
            </div>
          </div>

          <div class="divider" style="margin:18px 0;"></div>

          <div class="row row--between row--wrap" style="margin-bottom:10px;">
            <div style="font-weight:700;">Вопросы</div>
            <div class="smallnote">options — JSON-массив строк</div>
          </div>

          <div class="stack">
            ${q
              .map(
                (qq) => `
                  <div class="card card--p4" style="border:1px solid var(--border);">
                    <div class="stack">
                      <div>
                        <label class="field__label">Вопрос</label>
                        <input class="control" data-q-question="${qq.id}" value="${escapeHtml(qq.question)}" ${state.busy ? "disabled" : ""} />
                      </div>
                      <div>
                        <label class="field__label">Options</label>
                        <input class="control" data-q-options="${qq.id}" value="${escapeHtml(qq.options)}" ${state.busy ? "disabled" : ""} />
                      </div>
                      <div>
                        <label class="field__label">Correct answer</label>
                        <input class="control" data-q-correct="${qq.id}" value="${escapeHtml(qq.correctAnswer || "")}" ${state.busy ? "disabled" : ""} />
                      </div>
                    </div>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

  function renderLibrary() {
    if (libraryState.loading && libraryState.materials.length === 0) {
      return `
        <div>
          <h2 class="page__title">Библиотека</h2>
          <div class="card card--p6">
            <div class="stack">${[1,2,3].map(() => `<div style="height:56px;background:#F3F4F6;border-radius:16px;"></div>`).join("")}</div>
          </div>
        </div>
      `;
    }

    if (libraryState.view === "list") {
      const items = libraryState.materials
        .map(
          (m) => `
            <button class="itembtn" type="button" data-material-edit="${m.id}" ${state.busy ? "disabled" : ""}>
              <div>
                <p class="itembtn__title">${escapeHtml(m.name)}</p>
                <p class="itembtn__sub">${escapeHtml(m.type)} • ${escapeHtml(m.level)} • ${escapeHtml(m.description)}</p>
              </div>
              <div class="itembtn__right">
                <span class="badge badge--blue">${escapeHtml(m.level)}</span>
                <span class="sidebar__icon">${icons.edit}</span>
              </div>
            </button>
          `
        )
        .join("");

      return `
        <div>
          <h2 class="page__title">Библиотека</h2>
          <div class="card card--p6">
            <div class="list">${items || `<div class="card__empty">Нет материалов</div>`}</div>
          </div>
        </div>
      `;
    }

    const material = libraryState.materials.find((m) => String(m.id) === String(libraryState.selectedMaterial));

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
            <button class="btn btn--ghost" type="button" data-lib-nav="list" ${state.busy ? "disabled" : ""}>
              <span class="sidebar__icon">${icons.back}</span>
              Назад
            </button>
            <button class="btn btn--primary" type="button" data-lib-save ${state.busy ? "disabled" : ""}>
              <span class="sidebar__icon">${icons.save}</span>
              Сохранить
            </button>
          </div>

          <div class="grid grid--2">
            <div class="stack">
              <div>
                <label class="field__label">Название</label>
                <input class="control" data-lib-name value="${material ? escapeHtml(material.name) : ""}" ${state.busy ? "disabled" : ""} />
              </div>
              <div>
                <label class="field__label">Описание</label>
                <input class="control" data-lib-desc value="${material ? escapeHtml(material.description || "") : ""}" ${state.busy ? "disabled" : ""} />
              </div>
            </div>

            <div class="stack">
              <div>
                <label class="field__label">Тип</label>
                <input class="control" data-lib-type value="${material ? escapeHtml(material.type || "") : ""}" ${state.busy ? "disabled" : ""} />
                <div class="smallnote" style="margin-top:6px;">Должен совпадать со значениями в library_materials.type.</div>
              </div>
              <div>
                <label class="field__label">Уровень</label>
                <input class="control" data-lib-level value="${material ? escapeHtml(material.level || "") : ""}" ${state.busy ? "disabled" : ""} />
              </div>
            </div>
          </div>

          <div class="grid grid--2" style="margin-top:12px;">
            <div class="stack">
              <div>
                <label class="field__label">Категория</label>
                <input class="control" data-lib-category value="${material ? escapeHtml(material.category || "") : ""}" ${state.busy ? "disabled" : ""} />
              </div>
              <div>
                <label class="field__label">Длительность</label>
                <input class="control" data-lib-duration value="${material ? escapeHtml(material.duration || "") : ""}" ${state.busy ? "disabled" : ""} />
              </div>
            </div>
            <div class="stack">
              <div>
                <label class="field__label">Icon</label>
                <input class="control" data-lib-icon value="${material ? escapeHtml(material.icon || "") : ""}" ${state.busy ? "disabled" : ""} />
              </div>
              <div>
                <label class="field__label">Sort order</label>
                <input class="control" type="number" data-lib-sort value="${material ? escapeHtml(material.sortOrder || 0) : 0}" ${state.busy ? "disabled" : ""} />
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderStats() {

    const stats = [
      { label: "Пользователи", value: usersState.items.length || 0, icon: icons.users, bg: "rgba(37,99,235,.1)", color: "#2563EB" },
      { label: "Курсы", value: coursesState.courses.length || 0, icon: icons.book, bg: "rgba(22,163,74,.12)", color: "#16A34A" },
      { label: "Задания", value: tasksState.tasks.length || 0, icon: icons.clip, bg: "rgba(147,51,234,.12)", color: "#7C3AED" }
    ];

    return `
      <div>
        <h2 class="page__title">Статистика</h2>
        <div class="card card--p6">
          <div class="stack">
            ${stats
              .map(
                (s) => `
                  <div class="kpi">
                    <div class="kpi__icon" style="background:${s.bg}; color:${s.color};">${s.icon}</div>
                    <div style="flex:1;">
                      <p class="kpi__label">${escapeHtml(s.label)}</p>
                      <p class="kpi__value">${fmtNumber(s.value)}</p>
                    </div>
                  </div>
                `
              )
              .join("")}
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

  function applyResponsiveVisibility(root) {
    const onlyDesktop = root.querySelectorAll("[data-only-desktop]");
    const onlyMobile = root.querySelectorAll("[data-only-mobile]");
    const desktop = window.matchMedia("(min-width: 768px)").matches;

    onlyDesktop.forEach((el) => {
      el.style.display = desktop ? "" : "none";
    });
    onlyMobile.forEach((el) => {
      el.style.display = desktop ? "none" : "";
    });
  }

  function wireUsers(root) {
    root.querySelectorAll("[data-user-role]").forEach((sel) => {
      sel.addEventListener("change", async (e) => {
        const id = Number(sel.getAttribute("data-user-role"));
        const val = e.target.value;
        try {
          await safeAuthFetch(`/api/admin/users/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ role: val })
          });
          usersState.items = usersState.items.map((u) => (u.id === id ? { ...u, role: val } : u));
          toast("Роль обновлена");
          renderAll();
        } catch (err) {
          console.error(err);
          toast(err?.data?.message || err?.message || "Ошибка", "error");
          // reload users to restore
          loadUsers().catch(() => {});
        }
      });
    });

    root.querySelectorAll("[data-user-reset]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.getAttribute("data-user-reset"));
        if (!confirm("Сбросить прогресс этого пользователя?")) return;
        try {
          await safeAuthFetch(`/api/admin/users/${id}/reset`, { method: "POST" });
          toast("Прогресс сброшен");
        } catch (err) {
          console.error(err);
          toast(err?.data?.message || err?.message || "Ошибка", "error");
        }
      });
    });
  }

  function wireCourses(root) {
    root.querySelectorAll("[data-course-open]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.getAttribute("data-course-open"));
        coursesState.selectedCourse = id;
        coursesState.selectedModule = null;
        coursesState.currentLessonId = null;
        coursesState.view = "modules";
        coursesState.modules = [];
        coursesState.lessons = [];
        renderAll();
        await loadModules(id).catch((e) => {
          console.error(e);
          toast(e?.data?.message || e?.message || "Ошибка", "error");
        });
        renderAll();
      });
    });

    root.querySelectorAll("[data-module-open]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.getAttribute("data-module-open"));
        coursesState.selectedModule = id;
        coursesState.currentLessonId = null;
        coursesState.view = "lessons";
        coursesState.lessons = [];
        renderAll();
        await loadLessons(id).catch((e) => {
          console.error(e);
          toast(e?.data?.message || e?.message || "Ошибка", "error");
        });
        renderAll();
      });
    });

    root.querySelectorAll("[data-lesson-open]").forEach((btn) => {
      btn.addEventListener("click", () => {
        coursesState.currentLessonId = Number(btn.getAttribute("data-lesson-open"));
        renderAll();
      });
    });

    root.querySelectorAll("[data-courses-back]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const target = btn.getAttribute("data-courses-back");
        if (target === "courses") {
          coursesState.view = "courses";
          coursesState.selectedCourse = null;
          coursesState.selectedModule = null;
          coursesState.currentLessonId = null;
          coursesState.modules = [];
          coursesState.lessons = [];
          renderAll();
          return;
        }

        coursesState.view = "modules";
        coursesState.selectedModule = null;
        coursesState.currentLessonId = null;
        coursesState.lessons = [];
        renderAll();
        if (coursesState.selectedCourse) {
          await loadModules(coursesState.selectedCourse).catch(() => {});
        }
        renderAll();
      });
    });

    root.querySelectorAll("[data-courses-nav]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const target = btn.getAttribute("data-courses-nav");
        if (target === "courses") {
          coursesState.view = "courses";
          coursesState.selectedCourse = null;
          coursesState.selectedModule = null;
          coursesState.currentLessonId = null;
          coursesState.modules = [];
          coursesState.lessons = [];
          renderAll();
          return;
        }
        if (target === "modules") {
          coursesState.view = "modules";
          coursesState.selectedModule = null;
          coursesState.currentLessonId = null;
          coursesState.lessons = [];
          renderAll();
          if (coursesState.selectedCourse) await loadModules(coursesState.selectedCourse).catch(() => {});
          renderAll();
        }
      });
    });

    const textarea = root.querySelector("[data-lesson-content]");
    if (textarea) {
      textarea.addEventListener("input", () => {
        const id = Number(coursesState.currentLessonId || 0);
        coursesState.lessons = coursesState.lessons.map((l) => (l.id === id ? { ...l, content: textarea.value } : l));
      });
    }

    const saveBtn = root.querySelector("[data-course-save]");
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        const id = Number(coursesState.currentLessonId || 0);
        const lesson = coursesState.lessons.find((l) => l.id === id);
        if (!lesson) return;
        try {
          await safeAuthFetch(`/api/admin/lessons/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ content: lesson.content })
          });
          toast("Урок сохранён");
        } catch (err) {
          console.error(err);
          toast(err?.data?.message || err?.message || "Ошибка", "error");
        }
      });
    }
  }

  function wireTasks(root) {
    root.querySelectorAll("[data-task-edit]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.getAttribute("data-task-edit"));
        tasksState.selectedTask = id;
        tasksState.view = "edit";
        tasksState.questions = [];
        renderAll();
        await loadTaskDetail(id).catch((e) => {
          console.error(e);
          toast(e?.data?.message || e?.message || "Ошибка", "error");
        });
        renderAll();
      });
    });

    root.querySelectorAll("[data-task-nav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        tasksState.view = btn.getAttribute("data-task-nav");
        if (tasksState.view === "list") {
          tasksState.selectedTask = null;
          tasksState.questions = [];
        }
        renderAll();
      });
    });

    const task = tasksState.tasks.find((t) => t.id === tasksState.selectedTask);
    if (!task) return;

    const name = root.querySelector("[data-task-name]");
    const courseIdEl = root.querySelector("[data-task-courseid]");
    const score = root.querySelector("[data-task-score]");
    const desc = root.querySelector("[data-task-desc]");

    const commit = () => {
      tasksState.tasks = tasksState.tasks.map((t) => {
        if (t.id !== task.id) return t;
        return {
          ...t,
          name: name ? name.value : t.name,
          courseId: courseIdEl ? Number(courseIdEl.value || t.courseId) : t.courseId,
          passingScore: score ? Math.max(0, Math.min(100, Number(score.value || 0))) : t.passingScore,
          description: desc ? desc.value : t.description
        };
      });
    };

    [name, courseIdEl, score, desc].filter(Boolean).forEach((el) => el.addEventListener("input", commit));

    root.querySelectorAll("[data-q-question]").forEach((inp) => {
      inp.addEventListener("input", () => {
        const id = Number(inp.getAttribute("data-q-question"));
        tasksState.questions = tasksState.questions.map((q) => (q.id === id ? { ...q, question: inp.value } : q));
      });
    });
    root.querySelectorAll("[data-q-options]").forEach((inp) => {
      inp.addEventListener("input", () => {
        const id = Number(inp.getAttribute("data-q-options"));
        tasksState.questions = tasksState.questions.map((q) => (q.id === id ? { ...q, options: inp.value } : q));
      });
    });
    root.querySelectorAll("[data-q-correct]").forEach((inp) => {
      inp.addEventListener("input", () => {
        const id = Number(inp.getAttribute("data-q-correct"));
        tasksState.questions = tasksState.questions.map((q) => (q.id === id ? { ...q, correctAnswer: inp.value } : q));
      });
    });

    const save = root.querySelector("[data-task-save]");
    if (save) {
      save.addEventListener("click", async () => {
        commit();
        const t = tasksState.tasks.find((x) => x.id === task.id);
        if (!t) return;

        try {
          await safeAuthFetch(`/api/admin/tasks/${t.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              name: t.name,
              courseId: t.courseId,
              passingScore: t.passingScore,
              description: t.description
            })
          });


          for (const q of tasksState.questions) {
            await safeAuthFetch(`/api/admin/questions/${q.id}`, {
              method: "PATCH",
              body: JSON.stringify({
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer
              })
            });
          }

          toast("Задание сохранено");

          await loadTasks().catch(() => {});
        } catch (err) {
          console.error(err);
          toast(err?.data?.message || err?.message || "Ошибка", "error");
        }
      });
    }
  }

  function wireLibrary(root) {
    root.querySelectorAll("[data-material-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        libraryState.selectedMaterial = btn.getAttribute("data-material-edit");
        libraryState.view = "edit";
        renderAll();
      });
    });

    root.querySelectorAll("[data-lib-nav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        libraryState.view = btn.getAttribute("data-lib-nav");
        if (libraryState.view === "list") libraryState.selectedMaterial = null;
        renderAll();
      });
    });

    const material = libraryState.materials.find((m) => String(m.id) === String(libraryState.selectedMaterial));
    if (!material) return;

    const name = root.querySelector("[data-lib-name]");
    const desc = root.querySelector("[data-lib-desc]");
    const type = root.querySelector("[data-lib-type]");
    const level = root.querySelector("[data-lib-level]");
    const category = root.querySelector("[data-lib-category]");
    const duration = root.querySelector("[data-lib-duration]");
    const icon = root.querySelector("[data-lib-icon]");
    const sort = root.querySelector("[data-lib-sort]");

    const commit = () => {
      libraryState.materials = libraryState.materials.map((m) => {
        if (String(m.id) !== String(material.id)) return m;
        return {
          ...m,
          name: name ? name.value : m.name,
          description: desc ? desc.value : m.description,
          type: type ? type.value : m.type,
          level: level ? level.value : m.level,
          category: category ? category.value : m.category,
          duration: duration ? duration.value : m.duration,
          icon: icon ? icon.value : m.icon,
          sortOrder: sort ? Number(sort.value || 0) : m.sortOrder
        };
      });
    };

    [name, desc, type, level, category, duration, icon, sort].filter(Boolean).forEach((el) => el.addEventListener("input", commit));

    const save = root.querySelector("[data-lib-save]");
    if (save) {
      save.addEventListener("click", async () => {
        commit();
        const m = libraryState.materials.find((x) => String(x.id) === String(material.id));
        if (!m) return;
        try {
          await safeAuthFetch(`/api/admin/library/materials/${m.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              title: m.name,
              description: m.description,
              type: m.type,
              category: m.category,
              level: m.level,
              duration: m.duration,
              icon: m.icon,
              sortOrder: m.sortOrder
            })
          });
          toast("Материал сохранён");
          await loadLibrary().catch(() => {});
        } catch (err) {
          console.error(err);
          toast(err?.data?.message || err?.message || "Ошибка", "error");
        }
      });
    }
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

  function renderToast() {
    if (!state.toast) return "";
    const cls = state.toast.type === "error" ? "toast toast--error" : "toast";
    return `<div class="${cls}">${escapeHtml(state.toast.msg)}</div>`;
  }

  function renderAll() {
    const desktopSidebar = $("#desktopSidebar");
    if (desktopSidebar) renderSidebar(desktopSidebar, { isMobile: false });

    const content = $("#content");
    if (content) content.innerHTML = renderContent();

    const app = $("#adminApp");
    if (app) {
      const existing = $(".toast", app);
      if (existing) existing.remove();
      const t = renderToast();
      if (t) app.insertAdjacentHTML("beforeend", t);
    }

    wireContent();
    if (isDesktop()) openMobile(false);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const btn = $("#mobileMenuBtn");
    const overlay = $("#overlay");

    setMobileIcon();
    if (btn) btn.addEventListener("click", () => openMobile(!state.mobileOpen));
    if (overlay) overlay.addEventListener("click", () => openMobile(false));
    window.addEventListener("resize", () => renderAll());

    try {
      const ok = await ensureAdmin();
      if (!ok) return;
      await loadActiveTab();
    } catch (e) {
      console.error(e);
      toast(e?.data?.message || e?.message || "Ошибка", "error");
    }

    renderAll();
  });
})();
