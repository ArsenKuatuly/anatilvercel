document.addEventListener("DOMContentLoaded", () => {
    const header = document.getElementById("header");
    const burger = document.querySelector("[data-burger]");
    const panel = document.querySelector("[data-mobile]");

    if (!burger || !panel) return;

    const open = () => {
        panel.hidden = false;
        burger.setAttribute("aria-expanded", "true");
    };

    const close = () => {
        panel.hidden = true;
        burger.setAttribute("aria-expanded", "false");
    };

    const toggle = () => {
        if (panel.hidden) open();
        else close();
    };

    burger.addEventListener("click", toggle);

    document.addEventListener("click", (e) => {
        if (panel.hidden) return;
        const t = e.target;
        if (burger.contains(t)) return;
        if (panel.contains(t)) return;
        if (header && header.contains(t)) return;
        close();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !panel.hidden) close();
    });

    panel.addEventListener("click", (e) => {
        const a = e.target.closest("a");
        if (a) close();
    });
});
