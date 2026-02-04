(() => {
  const materials = [
    { id: "1", title: "Приветствие и знакомство", description: "Основные фразы для знакомства", type: "Диалог", category: "Диалоги", level: "A1", duration: "5 мин", icon: "💬" },
    { id: "2", title: "Падежи в казахском языке", description: "Простой разбор всех падежей", type: "Грамматика", category: "Грамматика", level: "A2", duration: "12 мин", icon: "📘" },
    { id: "3", title: "Слова по теме Работа", description: "20 полезных слов для офиса", type: "Слова", category: "Слова", level: "B1", duration: "8 мин", icon: "📘" },
    { id: "4", title: "Диалог в магазине", description: "Как купить продукты на казахском", type: "Диалог", category: "Диалоги", level: "A2", duration: "7 мин", icon: "💬" },
    { id: "5", title: "Упражнения: времена", description: "Закрепление грамматики", type: "Упражнение", category: "Упражнения", level: "B1", duration: "15 мин", icon: "📝" },
    { id: "6", title: "Базовые фразы приветствия", description: "Изучите основные приветствия", type: "Слова", category: "Слова", level: "A1", duration: "5 мин", icon: "📘" },
    { id: "7", title: "Рассказ \"Моя семья\"", description: "Короткий текст для чтения и перевода", type: "Чтение", category: "Чтение", level: "A2", duration: "10 мин", icon: "📖" },
    { id: "8", title: "Употребление глаголов", description: "Основные правила и примеры", type: "Грамматика", category: "Грамматика", level: "B1", duration: "15 мин", icon: "📘" },
    { id: "9", title: "Диалог в ресторане", description: "Как заказать еду на казахском языке", type: "Диалог", category: "Диалоги", level: "A2", duration: "8 мин", icon: "💬" },
  ];

  const categories = ["Все", "Слова", "Грамматика", "Чтение", "Диалоги", "Упражнения"];
  const continueData = { title: "Падежи в казахском языке", progress: 60 };

  const state = { searchQuery: "", activeCategory: "Все", isLoading: false };

  const searchInput = document.getElementById("searchInput");
  const tabsTrack = document.getElementById("tabsTrack");
  const continueBlock = document.getElementById("continueBlock");
  const grid = document.getElementById("materialsGrid");
  const emptyState = document.getElementById("emptyState");
  const clearBtn = document.getElementById("clearBtn");
  const skeletonGrid = document.getElementById("skeletonGrid");

  if (!searchInput || !tabsTrack || !continueBlock || !grid || !emptyState || !clearBtn || !skeletonGrid) {
    console.warn("[library] Missing required elements");
    return;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function iconArrowRight() {
    return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  function iconClock() {
    return `
      <svg class="badge__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  function renderTabs() {
    tabsTrack.innerHTML = categories
      .map((cat) => {
        const active = cat === state.activeCategory;
        return `
          <button
            type="button"
            class="tab ${active ? "tab--active" : "tab--idle"}"
            role="tab"
            aria-selected="${active ? "true" : "false"}"
            data-category="${escapeHtml(cat)}"
          >${escapeHtml(cat)}</button>
        `;
      })
      .join("");
  }

  function renderContinue() {
    const shouldShow = !state.isLoading && state.searchQuery.trim() === "" && state.activeCategory === "Все";

    if (!shouldShow) {
      continueBlock.hidden = true;
      continueBlock.innerHTML = "";
      return;
    }

    continueBlock.hidden = false;
    continueBlock.innerHTML = `
      <div class="continue">
        <div class="continue__row">
          <div class="continue__left">
            <p class="continue__label">Продолжить обучение</p>
            <h3 class="continue__title">${escapeHtml(continueData.title)}</h3>

            <div class="continue__bar" aria-label="Прогресс">
              <div class="continue__bar-fill" style="width:${continueData.progress}%"></div>
            </div>

            <p class="continue__meta">Пройдено ${continueData.progress}%</p>
          </div>

          <button class="continue__btn" type="button">
            Продолжить
            ${iconArrowRight()}
          </button>
        </div>
      </div>
    `;
  }

  function renderSkeleton() {
    if (!state.isLoading) {
      skeletonGrid.hidden = true;
      skeletonGrid.innerHTML = "";
      return;
    }

    const items = Array.from({ length: 6 }).map(() => `
      <div class="skeleton">
        <div class="skeleton__row">
          <div class="skeleton__circle"></div>
          <div class="skeleton__pill"></div>
        </div>

        <div class="skeleton__block">
          <div class="skeleton__line skeleton__line--h24 skeleton__line--w75"></div>
          <div class="skeleton__line skeleton__line--w100"></div>
          <div class="skeleton__line skeleton__line--w66"></div>
        </div>

        <div class="skeleton__badges">
          <div class="skeleton__badge"></div>
          <div class="skeleton__badge"></div>
        </div>

        <div class="skeleton__btn"></div>
      </div>
    `).join("");

    skeletonGrid.hidden = false;
    skeletonGrid.innerHTML = items;
  }

  function filterMaterials() {
    const q = state.searchQuery.trim().toLowerCase();
    const cat = state.activeCategory;

    return materials.filter((m) => {
      const matchesSearch = m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
      const matchesCategory = cat === "Все" || m.category === cat;
      return matchesSearch && matchesCategory;
    });
  }

  function renderGrid() {
    if (state.isLoading) {
      grid.innerHTML = "";
      grid.hidden = true;
      emptyState.hidden = true;
      return;
    }

    const list = filterMaterials();

    if (list.length === 0) {
      grid.innerHTML = "";
      grid.hidden = true;
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
    grid.hidden = false;

    grid.innerHTML = list
      .map((m) => {
        return `
          <article class="card" data-id="${escapeHtml(m.id)}">
            <div class="card__head">
              <div class="card__badges">
                <span class="card__emoji" aria-hidden="true">${escapeHtml(m.icon)}</span>
                <span class="badge badge--type">${escapeHtml(m.type)}</span>
              </div>
            </div>

            <div class="card__body">
              <h3 class="card__title">${escapeHtml(m.title)}</h3>
              <p class="card__desc line-clamp-2">${escapeHtml(m.description)}</p>
            </div>

            <div class="card__foot">
              <div class="card__badges">
                <span class="badge badge--level">${escapeHtml(m.level)}</span>
                <span class="badge badge--time">
                  ${iconClock()}
                  ${escapeHtml(m.duration)}
                </span>
              </div>
            </div>

            <button class="card__action" type="button">
              Открыть
              ${iconArrowRight()}
            </button>
          </article>
        `;
      })
      .join("");
  }

  function renderAll() {
    renderTabs();
    renderContinue();
    renderSkeleton();
    renderGrid();
  }

  tabsTrack.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-category]");
    if (!btn) return;
    const next = btn.getAttribute("data-category");
    if (!next) return;
    state.activeCategory = next;
    renderAll();
  });

  searchInput.addEventListener("input", () => {
    state.searchQuery = searchInput.value || "";
    renderAll();
  });

  clearBtn.addEventListener("click", () => {
    state.searchQuery = "";
    state.activeCategory = "Все";
    searchInput.value = "";
    renderAll();
  });

  renderAll();
})();
