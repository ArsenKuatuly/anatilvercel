window.authFetch = async function (url, options = {}) {
    const r = await window.apiFetch(url, options);
    if (!r) throw new Error("Not authorized");
    if (!r.res.ok) {
        const text = await r.res.text().catch(() => "");
        throw new Error(text || `HTTP error ${r.res.status}`);
    }
    return r.res;
};
