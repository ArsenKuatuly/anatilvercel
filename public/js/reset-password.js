document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const tokenInput = document.getElementById("token");
    const passwordInputs = document.querySelectorAll(".js-password");
    const submitBtn = document.getElementById("resetPasswordBtn");
    const message = document.getElementById("message");

    if (!tokenInput || !submitBtn || !message || passwordInputs.length < 2) return;

    tokenInput.value = params.get("token") || "";

    function setMessage(text, ok) {
        message.textContent = text || "";
        message.className = "auth__message";
        if (!text) return;
        message.classList.add(ok ? "auth__message--success" : "auth__message--error");
    }

    function clearErrors() {
        tokenInput.classList.remove("auth__input--error");
        passwordInputs.forEach((input) => input.classList.remove("auth__input--error"));
    }

    submitBtn.addEventListener("click", async () => {
        clearErrors();
        setMessage("", false);

        const token = tokenInput.value.trim();
        const password = passwordInputs[0].value;
        const repeat = passwordInputs[1].value;

        if (!token) {
            tokenInput.classList.add("auth__input--error");
            setMessage("Токен не найден. Откройте ссылку из письма ещё раз", false);
            return;
        }

        if (password.length < 6) {
            passwordInputs[0].classList.add("auth__input--error");
            setMessage("Пароль должен содержать минимум 6 символов", false);
            return;
        }

        if (password !== repeat) {
            passwordInputs.forEach((input) => input.classList.add("auth__input--error"));
            setMessage("Пароли не совпадают", false);
            return;
        }

        submitBtn.disabled = true;
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const result = await res.json().catch(() => null);
            if (!result) {
                setMessage("Сервер вернул некорректный ответ", false);
                return;
            }
            setMessage(result.message || (result.success ? "Пароль обновлён" : "Ошибка"), !!result.success);
            if (result.success) {
                setTimeout(() => {
                    window.location.href = "/auth.html";
                }, 1200);
            }
        } catch {
            setMessage("Ошибка соединения с сервером", false);
        } finally {
            submitBtn.disabled = false;
        }
    });
});
