(function initReadingProgress() {
    const bar = document.getElementById('readingProgressBar');
    if (!bar) return;
    function update() {
        const winH = window.innerHeight;
        const docH = document.documentElement.scrollHeight;
        const top = window.scrollY || document.documentElement.scrollTop || 0;
        const scrollable = docH - winH;
        const progress = scrollable > 0 ? (top / scrollable) * 100 : 0;
        bar.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
})();

function getLessonId() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('id');
    if (fromQuery) return fromQuery;
    const parts = window.location.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('lesson');
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
    return null;
}

function escapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function buildAchievementsText(unlocked) {
    const map = {
        FIRST_LESSON: '🏅 Достижение: Первый урок',
        FIRST_MODULE: '⭐ Достижение: Первый модуль',
        FIRST_COURSE: '🏆 Достижение: Первый курс',
    };
    const lines = (Array.isArray(unlocked) ? unlocked : []).map((code) => map[code]).filter(Boolean);
    return lines.length ? '\n\n' + lines.join('\n') : '';
}

const lessonId = getLessonId();
let courseSlug = null;
let currentLessonData = null;
let interactiveState = {
    totalSteps: 0,
    completedTheory: 0,
    completedQuizzes: {},
    aiCompleted: false,
};

if (!lessonId) {
    alert('Урок не найден');
    window.location.href = '/dashboard';
}

const lessonTitle = document.getElementById('lessonTitle');
const lessonDescription = document.getElementById('lessonDescription');
const lessonContent = document.getElementById('lessonContent');
const completeBtn = document.getElementById('completeLessonBtn');
const headerCompleteBtn = document.getElementById('headerCompleteBtn');
const completeBtnText = document.getElementById('completeBtnText');
const backBtn = document.getElementById('backBtn');
const lessonSteps = document.getElementById('lessonSteps');
const lessonStepsBars = document.getElementById('lessonStepsBars');
const lessonStepsLabel = document.getElementById('lessonStepsLabel');
const lessonSidebar = document.getElementById('lessonSidebar');
const sidebarPercent = document.getElementById('sidebarPercent');
const sidebarFill = document.getElementById('sidebarFill');
const sidebarChecklist = document.getElementById('sidebarChecklist');

const modal = document.getElementById('completionModal');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
const goCourseBtn = document.getElementById('goCourseBtn');
const goNextBtn = document.getElementById('goNextBtn');
const modalBadge = document.getElementById('modalBadge');
const modalStatus = document.getElementById('modalStatus');
const modalNextStep = document.getElementById('modalNextStep');
const modalOverlay = document.getElementById('modalOverlay');
const modalCloseBtn = document.getElementById('modalCloseBtn');

modalOverlay?.addEventListener('click', closeModal);
modalCloseBtn?.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) closeModal();
});

function setBusy(isBusy) {
    [completeBtn, headerCompleteBtn].forEach((btn) => {
        if (!btn) return;
        btn.disabled = isBusy || !canCompleteLesson();
        btn.classList.toggle('is-loading', isBusy);
    });
    if (completeBtnText) completeBtnText.textContent = isBusy ? 'Завершение...' : 'Завершить урок';
}

async function fetchFinalTaskId(courseId) {
    if (!courseId) return null;
    try {
        const taskOut = await authFetch(`/api/${courseId}/task`);
        if (taskOut?.data?.success && taskOut.data.task?.id) return taskOut.data.task.id;
    } catch (e) {
        console.error('task fetch error:', e);
    }
    return null;
}

async function fetchNextLessonId() {
    try {
        const nextOut = await authFetch('/api/continue-lesson');
        const nextData = nextOut?.data;
        if (nextData?.success && nextData.lessonId) return nextData.lessonId;
    } catch (e) {
        console.error('continue-lesson error:', e);
    }
    return null;
}

