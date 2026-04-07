(function () {
  const STORAGE_KEY = 'anatil_voice_history_v1';
  const scenarioData = [
    {
      id: 'intro', icon: '👋', title: 'Знакомство', description: 'Знакомься, рассказывай о себе', topic: 'Поздороваться, представиться, рассказать о себе и задать собеседнику 1–2 вопроса.', phrases: ['Сәлеметсіз бе', 'Менің атым Арсен', 'Мен Қарағандыданмын', 'Сіз қайдан келдіңіз?'], tips: ['Говори коротко и спокойно', 'Сначала представься', 'Добавь встречный вопрос'], next: 'Попробуй тот же сценарий на уровне выше и отвечай полными предложениями.'
    },
    {
      id: 'cafe', icon: '☕', title: 'Кафе', description: 'Заказывай еду и напитки', topic: 'Сделать заказ, уточнить напиток, спросить цену и попросить счёт.', phrases: ['Маған бір кофе беріңізші', 'Тағы не бар?', 'Бағасы қанша?', 'Шот әкеліңізші'], tips: ['Начни с вежливой формы', 'Уточняй заказ короткими фразами', 'Не бойся попросить повторить'], next: 'Повтори сценарий и попробуй заказать 2–3 позиции без подсказок.'
    },
    {
      id: 'shop', icon: '🛍️', title: 'Магазин', description: 'Покупай продукты и товары', topic: 'Спросить товар, количество, цену и наличие нужного размера или вкуса.', phrases: ['Маған нан керек', 'Бұл бар ма?', 'Тағы қандай түрі бар?', 'Мынау қанша тұрады?'], tips: ['Используй простые существительные', 'Сначала скажи, что тебе нужно', 'Добавь вопрос про цену'], next: 'Попрактикуйся в магазине на уровне A2 и добавь больше уточнений.'
    },
    {
      id: 'taxi', icon: '🚕', title: 'Такси', description: 'Поездка и общение с водителем', topic: 'Назвать адрес, уточнить маршрут, время и попросить остановить.', phrases: ['Мына мекенжайға апарыңызшы', 'Қанша уақытта барамыз?', 'Осы жерге тоқтаңызшы', 'Кептеліс бар ма?'], tips: ['Говори чётко адрес', 'Используй вежливую форму', 'Задай вопрос про время'], next: 'Сделай ещё один диалог и попробуй сам вести разговор без перехода на русский.'
    },
    {
      id: 'university', icon: '🎓', title: 'Университет', description: 'Учебные ситуации и разговоры', topic: 'Спросить про аудиторию, расписание, преподавателя или задание.', phrases: ['Сабақ қай аудиторияда?', 'Бүгін қандай тапсырма бар?', 'Мұғалім келді ме?', 'Маған түсіндіріп бересіз бе?'], tips: ['Используй слова про учёбу', 'Не бойся просить объяснить', 'Сохраняй вежливый тон'], next: 'Закрепи лексику по учёбе и попробуй разговор по уроку.'
    },
    {
      id: 'work', icon: '💼', title: 'Работа', description: 'Рабочая и деловая беседа', topic: 'Короткий рабочий разговор: задачи, сроки, статус и уточнения.', phrases: ['Мен бұл тапсырманы бүгін аяқтаймын', 'Қай уақытта бастаймыз?', 'Маған қосымша ақпарат керек', 'Бұл дұрыс па?'], tips: ['Отвечай чуть формальнее', 'Старайся говорить полными фразами', 'Уточняй срок или действие'], next: 'Попробуй B1 и отвечай более естественно, с уточняющими вопросами.'
    }
  ];
  const levelHints = {
    A1: 'A1 — простые фразы и медленный темп',
    A2: 'A2 — бытовой диалог и чуть длиннее ответы',
    B1: 'B1 — более естественная речь и уточняющие вопросы'
  };
  const state = {
    screen: 'setup',
    selectedScenario: scenarioData[0],
    selectedLevel: 'A1',
    lessonMode: false,
    lessonTitle: '',
    lessonCourseTitle: '',
    lessonModeLabel: '',
    options: { showTranslation: true, gentleCorrection: true, hints: true, slowSpeech: false },
    history: [],
    usage: { used: 0, limit: 50 },
    transcript: [],
    sessionStartedAt: 0,
    sessionStatus: 'Подключение',
    audio: null,
    pc: null,
    dc: null,
    stream: null,
    liveAssistantBuffer: '',
    sessionId: null,
    lastSaved: null,
    assistantMessageMap: new Map(),
    userMessageMap: new Map(),
    muted: false,
  };
  const els = {
    screens: {
      setup: document.getElementById('setupScreen'),
      permission: document.getElementById('permissionScreen'),
      conversation: document.getElementById('conversationScreen'),
      summary: document.getElementById('summaryScreen')
    },
    scenarioGrid: document.getElementById('scenarioGrid'),
    levelGroup: document.getElementById('levelGroup'),
    levelHint: document.getElementById('levelHint'),
    optTranslation: document.getElementById('optTranslation'),
    optCorrection: document.getElementById('optCorrection'),
    optHints: document.getElementById('optHints'),
    optSlow: document.getElementById('optSlow'),
    lessonModeBtn: document.getElementById('lessonModeBtn'),
    lessonModeText: document.getElementById('lessonModeText'),
    startTopBtn: document.getElementById('startTopBtn'),
    startSessionBtn: document.getElementById('startSessionBtn'),
    backToSetupBtn: document.getElementById('backToSetupBtn'),
    allowMicBtn: document.getElementById('allowMicBtn'),
    permissionError: document.getElementById('permissionError'),
    sessionStatus: document.getElementById('sessionStatus'),
    waveBars: document.getElementById('waveBars'),
    transcriptList: document.getElementById('transcriptList'),
    liveIndicator: document.getElementById('liveIndicator'),
    activeScenarioLabel: document.getElementById('activeScenarioLabel'),
    activeLevelLabel: document.getElementById('activeLevelLabel'),
    sessionModeLabel: document.getElementById('sessionModeLabel'),
    topicDescription: document.getElementById('topicDescription'),
    phraseList: document.getElementById('phraseList'),
    tipList: document.getElementById('tipList'),
    hintStrip: document.getElementById('hintStrip'),
    errorFeed: document.getElementById('errorFeed'),
    textFallbackInput: document.getElementById('textFallbackInput'),
    sendTextBtn: document.getElementById('sendTextBtn'),
    exampleAnswerBtn: document.getElementById('exampleAnswerBtn'),
    explainRuBtn: document.getElementById('explainRuBtn'),
    simplifyBtn: document.getElementById('simplifyBtn'),
    reconnectBtn: document.getElementById('reconnectBtn'),
    muteBtn: document.getElementById('muteBtn'),
    endBtn: document.getElementById('endBtn'),
    openHistoryBtn: document.getElementById('openHistoryBtn'),
    historyModal: document.getElementById('historyModal'),
    historyList: document.getElementById('historyList'),
    voiceUsageValue: document.getElementById('voiceUsageValue'),
    summaryScenario: document.getElementById('summaryScenario'),
    summaryDuration: document.getElementById('summaryDuration'),
    summaryCount: document.getElementById('summaryCount'),
    summaryStrengths: document.getElementById('summaryStrengths'),
    summaryImprovements: document.getElementById('summaryImprovements'),
    summaryPhrases: document.getElementById('summaryPhrases'),
    summaryNext: document.getElementById('summaryNext'),
    repeatBtn: document.getElementById('repeatBtn'),
    newScenarioBtn: document.getElementById('newScenarioBtn'),
    saveResultBtn: document.getElementById('saveResultBtn')
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
    if (typeof window.authFetch === 'function') return window.authFetch(url, options || {});
    return fetch(url, options || {}).then(async function (res) {
      const data = await res.json().catch(function () { return null; });
      return { res: res, data: data };
    });
  }

  function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name) || '';
  }

  function parseLessonMode() {
    state.lessonTitle = getQueryParam('lessonTitle');
    state.lessonCourseTitle = getQueryParam('courseTitle');
    state.lessonModeLabel = getQueryParam('topic') || state.lessonTitle || '';
    if (state.lessonModeLabel) {
      state.lessonMode = true;
      els.lessonModeText.textContent = 'Текущая тема: ' + state.lessonModeLabel + '. Диалог будет привязан к уроку и его грамматике.';
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.history)) state.history = parsed.history;
    } catch (error) {
      console.error(error);
    }
  }

  function saveHistory() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ history: state.history.slice(0, 20) }));
  }

  function setScreen(name) {
    state.screen = name;
    Object.keys(els.screens).forEach(function (key) {
      els.screens[key].classList.toggle('voice-screen--active', key === name);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setUsage(used, limit) {
    state.usage.used = Number(used || 0);
    state.usage.limit = Number(limit || 50);
    els.voiceUsageValue.textContent = state.usage.used + ' / ' + state.usage.limit;
  }

  async function loadUsage() {
    try {
      const result = await request('/api/ai/usage/today', { method: 'GET' });
      if (result && result.data && result.data.usage) {
        setUsage(result.data.usage.used, result.data.usage.limit);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function renderScenarios() {
    els.scenarioGrid.innerHTML = scenarioData.map(function (item) {
      return '<button class="voice-scenario' + (state.selectedScenario.id === item.id ? ' voice-scenario--active' : '') + '" type="button" data-scenario="' + item.id + '">' +
        '<span class="voice-scenario__icon">' + item.icon + '</span>' +
        '<span class="voice-scenario__title">' + escapeHtml(item.title) + '</span>' +
        '<span class="voice-scenario__text">' + escapeHtml(item.description) + '</span>' +
      '</button>';
    }).join('');
  }

  function renderConversationInfo() {
    const scenario = state.selectedScenario;
    els.activeScenarioLabel.textContent = scenario.title;
    els.activeLevelLabel.textContent = state.selectedLevel;
    els.sessionModeLabel.textContent = state.lessonMode ? 'Разговор по уроку' : 'Обычный сценарий';
    els.topicDescription.textContent = state.lessonMode && state.lessonModeLabel
      ? 'Разговор связан с темой: ' + state.lessonModeLabel + '. Сценарий: ' + scenario.topic
      : scenario.topic;
    els.phraseList.innerHTML = scenario.phrases.map(function (item) {
      return '<div class="voice-phrase-item">' + escapeHtml(item) + '</div>';
    }).join('');
    els.tipList.innerHTML = scenario.tips.map(function (item) {
      return '<div class="voice-tip-item">' + escapeHtml(item) + '</div>';
    }).join('');
    renderHintStrip();
  }

  function renderHintStrip() {
    const items = state.selectedScenario.tips.slice(0, 3);
    els.hintStrip.innerHTML = items.map(function (item) {
      return '<span class="voice-hint-pill">' + escapeHtml(item) + '</span>';
    }).join('');
  }

  function renderHistory() {
    if (!state.history.length) {
      els.historyList.innerHTML = '<div class="voice-history-item"><div class="voice-history-item__title">История пока пустая</div><div class="voice-history-item__meta">После первых разговоров здесь появятся сохранённые сессии.</div></div>';
      return;
    }
    els.historyList.innerHTML = state.history.map(function (item) {
      return '<div class="voice-history-item">' +
        '<div class="voice-history-item__top"><div class="voice-history-item__title">' + escapeHtml(item.scenario + ' · ' + item.level) + '</div><div class="voice-history-item__date">' + escapeHtml(item.date) + '</div></div>' +
        '<div class="voice-history-item__meta">' + escapeHtml(item.duration + ' · ' + item.count + ' фраз · ' + item.modeLabel) + '</div>' +
      '</div>';
    }).join('');
  }

  function openHistory() {
    renderHistory();
    els.historyModal.hidden = false;
  }

  function closeHistory() {
    els.historyModal.hidden = true;
  }

  function bindHeaderMenu() {
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

  function bindSetupEvents() {
    els.scenarioGrid.addEventListener('click', function (event) {
      const button = event.target.closest('[data-scenario]');
      if (!button) return;
      const scenario = scenarioData.find(function (item) { return item.id === button.dataset.scenario; });
      if (!scenario) return;
      state.selectedScenario = scenario;
      renderScenarios();
      renderConversationInfo();
    });

    els.levelGroup.addEventListener('click', function (event) {
      const button = event.target.closest('[data-level]');
      if (!button) return;
      state.selectedLevel = button.dataset.level;
      Array.from(els.levelGroup.querySelectorAll('[data-level]')).forEach(function (node) {
        node.classList.toggle('voice-level--active', node.dataset.level === state.selectedLevel);
      });
      els.levelHint.textContent = levelHints[state.selectedLevel] || '';
    });

    els.lessonModeBtn.addEventListener('click', function () {
      state.lessonMode = !state.lessonMode;
      els.lessonModeBtn.classList.toggle('voice-scenario--active', state.lessonMode);
    });

    [els.startTopBtn, els.startSessionBtn].forEach(function (button) {
      button.addEventListener('click', function () {
        state.options.showTranslation = els.optTranslation.checked;
        state.options.gentleCorrection = els.optCorrection.checked;
        state.options.hints = els.optHints.checked;
        state.options.slowSpeech = els.optSlow.checked;
        setScreen('permission');
      });
    });

    els.backToSetupBtn.addEventListener('click', function () {
      setScreen('setup');
    });
  }

  function setSessionStatus(mode, text) {
    state.sessionStatus = text;
    els.sessionStatus.textContent = text;
    els.sessionStatus.className = 'voice-status ' + (mode ? 'voice-status--' + mode : 'voice-status--idle');
    els.liveIndicator.textContent = text;
    els.waveBars.classList.toggle('voice-wave--active', mode === 'listening' || mode === 'thinking');
  }

  function appendErrorTip(text) {
    if (!text) return;
    const div = document.createElement('div');
    div.className = 'voice-error-item';
    div.textContent = text;
    els.errorFeed.prepend(div);
    while (els.errorFeed.children.length > 4) {
      els.errorFeed.removeChild(els.errorFeed.lastChild);
    }
  }

  function buildMessageDetails(entry) {
    const blocks = [];
    if (entry.translation) blocks.push('<strong>Перевод:</strong> ' + escapeHtml(entry.translation));
    if (entry.correction) blocks.push('<strong>Исправление:</strong> ' + escapeHtml(entry.correction));
    if (entry.explanation) blocks.push('<strong>Почему так:</strong> ' + escapeHtml(entry.explanation));
    return blocks.join('<br><br>');
  }

  function renderTranscript() {
    els.transcriptList.innerHTML = '';
    state.transcript.forEach(function (entry, index) {
      const article = document.createElement('article');
      article.className = 'voice-message voice-message--' + entry.role;
      const actions = entry.role === 'user'
        ? '<div class="voice-message__actions"><button class="voice-chip-btn" type="button" data-detail-index="' + index + '">Показать разбор</button></div>'
        : '';
      const detailsContent = buildMessageDetails(entry);
      article.innerHTML =
        '<div class="voice-message__meta"><span>' + (entry.role === 'user' ? 'Вы' : 'ИИ репетитор') + '</span><span>•</span><span>' + escapeHtml(entry.time) + '</span></div>' +
        '<p class="voice-message__text">' + escapeHtml(entry.text || '...') + '</p>' +
        actions +
        '<div class="voice-message__details">' + (detailsContent || 'Пока разбор не готов.') + '</div>';
      els.transcriptList.appendChild(article);
    });
    els.transcriptList.scrollTop = els.transcriptList.scrollHeight;
  }

  function addTranscript(role, text, extras) {
    const entry = Object.assign({
      role: role,
      text: text || '',
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    }, extras || {});
    state.transcript.push(entry);
    renderTranscript();
    return state.transcript.length - 1;
  }

  function updateTranscriptByMap(map, id, patch) {
    if (!map.has(id)) {
      const index = addTranscript(patch.role || 'assistant', patch.text || '', patch);
      map.set(id, index);
      return;
    }
    const index = map.get(id);
    Object.assign(state.transcript[index], patch);
    renderTranscript();
  }

  async function requestMicrophone() {
    els.permissionError.hidden = true;
    try {
      state.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setScreen('conversation');
      renderConversationInfo();
      await startRealtimeSession();
    } catch (error) {
      els.permissionError.hidden = false;
      els.permissionError.textContent = 'Не удалось получить доступ к микрофону. Разреши микрофон в браузере и попробуй ещё раз.';
    }
  }

  async function startRealtimeSession() {
    cleanupConnection(false);
    state.transcript = [];
    state.assistantMessageMap = new Map();
    state.userMessageMap = new Map();
    renderTranscript();
    state.sessionStartedAt = Date.now();
    setSessionStatus('thinking', 'Подключение');

    const tokenResult = await request('/api/ai/voice/token', {
      method: 'POST',
      body: JSON.stringify({
        scenario: state.selectedScenario.title,
        level: state.selectedLevel,
        voice: state.selectedLevel === 'A1' ? 'marin' : 'verse',
        lessonMode: state.lessonMode ? state.lessonModeLabel : '',
        lessonTitle: state.lessonTitle,
        lessonCourseTitle: state.lessonCourseTitle,
        options: state.options
      })
    });

    if (!tokenResult || !tokenResult.data || !tokenResult.data.value) {
      throw new Error((tokenResult && tokenResult.data && tokenResult.data.details) || 'Не удалось создать голосовую сессию');
    }

    setUsage(tokenResult.data.usage?.used || state.usage.used, tokenResult.data.usage?.limit || state.usage.limit);
    state.pc = new RTCPeerConnection();
    state.audio = new Audio();
    state.audio.autoplay = true;
    state.pc.ontrack = function (event) {
      state.audio.srcObject = event.streams[0];
    };

    const tracks = (state.stream || await navigator.mediaDevices.getUserMedia({ audio: true })).getTracks();
    tracks.forEach(function (track) {
      state.pc.addTrack(track, state.stream);
    });

    state.dc = state.pc.createDataChannel('oai-events');
    bindDataChannel(state.dc);

    const offer = await state.pc.createOffer();
    await state.pc.setLocalDescription(offer);

    const sdpResponse = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      body: offer.sdp,
      headers: {
        Authorization: 'Bearer ' + tokenResult.data.value,
        'Content-Type': 'application/sdp'
      }
    });

    if (!sdpResponse.ok) {
      const errorText = await sdpResponse.text().catch(function () { return ''; });
      throw new Error(errorText || 'Не удалось подключиться к Realtime API');
    }

    const answer = { type: 'answer', sdp: await sdpResponse.text() };
    await state.pc.setRemoteDescription(answer);
    setSessionStatus('idle', 'Готов к разговору');
  }

  function bindDataChannel(dc) {
    dc.addEventListener('open', function () {
      setSessionStatus('idle', 'Готов к разговору');
      sendGreetingKickoff();
    });

    dc.addEventListener('message', function (e) {
      let event;
      try {
        event = JSON.parse(e.data);
      } catch (error) {
        return;
      }
      handleRealtimeEvent(event);
    });

    dc.addEventListener('close', function () {
      setSessionStatus('paused', 'Сессия закрыта');
    });
  }

  function sendRealtime(event) {
    if (!state.dc || state.dc.readyState !== 'open') return;
    state.dc.send(JSON.stringify(event));
  }

  function sendGreetingKickoff() {
    const intro = state.lessonMode && state.lessonModeLabel
      ? 'Начни короткую сценку по теме урока "' + state.lessonModeLabel + '" и задай первый простой вопрос на казахском.'
      : 'Начни короткую сценку по сценарию "' + state.selectedScenario.title + '" и задай первый простой вопрос на казахском.';
    sendRealtime({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: intro }]
      }
    });
    sendRealtime({ type: 'response.create' });
  }

  function handleRealtimeEvent(event) {
    if (!event || !event.type) return;

    if (event.type === 'input_audio_buffer.speech_started') {
      setSessionStatus('listening', 'Слушаю');
      return;
    }

    if (event.type === 'input_audio_buffer.speech_stopped' || event.type === 'input_audio_buffer.committed') {
      setSessionStatus('thinking', 'Обрабатываю');
      return;
    }

    if (event.type === 'conversation.item.input_audio_transcription.completed') {
      const transcript = event.transcript || '';
      updateTranscriptByMap(state.userMessageMap, event.item_id || ('u-' + Date.now()), {
        role: 'user',
        text: transcript,
        translation: state.options.showTranslation ? 'Разговорная реплика пользователя' : '',
        correction: '',
        explanation: ''
      });
      return;
    }

    if (event.type === 'response.output_item.done' || event.type === 'conversation.item.done') {
      const item = event.item || {};
      if (item.role !== 'assistant') return;
      const text = extractItemText(item);
      if (!text) return;
      updateTranscriptByMap(state.assistantMessageMap, item.id || ('a-' + Date.now()), {
        role: 'assistant',
        text: text
      });
      setSessionStatus('idle', 'ИИ отвечает');
      if (text.includes('дұрыс') || text.includes('айт')) appendErrorTip('ИИ мягко поправил формулировку. Пересмотри последнюю реплику и попробуй сказать её ещё раз точнее.');
      return;
    }

    if (event.type === 'response.text.delta' || event.type === 'response.audio_transcript.delta') {
      state.liveAssistantBuffer += event.delta || '';
      return;
    }

    if (event.type === 'response.done') {
      state.liveAssistantBuffer = '';
      setSessionStatus('idle', 'Готов к разговору');
      return;
    }

    if (event.type === 'error') {
      appendErrorTip((event.error && event.error.message) || 'Произошла ошибка в голосовой сессии.');
      setSessionStatus('paused', 'Ошибка');
    }
  }

  function extractItemText(item) {
    if (!item || !Array.isArray(item.content)) return '';
    const parts = [];
    item.content.forEach(function (part) {
      if (part.text) parts.push(part.text);
      if (part.transcript) parts.push(part.transcript);
    });
    return parts.join(' ').trim();
  }

  async function sendTextFallback(mode) {
    const value = (els.textFallbackInput.value || '').trim();
    if (!value && !mode) return;
    const promptText = mode === 'example'
      ? 'Дай короткий пример ответа ученика для текущей ситуации.'
      : mode === 'explain'
      ? 'Очень кратко объясни по-русски, как лучше ответить в этой ситуации, и дай 1 вариант на казахском.'
      : mode === 'simplify'
      ? 'Упрости текущий диалог и задай очень простой следующий вопрос на казахском.'
      : value;

    if (!state.dc || state.dc.readyState !== 'open') {
      appendErrorTip('Сначала подключи голосовую сессию.');
      return;
    }

    addTranscript('user', promptText, {
      translation: mode ? 'Служебный запрос к ИИ' : '',
      correction: '',
      explanation: ''
    });
    sendRealtime({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: promptText }]
      }
    });
    sendRealtime({ type: 'response.create' });
    els.textFallbackInput.value = '';
    setSessionStatus('thinking', 'Обрабатываю');
  }

  function formatDuration(ms) {
    const total = Math.max(1, Math.round(ms / 1000));
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return min + ' мин ' + String(sec).padStart(2, '0') + ' сек';
  }

  function buildSummary() {
    const userMessages = state.transcript.filter(function (item) { return item.role === 'user' && item.text && !item.text.startsWith('Дай короткий пример'); });
    const duration = formatDuration(Date.now() - state.sessionStartedAt);
    const strengths = [
      'Ты не боялся вступать в разговор и поддерживал диалог.',
      state.selectedLevel === 'A1' ? 'Хорошо использовал простые базовые конструкции.' : 'Пробовал строить более естественные фразы.',
      'Сценарий был отработан в реальном разговорном формате.'
    ];
    const improvements = [
      'Старайся отвечать чуть полнее, а не одним словом.',
      'Закрепи полезные фразы из этого сценария и повтори их вслух.',
      state.lessonMode ? 'Ещё раз повтори тему урока и попробуй использовать её без подсказок.' : 'Попробуй снова пройти тот же сценарий без перехода на русский.'
    ];
    const phrases = state.selectedScenario.phrases.slice(0, 3);
    const next = state.selectedScenario.next;

    els.summaryScenario.textContent = state.selectedScenario.title + ' · ' + state.selectedLevel;
    els.summaryDuration.textContent = duration;
    els.summaryCount.textContent = String(userMessages.length);
    els.summaryStrengths.innerHTML = strengths.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('');
    els.summaryImprovements.innerHTML = improvements.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('');
    els.summaryPhrases.innerHTML = phrases.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('');
    els.summaryNext.textContent = next;

    state.lastSaved = {
      scenario: state.selectedScenario.title,
      level: state.selectedLevel,
      date: new Date().toLocaleString('ru-RU'),
      duration: duration,
      count: userMessages.length,
      modeLabel: state.lessonMode ? 'Разговор по уроку' : 'Обычный сценарий',
      transcript: state.transcript.slice(-20)
    };
  }

  function cleanupConnection(clearTranscript) {
    if (state.dc) {
      try { state.dc.close(); } catch (error) {}
      state.dc = null;
    }
    if (state.pc) {
      try { state.pc.close(); } catch (error) {}
      state.pc = null;
    }
    if (state.stream) {
      state.stream.getTracks().forEach(function (track) { track.stop(); });
      state.stream = null;
    }
    if (clearTranscript) {
      state.transcript = [];
      renderTranscript();
    }
  }

  function endSession() {
    cleanupConnection(false);
    buildSummary();
    setScreen('summary');
  }

  function bindConversationEvents() {
    els.allowMicBtn.addEventListener('click', function () {
      requestMicrophone().catch(function (error) {
        els.permissionError.hidden = false;
        els.permissionError.textContent = error.message || 'Не удалось запустить голосовую сессию.';
      });
    });
    els.sendTextBtn.addEventListener('click', function () { sendTextFallback(''); });
    els.exampleAnswerBtn.addEventListener('click', function () { sendTextFallback('example'); });
    els.explainRuBtn.addEventListener('click', function () { sendTextFallback('explain'); });
    els.simplifyBtn.addEventListener('click', function () { sendTextFallback('simplify'); });
    els.reconnectBtn.addEventListener('click', function () {
      requestMicrophone().catch(function (error) {
        appendErrorTip(error.message || 'Не удалось переподключить сессию.');
      });
    });
    els.muteBtn.addEventListener('click', function () {
      state.muted = !state.muted;
      if (state.stream) state.stream.getAudioTracks().forEach(function (track) { track.enabled = !state.muted; });
      els.muteBtn.textContent = state.muted ? '🔈' : '🔇';
      appendErrorTip(state.muted ? 'Микрофон выключен.' : 'Микрофон снова включён.');
    });
    els.endBtn.addEventListener('click', endSession);
    els.transcriptList.addEventListener('click', function (event) {
      const button = event.target.closest('[data-detail-index]');
      if (!button) return;
      const article = button.closest('.voice-message');
      const details = article.querySelector('.voice-message__details');
      if (!details) return;
      details.classList.toggle('voice-message__details--visible');
      button.textContent = details.classList.contains('voice-message__details--visible') ? 'Скрыть разбор' : 'Показать разбор';
    });
  }

  function bindSummaryEvents() {
    els.repeatBtn.addEventListener('click', function () {
      setScreen('permission');
    });
    els.newScenarioBtn.addEventListener('click', function () {
      setScreen('setup');
    });
    els.saveResultBtn.addEventListener('click', function () {
      if (!state.lastSaved) buildSummary();
      state.history.unshift(state.lastSaved);
      state.history = state.history.slice(0, 20);
      saveHistory();
      openHistory();
    });
  }

  function bindHistoryEvents() {
    els.openHistoryBtn.addEventListener('click', openHistory);
    Array.from(document.querySelectorAll('[data-close-history]')).forEach(function (node) {
      node.addEventListener('click', closeHistory);
    });
    window.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeHistory();
    });
  }

  function init() {
    loadState();
    parseLessonMode();
    bindHeaderMenu();
    renderScenarios();
    renderConversationInfo();
    els.levelHint.textContent = levelHints[state.selectedLevel];
    bindSetupEvents();
    bindConversationEvents();
    bindSummaryEvents();
    bindHistoryEvents();
    loadUsage();
  }

  init();
})();
