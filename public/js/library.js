
/* Library page (vanilla) — BEM classes */

(() => {
  // ----- Data -----
  const materials = [
    { id: '1', type: 'audio', title: 'Разговор в кафе', description: 'Практика повседневного общения в ресторане', level: 'A2', format: 'Аудио', duration: 8, topic: 'Еда', status: 'in-progress', progress: 60 },
    { id: '2', type: 'grammar', title: 'Падежи в казахском языке', description: 'Основные правила использования падежей', level: 'B1', format: 'Текст', duration: 15, topic: 'Грамматика', status: 'new' },
    { id: '3', type: 'words', title: 'IT-термины на казахском', description: '50 важных слов для работы в сфере технологий', level: 'B2', format: 'Карточки', duration: 10, topic: 'IT', status: 'viewed' },
    { id: '4', type: 'reading', title: 'Легенды Казахстана', description: 'Знакомство с культурой через народные сказки', level: 'A2', format: 'Текст', duration: 12, topic: 'Культура', status: 'new' },
    { id: '5', type: 'dialogues', title: 'Знакомство с коллегами', description: 'Диалоги для первого рабочего дня', level: 'A1', format: 'Видео', duration: 6, topic: 'Работа', status: 'new' },
    { id: '6', type: 'exercises', title: 'Тест: Глаголы движения', description: 'Проверьте свои знания глаголов', level: 'B1', format: 'Упражнение', duration: 10, topic: 'Грамматика', status: 'new' },
    { id: '7', type: 'audio', title: 'Новости Казахстана', description: 'Актуальные новости на казахском языке', level: 'C1', format: 'Аудио', duration: 20, topic: 'Новости', status: 'new' },
    { id: '8', type: 'words', title: 'Путешествия и транспорт', description: 'Полезные фразы для поездок', level: 'A2', format: 'Карточки', duration: 8, topic: 'Путешествия', status: 'in-progress', progress: 30 },
    { id: '9', type: 'reading', title: 'Современная литература', description: 'Отрывок из романа казахского автора', level: 'B2', format: 'Текст', duration: 18, topic: 'Литература', status: 'new' },
    { id: '10', type: 'grammar', title: 'Времена глаголов', description: 'Прошедшее, настоящее и будущее время', level: 'A2', format: 'Текст', duration: 12, topic: 'Грамматика', status: 'new' },
    { id: '11', type: 'dialogues', title: 'В магазине одежды', description: 'Как сделать покупки на казахском', level: 'A1', format: 'Аудио', duration: 5, topic: 'Шопинг', status: 'viewed' },
    { id: '12', type: 'exercises', title: 'Порядок слов в предложении', description: 'Интерактивные упражнения на синтаксис', level: 'B1', format: 'Упражнение', duration: 15, topic: 'Грамматика', status: 'new' },
  ];

  const recommended = [
    { id: '4', type: 'reading', title: 'Легенды Казахстана', description: 'Знакомство с культурой через народные сказки', level: 'A2', format: 'Текст', duration: 12, topic: 'Культура', status: 'new' },
    { id: '10', type: 'grammar', title: 'Времена глаголов', description: 'Прошедшее, настоящее и будущее время', level: 'A2', format: 'Текст', duration: 12, topic: 'Грамматика', status: 'new' },
    { id: '5', type: 'dialogues', title: 'Знакомство с коллегами', description: 'Диалоги для первого рабочего дня', level: 'A1', format: 'Видео', duration: 6, topic: 'Работа', status: 'new' },
  ];

  const continueMaterial = { id: '1', type: 'audio', title: 'Разговор в кафе', description: 'Практика повседневного общения в ресторане', level: 'A2', format: 'Аудио', duration: 8, topic: 'Еда', status: 'in-progress', progress: 60 };

  const categories = [
    { id: 'all', label: 'Все', icon: 'grid-3x3' },
    { id: 'words', label: 'Слова', icon: 'book-open' },
    { id: 'grammar', label: 'Грамматика', icon: 'file-text' },
    { id: 'reading', label: 'Чтение', icon: 'book-open' },
    { id: 'audio', label: 'Аудио', icon: 'volume-2' },
    { id: 'dialogues', label: 'Диалоги', icon: 'message-square' },
    { id: 'exercises', label: 'Упражнения', icon: 'pen-tool' },
    { id: 'favorites', label: 'Избранное', icon: 'star' },
  ];

  const typeIcon = {
    audio: 'volume-2',
    reading: 'file-text',
    words: 'book-open',
    dialogues: 'message-square',
    exercises: 'pen-tool',
    grammar: 'file-text',
  };

  const typeMod = {
    audio: 'audio',
    reading: 'reading',
    words: 'words',
    dialogues: 'dialogues',
    exercises: 'exercises',
    grammar: 'grammar',
  };

  // ----- State -----
  let activeCategory = 'all';
  let searchQuery = '';
  let viewMode = 'grid';
  let isFilterOpen = false;
  let selectedMaterial = null;
  let sortBy = 'popular';
  let filters = { levels: [], formats: [], duration: [], topics: [], status: [] };

  const favorites = new Set(JSON.parse(localStorage.getItem('library_favorites') || '[]'));

  // Drawer local state
  let drawerPlaying = false;
  let drawerTime = 0;
  let drawerShowTranslation = false;
  let drawerTimer = null;

  // ----- DOM -----
  const $ = (sel) => document.querySelector(sel);
  const searchInput = $('#searchInput');
  const searchClear = $('#searchClear');
  const openFiltersBtn = $('#openFiltersBtn');
  const categoryTabsRoot = $('#categoryTabs');
  const filtersSidebar = $('#filtersSidebar');
  const contentRoot = $('#contentRoot');
  const filterSheetMount = $('#filterSheetMount');
  const drawerMount = $('#drawerMount');
  const toastMount = $('#toastMount');

  // ----- Utils -----
  function saveFavorites() {
    localStorage.setItem('library_favorites', JSON.stringify([...favorites]));
  }

  function toastSuccess(message) {
    toastMount.innerHTML = `
      <div class="toast__item">
        <span class="toast__dot"></span>
        <span class="toast__text">${escapeHtml(message)}</span>
      </div>
    `;
    setTimeout(() => (toastMount.innerHTML = ''), 2000);
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function setBodyLock(lock) {
    document.body.style.overflow = lock ? 'hidden' : '';
  }

  function matchesDuration(durationMin) {
    if (!filters.duration.length) return true;
    let ok = false;
    for (const d of filters.duration) {
      if (d === 'short' && durationMin <= 5) ok = true;
      if (d === 'medium' && durationMin > 5 && durationMin <= 15) ok = true;
      if (d === 'long' && durationMin > 15) ok = true;
    }
    return ok;
  }

  function getFilteredMaterials() {
    const q = searchQuery.trim().toLowerCase();
    let list = materials.filter((m) => {
      if (q) {
        if (
          !m.title.toLowerCase().includes(q) &&
          !m.description.toLowerCase().includes(q) &&
          !m.topic.toLowerCase().includes(q)
        ) return false;
      }

      if (activeCategory !== 'all') {
        if (activeCategory === 'favorites') {
          if (!favorites.has(m.id)) return false;
        } else if (m.type !== activeCategory) return false;
      }

      if (filters.levels.length && !filters.levels.includes(m.level)) return false;
      if (filters.formats.length && !filters.formats.includes(m.format)) return false;
      if (!matchesDuration(m.duration)) return false;
      if (filters.topics.length && !filters.topics.includes(m.topic)) return false;
      if (filters.status.length && !filters.status.includes(m.status)) return false;
      return true;
    });

    // parity: sortBy kept, but not sorting
    return list;
  }

  // ----- Renderers -----
  function renderCategoryTabs() {
    const favCount = favorites.size;

    categoryTabsRoot.innerHTML = `
      <div class="tabs__wrap">
        <div class="tabs__list">
          ${categories.map((c) => {
            const isActive = activeCategory === c.id;
            const badge =
              c.id === 'favorites' && favCount > 0
                ? `<span class="tabs__badge">${favCount}</span>`
                : '';
            return `
              <button class="tabs__item ${isActive ? 'tabs__item--active' : ''}" data-cat="${c.id}" type="button">
                <i data-lucide="${c.icon}"></i>
                <span>${c.label}</span>
                ${badge}
              </button>
            `;
          }).join('')}
        </div>
        <div class="tabs__fade"></div>
      </div>
    `;

    categoryTabsRoot.querySelectorAll('[data-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCategory = btn.getAttribute('data-cat');
        render();
      });
    });
  }

  function renderFilterSectionCheckbox(title, key, items) {
    const normalized = items.map((it) => (typeof it === 'string' ? { value: it, label: it } : it));
    return `
      <div class="panel__block">
        <h3 class="panel__title">${title}</h3>
        <div class="panel__checks">
          ${normalized.map((it) => {
            const checked = filters[key].includes(it.value);
            return `
              <label class="check">
                <input data-filter-cat="${key}" data-filter-val="${it.value}" type="checkbox" ${checked ? 'checked' : ''} />
                <span class="check__text">${it.label}</span>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderFiltersSidebar() {
    filtersSidebar.innerHTML = `
      <div class="panel">
        <div class="panel__group">
          <div class="panel__block">
            <h3 class="panel__title">Сортировка</h3>
            <select id="sortSelectDesktop" class="panel__select">
              <option value="popular">Популярное</option>
              <option value="new">Новое</option>
              <option value="level">По уровню</option>
              <option value="duration">По длительности</option>
            </select>
          </div>

          ${renderFilterSectionCheckbox('Уровень', 'levels', ['A1','A2','B1','B2','C1'])}
          ${renderFilterSectionCheckbox('Формат', 'formats', ['Видео','Аудио','Текст','Карточки','Упражнение'])}
          ${renderFilterSectionCheckbox('Длительность', 'duration', [
            { value: 'short', label: 'До 5 мин' },
            { value: 'medium', label: '5–15 мин' },
            { value: 'long', label: '15+ мин' },
          ])}
          ${renderFilterSectionCheckbox('Тема', 'topics', ['Знакомства','Работа','Путешествия','Еда','IT','Культура'])}
          ${renderFilterSectionCheckbox('Статус', 'status', [
            { value: 'new', label: 'Новое' },
            { value: 'viewed', label: 'Просмотрено' },
            { value: 'in-progress', label: 'В процессе' },
          ])}
        </div>
      </div>
    `;

    const sortSel = $('#sortSelectDesktop');
    if (sortSel) {
      sortSel.value = sortBy;
      sortSel.addEventListener('change', (e) => {
        sortBy = e.target.value;
        render();
      });
    }

    filtersSidebar.querySelectorAll('input[data-filter-cat]').forEach((inp) => {
      inp.addEventListener('change', () => {
        const cat = inp.getAttribute('data-filter-cat');
        const val = inp.getAttribute('data-filter-val');
        toggleFilter(cat, val);
      });
    });
  }

  function renderTopControls(foundCount) {
    return `
      <div class="controls">
        <div class="controls__count">Найдено материалов: <b>${foundCount}</b></div>
        <div class="controls__right">
          <select id="sortSelectMobile" class="controls__sort">
            <option value="popular">Популярное</option>
            <option value="new">Новое</option>
            <option value="level">По уровню</option>
            <option value="duration">По длительности</option>
          </select>

          <div class="view">
            <button id="viewGrid" type="button" class="view__btn ${viewMode === 'grid' ? 'view__btn--active' : ''}" aria-label="Сетка">
              <i data-lucide="grid-3x3"></i>
            </button>
            <button id="viewList" type="button" class="view__btn ${viewMode === 'list' ? 'view__btn--active' : ''}" aria-label="Список">
              <i data-lucide="list"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function chip(html) {
    return `<span class="chip">${html}</span>`;
  }

  function renderContinueSection() {
    return `
      <section class="section">
        <div class="section__head">
          <h2 class="section__h">Продолжить</h2>
        </div>

        <div id="continueCard" class="continue" role="button" tabindex="0">
          <div class="continue__row">
            <div class="continue__icon"><i data-lucide="volume-2"></i></div>
            <div class="continue__body">
              <div class="meta">
                ${chip(escapeHtml(continueMaterial.level))}
                ${chip(`<i data-lucide="clock"></i>${continueMaterial.duration} мин`)}
              </div>
              <div class="continue__title">${escapeHtml(continueMaterial.title)}</div>
              <div class="continue__desc">${escapeHtml(continueMaterial.description)}</div>

              <div class="progress">
                <div class="progress__label">Прогресс</div>
                <div class="progress__line">
                  <div class="progress__bar"><div class="progress__fill" style="width:${continueMaterial.progress}%"></div></div>
                  <div class="progress__pct">${continueMaterial.progress}%</div>
                </div>
              </div>

              <div style="margin-top:14px;">
                <button type="button" class="continue__btn">
                  <i data-lucide="play"></i>
                  Продолжить
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderRecommendedSection() {
    return `
      <section class="section">
        <div class="section__head">
          <h2 class="section__h">Рекомендовано для вашего уровня</h2>
        </div>

        <div class="grid">
          ${recommended.map((m) => renderMaterialCardGrid(m, true)).join('')}
        </div>
      </section>
    `;
  }

  function renderWordOfDay() {
    return `
      <section class="word">
        <div class="word__tag">
          <i data-lucide="sparkles"></i>
          <span>Слово дня</span>
        </div>

        <h3 class="word__big">Сәлеметсіз бе</h3>
        <p class="word__small">Здравствуйте (формальное)</p>
        <p class="word__p">
          Распространённое приветствие в формальной обстановке. Используется при встрече с незнакомыми людьми или в официальной обстановке.
        </p>
        <button type="button" class="word__btn">
          <i data-lucide="plus"></i>
          Добавить в словарь
        </button>
      </section>
    `;
  }

  function renderQuickBlocks() {
    return `${renderContinueSection()}${renderRecommendedSection()}${renderWordOfDay()}`;
  }

  function renderEmptyState() {
    return `
      <div class="empty">
        <div class="empty__icon"><i data-lucide="search-x"></i></div>
        <h3 class="empty__h">Ничего не найдено</h3>
        <p class="empty__p">Попробуйте изменить параметры поиска или сбросить фильтры, чтобы увидеть больше материалов</p>
        <button id="resetBtn" type="button" class="btn btn--primary">Сбросить фильтры</button>
      </div>
    `;
  }

  function renderMaterialCardGrid(m, hideAction = false) {
    const isFav = favorites.has(m.id);
    const icon = typeIcon[m.type];
    const mod = typeMod[m.type];

    return `
      <article class="card card--click card--hover" data-open-material="${m.id}">
        <div class="card__head">
          <div class="card__icon card__icon--${mod}"><i data-lucide="${icon}"></i></div>
          <button class="card__fav ${isFav ? 'card__fav--active' : ''}" data-toggle-fav="${m.id}" type="button" aria-label="Избранное">
            <i data-lucide="star" ${isFav ? 'class="is-fill"' : ''}></i>
          </button>
        </div>

        <h3 class="card__title line-clamp-2">${escapeHtml(m.title)}</h3>
        <p class="card__desc line-clamp-2">${escapeHtml(m.description)}</p>

        <div class="meta">
          ${chip(escapeHtml(m.level))}
          ${chip(escapeHtml(m.format))}
          ${chip(`<i data-lucide="clock"></i>${m.duration} мин`)}
        </div>

        ${m.progress !== undefined ? `
          <div class="progress">
            <div class="progress__line">
              <span class="progress__label">Прогресс</span>
              <span class="progress__pct">${m.progress}%</span>
            </div>
            <div class="progress__bar"><div class="progress__fill" style="width:${m.progress}%"></div></div>
          </div>
        ` : (hideAction ? '' : `
          <button type="button" class="card__action">
            <i data-lucide="play"></i>
            Открыть
          </button>
        `)}
      </article>
    `;
  }

  function renderMaterialCardList(m) {
    const isFav = favorites.has(m.id);
    const icon = typeIcon[m.type];
    const mod = typeMod[m.type];

    return `
      <article class="card card--click" data-open-material="${m.id}">
        <div style="display:flex; align-items:center; gap:14px;">
          <div class="card__icon card__icon--${mod}"><i data-lucide="${icon}"></i></div>
          <div style="flex:1; min-width:0;">
            <h3 class="card__title line-clamp-1">${escapeHtml(m.title)}</h3>
            <p class="card__desc line-clamp-1" style="margin-bottom:0;">${escapeHtml(m.description)}</p>
          </div>

          <button class="card__fav ${isFav ? 'card__fav--active' : ''}" data-toggle-fav="${m.id}" type="button" aria-label="Избранное">
            <i data-lucide="star"></i>
          </button>
        </div>

        ${m.progress !== undefined ? `
          <div class="progress" style="margin-top:14px;">
            <div class="progress__bar"><div class="progress__fill" style="width:${m.progress}%"></div></div>
          </div>
        ` : ''}
      </article>
    `;
  }

  function renderMaterials(list) {
    if (viewMode === 'grid') {
      return `<div class="grid">${list.map((m) => renderMaterialCardGrid(m)).join('')}</div>`;
    }
    return `<div class="list">${list.map((m) => renderMaterialCardList(m)).join('')}</div>`;
  }

  function renderSheetPills(title, key, items) {
    const normalized = items.map((it) => (typeof it === 'string' ? { value: it, label: it } : it));
    return `
      <div class="panel__block">
        <h3 class="panel__title">${title}</h3>
        <div class="pills">
          ${normalized.map((it) => {
            const active = filters[key].includes(it.value);
            return `
              <button type="button" class="pill ${active ? 'pill--active' : ''}" data-pill-cat="${key}" data-pill-val="${it.value}">
                ${it.label}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderFilterBottomSheet() {
    if (!isFilterOpen) {
      filterSheetMount.innerHTML = '';
      setBodyLock(!!selectedMaterial);
      return;
    }
    setBodyLock(true);

    filterSheetMount.innerHTML = `
      <div class="backdrop" id="sheetBackdrop"></div>
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="sheet__head">
          <h2 class="sheet__title">Фильтры</h2>
          <button id="sheetCloseTop" type="button" class="btn btn--ghost btn--icon" aria-label="Закрыть">
            <i data-lucide="x"></i>
          </button>
        </div>

        <div class="sheet__body">
          <div class="panel__group" style="gap:18px;">
            <div class="panel__block">
              <h3 class="panel__title">Сортировка</h3>
              <select id="sheetSort" class="panel__select">
                <option value="popular">Популярное</option>
                <option value="new">Новое</option>
                <option value="level">По уровню</option>
                <option value="duration">По длительности</option>
              </select>
            </div>

            ${renderSheetPills('Уровень', 'levels', ['A1','A2','B1','B2','C1'])}
            ${renderSheetPills('Формат', 'formats', ['Видео','Аудио','Текст','Карточки','Упражнение'])}
            ${renderSheetPills('Длительность', 'duration', [
              { value: 'short', label: 'До 5 мин' },
              { value: 'medium', label: '5–15 мин' },
              { value: 'long', label: '15+ мин' },
            ])}
            ${renderSheetPills('Тема', 'topics', ['Знакомства','Работа','Путешествия','Еда','IT','Культура'])}
            ${renderSheetPills('Статус', 'status', [
              { value: 'new', label: 'Новое' },
              { value: 'viewed', label: 'Просмотрено' },
              { value: 'in-progress', label: 'В процессе' },
            ])}
          </div>
        </div>

        <div class="sheet__foot">
          <button id="sheetReset" type="button" class="btn btn--outline" style="flex:1;">Сбросить</button>
          <button id="sheetApply" type="button" class="btn btn--primary" style="flex:1;">Применить</button>
        </div>
      </div>
    `;

    $('#sheetSort').value = sortBy;

    $('#sheetBackdrop').addEventListener('click', closeFiltersSheet);
    $('#sheetCloseTop').addEventListener('click', closeFiltersSheet);
    $('#sheetApply').addEventListener('click', closeFiltersSheet);
    $('#sheetReset').addEventListener('click', () => {
      resetAll();
      render();
    });
    $('#sheetSort').addEventListener('change', (e) => (sortBy = e.target.value));

    filterSheetMount.querySelectorAll('[data-pill-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        toggleFilter(btn.getAttribute('data-pill-cat'), btn.getAttribute('data-pill-val'));
        renderFilterBottomSheet();
        refreshIcons();
      });
    });

    refreshIcons();
  }

  function renderDrawerContent(m) {
    if (m.type === 'audio') {
      const totalDuration = m.duration * 60;
      const currentPercent = totalDuration ? (drawerTime / totalDuration) * 100 : 0;
      const mm = Math.floor(drawerTime / 60);
      const ss = String(drawerTime % 60).padStart(2, '0');

      return `
        <div class="panel__block">
          <div class="card" style="background:linear-gradient(135deg,#F3E8FF,#DBEAFE);">
            <div style="display:flex; justify-content:center; margin-bottom:18px;">
              <div style="width:128px; height:128px; border-radius:999px; background:rgba(255,255,255,.6); display:flex; align-items:center; justify-content:center;">
                <i data-lucide="volume-2" style="width:64px; height:64px; color:#7C3AED;"></i>
              </div>
            </div>

            <div style="margin-bottom:16px;">
              <div class="progress__bar" id="audioBar" style="height:10px; background:rgba(255,255,255,.7); cursor:pointer;">
                <div class="progress__fill" style="background:#7C3AED; width:${currentPercent}%;"></div>
              </div>
              <div style="display:flex; justify-content:space-between; margin-top:10px; font-size:12px; font-weight:700; color:#312E81;">
                <span id="audioTime">${mm}:${ss}</span>
                <span>${m.duration}:00</span>
              </div>
            </div>

            <div style="display:flex; align-items:center; justify-content:center; gap:14px;">
              <button type="button" class="btn btn--ghost btn--icon" id="audioBack" aria-label="Назад 10с"><i data-lucide="skip-back"></i></button>
              <button type="button" class="btn btn--primary" id="audioPlay" style="border-radius:999px; width:56px; height:56px; padding:0;" aria-label="Плей/Пауза">
                <i data-lucide="${drawerPlaying ? 'pause' : 'play'}"></i>
              </button>
              <button type="button" class="btn btn--ghost btn--icon" id="audioFwd" aria-label="Вперед 10с"><i data-lucide="skip-forward"></i></button>
            </div>
          </div>

          <div style="margin-top:18px;">
            <h3 style="margin:0 0 10px 0; font-weight:900;">Транскрипт</h3>
            <div style="display:flex; flex-direction:column; gap:12px;">
              ${[
                ["— Сәлеметсіз бе! Мен бір кофе алғым келеді.","— Здравствуйте! Я хотел бы взять кофе."],
                ["— Иә, әрине. Қандай кофе қалайсыз?","— Да, конечно. Какой кофе желаете?"],
                ["— Капучино, өтінемін.","— Капучино, пожалуйста."],
              ].map(([k, r]) => `
                <div class="card" style="background:#F9FAFB; padding:16px;">
                  <div style="font-weight:700; margin-bottom:8px;">${escapeHtml(k)}</div>
                  <div style="color:var(--muted); font-size:14px;">${escapeHtml(r)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    if (m.type === 'words') {
      return `
        <div style="display:flex; flex-direction:column; gap:14px;">
          <div id="flashcard" class="card" style="background:linear-gradient(135deg,#EFF6FF,#E0E7FF); cursor:pointer; padding:32px; min-height:200px; display:flex; align-items:center; justify-content:center; text-align:center;">
            <div>
              <div style="font-size:28px; font-weight:900; margin-bottom:10px;">Компьютер</div>
              ${drawerShowTranslation ? `<div style="font-size:18px; color:var(--muted);">Computer</div>` : ''}
              ${!drawerShowTranslation ? `
                <div style="margin-top:16px;">
                  <button type="button" id="showTrans" class="btn btn--primary" style="padding:10px 14px;">Показать перевод</button>
                </div>
              ` : ''}
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <button type="button" class="btn" style="background:#22C55E; color:#fff; border:0;">Знаю</button>
            <button type="button" class="btn" style="background:#F97316; color:#fff; border:0;">Повторить</button>
          </div>

          <div>
            <h3 style="margin:16px 0 10px 0; font-weight:900;">Прогресс</h3>
            <div style="display:flex; align-items:center; gap:10px;">
              <div class="progress__bar" style="flex:1;"><div class="progress__fill" style="width:30%"></div></div>
              <div style="font-weight:800; color:var(--muted);">15/50</div>
            </div>
          </div>
        </div>
      `;
    }

    if (m.type === 'reading') {
      return `
        <div style="line-height:1.7;">
          <p style="margin:0 0 14px 0;">Қазақстанның көптеген әдемі аңыздары бар. Олардың бірі - Қозы Көрпеш пен Баян Сұлу туралы аңыз. Бұл - махаббат пен адалдық туралы тамаша әңгіме.</p>
          <p style="margin:0 0 14px 0;">Ертеде Қозы Көрпеш деген жігіт пен Баян Сұлу деген қыз өмір сүрген. Олар бір-бірін қатты сүйген. Бірақ олардың махаббаты оңай болмаған...</p>
          <p style="margin:0 0 18px 0;">Бұл аңыз қазақ халқының мәдениетінде маңызды орын алады және ұрпақтан ұрпаққа беріліп келеді.</p>

          <div class="card" style="background:#EFF6FF; border-color:#BFDBFE;">
            <h4 style="margin:0 0 10px 0; font-weight:900;">Перевод</h4>
            <p style="margin:0; color:var(--muted);">У Казахстана есть много красивых легенд. Одна из них - легенда о Козы Корпеш и Баян Сулу. Это прекрасная история о любви и верности...</p>
          </div>
        </div>
      `;
    }

    return `
      <div>
        <p style="color:var(--muted); margin:0 0 18px 0;">${escapeHtml(m.description)}</p>
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div class="card" style="background:#F9FAFB;"><b>Пример 1</b><div style="color:var(--muted); margin-top:8px;">Содержимое материала появится здесь...</div></div>
          <div class="card" style="background:#F9FAFB;"><b>Пример 2</b><div style="color:var(--muted); margin-top:8px;">Дополнительные примеры и упражнения...</div></div>
        </div>
      </div>
    `;
  }

  function renderDrawer() {
    if (!selectedMaterial) {
      drawerMount.innerHTML = '';
      clearDrawerTimer();
      setBodyLock(isFilterOpen);
      return;
    }

    setBodyLock(true);
    const m = selectedMaterial;
    const isFav = favorites.has(m.id);

    drawerMount.innerHTML = `
      <div class="backdrop" id="drawerBackdrop"></div>
      <div class="drawer" role="dialog" aria-modal="true">
        <div class="drawer__head">
          <div style="flex:1; min-width:0;">
            <h2 class="drawer__h">${escapeHtml(m.title)}</h2>
            <div class="drawer__meta">
              ${chip(escapeHtml(m.level))}
              ${chip(escapeHtml(m.format))}
              ${chip(`<i data-lucide="clock"></i>${m.duration} мин`)}
            </div>
          </div>

          <div class="drawer__actions">
            <button id="drawerFav" type="button" class="card__fav ${isFav ? 'card__fav--active' : ''}" aria-label="Избранное">
              <i data-lucide="star"></i>
            </button>
            <button id="drawerClose" type="button" class="btn btn--ghost btn--icon" aria-label="Закрыть">
              <i data-lucide="x"></i>
            </button>
          </div>
        </div>

        <div class="drawer__body">
          ${renderDrawerContent(m)}
        </div>

        <div class="drawer__foot">
          <button type="button" class="btn btn--primary" style="width:100%;">Завершить урок</button>
        </div>
      </div>
    `;

    $('#drawerBackdrop').addEventListener('click', closeDrawer);
    $('#drawerClose').addEventListener('click', closeDrawer);
    $('#drawerFav').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(m.id);
      renderDrawer();
      refreshIcons();
    });

    bindDrawerInteractions(m);
    refreshIcons();
  }

  function bindDrawerInteractions(m) {
    if (m.type === 'audio') {
      const total = m.duration * 60;
      const playBtn = $('#audioPlay');
      const backBtn = $('#audioBack');
      const fwdBtn = $('#audioFwd');
      const bar = $('#audioBar');

      playBtn.addEventListener('click', () => {
        drawerPlaying = !drawerPlaying;
        if (drawerPlaying) startDrawerTimer(total);
        else clearDrawerTimer();
        renderDrawer();
      });

      backBtn.addEventListener('click', () => {
        drawerTime = Math.max(0, drawerTime - 10);
        renderDrawer();
      });

      fwdBtn.addEventListener('click', () => {
        drawerTime = Math.min(total, drawerTime + 10);
        renderDrawer();
      });

      bar.addEventListener('click', (e) => {
        const r = bar.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        drawerTime = Math.round(total * p);
        renderDrawer();
      });
    }

    if (m.type === 'words') {
      const flash = $('#flashcard');
      const showBtn = $('#showTrans');

      if (showBtn) {
        showBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          drawerShowTranslation = true;
          renderDrawer();
        });
      }

      flash.addEventListener('click', () => {
        drawerShowTranslation = !drawerShowTranslation;
        renderDrawer();
      });
    }
  }

  function startDrawerTimer(total) {
    clearDrawerTimer();
    drawerTimer = setInterval(() => {
      drawerTime = Math.min(total, drawerTime + 1);
      if (drawerTime >= total) {
        drawerPlaying = false;
        clearDrawerTimer();
      }
      renderDrawer();
    }, 1000);
  }

  function clearDrawerTimer() {
    if (drawerTimer) {
      clearInterval(drawerTimer);
      drawerTimer = null;
    }
  }

  // ----- Events -----
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    searchClear.classList.toggle('u-hidden', !searchQuery);
    render();
  });

  searchClear.addEventListener('click', () => {
    searchQuery = '';
    searchInput.value = '';
    searchClear.classList.add('u-hidden');
    render();
  });

  openFiltersBtn.addEventListener('click', () => {
    isFilterOpen = true;
    renderFilterBottomSheet();
    refreshIcons();
  });

  function closeFiltersSheet() {
    isFilterOpen = false;
    render();
  }

  function resetAll() {
    filters = { levels: [], formats: [], duration: [], topics: [], status: [] };
    searchQuery = '';
    searchInput.value = '';
    searchClear.classList.add('u-hidden');
  }

  function toggleFilter(cat, val) {
    const arr = filters[cat] || [];
    const idx = arr.indexOf(val);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(val);
    filters = { ...filters, [cat]: arr };
    if (!isFilterOpen) render();
  }

  function toggleFavorite(id) {
    if (favorites.has(id)) favorites.delete(id);
    else {
      favorites.add(id);
      toastSuccess('Добавлено в избранное');
    }
    saveFavorites();
  }

  function openMaterialById(id) {
    const m =
      materials.find((x) => x.id === id) ||
      recommended.find((x) => x.id === id) ||
      continueMaterial;

    selectedMaterial = { ...m };
    drawerPlaying = false;
    drawerTime = 0;
    drawerShowTranslation = false;
    renderDrawer();
  }

  function closeDrawer() {
    selectedMaterial = null;
    drawerPlaying = false;
    drawerTime = 0;
    drawerShowTranslation = false;
    clearDrawerTimer();
    render();
  }

  function bindGlobalHandlers() {
    document.querySelectorAll('[data-toggle-fav]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(btn.getAttribute('data-toggle-fav'));
        render();
      });
    });

    document.querySelectorAll('[data-open-material]').forEach((card) => {
      card.addEventListener('click', () => openMaterialById(card.getAttribute('data-open-material')));
    });

    const cont = $('#continueCard');
    if (cont) {
      cont.addEventListener('click', () => openMaterialById(continueMaterial.id));
      cont.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') openMaterialById(continueMaterial.id);
      });
    }

    const vg = $('#viewGrid');
    const vl = $('#viewList');
    if (vg) vg.addEventListener('click', () => { viewMode = 'grid'; render(); });
    if (vl) vl.addEventListener('click', () => { viewMode = 'list'; render(); });

    const sortMobile = $('#sortSelectMobile');
    if (sortMobile) {
      sortMobile.value = sortBy;
      sortMobile.addEventListener('change', (e) => { sortBy = e.target.value; render(); });
    }

    const resetBtn = $('#resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', () => { resetAll(); render(); });
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
    // fill star for active favorites
    document.querySelectorAll('.card__fav--active svg').forEach((svg) => svg.setAttribute('fill', 'currentColor'));
  }

  // ----- Main render -----
  function render() {
    renderFiltersSidebar();
    renderCategoryTabs();
    renderFilterBottomSheet();
    renderDrawer();

    const list = getFilteredMaterials();

    if (!list.length) {
      contentRoot.innerHTML = renderEmptyState();
      refreshIcons();
      bindGlobalHandlers();
      return;
    }

    const showQuick = activeCategory === 'all' && !searchQuery.trim();

    contentRoot.innerHTML = `
      ${showQuick ? renderQuickBlocks() : ''}
      ${renderTopControls(list.length)}
      ${renderMaterials(list)}
    `;

    refreshIcons();
    bindGlobalHandlers();
  }

  render();
  refreshIcons();
})();
