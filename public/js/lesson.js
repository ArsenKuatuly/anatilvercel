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

    const lines = (Array.isArray(unlocked) ? unlocked : [])
        .map((code) => map[code])
        .filter(Boolean);

    return lines.length ? '\n\n' + lines.join('\n') : '';
}

function extractLessonSchema(rawContent) {
    if (!rawContent) return null;

    const match =
        rawContent.match(/<script[^>]*id=["']lesson-schema["'][^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/i) ||
        rawContent.match(/<script[^>]*type=["']application\/json["'][^>]*id=["']lesson-schema["'][^>]*>([\s\S]*?)<\/script>/i);

    if (!match) return null;

    try {
        return JSON.parse(match[1].trim());
    } catch (e) {
        console.error('lesson schema parse error:', e);
        return null;
    }
}

function stripLessonSchema(rawContent) {
    return String(rawContent || '').replace(/<script[^>]*id=["']lesson-schema["'][^>]*>[\s\S]*?<\/script>/gi, '').trim();
}

const lessonId = getLessonId();
let courseSlug = null;

const lessonTitle = document.getElementById('lessonTitle');
const lessonContent = document.getElementById('lessonContent');
const completeBtn = document.getElementById('completeLessonBtn');
const completeBtnText = document.getElementById('completeBtnText');
const backBtn = document.getElementById('backBtn');

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

if (!lessonId) {
    alert('Урок не найден');
    window.location.href = '/dashboard';
}

function openModal() {
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = 'unset';
}

modalOverlay?.addEventListener('click', closeModal);
modalCloseBtn?.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
        closeModal();
    }
});

function setBusy(isBusy) {
    if (completeBtn) {
        completeBtn.disabled = isBusy;
        completeBtn.classList.toggle('is-loading', isBusy);
    }
    if (completeBtnText) {
        completeBtnText.textContent = isBusy ? 'Завершение...' : 'Завершить урок';
    }
}

function renderLegacyLesson(rawHtml) {
    lessonContent.innerHTML = rawHtml || '<p>Нет контента</p>';
}

function renderInteractiveLesson(data, fallbackHtml) {
    const theoryBlocks = Array.isArray(data.theory) ? data.theory : [];
    const quizBlocks = Array.isArray(data.quizzes) ? data.quizzes : [];
    const aiBlock = data.aiPractice || null;
    const summary = data.summary || null;

    let html = '';

    if (data.description) {
        html += `
      <section class="lesson-section">
        <div class="lesson-note">${escapeHtml(data.description)}</div>
      </section>
    `;
    }

    theoryBlocks.forEach((block) => {
        html += `
      <section class="lesson-section">
        <h2>${escapeHtml(block.title || 'Теория')}</h2>
        ${block.subtitle ? `<p><strong>${escapeHtml(block.subtitle)}</strong></p>` : ''}
        <div>${block.content || ''}</div>
        ${
            Array.isArray(block.examples) && block.examples.length
                ? `
              <div class="lesson-examples">
                ${block.examples.map((ex) => `
                  <div class="lesson-example">
                    <div><strong>${escapeHtml(ex.kz || '')}</strong></div>
                    <div>${escapeHtml(ex.ru || '')}</div>
                  </div>
                `).join('')}
              </div>
            `
                : ''
        }
      </section>
    `;
    });

    quizBlocks.forEach((block, index) => {
        if (block.type === 'multiple-choice') {
            html += `
        <section class="lesson-section">
          <h2>Микро-проверка ${index + 1}</h2>
          <p>${escapeHtml(block.question || '')}</p>
          <div class="quiz-options">
            ${(block.options || []).map((opt, i) => `
              <button class="quiz-option" type="button" data-quiz="${index}" data-option="${i}">
                ${escapeHtml(opt.text || '')}
              </button>
            `).join('')}
          </div>
          <div class="quiz-feedback hidden" id="quizFeedback${index}"></div>
        </section>
      `;
        }

        if (block.type === 'fill-blank') {
            html += `
        <section class="lesson-section">
          <h2>Микро-проверка ${index + 1}</h2>
          <p>${escapeHtml(block.question || '')}</p>
          <input class="quiz-input" id="quizInput${index}" type="text" placeholder="Введите ответ">
          <button class="btn btn--primary" type="button" data-fill-submit="${index}">Проверить</button>
          <div class="quiz-feedback hidden" id="quizFeedback${index}"></div>
        </section>
      `;
        }

        if (block.type === 'word-order') {
            html += `
        <section class="lesson-section">
          <h2>Микро-проверка ${index + 1}</h2>
          <p>${escapeHtml(block.question || '')}</p>
          <div class="lesson-note">Пока для word-order лучше оставить как текстовую проверку или реализовать отдельно.</div>
          <div>${(block.words || []).map(w => `<span class="quiz-chip">${escapeHtml(w)}</span>`).join(' ')}</div>
        </section>
      `;
        }
    });

    if (aiBlock) {
        html += `
      <section class="lesson-section">
        <h2>${escapeHtml(aiBlock.title || 'Мини-практика с AI')}</h2>
        <p>${escapeHtml(aiBlock.description || '')}</p>
        <textarea class="ai-textarea" id="aiPracticeInput" placeholder="${escapeHtml(aiBlock.placeholder || 'Напишите ответ...')}"></textarea>
        <div style="margin-top:12px;">
          <button class="btn btn--primary" type="button" id="aiPracticeSubmit">Проверить с AI</button>
        </div>
        <div class="ai-feedback hidden" id="aiPracticeFeedback"></div>
      </section>
    `;
    }

    if (summary) {
        html += `
      <section class="lesson-section">
        <h2>Итог урока</h2>
        ${
            Array.isArray(summary.learned) && summary.learned.length
                ? `<div class="summary-card"><h3>Что ты выучил</h3><ul class="summary-list">${summary.learned.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`
                : ''
        }
        ${
            Array.isArray(summary.repeat) && summary.repeat.length
                ? `<div class="summary-card"><h3>Что повторить</h3><ul class="summary-list">${summary.repeat.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`
                : ''
        }
      </section>
    `;
    }

    if (!html.trim()) {
        renderLegacyLesson(fallbackHtml);
        return;
    }

    lessonContent.innerHTML = html;

    bindQuizBlocks(quizBlocks);
    bindAIBlock(aiBlock);
}

function bindQuizBlocks(quizBlocks) {
    document.querySelectorAll('.quiz-option').forEach((btn) => {
        btn.addEventListener('click', () => {
            const quizIndex = Number(btn.dataset.quiz);
            const optionIndex = Number(btn.dataset.option);
            const block = quizBlocks[quizIndex];
            const feedback = document.getElementById(`quizFeedback${quizIndex}`);
            if (!block || !feedback) return;

            const correct = !!block.options?.[optionIndex]?.correct;

            document.querySelectorAll(`.quiz-option[data-quiz="${quizIndex}"]`).forEach((b, idx) => {
                b.classList.remove('is-selected', 'is-correct', 'is-wrong');
                if (block.options?.[idx]?.correct) b.classList.add('is-correct');
            });

            if (correct) {
                btn.classList.add('is-correct');
            } else {
                btn.classList.add('is-wrong');
            }

            feedback.classList.remove('hidden');
            feedback.className = `quiz-feedback ${correct ? 'is-correct' : 'is-wrong'}`;
            feedback.innerHTML = `
        <strong>${correct ? 'Правильно!' : 'Неправильно'}</strong>
        <div style="margin-top:8px;">${escapeHtml(block.explanation || '')}</div>
      `;
        });
    });

    document.querySelectorAll('[data-fill-submit]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const quizIndex = Number(btn.dataset.fillSubmit);
            const block = quizBlocks[quizIndex];
            const input = document.getElementById(`quizInput${quizIndex}`);
            const feedback = document.getElementById(`quizFeedback${quizIndex}`);
            if (!block || !input || !feedback) return;

            const value = input.value.trim().toLowerCase();
            const correct = value === String(block.correctAnswer || '').trim().toLowerCase();

            input.classList.remove('is-correct', 'is-wrong');
            input.classList.add(correct ? 'is-correct' : 'is-wrong');

            feedback.classList.remove('hidden');
            feedback.className = `quiz-feedback ${correct ? 'is-correct' : 'is-wrong'}`;
            feedback.innerHTML = `
        <strong>${correct ? 'Правильно!' : 'Неправильно'}</strong>
        <div style="margin-top:8px;">${escapeHtml(block.explanation || '')}</div>
      `;
        });
    });
}

function buildAIMessage(aiBlock, userInput) {
    const topic = lessonTitle?.textContent || 'урок';

    return `
Ты — преподаватель казахского языка на платформе AnaTil.
Проверь ответ ученика строго по теме урока.

Тема урока: ${topic}
Задание: ${aiBlock?.description || 'Проверь ответ по теме урока'}
Ответ ученика:
${userInput}

Верни ответ на русском языке в такой структуре:
1. Краткая общая оценка
2. Исправления
3. Что получилось хорошо
4. Что повторить
5. Улучшенный вариант ответа

Пиши коротко и понятно.
  `.trim();
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
        submit.textContent = 'Проверяем...';

        try {
            const out = await authFetch('/api/ai/chat', {
                method: 'POST',
                body: JSON.stringify({
                    message: buildAIMessage(aiBlock, text),
                }),
            });

            const reply = out?.data?.reply || out?.data?.details || 'AI пока не смог проверить ответ.';
            feedback.classList.remove('hidden');
            feedback.innerHTML = `
        <div class="ai-card">
          <strong>Ответ AI</strong>
          <div style="margin-top:8px;white-space:pre-line;">${escapeHtml(reply)}</div>
        </div>
      `;
        } catch (e) {
            console.error('AI practice error:', e);
            feedback.classList.remove('hidden');
            feedback.innerHTML = `<div class="ai-card">Ошибка AI-проверки</div>`;
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

        if (lessonTitle) {
            lessonTitle.textContent = parsedSchema?.title || data.lesson?.title || 'Урок';
        }

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

async function fetchFinalTaskId(courseId) {
    if (!courseId) return null;
    try {
        const taskOut = await authFetch(`/api/course/${courseId}/task`);
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
            return;
        }

        openModal();

        if (goCourseBtn) {
            goCourseBtn.onclick = () => {
                window.location.href = courseSlug ? `/courses/${courseSlug}` : '/dashboard';
            };
        }

        if (data.courseCompleted) {
            if (modalTitle) modalTitle.textContent = 'Курс завершён';
            if (modalText) modalText.textContent = 'Вы прошли все уроки курса. Теперь можно перейти к итоговому заданию.' + buildAchievementsText(data.unlocked);
            if (modalBadge) modalBadge.textContent = 'Поздравляем';
            if (modalStatus) modalStatus.textContent = 'Курс пройден';
            if (modalNextStep) modalNextStep.textContent = 'Открыть итоговое задание';

            if (goNextBtn) {
                goNextBtn.style.display = 'inline-flex';
                goNextBtn.disabled = true;
                goNextBtn.textContent = 'Итоговое задание';
            }

            const taskId = await fetchFinalTaskId(data.courseId);

            if (taskId && goNextBtn) {
                goNextBtn.disabled = false;
                goNextBtn.onclick = () => {
                    window.location.href = `/finallytask.html?taskId=${taskId}`;
                };
            } else if (goNextBtn) {
                goNextBtn.style.display = 'none';
            }

            return;
        }

        if (modalTitle) modalTitle.textContent = data.moduleCompleted ? 'Модуль завершён' : 'Урок завершён';
        if (modalText) {
            modalText.textContent =
                (data.moduleCompleted
                    ? 'Отличная работа! Следующий модуль уже открыт.'
                    : 'Отличная работа! Можно перейти к следующему уроку.') +
                buildAchievementsText(data.unlocked);
        }
        if (modalBadge) modalBadge.textContent = data.moduleCompleted ? 'Новый модуль открыт' : 'Урок пройден';
        if (modalStatus) modalStatus.textContent = data.moduleCompleted ? 'Модуль завершён' : 'Урок завершён';
        if (modalNextStep) modalNextStep.textContent = 'Перейти к следующему уроку';

        if (goNextBtn) {
            goNextBtn.style.display = 'inline-flex';
            goNextBtn.disabled = true;
            goNextBtn.textContent = 'Следующий урок';
        }

        const nextLessonId = await fetchNextLessonId();

        if (nextLessonId && goNextBtn) {
            goNextBtn.disabled = false;
            goNextBtn.onclick = () => {
                window.location.href = `/lesson/${nextLessonId}`;
            };
        } else if (goNextBtn) {
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

backBtn?.addEventListener('click', () => {
    window.location.href = courseSlug ? `/courses/${courseSlug}` : '/dashboard';
});

loadLesson();