function openModal() {
    modal?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
function closeModal() {
    modal?.classList.add('hidden');
    document.body.style.overflow = 'unset';
}

function extractLessonSchema(rawContent) {
    if (!rawContent) return null;

    const match = rawContent.match(/<script[^>]*id=["']lesson-schema["'][^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/i)
        || rawContent.match(/<script[^>]*type=["']application\/json["'][^>]*id=["']lesson-schema["'][^>]*>([\s\S]*?)<\/script>/i);

    if (!match) return null;
    try {
        return JSON.parse(match[1].trim());
    } catch (e) {
        console.error('lesson schema parse error', e);
        return null;
    }
}

function stripLessonSchema(rawContent) {
    return String(rawContent || '').replace(/<script[^>]*id=["']lesson-schema["'][^>]*>[\s\S]*?<\/script>/gi, '').trim();
}

function iconSvg(type) {
    if (type === 'quiz') return '<svg viewBox="0 0 24 24" fill="none"><path d="M12 18h.01M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if (type === 'ai') return '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2l2.7 6.3L21 11l-6.3 2.7L12 20l-2.7-6.3L3 11l6.3-2.7L12 2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
    if (type === 'summary') return '<svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return '<svg viewBox="0 0 24 24" fill="none"><path d="M12 16v-4M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function buildTheorySection(block, index) {
    const examples = Array.isArray(block.examples) && block.examples.length
        ? `<div class="lesson-examples">${block.examples.map(ex => `
      <div class="lesson-example">
        <div class="lesson-example__kz">${escapeHtml(ex.kz || '')}</div>
        <div class="lesson-example__ru">${escapeHtml(ex.ru || '')}</div>
      </div>`).join('')}</div>`
        : '';

    return `
    <section class="lesson-section lesson-section--theory" data-step-type="theory" data-step-id="theory-${index}">
      <div class="lesson-block__head">
        <div class="lesson-block__icon lesson-block__icon--blue">${iconSvg('theory')}</div>
        <div>
          <h2 class="lesson-block__title">${escapeHtml(block.title || 'Теория')}</h2>
          ${block.subtitle ? `<p class="lesson-block__subtitle">${escapeHtml(block.subtitle)}</p>` : ''}
        </div>
      </div>
      <div class="lesson-theory__content">${block.content || ''}${examples}</div>
    </section>`;
}

function buildQuizSection(block, index) {
    const optionsHtml = (block.type === 'multiple-choice' && Array.isArray(block.options))
        ? `<div class="quiz-options">${block.options.map((opt, i) => `
      <button class="quiz-option" type="button" data-option-index="${i}">${escapeHtml(opt.text || '')}</button>`).join('')}</div>`
        : '';

    const wordOrderHtml = block.type === 'word-order'
        ? `
      <div class="quiz-builder" data-role="builder"><div class="quiz-builder__placeholder">Соберите предложение</div></div>
      <div class="quiz-bank">${(block.words || []).map((w, i) => `<button class="quiz-chip quiz-chip--bank" type="button" data-word-index="${i}">${escapeHtml(w)}</button>`).join('')}</div>`
        : '';

    const fillHtml = block.type === 'fill-blank'
        ? `<input class="quiz-input" data-role="input" type="text" placeholder="Введите ответ...">`
        : '';

    return `
    <section class="lesson-section lesson-section--quiz" data-step-type="quiz" data-step-id="quiz-${index}" data-quiz-index="${index}" data-quiz-type="${escapeHtml(block.type || 'multiple-choice')}">
      <div class="lesson-block__head">
        <div class="lesson-block__icon lesson-block__icon--purple">${iconSvg('quiz')}</div>
        <div>
          <h2 class="lesson-block__title">Микро-проверка</h2>
          <p class="lesson-block__subtitle">${escapeHtml(block.question || '')}</p>
        </div>
      </div>
      ${optionsHtml}
      ${wordOrderHtml}
      ${fillHtml}
      <button class="quiz-hint-toggle" type="button" data-role="hint-toggle">Показать подсказку</button>
      <div class="quiz-hint hidden" data-role="hint">${escapeHtml(block.hint || '')}</div>
      <div class="quiz-feedback hidden" data-role="feedback"></div>
      <div class="quiz-actions">
        <button class="btn btn--primary" type="button" data-role="submit">Проверить</button>
      </div>
    </section>`;
}

function buildAISection(block) {
    return `
    <section class="lesson-section lesson-section--ai" data-step-type="ai" data-step-id="ai-practice">
      <div class="lesson-block__head">
        <div class="lesson-block__icon lesson-block__icon--indigo">${iconSvg('ai')}</div>
        <div>
          <h2 class="lesson-block__title">${escapeHtml(block.title || 'Мини-практика с AI')}</h2>
          <p class="lesson-block__subtitle">${escapeHtml(block.description || 'Напишите ответ, а AI проверит его по теме урока.')}</p>
        </div>
      </div>
      <textarea class="ai-textarea" id="aiPracticeInput" placeholder="${escapeHtml(block.placeholder || 'Напишите 2–3 предложения...')}"></textarea>
      <div class="ai-submit-row">
        <button class="btn btn--primary" type="button" id="aiPracticeSubmit">Проверить с AI</button>
      </div>
      <div class="ai-feedback hidden" id="aiPracticeFeedback"></div>
    </section>`;
}

function buildSummarySection() {
    return `
    <section class="lesson-section lesson-section--summary" data-step-type="summary" data-step-id="summary">
      <div class="lesson-block__head">
        <div class="lesson-block__icon lesson-block__icon--green">${iconSvg('summary')}</div>
        <div>
          <h2 class="lesson-block__title">Итог урока</h2>
          <p class="lesson-block__subtitle">Что вы выучили, где были ошибки и что стоит повторить.</p>
        </div>
      </div>
      <div id="lessonSummaryMount"></div>
    </section>`;
}

function renderLegacyLesson(rawHtml) {
    lessonDescription.textContent = '';
    lessonContent.innerHTML = rawHtml || '<p>Нет контента</p>';
    lessonSidebar.hidden = true;
    lessonSteps.hidden = true;
    [completeBtn, headerCompleteBtn].forEach(btn => btn.disabled = false);
}

function renderInteractiveLesson(data, fallbackHtml) {
    currentLessonData = data;
    lessonDescription.textContent = data.description || '';

    const theoryBlocks = Array.isArray(data.theory) ? data.theory : [];
    const quizBlocks = Array.isArray(data.quizzes) ? data.quizzes : [];
    const aiBlock = data.aiPractice || null;

    interactiveState = {
        totalSteps: theoryBlocks.length + quizBlocks.length + (aiBlock ? 1 : 0),
        completedTheory: theoryBlocks.length,
        completedQuizzes: {},
        aiCompleted: false,
    };

    let html = '';
    theoryBlocks.forEach((block, i) => { html += buildTheorySection(block, i + 1); });
    quizBlocks.forEach((block, i) => { html += buildQuizSection(block, i + 1); });
    if (aiBlock) html += buildAISection(aiBlock);
    html += buildSummarySection();

    if (!html.trim()) {
        renderLegacyLesson(fallbackHtml);
        return;
    }

    lessonContent.innerHTML = html;
    lessonSidebar.hidden = false;
    lessonSteps.hidden = false;

    bindQuizBlocks(quizBlocks);
    bindAIBlock(aiBlock);
    renderStepBars();
    updateProgressUI();
    renderSummary();
}

function renderStepBars() {
    const current = getCompletedStepCount();
    const total = interactiveState.totalSteps || 0;
    lessonStepsBars.innerHTML = Array.from({ length: total }).map((_, index) => {
        const cls = index < current ? 'lesson-steps__bar is-done' : index === current ? 'lesson-steps__bar is-current' : 'lesson-steps__bar';
        return `<div class="${cls}"></div>`;
    }).join('');
    lessonStepsLabel.textContent = `${Math.min(current, total)}/${total}`;
}

function getCompletedStepCount() {
    const quizDone = Object.values(interactiveState.completedQuizzes).filter(Boolean).length;
    return interactiveState.completedTheory + quizDone + (interactiveState.aiCompleted ? 1 : 0);
}

function getProgressPercent() {
    const total = interactiveState.totalSteps || 0;
    if (!total) return 100;
    return Math.min(100, Math.round((getCompletedStepCount() / total) * 100));
}

function canCompleteLesson() {
    if (!currentLessonData) return true;
    return getProgressPercent() >= 80;
}

function updateProgressUI() {
    const percent = getProgressPercent();
    if (sidebarPercent) sidebarPercent.textContent = `${percent}%`;
    if (sidebarFill) sidebarFill.style.width = `${percent}%`;

    if (sidebarChecklist) {
        const quizTotal = Array.isArray(currentLessonData?.quizzes) ? currentLessonData.quizzes.length : 0;
        const quizDone = Object.values(interactiveState.completedQuizzes).filter(Boolean).length;
        const items = [
            { label: `Теория: ${interactiveState.completedTheory}/${Array.isArray(currentLessonData?.theory) ? currentLessonData.theory.length : 0}`, done: interactiveState.completedTheory > 0 },
            { label: `Микро-проверки: ${quizDone}/${quizTotal}`, done: quizTotal > 0 ? quizDone === quizTotal : true },
            { label: `AI практика`, done: !!interactiveState.aiCompleted },
        ];
        sidebarChecklist.innerHTML = items.map(item => `
      <li class="${item.done ? 'is-done' : ''}">
        <span class="lesson-sidebar__dot"></span>
        <span>${escapeHtml(item.label)}</span>
      </li>`).join('');
    }

    renderStepBars();
    [completeBtn, headerCompleteBtn].forEach((btn) => {
        if (!btn) return;
        btn.disabled = !canCompleteLesson();
    });
}

function renderSummary() {
    const mount = document.getElementById('lessonSummaryMount');
    if (!mount || !currentLessonData) return;
    const quizzes = currentLessonData.quizzes || [];
    const correctAnswers = Object.values(interactiveState.completedQuizzes).filter(Boolean).length;
    const totalQuizzes = quizzes.length || 0;
    const score = totalQuizzes ? Math.round((correctAnswers / totalQuizzes) * 100) : (interactiveState.aiCompleted ? 100 : 0);

    const learned = Array.isArray(currentLessonData.summary?.learned) ? currentLessonData.summary.learned : (currentLessonData.theory || []).map(t => t.title).filter(Boolean);
    const repeat = Array.isArray(currentLessonData.summary?.repeat) ? currentLessonData.summary.repeat : [];
    const mistakes = [];

    quizzes.forEach((q, index) => {
        if (!interactiveState.completedQuizzes[`quiz-${index + 1}`]) mistakes.push(q.question);
    });
    if (!interactiveState.aiCompleted && currentLessonData.aiPractice) mistakes.push('Практика с AI ещё не завершена');

    mount.innerHTML = `
    <div class="summary-score">
      <div class="summary-score__circle">${score}%</div>
      <div>Общий результат по уроку</div>
    </div>

    <div class="summary-grid">
      <div class="summary-stat"><div class="summary-stat__value">${correctAnswers}</div><div>Правильных ответов</div></div>
      <div class="summary-stat"><div class="summary-stat__value">${totalQuizzes}</div><div>Всего микро-проверок</div></div>
      <div class="summary-stat"><div class="summary-stat__value">${interactiveState.aiCompleted ? '✓' : '—'}</div><div>AI практика</div></div>
    </div>

    <div class="summary-card">
      <h3>Что ты выучил</h3>
      <ul class="summary-list">${learned.map(item => `<li>${escapeHtml(item)}</li>`).join('') || '<li>Тема урока изучена</li>'}</ul>
    </div>

    <div class="summary-card">
      <h3>Какие ошибки были</h3>
      <ul class="summary-list">${mistakes.length ? mistakes.map(item => `<li>${escapeHtml(item)}</li>`).join('') : '<li>Существенных ошибок не было</li>'}</ul>
    </div>

    <div class="summary-card">
      <h3>Что повторить</h3>
      <ul class="summary-list">${repeat.length ? repeat.map(item => `<li>${escapeHtml(item)}</li>`).join('') : '<li>Можно перейти к следующему уроку</li>'}</ul>
    </div>`;
}

function bindQuizBlocks(quizBlocks) {
    const sections = lessonContent.querySelectorAll('[data-step-type="quiz"]');
    sections.forEach((section) => {
        const quizIndex = Number(section.dataset.quizIndex || '0') - 1;
        const block = quizBlocks[quizIndex];
        if (!block) return;

        const submitBtn = section.querySelector('[data-role="submit"]');
        const hintToggle = section.querySelector('[data-role="hint-toggle"]');
        const hintBox = section.querySelector('[data-role="hint"]');
        const feedback = section.querySelector('[data-role="feedback"]');
        const stepId = section.dataset.stepId;
        let selectedOption = null;
        let orderedWords = [];

        hintToggle?.addEventListener('click', () => {
            hintBox?.classList.toggle('hidden');
            hintToggle.textContent = hintBox?.classList.contains('hidden') ? 'Показать подсказку' : 'Скрыть подсказку';
        });

        section.querySelectorAll('.quiz-option').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (interactiveState.completedQuizzes[stepId]) return;
                section.querySelectorAll('.quiz-option').forEach((b) => b.classList.remove('is-selected'));
                btn.classList.add('is-selected');
                selectedOption = Number(btn.dataset.optionIndex);
            });
        });

        section.querySelectorAll('[data-word-index]').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (interactiveState.completedQuizzes[stepId]) return;
                const value = block.words?.[Number(btn.dataset.wordIndex)];
                if (!value || orderedWords.includes(value)) return;
                orderedWords.push(value);
                renderWordBuilder(section, orderedWords);
            });
        });

        submitBtn?.addEventListener('click', () => {
            let correct = false;
            if (block.type === 'multiple-choice') {
                if (selectedOption === null) return;
                correct = !!block.options?.[selectedOption]?.correct;
                section.querySelectorAll('.quiz-option').forEach((btn, idx) => {
                    btn.classList.remove('is-selected');
                    if (block.options?.[idx]?.correct) btn.classList.add('is-correct');
                    if (idx === selectedOption && !block.options?.[idx]?.correct) btn.classList.add('is-wrong');
                });
            } else if (block.type === 'word-order') {
                const answer = JSON.stringify(orderedWords);
                const target = JSON.stringify(block.correctOrder || []);
                correct = answer === target;
            } else if (block.type === 'fill-blank') {
                const input = section.querySelector('[data-role="input"]');
                const value = input?.value?.trim()?.toLowerCase();
                if (!value) return;
                correct = value === String(block.correctAnswer || '').trim().toLowerCase();
                input.classList.add(correct ? 'is-correct' : 'is-wrong');
            }

            feedback.classList.remove('hidden');
            feedback.className = `quiz-feedback ${correct ? 'is-correct' : 'is-wrong'}`;
            feedback.innerHTML = `<strong>${correct ? 'Правильно!' : 'Нужно ещё раз попробовать'}</strong><div style="margin-top:8px">${escapeHtml(block.explanation || '')}</div>`;

            if (correct) {
                interactiveState.completedQuizzes[stepId] = true;
                submitBtn.outerHTML = '<div class="quiz-status-done">✓ Выполнено</div>';
                updateProgressUI();
                renderSummary();
            } else {
                submitBtn.textContent = 'Попробовать снова';
            }
        });
    });
}

