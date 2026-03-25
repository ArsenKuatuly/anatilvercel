
(function () {
  const STORAGE_KEY = 'anatil_ai_practice_state_v2';
  const DEFAULT_DAILY_LIMIT = 50;

  const state = {
    mode: 'check',
    user: null,
    currentLesson: null,
    usage: { used: 0, total: DEFAULT_DAILY_LIMIT },
    sessionStats: { minutes: 0, errors: 0, words: 0 },
    achievements: { checks: 0, dialogs: 0, days: 1 },
    history: [],
    check: { lastInput: '', lastResult: null },
    dialog: { started: false, messages: [] },
    tutor: { messages: [] },
    vocabulary: { words: [], test: null },
    focusTopic: 'Прошедшее время',
    activeSessionId: null
  };

  const els = {
    modeButtons: document.querySelectorAll('[data-mode]'),
    settingsPanels: document.querySelectorAll('[data-settings]'),
    screens: document.querySelectorAll('[data-screen]'),
    openModeButtons: document.querySelectorAll('[data-open-mode]'),
    openHistoryBtn: document.getElementById('openHistoryBtn'),
    openLastSessionBtn: document.getElementById('openLastSessionBtn'),
    closeHistoryBtn: document.getElementById('closeHistoryBtn'),
    historyDrawer: document.getElementById('historyDrawer'),
    historyOverlay: document.getElementById('historyOverlay'),
    historyList: document.getElementById('historyList'),
    adminBtn: document.getElementById('adminBtn'),
    currentLessonTitle: document.getElementById('currentLessonTitle'),
    tutorContextTag: document.getElementById('tutorContextTag'),
    summaryTitle: document.getElementById('summaryTitle'),
    summaryText: document.getElementById('summaryText'),
    summaryProgressBar: document.getElementById('summaryProgressBar'),
    dailyUsage: document.getElementById('dailyUsage'),
    dailyUsageBar: document.getElementById('dailyUsageBar'),
    todayPracticeValue: document.getElementById('todayPracticeValue'),
    todayErrorsValue: document.getElementById('todayErrorsValue'),
    todayWordsValue: document.getElementById('todayWordsValue'),
    lastSessionTitle: document.getElementById('lastSessionTitle'),
    lastSessionMeta: document.getElementById('lastSessionMeta'),
    lastSessionMessages: document.getElementById('lastSessionMessages'),
    lastSessionWords: document.getElementById('lastSessionWords'),
    lastSessionErrors: document.getElementById('lastSessionErrors'),
    checkInput: document.getElementById('checkInput'),
    checkSentenceBtn: document.getElementById('checkSentenceBtn'),
    checkResult: document.getElementById('checkResult'),
    checkCorrected: document.getElementById('checkCorrected'),
    checkErrorsList: document.getElementById('checkErrorsList'),
    checkRule: document.getElementById('checkRule'),
    checkExamples: document.getElementById('checkExamples'),
    checkTask: document.getElementById('checkTask'),
    copyCorrectedBtn: document.getElementById('copyCorrectedBtn'),
    checkActionButtons: document.querySelectorAll('[data-check-action]'),
    startDialogBtn: document.getElementById('startDialogBtn'),
    showHintBtn: document.getElementById('showHintBtn'),
    dialogMessages: document.getElementById('dialogMessages'),
    dialogInput: document.getElementById('dialogInput'),
    sendDialogBtn: document.getElementById('sendDialogBtn'),
    tutorMessages: document.getElementById('tutorMessages'),
    tutorInput: document.getElementById('tutorInput'),
    sendTutorBtn: document.getElementById('sendTutorBtn'),
    useCurrentLessonBtn: document.getElementById('useCurrentLessonBtn'),
    generateWordsBtn: document.getElementById('generateWordsBtn'),
    vocabularyWords: document.getElementById('vocabularyWords'),
    vocabularyTest: document.getElementById('vocabularyTest'),
    vocabularyQuestion: document.getElementById('vocabularyQuestion'),
    vocabularyOptions: document.getElementById('vocabularyOptions'),
    achievementChecks: document.getElementById('achievementChecks'),
    achievementDialogs: document.getElementById('achievementDialogs'),
    achievementDays: document.getElementById('achievementDays'),
    mistakeTopicTitle: document.getElementById('mistakeTopicTitle'),
    mistakeTopicText: document.getElementById('mistakeTopicText'),
    practiceMistakeBtn: document.getElementById('practiceMistakeBtn')
  };

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
      const isOpen = !mobile.hasAttribute('hidden');
      if (isOpen) closeMenu();
      else openMenu();
    });
    mobile.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) closeMenu();
    });
    closeMenu();
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
        focusTopic: state.focusTopic
      }));
    } catch (error) {
      console.error(error);
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
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
        group.querySelectorAll('.ai-chip').forEach(function (chip) {
          chip.classList.remove('ai-chip--active');
        });
        button.classList.add('ai-chip--active');
      });
    });
  }

  function setMode(mode) {
    state.mode = mode;
    state.activeSessionId = null;
    els.modeButtons.forEach(function (button) {
      button.classList.toggle('ai-mode--active', button.dataset.mode === mode);
    });
    els.settingsPanels.forEach(function (panel) {
      panel.classList.toggle('ai-panel--active', panel.dataset.settings === mode);
    });
    els.screens.forEach(function (screen) {
      screen.classList.toggle('ai-screen--active', screen.dataset.screen === mode);
    });
  }

  function openHistory() {
    renderHistory();
    if (!els.historyDrawer) return;
    els.historyDrawer.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeHistory() {
    if (!els.historyDrawer) return;
    els.historyDrawer.hidden = true;
    document.body.style.overflow = '';
  }

  function setUsage(used, total) {
    state.usage.used = used;
    state.usage.total = total || DEFAULT_DAILY_LIMIT;
    const percent = Math.max(0, Math.min(100, Math.round((state.usage.used / Math.max(1, state.usage.total)) * 100)));
    if (els.dailyUsage) els.dailyUsage.textContent = state.usage.used + ' / ' + state.usage.total;
    if (els.dailyUsageBar) els.dailyUsageBar.style.width = percent + '%';
  }

  function increaseUsage(step) {
    setUsage(Math.min(state.usage.total, state.usage.used + (step || 1)), state.usage.total);
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
    if (els.lastSessionTitle) els.lastSessionTitle.textContent = session.title;
    if (els.lastSessionMeta) els.lastSessionMeta.textContent = session.meta;
    if (els.lastSessionMessages) els.lastSessionMessages.textContent = String(session.messages || 0);
    if (els.lastSessionWords) els.lastSessionWords.textContent = String(session.words || 0);
    if (els.lastSessionErrors) els.lastSessionErrors.textContent = String(session.errors || 0);
  }

  function pushHistory(entry) {
    state.history.unshift(entry);
    state.history = state.history.slice(0, 20);
    updateLastSessionCard();
    saveState();
  }

  function renderHistory() {
    if (!els.historyList) return;
    if (!state.history.length) {
      els.historyList.innerHTML = '<div class="ai-note">Пока нет сохранённых сессий.</div>';
      return;
    }
    els.historyList.innerHTML = state.history.map(function (item, index) {
      return [
        '<button class="ai-history-item" type="button" data-history-index="' + index + '">',
        '<span class="ai-history-item__mode">' + escapeHtml(item.modeLabel) + '</span>',
        '<strong class="ai-history-item__title">' + escapeHtml(item.title) + '</strong>',
        '<span class="ai-history-item__meta">' + escapeHtml(item.meta) + '</span>',
        '</button>'
      ].join('');
    }).join('');
  }

  function attachHistoryClicks() {
    if (!els.historyList) return;
    els.historyList.addEventListener('click', function (event) {
      const item = event.target.closest('[data-history-index]');
      if (!item) return;
      const session = state.history[Number(item.dataset.historyIndex)];
      if (!session) return;
      closeHistory();
      if (session.targetMode) setMode(session.targetMode);
      if (session.targetMode === 'check' && session.payload && session.payload.corrected) renderCheckResult(session.payload);
      if (session.targetMode === 'dialog' && session.payload && session.payload.messages) {
        state.dialog.messages = session.payload.messages;
        state.dialog.started = true;
        renderChat(els.dialogMessages, state.dialog.messages, 'AI');
      }
      if (session.targetMode === 'tutor' && session.payload && session.payload.messages) {
        state.tutor.messages = session.payload.messages;
        renderChat(els.tutorMessages, state.tutor.messages, 'AI-репетитор');
      }
      if (session.targetMode === 'vocabulary' && session.payload && session.payload.words) {
        state.vocabulary.words = session.payload.words;
        state.vocabulary.test = session.payload.test || null;
        renderVocabulary();
      }
    });
  }

  async function request(url, options) {
    if (typeof window.apiFetch === 'function') {
      const out = await window.apiFetch(url, options || {});
      return out ? out.data : null;
    }
    if (typeof window.authFetch === 'function') {
      const out = await window.authFetch(url, options || {});
      return out ? out.data : null;
    }
    const res = await fetch(url, Object.assign({ credentials: 'include' }, options || {}));
    return res.json();
  }

  async function ensureSession(mode, meta) {
    if (state.activeSessionId) return state.activeSessionId;
    try {
      const data = await request('/api/ai/session/start', {
        method: 'POST',
        body: JSON.stringify(Object.assign({ mode: mode }, meta || {}))
      });
      const id = data && data.success && data.session && data.session.id ? data.session.id : null;
      state.activeSessionId = id;
      return id;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async function refreshAiUsageBadge() {
    try {
      const data = await request('/api/ai/usage/today', { method: 'GET' });
      if (data && data.success) setUsage(Number(data.used || 0), Number(data.limit || DEFAULT_DAILY_LIMIT));
    } catch (error) {
      console.error(error);
    }
  }

  function parseResponsePayload(payload) {
    if (!payload) return null;
    if (typeof payload === 'string') return payload;
    if (typeof payload.reply === 'string') return payload.reply;
    if (typeof payload.message === 'string') return payload.message;
    if (typeof payload.text === 'string') return payload.text;
    if (typeof payload.response === 'string') return payload.response;
    if (typeof payload.result === 'string') return payload.result;
    if (payload.data) return parseResponsePayload(payload.data);
    if (Array.isArray(payload.choices) && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content) return payload.choices[0].message.content;
    return null;
  }

  async function aiChat(promptPayload) {
    const sessionId = await ensureSession(promptPayload.mode || state.mode, promptPayload.meta || {});
    const body = JSON.stringify(Object.assign({}, promptPayload, sessionId ? { sessionId: sessionId } : {}));
    const data = await request('/api/ai/chat', {
      method: 'POST',
      body: body
    });
    if (data && data.usage) setUsage(Number(data.usage.used || state.usage.used), Number(data.usage.limit || state.usage.total));
    return parseResponsePayload(data) || '';
  }

  function extractJson(text) {
    if (!text) return null;
    const cleaned = String(text).replace(/^```json\s*/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (error) {}
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch (error) {
      return null;
    }
  }

  function wordCount(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean).length;
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

  function renderCheckResult(result) {
    if (!els.checkResult) return;
    els.checkResult.hidden = false;
    if (els.checkCorrected) els.checkCorrected.textContent = result.corrected || '—';
    if (els.checkRule) els.checkRule.textContent = result.rule || '—';
    if (els.checkTask) els.checkTask.textContent = result.task || '—';
    if (els.checkErrorsList) {
      const errors = Array.isArray(result.errors) && result.errors.length ? result.errors : ['Ошибки не найдены.'];
      els.checkErrorsList.innerHTML = errors.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('');
    }
    if (els.checkExamples) {
      const examples = Array.isArray(result.examples) && result.examples.length ? result.examples : ['Дополнительные примеры не получены.'];
      els.checkExamples.innerHTML = examples.map(function (item) { return '<div class="ai-example">' + escapeHtml(item) + '</div>'; }).join('');
    }
  }

  function fallbackCheckResult(text) {
    return {
      corrected: text,
      errors: ['ИИ вернул общий ответ. Попробуй ещё раз или измени формулировку.'],
      rule: 'Структурированный ответ не получен, поэтому показываем общий результат.',
      examples: ['Мен кеше дүкенге бардым.', 'Мен бүгін сабақ оқып отырмын.', 'Мен ертең досыммен кездесемін.'],
      task: 'Сделай ещё одно предложение на ту же тему.'
    };
  }

  async function handleCheck(customInstruction) {
    const text = (els.checkInput && els.checkInput.value || '').trim();
    if (!text) {
      alert('Напиши предложение для проверки');
      return;
    }
    setButtonLoading(els.checkSentenceBtn, true, 'Проверяем...');
    try {
      const level = getActiveChipValue('checkLevel') || 'A1';
      const explainMode = getActiveChipValue('checkExplain') || 'simple';
      const modifier = customInstruction ? ' Дополнительная команда: ' + customInstruction + '.' : '';
      const context = state.currentLesson ? 'Текущий урок: ' + state.currentLesson.title + '.' : '';
      const prompt = [
        'Ты — преподаватель казахского языка для русскоязычного ученика.',
        context,
        'Проверь предложение и ответь только JSON-объектом со следующими ключами:',
        'corrected (string), errors (array of strings), rule (string), examples (array of 3 strings), task (string).',
        'Уровень ученика: ' + level + '.',
        'Стиль объяснения: ' + explainMode + '.',
        'Предложение: ' + text + '.',
        modifier
      ].join(' ');
      const raw = await aiChat({ mode: 'sentence_check', message: text, prompt: prompt, meta: { level: level, explainMode: explainMode } });
      const parsed = extractJson(raw);
      const result = parsed || fallbackCheckResult(raw || text);
      state.check.lastInput = text;
      state.check.lastResult = result;
      renderCheckResult(result);
      state.sessionStats.errors += Array.isArray(result.errors) ? result.errors.length : 0;
      state.sessionStats.minutes += 2;
      state.achievements.checks += 1;
      if (Array.isArray(result.errors) && result.errors[0]) state.focusTopic = result.errors[0].split(':')[0].slice(0, 60) || state.focusTopic;
      increaseUsage(1);
      updateStatsView();
      pushHistory({
        modeLabel: 'Проверка предложения',
        title: 'Проверка: ' + text.slice(0, 32),
        meta: formatMeta('Сейчас', 1, 0, Array.isArray(result.errors) ? result.errors.length : 0),
        messages: 1,
        words: wordCount(text),
        errors: Array.isArray(result.errors) ? result.errors.length : 0,
        targetMode: 'check',
        payload: result
      });
    } catch (error) {
      console.error(error);
      renderCheckResult(fallbackCheckResult('Не удалось получить ответ от ИИ. Попробуй ещё раз.'));
    } finally {
      setButtonLoading(els.checkSentenceBtn, false);
      saveState();
    }
  }

  function appendMessage(list, role, text, meta) {
    const message = { role: role, text: text, meta: meta || '' };
    list.push(message);
    return message;
  }

  function renderChat(container, messages, aiAuthor) {
    if (!container) return;
    container.innerHTML = messages.map(function (message) {
      const isUser = message.role === 'user';
      return [
        '<div class="ai-bubble ' + (isUser ? 'ai-bubble--user' : 'ai-bubble--ai') + '">',
        '<span class="ai-bubble__author">' + (isUser ? 'Вы' : aiAuthor) + '</span>',
        '<p class="ai-bubble__text">' + escapeHtml(message.text) + '</p>',
        message.meta ? '<span class="ai-bubble__meta">' + escapeHtml(message.meta) + '</span>' : '',
        '</div>'
      ].join('');
    }).join('');
    container.scrollTop = container.scrollHeight;
  }

  function buildDialogIntro() {
    return {
      scenario: getActiveChipValue('dialogScenario') || 'Кафе',
      level: getActiveChipValue('dialogLevel') || 'A1',
      tone: getActiveChipValue('dialogTone') || 'дружелюбно'
    };
  }

  async function startDialog() {
    setMode('dialog');
    const setup = buildDialogIntro();
    setButtonLoading(els.startDialogBtn, true, 'Запускаем...');
    try {
      const prompt = [
        'Ты — ИИ для языковой практики казахского языка.',
        'Начни короткий диалог на тему "' + setup.scenario + '".',
        'Уровень ученика: ' + setup.level + '.',
        'Тональность: ' + setup.tone + '.',
        'Ответь 1 сообщением на казахском и в конце дай короткую русскую подсказку в формате: Ошибки: 0 • Правильно: ...'
      ].join(' ');
      const raw = await aiChat({ mode: 'dialog_start', prompt: prompt, meta: setup, message: 'Начать диалог' });
      const first = raw || 'Сәлеметсіз бе! Бүгін не қалайсыз?';
      state.dialog.started = true;
      state.dialog.messages = [];
      appendMessage(state.dialog.messages, 'assistant', first, 'Сценарий: ' + setup.scenario + ' • Уровень: ' + setup.level);
      renderChat(els.dialogMessages, state.dialog.messages, 'AI');
      increaseUsage(1);
    } catch (error) {
      console.error(error);
      state.dialog.started = true;
      state.dialog.messages = [];
      appendMessage(state.dialog.messages, 'assistant', 'Сәлеметсіз бе! Бүгін не ішесіз?', 'Сценарий: ' + setup.scenario + ' • Уровень: ' + setup.level);
      renderChat(els.dialogMessages, state.dialog.messages, 'AI');
    } finally {
      setButtonLoading(els.startDialogBtn, false);
      saveState();
    }
  }

  async function sendDialogMessage(withHint) {
    if (!state.dialog.started) await startDialog();
    const text = withHint ? 'Подскажи, что можно ответить в этой ситуации.' : (els.dialogInput && els.dialogInput.value || '').trim();
    if (!text) return;
    if (!withHint) {
      appendMessage(state.dialog.messages, 'user', text);
      renderChat(els.dialogMessages, state.dialog.messages, 'AI');
      els.dialogInput.value = '';
    }
    setButtonLoading(els.sendDialogBtn, true, 'Отправляем...');
    if (els.showHintBtn) els.showHintBtn.disabled = true;
    try {
      const setup = buildDialogIntro();
      const prompt = [
        'Ты продолжаешь диалог по-казахски.',
        'Сценарий: ' + setup.scenario + '.',
        'Уровень: ' + setup.level + '.',
        'Тональность: ' + setup.tone + '.',
        'Если пользователь просит подсказку, дай короткий пример ответа и одно объяснение по-русски.',
        'Если пользователь отвечает сам, продолжи разговор и в конце допиши: Ошибки: ... / Правильно: ...'
      ].join(' ');
      const raw = await aiChat({ mode: 'dialog', prompt: prompt, message: text, history: state.dialog.messages.slice(-6), meta: setup });
      const reply = raw || 'Жақсы, тапсырысыңыз дайын болады.';
      appendMessage(state.dialog.messages, 'assistant', reply);
      renderChat(els.dialogMessages, state.dialog.messages, 'AI');
      state.sessionStats.minutes += 2;
      if (!withHint) state.achievements.dialogs += 1;
      increaseUsage(1);
      updateStatsView();
      pushHistory({
        modeLabel: 'Диалог',
        title: 'Диалог: ' + setup.scenario,
        meta: formatMeta('Сейчас', state.dialog.messages.length, 0, 0),
        messages: state.dialog.messages.length,
        words: wordCount(text),
        errors: 0,
        targetMode: 'dialog',
        payload: { messages: state.dialog.messages.slice(-8) }
      });
    } catch (error) {
      console.error(error);
      appendMessage(state.dialog.messages, 'assistant', 'Кешіріңіз, жауап уақытша недоступен. Попробуй ещё раз.');
      renderChat(els.dialogMessages, state.dialog.messages, 'AI');
    } finally {
      setButtonLoading(els.sendDialogBtn, false);
      if (els.showHintBtn) els.showHintBtn.disabled = false;
      saveState();
    }
  }

  async function sendTutorMessage() {
    const text = (els.tutorInput && els.tutorInput.value || '').trim();
    if (!text) return;
    appendMessage(state.tutor.messages, 'user', text);
    renderChat(els.tutorMessages, state.tutor.messages, 'AI-репетитор');
    els.tutorInput.value = '';
    setButtonLoading(els.sendTutorBtn, true, 'Отвечаем...');
    try {
      const context = state.currentLesson ? state.currentLesson.title : 'Текущий урок';
      const prompt = [
        'Ты — строгий, но дружелюбный преподаватель казахского языка.',
        'Контекст урока: ' + context + '.',
        'Отвечай кратко, структурированно и по делу. Не уходи в общую болтовню.',
        'Если уместно, дай 1 короткий пример на казахском и 1 короткое правило по-русски.'
      ].join(' ');
      const raw = await aiChat({ mode: 'lesson_tutor', prompt: prompt, message: text, context: { lesson: context }, history: state.tutor.messages.slice(-6) });
      const reply = raw || 'Келер шақ показывает действие в будущем. Сначала смотри на основу глагола, затем на личное окончание.';
      appendMessage(state.tutor.messages, 'assistant', reply);
      renderChat(els.tutorMessages, state.tutor.messages, 'AI-репетитор');
      state.sessionStats.minutes += 2;
      increaseUsage(1);
      updateStatsView();
      pushHistory({
        modeLabel: 'Репетитор',
        title: 'Репетитор: ' + context,
        meta: formatMeta('Сейчас', state.tutor.messages.length, 0, 0),
        messages: state.tutor.messages.length,
        words: wordCount(text),
        errors: 0,
        targetMode: 'tutor',
        payload: { messages: state.tutor.messages.slice(-8) }
      });
    } catch (error) {
      console.error(error);
      appendMessage(state.tutor.messages, 'assistant', 'Не удалось получить объяснение. Попробуй переформулировать вопрос.');
      renderChat(els.tutorMessages, state.tutor.messages, 'AI-репетитор');
    } finally {
      setButtonLoading(els.sendTutorBtn, false);
      saveState();
    }
  }

  function fallbackWords(theme, count) {
    const base = {
      'Еда': [['тағам', 'еда', 'Маған ыстық тағам керек.'], ['тапсырыс', 'заказ', 'Мен тапсырыс бердім.'], ['баға', 'цена', 'Бұл тағамның бағасы қымбат емес.'], ['асхана', 'столовая', 'Біз асханаға барамыз.']],
      'Работа': [['жұмыс', 'работа', 'Мен жаңа жұмыс іздеп жүрмін.'], ['кеңсе', 'офис', 'Ол кеңседе істейді.'], ['кездесу', 'встреча', 'Бүгін маңызды кездесу бар.'], ['жоба', 'проект', 'Бұл жоба ертең бітеді.']],
      'Учёба': [['сабақ', 'урок', 'Бүгін қазақ тілі сабағы бар.'], ['мұғалім', 'учитель', 'Мұғалім ережені түсіндірді.'], ['дәптер', 'тетрадь', 'Мен дәптерге жаздым.'], ['емтихан', 'экзамен', 'Ертең емтихан тапсырамыз.']],
      'Путешествия': [['сапар', 'поездка', 'Біз ұзақ сапарға шықтық.'], ['әуежай', 'аэропорт', 'Әуежайға ерте келдік.'], ['билет', 'билет', 'Мен билет сатып алдым.'], ['қонақүй', 'отель', 'Қонақүй қала орталығында.']]
    };
    const source = base[theme] || base['Еда'];
    const words = [];
    for (let i = 0; i < count; i += 1) {
      const item = source[i % source.length];
      words.push({ word: item[0], translation: item[1], example: item[2], topic: theme });
    }
    return words;
  }

  function renderVocabulary() {
    if (els.vocabularyWords) {
      els.vocabularyWords.innerHTML = state.vocabulary.words.map(function (item) {
        return [
          '<article class="ai-word">',
          '<div class="ai-word__top">',
          '<strong class="ai-word__main">' + escapeHtml(item.word) + '</strong>',
          '<span class="ai-tag">' + escapeHtml(item.topic || '') + '</span>',
          '</div>',
          '<p class="ai-word__translate">' + escapeHtml(item.translation) + '</p>',
          '<p class="ai-word__example">' + escapeHtml(item.example) + '</p>',
          '</article>'
        ].join('');
      }).join('');
    }
    if (els.vocabularyTest && els.vocabularyQuestion && els.vocabularyOptions) {
      const test = state.vocabulary.test;
      if (!test) {
        els.vocabularyTest.hidden = true;
        return;
      }
      els.vocabularyTest.hidden = false;
      els.vocabularyQuestion.innerHTML = 'Как переводится слово <strong>' + escapeHtml(test.word) + '</strong>?';
      els.vocabularyOptions.innerHTML = test.options.map(function (item) {
        return '<button class="ai-option" type="button" data-test-answer="' + escapeHtml(item) + '">' + escapeHtml(item) + '</button>';
      }).join('');
    }
  }

  async function generateWords() {
    const theme = getActiveChipValue('vocabularyTheme') || 'Еда';
    const count = Number(getActiveChipValue('vocabularyCount') || 10);
    setButtonLoading(els.generateWordsBtn, true, 'Генерируем...');
    try {
      const prompt = [
        'Ты создаёшь словарь для изучения казахского языка.',
        'Тема: ' + theme + '.',
        'Количество слов: ' + count + '.',
        'Ответь JSON-объектом с ключами words и test.',
        'words — массив объектов {word, translation, example, topic}.',
        'test — объект {word, options}. options — 3 варианта, один правильный.'
      ].join(' ');
      const raw = await aiChat({ mode: 'vocabulary', prompt: prompt, message: theme, meta: { count: count } });
      const parsed = extractJson(raw);
      if (parsed && parsed.words && parsed.words.length) {
        state.vocabulary.words = parsed.words;
        state.vocabulary.test = parsed.test || null;
      } else {
        state.vocabulary.words = fallbackWords(theme, count);
        state.vocabulary.test = { word: state.vocabulary.words[0].word, options: [state.vocabulary.words[0].translation, 'машина', 'кітап'] };
      }
      renderVocabulary();
      state.sessionStats.words += Math.min(count, state.vocabulary.words.length);
      state.sessionStats.minutes += 2;
      increaseUsage(1);
      updateStatsView();
      pushHistory({
        modeLabel: 'Словарь',
        title: 'Слова: ' + theme,
        meta: formatMeta('Сейчас', 1, state.vocabulary.words.length, 0),
        messages: 1,
        words: state.vocabulary.words.length,
        errors: 0,
        targetMode: 'vocabulary',
        payload: { words: state.vocabulary.words, test: state.vocabulary.test }
      });
    } catch (error) {
      console.error(error);
      state.vocabulary.words = fallbackWords(theme, count);
      state.vocabulary.test = { word: state.vocabulary.words[0].word, options: [state.vocabulary.words[0].translation, 'машина', 'кітап'] };
      renderVocabulary();
    } finally {
      setButtonLoading(els.generateWordsBtn, false);
      saveState();
    }
  }

  function formatMeta(prefix, messages, words, errors) {
    return prefix + ' • ' + messages + ' сообщ. • ' + words + ' слов • ' + errors + ' ошибок';
  }

  async function hydrateUserData() {
    try {
      const me = await request('/api/auth/me', { method: 'GET' });
      const user = me && (me.user || me.data && me.data.user || me.success && me.user) ? (me.user || me.data && me.data.user || me.user) : null;
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
      if ((data && data.success && data.course) || (data && data.course)) {
        const percent = Number(data.percent || 0);
        state.currentLesson = {
          title: data.nextLesson && data.nextLesson.title || data.lastLesson && data.lastLesson.title || data.course.title,
          courseTitle: data.course.title,
          percent: percent
        };
        if (els.currentLessonTitle) els.currentLessonTitle.textContent = state.currentLesson.title;
        if (els.tutorContextTag) els.tutorContextTag.textContent = 'Контекст: ' + state.currentLesson.title;
        if (els.summaryTitle) els.summaryTitle.textContent = 'Практика по курсу — ' + data.course.title;
        if (els.summaryText) els.summaryText.textContent = data.nextLesson ? 'Следующий урок: ' + data.nextLesson.title + '. Повтори тему с репетитором или начни диалог по теме курса.' : 'Ты завершил почти весь курс. Закрепи тему с ИИ перед итоговым заданием.';
        if (els.summaryProgressBar) els.summaryProgressBar.style.width = Math.max(0, Math.min(100, percent)) + '%';
      }
    } catch (error) {
      console.error(error);
    }
    await refreshAiUsageBadge();
  }

  function seedInitialContent() {
    if (!state.history.length) {
      state.dialog.messages = [
        { role: 'assistant', text: 'Сәлеметсіз бе! Кафеге қош келдіңіз. Не ішесіз?', meta: 'Ошибки: 0 • Правильно: приветствие и вежливое обращение' },
        { role: 'user', text: 'Маған бір кофе беріңізші.' }
      ];
      renderChat(els.dialogMessages, state.dialog.messages, 'AI');
      state.tutor.messages = [
        { role: 'assistant', text: 'Келер шақ показывает действие, которое произойдёт в будущем. Хочешь, объясню простую схему или сразу разберём пример?' }
      ];
      renderChat(els.tutorMessages, state.tutor.messages, 'AI-репетитор');
      state.vocabulary.words = fallbackWords('Еда', 3);
      state.vocabulary.test = { word: 'тағам', options: ['еда', 'школа', 'поезд'] };
      renderVocabulary();
    } else {
      updateLastSessionCard();
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
        const workspace = document.querySelector('.ai-workspace');
        if (workspace) workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    if (els.openHistoryBtn) els.openHistoryBtn.addEventListener('click', openHistory);
    if (els.openLastSessionBtn) els.openLastSessionBtn.addEventListener('click', openHistory);
    if (els.closeHistoryBtn) els.closeHistoryBtn.addEventListener('click', closeHistory);
    if (els.historyOverlay) els.historyOverlay.addEventListener('click', closeHistory);
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeHistory(); });
    if (els.checkSentenceBtn) els.checkSentenceBtn.addEventListener('click', function () { handleCheck(''); });
    if (els.copyCorrectedBtn) {
      els.copyCorrectedBtn.addEventListener('click', async function () {
        const text = els.checkCorrected && els.checkCorrected.textContent || '';
        if (!text || text === '—') return;
        try {
          await navigator.clipboard.writeText(text);
          els.copyCorrectedBtn.textContent = 'Скопировано';
          setTimeout(function () { els.copyCorrectedBtn.textContent = 'Скопировать'; }, 1200);
        } catch (error) {
          console.error(error);
        }
      });
    }
    els.checkActionButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        const action = button.dataset.checkAction;
        const labelMap = {
          harder: 'Сделай ответ чуть сложнее и дай новые примеры',
          simpler: 'Сделай ответ проще и короче',
          examples: 'Дай ещё 3 новых примера по этому же правилу'
        };
        handleCheck(labelMap[action] || '');
      });
    });
    if (els.startDialogBtn) els.startDialogBtn.addEventListener('click', startDialog);
    if (els.sendDialogBtn) els.sendDialogBtn.addEventListener('click', function () { sendDialogMessage(false); });
    if (els.showHintBtn) els.showHintBtn.addEventListener('click', function () { sendDialogMessage(true); });
    if (els.dialogInput) {
      els.dialogInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          sendDialogMessage(false);
        }
      });
    }
    if (els.sendTutorBtn) els.sendTutorBtn.addEventListener('click', sendTutorMessage);
    if (els.tutorInput) {
      els.tutorInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          sendTutorMessage();
        }
      });
    }
    if (els.useCurrentLessonBtn) {
      els.useCurrentLessonBtn.addEventListener('click', function () {
        setMode('tutor');
        const workspace = document.querySelector('.ai-workspace');
        if (workspace) workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    if (els.generateWordsBtn) els.generateWordsBtn.addEventListener('click', generateWords);
    if (els.vocabularyOptions) {
      els.vocabularyOptions.addEventListener('click', function (event) {
        const button = event.target.closest('[data-test-answer]');
        if (!button || !state.vocabulary.test) return;
        const answer = button.getAttribute('data-test-answer');
        const correct = state.vocabulary.test.options[0];
        alert(answer === correct ? 'Верно ✅' : 'Неверно. Правильный ответ: ' + correct);
      });
    }
    if (els.practiceMistakeBtn) {
      els.practiceMistakeBtn.addEventListener('click', function () {
        setMode('check');
        if (els.checkInput) {
          els.checkInput.value = 'Сделай упражнение на тему: ' + state.focusTopic;
          els.checkInput.focus();
        }
      });
    }
    attachHistoryClicks();
  }

  setupDashHeader();
  loadState();
  setUsage(state.usage.used, state.usage.total);
  updateStatsView();
  updateLastSessionCard();
  seedInitialContent();
  bindEvents();
  hydrateUserData();
})();
