(function () {
  'use strict';

  const STORAGE_KEY = 'anatil_ai_ui_state_v2';
  const DEFAULT_DAILY_LIMIT = 50;

  const dialogScenarios = [
    {
      id: 'cafe',
      name: 'В кафе',
      emoji: '☕',
      description: 'Заказ еды и напитков',
      difficulty: 'Лёгкий',
      goal: 'Заказать напиток и десерт, уточнить детали заказа, попросить счёт.',
      phrases: ['Маған бір кофе беріңізші — Дайте мне один кофе', 'Үлкен көлемде — В большом размере', 'Тағы не ұсынасыз? — Что ещё посоветуете?']
    },
    {
      id: 'shop',
      name: 'В магазине',
      emoji: '🛍️',
      description: 'Покупка продуктов',
      difficulty: 'Лёгкий',
      goal: 'Спросить цену, выбрать товар и оплатить покупку.',
      phrases: ['Бұл қанша тұрады? — Сколько это стоит?', 'Маған осы керек — Мне нужно это', 'Карточкамен төлеймін — Оплачу картой']
    },
    {
      id: 'taxi',
      name: 'В такси',
      emoji: '🚕',
      description: 'Маршрут и поездка',
      difficulty: 'Средний',
      goal: 'Назвать адрес, уточнить время и стоимость поездки.',
      phrases: ['Мені мына мекенжайға апарыңызшы — Отвезите меня по этому адресу', 'Қанша уақытта жетеміз? — За сколько доедем?', 'Осы жерде тоқтаңыз — Остановите здесь']
    },
    {
      id: 'university',
      name: 'В университете',
      emoji: '🎓',
      description: 'Разговор с преподавателем',
      difficulty: 'Средний',
      goal: 'Задать вопрос преподавателю и вежливо уточнить задание.',
      phrases: ['Менде сұрақ бар — У меня есть вопрос', 'Тапсырманы түсінбедім — Я не понял задание', 'Қайта түсіндіріп бересіз бе? — Объясните ещё раз, пожалуйста']
    },
    {
      id: 'meeting',
      name: 'Знакомство',
      emoji: '👋',
      description: 'Первая встреча',
      difficulty: 'Лёгкий',
      goal: 'Представиться, рассказать о себе и поддержать беседу.',
      phrases: ['Менің атым Арсен — Меня зовут Арсен', 'Мен Қарағандыданмын — Я из Караганды', 'Танысқаныма қуаныштымын — Рад познакомиться']
    }
  ];

  const fallbackVocabulary = {
    food: [
      { word: 'тағам', translation: 'еда', example: 'Бұл тағам өте дәмді', exampleTranslation: 'Эта еда очень вкусная', category: 'food', saved: true },
      { word: 'сусын', translation: 'напиток', example: 'Маған ыстық сусын беріңізші', exampleTranslation: 'Дайте мне горячий напиток', category: 'food', saved: false },
      { word: 'асхана', translation: 'столовая', example: 'Біз асханада тамақ ішеміз', exampleTranslation: 'Мы едим в столовой', category: 'food', saved: false }
    ],
    study: [
      { word: 'сабақ', translation: 'урок', example: 'Бүгін сабақ сағат тоғызда басталады', exampleTranslation: 'Сегодня урок начинается в девять', category: 'study', saved: true },
      { word: 'дәптер', translation: 'тетрадь', example: 'Мен жаңа дәптер сатып алдым', exampleTranslation: 'Я купил новую тетрадь', category: 'study', saved: false },
      { word: 'мұғалім', translation: 'учитель', example: 'Мұғалім тапсырманы түсіндірді', exampleTranslation: 'Учитель объяснил задание', category: 'study', saved: false }
    ],
    work: [
      { word: 'жұмыс', translation: 'работа', example: 'Мен жұмысты ерте бастаймын', exampleTranslation: 'Я начинаю работу рано', category: 'work', saved: false },
      { word: 'кездесу', translation: 'встреча', example: 'Бүгін маңызды кездесу бар', exampleTranslation: 'Сегодня важная встреча', category: 'work', saved: false }
    ],
    travel: [
      { word: 'саяхат', translation: 'путешествие', example: 'Жазда біз саяхатқа шығамыз', exampleTranslation: 'Летом мы отправимся в путешествие', category: 'travel', saved: false },
      { word: 'әуежай', translation: 'аэропорт', example: 'Әуежайға ерте келу керек', exampleTranslation: 'В аэропорт нужно приезжать рано', category: 'travel', saved: false }
    ],
    shopping: [
      { word: 'дүкен', translation: 'магазин', example: 'Біз дүкенге бардық', exampleTranslation: 'Мы пошли в магазин', category: 'shopping', saved: true },
      { word: 'бағасы', translation: 'цена', example: 'Бұның бағасы қанша?', exampleTranslation: 'Какая у этого цена?', category: 'shopping', saved: false }
    ]
  };

  const state = {
    mode: 'check',
    usage: { used: 0, total: DEFAULT_DAILY_LIMIT },
    sessionStats: { minutes: 0, errors: 0, words: 0 },
    achievements: { checks: 0, dialogs: 0, days: 1 },
    history: [],
    focusTopic: 'Падежи и окончания',
    currentLesson: null,
    courseLessons: [],
    courseSlug: '',
    user: null,
    activeSessionId: null,
    dialog: { scenarioId: null, started: false, messages: [], hints: 0, errors: 0 },
    tutor: { questions: 0, practices: 0 },
    vocabulary: { words: [], test: null, tab: 'all', search: '', category: null }
  };

  const els = {
    modeButtons: document.querySelectorAll('[data-mode]'),
    openModeButtons: document.querySelectorAll('[data-open-mode]'),
    views: document.querySelectorAll('[data-view]'),
    adminBtn: document.getElementById('adminBtn'),
    historyDrawer: document.getElementById('historyDrawer'),
    historyOverlay: document.getElementById('historyOverlay'),
    historyList: document.getElementById('historyList'),
    openHistoryBtn: document.getElementById('openHistoryBtn'),
    openLastSessionBtn: document.getElementById('openLastSessionBtn'),
    closeHistoryBtn: document.getElementById('closeHistoryBtn'),
    dailyUsage: document.getElementById('dailyUsage'),
    dailyUsageBar: document.getElementById('dailyUsageBar'),
    todayPracticeValue: document.getElementById('todayPracticeValue'),
    todayErrorsValue: document.getElementById('todayErrorsValue'),
    todayWordsValue: document.getElementById('todayWordsValue'),
    summaryTitle: document.getElementById('summaryTitle'),
    summaryText: document.getElementById('summaryText'),
    summaryProgressBar: document.getElementById('summaryProgressBar'),
    lastSessionTitle: document.getElementById('lastSessionTitle'),
    lastSessionMeta: document.getElementById('lastSessionMeta'),
    lastSessionMessages: document.getElementById('lastSessionMessages'),
    lastSessionWords: document.getElementById('lastSessionWords'),
    lastSessionErrors: document.getElementById('lastSessionErrors'),
    achievementChecks: document.getElementById('achievementChecks'),
    achievementDialogs: document.getElementById('achievementDialogs'),
    achievementDays: document.getElementById('achievementDays'),
    mistakeTopicTitle: document.getElementById('mistakeTopicTitle'),
    mistakeTopicText: document.getElementById('mistakeTopicText'),
    practiceMistakeBtn: document.getElementById('practiceMistakeBtn'),

    checkInput: document.getElementById('checkInput'),
    checkSentenceBtn: document.getElementById('checkSentenceBtn'),
    checkResult: document.getElementById('checkResult'),
    checkResultEmpty: document.getElementById('checkResultEmpty'),
    checkCorrected: document.getElementById('checkCorrected'),
    checkAdviceCard: document.getElementById('checkAdviceCard'),
    checkAdviceText: document.getElementById('checkAdviceText'),
    checkErrorsList: document.getElementById('checkErrorsList'),
    checkRule: document.getElementById('checkRule'),
    checkExamples: document.getElementById('checkExamples'),
    checkTask: document.getElementById('checkTask'),
    copyCorrectedBtn: document.getElementById('copyCorrectedBtn'),

    dialogScenarioGrid: document.getElementById('dialogScenarioGrid'),
    dialogScenarioStep: document.getElementById('dialogScenarioStep'),
    dialogChatStep: document.getElementById('dialogChatStep'),
    dialogBackBtn: document.getElementById('dialogBackBtn'),
    dialogScenarioTitle: document.getElementById('dialogScenarioTitle'),
    dialogScenarioDescription: document.getElementById('dialogScenarioDescription'),
    dialogScenarioDifficulty: document.getElementById('dialogScenarioDifficulty'),
    dialogGoalText: document.getElementById('dialogGoalText'),
    dialogScenarioEmoji: document.getElementById('dialogScenarioEmoji'),
    dialogProgressBar: document.getElementById('dialogProgressBar'),
    dialogProgressText: document.getElementById('dialogProgressText'),
    dialogMessages: document.getElementById('dialogMessages'),
    dialogInput: document.getElementById('dialogInput'),
    sendDialogBtn: document.getElementById('sendDialogBtn'),
    showHintBtn: document.getElementById('showHintBtn'),
    dialogExplainBtn: document.getElementById('dialogExplainBtn'),
    dialogRepeatBtn: document.getElementById('dialogRepeatBtn'),
    dialogPhraseList: document.getElementById('dialogPhraseList'),
    dialogMessagesCount: document.getElementById('dialogMessagesCount'),
    dialogErrorsCount: document.getElementById('dialogErrorsCount'),
    dialogHintsCount: document.getElementById('dialogHintsCount'),

    currentLessonTitle: document.getElementById('currentLessonTitle'),
    currentLessonText: document.getElementById('currentLessonText'),
    lessonSelect: document.getElementById('lessonSelect'),
    useCurrentLessonBtn: document.getElementById('useCurrentLessonBtn'),
    tutorInput: document.getElementById('tutorInput'),
    sendTutorBtn: document.getElementById('sendTutorBtn'),
    tutorMessages: document.getElementById('tutorMessages'),
    tutorPractice: document.getElementById('tutorPractice'),
    tutorTopics: document.getElementById('tutorTopics'),
    tutorQuestionsCount: document.getElementById('tutorQuestionsCount'),
    tutorPracticeCount: document.getElementById('tutorPracticeCount'),
    tutorUnderstanding: document.getElementById('tutorUnderstanding'),

    vocabularySearch: document.getElementById('vocabularySearch'),
    vocabularyWords: document.getElementById('vocabularyWords'),
    vocabularyEmpty: document.getElementById('vocabularyEmpty'),
    vocabularyCategories: document.getElementById('vocabularyCategories'),
    vocabularyListTitle: document.getElementById('vocabularyListTitle'),
    vocabularyCountMeta: document.getElementById('vocabularyCountMeta'),
    vocabularyTest: document.getElementById('vocabularyTest'),
    vocabularyQuestion: document.getElementById('vocabularyQuestion'),
    vocabularyOptions: document.getElementById('vocabularyOptions'),
    generateWordsBtn: document.getElementById('generateWordsBtn'),
    vocabStatTotal: document.getElementById('vocabStatTotal'),
    vocabStatSaved: document.getElementById('vocabStatSaved'),
    vocabStatRepeat: document.getElementById('vocabStatRepeat'),
    vocabStatToday: document.getElementById('vocabStatToday')
  };

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function request(url, options) {
    if (typeof window.apiFetch === 'function') return window.apiFetch(url, options || {});
    return fetch(url, options || {}).then(function (res) { return res.json(); });
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;
      Object.assign(state.usage, parsed.usage || {});
      Object.assign(state.sessionStats, parsed.sessionStats || {});
      Object.assign(state.achievements, parsed.achievements || {});
      state.history = Array.isArray(parsed.history) ? parsed.history : [];
      state.focusTopic = parsed.focusTopic || state.focusTopic;
      if (parsed.currentLesson && typeof parsed.currentLesson === 'object') state.currentLesson = parsed.currentLesson;
      if (parsed.vocabulary && Array.isArray(parsed.vocabulary.words)) state.vocabulary.words = parsed.vocabulary.words;
      if (parsed.vocabulary && parsed.vocabulary.test) state.vocabulary.test = parsed.vocabulary.test;
    } catch (error) {
      console.error(error);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        usage: state.usage,
        sessionStats: state.sessionStats,
        achievements: state.achievements,
        history: state.history.slice(0, 20),
        focusTopic: state.focusTopic,
        currentLesson: state.currentLesson,
        vocabulary: { words: state.vocabulary.words, test: state.vocabulary.test }
      }));
    } catch (error) {
      console.error(error);
    }
  }

  function getActiveChipValue(groupName) {
    const active = document.querySelector('[data-chip-group="' + groupName + '"] .ai-chip--active');
    return active ? active.dataset.value || active.textContent.trim() : '';
  }

  function bindChipGroups() {
    document.querySelectorAll('[data-chip-group]').forEach(function (group) {
      group.addEventListener('click', function (event) {
        const button = event.target.closest('.ai-chip');
        if (!button) return;
        group.querySelectorAll('.ai-chip').forEach(function (chip) { chip.classList.remove('ai-chip--active'); });
        button.classList.add('ai-chip--active');
      });
    });
  }

  function setupDashHeader() {
    const burger = document.querySelector('.dash-header__burger');
    const mobile = document.querySelector('.dash-header__mobile');
    if (!burger || !mobile) return;
    function closeMenu() {
      mobile.setAttribute('hidden', '');
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-menu-open');
    }
    function openMenu() {
      mobile.removeAttribute('hidden');
      burger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('is-menu-open');
    }
    burger.addEventListener('click', function () {
      if (mobile.hasAttribute('hidden')) openMenu(); else closeMenu();
    });
    mobile.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) closeMenu();
    });
    closeMenu();
  }

  function setMode(mode) {
    state.mode = mode;
    els.modeButtons.forEach(function (button) { button.classList.toggle('ai-mode--active', button.dataset.mode === mode); });
    els.views.forEach(function (view) { view.classList.toggle('ai-view--active', view.dataset.view === mode); });
  }

  function setUsage(used, total) {
    state.usage.used = Number(used || 0);
    state.usage.total = Number(total || DEFAULT_DAILY_LIMIT);
    const percent = Math.max(0, Math.min(100, Math.round((state.usage.used / Math.max(1, state.usage.total)) * 100)));
    if (els.dailyUsage) els.dailyUsage.textContent = state.usage.used + ' / ' + state.usage.total;
    if (els.dailyUsageBar) els.dailyUsageBar.style.width = percent + '%';
  }

  function increaseUsage(step) {
    setUsage(Math.min(state.usage.total, state.usage.used + Number(step || 1)), state.usage.total);
    saveState();
  }

  function updateStatsView() {
    if (els.todayPracticeValue) els.todayPracticeValue.textContent = state.sessionStats.minutes + ' мин';
    if (els.todayErrorsValue) els.todayErrorsValue.textContent = String(state.sessionStats.errors);
    if (els.todayWordsValue) els.todayWordsValue.textContent = String(state.sessionStats.words);
    if (els.achievementChecks) els.achievementChecks.textContent = String(state.achievements.checks);
    if (els.achievementDialogs) els.achievementDialogs.textContent = String(state.achievements.dialogs);
    if (els.achievementDays) els.achievementDays.textContent = String(state.achievements.days);
    if (els.mistakeTopicTitle) els.mistakeTopicTitle.textContent = state.focusTopic;
    if (els.mistakeTopicText) els.mistakeTopicText.textContent = 'Сейчас чаще всего встречаются ошибки по теме: ' + state.focusTopic + '. Открой практику и закрепи правило ещё раз.';
  }

  function updateLastSessionCard() {
    const session = state.history[0];
    if (!session) return;
    els.lastSessionTitle.textContent = session.title;
    els.lastSessionMeta.textContent = session.meta;
    els.lastSessionMessages.textContent = String(session.messages || 0);
    els.lastSessionWords.textContent = String(session.words || 0);
    els.lastSessionErrors.textContent = String(session.errors || 0);
  }

  function pushHistory(entry) {
    state.history.unshift(entry);
    state.history = state.history.slice(0, 20);
    updateLastSessionCard();
    renderHistory();
    saveState();
  }

  function renderHistory() {
    if (!els.historyList) return;
    if (!state.history.length) {
      els.historyList.innerHTML = '<div class="ai-note">Пока нет сохранённых сессий.</div>';
      return;
    }
    els.historyList.innerHTML = state.history.map(function (item) {
      return '<div class="ai-history-item"><span class="ai-history-item__mode">' + escapeHtml(item.modeLabel) + '</span><strong class="ai-history-item__title">' + escapeHtml(item.title) + '</strong><span class="ai-history-item__meta">' + escapeHtml(item.meta) + '</span></div>';
    }).join('');
  }

  function openHistory() {
    if (!els.historyDrawer) return;
    renderHistory();
    els.historyDrawer.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeHistory() {
    if (!els.historyDrawer) return;
    els.historyDrawer.hidden = true;
    document.body.style.overflow = '';
  }

  function setButtonLoading(button, loading, label) {
    if (!button) return;
    if (loading) {
      if (!button.dataset.initialLabel) button.dataset.initialLabel = button.textContent;
      button.disabled = true;
      button.textContent = label || 'Загрузка...';
    } else {
      button.disabled = false;
      if (button.dataset.initialLabel) button.textContent = button.dataset.initialLabel;
    }
  }

  function parseResponsePayload(payload) {
    function parseNestedReply(value) {
      if (typeof value !== 'string') return null;
      const text = value.trim();
      if (!text) return '';
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed.reply === 'string') return parsed.reply;
      } catch (error) {}
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (parsed && typeof parsed.reply === 'string') return parsed.reply;
        } catch (error) {}
      }
      return text;
    }

    if (!payload) return null;
    if (typeof payload === 'string') return parseNestedReply(payload);
    if (typeof payload.reply === 'string') return parseNestedReply(payload.reply);
    if (typeof payload.message === 'string') return payload.message;
    if (typeof payload.text === 'string') return payload.text;
    if (typeof payload.response === 'string') return payload.response;
    if (typeof payload.result === 'string') return payload.result;
    if (payload.data) return parseResponsePayload(payload.data);
    if (Array.isArray(payload.choices) && payload.choices[0] && payload.choices[0].message) return parseNestedReply(payload.choices[0].message.content);
    return null;
  }

  function extractJson(text) {
    if (!text) return null;
    const cleaned = String(text).replace(/^```json\s*/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    try { return JSON.parse(cleaned); } catch (error) {}
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch (error) { return null; }
  }

  function normalizeSessionMode(mode) {
    if (mode === 'sentence_check' || mode === 'check') return 'sentence';
    if (mode === 'lesson_tutor' || mode === 'tutor') return 'tutor';
    if (mode === 'dialog') return 'dialog';
    return null;
  }

  async function ensureSession(mode, meta) {
    const sessionMode = normalizeSessionMode(mode);
    if (!sessionMode) return null;
    try {
      const body = { mode: sessionMode };
      if (sessionMode === 'dialog' && meta && meta.scenario) body.scenario = meta.scenario;
      if (sessionMode === 'tutor' && meta && meta.lessonId) body.lessonId = meta.lessonId;
      const response = await request('/api/ai/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const session = response && (response.session || response.data && response.data.session || response.data || response);
      state.activeSessionId = session && (session.id || session.sessionId) ? (session.id || session.sessionId) : null;
      return state.activeSessionId;
    } catch (error) {
      return null;
    }
  }

  async function aiChat(payload) {
    const sessionId = state.activeSessionId || await ensureSession(payload.mode || state.mode, payload.meta || {});
    const requestPayload = Object.assign({}, payload, sessionId ? { sessionId: sessionId } : {});
    const data = await request('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload)
    });
    const usage = data && (data.usage || data.data && data.data.usage);
    if (usage) setUsage(usage.used || state.usage.used, usage.limit || state.usage.total);
    return parseResponsePayload(data) || '';
  }

  async function aiChatDialog(payload) {
    const sessionId = state.activeSessionId || await ensureSession(payload.mode || state.mode, payload.meta || {});
    const requestPayload = Object.assign({}, payload, sessionId ? { sessionId: sessionId } : {});
    const data = await request('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload)
    });
    const usage = data && (data.usage || data.data && data.data.usage);
    if (usage) setUsage(usage.used || state.usage.used, usage.limit || state.usage.total);

    const reply = parseResponsePayload(data) || '';
    const correctionSource = data && (data.correction || data.data && data.data.correction) || {};
    return {
      reply: reply,
      correction: {
        hasIssue: !!correctionSource.hasIssue,
        better: typeof correctionSource.better === 'string' ? correctionSource.better.trim() : '',
        explanation: typeof correctionSource.explanation === 'string' ? correctionSource.explanation.trim() : ''
      }
    };
  }

  function formatMeta(prefix, messages, words, errors) {
    return prefix + ' • ' + messages + ' сообщ. • ' + words + ' слов • ' + errors + ' ошибок';
  }

  function stripHtml(html) {
    return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function updateLessonUi() {
    const title = state.currentLesson && state.currentLesson.title ? state.currentLesson.title : 'Урок не выбран';
    if (els.currentLessonTitle) els.currentLessonTitle.textContent = title;
    if (els.currentLessonText) {
      const moduleText = state.currentLesson && state.currentLesson.moduleTitle ? 'Модуль: ' + state.currentLesson.moduleTitle + '. ' : '';
      const courseText = state.currentLesson && state.currentLesson.courseTitle ? 'Курс: ' + state.currentLesson.courseTitle + '. ' : '';
      const info = state.currentLesson && state.currentLesson.isFallbackTitleOnly
        ? 'Контекст урока ограничен: этот урок пока не открыт в основном курсе, поэтому AI использует название урока и курс.'
        : 'AI учитывает тему выбранного урока и отвечает по ней без лишней болтовни.';
      els.currentLessonText.textContent = moduleText + courseText + info;
    }
  }

  function renderLessonOptions() {
    if (!els.lessonSelect) return;
    if (!state.courseLessons.length) {
      els.lessonSelect.innerHTML = '<option value="">Уроки не найдены</option>';
      return;
    }
    els.lessonSelect.innerHTML = state.courseLessons.map(function (lesson) {
      const moduleTitle = lesson.moduleTitle ? lesson.moduleTitle + ' • ' : '';
      const status = lesson.isDefault ? ' • текущий' : '';
      return '<option value="' + lesson.id + '">' + escapeHtml(moduleTitle + lesson.title + status) + '</option>';
    }).join('');
    if (state.currentLesson && state.currentLesson.id) {
      els.lessonSelect.value = String(state.currentLesson.id);
    }
  }

  async function selectLessonById(lessonId, options) {
    const lesson = state.courseLessons.find(function (item) { return Number(item.id) === Number(lessonId); });
    if (!lesson) return;
    const keepSession = !!(options && options.keepSession);
    if (!keepSession) state.activeSessionId = null;
    state.currentLesson = Object.assign({}, lesson);
    try {
      const detail = await request('/api/lesson/' + lesson.id, { method: 'GET' });
      const payload = detail && detail.lesson ? detail.lesson : detail;
      if (payload && payload.lesson) {
        state.currentLesson.content = stripHtml(payload.lesson.content || '');
      } else if (payload && payload.content != null) {
        state.currentLesson.content = stripHtml(payload.content || '');
      } else if (detail && detail.lesson && detail.lesson.content != null) {
        state.currentLesson.content = stripHtml(detail.lesson.content || '');
      }
      state.currentLesson.isFallbackTitleOnly = false;
    } catch (error) {
      state.currentLesson.content = '';
      state.currentLesson.isFallbackTitleOnly = true;
    }
    renderLessonOptions();
    updateLessonUi();
    saveState();
  }

  function ensureText(value, fallback) {
    if (value == null) return fallback || '—';
    if (typeof value === 'string') return value.trim() || (fallback || '—');
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') {
      if (typeof value.text === 'string') return value.text.trim() || (fallback || '—');
      if (typeof value.message === 'string') return value.message.trim() || (fallback || '—');
      if (typeof value.title === 'string') return value.title.trim() || (fallback || '—');
    }
    return String(value);
  }

  function normalizeList(value, emptyText) {
    if (Array.isArray(value) && value.length) return value.map(function (item) { return ensureText(item, emptyText); });
    if (typeof value === 'string' && value.trim()) return [value.trim()];
    return [emptyText];
  }

  function showCheckResult() {
    if (els.checkResultEmpty) els.checkResultEmpty.hidden = true;
    if (els.checkResult) {
      els.checkResult.hidden = false;
      els.checkResult.setAttribute('aria-hidden', 'false');
      els.checkResult.classList.remove('ai-result-stack--hidden');
    }
  }

  function renderCheckResult(result) {
    showCheckResult();
    if (els.checkAdviceCard) els.checkAdviceCard.hidden = false;
    if (els.checkCorrected) els.checkCorrected.textContent = ensureText(result && result.corrected, '—');
    var errors = normalizeList(result && result.errors, 'Ошибки не найдены');
    if (els.checkErrorsList) els.checkErrorsList.innerHTML = errors.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('');
    if (els.checkRule) els.checkRule.textContent = ensureText(result && result.rule, '—');
    var examples = normalizeList(result && result.examples, 'Примеров пока нет');
    if (els.checkExamples) els.checkExamples.innerHTML = examples.map(function (item) { return '<div class="ai-example">' + escapeHtml(item) + '</div>'; }).join('');
    if (els.checkTask) els.checkTask.textContent = ensureText(result && result.task, '—');
    if (els.checkAdviceText) els.checkAdviceText.textContent = ensureText(result && result.advice, 'Пишите естественные предложения из жизни. ИИ поможет не только найти ошибки, но и предложит более естественные варианты фраз.');
  }


  function resetCheckResultView() {
    if (els.checkResult) {
      els.checkResult.hidden = true;
      els.checkResult.setAttribute('aria-hidden', 'true');
      els.checkResult.classList.add('ai-result-stack--hidden');
    }
    if (els.checkResultEmpty) els.checkResultEmpty.hidden = false;
    if (els.checkAdviceCard) els.checkAdviceCard.hidden = true;
  }

  function fallbackCheckResult(text) {
    return {
      corrected: text,
      errors: ['ИИ вернул общий ответ. Попробуй ещё раз или измени формулировку.'],
      rule: 'Структурированный ответ не получен, поэтому показываем общий результат.',
      examples: ['Мен кеше дүкенге бардым.', 'Мен бүгін сабақ оқып отырмын.', 'Мен ертең досыммен кездесемін.'],
      task: 'Сделай ещё одно предложение на ту же тему.',
      advice: 'Сначала запомни исправленный вариант, потом составь похожую фразу с тем же правилом.'
    };
  }

  async function handleCheck(extraInstruction) {
    const text = (els.checkInput.value || '').trim();
    if (!text) return alert('Напиши предложение для проверки');
    setButtonLoading(els.checkSentenceBtn, true, 'Проверяем...');
    try {
      const raw = await aiChat({
        mode: 'sentence_check',
        message: text,
        lessonTitle: state.currentLesson ? state.currentLesson.title : '',
        lessonCourseTitle: state.currentLesson ? state.currentLesson.courseTitle : '',
        extraInstruction: extraInstruction || '',
        lessonContent: state.currentLesson ? state.currentLesson.content || '' : ''
      });
      const parsed = extractJson(raw);
      const result = parsed || fallbackCheckResult(raw || text);
      renderCheckResult(result);
      state.sessionStats.errors += result.errors ? result.errors.length : 0;
      state.sessionStats.minutes += 2;
      state.achievements.checks += 1;
      if (result.errors && result.errors[0]) state.focusTopic = result.errors[0].slice(0, 60);
      increaseUsage(1);
      updateStatsView();
      pushHistory({
        modeLabel: 'Проверка предложения',
        title: 'Проверка: ' + text.slice(0, 40),
        meta: formatMeta('Сейчас', 1, text.split(/\s+/).length, result.errors ? result.errors.length : 0),
        messages: 1,
        words: text.split(/\s+/).length,
        errors: result.errors ? result.errors.length : 0
      });
    } catch (error) {
      console.error(error);
      renderCheckResult(fallbackCheckResult('Не удалось получить ответ от ИИ. Попробуй ещё раз.'));
    } finally {
      setButtonLoading(els.checkSentenceBtn, false);
      saveState();
    }
  }

  function renderDialogScenarios() {
    if (!els.dialogScenarioGrid) return;
    els.dialogScenarioGrid.innerHTML = dialogScenarios.map(function (item) {
      return '<button class="ai-card ai-scenario-card" type="button" data-scenario-id="' + item.id + '"><div class="ai-mode-head"><div class="ai-mode-head__icon ai-mode-head__icon--green">' + item.emoji + '</div><div><h3 class="ai-card__title" style="margin-bottom:4px">' + escapeHtml(item.name) + '</h3><p class="ai-card__text">' + escapeHtml(item.description) + '</p></div></div><div class="ai-row-gap"><span class="ai-badge ai-badge--success">' + escapeHtml(item.difficulty) + '</span><span class="ai-btn ai-btn--primary">Начать диалог</span></div></button>';
    }).join('');
  }

  function renderDialogMessages() {
    if (!els.dialogMessages) return;
    els.dialogMessages.innerHTML = state.dialog.messages.map(function (item) {
      const correction = item.correction && item.correction.hasIssue
        ? '<div class="ai-chat-message__correction"><strong>Исправление:</strong> ' + escapeHtml(item.correction.better || '') + (item.correction.explanation ? '<span class="ai-chat-message__correction-note">' + escapeHtml(item.correction.explanation) + '</span>' : '') + '</div>'
        : '';
      return '<div class="ai-chat-message ' + (item.role === 'user' ? 'ai-chat-message--user' : 'ai-chat-message--ai') + '">' + escapeHtml(item.text) + correction + (item.meta ? '<span class="ai-chat-message__meta">' + escapeHtml(item.meta) + '</span>' : '') + '</div>';
    }).join('');
    els.dialogMessages.scrollTop = els.dialogMessages.scrollHeight;
    els.dialogMessagesCount.textContent = String(state.dialog.messages.filter(function (item) { return item.role === 'user'; }).length);
    els.dialogErrorsCount.textContent = String(state.dialog.errors);
    els.dialogHintsCount.textContent = String(state.dialog.hints);
    const progress = Math.max(10, Math.min(100, state.dialog.messages.filter(function (item) { return item.role === 'user'; }).length * 20));
    els.dialogProgressBar.style.width = progress + '%';
    els.dialogProgressText.textContent = 'Прогресс диалога: ' + progress + '%';
  }

  function openDialogScenario(scenarioId) {
    const scenario = dialogScenarios.find(function (item) { return item.id === scenarioId; }) || dialogScenarios[0];
    state.activeSessionId = null;
    state.dialog.scenarioId = scenario.id;
    state.dialog.started = true;
    state.dialog.messages = [{ role: 'assistant', text: scenario.name === 'В кафе' ? 'Сәлеметсіз бе! Не ішесіз?' : 'Сәлеметсіз бе! Бүгін сізге қалай көмектесе аламын?', meta: 'Сценарий: ' + scenario.name }];
    state.dialog.hints = 0;
    state.dialog.errors = 0;
    els.dialogScenarioStep.hidden = true;
    els.dialogChatStep.hidden = false;
    els.dialogScenarioTitle.textContent = scenario.name;
    els.dialogScenarioDescription.textContent = scenario.description;
    els.dialogScenarioDifficulty.textContent = scenario.difficulty;
    els.dialogGoalText.textContent = scenario.goal;
    els.dialogScenarioEmoji.textContent = scenario.emoji;
    els.dialogPhraseList.innerHTML = scenario.phrases.map(function (phrase) {
      const parts = phrase.split(' — ');
      return '<div class="ai-phrase-item"><strong>' + escapeHtml(parts[0]) + '</strong><span>' + escapeHtml(parts[1] || '') + '</span></div>';
    }).join('');
    renderDialogMessages();
  }

  function closeDialogScenario() {
    els.dialogScenarioStep.hidden = false;
    els.dialogChatStep.hidden = true;
    state.dialog.started = false;
    state.dialog.scenarioId = null;
  }

  async function sendDialogMessage(kind) {
    if (!state.dialog.started) return;
    const scenario = dialogScenarios.find(function (item) { return item.id === state.dialog.scenarioId; }) || dialogScenarios[0];
    let text = '';
    if (kind === 'hint') text = 'Подскажи короткий ответ для этой ситуации.';
    else if (kind === 'repeat') text = 'Повтори последний вопрос и сформулируй его проще.';
    else if (kind === 'explain') text = 'Объясни, как ответить лучше и естественнее.';
    else text = (els.dialogInput.value || '').trim();
    if (!text) return;

    if (kind === 'message') {
      state.dialog.messages.push({ role: 'user', text: text });
      els.dialogInput.value = '';
    }

    setButtonLoading(els.sendDialogBtn, true, 'Отправляем...');
    try {
      const response = await aiChatDialog({
        mode: 'dialog',
        action: kind,
        message: text,
        history: state.dialog.messages.slice(-8),
        scenario: scenario.name,
        scenarioGoal: scenario.goal,
        scenarioDifficulty: scenario.difficulty,
        supportPhrases: scenario.phrases,
        meta: { scenario: scenario.name }
      });
      const reply = response && response.reply ? response.reply : 'Жақсы, тапсырысыңызды нақтылап айтыңызшы.';
      const correction = response && response.correction ? response.correction : null;
      if (kind === 'message' && correction && correction.hasIssue) {
        for (let index = state.dialog.messages.length - 1; index >= 0; index -= 1) {
          if (state.dialog.messages[index].role === 'user' && !state.dialog.messages[index].correction) {
            state.dialog.messages[index].correction = correction;
            break;
          }
        }
      }
      state.dialog.messages.push({ role: 'assistant', text: reply });
      if (kind === 'hint') state.dialog.hints += 1;
      if (kind === 'message') {
        state.achievements.dialogs += 1;
        state.sessionStats.minutes += 2;
        if (correction && correction.hasIssue) state.dialog.errors += 1;
      }
      increaseUsage(1);
      updateStatsView();
      renderDialogMessages();
      pushHistory({
        modeLabel: 'Диалог',
        title: 'Диалог: ' + scenario.name,
        meta: formatMeta('Сейчас', state.dialog.messages.length, 0, state.dialog.errors),
        messages: state.dialog.messages.length,
        words: 0,
        errors: state.dialog.errors
      });
    } catch (error) {
      console.error(error);
      state.dialog.messages.push({ role: 'assistant', text: 'Жақсы, тағы бір рет айтып көріңізші.' });
      renderDialogMessages();
    } finally {
      setButtonLoading(els.sendDialogBtn, false);
      saveState();
    }
  }

  function renderTutorTopics() {
    const topics = [
      { title: 'Барыс септік (-ге/-ға)', text: 'Направление и цель', active: true },
      { title: 'Жатыс септік (-те/-де)', text: 'Место нахождения' },
      { title: 'Шығыс септік (-ден/-дан)', text: 'Исходная точка' },
      { title: 'Табыс септік (-ды/-ді)', text: 'Прямое дополнение' }
    ];
    els.tutorTopics.innerHTML = topics.map(function (item) {
      return '<div class="ai-topic-item ' + (item.active ? 'ai-topic-item--active' : '') + '"><strong>' + escapeHtml(item.title) + '</strong><span>' + escapeHtml(item.text) + '</span></div>';
    }).join('');
  }

  function renderTutorContent(text, practice) {
    els.tutorMessages.innerHTML = '<div class="ai-answer-box">' + String(text || '').split('\n').map(function (p) { return '<p>' + escapeHtml(p) + '</p>'; }).join('') + '</div>';
    els.tutorPractice.innerHTML = '<div class="ai-practice-box"><p><strong>Задание:</strong> ' + escapeHtml(practice.title) + '</p><p>' + escapeHtml(practice.text) + '</p></div>';
  }

  async function askTutor(question, actionLabel) {
    const text = (question || els.tutorInput.value || '').trim();
    if (!text) return alert('Напиши вопрос для репетитора');
    setButtonLoading(els.sendTutorBtn, true, 'Отвечаем...');
    try {
      const raw = await aiChat({
        mode: 'lesson_tutor',
        message: text,
        action: actionLabel || 'default',
        lessonTitle: state.currentLesson ? state.currentLesson.title : '',
        lessonCourseTitle: state.currentLesson ? state.currentLesson.courseTitle : '',
        lessonProgress: state.currentLesson ? state.currentLesson.percent : 0,
        lessonId: state.currentLesson ? state.currentLesson.id : null,
        lessonContent: state.currentLesson ? state.currentLesson.content || '' : '',
        prompt: 'Ты — репетитор по уроку казахского языка. Объясняй коротко, понятно и по теме урока. В конце дай небольшое упражнение.',
        meta: { lesson: state.currentLesson ? state.currentLesson.title : 'Текущий урок', lessonId: state.currentLesson ? state.currentLesson.id : null, action: actionLabel || 'default' }
      });
      const answer = raw || 'Барыс септік используется для направления движения и ответа на вопрос «куда?». Например: мектепке барамын.';
      renderTutorContent(answer, {
        title: 'Дополните предложения правильным падежом.',
        text: '1. Мен университет___ барамын. 2. Біз дос___ кітап бердік. 3. Ол үй___ қайтты.'
      });
      state.tutor.questions += 1;
      if (actionLabel === 'exercise') state.tutor.practices += 1;
      els.tutorQuestionsCount.textContent = String(state.tutor.questions);
      els.tutorPracticeCount.textContent = state.tutor.practices + '/5';
      els.tutorUnderstanding.textContent = state.tutor.questions >= 3 ? 'Хорошее' : 'В процессе';
      state.sessionStats.minutes += 2;
      increaseUsage(1);
      updateStatsView();
      pushHistory({
        modeLabel: 'Репетитор по уроку',
        title: 'Вопрос: ' + text.slice(0, 40),
        meta: formatMeta('Сейчас', 1, 0, 0),
        messages: 1,
        words: 0,
        errors: 0
      });
    } catch (error) {
      console.error(error);
      renderTutorContent('Не удалось получить ответ от ИИ. Попробуй задать вопрос ещё раз.', {
        title: 'Сделай одно предложение по теме урока.',
        text: 'Напиши 3 коротких примера с нужным окончанием.'
      });
    } finally {
      setButtonLoading(els.sendTutorBtn, false);
      saveState();
    }
  }

  function getAllWords() {
    const base = [].concat(fallbackVocabulary.food, fallbackVocabulary.study, fallbackVocabulary.work, fallbackVocabulary.travel, fallbackVocabulary.shopping);
    const extra = Array.isArray(state.vocabulary.words) ? state.vocabulary.words : [];
    return extra.length ? extra : base;
  }

  function renderVocabularyCategories(words) {
    const categories = [
      { id: null, name: 'Все темы' },
      { id: 'food', name: 'Еда' },
      { id: 'study', name: 'Учёба' },
      { id: 'work', name: 'Работа' },
      { id: 'travel', name: 'Путешествия' },
      { id: 'shopping', name: 'Покупки' }
    ];
    els.vocabularyCategories.innerHTML = categories.map(function (item) {
      const count = item.id ? words.filter(function (word) { return word.category === item.id; }).length : words.length;
      return '<button class="ai-category-item ' + ((state.vocabulary.category === item.id || (!state.vocabulary.category && item.id === null)) ? 'ai-category-item--active' : '') + '" type="button" data-vocab-category="' + (item.id || '') + '"><strong>' + escapeHtml(item.name) + '</strong><span>' + count + ' слов</span></button>';
    }).join('');
  }

  function renderVocabulary() {
    const words = getAllWords();
    const filtered = words.filter(function (word) {
      const matchesSearch = !state.vocabulary.search || word.word.toLowerCase().includes(state.vocabulary.search) || word.translation.toLowerCase().includes(state.vocabulary.search);
      const matchesCategory = !state.vocabulary.category || word.category === state.vocabulary.category;
      const matchesTab = state.vocabulary.tab === 'all' || (state.vocabulary.tab === 'saved' && word.saved) || (state.vocabulary.tab === 'repeat' && !word.saved);
      return matchesSearch && matchesCategory && matchesTab;
    });

    els.vocabStatTotal.textContent = String(words.length);
    els.vocabStatSaved.textContent = String(words.filter(function (word) { return word.saved; }).length);
    els.vocabStatRepeat.textContent = String(words.filter(function (word) { return !word.saved; }).length);
    els.vocabStatToday.textContent = String(Math.min(5, words.length));
    els.vocabularyListTitle.textContent = state.vocabulary.tab === 'saved' ? 'Сохранённые слова' : state.vocabulary.tab === 'repeat' ? 'Слова к повторению' : 'Все слова';
    els.vocabularyCountMeta.textContent = filtered.length + ' слов';
    els.vocabularyEmpty.hidden = filtered.length > 0;
    els.vocabularyWords.innerHTML = filtered.map(function (word) {
      return '<article class="ai-word-card"><div class="ai-word-card__top"><div><h4 class="ai-word-card__word">' + escapeHtml(word.word) + '</h4><div class="ai-word-card__translation">' + escapeHtml(word.translation) + '</div></div><button class="ai-btn ai-btn--ghost" type="button">' + (word.saved ? '⭐' : '☆') + '</button></div><div class="ai-word-card__example">' + escapeHtml(word.example) + '<span>' + escapeHtml(word.exampleTranslation || '') + '</span></div><div class="ai-word-card__actions"><button class="ai-btn ai-btn--secondary" type="button">Больше примеров</button><button class="ai-btn ai-btn--secondary" type="button">Практика</button></div></article>';
    }).join('');

    renderVocabularyCategories(words);

    if (state.vocabulary.test) {
      els.vocabularyTest.hidden = false;
      els.vocabularyQuestion.innerHTML = 'Как переводится слово <strong>' + escapeHtml(state.vocabulary.test.word) + '</strong>?';
      els.vocabularyOptions.innerHTML = state.vocabulary.test.options.map(function (option) {
        return '<button class="ai-option" type="button" data-vocab-answer="' + escapeHtml(option) + '">' + escapeHtml(option) + '</button>';
      }).join('');
    }
  }

  async function generateWords() {
    const theme = getActiveChipValue('vocabularyTheme') || 'Еда';
    const count = Number(getActiveChipValue('vocabularyCount') || 10);
    setButtonLoading(els.generateWordsBtn, true, 'Генерируем...');
    try {
      const raw = await aiChat({
        mode: 'vocabulary',
        message: theme,
        prompt: 'Ты создаёшь словарь для изучения казахского языка. Тема: ' + theme + '. Количество слов: ' + count + '. Ответь JSON-объектом с ключами words и test.',
        meta: { theme: theme, count: count }
      });
      const parsed = extractJson(raw);
      if (parsed && Array.isArray(parsed.words) && parsed.words.length) {
        state.vocabulary.words = parsed.words.map(function (item) {
          return {
            word: item.word,
            translation: item.translation,
            example: item.example,
            exampleTranslation: item.exampleTranslation || '',
            category: (theme === 'Еда' ? 'food' : theme === 'Учёба' ? 'study' : theme === 'Работа' ? 'work' : 'travel'),
            saved: false
          };
        });
        state.vocabulary.test = parsed.test || null;
      } else {
        state.vocabulary.words = getAllWords().slice(0, count);
        state.vocabulary.test = { word: state.vocabulary.words[0].word, options: [state.vocabulary.words[0].translation, 'машина', 'кітап'] };
      }
      state.sessionStats.words += Math.min(count, state.vocabulary.words.length);
      state.sessionStats.minutes += 2;
      increaseUsage(1);
      updateStatsView();
      renderVocabulary();
      pushHistory({
        modeLabel: 'Словарь',
        title: 'Слова: ' + theme,
        meta: formatMeta('Сейчас', 1, state.vocabulary.words.length, 0),
        messages: 1,
        words: state.vocabulary.words.length,
        errors: 0
      });
    } catch (error) {
      console.error(error);
      renderVocabulary();
    } finally {
      setButtonLoading(els.generateWordsBtn, false);
      saveState();
    }
  }

  async function hydrateUserData() {
    try {
      const me = await request('/api/auth/me', { method: 'GET' });
      const user = me && (me.user || me.data && me.data.user || me.success && me.user);
      if (user) {
        state.user = user;
        if ((user.role === 'admin' || user.is_admin) && els.adminBtn) els.adminBtn.style.display = 'inline-block';
      }
    } catch (error) {
      console.error(error);
    }

    try {
      const progress = await request('/api/lessons/progress/current', { method: 'GET' });
      const data = progress && progress.data ? progress.data : progress;
      if (data && data.course) {
        state.courseSlug = data.course.slug || '';
        const defaultLessonId = data.nextLesson && data.nextLesson.id || data.lastLesson && data.lastLesson.id || null;
        const defaultLessonTitle = data.nextLesson && data.nextLesson.title || data.lastLesson && data.lastLesson.title || data.course.title;
        state.currentLesson = {
          id: defaultLessonId,
          title: defaultLessonTitle,
          courseTitle: data.course.title,
          percent: Number(data.percent || 0),
          isDefault: true,
          moduleTitle: '',
          content: ''
        };
        if (els.summaryTitle) els.summaryTitle.textContent = 'Практика по курсу — ' + data.course.title;
        if (els.summaryText) els.summaryText.textContent = data.nextLesson ? 'По умолчанию выбран урок, на котором ты остановился: ' + data.nextLesson.title + '. При желании ниже можно переключить AI на любой урок твоего курса.' : 'Курс почти завершён. Ниже можно выбрать любой урок этого курса и закрепить тему с ИИ.';
        if (els.summaryProgressBar) els.summaryProgressBar.style.width = Math.max(0, Math.min(100, state.currentLesson.percent)) + '%';
        updateLessonUi();

        if (state.courseSlug) {
          const courseData = await request('/api/course/' + encodeURIComponent(state.courseSlug), { method: 'GET' });
          const coursePayload = courseData && courseData.data ? courseData.data : courseData;
          const modules = Array.isArray(coursePayload && coursePayload.modules) ? coursePayload.modules : [];
          state.courseLessons = [];
          modules.forEach(function (module) {
            (module.lessons || []).forEach(function (lesson) {
              state.courseLessons.push({
                id: lesson.id,
                title: lesson.title,
                moduleTitle: module.title,
                courseTitle: data.course.title,
                percent: Number(data.percent || 0),
                completed: !!lesson.completed,
                locked: !!module.locked,
                isDefault: Number(lesson.id) === Number(defaultLessonId)
              });
            });
          });
          renderLessonOptions();
          const savedLessonId = state.currentLesson && state.currentLesson.id ? Number(state.currentLesson.id) : 0;
          const canUseSavedLesson = savedLessonId && state.courseLessons.some(function (item) { return Number(item.id) === savedLessonId; });
          if (canUseSavedLesson) {
            await selectLessonById(savedLessonId, { keepSession: true });
          } else if (defaultLessonId) {
            await selectLessonById(defaultLessonId, { keepSession: true });
          } else if (state.courseLessons[0]) {
            await selectLessonById(state.courseLessons[0].id, { keepSession: true });
          }
        }
      }
    } catch (error) {
      console.error(error);
    }

    try {
      const usage = await request('/api/ai/usage/today', { method: 'GET' });
      if (usage && usage.used != null) setUsage(usage.used, usage.limit || DEFAULT_DAILY_LIMIT);
    } catch (error) {
      console.error(error);
    }
  }

  function bindEvents() {
    bindChipGroups();
    els.modeButtons.forEach(function (button) {
      button.addEventListener('click', function () { setMode(button.dataset.mode); });
    });
    els.openModeButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        setMode(button.dataset.openMode);
        document.querySelector('.ai-mode-stage').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    if (els.openHistoryBtn) els.openHistoryBtn.addEventListener('click', openHistory);
    if (els.openLastSessionBtn) els.openLastSessionBtn.addEventListener('click', openHistory);
    if (els.closeHistoryBtn) els.closeHistoryBtn.addEventListener('click', closeHistory);
    if (els.historyOverlay) els.historyOverlay.addEventListener('click', closeHistory);

    document.querySelectorAll('[data-check-sample]').forEach(function (button) {
      button.addEventListener('click', function () { els.checkInput.value = button.dataset.checkSample || ''; resetCheckResultView(); });
    });
    if (els.checkSentenceBtn) els.checkSentenceBtn.addEventListener('click', function () { handleCheck(''); });
    if (els.checkInput) els.checkInput.addEventListener('input', function () {
      if (!(els.checkResult && !els.checkResult.hidden)) return;
      resetCheckResultView();
    });
    document.querySelectorAll('[data-check-action]').forEach(function (button) {
      button.addEventListener('click', function () {
        const action = button.dataset.checkAction;
        const map = {
          simpler: 'Объясни проще и короче.',
          examples: 'Дай ещё 3 новых примера по этому же правилу.',
          harder: 'Сделай короткое упражнение по найденной ошибке.'
        };
        handleCheck(map[action] || '');
      });
    });
    if (els.copyCorrectedBtn) els.copyCorrectedBtn.addEventListener('click', function () {
      const text = els.checkCorrected.textContent || '';
      navigator.clipboard.writeText(text).then(function () {
        els.copyCorrectedBtn.textContent = 'Скопировано';
        setTimeout(function () { els.copyCorrectedBtn.textContent = 'Скопировать'; }, 1200);
      });
    });

    if (els.dialogScenarioGrid) {
      els.dialogScenarioGrid.addEventListener('click', function (event) {
        const card = event.target.closest('[data-scenario-id]');
        if (!card) return;
        openDialogScenario(card.dataset.scenarioId);
      });
    }
    if (els.dialogBackBtn) els.dialogBackBtn.addEventListener('click', closeDialogScenario);
    if (els.sendDialogBtn) els.sendDialogBtn.addEventListener('click', function () { sendDialogMessage('message'); });
    if (els.showHintBtn) els.showHintBtn.addEventListener('click', function () { sendDialogMessage('hint'); });
    if (els.dialogExplainBtn) els.dialogExplainBtn.addEventListener('click', function () { sendDialogMessage('explain'); });
    if (els.dialogRepeatBtn) els.dialogRepeatBtn.addEventListener('click', function () { sendDialogMessage('repeat'); });
    if (els.dialogInput) {
      els.dialogInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          sendDialogMessage('message');
        }
      });
    }

    document.querySelectorAll('[data-tutor-sample]').forEach(function (button) {
      button.addEventListener('click', function () {
        els.tutorInput.value = button.dataset.tutorSample || button.textContent.trim();
        askTutor(els.tutorInput.value, 'sample');
      });
    });
    document.querySelectorAll('[data-tutor-action]').forEach(function (button) {
      button.addEventListener('click', function () {
        const map = {
          simpler: 'Объясни проще',
          examples: 'Дай больше примеров',
          check: 'Проверь, понял ли я',
          exercise: 'Дай упражнение'
        };
        askTutor((els.tutorInput.value || state.currentLesson && state.currentLesson.title || 'Объясни тему'), button.dataset.tutorAction);
      });
    });
    if (els.sendTutorBtn) els.sendTutorBtn.addEventListener('click', function () { askTutor('', 'default'); });
    if (els.lessonSelect) {
      els.lessonSelect.addEventListener('change', function () {
        const value = Number(els.lessonSelect.value || 0);
        if (!value) return;
        selectLessonById(value);
      });
    }
    if (els.useCurrentLessonBtn) els.useCurrentLessonBtn.addEventListener('click', function () {
      const value = els.lessonSelect ? Number(els.lessonSelect.value || 0) : 0;
      if (value) {
        selectLessonById(value).then(function () {
          setMode('tutor');
          if (els.tutorInput) els.tutorInput.focus();
        });
        return;
      }
      setMode('tutor');
      if (els.tutorInput) els.tutorInput.focus();
    });

    document.querySelectorAll('[data-vocab-tab]').forEach(function (button) {
      button.addEventListener('click', function () {
        document.querySelectorAll('[data-vocab-tab]').forEach(function (tab) { tab.classList.remove('ai-tab--active'); });
        button.classList.add('ai-tab--active');
        state.vocabulary.tab = button.dataset.vocabTab;
        renderVocabulary();
      });
    });
    if (els.vocabularySearch) {
      els.vocabularySearch.addEventListener('input', function () {
        state.vocabulary.search = els.vocabularySearch.value.trim().toLowerCase();
        renderVocabulary();
      });
    }
    if (els.vocabularyCategories) {
      els.vocabularyCategories.addEventListener('click', function (event) {
        const button = event.target.closest('[data-vocab-category]');
        if (!button) return;
        state.vocabulary.category = button.dataset.vocabCategory || null;
        renderVocabulary();
      });
    }
    if (els.generateWordsBtn) els.generateWordsBtn.addEventListener('click', generateWords);
    if (els.vocabularyOptions) {
      els.vocabularyOptions.addEventListener('click', function (event) {
        const button = event.target.closest('[data-vocab-answer]');
        if (!button || !state.vocabulary.test) return;
        const answer = button.getAttribute('data-vocab-answer');
        const correct = state.vocabulary.test.options[0];
        els.vocabularyOptions.querySelectorAll('.ai-option').forEach(function (option) {
          option.classList.remove('ai-option--correct', 'ai-option--wrong');
          if (option.getAttribute('data-vocab-answer') === correct) option.classList.add('ai-option--correct');
          if (option === button && answer !== correct) option.classList.add('ai-option--wrong');
        });
      });
    }

    if (els.practiceMistakeBtn) els.practiceMistakeBtn.addEventListener('click', function () {
      setMode('check');
      els.checkInput.value = 'Сделай упражнение на тему: ' + state.focusTopic;
      els.checkInput.focus();
    });
  }

  function seedInitialData() {
    renderDialogScenarios();
    renderTutorTopics();
    renderTutorContent(
      'Барыс септік (-ге/-ға/-ке/-қа) используется для обозначения направления движения или цели действия. Он отвечает на вопрос «куда?» или «кому?»\n\nПримеры: мектепке барамын — иду в школу. Досқа хат жаздым — написал письмо другу. Тамақ ішуге бардым — пошёл поесть.',
      { title: 'Дополните предложения правильным падежом.', text: '1. Мен университет___ барамын. 2. Біз дос___ кітап бердік. 3. Ол үй___ қайтты.' }
    );
    if (!state.vocabulary.words.length) state.vocabulary.words = getAllWords();
    if (!state.vocabulary.test) state.vocabulary.test = { word: 'тағам', options: ['еда', 'машина', 'тетрадь'] };
    renderVocabulary();
    renderHistory();
    updateLastSessionCard();
    updateStatsView();
    setUsage(state.usage.used, state.usage.total);
  }

  setupDashHeader();
  loadState();
  seedInitialData();
  bindEvents();
  hydrateUserData();
})();
