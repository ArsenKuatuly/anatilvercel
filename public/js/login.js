document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");
    const forgotBtn = document.getElementById("forgotBtn");
    const message = document.getElementById("message");
    const loginInput = document.getElementById("login");
    const passwordInput = document.querySelector(".js-password");

    if (!loginBtn || !message || !loginInput || !passwordInput) return;

    function setMsg(text, ok) {
        message.textContent = text || "";
        message.className = "auth__message";
        if (!text) return;
        message.classList.add(ok ? "auth__message--success" : "auth__message--error");
    }

    function clearErrors() {
        loginInput.classList.remove("auth__input--error");
        passwordInput.classList.remove("auth__input--error");
    }

    function markErrors(inputs) {
        inputs.forEach(i => i.classList.add("auth__input--error"));
    }

    async function doLogin(e) {
        if (e) e.preventDefault();

        clearErrors();
        setMsg("", false);

        const login = loginInput.value.trim();
        const password = passwordInput.value;

        if (!login || !password) {
            setMsg("Заполните все поля", false);
            markErrors([loginInput, passwordInput]);
            return;
        }

        loginBtn.disabled = true;

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ login, password }),
            });

            const result = await res.json().catch(() => null);
            if (!result) {
                setMsg("Сервер вернул некорректный ответ", false);
                return;
            }

            if (!res.ok || !result.success || !result.token) {
                setMsg(result.message || "Ошибка входа", false);
                return;
            }

            localStorage.setItem("token", result.token);
            setMsg("Вход выполнен", true);
            setTimeout(() => {
                window.location.replace("/dashboard.html");
            }, 200);
        } catch {
            setMsg("Ошибка соединения с сервером", false);
        } finally {
            loginBtn.disabled = false;
        }
    }

    loginBtn.addEventListener("click", doLogin);

    [loginInput, passwordInput].forEach(el => {
        el.addEventListener("keydown", (e) => {
            if (e.key === "Enter") doLogin(e);
        });
    });

    if (forgotBtn) {
        forgotBtn.addEventListener("click", () => {
            window.location.href = "/forgot-password.html";
        });
    }
});
