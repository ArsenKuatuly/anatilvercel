document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("startTestBtn");
    const modal = document.getElementById("confirmModal");
    const cancelBtn = document.getElementById("cancelBtn");
    const confirmBtn = document.getElementById("confirmBtn");


    if (!startBtn || !modal || !cancelBtn || !confirmBtn) {
        console.warn("[modal_startexam] elements not found");
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
