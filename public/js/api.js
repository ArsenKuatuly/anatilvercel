async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("token");

    const headers = Object.assign(
        { "Content-Type": "application/json" },
        options.headers || {}
    );

    if (token) headers.Authorization = "Bearer " + token;

    const res = await fetch(url, Object.assign({}, options, { headers }));

    const data = await res.json().catch(() => null);

    if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.replace("/auth.html");
        return null;
    }

    return { res, data };
}

window.apiFetch = apiFetch;
