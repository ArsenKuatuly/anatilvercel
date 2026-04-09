document.addEventListener("DOMContentLoaded", () => {
    const emailInput = document.getElementById("email");
    const submitBtn = document.getElementById("forgotSubmitBtn");
    const message = document.getElementById("message");
    const resetLinkWrap = document.getElementById("resetLinkWrap");
    const resetLink = document.getElementById("resetLink");

    if (!emailInput || !submitBtn || !message) return;

    function setMessage(text, ok) {
        message.textContent = text || "";
        message.className = "auth__message";
        if (!text) return;
        message.classList.add(ok ? "auth__message--success" : "auth__message--error");
    }

    submitBtn.addEventListener("click", async () => {
        const email = emailInput.value.trim().toLowerCase();
        emailInput.classList.remove("auth__input--error");
        setMessage("", false);
        if (resetLinkWrap) resetLinkWrap.hidden = true;

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            emailInput.classList.add("auth__input--error");
            setMessage("Введите корректный email", false);
            return;
        }

        submitBtn.disabled = true;
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const result = await res.json().catch(() => null);
            if (!result) {
                setMessage("Сервер вернул некорректный ответ", false);
                return;
            }
            setMessage(result.message || "Проверьте почту", !!result.success);
            if (result.resetUrl && resetLinkWrap && resetLink) {
                resetLinkWrap.hidden = false;
                resetLink.href = result.resetUrl;
                resetLink.textContent = result.resetUrl;
            }
        } catch {
            setMessage("Ошибка соединения с сервером", false);
        } finally {
            submitBtn.disabled = false;
        }
    });
});
