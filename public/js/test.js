import { subjects, subjectOrder } from "./questions.js";

const root = document.getElementById("examRoot");
const questionEl = root.querySelector("#question");
const answersEl = root.querySelector("#answers");
const currentEl = root.querySelector("#current");
const progressEl = root.querySelector("#progress");
const currentTotalEl = root.querySelector("#currentTotal");
const nextBtn = root.querySelector("#nextBtn");
const prevBtn = root.querySelector("#prevBtn");
const timerEl = root.querySelector("#timer");
const questionTypeEl = root.querySelector("#questionType");
const subjectBtns = root.querySelectorAll(".exam__subject");

const globalAudioBlock = document.getElementById("globalAudioBlock");
const globalAudio = document.getElementById("globalAudio");

const finishBtn = document.getElementById("finishBtn");
const finishModal = document.getElementById("finishModal");
const cancelFinish = document.getElementById("cancelFinish");
const confirmFinish = document.getElementById("confirmFinish");
const resultModal = document.getElementById("resultModal");

let currentSubject = "math";
let currentSubjectIndex = 0;
let examFinished = false;

const examState = {
  math: { index: 0, score: 0, answers: [] },
  reading: {
    index: 0,
    score: 0,
    text: "",
    feedback: "",
    evaluated: false,
    isEvaluating: false,
  },
  listening: { index: 0, score: 0, answers: [] },
};

const EXAM_DURATION = 40 * 60;
const TIMER_KEY = "examEndTime";

function initTimer() {
  let endTime = Number(localStorage.getItem(TIMER_KEY));
  if (!endTime || endTime <= Date.now()) {
    endTime = Date.now() + EXAM_DURATION * 1000;
    localStorage.setItem(TIMER_KEY, String(endTime));
  }
  return endTime;
}

let examEndTime = initTimer();
let timerInterval = null;

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const remaining = Math.floor((examEndTime - Date.now()) / 1000);
    if (remaining <= 0) {
      stopTimer(true);
      timerEl.textContent = "00:00";
      finishExam();
      return;
    }
    const min = Math.floor(remaining / 60);
    const sec = remaining % 60;
    timerEl.textContent = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    timerEl.classList.toggle("exam__timer--low", remaining < 300);
  }, 1000);
}

function stopTimer(clearStorage = false) {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  if (clearStorage) localStorage.removeItem(TIMER_KEY);
}

function openModal(modalEl) {
  modalEl.classList.add("modal--open");
  modalEl.setAttribute("aria-hidden", "false");
}

function closeModal(modalEl) {
  modalEl.classList.remove("modal--open");
  modalEl.setAttribute("aria-hidden", "true");
}

function setActiveSubjectButton() {
  subjectBtns.forEach((b) => b.classList.toggle("exam__subject--active", b.dataset.subject === currentSubject));
}