function renderWordBuilder(section, orderedWords) {
    const builder = section.querySelector('[data-role="builder"]');
    if (!builder) return;
    if (!orderedWords.length) {
        builder.innerHTML = '<div class="quiz-builder__placeholder">Соберите предложение</div>';
        return;
    }
    builder.innerHTML = `<div class="quiz-chips">${orderedWords.map((word, index) => `<button class="quiz-chip quiz-chip--selected" type="button" data-remove-index="${index}">${escapeHtml(word)}</button>`).join('')}</div>`;
    builder.querySelectorAll('[data-remove-index]').forEach((btn) => {
        btn.addEventListener('click', () => {
            orderedWords.splice(Number(btn.dataset.removeIndex), 1);
            renderWordBuilder(section, orderedWords);
        });
    });
}

function buildAIMessage(aiBlock, userInput) {
    const topic = currentLessonData?.title || lessonTitle.textContent || 'урок';
    return `
Ты — преподаватель казахского языка на платформе AnaTil.
Проверь ответ ученика строго по теме урока и он должен написать на казахском.

Тема урока: ${topic}
Задание: ${aiBlock?.description || 'Проверь ответ по теме урока'}
Ответ ученика:
${userInput}

Верни ответ на русском языке в такой структуре:
1. Краткая общая оценка
2. Исправления (если есть)
3. Что получилось хорошо
4. Что повторить по теме урока
5. Улучшенный вариант ответа ученика

Не пиши слишком длинно. Будь конкретным и дружелюбным.`.trim();
}

