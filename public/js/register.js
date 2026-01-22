document.addEventListener("DOMContentLoaded", () => {
    const registerBtn = document.getElementById("registerBtn");
    const message = document.getElementById("message");

    if (!registerBtn || !message) return;

    registerBtn.addEventListener("click", async () => {
        const loginInput = document.getElementById("login");
        const passwordInputs = document.querySelectorAll(".js-password");

        if (!loginInput || passwordInputs.length < 2) return;

        const password = passwordInputs[0];
        const passwordRepeat = passwordInputs[1];

        resetMessage();
        clearInputErrors([loginInput, password, passwordRepeat]);

        if (!loginInput.value.trim() || !password.value || !passwordRepeat.value) {
            showError("Заполните все поля", [loginInput, password, passwordRepeat]);
            return;
        }

        if (loginInput.value.trim().length < 3) {
            showError("Логин должен содержать минимум 3 символа", [loginInput]);
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
                    password: password.value
                })
            });

            const result = await safeJson(res);

            if (!result || !result.success) {
                setMessage((result && result.message) || "Ошибка регистрации", "error");
                return;
            }

            localStorage.setItem("token", result.token);

            setMessage("Регистрация успешна", "success");

            setTimeout(() => {
                window.location.href = "/dashboard.html";
            }, 500);

        } catch (e) {
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