function renderGlobalAudio() {
  const cfg = subjects[currentSubject];
  const shouldShow = currentSubject === "listening" && cfg.globalAudioSrc;
  globalAudioBlock.hidden = !shouldShow;
  if (!shouldShow) return;

  const source = globalAudio.querySelector("source");
  if (source && source.getAttribute("src") !== cfg.globalAudioSrc) {
    source.setAttribute("src", cfg.globalAudioSrc);
    globalAudio.load();
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderReadingTask() {
  const state = examState.reading;
  const minLength = 30;

  questionEl.textContent = "Расскажите о себе на казахском языке. Напишите 4–8 предложений: как вас зовут, откуда вы, где учитесь или работаете, чем интересуетесь и почему хотите изучать казахский язык.";
  currentEl.textContent = "1";
  progressEl.textContent = "1 / 1";
  if (currentTotalEl) currentTotalEl.textContent = "1";
  questionTypeEl.textContent = "Тип: текстовая оценка ИИ";
  prevBtn.disabled = true;
  nextBtn.textContent = state.evaluated ? "Продолжить →" : "Оценить и продолжить →";
  nextBtn.disabled = state.isEvaluating || state.text.trim().length < minLength;

  answersEl.innerHTML = `
    <div class="writing-task">
      <div class="writing-task__top">
        <div>
          <h3 class="writing-task__title">Письменное задание</h3>
          <p class="writing-task__hint">Пишите на казахском. ИИ проверит связность, словарный запас и базовую грамотность.</p>
        </div>
        <span class="writing-task__badge">0–10 баллов</span>
      </div>

      <label class="writing-task__label" for="writingInput">Ваш текст</label>
      <textarea id="writingInput" class="writing-task__textarea" placeholder="Например: Менің атым Арсен. Мен Қазақстаннанмын...">${escapeHtml(state.text)}</textarea>
      <div class="writing-task__meta">
        <span id="writingCounter">${state.text.trim().length} символов</span>
        <span>Минимум ${minLength} символов</span>
      </div>

      <div class="writing-task__tips">
        <span>Что можно написать:</span>
        <ul>
          <li>имя и возраст</li>
          <li>город, учеба или работа</li>
          <li>семья, хобби, цели</li>
          <li>почему учите казахский</li>
        </ul>
      </div>

      <div id="writingStatus" class="writing-task__status${state.isEvaluating ? ' is-visible' : ''}">${state.isEvaluating ? 'ИИ оценивает текст…' : ''}</div>

      <div id="writingResult" class="writing-result${state.evaluated ? ' is-visible' : ''}">
        <div class="writing-result__head">
          <span class="writing-result__score">${state.score} / 10</span>
          <span class="writing-result__label">Оценка ИИ</span>
        </div>
        <p class="writing-result__text">${escapeHtml(state.feedback || 'После проверки здесь появится краткий комментарий.')}</p>
      </div>
    </div>
  `;

  const textarea = document.getElementById("writingInput");
  const counter = document.getElementById("writingCounter");
  textarea?.addEventListener("input", () => {
    state.text = textarea.value;
    state.evaluated = false;
    state.score = 0;
    state.feedback = "";
    counter.textContent = `${state.text.trim().length} символов`;
    nextBtn.textContent = "Оценить и продолжить →";
    nextBtn.disabled = state.text.trim().length < minLength;
    const result = document.getElementById("writingResult");
    if (result) result.classList.remove("is-visible");
  });
}

function renderChoiceQuestion() {
  currentSubjectIndex = subjectOrder.indexOf(currentSubject);
  const state = examState[currentSubject];
  const q = subjects[currentSubject].questions[state.index];

  questionEl.textContent = q.question;
  currentEl.textContent = String(state.index + 1);
  progressEl.textContent = `${state.index + 1} / ${subjects[currentSubject].questions.length}`;
  if (currentTotalEl) currentTotalEl.textContent = String(subjects[currentSubject].questions.length);
  questionTypeEl.textContent = "Тип: один правильный ответ";
  nextBtn.textContent = "Следующий вопрос →";
  answersEl.innerHTML = "";
  nextBtn.disabled = true;
  prevBtn.disabled = state.index === 0;

  q.answers.forEach((text, i) => {
    const label = document.createElement("label");
    label.className = "exam__answer";
    const letter = String.fromCharCode(65 + i);

    label.innerHTML = `
      <input class="exam__answer-input" type="radio" name="answer" value="${i}">
      <span class="exam__answer-letter" aria-hidden="true">${letter}</span>
      <span class="exam__answer-text">${escapeHtml(text)}</span>
      <span class="exam__answer-ind" aria-hidden="true"></span>
    `;

    const input = label.querySelector("input");
    if (state.answers[state.index] === i) {
      input.checked = true;
      label.classList.add("is-selected");
      nextBtn.disabled = false;
    }

    input.addEventListener("change", () => {
      state.answers[state.index] = i;
      answersEl.querySelectorAll(".exam__answer").forEach((el) => el.classList.remove("is-selected"));
      label.classList.add("is-selected");
      nextBtn.disabled = false;
    });

    answersEl.appendChild(label);
  });
}

function renderQuestion() {
  currentSubjectIndex = subjectOrder.indexOf(currentSubject);
  renderGlobalAudio();
  if (currentSubject === "reading") {
    renderReadingTask();
    return;
  }
  renderChoiceQuestion();
}

function calculateScores() {
  ["math", "listening"].forEach((subject) => {
    const state = examState[subject];
    const qs = subjects[subject].questions;
    state.score = state.answers.reduce((sum, ans, i) => sum + (ans === qs[i]?.correct ? 1 : 0), 0);
  });
  examState.reading.score = Number(examState.reading.score || 0);
}

function getLevel(score) {
  if (score <= 6) return "elementary";
  if (score <= 12) return "basic";
  return "intermediate";
}

const levelTitles = {
  elementary: "Элементарный",
  basic: "Базовый",
  intermediate: "Средний",
  upper: "Выше среднего",
  advanced: "Высокий",
};

function showResult(score, level) {
  const percent = Math.round((score / 30) * 100);
  document.getElementById("resultPercent").textContent = `${percent}%`;
  document.getElementById("resultLevel").textContent = levelTitles[level] || level;
  document.getElementById("mathScore").textContent = `${examState.math.score} / 10`;
  document.getElementById("readingScore").textContent = `${examState.reading.score} / 10`;
  document.getElementById("listeningScore").textContent = `${examState.listening.score} / 10`;
  const summaryEl = document.getElementById("resultSummary");
  const noteEl = document.getElementById("resultNote");
  if (summaryEl) summaryEl.textContent = `Вы набрали ${percent}% и достигли уровня «${levelTitles[level] || level}».`;
  if (noteEl) noteEl.textContent = percent >= 70
    ? "Отличный результат. Переходите к рекомендованному курсу и продолжайте обучение."
    : "Хорошее начало. Продолжайте практиковаться и укрепляйте базу вместе с курсами AnaTil.";
  openModal(resultModal);
  document.getElementById("goHome").onclick = () => (window.location.href = "/dashboard.html");
  document.getElementById("goProfile").onclick = () => (window.location.href = "/profile.html");
  document.getElementById("goCourses").onclick = () => (window.location.href = "/courses");
}

async function saveResult(score, level) {
    if (typeof window.authFetch !== "function") return;

    try {
        const { data } = await window.authFetch("/api/save-result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                totalScore: score,
                level,
                math: examState.math.score,
                reading: examState.reading.score,
                listening: examState.listening.score,
            }),
        });

        console.log("Результат сохранён:", data);
    } catch (e) {
        console.error("Ошибка сохранения результата", e);
    }
}