function bindAIBlock(aiBlock) {
    if (!aiBlock) return;
    const input = document.getElementById('aiPracticeInput');
    const submit = document.getElementById('aiPracticeSubmit');
    const feedback = document.getElementById('aiPracticeFeedback');
    if (!input || !submit || !feedback) return;

    submit.addEventListener('click', async () => {
        const text = input.value.trim();
        if (!text) return;

        submit.disabled = true;
        submit.textContent = 'Проверяем с AI...';

        try {
            const out = await authFetch('/api/ai/chat', {
                method: 'POST',
                body: JSON.stringify({ message: buildAIMessage(aiBlock, text) }),
            });

            const reply = out?.data?.reply || out?.data?.details || 'AI пока не смог проверить ответ.';
            feedback.classList.remove('hidden');
            feedback.innerHTML = `
        <div class="ai-overall"><strong>AI проверил ответ</strong><div style="margin-top:8px;white-space:pre-line">${escapeHtml(reply)}</div></div>
        <div class="ai-card">
          <strong>Совет</strong>
          <div style="margin-top:8px;color:#475569">Попробуй переписать ответ ещё раз с учётом замечаний — это хорошо закрепляет тему урока.</div>
        </div>`;

            interactiveState.aiCompleted = true;
            updateProgressUI();
            renderSummary();
        } catch (e) {
            console.error('AI practice error', e);
            feedback.classList.remove('hidden');
            feedback.innerHTML = '<div class="ai-card">Не удалось получить ответ от AI. Проверь подключение API и маршрут /api/ai/chat.</div>';
        } finally {
            submit.disabled = false;
            submit.textContent = 'Проверить с AI';
        }
    });
}

