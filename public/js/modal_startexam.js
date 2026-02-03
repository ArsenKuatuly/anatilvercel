document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.querySelector(".js-start-test");
    const modal = document.getElementById("confirmModal");
    const overlay = modal?.querySelector(".modal__overlay");
    const cancelBtn = modal?.querySelector("#cancelBtn2");
    const confirmBtn = modal?.querySelector("#confirmBtn");

    if (!startBtn) return;

    const open = (e) => {
        e?.preventDefault();
        modal?.classList.add("modal--active");
    };

    const close = () => {
        modal?.classList.remove("modal--active");
    };

    const go = () => {
        window.location.href = "test.html";
    };

    if (!modal || !confirmBtn) {
        startBtn.addEventListener("click", go);
        return;
    }

    startBtn.addEventListener("click", open);
    overlay?.addEventListener("click", close);
    cancelBtn?.addEventListener("click", close);
    confirmBtn.addEventListener("click", go);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("modal--active")) {
            close();
        }
    });
});