function goToNextSubject() {
  currentSubjectIndex++;
  if (currentSubjectIndex < subjectOrder.length) {
    currentSubject = subjectOrder[currentSubjectIndex];
    setActiveSubjectButton();
    renderQuestion();
  } else {
    finishExam();
  }
}

async function evaluateReadingText() {
    const state = examState.reading;
    const text = state.text.trim();
    if (text.length < 30 || state.isEvaluating) return false;

    state.isEvaluating = true;
    renderReadingTask();

    try {
        calculateScores();

        const totalScoreWithoutWriting =
            Number(examState.math.score || 0) + Number(examState.listening.score || 0);

        const { data } = await window.authFetch("/api/ai/test-writing-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, totalScoreWithoutWriting }),
        });

        if (!data?.success) {
            throw new Error(data?.message || "Не удалось оценить текст");
        }

        state.score = Number(data.score || 0);
        state.feedback = String(data.feedback || "");
        state.evaluated = true;

        return true;
    } catch (error) {
        console.error("Ошибка оценки текста:", error);

        state.score = 0;
        state.feedback = "Не удалось получить оценку от ИИ. Попробуйте ещё раз.";
        state.evaluated = false;

        const status = document.getElementById("writingStatus");
        if (status) {
            status.textContent = state.feedback;
            status.classList.add("is-visible", "is-error");
        }

        return false;
    } finally {
        state.isEvaluating = false;
        renderReadingTask();
    }
}

async function finishExam() {
  if (examFinished) return;
  examFinished = true;
  stopTimer(true);
  calculateScores();
  const totalScore = examState.math.score + examState.reading.score + examState.listening.score;
  const level = getLevel(totalScore);
  await saveResult(totalScore, level);
  showResult(totalScore, level);
}

function requestFinish() {
  if (examFinished) return;
  openModal(finishModal);
}

subjectBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (examFinished) return;
    currentSubject = btn.dataset.subject;
    setActiveSubjectButton();
    renderQuestion();
  });
});

nextBtn.addEventListener("click", async () => {
  if (examFinished) return;

  if (currentSubject === "reading") {
    if (!examState.reading.evaluated) {
      const ok = await evaluateReadingText();
      if (!ok) return;
    }
    goToNextSubject();
    return;
  }

  const state = examState[currentSubject];
  const total = subjects[currentSubject].questions.length;
  if (state.index < total - 1) {
    state.index++;
    renderQuestion();
  } else {
    goToNextSubject();
  }
});

prevBtn.addEventListener("click", () => {
  if (examFinished || currentSubject === "reading") return;
  const state = examState[currentSubject];
  if (state.index > 0) {
    state.index--;
    renderQuestion();
  }
});

finishBtn.addEventListener("click", requestFinish);
cancelFinish.addEventListener("click", () => closeModal(finishModal));
confirmFinish.addEventListener("click", async () => {
  closeModal(finishModal);
  await finishExam();
});

finishModal.querySelector(".modal__overlay")?.addEventListener("click", () => closeModal(finishModal));
resultModal.querySelector(".modal__overlay")?.addEventListener("click", () => closeModal(resultModal));

history.pushState(null, "", location.href);
window.addEventListener("popstate", () => {
  requestFinish();
  history.pushState(null, "", location.href);
});

window.addEventListener("beforeunload", (e) => {
  if (!examFinished) {
    e.preventDefault();
    e.returnValue = "";
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) console.warn("Пользователь покинул страницу");
});

setActiveSubjectButton();
renderQuestion();
startTimer();
