(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.replace("/auth.html");
        return;
    }

    try {
        const res = await fetch("/api/auth/me", {
            headers: { Authorization: "Bearer " + token }
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data || !data.success) {
            localStorage.removeItem("token");
            window.location.replace("/auth.html");
            return;
        }

        window.__me = data.user;
    } catch {
        localStorage.removeItem("token");
        window.location.replace("/auth.html");
    }
})();
