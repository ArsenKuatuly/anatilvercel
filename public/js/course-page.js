/* Exact HTML/CSS/JS port of "Adaptive Course Page Design" (React -> vanilla).
   Uses the same Tailwind-compiled CSS from the original project.
*/
(function () {
  const app = document.getElementById("app");

  /** ---------- Mock data (1:1 with App.tsx) ---------- */
  function generateMockCourse(scenario) {
    const modules = [
      {
        id: "module-1",
        title: "Модуль 1: Основы казахского языка",
        status: "completed",
        lessons: [
          { id: "l1-1", title: "Урок 1: Алфавит и произношение", status: "completed" },
          { id: "l1-2", title: "Урок 2: Приветствия и знакомство", status: "completed" },
          { id: "l1-3", title: "Урок 3: Числа от 1 до 100", status: "completed" },
          { id: "l1-4", title: "Урок 4: Базовая грамматика", status: "completed" },
        ],
      },
      {
        id: "module-2",
        title: "Модуль 2: Повседневное общение",
        status: scenario === "normal" ? "open" : "completed",
        lessons: [
          { id: "l2-1", title: "Урок 1: В магазине", status: "completed" },
          { id: "l2-2", title: "Урок 2: В ресторане", status: scenario === "normal" ? "available" : "completed" },
          { id: "l2-3", title: "Урок 3: Транспорт и направления", status: scenario === "normal" ? "locked" : "completed" },
          { id: "l2-4", title: "Урок 4: На работе", status: scenario === "normal" ? "locked" : "completed" },
        ],
      },
      {
        id: "module-3",
        title: "Модуль 3: Культура и традиции",
        status: scenario === "normal" ? "locked" : "completed",
        lessons: [
          { id: "l3-1", title: "Урок 1: Казахские праздники", status: scenario === "normal" ? "locked" : "completed" },
          { id: "l3-2", title: "Урок 2: Национальная кухня", status: scenario === "normal" ? "locked" : "completed" },
          { id: "l3-3", title: "Урок 3: Музыка и искусство", status: scenario === "normal" ? "locked" : "completed" },
          { id: "l3-4", title: "Урок 4: История Казахстана", status: scenario === "normal" ? "locked" : "completed" },
        ],
      },
      {
        id: "module-4",
        title: "Модуль 4: Продвинутая грамматика",
        status: scenario === "normal" ? "locked" : "completed",
        lessons: [
          { id: "l4-1", title: "Урок 1: Сложные времена", status: scenario === "normal" ? "locked" : "completed" },
          { id: "l4-2", title: "Урок 2: Падежи и склонения", status: scenario === "normal" ? "locked" : "completed" },
          { id: "l4-3", title: "Урок 3: Причастия и деепричастия", status: scenario === "normal" ? "locked" : "completed" },
        ],
      },
      {
        id: "module-5",
        title: "Модуль 5: Письменная речь",
        status: scenario === "normal" ? "locked" : "completed",
        lessons: [
          { id: "l5-1", title: "Урок 1: Официальные письма", status: scenario === "normal" ? "locked" : "completed" },
          { id: "l5-2", title: "Урок 2: Эссе и сочинения", status: scenario === "normal" ? "locked" : "completed" },
          { id: "l5-3", title: "Урок 3: Деловая переписка", status: scenario === "normal" ? "locked" : "completed" },
        ],
      },
      {
        id: "module-6",
        title: "Модуль 6: Разговорная практика",
        status: scenario === "normal" ? "locked" : "completed",
        lessons: [
          { id: "l6-1", title: "Урок 1: Дискуссии и дебаты", status: scenario === "normal" ? "locked" : "completed" },
          { id: "l6-2", title: "Урок 2: Презентации", status: scenario === "normal" ? "locked" : "completed" },
          { id: "l6-3", title: "Урок 3: Интервью", status: scenario === "normal" ? "locked" : "completed" },
        ],
      },
    ];

    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const completedLessons = modules.reduce((sum, m) => sum + m.lessons.filter((l) => l.status === "completed").length, 0);
    const progress = Math.round((completedLessons / totalLessons) * 100);

    return {
      title: "A2 — Базовый уровень",
      description:
        "Освойте базовые навыки казахского языка: грамматику, лексику и разговорную практику для повседневного общения.",
      moduleCount: modules.length,
      lessonCount: totalLessons,
      progress,
      modules,
      nextLessonId: scenario === "normal" ? "l2-2" : undefined,
    };
  }

  /** ---------- UI helpers (Badge / Button / Icons) ---------- */
  function badge(variant, text) {
    const variants = {
      info: "bg-blue-50 text-[#2563EB] border border-blue-200",
      locked: "bg-gray-100 text-[#6B7280] border border-gray-200",
      success: "bg-green-50 text-green-700 border border-green-200",
      warning: "bg-amber-50 text-amber-700 border border-amber-200",
    };
    const el = document.createElement("span");
    el.className = `inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${variants[variant] || variants.info}`;
    el.textContent = text;
    return el;
  }

  function buttonEl(variant, text, onClick, disabled) {
    const variants = {
      primary: "bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:bg-[#1E40AF] shadow-sm",
      secondary: "bg-white text-[#0F172A] border-2 border-gray-300 hover:bg-gray-50 active:bg-gray-100",
      disabled: "bg-gray-200 text-[#6B7280] cursor-not-allowed",
    };
    const btn = document.createElement("button");
    btn.type = "button";
    const finalVariant = disabled ? "disabled" : (variant || "primary");
    btn.className = `px-6 py-3 rounded-xl font-medium transition-all duration-200 ${variants[finalVariant]} `;
    btn.textContent = text;
    if (!disabled && typeof onClick === "function") btn.addEventListener("click", onClick);
    if (disabled) btn.disabled = true;
    return btn;
  }

  function icon(name, extraClass) {
    const i = document.createElement("i");
    i.setAttribute("data-lucide", name);
    if (extraClass) i.className = extraClass;
    return i;
  }

  /** ---------- Render: Header ---------- */
  function renderHeader(showAdmin) {
    const header = document.createElement("header");
    header.className = "bg-white border-b border-gray-200 sticky top-0 z-50";

    header.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <a href="/" class="text-2xl font-bold text-[#2563EB]">AnaTil</a>
          </div>

          <nav class="hidden md:flex items-center space-x-8">
            <a href="/courses" class="text-[#0F172A] hover:text-[#2563EB] transition-colors">Курсы</a>
            <a href="/progress" class="text-[#0F172A] hover:text-[#2563EB] transition-colors">Мой прогресс</a>
            <a href="/library" class="text-[#0F172A] hover:text-[#2563EB] transition-colors">Библиотека</a>
            ${showAdmin ? `<a href="/admin" class="text-[#2563EB] font-medium">Админ панель</a>` : ""}
          </nav>

          <div class="hidden md:flex items-center space-x-4">
            <button class="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
              <span data-icon="user" class="w-5 h-5 text-[#6B7280] inline-flex"></span>
              <span class="text-[#0F172A]">Профиль</span>
            </button>
          </div>

          <button class="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Toggle menu" aria-expanded="false" id="mobileMenuBtn">
            <span data-icon="menu" class="w-6 h-6 text-[#0F172A] inline-flex"></span>
          </button>
        </div>

        <div class="md:hidden border-t border-gray-200 py-4 hidden" id="mobileMenu">
          <nav class="flex flex-col space-y-4">
            <a href="/courses" class="text-[#0F172A] hover:text-[#2563EB] transition-colors">Курсы</a>
            <a href="/progress" class="text-[#0F172A] hover:text-[#2563EB] transition-colors">Мой прогресс</a>
            <a href="/library" class="text-[#0F172A] hover:text-[#2563EB] transition-colors">Библиотека</a>
            ${showAdmin ? `<a href="/admin" class="text-[#2563EB] font-medium">Админ панель</a>` : ""}
            <button class="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors w-fit">
              <span data-icon="user" class="w-5 h-5 text-[#6B7280] inline-flex"></span>
              <span class="text-[#0F172A]">Профиль</span>
            </button>
          </nav>
        </div>
      </div>
    `;

    // attach icons placeholders
    header.querySelectorAll("[data-icon='user']").forEach((el) => el.replaceWith(icon("user", "w-5 h-5 text-[#6B7280]")));
    header.querySelectorAll("[data-icon='menu']").forEach((el) => el.replaceWith(icon("menu", "w-6 h-6 text-[#0F172A]")));

    // mobile menu behavior
    const btn = header.querySelector("#mobileMenuBtn");
    const menu = header.querySelector("#mobileMenu");
    let open = false;
    function setOpen(v) {
      open = v;
      menu.classList.toggle("hidden", !open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.innerHTML = "";
      btn.appendChild(icon(open ? "x" : "menu", "w-6 h-6 text-[#0F172A]"));
      window.lucide && window.lucide.createIcons();
    }
    btn.addEventListener("click", () => setOpen(!open));
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 768) setOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    return header;
  }

  /** ---------- Render: Skeleton ---------- */
  function renderSkeleton() {
    const wrap = document.createElement("div");
    wrap.className = "space-y-6 animate-pulse";
    wrap.innerHTML = `
      <div class="bg-white rounded-2xl shadow-sm p-6 md:p-8">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div class="flex-1 space-y-4">
            <div class="h-10 bg-gray-200 rounded-lg w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-full max-w-2xl"></div>
            <div class="h-4 bg-gray-200 rounded w-2/3 max-w-xl"></div>
            <div class="flex gap-3 mt-4">
              <div class="h-8 bg-gray-200 rounded-lg w-24"></div>
              <div class="h-8 bg-gray-200 rounded-lg w-24"></div>
              <div class="h-8 bg-gray-200 rounded-lg w-28"></div>
            </div>
          </div>
          <div class="lg:w-80 space-y-4">
            <div class="h-2 bg-gray-200 rounded-full w-full"></div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex-1">
            <div class="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div class="h-8 bg-gray-200 rounded-lg w-20"></div>
        </div>
        <div class="space-y-2">
          <div class="h-14 bg-gray-100 rounded-xl"></div>
          <div class="h-14 bg-gray-100 rounded-xl"></div>
          <div class="h-14 bg-gray-100 rounded-xl"></div>
          <div class="h-14 bg-gray-100 rounded-xl"></div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex-1">
            <div class="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div class="h-8 bg-gray-200 rounded-lg w-20"></div>
        </div>
        <div class="space-y-2">
          <div class="h-14 bg-gray-100 rounded-xl"></div>
          <div class="h-14 bg-gray-100 rounded-xl"></div>
          <div class="h-14 bg-gray-100 rounded-xl"></div>
          <div class="h-14 bg-gray-100 rounded-xl"></div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex-1">
            <div class="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div class="h-8 bg-gray-200 rounded-lg w-20"></div>
        </div>
        <div class="space-y-2">
          <div class="h-14 bg-gray-100 rounded-xl"></div>
          <div class="h-14 bg-gray-100 rounded-xl"></div>
          <div class="h-14 bg-gray-100 rounded-xl"></div>
          <div class="h-14 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    `;
    return wrap;
  }

  /** ---------- Render: EmptyState ---------- */
  function renderEmptyState(type) {
    const cfg =
      type === "error"
        ? {
            title: "Курс не найден",
            description:
              "К сожалению, запрашиваемый курс не найден или был удалён. Пожалуйста, вернитесь к списку доступных курсов.",
            icon: "alert-circle",
            iconWrap: "w-16 h-16 rounded-full bg-red-100 flex items-center justify-center",
            iconClass: "w-8 h-8 text-red-600",
            btnText: "Назад к курсам",
          }
        : {
            title: "Модули не найдены",
            description:
              "В этом курсе пока нет модулей и уроков. Пожалуйста, свяжитесь с администратором или проверьте позже.",
            icon: "book-open",
            iconWrap: "w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center",
            iconClass: "w-8 h-8 text-[#2563EB]",
            btnText: "Назад в профиль",
          };

    const wrap = document.createElement("div");
    wrap.className = "bg-white rounded-2xl shadow-sm p-8 md:p-12 text-center";
    wrap.innerHTML = `
      <div class="flex justify-center mb-4">
        <div class="${cfg.iconWrap}">
          <span data-icon="state"></span>
        </div>
      </div>
      <h2 class="text-2xl font-semibold text-[#0F172A] mb-2">${cfg.title}</h2>
      <p class="text-[#6B7280] mb-6 max-w-md mx-auto">${cfg.description}</p>
      <div class="flex justify-center" id="actionSlot"></div>
    `;

    wrap.querySelector("[data-icon='state']").replaceWith(icon(cfg.icon, cfg.iconClass));
    wrap.querySelector("#actionSlot").appendChild(
      buttonEl("primary", cfg.btnText, () => console.log("Navigate"), false)
    );
    return wrap;
  }

  /** ---------- Render: CourseHero ---------- */
  function renderCourseHero(data) {
    const hero = document.createElement("div");
    hero.className = "bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-6";

    hero.innerHTML = `
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div class="flex-1">
          <h1 class="mb-3">${escapeHtml(data.title)}</h1>
          <p class="text-[#6B7280] mb-4 max-w-2xl">${escapeHtml(data.description || "")}</p>

          <div class="flex flex-wrap gap-3 mb-4 lg:hidden" id="metricsMobile"></div>

          <div id="continueSlot"></div>
        </div>

        <div class="lg:w-80 space-y-4">
          <div id="progressBar"></div>
          <div class="hidden lg:flex flex-wrap gap-3" id="metricsDesktop"></div>
        </div>
      </div>
    `;

    const metricsMobile = hero.querySelector("#metricsMobile");
    const metricsDesktop = hero.querySelector("#metricsDesktop");

    metricsMobile.appendChild(badge("info", `Модулей: ${data.moduleCount}`));
    metricsMobile.appendChild(badge("info", `Уроков: ${data.lessonCount}`));
    metricsMobile.appendChild(badge("warning", `Прогресс: ${data.progress}%`));

    metricsDesktop.appendChild(badge("info", `Модулей: ${data.moduleCount}`));
    metricsDesktop.appendChild(badge("info", `Уроков: ${data.lessonCount}`));
    metricsDesktop.appendChild(badge("warning", `Прогресс: ${data.progress}%`));

    // progress bar 1:1
    const pb = hero.querySelector("#progressBar");
    pb.innerHTML = `
      <div class="w-full">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-[#6B7280]">Прогресс курса</span>
          <span class="text-sm font-semibold text-[#2563EB]">${data.progress}%</span>
        </div>
        <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] transition-all duration-500 ease-out" style="width:${data.progress}%"></div>
        </div>
      </div>
    `;

    const continueSlot = hero.querySelector("#continueSlot");
    if (data.nextLessonId && data.progress < 100) {
      const btn = document.createElement("button");
      btn.className =
        "inline-flex items-center space-x-2 px-5 py-3 bg-[#2563EB] text-white rounded-xl font-medium hover:bg-[#1D4ED8] transition-all shadow-sm";
      btn.appendChild(icon("play", "w-5 h-5"));
      const span = document.createElement("span");
      span.textContent = "Продолжить обучение";
      btn.appendChild(span);
      btn.addEventListener("click", () => console.log("Navigate to lesson:", data.nextLessonId));
      continueSlot.appendChild(btn);
    }

    return hero;
  }

  /** ---------- Render: LessonRow ---------- */
  function renderLessonRow(lesson) {
    const isClickable = lesson.status === "available" || lesson.status === "completed";
    const isLocked = lesson.status === "locked";

    const row = document.createElement("div");
    row.className = [
      "flex items-center justify-between p-4 rounded-xl transition-all",
      isClickable ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100" : "opacity-60",
      lesson.status === "available" ? "bg-blue-50/30" : "",
    ].join(" ").trim();

    const left = document.createElement("div");
    left.className = "flex items-center space-x-3 flex-1 min-w-0";

    const iconWrap = document.createElement("div");
    iconWrap.className = "flex-shrink-0";

    if (lesson.status === "completed") iconWrap.appendChild(icon("check-circle-2", "w-6 h-6 text-green-600"));
    if (lesson.status === "locked") iconWrap.appendChild(icon("lock", "w-5 h-5 text-[#6B7280]"));
    if (lesson.status === "available") {
      const dot = document.createElement("div");
      dot.className = "w-6 h-6 rounded-full border-2 border-[#2563EB] flex items-center justify-center";
      const inner = document.createElement("div");
      inner.className = "w-2 h-2 rounded-full bg-[#2563EB]";
      dot.appendChild(inner);
      iconWrap.appendChild(dot);
    }

    const title = document.createElement("span");
    title.className = `font-medium truncate ${isLocked ? "text-[#6B7280]" : "text-[#0F172A]"}`;
    title.textContent = lesson.title;

    left.appendChild(iconWrap);
    left.appendChild(title);

    const right = document.createElement("div");
    right.className = "flex-shrink-0 ml-3";
    if (lesson.status === "completed") right.appendChild(badge("success", "Пройден"));
    if (lesson.status === "locked") {
      const s = document.createElement("span");
      s.className = "text-sm text-[#6B7280]";
      s.textContent = "Закрыт";
      right.appendChild(s);
    }
    if (lesson.status === "available") right.appendChild(icon("chevron-right", "w-5 h-5 text-[#2563EB]"));

    row.appendChild(left);
    row.appendChild(right);

    if (isClickable) row.addEventListener("click", () => console.log("Open lesson:", lesson.id));
    return row;
  }

  /** ---------- Render: ModuleCard ---------- */
  function renderModuleCard(module, defaultExpanded) {
    const statusConfig = {
      completed: { badge: "success", text: "Пройден" },
      locked: { badge: "locked", text: "Закрыт" },
      open: { badge: "info", text: "Доступен" },
    };
    const config = statusConfig[module.status] || statusConfig.open;
    const completedCount = module.lessons.filter((l) => l.status === "completed").length;

    const card = document.createElement("div");
    card.className = "bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100";

    const headerBtn = document.createElement("button");
    headerBtn.type = "button";
    headerBtn.className = "w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors";

    const left = document.createElement("div");
    left.className = "flex items-center space-x-4 flex-1 min-w-0";

    const leftInner = document.createElement("div");
    leftInner.className = "flex-1 text-left min-w-0";

    const h3 = document.createElement("h3");
    h3.className = "font-semibold text-[#0F172A] mb-1 truncate";
    h3.textContent = module.title;

    const p = document.createElement("p");
    p.className = "text-sm text-[#6B7280]";
    p.textContent = `${completedCount} из ${module.lessons.length} уроков пройдено`;

    leftInner.appendChild(h3);
    leftInner.appendChild(p);
    left.appendChild(leftInner);

    const right = document.createElement("div");
    right.className = "flex items-center space-x-3 flex-shrink-0";
    right.appendChild(badge(config.badge, config.text));
    const chevron = icon(defaultExpanded ? "chevron-up" : "chevron-down", "w-5 h-5 text-[#6B7280]");
    right.appendChild(chevron);

    headerBtn.appendChild(left);
    headerBtn.appendChild(right);

    const body = document.createElement("div");
    body.className = "px-6 pb-6";
    body.innerHTML = `<div class="space-y-2 pt-1"></div>`;
    const list = body.querySelector("div");
    module.lessons.forEach((lesson) => list.appendChild(renderLessonRow(lesson)));

    let expanded = !!defaultExpanded;
    function sync() {
      body.style.display = expanded ? "" : "none";
      chevron.setAttribute("data-lucide", expanded ? "chevron-up" : "chevron-down");
      window.lucide && window.lucide.createIcons();
    }
    headerBtn.addEventListener("click", () => {
      expanded = !expanded;
      sync();
    });
    sync();

    card.appendChild(headerBtn);
    card.appendChild(body);
    return card;
  }

  /** ---------- Render: FinalTaskCard ---------- */
  function renderFinalTaskCard(isUnlocked, isCompleted) {
    const wrap = document.createElement("div");
    wrap.className =
      "bg-gradient-to-br from-amber-50 via-white to-white rounded-2xl shadow-md overflow-hidden border-2 border-amber-200";

    const iconBg = isCompleted ? "bg-green-100" : isUnlocked ? "bg-amber-100" : "bg-gray-100";
    const iconName = isCompleted ? "trophy" : isUnlocked ? "trophy" : "lock";
    const iconClass = isCompleted ? "w-8 h-8 text-green-600" : isUnlocked ? "w-8 h-8 text-amber-600" : "w-7 h-7 text-[#6B7280]";

    wrap.innerHTML = `
      <div class="p-6 md:p-8">
        <div class="flex items-start space-x-4">
          <div class="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${iconBg}">
            <span data-icon="final"></span>
          </div>

          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <h3 class="font-semibold text-[#0F172A]">Итоговое задание</h3>
              <span id="finalBadge"></span>
            </div>

            <p class="text-[#6B7280] mb-4" id="finalText"></p>

            <div id="finalBtn"></div>
          </div>
        </div>
      </div>
    `;

    wrap.querySelector("[data-icon='final']").replaceWith(icon(iconName, iconClass));

    const badgeSlot = wrap.querySelector("#finalBadge");
    if (isCompleted) badgeSlot.appendChild(badge("success", "✓ Пройдено"));

    const text = wrap.querySelector("#finalText");
    text.textContent = isCompleted
      ? "Поздравляем! Вы успешно завершили итоговое задание и весь курс."
      : isUnlocked
        ? "Все уроки пройдены! Теперь вы можете пройти итоговое задание и получить сертификат."
        : "Завершите все уроки курса, чтобы открыть итоговое задание.";

    const btnSlot = wrap.querySelector("#finalBtn");
    const btn = buttonEl(
      isUnlocked && !isCompleted ? "primary" : "disabled",
      isCompleted ? "Задание завершено" : "Пройти итоговое задание",
      () => console.log("Start final task"),
      !(isUnlocked && !isCompleted)
    );
    btnSlot.appendChild(btn);

    return wrap;
  }

  /** ---------- Page shell ---------- */
  const state = {
    view: "loading", // 'loading' | 'normal' | 'completed' | 'completed-task' | 'error' | 'empty'
    courseData: null,
  };

  function render() {
    app.innerHTML = "";

    const root = document.createElement("div");
    root.className = "min-h-screen bg-[#F8FAFC]";

    // header
    root.appendChild(renderHeader(true));

    // demo switcher
    const demo = document.createElement("div");
    demo.className = "bg-white border-b border-gray-200 py-3";
    demo.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-wrap gap-2 items-center">
          <span class="text-sm font-medium text-[#6B7280] mr-2">Демо состояний:</span>
          <button data-state="loading" class="text-xs px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">Загрузка</button>
          <button data-state="normal" class="text-xs px-3 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors text-[#2563EB]">Обычное (35%)</button>
          <button data-state="completed" class="text-xs px-3 py-1 rounded-lg bg-green-100 hover:bg-green-200 transition-colors text-green-700">Завершён (100%)</button>
          <button data-state="completed-task" class="text-xs px-3 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 transition-colors text-amber-700">Задание пройдено</button>
          <button data-state="error" class="text-xs px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 transition-colors text-red-700">Ошибка</button>
          <button data-state="empty" class="text-xs px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">Пусто</button>
        </div>
      </div>
    `;
    demo.querySelectorAll("button[data-state]").forEach((b) => {
      b.addEventListener("click", () => switchState(b.getAttribute("data-state")));
    });
    root.appendChild(demo);

    // main content
    const main = document.createElement("main");
    main.className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8";

    if (state.view === "loading") main.appendChild(renderSkeleton());
    if (state.view === "error") main.appendChild(renderEmptyState("error"));
    if (state.view === "empty") main.appendChild(renderEmptyState("empty"));

    if (state.courseData && (state.view === "normal" || state.view === "completed" || state.view === "completed-task")) {
      main.appendChild(renderCourseHero(state.courseData));

      const list = document.createElement("div");
      list.className = "space-y-4 mb-6";

      state.courseData.modules.forEach((m, idx) => {
        list.appendChild(renderModuleCard(m, idx === 1 && state.view === "normal"));
      });

      main.appendChild(list);
      main.appendChild(
        renderFinalTaskCard(state.view === "completed" || state.view === "completed-task", state.view === "completed-task")
      );
    }

    root.appendChild(main);
    app.appendChild(root);

    // icons render
    if (window.lucide) window.lucide.createIcons();
  }

  function switchState(next) {
    if (next === "loading") {
      state.view = "loading";
      state.courseData = null;
      render();
      setTimeout(() => {
        state.view = "normal";
        state.courseData = generateMockCourse("normal");
        render();
      }, 1500);
      return;
    }

    if (next === "normal") {
      state.view = "normal";
      state.courseData = generateMockCourse("normal");
      render();
      return;
    }

    if (next === "completed") {
      state.view = "completed";
      state.courseData = generateMockCourse("completed");
      render();
      return;
    }

    if (next === "completed-task") {
      state.view = "completed-task";
      state.courseData = generateMockCourse("completed-task");
      render();
      return;
    }

    // error / empty
    state.view = next;
    state.courseData = null;
    render();
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // initial loading simulation (1:1 with App.tsx)
  render();
  setTimeout(() => {
    state.view = "normal";
    state.courseData = generateMockCourse("normal");
    render();
  }, 1500);
})();
