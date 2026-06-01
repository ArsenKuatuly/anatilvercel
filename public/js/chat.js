

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
    const historyStore = [];

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
            const welcome = getWelcomeMessage();
            addMessage(welcome, "assistant");
            historyStore.push({ role: "assistant", text: welcome });
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
        historyStore.push({ role: "user", text });
        input.value = "";

        const typingEl = addTyping();
        send.disabled = true;

        try {
            const reply = await getAssistantReply(text);
            removeTyping(typingEl);
            addMessage(reply, "assistant");
            historyStore.push({ role: "assistant", text: reply });
            trimHistory();
        } catch (err) {
            console.error(err);
            removeTyping(typingEl);
            const fallback = "Не удалось получить ответ. Попробуйте ещё раз.";
            addMessage(fallback, "assistant");
            historyStore.push({ role: "assistant", text: fallback });
            trimHistory();
        } finally {
            send.disabled = false;
            input.focus();
        }
    });

    async function getAssistantReply(text) {
        return isIndexPage ? getIndexAssistantReply(text) : getProtectedAssistantReply(text);
    }

    async function getProtectedAssistantReply(text) {
        const token = localStorage.getItem("token");
        const headers = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch("/api/ai/chat", {
            method: "POST",
            headers,
            body: JSON.stringify({
                message: text,
                history: historyStore.slice(-8),
                preferredLanguage: detectPreferredLanguage(text)
            })
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
        const res = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                scope: "public_index",
                message: text,
                history: historyStore.slice(-8),
                preferredLanguage: detectPreferredLanguage(text)
            })
        });

        let data = null;
        try {
            data = await res.json();
        } catch {
            data = null;
        }

        if (!res.ok) {
            if (hasToken() && asksToOpenAccountArea(normalize(text))) {
                return [
                    "Вы уже вошли в аккаунт.",
                    "Откройте dashboard, затем курсы, уроки, AI практику, профиль или прогресс - там доступны основные разделы платформы."
                ].join(" ");
            }
            return data?.details || data?.error || fallbackIndexReply(text);
        }

        return data?.reply || fallbackIndexReply(text);
    }

    function getWelcomeMessage() {
        if (isIndexPage) {
            return [
                "Здравствуйте! Я помощник AnaTil на главной странице.",
                "Могу рассказать, что дает платформа, чему здесь можно научиться и с чего лучше начать."
            ].join(" ");
        }

        return "Здравствуйте! Я AI-ассистент AnaTil. Могу помочь с казахским языком, обучением на платформе и навигацией по разделам.";
    }

    function fallbackIndexReply(text) {
        const normalized = normalize(text);

        if (containsAny(normalized, ["что это", "что за сайт", "что за платформа", "anatil"])) {
            return "AnaTil - это платформа для русскоязычных пользователей, которые хотят изучать казахский язык через уроки и AI практику.";
        }

        if (containsAny(normalized, ["с чего начать", "как начать", "куда нажать"])) {
            return "Лучше всего начать с регистрации или входа, затем пройти тест на уровень или сразу перейти к обучению.";
        }

        return "Я могу подсказать по платформе AnaTil, обучению, AI возможностям и первым шагам на сайте.";
    }

    function detectPreferredLanguage(text) {
        return /[әіңғүұқөһӘІҢҒҮҰҚӨҺ]/.test(String(text || "")) ? "kz" : "ru";
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

    function trimHistory() {
        while (historyStore.length > 12) historyStore.shift();
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
        bubble.textContent = "Печатает...";

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
