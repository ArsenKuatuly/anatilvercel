document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-logout]");
    if (!btn) return;
    localStorage.removeItem("token");
    window.location.replace("/auth.html");
});
