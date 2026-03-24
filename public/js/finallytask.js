console.log("finallytask.js загружен");

const params = new URLSearchParams(window.location.search);
const taskId = params.get("taskId");

const taskDescriptionEl = document.getElementById("taskDescription");
const questionsContainer = document.getElementById("questionsContainer");
const submitBtn = document.getElementById("submitTaskBtn");
const submitBtnMobile = document.getElementById("submitTaskBtnMobile");
const backBtn = document.getElementById("backBtn");
const backBtnMobile = document.getElementById("backBtnMobile");
const resultMessage = document.getElementById("resultMessage");

const metaTotal = document.getElementById("metaTotal");
const metaPassing = document.getElementById("metaPassing");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const answersCounter = document.getElementById("answersCounter");
const navEl = document.getElementById("questionNav");

const reviewPanel = document.getElementById("reviewPanel");
const reviewText = document.getElementById("reviewText");
const reviewStats = document.getElementById("reviewStats");

const confirmModal = document.getElementById("confirmModal");
const confirmSubmitBtn = document.getElementById("confirmSubmitBtn");
const confirmText = document.getElementById("confirmText");

const resultModal = document.getElementById("resultModal");
const resultModalText = document.getElementById("resultModalText");
const resultIconGood = document.getElementById("resultIconGood");
const resultIconBad = document.getElementById("resultIconBad");
const resultToProfileBtn = document.getElementById("resultToProfileBtn");
const resultRetryBtn = document.getElementById("resultRetryBtn");
const resultCloseBtn = document.getElementById("resultCloseBtn");
const resultScoreValue = document.getElementById("resultScoreValue");
const resultScoreTotal = document.getElementById("resultScoreTotal");
const resultPercentFill = document.getElementById("resultPercentFill");
const resultPercentLabel = document.getElementById("resultPercentLabel");
const resultDetailNote = document.getElementById("resultDetailNote");

let totalQuestions = 0;
let answeredCount = 0;
let isReviewMode = false;

function toJson(x) {
    if (!x) return {};
    if (x.data !== undefined) return x.data || {};
    return x.json ? x.json().catch(() => ({})) : {};
}

function setSubmitDisabled(disabled) {
    if (submitBtn) submitBtn.disabled = disabled;
    if (submitBtnMobile) submitBtnMobile.disabled = disabled;
}

function setSubmitting(isSubmitting) {
    document.documentElement.classList.toggle("ft-submitting", isSubmitting);

    if (submitBtn) {
        submitBtn.classList.toggle("is-loading", isSubmitting);
        submitBtn.textContent = isSubmitting ? "Проверяем..." : "Отправить ответы";
    }

    if (submitBtnMobile) {
        submitBtnMobile.classList.toggle("is-loading", isSubmitting);
        submitBtnMobile.textContent = isSubmitting
            ? "Проверяем..."
            : `Отправить (${answeredCount}/${totalQuestions})`;
    }

    if (backBtn) backBtn.disabled = isSubmitting;
    if (backBtnMobile) backBtnMobile.disabled = isSubmitting;
}

function updateProgress() {
    const pct = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    if (progressText) progressText.textContent = `${answeredCount} / ${totalQuestions}`;
    if (answersCounter) answersCounter.textContent = `Ответов: ${answeredCount} / ${totalQuestions}`;

    if (progressFill) progressFill.style.width = `${pct}%`;
    const bar = progressFill?.parentElement;
    if (bar) bar.setAttribute("aria-valuenow", String(pct));

    if (submitBtnMobile && !submitBtnMobile.classList.contains("is-loading")) {
        submitBtnMobile.textContent = `Отправить (${answeredCount}/${totalQuestions})`;
    }

    setSubmitDisabled(answeredCount === 0 || isReviewMode);
}

