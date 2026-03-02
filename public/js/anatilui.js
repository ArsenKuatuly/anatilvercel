(function () {
    // -----------------------------
    // Helpers
    // -----------------------------
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    function nowTimeRU() {
        const d = new Date();
        return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    }

    function setHidden(el, hidden) {
        if (!el) return;
        el.hidden = !!hidden;
    }

    function toast(msg) {
        const t = $("#toast");
        const tt = $("#toastText");
        if (!t || !tt) return;
        tt.textContent = msg;
        t.hidden = false;
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => (t.hidden = true), 1400);
    }

    function escapeHtml(s) {
        return String(s)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    // -----------------------------
    // AI Session + Usage badge
    // -----------------------------
    let activeAiSessionId = null;

    async function ensureSession(mode, meta = {}) {
        if (activeAiSessionId) return activeAiSessionId;

        if (typeof window.apiFetch !== "function") {
            throw new Error("apiFetch is not available");
        }

        const out = await window.apiFetch("/api/ai/session/start", {
            method: "POST",
            body: JSON.stringify({ mode, ...meta }),
        });

        const d = out?.data;
        if (!d?.success || !d?.session?.id) {
            throw new Error(d?.message || "Session start failed");
        }

        activeAiSessionId = d.session.id;
        return activeAiSessionId;
    }

    function resetSession() {
        activeAiSessionId = null;
    }

    async function refreshAiUsageBadge() {
        try {
            if (typeof window.apiFetch !== "function") return;
            const out = await window.apiFetch("/api/ai/usage/today", { method: "GET" });
            const d = out?.data;
            if (!d?.success) return;

            const now = $("#messagesNow");
            const max = $("#messagesMax");
            if (now) now.textContent = String(d.used);
            if (max) max.textContent = String(d.limit);
        } catch {
            // ignore
        }
    }

    // -----------------------------
    // AI API (Vercel /api/ai/chat)
    // -----------------------------
    async function aiChat(message, sessionId) {
        // Prefer apiFetch if exists (common in your project), fallback to fetch
        if (typeof window.apiFetch === "function") {
            const out = await window.apiFetch("/api/ai/chat", {
                method: "POST",
                body: JSON.stringify({ message, sessionId }),
            });

            const data = out && out.data;
            if (!data) throw new Error("Empty response");
            if (data.error) throw new Error(data.details || data.error);
            if (typeof data.reply !== "string") throw new Error("Bad AI response");

            // Update badge if backend returns usage
            if (data.usage) {
                const now = $("#messagesNow");
                const max = $("#messagesMax");
                if (now) now.textContent = String(data.usage.used);
                if (max) max.textContent = String(data.usage.limit);
            }

            return data.reply;
        }

        const r = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, sessionId }),
        });
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error((data && (data.details || data.error)) || "Request failed");
        if (!data || typeof data.reply !== "string") throw new Error("Bad AI response");
        return data.reply;
    }

    function extractJsonFromText(text) {
        const s = String(text || "").trim();
        if (!s) return null;

        // If wrapped in ```json ... ```
        const fenced = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        const candidate = fenced ? fenced[1].trim() : s;

        try {
            return JSON.parse(candidate);
        } catch {
            // Try to slice first {...} block
            const i = candidate.indexOf("{");
            const j = candidate.lastIndexOf("}");
            if (i >= 0 && j > i) {
                try {
                    return JSON.parse(candidate.slice(i, j + 1));
                } catch {
                    return null;
                }
            }
            return null;
        }
    }

    // -----------------------------
    // Routing (hash-based)
    // -----------------------------
    const views = {
        home: $("#viewHome"),
        sentence: $("#viewSentence"),
        dialog: $("#viewDialog"),
        tutor: $("#viewTutor"),
    };

    const backBar = $("#backBar");
    const backBtn = $("#backBtn");

    function showView(name) {
        Object.keys(views).forEach((k) => setHidden(views[k], k !== name));
        setHidden(backBar, name === "home");
    }

    function getRoute() {
        const h = (location.hash || "#/").trim();
        const path = h.replace(/^#\/?/, "");
        if (!path) return "home";
        if (views[path]) return path;
        return "home";
    }

    function go(route) {
        location.hash = route === "home" ? "#/" : `#/${route}`;
    }

    window.addEventListener("hashchange", () => {
        const route = getRoute();
        showView(route);

        // New route => new session
        resetSession();

        // When opening dialog/tutor on mobile, ensure sheet closed
        closeMobileSettings();
    });

    // -----------------------------
    // History panel (Sheet)
    // -----------------------------
    const historySheet = $("#historySheet");
    const historyOpenBtn = $("#historyOpenBtn");
    const historyCloseBtn = $("#historyCloseBtn");
    const historyBackdrop = $("#historyBackdrop");
    const historyList = $("#historyList");

    const historyItems = [
        { id: "1", mode: "sentence", date: "1 марта, 14:32", topic: "Проверка предложения", preview: "Мен кофе ішемін..." },
        { id: "2", mode: "dialog", date: "1 марта, 12:15", topic: "Диалог: Кафе", preview: "Практиковал заказ в кафе" },
        { id: "3", mode: "tutor", date: "28 февраля, 18:45", topic: "Урок 12 — Келер шақ", preview: "Вопросы по будущему времени" },
    ];

    function modeBadgeClass(mode) {
        if (mode === "sentence") return "hitem__badge hitem__badge--purple";
        if (mode === "dialog") return "hitem__badge hitem__badge--blue";
        return "hitem__badge hitem__badge--green";
    }
    function modeLabel(mode) {
        if (mode === "sentence") return "Проверка";
        if (mode === "dialog") return "Диалог";
        return "Репетитор";
    }
    function modeIcon(mode) {
        if (mode === "sentence") return "✍️";
        if (mode === "dialog") return "💬";
        return "🎓";
    }

    function renderHistory() {
        if (!historyList) return;
        historyList.innerHTML = historyItems
            .map((it) => {
                return `
          <div class="hitem" data-go="${it.mode}">
            <div class="hitem__top">
              <div class="${modeBadgeClass(it.mode)}">${modeIcon(it.mode)} ${modeLabel(it.mode)}</div>
              <div class="hitem__date"><span class="icon icon--clock" aria-hidden="true"></span>${it.date}</div>
            </div>
            <h4 class="hitem__title">${it.topic}</h4>
            <p class="hitem__preview">${it.preview}</p>
          </div>
        `;
            })
            .join("");

        $$(".hitem", historyList).forEach((node) => {
            node.addEventListener("click", () => {
                const r = node.getAttribute("data-go") || "home";
                closeHistory();
                go(r);
            });
        });
    }

    function openHistory() {
        if (!historySheet) return;
        historySheet.classList.add("sheet--open");
        historySheet.setAttribute("aria-hidden", "false");
    }
    function closeHistory() {
        if (!historySheet) return;
        historySheet.classList.remove("sheet--open");
        historySheet.setAttribute("aria-hidden", "true");
    }

    historyOpenBtn && historyOpenBtn.addEventListener("click", openHistory);
    historyCloseBtn && historyCloseBtn.addEventListener("click", closeHistory);
    historyBackdrop && historyBackdrop.addEventListener("click", closeHistory);

    renderHistory();

    // -----------------------------
    // Home: achievements
    // -----------------------------
    const achievementsList = $("#achievementsList");
    const achievements = [
        { icon: "✅", title: "Проверил 10 предложений", achieved: true },
        { icon: "💬", title: "Прошёл 3 диалога подряд", achieved: true },
        { icon: "🔥", title: "7 дней подряд практика", achieved: false },
    ];

    function renderAchievements() {
        if (!achievementsList) return;
        achievementsList.innerHTML = achievements
            .map((a) => {
                const cls = a.achieved ? "ach ach--on" : "ach ach--off";
                return `
          <div class="${cls}">
            <div class="ach__icon">${a.icon}</div>
            <div class="ach__text">${a.title}</div>
          </div>
        `;
            })
            .join("");
    }
    renderAchievements();

    // Home mode cards navigation
    $$("#modesGrid [data-route]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const r = btn.getAttribute("data-route");
            if (r) go(r);
        });
    });

    // Back button
    backBtn && backBtn.addEventListener("click", () => go("home"));

    // -----------------------------
    // Sentence mode
    // -----------------------------
    let sentenceState = {
        level: "A1",
        complexity: "simple",
        sentence: "",
        loading: false,
        result: null,
    };

    const sentenceLevel = $("#sentenceLevel");
    const sentenceComplexity = $("#sentenceComplexity");
    const sentenceTextarea = $("#sentenceTextarea");
    const sentenceCheckBtn = $("#sentenceCheckBtn");
    const sentenceLoading = $("#sentenceLoading");
    const sentenceResult = $("#sentenceResult");
    const sentenceEmpty = $("#sentenceEmpty");

    function setChipActive(container, selectorAttr, value) {
        if (!container) return;
        $$(`button[${selectorAttr}]`, container).forEach((b) => {
            b.classList.toggle("chip--active", b.getAttribute(selectorAttr) === value);
        });
    }

    function sentenceUpdateUI() {
        setHidden(sentenceLoading, !sentenceState.loading);
        setHidden(sentenceEmpty, sentenceState.loading || !!sentenceState.result);
        setHidden(sentenceResult, !sentenceState.result || sentenceState.loading);

        if (sentenceCheckBtn) {
            const can = !!sentenceState.sentence.trim() && !sentenceState.loading;
            sentenceCheckBtn.disabled = !can;
        }

        if (sentenceResult && sentenceState.result && !sentenceState.loading) {
            sentenceResult.innerHTML = renderResultCard(sentenceState.result);
            bindResultCard(sentenceResult, sentenceState.result);
        }
    }

    function renderResultCard(res) {
        const errorsHtml = (res.errors || [])
            .map(
                (e) => `
        <div class="err">
          <p class="err__title">${escapeHtml(e.text)}</p>
          <p class="err__desc">${escapeHtml(e.explanation)}</p>
        </div>
      `
            )
            .join("");

        const examplesHtml = (res.examples || []).map((ex) => `<li>${escapeHtml(ex)}</li>`).join("");

        return `
      <div class="result">
        <section class="card result__card">
          <div class="result__section">
            <div class="result__head">
              <span class="icon icon--check" style="color:#16A34A" aria-hidden="true"></span>
              <h4 class="result__h">Исправленный вариант</h4>
            </div>
            <div class="result__box result__box--green">
              <p>${escapeHtml(res.corrected)}</p>
              <button class="button button--ghost result__copy" data-copy type="button" title="Копировать">
                ⧉
              </button>
            </div>
          </div>

          ${
            (res.errors || []).length
                ? `
            <div class="result__section">
              <div class="result__head">
                <span class="icon icon--bulb" style="color:#D97706" aria-hidden="true"></span>
                <h4 class="result__h">Ошибки (${(res.errors || []).length})</h4>
              </div>
              <div class="result__errors">${errorsHtml}</div>
            </div>
          `
                : ""
        }

          ${
            res.rule
                ? `
            <div class="result__section">
              <div class="result__head">
                <span class="icon icon--book" style="color:#2563EB" aria-hidden="true"></span>
                <h4 class="result__h">Правило</h4>
              </div>
              <div class="result__rule">${escapeHtml(res.rule)}</div>
            </div>
          `
                : ""
        }

          ${
            (res.examples || []).length
                ? `
            <div class="result__section">
              <div class="result__head">
                <span class="icon icon--book" style="color:#2563EB" aria-hidden="true"></span>
                <h4 class="result__h">Примеры</h4>
              </div>
              <div class="result__examples">
                <ul>${examplesHtml}</ul>
              </div>
            </div>
          `
                : ""
        }

          ${
            res.exercise
                ? `
            <div class="result__section">
              <div class="result__head">
                <span class="icon icon--target" aria-hidden="true"></span>
                <h4 class="result__h">Задание</h4>
              </div>
              <div class="result__exercise">${escapeHtml(res.exercise)}</div>
            </div>
          `
                : ""
        }
        </section>
      </div>
    `;
    }

    function bindResultCard(root, res) {
        const copyBtn = $("[data-copy]", root);
        copyBtn &&
        copyBtn.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(res.corrected || "");
                toast("Скопировано!");
            } catch {
                toast("Не удалось скопировать");
            }
        });
    }

    sentenceLevel &&
    sentenceLevel.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-level]");
        if (!btn) return;
        sentenceState.level = btn.getAttribute("data-level");
        setChipActive(sentenceLevel, "data-level", sentenceState.level);
    });

    sentenceComplexity &&
    sentenceComplexity.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-complexity]");
        if (!btn) return;
        sentenceState.complexity = btn.getAttribute("data-complexity");
        setChipActive(sentenceComplexity, "data-complexity", sentenceState.complexity);
    });

    sentenceTextarea &&
    sentenceTextarea.addEventListener("input", () => {
        sentenceState.sentence = sentenceTextarea.value;
        sentenceState.result = null;
        sentenceUpdateUI();
    });

    sentenceCheckBtn &&
    sentenceCheckBtn.addEventListener("click", async () => {
        if (!sentenceState.sentence.trim() || sentenceState.loading) return;

        sentenceState.loading = true;
        sentenceState.result = null;
        sentenceUpdateUI();

        try {
            const prompt = [
                "Режим: Проверка предложения (казахский язык).",
                `Уровень ученика: ${sentenceState.level}.`,
                `Сложность объяснений: ${sentenceState.complexity === "detailed" ? "подробно" : "просто"}.`,
                "Пользователь написал предложение на казахском. Проверь и исправь.",
                "Ответь СТРОГО в JSON без лишнего текста и без markdown.",
                "Формат:",
                '{"corrected":"...","errors":[{"text":"...","explanation":"..."}],"rule":"...","examples":["..."],"exercise":"..."}',
                "Требования:",
                "- corrected: исправленный вариант на казахском",
                "- errors: 0..5 ключевых ошибок (если нет — пустой массив)",
                "- rule: короткое правило/объяснение (русский)",
                "- examples: 2..4 примера (казахский + в скобках русский)",
                "- exercise: 1 задание для закрепления (русский)",
                "Предложение пользователя:",
                sentenceState.sentence,
            ].join("\n");

            const sid = await ensureSession("sentence");
            const reply = await aiChat(prompt, sid);

            const json = extractJsonFromText(reply);
            if (!json || typeof json !== "object") throw new Error("parse");

            sentenceState.result = {
                original: sentenceState.sentence,
                corrected: json.corrected || "",
                errors: Array.isArray(json.errors) ? json.errors : [],
                rule: json.rule || "",
                examples: Array.isArray(json.examples) ? json.examples : [],
                exercise: json.exercise || "",
            };
        } catch (e) {
            console.error(e);
            toast("Ошибка ИИ. Попробуйте ещё раз");
        } finally {
            sentenceState.loading = false;
            sentenceUpdateUI();
        }
    });

    // -----------------------------
    // Dialog mode
    // -----------------------------
    const dialogScenario = $("#dialogScenario");
    const dialogLevel = $("#dialogLevel");
    const dialogTone = $("#dialogTone");
    const dialogStartBtn = $("#dialogStartBtn");
    const dialogMessages = $("#dialogMessages");
    const dialogInput = $("#dialogInput");
    const dialogSendBtn = $("#dialogSendBtn");
    const dialogEmpty = $("#dialogEmpty");
    const dialogHintBtn = $("#dialogHintBtn");

    const scenarios = [
        { value: "cafe", label: "Кафе", icon: "☕" },
        { value: "taxi", label: "Такси", icon: "🚕" },
        { value: "shop", label: "Магазин", icon: "🛒" },
        { value: "university", label: "Универ", icon: "🎓" },
        { value: "meet", label: "Знакомство", icon: "👋" },
    ];

    let dialogState = {
        scenario: "cafe",
        level: "A1",
        tone: "friendly",
        started: false,
        messages: [],
    };

    function renderDialogScenarios() {
        if (!dialogScenario) return;
        dialogScenario.innerHTML = scenarios
            .map((s) => {
                const active = s.value === dialogState.scenario ? "chip chip--active chip--center" : "chip chip--center";
                return `<button class="${active}" type="button" data-scenario="${s.value}"><span>${s.icon}</span>${s.label}</button>`;
            })
            .join("");
    }

    function renderChatBubble({ isAI, message, feedback, timestamp }) {
        const rootCls = isAI ? "bubble" : "bubble bubble--user";
        const avatarCls = isAI ? "bubble__avatar bubble__avatar--ai" : "bubble__avatar bubble__avatar--user";
        const msgCls = isAI ? "bubble__msg bubble__msg--ai" : "bubble__msg bubble__msg--user";

        return `
      <div class="${rootCls}">
        <div class="${avatarCls}" aria-hidden="true">${isAI ? "🤖" : "👤"}</div>
        <div class="bubble__col">
          <div class="${msgCls}">${escapeHtml(message)}</div>
          ${
            feedback
                ? `<div class="bubble__feedback">
                  <div style="display:flex;flex-direction:column;gap:4px">
                    <div style="font-weight:600;color:#15803D">✓ Отлично!</div>
                    <div style="font-size:12px;color:#4B5563">${escapeHtml(feedback)}</div>
                  </div>
                </div>`
                : ""
        }
          ${timestamp ? `<div class="bubble__time">${escapeHtml(timestamp)}</div>` : ""}
        </div>
      </div>
    `;
    }

    function dialogUpdateUI() {
        if (!dialogInput || !dialogSendBtn || !dialogMessages || !dialogEmpty) return;

        dialogInput.disabled = !dialogState.started;
        dialogSendBtn.disabled = !dialogState.started || !dialogInput.value.trim();

        if (!dialogState.started) {
            dialogMessages.innerHTML = dialogEmpty.outerHTML;
            return;
        }

        dialogMessages.innerHTML = dialogState.messages.map(renderChatBubble).join("");
        dialogMessages.scrollTop = dialogMessages.scrollHeight;
    }

    renderDialogScenarios();

    dialogScenario &&
    dialogScenario.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-scenario]");
        if (!btn) return;
        dialogState.scenario = btn.getAttribute("data-scenario");
        renderDialogScenarios();
    });

    dialogLevel &&
    dialogLevel.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-level]");
        if (!btn) return;
        dialogState.level = btn.getAttribute("data-level");
        setChipActive(dialogLevel, "data-level", dialogState.level);
    });

    dialogTone &&
    dialogTone.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-tone]");
        if (!btn) return;
        dialogState.tone = btn.getAttribute("data-tone");
        setChipActive(dialogTone, "data-tone", dialogState.tone);
    });

    dialogStartBtn &&
    dialogStartBtn.addEventListener("click", async () => {
        dialogState.started = true;
        dialogState.messages = [];
        if (dialogInput) dialogInput.value = "";
        dialogUpdateUI();

        try {
            const scenarioLabel = scenarios.find((s) => s.value === dialogState.scenario)?.label || dialogState.scenario;
            const prompt = [
                "Режим: Диалог для практики казахского языка.",
                `Сценарий: ${scenarioLabel}.`,
                `Уровень ученика: ${dialogState.level}.`,
                `Тон: ${dialogState.tone === "formal" ? "официальный" : "дружелюбный"}.`,
                "Начни диалог с приветствия и первым вопросом.",
                "Формат ответа: одна реплика на казахском + в скобках русский перевод.",
            ].join("\n");

            const sid = await ensureSession("dialog", { scenario: dialogState.scenario });
            const reply = await aiChat(prompt, sid);

            dialogState.messages.push({
                id: "1",
                isAI: true,
                message: reply,
                timestamp: nowTimeRU(),
            });
        } catch (e) {
            console.error(e);
            toast("Не удалось начать диалог");
            dialogState.started = false;
        } finally {
            dialogUpdateUI();
        }
    });

    dialogInput &&
    dialogInput.addEventListener("input", () => {
        dialogUpdateUI();
    });

    async function dialogSend() {
        if (!dialogInput || !dialogInput.value.trim() || !dialogState.started) return;

        const text = dialogInput.value;
        dialogState.messages.push({
            id: String(Date.now()),
            isAI: false,
            message: text,
            timestamp: nowTimeRU(),
        });
        dialogInput.value = "";
        dialogUpdateUI();

        try {
            const hist = dialogState.messages
                .slice(-10)
                .map((m) => `${m.isAI ? "AI" : "USER"}: ${m.message}`)
                .join("\n");

            const scenarioLabel = scenarios.find((s) => s.value === dialogState.scenario)?.label || dialogState.scenario;

            const prompt = [
                "Режим: Диалог для практики казахского языка.",
                `Сценарий: ${scenarioLabel}.`,
                `Уровень ученика: ${dialogState.level}.`,
                `Тон: ${dialogState.tone === "formal" ? "официальный" : "дружелюбный"}.`,
                "Ты играешь роль собеседника по выбранному сценарию.",
                "Отвечай коротко на казахском + в скобках русский перевод.",
                "Также дай ОДНУ короткую подсказку/правку по фразе ученика (русский).",
                "Ответь СТРОГО в JSON без markdown:",
                '{"reply":"...","feedback":"..."}',
                "История диалога:",
                hist,
                "Ответь на последнее сообщение пользователя и продолжи разговор одним вопросом.",
            ].join("\n");

            const sid = await ensureSession("dialog", { scenario: dialogState.scenario });
            const reply = await aiChat(prompt, sid);

            const json = extractJsonFromText(reply) || {};
            const aiMsg = String(json.reply || reply || "").trim();
            const fb = json.feedback ? String(json.feedback).trim() : "";

            dialogState.messages.push({
                id: String(Date.now() + 1),
                isAI: true,
                message: aiMsg,
                feedback: fb,
                timestamp: nowTimeRU(),
            });
        } catch (e) {
            console.error(e);
            toast("Ошибка ИИ. Попробуйте ещё раз");
        } finally {
            dialogUpdateUI();
        }
    }

    dialogSendBtn && dialogSendBtn.addEventListener("click", dialogSend);
    dialogInput &&
    dialogInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") dialogSend();
    });

    dialogHintBtn &&
    dialogHintBtn.addEventListener("click", () => {
        toast("Подсказка: попробуй ответить коротко (мысалы: «Бір американо, өтінемін.»)");
    });

    // -----------------------------
    // Tutor: DB lessons loader + cache
    // -----------------------------
    const tutorLessonCache = new Map(); // lessonId -> { id, title, content }

    async function apiGet(url) {
        const out = await window.apiFetch(url, { method: "GET" });
        if (!out || !out.data) throw new Error("Empty response");
        if (out.data.success === false) throw new Error(out.data.message || "API error");
        return out.data;
    }

    async function fetchLessonFromDb(lessonId) {
        const id = Number(lessonId);
        if (!id) throw new Error("Invalid lesson id");

        if (tutorLessonCache.has(id)) return tutorLessonCache.get(id);

        const data = await apiGet(`/api/lesson/${id}`);
        if (!data.lesson) throw new Error("Lesson not found");

        const lesson = {
            id: data.lesson.id,
            title: data.lesson.title || "",
            content: data.lesson.content || "",
        };

        tutorLessonCache.set(id, lesson);
        return lesson;
    }

    function flattenCourseLessons(modules) {
        const out = [];
        (modules || []).forEach((m) => {
            (m.lessons || []).forEach((l) => {
                out.push({
                    id: String(l.id),
                    label: `${m.title || "Модуль"} — ${l.title || "Урок"}`,
                    moduleTitle: m.title || "",
                    lessonTitle: l.title || "",
                    locked: !!m.locked,
                    completed: !!l.completed,
                });
            });
        });
        return out;
    }

    // -----------------------------
    // Tutor mode (DB-based)
    // -----------------------------
    const tutorMessages = $("#tutorMessages");
    const tutorInput = $("#tutorInput");
    const tutorSendBtn = $("#tutorSendBtn");

    const lessonTrigger = $("#lessonTrigger");
    const lessonMenu = $("#lessonMenu");
    const lessonValue = $("#lessonValue");

    let tutorLessons = [];
    let tutorCourse = null;

    let tutorState = {
        lessonId: null,
        messages: [
            {
                id: "1",
                isAI: true,
                message:
                    "Сәлеметсіз! Я AI-репетитор AnaTil. Выберите урок и задайте вопрос — я буду объяснять по материалу урока.",
                timestamp: nowTimeRU(),
            },
        ],
    };

    function renderLessons() {
        if (!lessonMenu) return;

        if (!tutorLessons.length) {
            lessonMenu.innerHTML = `<div style="padding:12px;color:#6B7280;font-size:12px">Уроки не найдены</div>`;
            return;
        }

        lessonMenu.innerHTML = tutorLessons
            .map((l) => {
                const isActive = String(l.id) === String(tutorState.lessonId);
                const active = isActive ? "select__item select__item--active" : "select__item";
                const lock = l.locked ? " 🔒" : "";
                const done = l.completed ? " ✅" : "";
                const label = `${l.label}${lock}${done}`;

                return `<button class="${active}" type="button" role="option" data-lesson-id="${l.id}" ${
                    l.locked ? 'data-locked="1"' : ""
                }>${escapeHtml(label)}</button>`;
            })
            .join("");
    }

    function updateLessonLabel() {
        if (!lessonValue) return;
        const found = tutorLessons.find((x) => String(x.id) === String(tutorState.lessonId));
        lessonValue.textContent = found ? found.label : "Выберите урок";
    }

    function openLessonMenu() {
        if (!lessonMenu || !lessonTrigger) return;
        lessonMenu.classList.add("select__menu--open");
        lessonTrigger.setAttribute("aria-expanded", "true");
        lessonMenu.setAttribute("aria-hidden", "false");
    }
    function closeLessonMenu() {
        if (!lessonMenu || !lessonTrigger) return;
        lessonMenu.classList.remove("select__menu--open");
        lessonTrigger.setAttribute("aria-expanded", "false");
        lessonMenu.setAttribute("aria-hidden", "true");
    }
    function toggleLessonMenu() {
        if (!lessonMenu) return;
        if (lessonMenu.classList.contains("select__menu--open")) closeLessonMenu();
        else openLessonMenu();
    }

    function tutorUpdateUI() {
        if (!tutorMessages) return;
        tutorMessages.innerHTML = tutorState.messages.map((m) => renderChatBubble(m)).join("");
        tutorMessages.scrollTop = tutorMessages.scrollHeight;

        if (tutorSendBtn) {
            const ok = !!tutorInput.value.trim() && !!tutorState.lessonId;
            tutorSendBtn.disabled = !ok;
        }
    }

    async function initTutorFromDb() {
        try {
            const prog = await apiGet("/api/lessons/progress/current");
            tutorCourse = prog.course || null;

            if (!tutorCourse?.slug) {
                toast("Курс не найден для вашего уровня");
                return;
            }

            const courseData = await apiGet(`/api/course/${encodeURIComponent(tutorCourse.slug)}`);
            const modules = (courseData && courseData.modules) || [];
            tutorLessons = flattenCourseLessons(modules);

            const nextId = prog.nextLesson?.id ? String(prog.nextLesson.id) : null;
            const lastId = prog.lastLesson?.id ? String(prog.lastLesson.id) : null;

            const firstUnlocked = tutorLessons.find((x) => !x.locked)?.id || null;
            tutorState.lessonId = nextId || lastId || firstUnlocked || (tutorLessons[0] ? tutorLessons[0].id : null);

            renderLessons();
            updateLessonLabel();
            tutorUpdateUI();

            if (tutorState.lessonId) {
                fetchLessonFromDb(tutorState.lessonId).catch(() => {});
            }
        } catch (e) {
            console.error(e);
            toast("Не удалось загрузить уроки из базы");
        }
    }

    initTutorFromDb();

    lessonTrigger && lessonTrigger.addEventListener("click", toggleLessonMenu);

    lessonMenu &&
    lessonMenu.addEventListener("click", async (e) => {
        const btn = e.target.closest("button[data-lesson-id]");
        if (!btn) return;

        if (btn.getAttribute("data-locked") === "1") {
            toast("Этот урок пока закрыт");
            return;
        }

        tutorState.lessonId = btn.getAttribute("data-lesson-id");
        renderLessons();
        updateLessonLabel();
        closeLessonMenu();
        tutorUpdateUI();

        try {
            await fetchLessonFromDb(tutorState.lessonId);
            toast("Урок выбран");

            // new lesson -> new session
            resetSession();
        } catch {
            toast("Не удалось загрузить урок");
        }
    });

    document.addEventListener("click", (e) => {
        const sel = $("#lessonSelect");
        if (!sel) return;
        if (sel.contains(e.target)) return;
        closeLessonMenu();
    });

    async function tutorSend() {
        if (!tutorInput || !tutorInput.value.trim()) return;
        if (!tutorState.lessonId) {
            toast("Сначала выберите урок");
            return;
        }

        const text = tutorInput.value;
        tutorState.messages.push({ id: String(Date.now()), isAI: false, message: text, timestamp: nowTimeRU() });
        tutorInput.value = "";
        tutorUpdateUI();

        try {
            const lesson = await fetchLessonFromDb(tutorState.lessonId);

            const hist = tutorState.messages
                .slice(-10)
                .map((m) => `${m.isAI ? "AI" : "USER"}: ${m.message}`)
                .join("\n");

            const prompt = [
                "Ты — AI-репетитор платформы AnaTil по казахскому языку.",
                "Отвечай по-русски, но примеры давай на казахском с переводом.",
                "Правила:",
                "- Используй ТОЛЬКО материал урока ниже (если чего-то нет — скажи, что этого нет в уроке, и предложи спросить по теме урока).",
                "- Объясняй пошагово, очень понятно.",
                "- В конце дай 1 мини-упражнение по теме.",
                "",
                `УРОК: ${lesson.title}`,
                "МАТЕРИАЛ УРОКА (как есть из базы):",
                lesson.content || "(пусто)",
                "",
                "ИСТОРИЯ ЧАТА:",
                hist,
                "",
                "ОТВЕТЬ НА ПОСЛЕДНИЙ ВОПРОС ПОЛЬЗОВАТЕЛЯ:",
            ].join("\n");

            const sid = await ensureSession("tutor", { lessonId: tutorState.lessonId });
            const reply = await aiChat(prompt, sid);

            tutorState.messages.push({
                id: String(Date.now() + 1),
                isAI: true,
                message: reply,
                timestamp: nowTimeRU(),
            });
        } catch (e) {
            console.error(e);
            toast("Ошибка ИИ. Попробуйте ещё раз");
        } finally {
            tutorUpdateUI();
        }
    }

    tutorSendBtn && tutorSendBtn.addEventListener("click", tutorSend);
    tutorInput && tutorInput.addEventListener("input", () => tutorUpdateUI());
    tutorInput &&
    tutorInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") tutorSend();
    });

    // -----------------------------
    // Mobile settings sheet (bottom)
    // -----------------------------
    const mobileSettingsSheet = $("#mobileSettingsSheet");
    const mobileSettingsBackdrop = $("#mobileSettingsBackdrop");
    const mobileSettingsCloseBtn = $("#mobileSettingsCloseBtn");
    const mobileSettingsBody = $("#mobileSettingsBody");

    const dialogMobileSettingsBtn = $("#dialogMobileSettingsBtn");
    const tutorMobileSettingsBtn = $("#tutorMobileSettingsBtn");

    function openMobileSettings(fromMode) {
        if (!mobileSettingsSheet || !mobileSettingsBody) return;

        // Clone the settings panel from the corresponding mode to keep layout identical
        mobileSettingsBody.innerHTML = "";
        if (fromMode === "dialog") {
            const src = $("#dialogSettings");
            if (src) mobileSettingsBody.appendChild(src.cloneNode(true));
        } else if (fromMode === "tutor") {
            const src = $("#tutorSettings");
            if (src) mobileSettingsBody.appendChild(src.cloneNode(true));
        }

        // Re-bind interactions inside cloned node (chips/select)
        rebindMobileSettings(fromMode);

        mobileSettingsSheet.classList.add("sheet--open");
        mobileSettingsSheet.setAttribute("aria-hidden", "false");
    }

    function closeMobileSettings() {
        if (!mobileSettingsSheet) return;
        mobileSettingsSheet.classList.remove("sheet--open");
        mobileSettingsSheet.setAttribute("aria-hidden", "true");
    }

    function rebindMobileSettings(fromMode) {
        if (!mobileSettingsBody) return;

        if (fromMode === "dialog") {
            const sc = $(".chips--grid", mobileSettingsBody);
            const lvl = $("#dialogLevel", mobileSettingsBody);
            const tone = $("#dialogTone", mobileSettingsBody);
            const start = $("#dialogStartBtn", mobileSettingsBody);

            // render scenarios inside cloned sheet
            if (sc) {
                sc.innerHTML = scenarios
                    .map((s) => {
                        const active = s.value === dialogState.scenario ? "chip chip--active chip--center" : "chip chip--center";
                        return `<button class="${active}" type="button" data-scenario="${s.value}"><span>${s.icon}</span>${s.label}</button>`;
                    })
                    .join("");

                sc.addEventListener("click", (e) => {
                    const btn = e.target.closest("button[data-scenario]");
                    if (!btn) return;
                    dialogState.scenario = btn.getAttribute("data-scenario");
                    renderDialogScenarios();
                    rebindMobileSettings("dialog");
                });
            }

            if (lvl) {
                lvl.addEventListener("click", (e) => {
                    const btn = e.target.closest("button[data-level]");
                    if (!btn) return;
                    dialogState.level = btn.getAttribute("data-level");
                    setChipActive(dialogLevel, "data-level", dialogState.level);
                    setChipActive(lvl, "data-level", dialogState.level);
                });
            }

            if (tone) {
                tone.addEventListener("click", (e) => {
                    const btn = e.target.closest("button[data-tone]");
                    if (!btn) return;
                    dialogState.tone = btn.getAttribute("data-tone");
                    setChipActive(dialogTone, "data-tone", dialogState.tone);
                    setChipActive(tone, "data-tone", dialogState.tone);
                });
            }

            if (start) {
                start.addEventListener("click", () => {
                    dialogStartBtn && dialogStartBtn.click();
                    closeMobileSettings();
                });
            }

            // sync active classes
            if (lvl) setChipActive(lvl, "data-level", dialogState.level);
            if (tone) setChipActive(tone, "data-tone", dialogState.tone);
        }

        if (fromMode === "tutor") {
            // Keep mobile tutor settings simple: open desktop select in main UI
            const trigger = $("#lessonTrigger", mobileSettingsBody);
            const menu = $("#lessonMenu", mobileSettingsBody);
            const value = $("#lessonValue", mobileSettingsBody);

            if (value) value.textContent = lessonValue ? lessonValue.textContent : value.textContent;

            if (menu) {
                // Use DB lessons
                if (!tutorLessons.length) {
                    menu.innerHTML = `<div style="padding:12px;color:#6B7280;font-size:12px">Уроки не найдены</div>`;
                } else {
                    menu.innerHTML = tutorLessons
                        .map((l) => {
                            const isActive = String(l.id) === String(tutorState.lessonId);
                            const active = isActive ? "select__item select__item--active" : "select__item";
                            const lock = l.locked ? " 🔒" : "";
                            const done = l.completed ? " ✅" : "";
                            const label = `${l.label}${lock}${done}`;
                            return `<button class="${active}" type="button" role="option" data-lesson-id="${l.id}" ${
                                l.locked ? 'data-locked="1"' : ""
                            }>${escapeHtml(label)}</button>`;
                        })
                        .join("");
                }
            }

            if (trigger && menu) {
                trigger.addEventListener("click", () => {
                    menu.classList.toggle("select__menu--open");
                });
            }

            if (menu) {
                menu.addEventListener("click", async (e) => {
                    const btn = e.target.closest("button[data-lesson-id]");
                    if (!btn) return;

                    if (btn.getAttribute("data-locked") === "1") {
                        toast("Этот урок пока закрыт");
                        return;
                    }

                    const v = btn.getAttribute("data-lesson-id");
                    tutorState.lessonId = v;

                    renderLessons();
                    updateLessonLabel();
                    tutorUpdateUI();

                    if (value) value.textContent = tutorLessons.find((x) => String(x.id) === String(v))?.label || value.textContent;

                    $$(".select__item", menu).forEach((b) =>
                        b.classList.toggle("select__item--active", b.getAttribute("data-lesson-id") === v)
                    );
                    menu.classList.remove("select__menu--open");

                    // new lesson -> new session
                    resetSession();

                    try {
                        await fetchLessonFromDb(v);
                        toast("Урок выбран");
                    } catch {
                        toast("Не удалось загрузить урок");
                    }
                });
            }
        }
    }

    mobileSettingsBackdrop && mobileSettingsBackdrop.addEventListener("click", closeMobileSettings);
    mobileSettingsCloseBtn && mobileSettingsCloseBtn.addEventListener("click", closeMobileSettings);

    dialogMobileSettingsBtn && dialogMobileSettingsBtn.addEventListener("click", () => openMobileSettings("dialog"));
    tutorMobileSettingsBtn && tutorMobileSettingsBtn.addEventListener("click", () => openMobileSettings("tutor"));

    // -----------------------------
    // Initial route
    // -----------------------------
    showView(getRoute());

    // initial UI sync
    sentenceUpdateUI();
    dialogUpdateUI();
    tutorUpdateUI();

    // initial badge
    refreshAiUsageBadge();
})();