document.addEventListener("DOMContentLoaded", async () => {
    const logoBtn = document.getElementById("logoBtn");
    if (logoBtn) {
        logoBtn.addEventListener("click", async () => {
            const r = await apiFetch("/api/auth/me", { method: "GET", headers: {} });
            window.location.href = r && r.res.ok ? "/dashboard.html" : "/index.html";
        });
    }

    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            localStorage.removeItem("token");
            window.location.href = "/index.html";
        });
    }

    let user = null;
    const me = await apiFetch("/api/auth/me", { method: "GET", headers: {} });
    if (me && me.data && me.data.success) user = me.data.user;

    if (user?.role === "admin") {
        const adminBtn = document.getElementById("adminBtn");
        if (adminBtn) adminBtn.style.display = "inline-block";
    }

    initCourseButton();
});

async function initCourseButton() {
    const btn = document.getElementById("goToCourseBtn");
    if (!btn) return;

    try {
        const out = await apiFetch("/api/lessons/progress/current", { method: "GET" });
        if (!out) return;

        const { data } = out;
        if (!data?.success || !data?.course?.slug) return;

        btn.addEventListener("click", () => {
            window.location.href = `/courses/${data.course.slug}`;
        });
    } catch (e) {
        console.error("Ошибка загрузки курса", e);
    }
}
