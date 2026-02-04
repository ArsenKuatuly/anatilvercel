// library.js
(() => {
    const materials = [
        { id:'1', title:'Приветствие и знакомство', description:'Основные фразы для знакомства', type:'Диалог', category:'Диалоги', level:'A1', duration:'5 мин', icon:'💬' },
        { id:'2', title:'Падежи в казахском языке', description:'Простой разбор всех падежей', type:'Грамматика', category:'Грамматика', level:'A2', duration:'12 мин', icon:'📘' },
        { id:'3', title:'Слова по теме Работа', description:'20 полезных слов для офиса', type:'Слова', category:'Слова', level:'B1', duration:'8 мин', icon:'📘' },
        { id:'4', title:'Диалог в магазине', description:'Как купить продукты на казахском', type:'Диалог', category:'Диалоги', level:'A2', duration:'7 мин', icon:'💬' },
        { id:'5', title:'Упражнения: времена', description:'Закрепление грамматики', type:'Упражнение', category:'Упражнения', level:'B1', duration:'15 мин', icon:'📝' },
        { id:'6', title:'Базовые фразы приветствия', description:'Изучите основные приветствия', type:'Слова', category:'Слова', level:'A1', duration:'5 мин', icon:'📘' },
        { id:'7', title:'Рассказ "Моя семья"', description:'Короткий текст для чтения и перевода', type:'Чтение', category:'Чтение', level:'A2', duration:'10 мин', icon:'📖' },
        { id:'8', title:'Употребление глаголов', description:'Основные правила и примеры', type:'Грамматика', category:'Грамматика', level:'B1', duration:'15 мин', icon:'📘' },
        { id:'9', title:'Диалог в ресторане', description:'Как заказать еду на казахском языке', type:'Диалог', category:'Диалоги', level:'A2', duration:'8 мин', icon:'💬' }
    ];

    const categories = ['Все', 'Слова', 'Грамматика', 'Чтение', 'Диалоги', 'Упражнения'];

    // Continue data
    const continueData = { title: 'Падежи в казахском языке', progress: 60 };

    // Elements
    const searchInput = document.getElementById('searchInput');
    const tabsRow = document.getElementById('tabsRow');
    const grid = document.getElementById('materialsGrid');
    const empty = document.getElementById('emptyState');
    const continueBlock = document.getElementById('continueBlock');
    const skeletonGrid = document.getElementById('skeletonGrid');

    // Modal
    const modal = document.getElementById('materialModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const modalEmoji = document.getElementById('modalEmoji');
    const modalType = document.getElementById('modalType');
    const modalLevel = document.getElementById('modalLevel');
    const modalDuration = document.getElementById('modalDuration');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalBody = document.getElementById('modalBody');

    let state = {
        query: '',
        category: 'Все',
        isLoading: false,
        selected: null
    };

    // Icons
    const iconArrowRight = `
    <svg viewBox="0 0 24 24" class="i i--sm" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M9 18l6-6-6-6"></path>
    </svg>`;
    const iconClock = `
    <svg viewBox="0 0 24 24" class="i i--sm" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M12 7v6l4 2"></path>
    </svg>`;
    const iconSearchX = `
    <svg viewBox="0 0 24 24" class="i" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M10 10l4 4"></path>
      <path d="M14 10l-4 4"></path>
      <circle cx="11" cy="11" r="7"></circle>
      <path d="M21 21l-4.3-4.3"></path>
    </svg>`;

    // Helpers
    const esc = (s) => String(s ?? '')
        .replaceAll('&','&amp;')
        .replaceAll('<','&lt;')
        .replaceAll('>','&gt;')
        .replaceAll('"','&quot;')
        .replaceAll("'",'&#039;');

    function lockScroll(locked){
        document.documentElement.style.overflow = locked ? 'hidden' : '';
        document.body.style.overflow = locked ? 'hidden' : '';
    }

    // Tabs
    function renderTabs(){
        tabsRow.innerHTML = categories.map((c) => `
      <button type="button"
        class="library__tab ${state.category === c ? 'library__tab--active' : ''}"
        data-cat="${esc(c)}">${esc(c)}</button>
    `).join('');

        tabsRow.querySelectorAll('.library__tab').forEach(btn => {
            btn.addEventListener('click', () => {
                state.category = btn.dataset.cat || 'Все';
                renderAll();
            });
        });
    }

    // Continue block
    function renderContinue(){
        const shouldShow = !state.isLoading && state.query.trim() === '' && state.category === 'Все';
        if (!shouldShow){
            continueBlock.innerHTML = '';
            continueBlock.hidden = true;
            return;
        }

        continueBlock.hidden = false;
        continueBlock.innerHTML = `
      <div class="continue">
        <div class="continue__row">
          <div class="continue__left">
            <p class="continue__label">Продолжить обучение</p>
            <h3 class="continue__title">${esc(continueData.title)}</h3>

            <div class="continue__bar" aria-hidden="true">
              <div class="continue__bar-fill" style="width:${continueData.progress}%"></div>
            </div>
            <p class="continue__hint">Пройдено ${continueData.progress}%</p>
          </div>

          <button class="continue__btn" type="button">
            <span>Продолжить</span>
            ${iconArrowRight}
          </button>
        </div>
      </div>
    `;
    }

    // Skeleton
    function renderSkeleton(){
        if (!state.isLoading){
            skeletonGrid.hidden = true;
            skeletonGrid.innerHTML = '';
            return;
        }

        skeletonGrid.hidden = false;
        skeletonGrid.innerHTML = new Array(6).fill(0).map(() => `
      <div class="skeleton">
        <div class="skeleton__row">
          <div class="skeleton__dot"></div>
          <div class="skeleton__pill"></div>
        </div>
        <div class="skeleton__line skeleton__line--lg skeleton__line--w75"></div>
        <div class="skeleton__line skeleton__line--w100" style="margin-bottom:6px;"></div>
        <div class="skeleton__line skeleton__line--w66"></div>
        <div class="skeleton__badges" style="margin-top:16px;">
          <div class="skeleton__badge"></div>
          <div class="skeleton__badge" style="width:72px;"></div>
        </div>
        <div class="skeleton__btn"></div>
      </div>
    `).join('');
    }

    // Cards
    function renderGrid(){
        if (state.isLoading){
            grid.innerHTML = '';
            grid.hidden = true;
            empty.hidden = true;
            return;
        }

        const q = state.query.trim().toLowerCase();
        const filtered = materials.filter(m => {
            const matchesSearch =
                m.title.toLowerCase().includes(q) ||
                m.description.toLowerCase().includes(q);
            const matchesCategory = state.category === 'Все' || m.category === state.category;
            return (q === '' ? true : matchesSearch) && matchesCategory;
        });

        if (filtered.length === 0){
            grid.innerHTML = '';
            grid.hidden = true;
            renderEmpty();
            return;
        }

        empty.hidden = true;
        grid.hidden = false;

        grid.innerHTML = filtered.map(m => `
      <article class="material-card">
        <div class="material-card__head">
          <div class="material-card__head-left">
            <span class="material-card__emoji" aria-hidden="true">${esc(m.icon)}</span>
            <span class="material-card__type">${esc(m.type)}</span>
          </div>
        </div>

        <div class="material-card__body">
          <h3 class="material-card__title">${esc(m.title)}</h3>
          <p class="material-card__desc line-clamp-2">${esc(m.description)}</p>
        </div>

        <div class="material-card__footer">
          <div class="material-card__badges">
            <span class="badge badge--blueSoft">${esc(m.level)}</span>
            <span class="badge badge--gray">
              ${iconClock}
              <span>${esc(m.duration)}</span>
            </span>
          </div>
        </div>

        <button class="material-card__btn" type="button" data-open="${esc(m.id)}">
          <span>Открыть</span>
          ${iconArrowRight}
        </button>
      </article>
    `).join('');

        grid.querySelectorAll('[data-open]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-open');
                const mat = materials.find(x => x.id === id);
                if (mat) openModal(mat);
            });
        });
    }

    // Empty state
    function renderEmpty(){
        empty.hidden = false;
        empty.innerHTML = `
      <div class="empty">
        <div class="empty__icon" aria-hidden="true">${iconSearchX}</div>
        <h3 class="empty__title">Ничего не найдено</h3>
        <p class="empty__text">Попробуйте изменить запрос или выбрать другую категорию</p>
        <button class="empty__btn" id="clearSearchBtn" type="button">Очистить поиск</button>
      </div>
    `;

        const clearBtn = document.getElementById('clearSearchBtn');
        if (clearBtn){
            clearBtn.addEventListener('click', () => {
                state.query = '';
                state.category = 'Все';
                if (searchInput) searchInput.value = '';
                renderAll();
            });
        }
    }

    // Modal content data
    const dialogLines = [
        { speaker:'Алия',  kazakh:'Сәлеметсіз бе!', russian:'Здравствуйте!', role:'person1' },
        { speaker:'Марат', kazakh:'Сәлеметсіз бе! Менің атым Марат. Сіздің атыңыз кім?', russian:'Здравствуйте! Меня зовут Марат. Как вас зовут?', role:'person2' },
        { speaker:'Алия',  kazakh:'Менің атым Алия. Танысқаныма қуаныштымын.', russian:'Меня зовут Алия. Рада познакомиться.', role:'person1' },
        { speaker:'Марат', kazakh:'Мен де қуаныштымын. Сіз қайдан келдіңіз?', russian:'Я тоже рад. Откуда вы?', role:'person2' },
        { speaker:'Алия',  kazakh:'Мен Алматыданмын. Ал сіз?', russian:'Я из Алматы. А вы?', role:'person1' },
        { speaker:'Марат', kazakh:'Мен Астанаданмын.', russian:'Я из Астаны.', role:'person2' }
    ];

    const grammarCases = [
        { name:'Атау (Именительный)', question:'Кім? Не?', example:'Бала оқиды', translation:'Ребенок читает', suffix:'—' },
        { name:'Ілік (Родительный)', question:'Кімнің? Ненің?', example:'Баланың кітабы', translation:'Книга ребенка', suffix:'-ның/-нің, -дың/-дің, -тың/-тің' },
        { name:'Барыс (Дательный)', question:'Кімге? Неге?', example:'Балаға кітап бердім', translation:'Я дал книгу ребенку', suffix:'-ға/-ге, -қа/-ке, -а/-е' },
        { name:'Табыс (Винительный)', question:'Кімді? Нені?', example:'Баланы көрдім', translation:'Я увидел ребенка', suffix:'-ны/-ні, -ды/-ді, -ты/-ті' },
        { name:'Жатыс (Местный)', question:'Кімде? Неде?', example:'Балада кітап бар', translation:'У ребенка есть книга', suffix:'-да/-де, -та/-те' },
        { name:'Шығыс (Исходный)', question:'Кімнен? Неден?', example:'Баладан сұрадым', translation:'Я спросил у ребенка', suffix:'-дан/-ден, -тан/-тен, -нан/-нен' },
        { name:'Көмектес (Творительный)', question:'Кіммен? Немен?', example:'Баламен келдім', translation:'Я пришел с ребенком', suffix:'-мен/-бен/-пен' }
    ];

    const wordsInitial = [
        { kazakh:'Жұмыс', russian:'Работа', example:'Мен жұмыста боламын', translation:'Я буду на работе', saved:false },
        { kazakh:'Кеңсе', russian:'Офис', example:'Кеңсе үлкен', translation:'Офис большой', saved:true },
        { kazakh:'Компьютер', russian:'Компьютер', example:'Компьютер үстелде', translation:'Компьютер на столе', saved:false },
        { kazakh:'Жиналыс', russian:'Собрание', example:'Бүгін жиналыс бар', translation:'Сегодня есть собрание', saved:false },
        { kazakh:'Әріптес', russian:'Коллега', example:'Менің әріптесім мейірімді', translation:'Мой коллега добрый', saved:false },
        { kazakh:'Басшы', russian:'Руководитель', example:'Басшы кеңседе', translation:'Руководитель в офисе', saved:true },
        { kazakh:'Құжат', russian:'Документ', example:'Құжатты дайындадым', translation:'Я подготовил документ', saved:false },
        { kazakh:'Есеп', russian:'Отчет', example:'Есепті жібердім', translation:'Я отправил отчет', saved:false },
        { kazakh:'Жоба', russian:'Проект', example:'Жаңа жоба басталды', translation:'Начался новый проект', saved:false },
        { kazakh:'Мүмкіндік', russian:'Возможность', example:'Бұл жақсы мүмкіндік', translation:'Это хорошая возможность', saved:false }
    ];

    const readingParagraphs = [
        { kazakh:'Менің атым Айдос. Мен Алматыда тұрамын. Менің отбасым үлкен.', russian:'Меня зовут Айдос. Я живу в Алматы. Моя семья большая.' },
        { kazakh:'Менің әкем дәрігер, ал анам мұғалім. Олар өте жақсы адамдар.', russian:'Мой отец врач, а мама учитель. Они очень хорошие люди.' },
        { kazakh:'Менің екі апам бар. Үлкен апам университетте оқиды. Кіші апам мектепте оқиды.', russian:'У меня есть две сестры. Старшая сестра учится в университете. Младшая сестра учится в школе.' },
        { kazakh:'Біз жыл сайын демалысқа барамыз. Жазда біз Иссык-Көлге барамыз. Қыста біз тауға барамыз.', russian:'Мы каждый год ездим в отпуск. Летом мы едем на Иссык-Куль. Зимой мы едем в горы.' },
        { kazakh:'Мен өз отбасымды жақсы көремін. Біз бақыттымыз.', russian:'Я люблю свою семью. Мы счастливы.' }
    ];

    const readingVocabulary = [
        { kz:'Отбасы', ru:'Семья' }, { kz:'Дәрігер', ru:'Врач' }, { kz:'Мұғалім', ru:'Учитель' },
        { kz:'Апа', ru:'Сестра (старшая)' }, { kz:'Университет', ru:'Университет' }, { kz:'Демалыс', ru:'Отпуск' },
        { kz:'Жаз', ru:'Лето' }, { kz:'Қыс', ru:'Зима' }, { kz:'Тау', ru:'Гора' }, { kz:'Бақытты', ru:'Счастливый' }
    ];

    const exerciseQuestions = [
        { id:1, question:'Мен мектепке _____ (идти - настоящее время)', options:['барамын','бардым','баламын','барайын'], correct:0, explanation:'Настоящее время для глагола "бару" (идти) в первом лице - "барамын"' },
        { id:2, question:'Ол кітап _____ (читать - прошедшее время)', options:['оқиды','оқыды','оқиған','оқитын'], correct:1, explanation:'Прошедшее время для глагола "оқу" (читать) - "оқыды"' },
        { id:3, question:'Біз ертең киноға _____ (пойти - будущее время)', options:['барамыз','бардық','барамыз','бармақпыз'], correct:3, explanation:'Будущее время для глагола "бару" во множественном числе - "бармақпыз"' },
        { id:4, question:'Сен үйде _____ (быть - настоящее время)', options:['боласың','болдың','болсың','болатынсың'], correct:0, explanation:'Настоящее время глагола "болу" во втором лице - "боласың"' },
        { id:5, question:'Олар тамақ _____ (кушать - прошедшее время)', options:['жейді','жеді','жегені','жейтін'], correct:1, explanation:'Прошедшее время глагола "жеу" (кушать) - "жеді"' }
    ];

    // Modal renderers
    function renderDialogContent(){
        let showTranslation = true;

        const vocab = [
            { kz:'Сәлеметсіз бе', ru:'Здравствуйте' },
            { kz:'Атым', ru:'Меня зовут' },
            { kz:'Танысқаныма қуаныштымын', ru:'Рад познакомиться' },
            { kz:'Қайдан', ru:'Откуда' }
        ];

        function bubble(line){
            const isP1 = line.role === 'person1';
            const wrapStyle = `display:flex; justify-content:${isP1 ? 'flex-start' : 'flex-end'};`;
            const cardStyle = isP1
                ? 'background:#f3f4f6; color:var(--text); border-top-left-radius:6px;'
                : 'background:var(--primary); color:#fff; border-top-right-radius:6px;';
            const subColor = isP1 ? 'color:var(--muted);' : 'color:rgba(255,255,255,.8);';
            return `
        <div style="${wrapStyle}">
          <div style="max-width:80%;">
            <div style="margin-bottom:4px; font-size:.875rem; color:var(--muted);">${esc(line.speaker)}</div>
            <div style="padding:16px; border-radius:16px; ${cardStyle}">
              <p style="margin:0 0 8px;">${esc(line.kazakh)}</p>
              ${showTranslation ? `<p style="margin:0; font-size:.875rem; ${subColor}">${esc(line.russian)}</p>` : ``}
            </div>
          </div>
        </div>
      `;
        }

        function render(){
            modalBody.innerHTML = `
        <div class="block">
          <div class="box" style="display:flex; align-items:center; justify-content:space-between;">
            <label style="display:flex; align-items:center; gap:10px; cursor:pointer; color:var(--text); font-size:.875rem;">
              <input id="dlgToggle" type="checkbox" ${showTranslation ? 'checked' : ''} style="width:16px; height:16px; accent-color: var(--primary);" />
              Показать перевод
            </label>
          </div>

          <div class="block" style="gap:16px;">
            ${dialogLines.map(bubble).join('')}
          </div>

          <div class="box">
            <h3 style="margin:0 0 16px; font-weight:500;">Ключевые слова</h3>
            <div style="display:grid; grid-template-columns:1fr; gap:12px;">
              ${vocab.map(w => `
                <div style="background:var(--white); padding:12px; border-radius:10px;">
                  <p style="margin:0; color:var(--text);">${esc(w.kz)}</p>
                  <p style="margin:4px 0 0; color:var(--muted); font-size:.875rem;">${esc(w.ru)}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;

            const toggle = document.getElementById('dlgToggle');
            if (toggle){
                toggle.addEventListener('change', (e) => {
                    showTranslation = !!e.target.checked;
                    render();
                });
            }
        }

        render();
    }

    function renderGrammarContent(){
        modalBody.innerHTML = `
      <div class="block">
        <div class="panel">
          <h3 class="panel__title">О падежах в казахском языке</h3>
          <p class="panel__text">
            В казахском языке 7 падежей. Каждый падеж имеет свой вопрос и окончание.
            Окончания могут меняться в зависимости от последнего звука слова (закон сингармонизма).
          </p>
        </div>

        <div class="block" style="gap:16px;">
          ${grammarCases.map((c, idx) => `
            <div class="card" style="border-color:var(--border);">
              <div style="display:flex; gap:12px; margin-bottom:12px; align-items:flex-start;">
                <div style="width:32px; height:32px; border-radius:999px; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                  ${idx + 1}
                </div>
                <div style="flex:1;">
                  <h4 style="margin:0 0 4px; font-weight:500;">${esc(c.name)}</h4>
                  <p style="margin:0; color:var(--primary); font-size:.875rem;">${esc(c.question)}</p>
                </div>
              </div>

              <div style="margin-left:44px; display:flex; flex-direction:column; gap:10px;">
                <div style="background:var(--bg); padding:12px; border-radius:10px;">
                  <p style="margin:0 0 4px;">${esc(c.example)}</p>
                  <p style="margin:0; color:var(--muted); font-size:.875rem;">${esc(c.translation)}</p>
                </div>
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                  <span style="color:var(--muted); font-size:.875rem;">Окончание:</span>
                  <span class="badge badge--blueSoft" style="font-size:.875rem;">${esc(c.suffix)}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="box">
          <h3 style="margin:0 0 12px; font-weight:500; display:flex; align-items:center; gap:8px;">
            <span style="color:var(--primary);">✔</span> Полезные советы
          </h3>
          <div style="display:flex; flex-direction:column; gap:10px; color:var(--muted);">
            <div style="display:flex; gap:10px;"><span style="color:var(--primary);">•</span><span>Выбор окончания зависит от последнего звука слова (гласный или согласный)</span></div>
            <div style="display:flex; gap:10px;"><span style="color:var(--primary);">•</span><span>Твердые гласные: а, о, ұ, ы → твердые окончания</span></div>
            <div style="display:flex; gap:10px;"><span style="color:var(--primary);">•</span><span>Мягкие гласные: ә, ө, ү, і, е → мягкие окончания</span></div>
          </div>
        </div>
      </div>
    `;
    }

    function renderWordsContent(){
        // local state
        const words = wordsInitial.map(w => ({...w}));
        const flipped = new Set();

        function countSaved(){ return words.filter(w => w.saved).length; }

        function render(){
            const saved = countSaved();
            const percent = Math.round((saved / words.length) * 100);

            modalBody.innerHTML = `
        <div class="block">
          <div class="panel">
            <h3 class="panel__title">Слова по теме: Работа</h3>
            <p class="panel__text">
              Изучите 20 полезных слов для использования в офисе.
              Нажмите на карточку, чтобы увидеть пример использования.
            </p>
          </div>

          <div style="display:grid; grid-template-columns:1fr; gap:16px;" class="words-grid">
            ${words.map((w, idx) => `
              <div class="card"
                data-word="${idx}"
                style="border:2px solid var(--border); border-radius:12px; padding:0; overflow:hidden; cursor:pointer;">
                <div class="word-card__front" style="padding:20px; min-height:140px; display:flex; flex-direction:column; justify-content:space-between;">
                  <div>
                    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:12px;">
                      <h4 style="margin:0; font-size:1.25rem; font-weight:500;">${esc(w.kazakh)}</h4>
                      <button type="button" data-save="${idx}"
                        style="border:0; background:transparent; padding:4px; border-radius:8px; cursor:pointer;">
                        <span style="font-size:18px; color:${w.saved ? 'var(--primary)' : '#9ca3af'};">${w.saved ? '★' : '☆'}</span>
                      </button>
                    </div>
                    <p style="margin:0; color:var(--muted);">${esc(w.russian)}</p>
                  </div>

                  ${flipped.has(idx) ? `
                    <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border);">
                      <p style="margin:0 0 4px; font-size:.875rem;">${esc(w.example)}</p>
                      <p style="margin:0; font-size:.75rem; color:var(--muted);">${esc(w.translation)}</p>
                    </div>
                  ` : ``}
                </div>

                <div style="background:var(--bg); padding:8px 16px; text-align:center; border-top:1px solid var(--border);">
                  <p style="margin:0; font-size:.75rem; color:var(--muted);">
                    ${flipped.has(idx) ? 'Нажмите, чтобы скрыть пример' : 'Нажмите, чтобы увидеть пример'}
                  </p>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="box">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
              <h3 style="margin:0; font-weight:500;">Прогресс изучения</h3>
              <span style="color:var(--primary); font-weight:500;">${saved} / ${words.length}</span>
            </div>
            <div style="width:100%; height:8px; background:#e5e7eb; border-radius:999px; overflow:hidden;">
              <div style="height:100%; width:${percent}%; background:var(--primary); border-radius:999px; transition:width .3s ease;"></div>
            </div>
            <p style="margin:8px 0 0; color:var(--muted); font-size:.875rem;">
              Сохраните слова с помощью ⭐, чтобы повторить их позже
            </p>
          </div>
        </div>
      `;

            // responsive for words grid: sm 2 cols
            const gridEl = modalBody.querySelector('.words-grid');
            if (gridEl){
                gridEl.style.gridTemplateColumns = (window.innerWidth >= 640) ? '1fr 1fr' : '1fr';
            }

            modalBody.querySelectorAll('[data-word]').forEach(card => {
                card.addEventListener('click', () => {
                    const idx = Number(card.getAttribute('data-word'));
                    if (flipped.has(idx)) flipped.delete(idx);
                    else flipped.add(idx);
                    render();
                });
            });

            modalBody.querySelectorAll('[data-save]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idx = Number(btn.getAttribute('data-save'));
                    words[idx].saved = !words[idx].saved;
                    render();
                });
            });
        }

        render();

        // keep simple resize handling just for 2-col switch
        const onResize = () => {
            const gridEl = modalBody.querySelector('.words-grid');
            if (!gridEl) return;
            gridEl.style.gridTemplateColumns = (window.innerWidth >= 640) ? '1fr 1fr' : '1fr';
        };
        window.addEventListener('resize', onResize, { passive:true });

        // remove handler on close
        modal._cleanupWords = () => window.removeEventListener('resize', onResize);
    }

    function renderReadingContent(){
        let showTranslation = false;

        const eye = `
      <svg viewBox="0 0 24 24" class="i i--sm" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>`;
        const eyeOff = `
      <svg viewBox="0 0 24 24" class="i i--sm" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6 0-10-7-10-7a21.29 21.29 0 0 1 5.06-5.94"></path>
        <path d="M1 1l22 22"></path>
        <path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c6 0 10 7 10 7a21.4 21.4 0 0 1-4.87 5.81"></path>
        <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88"></path>
      </svg>`;

        function render(){
            modalBody.innerHTML = `
        <div class="block">
          <div class="box" style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
            <h3 style="margin:0; font-weight:500;">Рассказ: Моя семья</h3>
            <button type="button" id="readingToggle"
              style="border:1px solid var(--border); background:var(--white); color:var(--text);
              border-radius:10px; padding:8px 16px; cursor:pointer; display:flex; align-items:center; gap:8px;">
              ${showTranslation ? eyeOff : eye}
              <span style="display:none;" class="readingToggleText">
                ${showTranslation ? 'Скрыть перевод' : 'Показать перевод'}
              </span>
            </button>
          </div>

          <div class="card" style="padding:20px;">
            ${readingParagraphs.map((p, idx) => `
              <div style="padding-bottom:16px; border-bottom:1px solid var(--border2); ${idx === readingParagraphs.length-1 ? 'border-bottom:0; padding-bottom:0;' : ''}">
                <p style="margin:0 0 8px; font-size:1.125rem; line-height:1.625; color:var(--text);">${esc(p.kazakh)}</p>
                ${showTranslation ? `<p style="margin:0; line-height:1.625; color:var(--muted);">${esc(p.russian)}</p>` : ``}
              </div>
            `).join('')}
          </div>

          <div class="panel">
            <h3 class="panel__title" style="margin-bottom:16px;">Вопросы для понимания</h3>
            <div style="display:flex; flex-direction:column; gap:12px;">
              ${[
                'Қайда тұрады Айдос? (Где живет Айдос?)',
                'Әкесі кім? (Кто его отец?)',
                'Неше апасы бар? (Сколько у него сестер?)',
                'Олар қайда демалысқа барады? (Куда они ездят в отпуск?)'
            ].map((q, i) => `
                <div style="display:flex; align-items:flex-start; gap:12px;">
                  <div style="width:24px; height:24px; border-radius:999px; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:.875rem;">
                    ${i+1}
                  </div>
                  <p style="margin:0; color:var(--text);">${esc(q)}</p>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="box">
            <h3 style="margin:0 0 16px; font-weight:500;">Словарь к тексту</h3>
            <div class="readingVocab" style="display:grid; grid-template-columns:1fr; gap:12px;">
              ${readingVocabulary.map(w => `
                <div style="background:var(--white); border:1px solid var(--border); border-radius:10px; padding:12px;">
                  <p style="margin:0; color:var(--text);">${esc(w.kz)}</p>
                  <p style="margin:4px 0 0; color:var(--muted); font-size:.875rem;">${esc(w.ru)}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;

            // mimic hidden sm:inline text
            const txt = modalBody.querySelector('.readingToggleText');
            if (txt) txt.style.display = (window.innerWidth >= 640) ? 'inline' : 'none';

            // responsive vocab columns: sm 2, lg 3
            const vocabEl = modalBody.querySelector('.readingVocab');
            if (vocabEl){
                if (window.innerWidth >= 1024) vocabEl.style.gridTemplateColumns = '1fr 1fr 1fr';
                else if (window.innerWidth >= 640) vocabEl.style.gridTemplateColumns = '1fr 1fr';
                else vocabEl.style.gridTemplateColumns = '1fr';
            }

            const btn = document.getElementById('readingToggle');
            if (btn){
                btn.addEventListener('click', () => {
                    showTranslation = !showTranslation;
                    render();
                });
            }
        }

        render();

        const onResize = () => {
            const txt = modalBody.querySelector('.readingToggleText');
            if (txt) txt.style.display = (window.innerWidth >= 640) ? 'inline' : 'none';

            const vocabEl = modalBody.querySelector('.readingVocab');
            if (!vocabEl) return;
            if (window.innerWidth >= 1024) vocabEl.style.gridTemplateColumns = '1fr 1fr 1fr';
            else if (window.innerWidth >= 640) vocabEl.style.gridTemplateColumns = '1fr 1fr';
            else vocabEl.style.gridTemplateColumns = '1fr';
        };
        window.addEventListener('resize', onResize, { passive:true });
        modal._cleanupReading = () => window.removeEventListener('resize', onResize);
    }

    function renderExerciseContent(){
        const answers = {}; // id -> optionIndex
        let submitted = false;
        let showExplanation = null;

        function score(){
            let correct = 0;
            exerciseQuestions.forEach(q => { if (answers[q.id] === q.correct) correct++; });
            return correct;
        }

        function render(){
            const canSubmit = Object.keys(answers).length === exerciseQuestions.length;

            modalBody.innerHTML = `
        <div class="block">
          <div class="panel">
            <h3 class="panel__title">Упражнение: Времена глаголов</h3>
            <p class="panel__text">
              Выберите правильную форму глагола для каждого предложения.
              После ответа на все вопросы нажмите "Проверить".
            </p>
          </div>

          <div class="block" style="gap:20px;">
            ${exerciseQuestions.map((q, idx) => {
                return `
                <div class="card">
                  <div style="display:flex; gap:12px; margin-bottom:16px; align-items:flex-start;">
                    <div style="width:32px; height:32px; border-radius:999px; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                      ${idx + 1}
                    </div>
                    <p style="margin:0; font-size:1.125rem; color:var(--text);">${esc(q.question)}</p>
                  </div>

                  <div style="margin-left:44px; display:flex; flex-direction:column; gap:8px;">
                    ${q.options.map((opt, oIdx) => {
                    const selected = answers[q.id] === oIdx;
                    const isCorrect = answers[q.id] === q.correct;
                    const showCorrect = submitted && oIdx === q.correct;
                    const showWrong = submitted && selected && !isCorrect;

                    const border = showCorrect ? '#22c55e' : showWrong ? '#ef4444' : selected ? 'var(--primary)' : 'var(--border)';
                    const bg = showCorrect ? '#f0fdf4' : showWrong ? '#fef2f2' : selected ? 'rgba(37,99,235,.05)' : '#fff';

                    return `
                        <button type="button"
                          data-q="${q.id}" data-o="${oIdx}"
                          ${submitted ? 'disabled' : ''}
                          style="
                            width:100%;
                            text-align:left;
                            padding:16px;
                            border-radius:10px;
                            border:2px solid ${border};
                            background:${bg};
                            cursor:${submitted ? 'default' : 'pointer'};
                            transition: border-color .15s ease, background .15s ease;
                          ">
                          <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
                            <span style="color:var(--text);">${esc(opt)}</span>
                            ${submitted && showCorrect ? `<span style="color:#16a34a;">✔</span>` : ''}
                            ${submitted && showWrong ? `<span style="color:#dc2626;">✖</span>` : ''}
                          </div>
                        </button>
                      `;
                }).join('')}
                  </div>

                  ${submitted ? `
                    <div style="margin-left:44px; margin-top:16px;">
                      <button type="button" data-exp="${q.id}"
                        style="border:0; background:transparent; color:var(--primary); cursor:pointer; padding:0; display:flex; align-items:center; gap:8px;">
                        <span style="font-size:18px;">?</span>
                        <span style="font-size:.875rem;">
                          ${showExplanation === q.id ? 'Скрыть объяснение' : 'Показать объяснение'}
                        </span>
                      </button>
                      ${showExplanation === q.id ? `
                        <div style="margin-top:8px; padding:12px; background:var(--bg); border-radius:10px; color:var(--muted); font-size:.875rem;">
                          ${esc(q.explanation)}
                        </div>
                      ` : ``}
                    </div>
                  ` : ``}
                </div>
              `;
            }).join('')}
          </div>

          <div class="box">
            ${!submitted ? `
              <button type="button" id="exerciseSubmit"
                ${canSubmit ? '' : 'disabled'}
                style="
                  width:100%;
                  padding:12px 24px;
                  border:0;
                  border-radius:var(--r-md);
                  background:var(--primary);
                  color:#fff;
                  font-weight:500;
                  cursor:${canSubmit ? 'pointer' : 'not-allowed'};
                  opacity:${canSubmit ? '1' : '.5'};
                  transition:background .15s ease;
                ">
                Проверить ответы
              </button>
            ` : `
              <div style="text-align:center; margin-bottom:16px;">
                <h3 style="margin:0 0 8px; font-weight:500;">Результат</h3>
                <div style="font-size:2.25rem; margin-bottom:8px;">${score() === exerciseQuestions.length ? '🎉' : '📊'}</div>
                <p style="margin:0 0 4px; font-size:1.5rem; color:var(--primary); font-weight:500;">${score()} из ${exerciseQuestions.length}</p>
                <p style="margin:0; color:var(--muted);">
                  ${
                score() === exerciseQuestions.length
                    ? 'Отлично! Все ответы правильные!'
                    : score() >= exerciseQuestions.length * 0.7
                        ? 'Хорошо! Продолжайте в том же духе!'
                        : 'Попробуйте еще раз!'
            }
                </p>
              </div>

              <button type="button" id="exerciseReset"
                style="
                  width:100%;
                  padding:12px 24px;
                  border:1px solid var(--border);
                  border-radius:var(--r-md);
                  background:var(--white);
                  color:var(--text);
                  font-weight:500;
                  cursor:pointer;
                ">
                Попробовать снова
              </button>
            `}
          </div>
        </div>
      `;

            // handlers
            modalBody.querySelectorAll('[data-q][data-o]').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (submitted) return;
                    const qId = Number(btn.getAttribute('data-q'));
                    const oId = Number(btn.getAttribute('data-o'));
                    answers[qId] = oId;
                    render();
                });
            });

            const submitBtn = document.getElementById('exerciseSubmit');
            if (submitBtn){
                submitBtn.addEventListener('click', () => {
                    if (!canSubmit) return;
                    submitted = true;
                    render();
                });
            }

            const resetBtn = document.getElementById('exerciseReset');
            if (resetBtn){
                resetBtn.addEventListener('click', () => {
                    Object.keys(answers).forEach(k => delete answers[k]);
                    submitted = false;
                    showExplanation = null;
                    render();
                });
            }

            modalBody.querySelectorAll('[data-exp]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = Number(btn.getAttribute('data-exp'));
                    showExplanation = (showExplanation === id) ? null : id;
                    render();
                });
            });
        }

        render();
    }

    function renderModalContentByCategory(material){
        // cleanup any previous modal-specific listeners
        if (modal._cleanupWords) { modal._cleanupWords(); modal._cleanupWords = null; }
        if (modal._cleanupReading) { modal._cleanupReading(); modal._cleanupReading = null; }

        switch (material.category){
            case 'Диалоги': return renderDialogContent();
            case 'Грамматика': return renderGrammarContent();
            case 'Слова': return renderWordsContent();
            case 'Чтение': return renderReadingContent();
            case 'Упражнения': return renderExerciseContent();
            default: return renderDialogContent();
        }
    }

    function openModal(material){
        state.selected = material;

        modalEmoji.textContent = material.icon;
        modalType.textContent = material.type;
        modalLevel.textContent = material.level;
        modalDuration.textContent = material.duration;
        modalTitle.textContent = material.title;
        modalDesc.textContent = material.description;

        renderModalContentByCategory(material);

        modal.hidden = false;
        lockScroll(true);
    }

    function closeModal(){
        state.selected = null;
        modal.hidden = true;
        lockScroll(false);

        // cleanup if needed
        if (modal._cleanupWords) { modal._cleanupWords(); modal._cleanupWords = null; }
        if (modal._cleanupReading) { modal._cleanupReading(); modal._cleanupReading = null; }
    }

    // Modal events
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) closeModal();
    });

    // Search
    if (searchInput){
        searchInput.addEventListener('input', () => {
            state.query = searchInput.value || '';
            renderAll();
        });
    }

    function renderAll(){
        renderTabs();
        renderContinue();
        renderSkeleton();
        renderGrid();
    }

    // Init
    renderAll();
})();
