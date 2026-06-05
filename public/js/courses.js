/*
  course.js
  - Рендерит адаптивную страницу курса (модули/уроки/прогресс)
  - Сейчас данные MOCK (как в твоём TSX проекте).
  - Когда подключишь бэк: замени loadCourse() на fetch(...) и передай данные в renderCourse().
*/

(() => {
  const el = {
    title: document.getElementById('courseTitle'),
    desc: document.getElementById('courseDesc'),
    moduleCount: document.getElementById('moduleCount'),
    lessonCount: document.getElementById('lessonCount'),
    progressValue: document.getElementById('progressValue'),
    progress: document.getElementById('progress'),
    progressBar: document.getElementById('progressBar'),
    courseNote: document.getElementById('courseNote'),
    modules: document.getElementById('modules'),
    continueBtn: document.getElementById('continueBtn'),
    restartBtn: document.getElementById('restartBtn'),
    finalTask: document.getElementById('finalTask'),
    finalBtn: document.getElementById('finalBtn'),

    state: document.getElementById('state'),
    stateTitle: document.getElementById('stateTitle'),
    stateDesc: document.getElementById('stateDesc'),
    stateAction: document.getElementById('stateAction')
  };

  const STATUS_TEXT = {
    completed: 'Завершено',
    open: 'Открыт',
    locked: 'Закрыт',
    available: 'Доступен'
  };

  function mockCourse(scenario = 'normal') {
    const modules = [
      {
        id: 'module-1',
        title: 'Модуль 1: Основы казахского языка',
        status: 'completed',
        lessons: [
          { id: 'l1-1', title: 'Урок 1: Алфавит и произношение', status: 'completed' },
          { id: 'l1-2', title: 'Урок 2: Приветствия и знакомство', status: 'completed' },
          { id: 'l1-3', title: 'Урок 3: Числа от 1 до 100', status: 'completed' },
          { id: 'l1-4', title: 'Урок 4: Базовая грамматика', status: 'completed' },
        ]
      },
      {
        id: 'module-2',
        title: 'Модуль 2: Повседневное общение',
        status: scenario === 'normal' ? 'open' : 'completed',
        lessons: [
          { id: 'l2-1', title: 'Урок 1: В магазине', status: 'completed' },
          { id: 'l2-2', title: 'Урок 2: В ресторане', status: scenario === 'normal' ? 'available' : 'completed' },
          { id: 'l2-3', title: 'Урок 3: Транспорт и направления', status: scenario === 'normal' ? 'locked' : 'completed' },
          { id: 'l2-4', title: 'Урок 4: На работе', status: scenario === 'normal' ? 'locked' : 'completed' },
        ]
      },
      {
        id: 'module-3',
        title: 'Модуль 3: Культура и традиции',
        status: scenario === 'normal' ? 'locked' : 'completed',
        lessons: [
          { id: 'l3-1', title: 'Урок 1: Казахские праздники', status: scenario === 'normal' ? 'locked' : 'completed' },
          { id: 'l3-2', title: 'Урок 2: Национальная кухня', status: scenario === 'normal' ? 'locked' : 'completed' },
          { id: 'l3-3', title: 'Урок 3: Музыка и искусство', status: scenario === 'normal' ? 'locked' : 'completed' },
          { id: 'l3-4', title: 'Урок 4: История Казахстана', status: scenario === 'normal' ? 'locked' : 'completed' },
        ]
      }
    ];

    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const completedLessons = modules.reduce((sum, m) => sum + m.lessons.filter(l => l.status === 'completed').length, 0);
    const progress = Math.round((completedLessons / Math.max(1, totalLessons)) * 100);

    return {
      title: 'A2 — Базовый уровень',
      description: 'Освойте базовые навыки казахского языка: грамматику, лексику и разговорную практику для повседневного общения.',
      moduleCount: modules.length,
      lessonCount: totalLessons,
      progress,
      modules,
      nextLessonId: scenario === 'normal' ? 'l2-2' : null,
      showFinalTask: scenario !== 'normal',
    };
  }

  function setState({ show, title, desc, actionLabel, onAction }) {
    if (!el.state) return;
    el.state.hidden = !show;
    if (!show) return;

    el.stateTitle.textContent = title || '';
    el.stateDesc.textContent = desc || '';
    el.stateAction.textContent = actionLabel || 'Ок';

    el.stateAction.onclick = () => {
      try { onAction && onAction(); } finally { /* noop */ }
    };
  }

  function pillClassByStatus(status) {
    if (status === 'completed') return 'pill pill--completed';
    if (status === 'available') return 'pill pill--available';
    if (status === 'open') return 'pill pill--open';
    return 'pill pill--locked';
  }

  function moduleStatusBadge(status) {
    if (status === 'completed') return '<span class="badge badge--success">Завершён</span>';
    if (status === 'open') return '<span class="badge badge--blue">Открыт</span>';
    return '<span class="badge">Закрыт</span>';
  }

  function renderCourse(data) {
    el.title.textContent = data.title;
    el.desc.textContent = data.description;
    el.moduleCount.textContent = String(data.moduleCount);
    el.lessonCount.textContent = String(data.lessonCount);
    el.progressValue.textContent = String(data.progress);

    el.progress.setAttribute('aria-valuenow', String(data.progress));
    el.progressBar.style.width = `${data.progress}%`;

    const completed = data.progress >= 100;
    el.courseNote.hidden = !completed;
    el.restartBtn.hidden = !completed;

    el.finalTask.hidden = !data.showFinalTask;

    el.modules.innerHTML = '';

    data.modules.forEach((m, idx) => {
      const card = document.createElement('article');
      card.className = 'module-card';

      card.innerHTML = `
        <div class="module-card__head">
          <div>
            <div class="module-card__title">${escapeHtml(m.title)}</div>
            <div class="module-card__meta">
              ${moduleStatusBadge(m.status)}
              <span class="muted">${m.lessons.length} урок(ов)</span>
            </div>
          </div>
          <button class="btn btn--small btn--ghost module-card__toggle" type="button" aria-expanded="${idx === 0 ? 'true' : 'false'}">
            <span class="module-card__toggle-text">${idx === 0 ? 'Свернуть' : 'Открыть'}</span>
          </button>
        </div>
        <div class="module-card__body" ${idx === 0 ? '' : 'hidden'}>
          <div class="lessons"></div>
        </div>
      `;

      const body = card.querySelector('.module-card__body');
      const lessonsWrap = card.querySelector('.lessons');
      const toggleBtn = card.querySelector('.module-card__toggle');
      const toggleText = card.querySelector('.module-card__toggle-text');

      m.lessons.forEach((l) => {
        const row = document.createElement('div');
        row.className = 'lesson-row';

        const locked = l.status === 'locked';
        row.innerHTML = `
          <div class="lesson-row__left">
            <div class="lesson-row__title">${escapeHtml(l.title)}</div>
            <div class="lesson-row__meta">
              <span class="${pillClassByStatus(l.status)}">${STATUS_TEXT[l.status] || l.status}</span>
            </div>
          </div>
          <div class="lesson-row__right">
            <button class="btn btn--small ${locked ? 'btn--disabled' : 'btn--primary'}" type="button" ${locked ? 'disabled' : ''} data-lesson-id="${l.id}">
              ${l.status === 'completed' ? 'Повторить' : 'Открыть'}
            </button>
          </div>
        `;

        row.querySelector('button')?.addEventListener('click', () => {
          console.log('Open lesson:', l.id);
        });

        lessonsWrap.appendChild(row);
      });

      toggleBtn.addEventListener('click', () => {
        const opened = !body.hidden;
        body.hidden = opened;
        toggleBtn.setAttribute('aria-expanded', opened ? 'false' : 'true');
        toggleText.textContent = opened ? 'Открыть' : 'Свернуть';
      });

      el.modules.appendChild(card);
    });

    el.continueBtn.onclick = () => {
      if (data.nextLessonId) {
        console.log('Continue to next lesson:', data.nextLessonId);

      } else {

        document.getElementById('finalTask')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    el.restartBtn.onclick = () => {
      console.log('Restart course');

    };

    el.finalBtn.onclick = () => {
      console.log('Start final task');

    };
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  async function loadCourse() {

    setState({ show: true, title: 'Загрузка...', desc: 'Подгружаем данные курса', actionLabel: 'Ок', onAction: null });
    el.stateAction.style.display = 'none';

    await new Promise(r => setTimeout(r, 700));

    el.stateAction.style.display = '';
    setState({ show: false });

    const params = new URLSearchParams(location.search);
    const state = params.get('state') || 'normal';

    if (state === 'error') {
      setState({
        show: true,
        title: 'Курс не найден',
        desc: 'К сожалению, запрашиваемый курс не найден или был удалён.',
        actionLabel: 'Назад',
        onAction: () => (location.href = '/index.html')
      });
      return;
    }

    if (state === 'empty') {
      setState({
        show: true,
        title: 'Пока нет модулей',
        desc: 'В этом курсе пока нет уроков. Попробуйте позже.',
        actionLabel: 'Назад',
        onAction: () => (location.href = '/index.html')
      });
      return;
    }

    const data = mockCourse(state === 'completed' ? 'completed' : 'normal');
    renderCourse(data);
  }

  loadCourse().catch((e) => {
    console.error(e);
    setState({
      show: true,
      title: 'Ошибка',
      desc: 'Что-то пошло не так при загрузке курса.',
      actionLabel: 'Обновить',
      onAction: () => location.reload()
    });
  });
})();
