(function(){
  const SCENARIOS = {
    intro:{
      title:'Знакомство',
      description:'Знакомься, рассказывай о себе',
      goal:'Познакомиться и коротко рассказать о себе',
      difficulty:'Лёгкий',
      prompt:'Ты знакомишься с новым человеком. Задавай простые вопросы о имени, городе, учёбе, работе и интересах.',
      phrases:['Сәлеметсіз бе? — Здравствуйте','Менің атым ... — Меня зовут ...','Мен ... қаласынанмын — Я из города ...','Мен студентпін — Я студент','Танысқаныма қуаныштымын — Приятно познакомиться'],
      hints:['Скажи имя и откуда ты','Используй короткие и понятные фразы','Можно добавить чем занимаешься']
    },
    cafe:{
      title:'Кафе',
      description:'Заказывай еду и напитки',
      goal:'Сделать простой заказ в кафе',
      difficulty:'Лёгкий',
      prompt:'Ты в кафе. Помоги ученику заказать напиток, еду, спросить цену и поблагодарить.',
      phrases:['Маған бір кофе беріңізші — Мне, пожалуйста, один кофе','Тағы не бар? — Что ещё есть?','Бағасы қанша? — Сколько стоит?','Шот беріңізші — Счёт, пожалуйста','Рахмет — Спасибо'],
      hints:['Начни с вежливого обращения','Можно спросить цену','Не забывай слова благодарности']
    },
    shop:{
      title:'Магазин',
      description:'Покупай продукты и товары',
      goal:'Попросить товар и уточнить детали покупки',
      difficulty:'Лёгкий',
      prompt:'Ты в магазине. Говори о товарах, цене, количестве, размере или вкусе.',
      phrases:['Маған нан керек — Мне нужен хлеб','Мынау қанша тұрады? — Сколько это стоит?','Тағы бар ма? — Есть ещё?','Үлкені бар ма? — Есть побольше?','Карточкамен төлеймін — Оплачу картой'],
      hints:['Спрашивай цену и количество','Используй слова керек, бар ма','Можно уточнить размер или вкус']
    },
    taxi:{
      title:'Такси',
      description:'Вызывай такси и общайся с водителем',
      goal:'Объяснить маршрут и уточнить детали поездки',
      difficulty:'Средний',
      prompt:'Ты едешь в такси. Спрашивай про адрес, время, маршрут и остановку.',
      phrases:['Мына мекенжайға барыңызшы — Поезжайте по этому адресу','Қанша уақытта барамыз? — За сколько доедем?','Осы жерге тоқтаңызшы — Остановите здесь','Оңға бұрылыңыз — Поверните направо','Рахмет, сау болыңыз — Спасибо, до свидания'],
      hints:['Скажи адрес или место','Можно уточнить время поездки','Используй вежливую форму']
    },
    university:{
      title:'Университет',
      description:'Учебные ситуации и разговоры',
      goal:'Поговорить об учёбе, расписании и заданиях',
      difficulty:'Средний',
      prompt:'Ты в университете. Говори о парах, преподавателе, аудитории, расписании и домашнем задании.',
      phrases:['Менің сабағым бар — У меня есть занятие','Дәріс қайда болады? — Где будет лекция?','Үй тапсырмасы бар ма? — Есть домашнее задание?','Мен түсінбедім — Я не понял','Қайталап айтыңызшы — Повторите, пожалуйста'],
      hints:['Можно спросить про аудиторию или время','Используй слова сабақ, дәріс, тапсырма','Если не понял — попроси повторить']
    },
    work:{
      title:'Работа',
      description:'Рабочие моменты и деловая беседа',
      goal:'Обсудить простые рабочие задачи',
      difficulty:'Средний',
      prompt:'Ты на работе. Говори о задачах, времени, встречах, дедлайнах и согласовании.',
      phrases:['Бүгін жиналыс бар ма? — Сегодня есть встреча?','Мен тапсырманы аяқтадым — Я закончил задачу','Маған көмек керек — Мне нужна помощь','Қашан дайын болады? — Когда будет готово?','Кейін сөйлесейік — Давайте поговорим позже'],
      hints:['Говори коротко и по делу','Можно сказать о сроке или готовности','Используй деловой спокойный тон']
    }
  };

  const LEVELS = {
    A1:'A1 — простые фразы и медленный темп',
    A2:'A2 — бытовой диалог и короткие уточнения',
    B1:'B1 — более естественная речь и уточняющие вопросы'
  };

  const STORAGE_KEY = 'anatil_voice_dialog_history_v1';
  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  const state = {
    scenario:null,
    level:'A1',
    screen:'setup',
    status:'idle',
    paused:false,
    muted:false,
    recognizing:false,
    supportedRecognition: !!SpeechRecognitionCtor,
    recognition:null,
    mediaStream:null,
    messages:[],
    sessionId:null,
    startedAt:null,
    transcriptCount:0,
    usage:{used:0,limit:20},
    options:{
      translation:true,
      correction:true,
      hints:true,
      slow:false
    },
    lastCorrection:null,
    lastAiReply:'',
    history:loadHistory()
  };

  const setupScreen = document.getElementById('setupScreen');
  const historyScreen = document.getElementById('historyScreen');
  const permissionScreen = document.getElementById('permissionScreen');
  const conversationScreen = document.getElementById('conversationScreen');
  const summaryModal = document.getElementById('summaryModal');
  const scenarioButtons = Array.from(document.querySelectorAll('.voice-scenario-card'));
  const levelButtons = Array.from(document.querySelectorAll('.voice-level-chip'));
  const startDialogBtn = document.getElementById('startDialogBtn');
  const quickStartBtn = document.getElementById('quickStartBtn');
  const historyBtnHeader = document.getElementById('historyBtnHeader');
  const backFromHistoryBtn = document.getElementById('backFromHistoryBtn');
  const allowMicBtn = document.getElementById('allowMicBtn');
  const permissionError = document.getElementById('permissionError');
  const transcriptList = document.getElementById('transcriptList');
  const statusPill = document.getElementById('statusPill');
  const statusLine = document.getElementById('statusLine');
  const waveform = document.getElementById('waveform');
  const micBtn = document.getElementById('micBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const endBtn = document.getElementById('endBtn');
  const muteBtn = document.getElementById('muteBtn');
  const repeatBtn = document.getElementById('repeatBtn');
  const newScenarioBtn = document.getElementById('newScenarioBtn');
  const closeSummaryBtn = document.getElementById('closeSummaryBtn');
  const conversationScenario = document.getElementById('conversationScenario');
  const conversationLevel = document.getElementById('conversationLevel');
  const supportScenarioText = document.getElementById('supportScenarioText');
  const supportLevelText = document.getElementById('supportLevelText');
  const summaryScenario = document.getElementById('summaryScenario');
  const historyList = document.getElementById('historyList');
  const usageBadge = document.getElementById('usageBadge');
  const optTranslation = document.getElementById('optTranslation');
  const optCorrection = document.getElementById('optCorrection');
  const optHints = document.getElementById('optHints');
  const optSlow = document.getElementById('optSlow');
  const lessonModeBtn = document.querySelector('.voice-link-btn');
  const phraseList = document.querySelector('.voice-phrase-list');
  const hintLines = Array.from(document.querySelectorAll('.voice-hints-box p'));
  const supportBullets = Array.from(document.querySelectorAll('.voice-bullets > div span:last-child'));
  const mistakeBad = document.querySelector('.voice-mistake-box__bad');
  const mistakeGood = document.querySelector('.voice-mistake-box__good');
  const mistakeNote = document.querySelector('.voice-mistake-box__note');
  const summaryDurationStrong = document.querySelector('.voice-summary-grid .voice-summary-stat:nth-child(2) strong');
  const summaryPhrasesStrong = document.querySelector('.voice-summary-big strong');
  const summaryStrengths = document.querySelector('.voice-summary-list--green');
  const summaryImprove = document.querySelector('.voice-summary-list--orange');
  const summaryUseful = document.querySelector('.voice-summary-list--blue');
  const summaryReco = document.querySelector('.voice-summary-reco');
  const summaryGreen = document.querySelector('.voice-summary-green');

  function loadHistory(){
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveHistory(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history.slice(0, 20)));
  }

  function escapeHtml(value){
    return String(value || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function formatDuration(ms){
    const total = Math.max(0, Math.round(ms / 1000));
    const min = Math.floor(total / 60);
    const sec = total % 60;
    if (min <= 0) return sec + ' сек';
    return min + ' мин ' + String(sec).padStart(2, '0') + ' сек';
  }

  function setScreen(name){
    state.screen = name;
    [setupScreen, historyScreen, permissionScreen, conversationScreen].forEach(function(el){
      el.classList.remove('voice-screen--active');
    });
    if(name === 'setup') setupScreen.classList.add('voice-screen--active');
    if(name === 'history') historyScreen.classList.add('voice-screen--active');
    if(name === 'permission') permissionScreen.classList.add('voice-screen--active');
    if(name === 'conversation') conversationScreen.classList.add('voice-screen--active');
  }

  function setScenario(id){
    state.scenario = id;
    scenarioButtons.forEach(function(btn){
      btn.classList.toggle('is-selected', btn.dataset.scenario === id);
    });
    startDialogBtn.disabled = !id;
    updateSupportContent();
  }

  function setLevel(level){
    state.level = level;
    levelButtons.forEach(function(btn){
      btn.classList.toggle('is-active', btn.dataset.level === level);
    });
    updateSupportContent();
  }

  function applyOptionsFromUi(){
    state.options.translation = !!optTranslation.checked;
    state.options.correction = !!optCorrection.checked;
    state.options.hints = !!optHints.checked;
    state.options.slow = !!optSlow.checked;
  }

  function updateSupportContent(){
    const data = SCENARIOS[state.scenario] || SCENARIOS.intro;
    conversationScenario.textContent = data.title;
    supportScenarioText.textContent = data.title;
    conversationLevel.textContent = state.level;
    supportLevelText.textContent = state.level;
    summaryScenario.textContent = data.title;
    phraseList.innerHTML = data.phrases.map(function(item){ return '<div>'+escapeHtml(item)+'</div>'; }).join('');
    data.hints.forEach(function(text, index){
      if (hintLines[index]) hintLines[index].textContent = '💡 ' + text;
      if (supportBullets[index]) supportBullets[index].textContent = text;
    });
  }

  function setStatus(status, detail){
    state.status = status;
    statusPill.className = 'voice-status-pill';
    micBtn.classList.remove('is-listening','is-disabled');
    waveform.classList.remove('is-active');
    if(status === 'listening'){
      statusPill.classList.add('is-listening');
      statusPill.querySelector('.voice-status-pill__text').textContent = 'Слушаю';
      statusLine.textContent = detail || 'Нажмите кнопку микрофона и говорите';
      micBtn.classList.add('is-listening');
      waveform.classList.add('is-active');
      return;
    }
    if(status === 'processing'){
      statusPill.classList.add('is-processing');
      statusPill.querySelector('.voice-status-pill__text').textContent = 'Обрабатываю';
      statusLine.textContent = detail || 'Обрабатываю вашу речь...';
      micBtn.classList.add('is-disabled');
      return;
    }
    if(status === 'ai'){
      statusPill.classList.add('is-ai');
      statusPill.querySelector('.voice-status-pill__text').textContent = 'ИИ отвечает';
      statusLine.textContent = detail || 'ИИ отвечает голосом';
      micBtn.classList.add('is-disabled');
      waveform.classList.add('is-active');
      return;
    }
    if(status === 'paused'){
      statusPill.classList.add('is-paused');
      statusPill.querySelector('.voice-status-pill__text').textContent = 'Пауза';
      statusLine.textContent = detail || 'Диалог на паузе';
      micBtn.classList.add('is-disabled');
      return;
    }
    statusPill.querySelector('.voice-status-pill__text').textContent = 'Готов';
    statusLine.textContent = detail || 'Можно начать разговор';
  }

  function parseChatReply(raw){
    const text = String(raw || '').trim();
    const result = { text:'', correction:'', translation:'', explanation:'' };
    if (!text) return result;
    const lines = text.split(/\n+/).map(function(line){ return line.trim(); }).filter(Boolean);
    result.text = lines[0] || text;
    lines.slice(1).forEach(function(line){
      const normalized = line.toLowerCase();
      if (!result.translation && (normalized.startsWith('перевод:') || normalized.startsWith('translation:'))) {
        result.translation = line.replace(/^([^:]+):\s*/,'');
        return;
      }
      if (!result.correction && (normalized.startsWith('исправ') || normalized.startsWith('правиль') || normalized.startsWith('correct'))) {
        result.correction = line.replace(/^([^:]+):\s*/,'');
        return;
      }
      if (!result.explanation && (normalized.startsWith('объяс') || normalized.startsWith('пояс') || normalized.startsWith('why'))) {
        result.explanation = line.replace(/^([^:]+):\s*/,'');
      }
    });
    return result;
  }

  function addMessage(message){
    state.messages.push(message);
    renderTranscript();
    updateMistakeBox();
  }

  function renderTranscript(){
    transcriptList.innerHTML = state.messages.map(function(message, index){
      const isUser = message.sender === 'user';
      const correction = state.options.correction ? message.correction : '';
      const translation = state.options.translation ? message.translation : '';
      const explanation = message.explanation || '';
      return '<div class="voice-transcript-item '+(isUser?'is-user':'is-ai')+'"><div class="voice-transcript-stack"><div class="voice-transcript-role">'+(isUser?'Вы':'ИИ репетитор')+'</div><div class="voice-bubble">'+escapeHtml(message.text)+'</div>'+
        (isUser && (correction || translation || explanation) ? '<div class="voice-bubble-actions">'+
          (correction?'<button class="voice-bubble-chip voice-bubble-chip--orange" data-toggle="correction-'+index+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg><span>Показать исправление</span><svg class="voice-bubble-chip__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"></path></svg></button>':'')+
          (translation?'<button class="voice-bubble-chip voice-bubble-chip--blue" data-toggle="translation-'+index+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path></svg><span>Перевод</span><svg class="voice-bubble-chip__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"></path></svg></button>':'')+
          (explanation?'<button class="voice-bubble-chip voice-bubble-chip--purple" data-toggle="explanation-'+index+'"><span>Почему это ошибка?</span><svg class="voice-bubble-chip__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"></path></svg></button>':'')+
        '</div>':'')+
        (correction?'<div class="voice-extra-box voice-extra-box--orange" id="correction-'+index+'"><strong>Исправление:</strong><span>'+escapeHtml(correction)+'</span></div>':'')+
        (translation?'<div class="voice-extra-box voice-extra-box--blue" id="translation-'+index+'"><strong>Перевод:</strong><span>'+escapeHtml(translation)+'</span></div>':'')+
        (explanation?'<div class="voice-extra-box voice-extra-box--purple" id="explanation-'+index+'"><strong>Объяснение:</strong><span>'+escapeHtml(explanation)+'</span></div>':'')+
        '</div></div>';
    }).join('');

    transcriptList.querySelectorAll('[data-toggle]').forEach(function(btn){
      btn.addEventListener('click', function(){
        const id = btn.getAttribute('data-toggle');
        const box = document.getElementById(id);
        if(!box) return;
        const open = box.classList.toggle('is-open');
        btn.classList.toggle('is-open', open);
      });
    });
    transcriptList.scrollTop = transcriptList.scrollHeight;
  }

  function updateMistakeBox(){
    const latest = [...state.messages].reverse().find(function(item){
      return item.sender === 'user' && item.correction;
    });
    if (!latest) {
      mistakeBad.textContent = 'Ошибок пока нет';
      mistakeGood.textContent = 'Продолжай говорить';
      mistakeNote.textContent = 'Подсказки появятся после исправлений';
      return;
    }
    mistakeBad.textContent = latest.text;
    mistakeGood.textContent = latest.correction;
    mistakeNote.textContent = latest.explanation || 'Исправленный вариант выше';
  }

  async function updateUsageBadge(){
    try {
      const response = window.apiFetch ? await window.apiFetch('/api/ai/usage/today', { method:'GET' }) : null;
      if (!response || !response.res || !response.res.ok || !response.data) return;
      state.usage.used = Number(response.data.used || 0);
      state.usage.limit = Number(response.data.limit || 50);
      usageBadge.textContent = 'Сегодня: ' + state.usage.used + '/' + state.usage.limit + ' диалогов';
    } catch {}
  }

  async function startAiSession(){
    if (!window.apiFetch) return;
    try {
      const response = await window.apiFetch('/api/ai/session/start', {
        method:'POST',
        body: JSON.stringify({ mode:'dialog', scenario:(SCENARIOS[state.scenario] || SCENARIOS.intro).title })
      });
      if (response && response.res && response.res.ok && response.data && response.data.session) {
        state.sessionId = response.data.session.id;
      }
    } catch {}
  }

  function recognitionLanguage(){
    return 'kk-KZ';
  }

  function stopRecognition(){
    if (state.recognition && state.recognizing) {
      try { state.recognition.stop(); } catch {}
    }
    state.recognizing = false;
  }

  async function requestMicrophoneAccess(){
    permissionError.hidden = true;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        state.mediaStream = await navigator.mediaDevices.getUserMedia({ audio:true });
      }
      return true;
    } catch (error) {
      permissionError.textContent = 'Не удалось получить доступ к микрофону. Проверьте настройки браузера.';
      permissionError.hidden = false;
      return false;
    }
  }

  function releaseMediaStream(){
    if (state.mediaStream) {
      state.mediaStream.getTracks().forEach(function(track){ track.stop(); });
      state.mediaStream = null;
    }
  }

  function buildAiPayload(userText, action){
    const scenario = SCENARIOS[state.scenario] || SCENARIOS.intro;
    return {
      mode:'dialog',
      message:userText,
      action:action || 'message',
      sessionId: state.sessionId,
      scenarioKey: state.scenario,
      scenario: scenario.title,
      scenarioGoal: scenario.goal,
      scenarioDifficulty: state.level === 'A1' ? 'Лёгкий' : (state.level === 'A2' ? 'Средний' : 'Выше среднего'),
      supportPhrases: scenario.phrases.map(function(item){ return item.split(' — ')[0]; }),
      history: state.messages.slice(-8).map(function(item){
        return { role:item.sender === 'ai' ? 'assistant' : 'user', text:item.text };
      }),
      meta:{
        lesson: false,
        prompt: scenario.prompt,
        level: state.level,
        translation: state.options.translation,
        correction: state.options.correction,
        hints: state.options.hints,
        speed: state.options.slow ? 'slow' : 'normal'
      }
    };
  }

    function buildFallbackReply(userText, action){
        const scenario = SCENARIOS[state.scenario] || SCENARIOS.intro;

        const starts = {
            intro: {
                A1:'Сәлеметсіз бе! Сіздің атыңыз кім?',
                A2:'Сәлем! Өзіңіз туралы қысқаша айтып беріңізші.',
                B1:'Сәлем! Өзіңізді таныстырып, немен айналысатыныңызды айтып беріңізші.'
            },
            cafe: {
                A1:'Сәлеметсіз бе! Не қалайсыз?',
                A2:'Сәлеметсіз бе! Не ішесіз немесе жейсіз?',
                B1:'Сәлеметсіз бе! Бүгін не тапсырыс бергіңіз келеді?'
            },
            shop: {
                A1:'Сәлеметсіз бе! Сізге не керек?',
                A2:'Сәлем! Қандай тауар іздеп жүрсіз?',
                B1:'Сәлеметсіз бе! Қандай зат керек екенін айта аласыз ба?'
            },
            taxi: {
                A1:'Сәлеметсіз бе! Қайда барасыз?',
                A2:'Сәлем! Қай мекенжайға барамыз?',
                B1:'Сәлеметсіз бе! Қай бағытқа барамыз, мекенжайды айтыңызшы.'
            },
            university: {
                A1:'Сәлем! Қай пән бар?',
                A2:'Сәлем! Бүгін қандай сабақ бар?',
                B1:'Сәлеметсіз бе! Бүгінгі сабақтар туралы айтып беріңізші.'
            },
            work: {
                A1:'Сәлем! Не істеп жатырсыз?',
                A2:'Сәлеметсіз бе! Қандай тапсырма орындап жатырсыз?',
                B1:'Сәлем! Қазіргі жұмысыңыз туралы қысқаша айтып беріңізші.'
            }
        };

        const nexts = {
            intro: 'Сіз қай қаладан келдіңіз?',
            cafe: 'Тағы не қалайсыз?',
            shop: 'Тағы не керек?',
            taxi: 'Мекенжайды айтыңызшы.',
            university: 'Дәріс қай аудиторияда болады?',
            work: 'Тапсырма дайын болды ма?'
        };

        if (action === 'start') {
            return { text: starts[state.scenario]?.[state.level] || starts.intro.A1, translation:'' };
        }

        if (action === 'hint') {
            return { text: scenario.phrases[0].split(' — ')[0], translation:'Пример короткого ответа по этой ситуации.' };
        }

        if (action === 'repeat') {
            return { text: nexts[state.scenario] || 'Қайталап айтыңызшы.', translation:'Повтор вопроса по текущему сценарию.' };
        }

        if (action === 'explain') {
            return {
                text: nexts[state.scenario] || 'Қысқа жауап беріңізші.',
                translation:'',
                explanation:'Старайся отвечать коротко и по теме текущего сценария.'
            };
        }

        return { text: nexts[state.scenario] || 'Жалғастырайық.', translation:'' };
    }

  async function askAi(userText, action){
    const payload = buildAiPayload(userText, action);
    if (!window.apiFetch) return buildFallbackReply(userText, action);
    try {
      const response = await window.apiFetch('/api/ai/voice-dialog', {
        method:'POST',
        body: JSON.stringify(payload)
      });
      if (!response || !response.res || !response.res.ok || !response.data) {
        throw new Error(response && response.data && response.data.details ? response.data.details : 'AI request failed');
      }
      if (response.data.usage) {
        state.usage.used = Number(response.data.usage.used || state.usage.used);
        state.usage.limit = Number(response.data.usage.limit || state.usage.limit);
        usageBadge.textContent = 'Сегодня: ' + state.usage.used + '/' + state.usage.limit + ' диалогов';
      }
      return {
        text: response.data.assistantText || 'Кешіріңіз, қайталап айта аласыз ба?',
        ttsText: response.data.ttsText || response.data.assistantText || '',
        translation: response.data.translation || '',
        correction: response.data.correction && response.data.correction.hasIssue ? response.data.correction.better || '' : '',
        explanation: response.data.correction ? response.data.correction.explanation || '' : '',
        meta: response.data.meta || { shouldRepeat:false, isUnclearInput:false }
      };
    } catch {
      return buildFallbackReply(userText, action);
    }
  }

  async function playServerTts(text){
    if (state.muted || !text) return false;
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          text: text,
          voice: 'alloy',
          speed: state.options.slow ? 0.85 : 1
        })
      });
      if (!response.ok) return false;
      const blob = await response.blob();
      if (!blob || !blob.size) return false;
      const url = URL.createObjectURL(blob);
      await new Promise(function(resolve){
        const audio = new Audio();
        audio.src = url;
        audio.onended = function(){
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = function(){
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.play().catch(function(){
          URL.revokeObjectURL(url);
          resolve();
        });
      });
      return true;
    } catch {
      return false;
    }
  }

  async function speakText(text){
    if (state.muted || !text) return;
    const played = await playServerTts(text);
    if (played || !('speechSynthesis' in window)) return;
    await new Promise(function(resolve){
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'kk-KZ';
      utterance.rate = state.options.slow ? 0.85 : 1;
      utterance.pitch = 1;
      utterance.onend = function(){ resolve(); };
      utterance.onerror = function(){ resolve(); };
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } catch {
        resolve();
      }
    });
  }

  function createRecognition(){
    if (!SpeechRecognitionCtor) return null;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = recognitionLanguage();
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = function(){
      state.recognizing = true;
      setStatus('listening', 'Слушаю вас... говорите');
    };

    recognition.onresult = async function(event){
      state.recognizing = false;
      const text = Array.from(event.results || []).map(function(result){
        return result[0] && result[0].transcript ? result[0].transcript : '';
      }).join(' ').trim();
      if (!text) {
        setStatus('listening', 'Речь не распознана, попробуйте ещё раз');
        return;
      }
      state.transcriptCount += 1;
      setStatus('processing');
      addMessage({ sender:'user', text:text });
      const aiReply = await askAi(text, 'message');
      const lastUserMessage = state.messages[state.messages.length - 1];
      if (lastUserMessage && lastUserMessage.sender === 'user') {
        lastUserMessage.correction = aiReply.correction || '';
        lastUserMessage.explanation = aiReply.explanation || '';
      }
      renderTranscript();
      updateMistakeBox();
      setStatus('ai');
      state.lastAiReply = aiReply.text || '';
      addMessage({ sender:'ai', text:aiReply.text || 'Жауап дайын.', translation: aiReply.translation || '' });
      await speakText(aiReply.ttsText || aiReply.text || '');
      if (!state.paused) setStatus('listening');
    };

    recognition.onerror = function(event){
      state.recognizing = false;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setStatus('paused', 'Нет доступа к микрофону');
        return;
      }
      if (event.error === 'no-speech') {
        setStatus('listening', 'Не услышал речь. Попробуйте ещё раз');
        return;
      }
      setStatus('paused', 'Ошибка микрофона: ' + event.error);
    };

    recognition.onend = function(){
      state.recognizing = false;
      if (state.status === 'processing' || state.status === 'ai' || state.paused) return;
      if (state.screen === 'conversation') setStatus('listening');
    };

    return recognition;
  }

  async function startConversation(){
    applyOptionsFromUi();
    setScreen('conversation');
    updateSupportContent();
    state.paused = false;
    state.messages = [];
    state.sessionId = null;
    state.startedAt = Date.now();
    state.transcriptCount = 0;
    state.lastCorrection = null;
    pauseBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"></path></svg>';
    await startAiSession();
    const scenario = SCENARIOS[state.scenario] || SCENARIOS.intro;
    const welcomeText = state.level === 'A1'
      ? 'Сәлеметсіз бе! Қысқа сөйлесейік. Өзіңіз туралы айтып беріңізші.'
      : 'Сәлеметсіз бе! Бүгін ' + scenario.title.toLowerCase() + ' тақырыбында сөйлесеміз. Бастауға дайынсыз ба?';
    addMessage({ sender:'ai', text:welcomeText, translation:'Здравствуйте! Давайте немного поговорим. Расскажите о себе.' });
    setStatus('listening');
    if (SpeechRecognitionCtor && !state.recognition) state.recognition = createRecognition();
    await speakText(welcomeText);
  }

  function startListening(){
    if (state.paused || state.status === 'processing' || state.status === 'ai') return;
    if (!state.supportedRecognition) {
      const typed = window.prompt('Браузер не поддерживает голосовой ввод. Введите реплику текстом:');
      if (!typed) return;
      state.transcriptCount += 1;
      setStatus('processing');
      addMessage({ sender:'user', text:typed });
      askAi(typed, 'message').then(async function(aiReply){
        const lastUserMessage = state.messages[state.messages.length - 1];
        if (lastUserMessage && lastUserMessage.sender === 'user') {
          lastUserMessage.correction = aiReply.correction || '';
          lastUserMessage.explanation = aiReply.explanation || '';
        }
        renderTranscript();
        updateMistakeBox();
        setStatus('ai');
        addMessage({ sender:'ai', text:aiReply.text || 'Жауап дайын.', translation: aiReply.translation || '' });
        await speakText(aiReply.ttsText || aiReply.text || '');
        if (!state.paused) setStatus('listening');
      });
      return;
    }
    if (!state.recognition) state.recognition = createRecognition();
    if (!state.recognition || state.recognizing) return;
    try {
      state.recognition.lang = recognitionLanguage();
      state.recognition.start();
    } catch {}
  }

  function pauseConversation(){
    state.paused = !state.paused;
    if (state.paused) {
      stopRecognition();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setStatus('paused');
      pauseBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>';
      return;
    }
    pauseBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"></path></svg>';
    setStatus('listening');
  }

  function renderHistory(){
    if(!state.history.length){
      historyList.innerHTML = '<div class="voice-empty-card"><div class="voice-empty-card__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div><h3>История пуста</h3><p>Вы ещё не провели ни одного голосового диалога. Начните практику, чтобы увидеть вашу историю разговоров.</p><button class="voice-btn voice-btn--primary" type="button" id="startFirstDialogBtn">Начать первый диалог</button></div>';
      document.getElementById('startFirstDialogBtn').addEventListener('click', function(){ setScreen('setup'); });
      return;
    }
    historyList.innerHTML = state.history.map(function(item, index){
      return '<article class="voice-history-item"><div class="voice-history-item__row"><div><div class="voice-history-item__top"><h3 class="voice-history-item__title">'+escapeHtml(item.scenario)+'</h3><span class="voice-tiny-chip">'+escapeHtml(item.level)+'</span><span class="voice-state-chip voice-state-chip--done">Завершён</span></div><p class="voice-history-item__date">'+escapeHtml(item.date)+'</p><div class="voice-history-item__meta"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>'+escapeHtml(item.duration)+'</span><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'+escapeHtml(String(item.phrases))+' фраз</span></div></div><button class="voice-btn voice-btn--outline" type="button" data-history-open="'+index+'">Посмотреть</button></div></article>';
    }).join('');
    historyList.querySelectorAll('[data-history-open]').forEach(function(btn){
      btn.addEventListener('click', function(){
        const item = state.history[Number(btn.getAttribute('data-history-open'))];
        if (!item) return;
        fillSummaryFromHistory(item);
        openSummary();
      });
    });
  }

  function fillSummaryFromHistory(item){
    summaryScenario.textContent = item.scenario;
    summaryDurationStrong.textContent = item.duration;
    summaryPhrasesStrong.textContent = String(item.phrases);
    summaryStrengths.innerHTML = (item.strengths || []).map(function(text){ return '<div>'+escapeHtml(text)+'</div>'; }).join('');
    summaryImprove.innerHTML = (item.improvements || []).map(function(text){ return '<div>'+escapeHtml(text)+'</div>'; }).join('');
    summaryUseful.innerHTML = (item.useful || []).map(function(text){ return '<div>'+escapeHtml(text)+'</div>'; }).join('');
    summaryReco.textContent = item.recommendation || 'Попробуй другой сценарий, чтобы закрепить навык в новой ситуации.';
    summaryGreen.textContent = item.intro || 'Отличная работа! Вы практиковали казахский язык в живом диалоге.';
  }

  function buildSummaryData(){
    const scenario = SCENARIOS[state.scenario] || SCENARIOS.intro;
    const duration = formatDuration(Date.now() - (state.startedAt || Date.now()));
    const userMessages = state.messages.filter(function(item){ return item.sender === 'user'; });
    const corrections = userMessages.filter(function(item){ return item.correction; });
    const usefulAi = state.messages.filter(function(item){ return item.sender === 'ai'; }).slice(0, 3).map(function(item){
      return item.translation ? item.text + ' — ' + item.translation : item.text;
    });
    const strengths = [];
    if (userMessages.length >= 3) strengths.push('Ты уверенно поддерживал диалог несколькими репликами');
    if (userMessages.some(function(item){ return item.text.length > 20; })) strengths.push('Получались не только короткие, но и более полные ответы');
    if (state.options.translation) strengths.push('Ты работал с переводом и лучше закреплял смысл фраз');
    if (!strengths.length) strengths.push('Ты начал говорить по-казахски вслух — это уже сильный шаг');
    const improvements = [];
    if (corrections.length) improvements.push('Обрати внимание на форму глаголов и порядок слов в предложении');
    if (userMessages.length < 3) improvements.push('Старайся отвечать чуть подробнее, чтобы тренировать разговорную речь');
    if (state.level === 'A1') improvements.push('Повтори базовые фразы по теме и попробуй использовать их без подсказок');
    if (!improvements.length) improvements.push('Продолжай практику и пробуй новые темы разговора');
    const useful = usefulAi.length ? usefulAi : scenario.phrases.slice(0,3);
    const recommendation = scenario.title === 'Знакомство'
      ? 'Попробуй сценарий «Кафе» на уровне A1 или A2, чтобы использовать разговорные фразы в новой ситуации.'
      : 'Повтори этот сценарий ещё раз или перейди к новой теме, чтобы расширить словарный запас.';
    return {
      scenario: scenario.title,
      duration: duration,
      phrases: userMessages.length,
      strengths: strengths.slice(0, 3),
      improvements: improvements.slice(0, 3),
      useful: useful.slice(0, 3),
      recommendation: recommendation,
      intro: userMessages.length >= 2 ? 'Хорошая практика. Вы поддержали диалог и потренировали разговорный казахский.' : 'Разговор завершён. В следующий раз попробуй сказать чуть больше реплик, чтобы практика была полезнее.'
    };
  }

  function saveCurrentSessionToHistory(summary){
    const now = new Date();
    const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    const item = {
      scenario: summary.scenario,
      level: state.level,
      date: now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear(),
      duration: summary.duration,
      phrases: summary.phrases,
      strengths: summary.strengths,
      improvements: summary.improvements,
      useful: summary.useful,
      recommendation: summary.recommendation,
      intro: summary.intro
    };
    state.history.unshift(item);
    state.history = state.history.slice(0, 20);
    saveHistory();
  }

  function closeSummary(){
    summaryModal.hidden = true;
    document.body.style.overflow = '';
  }

  function openSummary(){
    summaryModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function finishConversation(){
    stopRecognition();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    const summary = buildSummaryData();
    fillSummaryFromHistory(summary);
    saveCurrentSessionToHistory(summary);
    openSummary();
    updateUsageBadge();
  }

  async function handleHelp(action){
    if (state.screen !== 'conversation') return;
    const actionMap = { example:'hint', explain:'explain', simplify:'repeat' };
    setStatus('processing');
    const reply = await askAi('Нужна помощь в текущем диалоге', actionMap[action] || 'hint');
    setStatus('ai');
    addMessage({ sender:'ai', text:reply.text || 'Давайте продолжим.', translation: reply.translation || '', explanation: reply.explanation || '' });
    await speakText(reply.ttsText || reply.text || '');
    if (!state.paused) setStatus('listening');
  }

  function initScenarioIcons(){
    const svgs = {
      intro:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><path d="M20 8v6"></path><path d="M23 11h-6"></path></svg>',
      cafe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><line x1="6" y1="2" x2="6" y2="4"></line><line x1="10" y1="2" x2="10" y2="4"></line><line x1="14" y1="2" x2="14" y2="4"></line></svg>',
      shop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
      taxi:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 16H9m10-5-1.5-4.5A2 2 0 0 0 15.6 5H8.4a2 2 0 0 0-1.9 1.5L5 11m14 0H5m14 0v5a1 1 0 0 1-1 1h-1m-12-6v5a1 1 0 0 0 1 1h1"></path><circle cx="7" cy="16" r="2"></circle><circle cx="17" cy="16" r="2"></circle></svg>',
      university:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 10-10-5L2 10l10 5 10-5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>',
      work:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v16"></path></svg>'
    };
    scenarioButtons.forEach(function(btn){
      const icon = btn.querySelector('.voice-scenario-card__icon');
      icon.innerHTML = svgs[btn.dataset.scenario] || '';
    });
  }

  scenarioButtons.forEach(function(btn){
    btn.addEventListener('click', function(){ setScenario(btn.dataset.scenario); });
  });

  levelButtons.forEach(function(btn){
    btn.addEventListener('click', function(){ setLevel(btn.dataset.level); });
  });

  [optTranslation, optCorrection, optHints, optSlow].forEach(function(input){
    input.addEventListener('change', function(){
      applyOptionsFromUi();
      renderTranscript();
    });
  });

  startDialogBtn.addEventListener('click', function(){
    if (!state.scenario) return;
    setScreen('permission');
  });

  quickStartBtn.addEventListener('click', function(){
    setScenario('intro');
    setLevel('A1');
    setScreen('permission');
  });

  historyBtnHeader.addEventListener('click', function(){
    renderHistory();
    setScreen('history');
  });

  backFromHistoryBtn.addEventListener('click', function(){
    setScreen('setup');
  });

  allowMicBtn.addEventListener('click', async function(){
    const ok = await requestMicrophoneAccess();
    if (!ok) return;
    await startConversation();
  });

  micBtn.addEventListener('click', function(){
    startListening();
  });

  pauseBtn.addEventListener('click', function(){
    pauseConversation();
  });

  muteBtn.addEventListener('click', function(){
    state.muted = !state.muted;
    muteBtn.classList.toggle('is-muted', state.muted);
    if (state.muted && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  });

  endBtn.addEventListener('click', function(){
    finishConversation();
  });

  closeSummaryBtn.addEventListener('click', function(){
    closeSummary();
  });

  summaryModal.querySelector('.voice-modal__backdrop').addEventListener('click', function(){
    closeSummary();
  });

  repeatBtn.addEventListener('click', async function(){
    closeSummary();
    setScreen('permission');
  });

  newScenarioBtn.addEventListener('click', function(){
    closeSummary();
    setScreen('setup');
  });

  document.querySelectorAll('[data-help]').forEach(function(btn){
    btn.addEventListener('click', function(){
      handleHelp(btn.dataset.help);
    });
  });

  lessonModeBtn.addEventListener('click', function(){
    setScenario('university');
    setScreen('permission');
  });

  window.addEventListener('beforeunload', function(){
    stopRecognition();
    releaseMediaStream();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  });

  initScenarioIcons();
  applyOptionsFromUi();
  setScenario('intro');
  setLevel('A1');
  renderTranscript();
  updateMistakeBox();
  updateUsageBadge();
  if (!state.supportedRecognition) {
    statusLine.textContent = 'Голосовой ввод не поддерживается, будет использоваться текстовый ввод';
  }
})();