function buildNav(count) {
    if (!navEl) return;

    if (count <= 0) {
        navEl.innerHTML = "";
        navEl.style.display = "none";
        return;
    }

    navEl.style.display = "block";
    navEl.innerHTML = `
    <div class="ft-nav__card">
      <h4 class="ft-nav__title">Вопросы</h4>
      <div class="ft-nav__grid" id="ftNavGrid"></div>
      <div class="ft-nav__footer" id="ftNavFooter">Отвечено: 0 / ${count}</div>
    </div>
  `;

    const grid = navEl.querySelector("#ftNavGrid");
    if (!grid) return;

    const frag = document.createDocumentFragment();
    for (let i = 1; i <= count; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ft-nav__btn";
        btn.textContent = String(i);
        btn.dataset.qnum = String(i);
        btn.addEventListener("click", () => {
            const target = document.querySelector(`[data-question-number='${i}']`);
            if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        frag.appendChild(btn);
    }
    grid.appendChild(frag);
}

function updateNavAnswered() {
    if (!navEl) return;

    const footer = navEl.querySelector("#ftNavFooter");
    if (footer) footer.textContent = `Отвечено: ${answeredCount} / ${totalQuestions}`;

    navEl.querySelectorAll(".ft-nav__btn").forEach((b) => {
        const num = Number(b.getAttribute("data-qnum"));
        const qCard = document.querySelector(`[data-question-number='${num}']`);
        const checked = !!qCard?.querySelector("input[type='radio']:checked");
        b.classList.toggle("ft-nav__btn--answered", checked);
    });
}

function refreshCountsFromDOM() {
    answeredCount = questionsContainer
        ? questionsContainer.querySelectorAll(".ft-question input[type='radio']:checked").length
        : 0;

    updateProgress();
    updateNavAnswered();
}

function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove("ft-hidden");
    modalEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("ft-modal-open");
}

function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add("ft-hidden");
    modalEl.setAttribute("aria-hidden", "true");

    const anyOpen = document.querySelector(".ft-modal:not(.ft-hidden)");
    if (!anyOpen) document.body.classList.remove("ft-modal-open");
}

function bindModalCloseHandlers() {
    document.addEventListener("click", (e) => {
        const el = e.target.closest("[data-modal-close]");
        if (!el) return;

        const id = el.getAttribute("data-modal-close");
        const modal = document.getElementById(id);
        closeModal(modal);
    });

    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        const opened = document.querySelector(".ft-modal:not(.ft-hidden)");
        if (opened) closeModal(opened);
    });
}

bindModalCloseHandlers();

if (!taskId) {
    taskDescriptionEl.textContent = "Задание не найдено";
    setSubmitDisabled(true);
} else {
    loadTask();
}

async function loadTask() {
    try {
        const raw = await authFetch(`/api/task/${encodeURIComponent(taskId)}`);
        const data = await toJson(raw);

        if (!data.success || !data.task) {
            taskDescriptionEl.textContent = "Задание не найдено";
            setSubmitDisabled(true);
            return;
        }

        taskDescriptionEl.textContent = data.task.description || "Описание задания отсутствует";

        const passing = data.task.pass_score ?? data.task.passingScore ?? null;
        if (metaPassing && passing != null) {
            metaPassing.style.display = "inline-flex";
            metaPassing.textContent = `Проходной балл: ${passing}%`;
        }

        await loadQuestions(taskId);
    } catch (err) {
        console.error("Ошибка загрузки задания:", err);
        taskDescriptionEl.textContent = "Ошибка загрузки задания";
        setSubmitDisabled(true);
    }
}

async function loadQuestions(taskId) {
    try {
        const raw = await authFetch(`/api/task/${encodeURIComponent(taskId)}/questions`);
        const data = await toJson(raw);

        if (!data.success || !Array.isArray(data.questions) || data.questions.length === 0) {
            questionsContainer.innerHTML = "<p class='ft-empty'>Вопросы не найдены</p>";
            setSubmitDisabled(true);
            return;
        }

        questionsContainer.innerHTML = "";

        totalQuestions = data.questions.length;
        if (metaTotal) metaTotal.textContent = `Вопросов: ${totalQuestions}`;
        buildNav(totalQuestions);

        const frag = document.createDocumentFragment();

        data.questions.forEach((q, i) => {
            const qCard = document.createElement("section");
            qCard.className = "ft-card ft-question";
            qCard.dataset.questionNumber = String(i + 1);
            qCard.dataset.questionId = String(q.id);

            let options = [];
            if (Array.isArray(q.options)) options = q.options;
            else if (typeof q.options === "string") {
                try {
                    const parsed = JSON.parse(q.options);
                    options = Array.isArray(parsed) ? parsed : q.options.split(",");
                } catch {
                    options = q.options.split(",");
                }
            }
            options = options.map((o) => String(o).trim()).filter(Boolean);

            const name = `q${q.id}`;

            const optionsHtml = options
                .map(
                    (o) => `
            <label class="ft-option" data-selected="false" data-value="${escapeHtml(o)}">
              <input class="ft-option__input" type="radio" name="${name}" value="${escapeHtml(o)}" />
              <span class="ft-option__box" aria-hidden="true"><span class="ft-option__tick"></span></span>
              <span class="ft-option__text">${escapeHtml(o)}</span>
            </label>
          `
                )
                .join("");

            qCard.innerHTML = `
        <div class="ft-question__head">
          <span class="ft-question__num">${i + 1}</span>
          <h3 class="ft-question__title">${escapeHtml(q.question ?? q.text ?? "")}</h3>
        </div>
        <div class="ft-question__options">${optionsHtml}</div>
      `;

            frag.appendChild(qCard);
        });

        questionsContainer.appendChild(frag);

        questionsContainer.addEventListener("change", onQuestionsChange);

        answeredCount = 0;
        updateProgress();
        updateNavAnswered();
        setSubmitDisabled(true);
    } catch (err) {
        console.error("Ошибка загрузки вопросов:", err);
        questionsContainer.innerHTML = "<p class='ft-empty'>Ошибка загрузки вопросов</p>";
        setSubmitDisabled(true);
    }
}

