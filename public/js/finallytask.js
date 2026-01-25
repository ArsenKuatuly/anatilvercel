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

function pickPayload(x) {
    if (!x) return { ok: false, data: null };
    if (x.data !== undefined) return { ok: !!x.res?.ok, data: x.data };
    return { ok: !!x.ok, data: null };
}

async function toJson(x) {
    if (!x) return {};
    if (x.data !== undefined) return x.data || {};
    return await x.json().catch(() => ({}));
}

let totalQuestions = 0;
let answeredCount = 0;

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

    setSubmitDisabled(answeredCount === 0);
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
            <label class="ft-option" data-selected="false">
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

        questionsContainer.addEventListener("change", (e) => {
            const input = e.target;
            if (!input || !input.matches("input[type='radio']")) return;

            const card = input.closest(".ft-question");
            if (card) {
                card.querySelectorAll(".ft-option").forEach((lab) => {
                    const r = lab.querySelector("input[type='radio']");
                    lab.setAttribute("data-selected", r && r.checked ? "true" : "false");
                });
            }

            refreshCountsFromDOM();
        });

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

    if (resultModalText) {
        if (passed) resultModalText.textContent = "Поздравляем! Вы прошли задание 🎉";
        else resultModalText.textContent = "Задание не пройдено. Попробуйте снова.";
    }

    if (resultToProfileBtn) resultToProfileBtn.classList.toggle("ft-hidden", !passed);
    if (resultRetryBtn) resultRetryBtn.classList.toggle("ft-hidden", passed);

    openModal(resultModal);

    if (passed) {
        setSubmitDisabled(true);
    }
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
