(() => {
    "use strict";

    const STORAGE_KEYS = {
        history: "anatil_ai_history",
        stats: "anatil_ai_stats",
        credits: "anatil_ai_credits"
    };

    const state = {
        user: null,
        currentMode: "sentence",
        currentLesson: null,
        selectedScenario: "Кафе",
        selectedLevel: "A1",
        selectedTone: "Дружелюбно",
        credits: 120,
        dailyLimit: 50,
        usedToday: 12,
        sessionStats: {
            minutes: 14,
            mistakesFixed: 0,
            newWords: 0
        },
        history: [],
        pending: false
    };

    const els = {
        adminBtn: document.getElementById("adminBtn"),

        limitText: document.getElementById("aiLimitText"),
        creditsText: document.getElementById("aiCreditsText"),
        historyBtn: document.getElementById("aiHistoryBtn"),
        historyDrawer: document.getElementById("aiHistoryDrawer"),
        historyClose: document.getElementById("aiHistoryClose"),
        historyList: document.getElementById("aiHistoryList"),

        modeCards: document.querySelectorAll("[data-ai-mode]"),
        modePanels: document.querySelectorAll("[data-ai-panel]"),

        sentenceInput: document.getElementById("sentenceInput"),
        sentenceCheckBtn: document.getElementById("sentenceCheckBtn"),
        sentenceResult: document.getElementById("sentenceResult"),
        sentenceHarderBtn: document.getElementById("sentenceHarderBtn"),
        sentenceEasierBtn: document.getElementById("sentenceEasierBtn"),
        sentenceExamplesBtn: document.getElementById("sentenceExamplesBtn"),
        sentenceLevel: document.getElementById("sentenceLevel"),
        sentenceExplain: document.getElementById("sentenceExplain"),

        dialogScenarioChips: document.querySelectorAll("[data-scenario]"),
        dialogLevelChips: document.querySelectorAll("[data-dialog-level]"),
        dialogToneChips: document.querySelectorAll("[data-dialog-tone]"),
        dialogStartBtn: document.getElementById("dialogStartBtn"),
        dialogHintBtn: document.getElementById("dialogHintBtn"),
        dialogMessages: document.getElementById("dialogMessages"),
        dialogInput: document.getElementById("dialogInput"),
        dialogSendBtn: document.getElementById("dialogSendBtn"),
        dialogMiniReview: document.getElementById("dialogMiniReview"),

        tutorCurrentLessonBtn: document.getElementById("tutorCurrentLessonBtn"),
        tutorLessonSelect: document.getElementById("tutorLessonSelect"),
        tutorContextBadge: document.getElementById("tutorContextBadge"),
        tutorMessages: document.getElementById("tutorMessages"),
        tutorInput: document.getElementById("tutorInput"),
        tutorSendBtn: document.getElementById("tutorSendBtn"),

        vocabTopicInput: document.getElementById("vocabTopicInput"),
        vocabGenerateBtn: document.getElementById("vocabGenerateBtn"),
        vocabResult: document.getElementById("vocabResult"),

        statsMinutes: document.getElementById("aiStatsMinutes"),
        statsMistakes: document.getElementById("aiStatsMistakes"),
        statsWords: document.getElementById("aiStatsWords"),

        sessionMode: document.getElementById("lastSessionMode"),
        sessionTopic: document.getElementById("lastSessionTopic"),
        sessionTime: document.getElementById("lastSessionTime")
    };

    function safeParse(value, fallback) {
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    function loadLocalState() {
        state.history = safeParse(localStorage.getItem(STORAGE_KEYS.history), []);
        const stats = safeParse(localStorage.getItem(STORAGE_KEYS.stats), null);
        const credits = safeParse(localStorage.getItem(STORAGE_KEYS.credits), null);

        if (stats && typeof stats === "object") {
            state.sessionStats = {
                minutes: Number(stats.minutes || 14),
                mistakesFixed: Number(stats.mistakesFixed || 0),
                newWords: Number(stats.newWords || 0)
            };
        }

        if (credits && typeof credits === "object") {
            state.credits = Number(credits.credits || 120);
            state.usedToday = Number(credits.usedToday || 0);
            state.dailyLimit = Number(credits.dailyLimit || 50);
        }
    }

    function saveLocalState() {
        localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history));
        localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(state.sessionStats));
        localStorage.setItem(
            STORAGE_KEYS.credits,
            JSON.stringify({
                credits: state.credits,
                usedToday: state.usedToday,
                dailyLimit: state.dailyLimit
            })
        );
    }

    function renderTopInfo() {
        if (els.limitText) {
            els.limitText.textContent = `Сообщений сегодня: ${state.usedToday}/${state.dailyLimit}`;
        }
        if (els.creditsText) {
            els.creditsText.textContent = `AI кредиты: ${state.credits}`;
        }
    }

    function renderStats() {
        if (els.statsMinutes) els.statsMinutes.textContent = `${state.sessionStats.minutes} минут`;
        if (els.statsMistakes) els.statsMistakes.textContent = `${state.sessionStats.mistakesFixed}`;
        if (els.statsWords) els.statsWords.textContent = `${state.sessionStats.newWords}`;
    }

    function renderLastSession() {
        const last = state.history[0];
        if (!last) return;

        if (els.sessionMode) els.sessionMode.textContent = last.modeLabel || "—";
        if (els.sessionTopic) els.sessionTopic.textContent = last.topic || "Без темы";
        if (els.sessionTime) els.sessionTime.textContent = formatDateTime(last.createdAt);
    }

    function renderHistory() {
        if (!els.historyList) return;

        if (!state.history.length) {
            els.historyList.innerHTML = `<div class="anatilui-history__empty">История пока пуста</div>`;
            return;
        }

        els.historyList.innerHTML = state.history
            .map(
                (item, index) => `
                <button class="anatilui-history__item" type="button" data-history-index="${index}">
                    <div class="anatilui-history__meta">
                        <span class="anatilui-history__mode">${escapeHtml(item.modeLabel || "AI Practice")}</span>
                        <span class="anatilui-history__date">${escapeHtml(formatDateTime(item.createdAt))}</span>
                    </div>
                    <div class="anatilui-history__topic">${escapeHtml(item.topic || "Без темы")}</div>
                </button>
            `
            )
            .join("");

        els.historyList.querySelectorAll("[data-history-index]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const idx = Number(btn.dataset.historyIndex);
                const item = state.history[idx];
                if (!item) return;

                if (item.mode === "sentence" && els.sentenceResult) {
                    switchMode("sentence");
                    els.sentenceResult.innerHTML = item.html || "";
                }

                if (item.mode === "dialog" && els.dialogMessages) {
                    switchMode("dialog");
                    els.dialogMessages.innerHTML = item.html || "";
                    if (els.dialogMiniReview) {
                        els.dialogMiniReview.textContent = item.review || "";
                    }
                }

                if (item.mode === "tutor" && els.tutorMessages) {
                    switchMode("tutor");
                    els.tutorMessages.innerHTML = item.html || "";
                }

                if (item.mode === "vocabulary" && els.vocabResult) {
                    switchMode("vocabulary");
                    els.vocabResult.innerHTML = item.html || "";
                }

                closeHistoryDrawer();
            });
        });
    }

    function openHistoryDrawer() {
        if (!els.historyDrawer) return;
        els.historyDrawer.classList.add("is-open");
        els.historyDrawer.removeAttribute("hidden");
    }

    function closeHistoryDrawer() {
        if (!els.historyDrawer) return;
        els.historyDrawer.classList.remove("is-open");
        els.historyDrawer.setAttribute("hidden", "hidden");
    }

    function switchMode(mode) {
        state.currentMode = mode;

        els.modeCards.forEach((card) => {
            card.classList.toggle("is-active", card.dataset.aiMode === mode);
        });

        els.modePanels.forEach((panel) => {
            panel.classList.toggle("is-active", panel.dataset.aiPanel === mode);
            panel.hidden = panel.dataset.aiPanel !== mode;
        });
    }

    function bindModeCards() {
        els.modeCards.forEach((card) => {
            card.addEventListener("click", () => {
                const mode = card.dataset.aiMode;
                if (!mode) return;
                switchMode(mode);
            });
        });
    }

    function bindDialogChips() {
        els.dialogScenarioChips.forEach((chip) => {
            chip.addEventListener("click", () => {
                state.selectedScenario = chip.dataset.scenario || chip.textContent.trim();
                els.dialogScenarioChips.forEach((x) => x.classList.remove("is-active"));
                chip.classList.add("is-active");
            });
        });

        els.dialogLevelChips.forEach((chip) => {
            chip.addEventListener("click", () => {
                state.selectedLevel = chip.dataset.dialogLevel || chip.textContent.trim();
                els.dialogLevelChips.forEach((x) => x.classList.remove("is-active"));
                chip.classList.add("is-active");
            });
        });

        els.dialogToneChips.forEach((chip) => {
            chip.addEventListener("click", () => {
                state.selectedTone = chip.dataset.dialogTone || chip.textContent.trim();
                els.dialogToneChips.forEach((x) => x.classList.remove("is-active"));
                chip.classList.add("is-active");
            });
        });
    }

    function addHistoryEntry(entry) {
        state.history.unshift({
            ...entry,
            createdAt: new Date().toISOString()
        });

        state.history = state.history.slice(0, 20);
        saveLocalState();
        renderHistory();
        renderLastSession();
    }

    function increaseUsage() {
        state.usedToday += 1;
        state.credits = Math.max(0, state.credits - 1);
        saveLocalState();
        renderTopInfo();
    }

    function updateStats(partial = {}) {
        state.sessionStats.minutes = Number(partial.minutes ?? state.sessionStats.minutes);
        state.sessionStats.mistakesFixed += Number(partial.mistakesFixed || 0);
        state.sessionStats.newWords += Number(partial.newWords || 0);
        saveLocalState();
        renderStats();
    }

    function formatDateTime(value) {
        if (!value) return "—";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "—";
        return date.toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function escapeHtml(text) {
        return String(text ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    async function request(url, options = {}) {
        if (typeof authFetch === "function") {
            try {
                const out = await authFetch(url, options);
                if (!out) return null;
                if (out.data !== undefined) return out.data;
                if (typeof out.json === "function") return await out.json();
                return out;
            } catch (e) {
                console.error(e);
                return null;
            }
        }

        try {
            const res = await fetch(url, {
                credentials: "include",
                ...options
            });
            return await res.json();
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async function loadUser() {
        const data = await request("/api/auth/me", { method: "GET" });
        if (!data?.success || !data.user) return;

        state.user = data.user;

        if (state.user.role === "admin" && els.adminBtn) {
            els.adminBtn.style.display = "inline-block";
        }
    }

    async function loadCurrentLessonContext() {
        const data = await request("/api/lessons/progress/current", { method: "GET" });
        if (!data?.success) return;

        const lesson = data.nextLesson || data.lastLesson || null;
        const course = data.course || null;

        if (lesson) {
            state.currentLesson = {
                id: lesson.id,
                title: lesson.title,
                courseTitle: course?.title || "",
                slug: course?.slug || ""
            };
        }

        if (els.tutorContextBadge && state.currentLesson) {
            els.tutorContextBadge.textContent = `Контекст: ${state.currentLesson.title}`;
        }

        if (els.tutorLessonSelect && state.currentLesson) {
            els.tutorLessonSelect.innerHTML = `
                <option value="${state.currentLesson.id}">
                    ${escapeHtml(state.currentLesson.title)}
                </option>
            `;
        }
    }

    function parseResponsePayload(data) {
        const fallback = {
            text: "Ответ получен.",
            corrected: "",
            mistakes: [],
            rule: "",
            examples: [],
            exercise: "",
            review: "",
            words: []
        };

        if (!data) return fallback;

        if (typeof data === "string") {
            const json = extractJson(data);
            if (json) return { ...fallback, ...json, text: json.text || json.reply || fallback.text };
            return { ...fallback, text: data };
        }

        if (typeof data === "object") {
            const candidate =
                data.result ||
                data.response ||
                data.message ||
                data.reply ||
                data.content ||
                data.answer ||
                data.data ||
                data;

            if (typeof candidate === "string") {
                const json = extractJson(candidate);
                if (json) return { ...fallback, ...json, text: json.text || json.reply || fallback.text };
                return { ...fallback, text: candidate };
            }

            if (typeof candidate === "object" && candidate) {
                return {
                    ...fallback,
                    ...candidate,
                    text:
                        candidate.text ||
                        candidate.reply ||
                        candidate.message ||
                        candidate.content ||
                        fallback.text
                };
            }
        }

        return fallback;
    }

    function extractJson(text) {
        if (typeof text !== "string") return null;

        try {
            return JSON.parse(text);
        } catch {}

        const match = text.match(/\{[\s\S]*\}/);
        if (!match) return null;

        try {
            return JSON.parse(match[0]);
        } catch {
            return null;
        }
    }

    async function aiChat(payload) {
        if (state.pending) return null;
        if (state.usedToday >= state.dailyLimit || state.credits <= 0) {
            return {
                text: "Лимит AI на сегодня исчерпан."
            };
        }

        state.pending = true;

        const data = await request("/api/ai/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        state.pending = false;
        increaseUsage();
        return parseResponsePayload(data);
    }

    function renderSentenceResult(result) {
        if (!els.sentenceResult) return;

        const corrected = result.corrected || result.text || "—";
        const mistakes = Array.isArray(result.mistakes) ? result.mistakes : [];
        const examples = Array.isArray(result.examples) ? result.examples : [];

        els.sentenceResult.innerHTML = `
            <div class="anatilui-result-card">
                <div class="anatilui-result-block">
                    <div class="anatilui-result-label">Исправленный вариант</div>
                    <div class="anatilui-result-value">${escapeHtml(corrected)}</div>
                </div>

                <div class="anatilui-result-block">
                    <div class="anatilui-result-label">Ошибки</div>
                    ${
            mistakes.length
                ? `<ul class="anatilui-result-list">${mistakes
                    .map((item) => `<li>${escapeHtml(typeof item === "string" ? item : item.text || item.error || "")}</li>`)
                    .join("")}</ul>`
                : `<div class="anatilui-result-value">Ошибок почти нет</div>`
        }
                </div>

                <div class="anatilui-result-block">
                    <div class="anatilui-result-label">Правило</div>
                    <div class="anatilui-result-value">${escapeHtml(result.rule || "Короткое объяснение отсутствует")}</div>
                </div>

                <div class="anatilui-result-block">
                    <div class="anatilui-result-label">Примеры</div>
                    ${
            examples.length
                ? `<ul class="anatilui-result-list">${examples
                    .map((item) => `<li>${escapeHtml(item)}</li>`)
                    .join("")}</ul>`
                : `<div class="anatilui-result-value">Примеры не добавлены</div>`
        }
                </div>

                <div class="anatilui-result-block">
                    <div class="anatilui-result-label">Мини-задание</div>
                    <div class="anatilui-result-value">${escapeHtml(result.exercise || "Перефразируй это в прошедшем времени")}</div>
                </div>
            </div>
        `;

        addHistoryEntry({
            mode: "sentence",
            modeLabel: "Проверка предложения",
            topic: "Исправление фразы",
            html: els.sentenceResult.innerHTML
        });
    }

    async function handleSentenceCheck(extraInstruction = "") {
        const text = els.sentenceInput?.value?.trim();
        if (!text) return;

        const level = els.sentenceLevel?.value || state.selectedLevel;
        const explain = els.sentenceExplain?.value || "simple";

        const response = await aiChat({
            mode: "sentence_check",
            text,
            level,
            explain,
            instruction: extraInstruction
        });

        if (!response) return;

        renderSentenceResult(response);

        const mistakesCount = Array.isArray(response.mistakes) ? response.mistakes.length : 1;
        updateStats({ mistakesFixed: mistakesCount });
    }

    function appendMessage(container, role, text) {
        if (!container) return;

        const item = document.createElement("div");
        item.className = `anatilui-chat__message anatilui-chat__message--${role}`;
        item.innerHTML = `<div class="anatilui-chat__bubble">${escapeHtml(text)}</div>`;
        container.appendChild(item);
        container.scrollTop = container.scrollHeight;
    }

    async function startDialog() {
        if (!els.dialogMessages) return;

        els.dialogMessages.innerHTML = "";

        const prompt = `Начни диалог на казахском. Сценарий: ${state.selectedScenario}. Уровень: ${state.selectedLevel}. Тональность: ${state.selectedTone}. Начни с одной короткой реплики и будь как преподаватель.`;

        const response = await aiChat({
            mode: "dialog_start",
            scenario: state.selectedScenario,
            level: state.selectedLevel,
            tone: state.selectedTone,
            prompt
        });

        const text = response?.text || `Сәлем! Бүгін біз "${state.selectedScenario}" тақырыбында сөйлесеміз.`;
        appendMessage(els.dialogMessages, "ai", text);

        addHistoryEntry({
            mode: "dialog",
            modeLabel: "Диалог",
            topic: state.selectedScenario,
            html: els.dialogMessages.innerHTML,
            review: ""
        });
    }

    async function sendDialogMessage() {
        const text = els.dialogInput?.value?.trim();
        if (!text || !els.dialogMessages) return;

        appendMessage(els.dialogMessages, "user", text);
        els.dialogInput.value = "";

        const response = await aiChat({
            mode: "dialog",
            scenario: state.selectedScenario,
            level: state.selectedLevel,
            tone: state.selectedTone,
            text
        });

        const aiText = response?.text || "Жақсы жауап. Жалғастырайық.";
        appendMessage(els.dialogMessages, "ai", aiText);

        const reviewText =
            response?.review ||
            response?.feedback ||
            "Ошибки: 1–2. В целом ответ понятный.";
        if (els.dialogMiniReview) {
            els.dialogMiniReview.textContent = reviewText;
        }

        updateStats({ mistakesFixed: 1 });

        addHistoryEntry({
            mode: "dialog",
            modeLabel: "Диалог",
            topic: state.selectedScenario,
            html: els.dialogMessages.innerHTML,
            review: reviewText
        });
    }

    async function showDialogHint() {
        if (!els.dialogMiniReview) return;

        const response = await aiChat({
            mode: "dialog_hint",
            scenario: state.selectedScenario,
            level: state.selectedLevel,
            tone: state.selectedTone,
            text: "Дай короткую подсказку для ответа"
        });

        els.dialogMiniReview.textContent =
            response?.text || "Подсказка: начни с короткой простой фразы.";
    }

    async function sendTutorMessage() {
        const text = els.tutorInput?.value?.trim();
        if (!text || !els.tutorMessages) return;

        appendMessage(els.tutorMessages, "user", text);
        els.tutorInput.value = "";

        const lessonId = els.tutorLessonSelect?.value || state.currentLesson?.id || null;
        const contextLabel = state.currentLesson?.title || "Текущий урок";

        const response = await aiChat({
            mode: "lesson_tutor",
            lessonId,
            context: contextLabel,
            text
        });

        const aiText =
            response?.text ||
            `Давайте разберём это как учитель. Контекст: ${contextLabel}.`;
        appendMessage(els.tutorMessages, "ai", aiText);

        addHistoryEntry({
            mode: "tutor",
            modeLabel: "Репетитор по уроку",
            topic: contextLabel,
            html: els.tutorMessages.innerHTML
        });
    }

    async function generateVocabulary() {
        const topic = els.vocabTopicInput?.value?.trim();
        if (!topic || !els.vocabResult) return;

        const response = await aiChat({
            mode: "vocabulary",
            topic
        });

        let words = response?.words;
        if (!Array.isArray(words) || !words.length) {
            words = [
                { word: "сөз", translation: "слово" },
                { word: "сөйлем", translation: "предложение" },
                { word: "дүкен", translation: "магазин" },
                { word: "оқу", translation: "учиться" },
                { word: "сұрақ", translation: "вопрос" }
            ];
        }

        els.vocabResult.innerHTML = `
            <div class="anatilui-vocab__grid">
                ${words
            .map((item) => {
                if (typeof item === "string") {
                    return `
                                <div class="anatilui-vocab__card">
                                    <div class="anatilui-vocab__word">${escapeHtml(item)}</div>
                                </div>
                            `;
                }

                return `
                            <div class="anatilui-vocab__card">
                                <div class="anatilui-vocab__word">${escapeHtml(item.word || "")}</div>
                                <div class="anatilui-vocab__translation">${escapeHtml(item.translation || "")}</div>
                            </div>
                        `;
            })
            .join("")}
            </div>
        `;

        updateStats({ newWords: words.length });

        addHistoryEntry({
            mode: "vocabulary",
            modeLabel: "Словарь",
            topic,
            html: els.vocabResult.innerHTML
        });
    }

    function bindActions() {
        if (els.historyBtn) {
            els.historyBtn.addEventListener("click", openHistoryDrawer);
        }

        if (els.historyClose) {
            els.historyClose.addEventListener("click", closeHistoryDrawer);
        }

        if (els.sentenceCheckBtn) {
            els.sentenceCheckBtn.addEventListener("click", () => handleSentenceCheck(""));
        }

        if (els.sentenceHarderBtn) {
            els.sentenceHarderBtn.addEventListener("click", () =>
                handleSentenceCheck("Сделай объяснение сложнее и добавь более трудное мини-задание")
            );
        }

        if (els.sentenceEasierBtn) {
            els.sentenceEasierBtn.addEventListener("click", () =>
                handleSentenceCheck("Сделай объяснение проще и короче")
            );
        }

        if (els.sentenceExamplesBtn) {
            els.sentenceExamplesBtn.addEventListener("click", () =>
                handleSentenceCheck("Дай ещё 3 примера")
            );
        }

        if (els.dialogStartBtn) {
            els.dialogStartBtn.addEventListener("click", startDialog);
        }

        if (els.dialogSendBtn) {
            els.dialogSendBtn.addEventListener("click", sendDialogMessage);
        }

        if (els.dialogInput) {
            els.dialogInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendDialogMessage();
                }
            });
        }

        if (els.dialogHintBtn) {
            els.dialogHintBtn.addEventListener("click", showDialogHint);
        }

        if (els.tutorCurrentLessonBtn) {
            els.tutorCurrentLessonBtn.addEventListener("click", () => {
                if (els.tutorContextBadge && state.currentLesson) {
                    els.tutorContextBadge.textContent = `Контекст: ${state.currentLesson.title}`;
                }
            });
        }

        if (els.tutorSendBtn) {
            els.tutorSendBtn.addEventListener("click", sendTutorMessage);
        }

        if (els.tutorInput) {
            els.tutorInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendTutorMessage();
                }
            });
        }

        if (els.vocabGenerateBtn) {
            els.vocabGenerateBtn.addEventListener("click", generateVocabulary);
        }
    }

    async function init() {
        loadLocalState();
        renderTopInfo();
        renderStats();
        renderHistory();
        renderLastSession();

        bindModeCards();
        bindDialogChips();
        bindActions();
        switchMode("sentence");

        await loadUser();
        await loadCurrentLessonContext();
    }

    document.addEventListener("DOMContentLoaded", init);
})();