(() => {
  const root = document.getElementById('progress');
  if (!root) return;

  const states = Array.from(root.querySelectorAll('.progress__state'));
  const startTestBtn = document.getElementById('startTestBtn');

  const el = {
    progressCard: document.getElementById('progressCard'),
    modulesList: document.getElementById('modulesList'),
    activityList: document.getElementById('activityList'),
    achievementsList: document.getElementById('achievementsList'),
    emptyIcon: document.getElementById('emptyIcon'),
  };


  const svg = {
    book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
    timer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2h4"/><path d="M12 14v-4"/><path d="M12 14l2 2"/><circle cx="12" cy="14" r="8"/></svg>`,
    lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    award: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M15.5 13.5L17 22l-5-2-5 2 1.5-8.5"/></svg>`,
    star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l3.1 6.3 7 .9-5.1 4.9 1.3 6.9L12 18.8 5.7 21 7 14.1 1.9 9.2l7-.9L12 2z"/></svg>`,
    trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h8v4a4 4 0 0 1-8 0V4z"/><path d="M6 4H4a2 2 0 0 0 0 4h2"/><path d="M18 4h2a2 2 0 0 1 0 4h-2"/><path d="M12 12v4"/><path d="M8 20h8"/><path d="M9 16h6"/></svg>`,
  };

  // --- Mock data (как в TSX) ---
  const mockData = {
    course: {
      name: 'A2 — Базовый уровень',
      level: 'A2',
      status: 'в процессе',
      progress: 35,
      lessonsCompleted: 7,
      totalLessons: 20,
    },
    activity: [
      { icon: 'book', label: 'Последний пройденный урок', value: 'Урок 7: Прошедшее время' },
      { icon: 'clock', label: 'Следующий урок', value: 'Урок 8: Будущее время' },
      { icon: 'calendar', label: 'Последняя дата обучения', value: '2 февраля 2026' },
      { icon: 'timer', label: 'Время обучения за неделю', value: '3 часа 45 минут' },
    ],
    modules: [
      { number: 1, name: 'Модуль 1: Основы грамматики', progress: 80 },
      { number: 2, name: 'Модуль 2: Времена глаголов', progress: 20 },
      { number: 3, name: 'Модуль 3: Разговорная практика', progress: 0, locked: true },
      { number: 4, name: 'Модуль 4: Письменная речь', progress: 0, locked: true },
    ],
    achievements: [
      { icon: 'award', title: 'Первый урок', description: 'Начало пути' },
      { icon: 'star', title: '5 уроков', description: 'Отличный старт' },
      { icon: 'trophy', title: 'Тест пройден', description: 'Первый успех' },
    ],
  };


  function setState(name) {
    states.forEach((s) => (s.hidden = s.dataset.state !== name));
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function renderProgressCard(course) {
    if (!el.progressCard) return;
    const p = clamp(Number(course.progress) || 0, 0, 100);

    el.progressCard.innerHTML = `
      <h2 class="progress-card__title">${escapeHtml(course.name || '')}</h2>

      <div class="badges">
        <span class="badge badge--primary">Уровень: ${escapeHtml(course.level || '')}</span>
        <span class="badge badge--success">Статус: ${escapeHtml(course.status || '')}</span>
      </div>

      <div class="progressbar">
        <div class="progressbar__top">
          <span class="progressbar__label">Прогресс курса</span>
          <span class="progressbar__value">${p}%</span>
        </div>

        <div class="progressbar__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}">
          <div class="progressbar__fill" style="width:${p}%"></div>
        </div>

        <p class="progressbar__hint">Пройдено уроков: ${Number(course.lessonsCompleted) || 0} из ${Number(course.totalLessons) || 0}</p>
      </div>

      <button class="btn btn--primary btn--full" type="button" id="continueBtn">Перейти к курсу</button>
    `;

    const btn = document.getElementById('continueBtn');
    if (btn) {
      btn.addEventListener('click', () => {

        console.log('Переход к курсу');
      });
    }
  }

  function renderModules(modules) {
    if (!el.modulesList) return;

    el.modulesList.innerHTML = modules
      .map((m) => {
        const locked = !!m.locked;
        const p = clamp(Number(m.progress) || 0, 0, 100);

        return `
          <div class="module ${locked ? 'module--locked' : ''}">
            <div class="module__top">
              <div class="module__left">
                <div class="module__badge ${locked ? 'module__badge--locked' : ''}" aria-hidden="true">
                  ${locked ? `<span style="color:#9CA3AF">${svg.lock}</span>` : `<span class="module__num">${Number(m.number) || 0}</span>`}
                </div>
                <h3 class="module__name">${escapeHtml(m.name || '')}</h3>
              </div>
              ${locked ? '' : `<span class="module__percent">${p}%</span>`}
            </div>

            ${locked
              ? `<p class="module__locked-text">Модуль закрыт</p>`
              : `<div class="progressbar__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}">
                   <div class="progressbar__fill" style="width:${p}%"></div>
                 </div>`}
          </div>
        `;
      })
      .join('');
  }

  function renderActivity(items) {
    if (!el.activityList) return;

    el.activityList.innerHTML = items
      .map((it) => {
        const iconSvg = svg[it.icon] || svg.clock;
        return `
          <div class="divider-list__item">
            <div class="icon" aria-hidden="true" style="color: var(--primary)">${iconSvg}</div>
            <div style="min-width:0;flex:1">
              <p class="activity__label">${escapeHtml(it.label || '')}</p>
              <p class="activity__value" title="${escapeAttr(it.value || '')}">${escapeHtml(it.value || '')}</p>
            </div>
          </div>
        `;
      })
      .join('');
  }

  function renderAchievements(items) {
    if (!el.achievementsList) return;

    el.achievementsList.innerHTML = items
      .map((a) => {
        const iconSvg = svg[a.icon] || svg.award;
        return `
          <div class="ach">
            <div class="ach__row">
              <div class="ach__icon" aria-hidden="true" style="color: var(--primary)">${iconSvg}</div>
              <div style="min-width:0;flex:1">
                <p class="ach__title">${escapeHtml(a.title || '')}</p>
                ${a.description ? `<p class="ach__desc">${escapeHtml(a.description)}</p>` : ''}
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  function renderEmpty() {
    if (el.emptyIcon) el.emptyIcon.innerHTML = `<span style="color: var(--primary)">${svg.book}</span>`;

    if (startTestBtn) {
      startTestBtn.addEventListener('click', () => {

        console.log('Начать тест');
      });
    }
  }

  function renderNormal(data) {
    renderProgressCard(data.course);
    renderModules(data.modules || []);
    renderActivity(data.activity || []);
    renderAchievements(data.achievements || []);
  }


  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
  function escapeAttr(str) {
    return escapeHtml(str).replaceAll('\n', ' ');
  }


  const params = new URLSearchParams(window.location.search);
  const state = (params.get('state') || 'normal').toLowerCase();

  if (state === 'loading') {
    setState('loading');
    return;
  }

  if (state === 'empty') {
    renderEmpty();
    setState('empty');
    return;
  }


  renderNormal(mockData);
  setState('normal');
})();
