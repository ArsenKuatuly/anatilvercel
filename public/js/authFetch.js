// public/js/authFetch.js
function getToken() {
    return localStorage.getItem("token");
}

window.authFetch = async function authFetch(url, options = {}) {
    const token = getToken();

    const headers = {
        ...(options.headers || {}),
        ...(token ? { Authorization: "Bearer " + token } : {}),
        "Content-Type": "application/json"
    };

    const res = await fetch(url, {
        ...options,
        headers
    });


    const text = await res.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch (e) {
        data = null;
    }


    if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.replace("/auth");
        return null;
    }

    if (!res.ok) {
        const err = new Error(`HTTP error ${res.status}`);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return { res, data };
};
