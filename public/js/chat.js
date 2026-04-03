// js/chat.js

(() => {
    const fab = document.querySelector(".chat-fab");
    const overlay = document.getElementById("chat");
    const closeBtn = overlay?.querySelector(".chat-close");

    const body = document.getElementById("chatBody");
    const input = document.getElementById("chatInput");
    const send = document.getElementById("chatSend");

    if (!fab || !overlay || !body || !input || !send) {
        console.warn("[chat] elements not found");
        return;
    }

    const pathname = window.location.pathname || "";
    const isIndexPage = pathname === "/" || pathname.endsWith("/index.html") || pathname === "/index";
    const hasToken = () => !!localStorage.getItem("token");

    const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

    const setFabHidden = (hidden) => {
        if (!isMobile()) {
            fab.style.display = "";
            return;
        }
        fab.style.display = hidden ? "none" : "";
    };

    const lockScroll = (locked) => {
        document.documentElement.style.overflow = locked ? "hidden" : "";
        document.body.style.overflow = locked ? "hidden" : "";
    };

    const openChat = () => {
        overlay.hidden = false;
        fab.setAttribute("aria-expanded", "true");
        document.body.classList.add("chat-open");
        setFabHidden(true);
        lockScroll(true);
        setTimeout(() => input.focus(), 0);

        if (!body.dataset.inited) {
            body.dataset.inited = "1";
            addMessage(getWelcomeMessage(), "assistant");
        }
    };

    const closeChat = () => {
        overlay.hidden = true;
        fab.setAttribute("aria-expanded", "false");
        document.body.classList.remove("chat-open");
        setFabHidden(false);
        lockScroll(false);
    };

    fab.addEventListener("click", () => {
        if (overlay.hidden) openChat();
        else closeChat();
    });

    closeBtn?.addEventListener("click", closeChat);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !overlay.hidden) closeChat();
    });

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeChat();
    });

    window.addEventListener("resize", () => {
        if (!overlay.hidden) setFabHidden(true);
        else setFabHidden(false);
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            send.click();
        }
    });

    send.addEventListener("click", async () => {
        const text = input.value.trim();
        if (!text || send.disabled) return;

        addMessage(text, "user");
        input.value = "";

        const typingEl = addTyping();
        send.disabled = true;

        try {
            const reply = isIndexPage ? await getIndexAssistantReply(text) : await getProtectedAssistantReply(text);
            removeTyping(typingEl);
            addMessage(reply, "assistant");
        } catch (err) {
            console.error(err);
            removeTyping(typingEl);
            addMessage("Не удалось получить ответ. Попробуйте ещё раз.", "assistant");
        } finally {
            send.disabled = false;
            input.focus();
        }
    });

    async function getProtectedAssistantReply(text) {
        const token = localStorage.getItem("token");
        const headers = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch("/api/ai/chat", {
            method: "POST",
            headers,
            body: JSON.stringify({ message: text })
        });

        if (res.status === 401) {
            localStorage.removeItem("token");
            return "Чтобы пользоваться AI-чатом на этой странице, войдите в аккаунт ещё раз.";
        }

        let data = null;
        try {
            data = await res.json();
        } catch {
            data = null;
        }

        if (!res.ok) {
            return data?.details || data?.error || "Ошибка сервера. Попробуйте ещё раз.";
        }

        return data?.reply || "Пустой ответ от ИИ";
    }

    async function getIndexAssistantReply(text) {
        const normalized = normalize(text);

        if (hasToken() && asksToOpenAccountArea(normalized)) {
            return [
                "Вы уже вошли в аккаунт. Обычно после входа доступны основные разделы платформы:",
                "— Dashboard: главная страница ученика",
                "— Курсы: обучение по уровням от A1 до C1",
                "— Уроки и модули: пошаговое прохождение материала",
                "— AI-практика: диалог, проверка предложения и репетитор",
                "— Профиль и прогресс: результаты, достижения и текущий уровень"
            ].join("\n");
        }

        return buildIndexReply(normalized);
    }

    function getWelcomeMessage() {
        if (isIndexPage) {
            return [
                "Здравствуйте! Я помощник AnaTil на главной странице.",
                "Могу подсказать:",
                "— что представляет собой платформа",
                "— как проходит обучение",
                "— какие есть AI-возможности",
                "— с чего начать и куда нажать"
            ].join("\n");
        }

        return "Здравствуйте! Я AI-ассистент AnaTil. Чем могу помочь?";
    }

    function buildIndexReply(normalized) {
        if (containsAny(normalized, ["что это", "что за сайт", "что за платформа", "что представляет", "о сайте", "anatil"])) {
            return [
                "AnaTil — это платформа для русскоязычных пользователей, которые хотят выучить казахский язык и начать говорить увереннее.",
                "Здесь обучение строится на двух частях:",
                "— обычные уроки по уровням",
                "— AI-практика для применения знаний на практике",
                "Платформа помогает не просто читать теорию, а тренировать речь, грамматику и понимание языка в более живом формате."
            ].join("\n");
        }

        if (containsAny(normalized, ["как проходит", "как идет обучение", "как обуч", "обучение", "как учиться", "как работает"])) {
            return [
                "Обучение в AnaTil обычно проходит так:",
                "1. Вы регистрируетесь или входите в аккаунт.",
                "2. Затем определяете уровень или начинаете с нуля.",
                "3. Получаете курс своего уровня.",
                "4. Проходите модули и уроки по порядку.",
                "5. После теории закрепляете материал через AI-практику.",
                "6. Следите за прогрессом и переходите дальше по уровням."
            ].join("\n");
        }

        if (containsAny(normalized, ["с чего начать", "как начать", "куда нажать", "где начать", "начать обучение"])) {
            return [
                "На главной странице лучше начать с кнопки «Начать обучение».",
                "После этого вы попадёте в авторизацию, а затем сможете:",
                "— пройти определение уровня",
                "— либо начать с A1, если хотите идти с самого начала",
                "Если уже есть аккаунт, нажмите «Войти»."
            ].join("\n");
        }

        if (containsAny(normalized, ["навигац", "раздел", "куда перейти", "где что находится", "что есть на сайте"])) {
            return [
                "На сайте есть несколько основных разделов:",
                "— О платформе: чем AnaTil полезен и для кого он создан",
                "— Как это работает: путь пользователя от входа до обучения",
                "— Возможности AI: практика с искусственным интеллектом",
                "— Уровни: обучение от A1 до C1",
                "— FAQ: ответы на частые вопросы",
                "После входа обычно становятся доступны dashboard, курсы, уроки, профиль и прогресс."
            ].join("\n");
        }

        if (containsAny(normalized, ["ai", "ии", "чат", "возможности", "репетитор", "диалог", "проверка предложения", "проверка грамматики"])) {
            return [
                "AI-возможности AnaTil помогают закреплять язык на практике.",
                "Основные функции такие:",
                "— Проверка предложения: вы пишете фразу, а система исправляет и объясняет ошибки",
                "— Диалог: можно тренировать живые ситуации общения",
                "— Репетитор по уроку: AI объясняет тему проще и даёт мини-практику",
                "Это нужно, чтобы пользователь не только читал материал, но и сразу применял его."
            ].join("\n");
        }

        if (containsAny(normalized, ["уров", "a1", "a2", "b1", "b2", "c1"])) {
            return [
                "В AnaTil обучение делится по уровням владения языком:",
                "— A1: начальный",
                "— A2: базовый",
                "— B1: средний",
                "— B2: выше среднего",
                "— C1: продвинутый",
                "Если пользователь не знает свой уровень, он может сначала пройти определение уровня."
            ].join("\n");
        }

        if (containsAny(normalized, ["для кого", "кому подходит", "кто может", "русскоязыч"])) {
            return [
                "AnaTil в первую очередь подходит русскоязычным пользователям, которые хотят выучить казахский язык для повседневного общения, учёбы, работы или уверенной речи без стеснения.",
                "Объяснения даются понятно, а AI помогает дополнительно тренироваться в удобное время."
            ].join("\n");
        }

        if (containsAny(normalized, ["урок", "уроки", "модул", "курс", "курсы"])) {
            return [
                "На платформе обучение строится по курсам, модулям и урокам.",
                "Сначала пользователь попадает на свой уровень, затем проходит модули внутри курса, а в каждом модуле изучает отдельные уроки по темам.",
                "После уроков материал можно закреплять через AI-практику и отслеживать прогресс."
            ].join("\n");
        }

        if (containsAny(normalized, ["зарегистр", "войти", "аккаунт", "профиль"])) {
            return [
                "Чтобы полноценно пользоваться платформой, нужно создать аккаунт или войти в уже существующий.",
                "После входа становятся доступны персональный прогресс, определение уровня, курсы и AI-практика."
            ].join("\n");
        }

        return [
            "Я могу помочь по главной странице AnaTil.",
            "Спросите, например:",
            "— что представляет собой сайт",
            "— как проходит обучение",
            "— какие есть AI-возможности",
            "— с чего начать или где какой раздел находится"
        ].join("\n");
    }

    function asksToOpenAccountArea(normalized) {
        return containsAny(normalized, ["куда дальше", "что дальше", "где курсы", "где профиль", "где прогресс", "где dashboard"]);
    }

    function normalize(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/ё/g, "е")
            .replace(/[^\p{L}\p{N}\s]/gu, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function containsAny(text, variants) {
        return variants.some((item) => text.includes(item));
    }

    function addMessage(text, role) {
        const wrap = document.createElement("div");
        wrap.className = `msg msg--${role}`;

        const bubble = document.createElement("div");
        bubble.className = "msg__bubble";
        bubble.textContent = text;

        const time = document.createElement("div");
        time.className = "msg__time";
        time.textContent = formatTime(new Date());

        wrap.appendChild(bubble);
        wrap.appendChild(time);

        body.appendChild(wrap);
        body.scrollTop = body.scrollHeight;
    }

    function addTyping() {
        const wrap = document.createElement("div");
        wrap.className = "msg msg--assistant";
        wrap.dataset.typing = "1";

        const bubble = document.createElement("div");
        bubble.className = "msg__bubble";
        bubble.textContent = "Печатает…";

        wrap.appendChild(bubble);
        body.appendChild(wrap);
        body.scrollTop = body.scrollHeight;
        return wrap;
    }

    function removeTyping(el) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }

    function formatTime(d) {
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
    }
})();