function onQuestionsChange(e) {
    const input = e.target;
    if (!input || !input.matches("input[type='radio']")) return;
    if (isReviewMode) return;

    const card = input.closest(".ft-question");
    if (card) {
        card.querySelectorAll(".ft-option").forEach((lab) => {
            const r = lab.querySelector("input[type='radio']");
            lab.setAttribute("data-selected", r && r.checked ? "true" : "false");
        });
    }

    refreshCountsFromDOM();
}

function collectAnswers() {
    const answers = [];

    document.querySelectorAll(".ft-question").forEach((qEl) => {
        const input = qEl.querySelector("input:checked");
        if (input) {
            answers.push({
                questionId: input.name.slice(1),
                answer: input.value,
            });
        }
    });

    return answers;
}

async function doSubmit() {
    const answers = collectAnswers();

    if (answers.length === 0) {
        alert("Выберите хотя бы один ответ");
        return;
    }

    resultMessage.classList.add("ft-hidden");
    setSubmitting(true);

    try {
        const raw = await authFetch(`/api/task/${encodeURIComponent(taskId)}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers }),
        });

        const data = await toJson(raw);

        setSubmitting(false);

        showResultModal(!!(data.success && data.passed), data);
    } catch (err) {
        console.error("Ошибка отправки задания:", err);
        setSubmitting(false);
        showResultModal(false, { message: "Ошибка отправки задания" });
    }
}

function submitFlow() {
    const answers = collectAnswers();
    if (answers.length === 0) {
        alert("Выберите хотя бы один ответ");
        return;
    }

    if (answeredCount < totalQuestions) {
        if (confirmText) {
            confirmText.textContent = `Вы ответили на ${answeredCount} из ${totalQuestions}. Отправить как есть?`;
        }
        openModal(confirmModal);
        return;
    }

    doSubmit();
}

function showResultModal(passed, data) {
    if (!resultModal) {
        if (resultMessage) {
            resultMessage.classList.remove("ft-hidden");
            resultMessage.textContent = passed
                ? "Поздравляем! Вы прошли задание 🎉"
                : "Задание не пройдено. Попробуйте снова.";
            resultMessage.classList.toggle("ft-result--good", passed);
            resultMessage.classList.toggle("ft-result--bad", !passed);
        }
        return;
    }

    if (resultIconGood) resultIconGood.classList.toggle("ft-hidden", !passed);
    if (resultIconBad) resultIconBad.classList.toggle("ft-hidden", passed);

    const score = Number(data?.score || 0);
    const total = Number(data?.total || 0);
    const percent = Number(data?.percent || 0);
    const requiredCorrect = Number(data?.requiredCorrect || 0);

    if (resultModalText) {
        if (passed) resultModalText.textContent = "Поздравляем! Итоговое задание успешно пройдено.";
        else resultModalText.textContent = "Задание пока не пройдено, но вы можете разобрать ошибки и попробовать снова.";
    }
    if (resultScoreValue) resultScoreValue.textContent = String(score);
    if (resultScoreTotal) resultScoreTotal.textContent = String(total);
    if (resultPercentFill) resultPercentFill.style.width = `${percent}%`;
    if (resultPercentLabel) resultPercentLabel.textContent = `${percent}%`;
    if (resultDetailNote) {
        resultDetailNote.textContent = passed
            ? `Вы набрали ${score} из ${total}. Курс завершён, а следующий уровень${data?.nextLevel ? ` — ${data.nextLevel}` : ""} уже доступен.`
            : `Сейчас у вас ${score} из ${total}. Для прохождения нужно минимум ${requiredCorrect} правильных ответов.`;
    }

    if (resultToProfileBtn) resultToProfileBtn.classList.toggle("ft-hidden", !passed);
    if (resultRetryBtn) resultRetryBtn.classList.toggle("ft-hidden", passed);

    resultRetryBtn.onclick = null;
    if (resultRetryBtn) {
        resultRetryBtn.onclick = () => {
            closeModal(resultModal);
            applyReviewMode(data);
        };
    }

    openModal(resultModal);

    if (passed) {
        setSubmitDisabled(true);
    }
}

function applyReviewMode(data) {
    const review = Array.isArray(data?.review) ? data.review : [];

    if (!review.length) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    isReviewMode = true;

    let correctCount = 0;
    let wrongCount = 0;

    review.forEach((item) => {
        const qEl = document.querySelector(`.ft-question[data-question-id='${item.questionId}']`);
        if (!qEl) return;

        const statusIsCorrect = !!item.isCorrect;
        if (statusIsCorrect) correctCount += 1;
        else wrongCount += 1;

        qEl.classList.add("ft-question--review");
        qEl.classList.toggle("ft-question--correct", statusIsCorrect);
        qEl.classList.toggle("ft-question--incorrect", !statusIsCorrect);

        qEl.querySelectorAll(".ft-option").forEach((label) => {
            const input = label.querySelector("input[type='radio']");
            const value = String(input?.value ?? "");
            const isSelected = !!input?.checked;
            const isCorrectOption = value === String(item.correctAnswer ?? "");

            label.classList.add("ft-option--locked");
            label.classList.toggle("ft-option--correct", isCorrectOption);
            label.classList.toggle("ft-option--incorrect", isSelected && !statusIsCorrect);
            label.classList.toggle("ft-option--muted", !isSelected && !isCorrectOption);

            if (input) input.disabled = true;
        });

        let statusEl = qEl.querySelector(".ft-question__status");
        if (!statusEl) {
            statusEl = document.createElement("div");
            statusEl.className = "ft-question__status";
            qEl.appendChild(statusEl);
        }
        statusEl.className = `ft-question__status ${statusIsCorrect ? "ft-question__status--correct" : "ft-question__status--incorrect"}`;
        statusEl.textContent = statusIsCorrect ? "Верно" : "Ошибка";

        let hintEl = qEl.querySelector(".ft-question__hint");
        if (!hintEl) {
            hintEl = document.createElement("div");
            hintEl.className = "ft-question__hint";
            qEl.appendChild(hintEl);
        }

        if (statusIsCorrect) {
            hintEl.innerHTML = `<strong>Правильный ответ:</strong> ${escapeHtml(item.correctAnswer || "—")}`;
        } else {
            hintEl.innerHTML = `
                <strong>Твой ответ:</strong> ${escapeHtml(item.givenAnswer || "—")}<br>
                <strong>Правильный ответ:</strong> ${escapeHtml(item.correctAnswer || "—")}
            `;
        }
    });

    if (reviewPanel) {
        reviewPanel.classList.remove("ft-hidden");
    }
    if (reviewText) {
        reviewText.textContent = wrongCount > 0
            ? "Проверь свои ответы: правильные варианты подсвечены зелёным, а ошибки — красным. Сначала разбери их, потом можешь пройти задание снова."
            : "Все ответы верные. Зелёным подсвечены правильные варианты.";
    }
    if (reviewStats) {
        reviewStats.textContent = `${correctCount} правильных · ${wrongCount} ошибок`;
    }

    setSubmitDisabled(true);

    if (submitBtn) submitBtn.classList.add("ft-hidden");
    if (submitBtnMobile) submitBtnMobile.classList.add("ft-hidden");

    const navButtons = navEl?.querySelectorAll(".ft-nav__btn");
    navButtons?.forEach((btn) => {
        const num = Number(btn.dataset.qnum);
        const item = review.find((x) => Number(x.questionNumber) === num);
        if (!item) return;
        btn.classList.toggle("ft-nav__btn--answered", false);
        btn.classList.toggle("ft-nav__btn--correct", !!item.isCorrect);
        btn.classList.toggle("ft-nav__btn--incorrect", !item.isCorrect);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
}

if (confirmSubmitBtn) {
    confirmSubmitBtn.addEventListener("click", () => {
        closeModal(confirmModal);
        doSubmit();
    });
}

if (resultRetryBtn) {
    resultRetryBtn.addEventListener("click", () => {
        closeModal(resultModal);
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

if (resultCloseBtn) {
    resultCloseBtn.addEventListener("click", () => closeModal(resultModal));
}

if (submitBtn) submitBtn.addEventListener("click", submitFlow);
if (submitBtnMobile) submitBtnMobile.addEventListener("click", submitFlow);

function goBack() {
    window.history.back();
}
if (backBtn) backBtn.addEventListener("click", goBack);
if (backBtnMobile) backBtnMobile.addEventListener("click", goBack);

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
