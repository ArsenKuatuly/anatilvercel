document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.querySelector(".js-start-test");
    const modal = document.getElementById("confirmModal");
    const cancelBtn = document.getElementById("cancelBtn");
    const confirmBtn = document.getElementById("confirmBtn");

    if (!startBtn) return;

    if (!modal || !cancelBtn || !confirmBtn) {
        startBtn.addEventListener("click", () => {
            window.location.href = "test.html";
        });
        return;
    }

    startBtn.addEventListener("click", (e) => {
        e.preventDefault();
        modal.classList.add("modal--active");
    });

    cancelBtn.addEventListener("click", () => {
        modal.classList.remove("modal--active");
    });

    confirmBtn.addEventListener("click", () => {
        window.location.href = "test.html";
    });
});
