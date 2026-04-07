(function(){
  const scenarios = {
    intro:{title:'Знакомство',description:'Знакомься, рассказывай о себе'},
    cafe:{title:'Кафе',description:'Заказывай еду и напитки'},
    shop:{title:'Магазин',description:'Покупай продукты и товары'},
    taxi:{title:'Такси',description:'Вызывай такси и общайся с водителем'},
    university:{title:'Университет',description:'Учебные ситуации и разговоры'},
    work:{title:'Работа',description:'Рабочие моменты и деловая беседа'}
  };

  const historyItems = [
    {scenario:'Знакомство',level:'A1',date:'7 апреля 2026',duration:'5 мин 30 сек',phrases:12,status:'completed'},
    {scenario:'Кафе',level:'A1',date:'6 апреля 2026',duration:'4 мин 15 сек',phrases:10,status:'completed'},
    {scenario:'Магазин',level:'A2',date:'5 апреля 2026',duration:'3 мин 20 сек',phrases:8,status:'incomplete'}
  ];

  const state = {
    scenario:null,
    level:'A1',
    screen:'setup',
    status:'listening',
    paused:false,
    messages:[
      {sender:'ai',text:'Сәлеметсіз бе! Мен сіздің виртуалды репетітормін. Өзіңізді таныстырыңыз.',translation:'Здравствуйте! Я ваш виртуальный репетитор. Представьтесь, пожалуйста.'}
    ]
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
  let aiTimers = [];

  function setScreen(name){
    state.screen = name;
    [setupScreen, historyScreen, permissionScreen, conversationScreen].forEach(el => el.classList.remove('voice-screen--active'));
    if(name === 'setup') setupScreen.classList.add('voice-screen--active');
    if(name === 'history') historyScreen.classList.add('voice-screen--active');
    if(name === 'permission') permissionScreen.classList.add('voice-screen--active');
    if(name === 'conversation') conversationScreen.classList.add('voice-screen--active');
  }

  function setScenario(id){
    state.scenario = id;
    scenarioButtons.forEach(btn => btn.classList.toggle('is-selected', btn.dataset.scenario === id));
    startDialogBtn.disabled = !id;
  }

  function setLevel(level){
    state.level = level;
    levelButtons.forEach(btn => btn.classList.toggle('is-active', btn.dataset.level === level));
  }

  function renderHistory(){
    if(!historyItems.length){
      historyList.innerHTML = '<div class="voice-empty-card"><div class="voice-empty-card__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div><h3>История пуста</h3><p>Вы ещё не провели ни одного голосового диалога. Начните практику, чтобы увидеть вашу историю разговоров.</p><button class="voice-btn voice-btn--primary" type="button" id="startFirstDialogBtn">Начать первый диалог</button></div>';
      document.getElementById('startFirstDialogBtn').addEventListener('click', function(){ setScreen('setup'); });
      return;
    }
    historyList.innerHTML = historyItems.map(item => {
      const done = item.status === 'completed';
      return '<article class="voice-history-item"><div class="voice-history-item__row"><div><div class="voice-history-item__top"><h3 class="voice-history-item__title">'+item.scenario+'</h3><span class="voice-tiny-chip">'+item.level+'</span><span class="voice-state-chip '+(done?'voice-state-chip--done':'voice-state-chip--pending')+'">'+(done?'Завершён':'Не завершён')+'</span></div><p class="voice-history-item__date">'+item.date+'</p><div class="voice-history-item__meta"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>'+item.duration+'</span><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'+item.phrases+' фраз</span></div></div><button class="voice-btn voice-btn--outline" type="button">Посмотреть</button></div></article>';
    }).join('');
  }

  function setConversationMeta(){
    const title = state.scenario ? scenarios[state.scenario].title : 'Знакомство';
    conversationScenario.textContent = title;
    supportScenarioText.textContent = title;
    conversationLevel.textContent = state.level;
    supportLevelText.textContent = state.level;
    summaryScenario.textContent = title;
  }

  function setStatus(status){
    state.status = status;
    statusPill.className = 'voice-status-pill';
    micBtn.classList.remove('is-listening','is-disabled');
    waveform.classList.remove('is-active');
    if(status === 'listening'){
      statusPill.classList.add('is-listening');
      statusPill.querySelector('.voice-status-pill__text').textContent = 'Слушаю';
      statusLine.textContent = 'Нажмите кнопку микрофона и говорите';
      micBtn.classList.add('is-listening');
      waveform.classList.add('is-active');
    }
    if(status === 'processing'){
      statusPill.classList.add('is-processing');
      statusPill.querySelector('.voice-status-pill__text').textContent = 'Обрабатываю';
      statusLine.textContent = 'Обрабатываю вашу речь...';
      micBtn.classList.add('is-disabled');
    }
    if(status === 'ai'){
      statusPill.classList.add('is-ai');
      statusPill.querySelector('.voice-status-pill__text').textContent = 'ИИ отвечает';
      statusLine.textContent = 'ИИ формирует ответ...';
      micBtn.classList.add('is-disabled');
      waveform.classList.add('is-active');
    }
    if(status === 'paused'){
      statusPill.classList.add('is-paused');
      statusPill.querySelector('.voice-status-pill__text').textContent = 'Пауза';
      statusLine.textContent = 'Диалог на паузе';
      micBtn.classList.add('is-disabled');
    }
  }

  function clearAiTimers(){
    aiTimers.forEach(clearTimeout);
    aiTimers = [];
  }

  function renderTranscript(){
    transcriptList.innerHTML = state.messages.map((message, index) => {
      const isUser = message.sender === 'user';
      return '<div class="voice-transcript-item '+(isUser?'is-user':'is-ai')+'"><div class="voice-transcript-stack"><div class="voice-transcript-role">'+(isUser?'Вы':'ИИ репетитор')+'</div><div class="voice-bubble">'+message.text+'</div>'+(isUser && (message.correction || message.translation || message.explanation) ? '<div class="voice-bubble-actions">'+(message.correction?'<button class="voice-bubble-chip voice-bubble-chip--orange" data-toggle="correction-'+index+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg><span>Показать исправление</span><svg class="voice-bubble-chip__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"></path></svg></button>':'')+(message.translation?'<button class="voice-bubble-chip voice-bubble-chip--blue" data-toggle="translation-'+index+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path></svg><span>Перевод</span><svg class="voice-bubble-chip__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"></path></svg></button>':'')+(message.explanation?'<button class="voice-bubble-chip voice-bubble-chip--purple" data-toggle="explanation-'+index+'"><span>Почему это ошибка?</span><svg class="voice-bubble-chip__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"></path></svg></button>':'')+'</div>':'')+(message.correction?'<div class="voice-extra-box voice-extra-box--orange" id="correction-'+index+'"><strong>Исправление:</strong><span>'+message.correction+'</span></div>':'')+(message.translation?'<div class="voice-extra-box voice-extra-box--blue" id="translation-'+index+'"><strong>Перевод:</strong><span>'+message.translation+'</span></div>':'')+(message.explanation?'<div class="voice-extra-box voice-extra-box--purple" id="explanation-'+index+'"><strong>Объяснение:</strong><span>'+message.explanation+'</span></div>':'')+'</div></div>';
    }).join('');
    transcriptList.scrollTop = transcriptList.scrollHeight;
    transcriptList.querySelectorAll('[data-toggle]').forEach(function(btn){
      btn.addEventListener('click', function(){
        const id = btn.getAttribute('data-toggle');
        const box = document.getElementById(id);
        if(!box) return;
        const open = box.classList.toggle('is-open');
        btn.classList.toggle('is-open', open);
      });
    });
  }

  function startConversation(){
    setConversationMeta();
    setScreen('conversation');
    setStatus('listening');
    state.messages = [{sender:'ai',text:'Сәлеметсіз бе! Мен сіздің виртуалды репетітормін. Өзіңізді таныстырыңыз.',translation:'Здравствуйте! Я ваш виртуальный репетитор. Представьтесь, пожалуйста.'}];
    renderTranscript();
  }

  function simulateTurn(){
    if(state.status !== 'listening') return;
    setStatus('processing');
    state.messages.push({sender:'user',text:'Менің атым Алексей. Мен студентмін.',translation:'Меня зовут Алексей. Я студент.',correction:'Менің атым Алексей. Мен студент боламын.',explanation:'В казахском языке для профессии используется более естественная форма с глаголом.'});
    renderTranscript();
    clearAiTimers();
    aiTimers.push(setTimeout(function(){
      setStatus('ai');
      aiTimers.push(setTimeout(function(){
        state.messages.push({sender:'ai',text:'Жақсы! Сіз қайдан келдіңіз?',translation:'Хорошо! Откуда вы?'});
        renderTranscript();
        setStatus('listening');
      }, 3000));
    }, 2000));
  }

  function closeSummary(){
    summaryModal.hidden = true;
    document.body.style.overflow = '';
  }

  function openSummary(){
    clearAiTimers();
    summaryModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  scenarioButtons.forEach(function(btn){
    const icon = btn.querySelector('.voice-scenario-card__icon');
    const type = btn.dataset.scenario;
    const svgs = {
      intro:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><path d="M20 8v6"></path><path d="M23 11h-6"></path></svg>',
      cafe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><line x1="6" y1="2" x2="6" y2="4"></line><line x1="10" y1="2" x2="10" y2="4"></line><line x1="14" y1="2" x2="14" y2="4"></line></svg>',
      shop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
      taxi:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 16H9m10-5-1.5-4.5A2 2 0 0 0 15.6 5H8.4a2 2 0 0 0-1.9 1.5L5 11m14 0H5m14 0v5a1 1 0 0 1-1 1h-1m-12-6v5a1 1 0 0 0 1 1h1"></path><circle cx="7" cy="16" r="2"></circle><circle cx="17" cy="16" r="2"></circle></svg>',
      university:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 10-10-5L2 10l10 5 10-5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>',
      work:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v16"></path></svg>'
    };
    icon.innerHTML = svgs[type] || '';
    btn.addEventListener('click', function(){ setScenario(type); });
  });

  levelButtons.forEach(function(btn){
    btn.addEventListener('click', function(){ setLevel(btn.dataset.level); });
  });

  startDialogBtn.addEventListener('click', function(){ if(state.scenario) setScreen('permission'); });
  quickStartBtn.addEventListener('click', function(){ setScenario('intro'); setLevel('A1'); setScreen('permission'); });
  historyBtnHeader.addEventListener('click', function(){ renderHistory(); setScreen('history'); });
  backFromHistoryBtn.addEventListener('click', function(){ setScreen('setup'); });
  allowMicBtn.addEventListener('click', function(){
    permissionError.hidden = true;
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
      navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
        stream.getTracks().forEach(function(track){ track.stop(); });
        startConversation();
      }).catch(function(){
        permissionError.textContent = 'Не удалось получить доступ к микрофону. Проверьте настройки браузера.';
        permissionError.hidden = false;
      });
    } else {
      startConversation();
    }
  });

  micBtn.addEventListener('click', function(){ if(state.status !== 'paused') simulateTurn(); });
  pauseBtn.addEventListener('click', function(){
    state.paused = !state.paused;
    if(state.paused){ clearAiTimers(); setStatus('paused'); pauseBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>'; }
    else { setStatus('listening'); pauseBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"></path></svg>'; }
  });
  muteBtn.addEventListener('click', function(){ muteBtn.classList.toggle('is-muted'); });
  endBtn.addEventListener('click', openSummary);
  closeSummaryBtn.addEventListener('click', closeSummary);
  summaryModal.querySelector('.voice-modal__backdrop').addEventListener('click', closeSummary);
  repeatBtn.addEventListener('click', function(){ closeSummary(); setScreen('permission'); });
  newScenarioBtn.addEventListener('click', function(){ closeSummary(); setScreen('setup'); });

  document.querySelectorAll('[data-help]').forEach(function(btn){
    btn.addEventListener('click', function(){
      const map = {
        example:'Пример ответа: Мен Алматыдан келдім — Я приехал из Алматы',
        explain:'В казахском языке глагол обычно идёт в конце предложения',
        simplify:'Давайте попробуем более простые фразы'
      };
      state.messages.push({sender:'ai',text:map[btn.dataset.help]});
      renderTranscript();
    });
  });

  setLevel('A1');
  renderTranscript();
})();
