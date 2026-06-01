document.addEventListener("DOMContentLoaded", () => {
    const registerBtn = document.getElementById("registerBtn");
    const message = document.getElementById("message");
    const loginInput = document.getElementById("login");
    const emailInput = document.getElementById("email");
    const passwordInputs = document.querySelectorAll(".js-password");

    if (!registerBtn || !message || !loginInput || !emailInput || passwordInputs.length < 2) return;

    registerBtn.addEventListener("click", async () => {
        const password = passwordInputs[0];
        const passwordRepeat = passwordInputs[1];

        resetMessage();
        clearInputErrors([loginInput, emailInput, password, passwordRepeat]);

        if (!loginInput.value.trim() || !emailInput.value.trim() || !password.value || !passwordRepeat.value) {
            showError("Заполните все поля", [loginInput, emailInput, password, passwordRepeat]);
            return;
        }

        if (loginInput.value.trim().length < 3) {
            showError("Логин должен содержать минимум 3 символа", [loginInput]);
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) {
            showError("Введите корректный email", [emailInput]);
            return;
        }

        if (password.value.length < 6) {
            showError("Пароль должен содержать минимум 6 символов", [password]);
            return;
        }

        if (password.value !== passwordRepeat.value) {
            showError("Пароли не совпадают", [password, passwordRepeat]);
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    login: loginInput.value.trim(),
                    email: emailInput.value.trim().toLowerCase(),
                    password: password.value,
                }),
            });

            const result = await safeJson(res);
            if (!result || !result.success) {
                setMessage((result && result.message) || "Ошибка регистрации", "error");
                return;
            }

            localStorage.setItem("token", result.token);
            setMessage("Регистрация успешна", "success");

            setTimeout(() => {
                window.location.replace("/onboarding.html");
            }, 400);
        } catch {
            setMessage("Ошибка соединения с сервером", "error");
        } finally {
            setLoading(false);
        }
    });

    function showError(text, inputs) {
        setMessage(text, "error");
        inputs.forEach(i => i.classList.add("auth__input--error"));
    }

    function resetMessage() {
        message.textContent = "";
        message.className = "auth__message";
    }

    function setMessage(text, type) {
        message.textContent = text;
        message.classList.remove("auth__message--success", "auth__message--error");
        message.classList.add(type === "success" ? "auth__message--success" : "auth__message--error");
    }

    function clearInputErrors(inputs) {
        inputs.forEach(i => i.classList.remove("auth__input--error"));
    }

    function setLoading(v) {
        registerBtn.disabled = v;
        registerBtn.classList.toggle("is-loading", v);
    }

    async function safeJson(res) {
        try { return await res.json(); } catch { return null; }
    }
});