async function loadLesson() {
    try {
        const out = await authFetch(`/api/lesson/${encodeURIComponent(lessonId)}`);
        if (!out) return;

        const data = out.data;
        if (!data?.success) {
            alert(data?.message || 'Нет доступа к уроку');
            window.location.href = '/dashboard';
            return;
        }

        const rawContent = data.lesson?.content || '';
        const parsedSchema = extractLessonSchema(rawContent);
        const legacyContent = stripLessonSchema(rawContent) || '<p>Нет контента</p>';

        lessonTitle.textContent = (parsedSchema?.title || data.lesson?.title || 'Урок');
        courseSlug = data.lesson?.courseSlug || null;

        if (parsedSchema) {
            renderInteractiveLesson(parsedSchema, legacyContent);
        } else {
            renderLegacyLesson(legacyContent);
        }
    } catch (err) {
        console.error('loadLesson error:', err);
        alert('Ошибка загрузки урока');
    }
}

async function completeLesson() {
    if (completeBtn?.disabled) return;
    try {
        setBusy(true);

        const out = await authFetch('/api/lesson/complete', {
            method: 'POST',
            body: JSON.stringify({ lessonId: Number(lessonId) }),
        });
        if (!out) return;

        const data = out.data;
        if (!data?.success) {
            alert('Ошибка завершения урока');
            setBusy(false);
            return;
        }

        openModal();
        goCourseBtn.onclick = null;
        goNextBtn.onclick = null;

        goCourseBtn.style.display = 'inline-flex';
        goCourseBtn.disabled = false;
        goCourseBtn.textContent = 'К курсу';
        goCourseBtn.onclick = () => {
            window.location.href = courseSlug ? `/courses/${courseSlug}` : '/dashboard';
        };

        if (data.courseCompleted) {
            modalTitle.textContent = 'Курс завершён';
            modalText.textContent = 'Вы прошли все уроки курса. Теперь можно перейти к итоговому заданию.' + buildAchievementsText(data.unlocked);
            modalBadge.textContent = 'Поздравляем';
            modalStatus.textContent = 'Курс пройден';
            modalNextStep.textContent = 'Открыть итоговое задание';

            goNextBtn.style.display = 'inline-flex';
            goNextBtn.disabled = true;
            goNextBtn.textContent = 'Итоговое задание';

            const taskId = await fetchFinalTaskId(data.courseId);
            if (taskId) {
                goNextBtn.disabled = false;
                goNextBtn.onclick = () => {
                    window.location.href = `/finallytask.html?taskId=${taskId}`;
                };
            } else {
                goNextBtn.style.display = 'none';
            }
            return;
        }

        modalTitle.textContent = data.moduleCompleted ? 'Модуль завершён' : 'Урок завершён';
        modalText.textContent = (data.moduleCompleted ? 'Отличная работа! Следующий модуль уже открыт.' : 'Отличная работа! Можно перейти к следующему уроку.') + buildAchievementsText(data.unlocked);
        modalBadge.textContent = data.moduleCompleted ? 'Новый модуль открыт' : 'Урок пройден';
        modalStatus.textContent = data.moduleCompleted ? 'Модуль завершён' : 'Урок завершён';
        modalNextStep.textContent = 'Перейти к следующему уроку';

        goNextBtn.style.display = 'inline-flex';
        goNextBtn.disabled = true;
        goNextBtn.textContent = 'Следующий урок';

        const nextLessonId = await fetchNextLessonId();
        if (nextLessonId) {
            goNextBtn.disabled = false;
            goNextBtn.onclick = () => { window.location.href = `/lesson/${nextLessonId}`; };
        } else {
            goNextBtn.style.display = 'none';
        }
    } catch (err) {
        console.error('complete lesson error:', err);
        alert('Ошибка завершения урока');
    } finally {
        setBusy(false);
    }
}

completeBtn?.addEventListener('click', completeLesson);
headerCompleteBtn?.addEventListener('click', completeLesson);
backBtn?.addEventListener('click', () => {
    window.location.href = courseSlug ? `/courses/${courseSlug}` : '/dashboard';
});

loadLesson();