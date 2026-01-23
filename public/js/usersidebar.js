(async function () {
    try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch("/api/auth/me", {
            headers: { Authorization: "Bearer " + token }
        });

        if (res.status === 401) {
            localStorage.removeItem("token");
            return;
        }

        const data = await res.json();

        if (data.success && data.user) {
            const loginEl = document.getElementById("sidebarLogin");
            if (loginEl) loginEl.textContent = data.user.login || "";

            const avatarImg = document.getElementById("avatarImg");
            if (avatarImg) {
                avatarImg.src = data.user.avatar || "/uploads/avatars/default.png";
            }
        }
    } catch (err) {
        console.error("Не удалось загрузить пользователя", err);
    }
})();

const backBtn = document.getElementById("backBtn");
if (backBtn) {
    backBtn.addEventListener("click", () => {
        window.location.href = "/dashboard.html";
    });
}
