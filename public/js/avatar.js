(async function () {
    const avatarInput = document.getElementById("avatarInput");
    const avatarImage = document.getElementById("avatarImage");

    const token = localStorage.getItem("token");
    if (!token) return;

    /* ===== LOAD AVATAR ===== */
    try {
        const res = await fetch("/api/profile", {
            headers: { Authorization: "Bearer " + token }
        });

        if (res.status === 401) {
            localStorage.removeItem("token");
            return;
        }

        const data = await res.json();

        if (data.success && data.profile && data.profile.avatar) {
            avatarImage.src = data.profile.avatar;
        }
    } catch (e) {
        console.error(e);
    }

    /* ===== UPLOAD AVATAR ===== */
    avatarInput?.addEventListener("change", async () => {
        const file = avatarInput.files?.[0];
        if (!file) return;

        // простая валидация
        if (!file.type.startsWith("image/")) {
            alert("Можно загрузить только изображение");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert("Максимум 2MB");
            return;
        }

        const formData = new FormData();
        formData.append("avatar", file);

        const res = await fetch("/api/profile/avatar", {
            method: "POST",
            headers: { Authorization: "Bearer " + token },
            body: formData
        });

        if (res.status === 401) {
            localStorage.removeItem("token");
            alert("Сессия истекла, войдите снова");
            window.location.replace("/auth.html");
            return;
        }

        const result = await res.json();

        if (result.success && result.avatar) {
            avatarImage.src = result.avatar + "?t=" + Date.now();
        } else {
            alert(result.message || "Ошибка загрузки аватара");
        }
    });
})();
