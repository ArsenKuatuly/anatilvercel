(() => {
    const p = location.pathname;

    const open = [
        "/auth",
        "/auth.html",
        "/register",
        "/register.html",
        "/public/auth.html",
        "/public/register.html",
    ];

    if (open.includes(p)) return;

    const token = localStorage.getItem("token");
    if (!token) {
        location.replace("/auth.html");
        return;
    }

    fetch("/api/auth/me", {
        headers: { Authorization: "Bearer " + token }
    })
        .then(r => r.json().catch(() => null))
        .then(data => {
            if (!data || !data.success) {
                localStorage.removeItem("token");
                location.replace("/auth.html");
            }
        })
        .catch(() => {
            localStorage.removeItem("token");
            location.replace("/auth.html");
        });
})();
