async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("token");

    const headers = new Headers(options.headers || {});
    if (token) headers.set("Authorization", "Bearer " + token);

    const isFormData = options.body instanceof FormData;

    if (!isFormData && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const res = await fetch(url, { ...options, headers });

    const data = await res.json().catch(() => null);

    if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.replace("/auth.html");
        return null;
    }

    return { res, data };
}

window.apiFetch = apiFetch;
