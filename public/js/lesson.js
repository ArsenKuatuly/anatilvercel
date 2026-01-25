/* ================== PROGRESS BAR ================== */
(function initReadingProgress() {
    const bar = document.getElementById("readingProgressBar");
    if (!bar) return;

    function update() {
        const winH = window.innerHeight;
        const docH = document.documentElement.scrollHeight;
        const top = window.scrollY || document.documentElement.scrollTop || 0;

        const scrollable = docH - winH;
        const progress = scrollable > 0 ? (top / scrollable) * 100 : 0;

        bar.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
})();

/* ================== HELPERS ================== */
function getLessonId() {
    // 1) ?id=
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("id");
    if (fromQuery) return fromQuery;

    // 2) /lesson/<id>
    const parts = window.location.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("lesson");
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];

    return null;
}

function setHtml(el, html) {
    if (!el) return;
    el.innerHTML = html;
}

/* ================== PARAMS ================== */
const lessonId = getLessonId();
let courseSlug = null;

if (!lessonId) {
    alert("Урок не найден");
    window.location.href = "/dashboard";
}

/* ================== ELEMENTS ================== */
const lessonTitle = document.getElementById("lessonTitle");
const lessonContent = document.getElementById("lessonContent");
const completeBtn = document.getElementById("completeLessonBtn");
const completeBtnText = document.getElementById("completeBtnText");
const backBtn = document.getElementById("backBtn");

/* ================== MODAL ================== */
const modal = document.getElementById("completionModal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const goCourseBtn = document.getElementById("goCourseBtn");
const goNextBtn = document.getElementById("goNextBtn");

const modalOverlay = document.getElementById("modalOverlay");
const modalCloseBtn = document.getElementById("modalCloseBtn");

function openModal() {
    if (!modal) return;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}
function closeModal() {
    if (!modal) return;
    modal.classList.add("hidden");
    document.body.style.overflow = "unset";
}

modalOverlay?.addEventListener("click", closeModal);
modalCloseBtn?.addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) closeModal();
});

/* ================== LOAD LESSON ================== */
async function loadLesson() {
    try {
        const out = await authFetch(`/api/lesson/${encodeURIComponent(lessonId)}`);
        if (!out) return; // 401 -> authFetch сам редиректит

        const data = out.data;

        if (!data?.success) {
            alert(data?.message || "Нет доступа к уроку");
            window.location.href = "/dashboard";
            return;
        }

        lessonTitle.textContent = data.lesson?.title || "Урок";
        setHtml(lessonContent, data.lesson?.content || "<p>Нет контента</p>");
        courseSlug = data.lesson?.courseSlug || null;

    } catch (err) {
        console.error("loadLesson error:", err);
        if (err?.data) console.error("server payload:", err.data);
        alert("Ошибка загрузки урока");
    }
}

loadLesson();

/* ================== COMPLETE LESSON ================== */
completeBtn?.addEventListener("click", async () => {
    try {
        completeBtn.disabled = true;
        completeBtn.classList.add("is-loading");
        if (completeBtnText) completeBtnText.textContent = "Завершение...";

        const out = await authFetch("/api/lesson/complete", {
            method: "POST",
            body: JSON.stringify({ lessonId: Number(lessonId) })
        });
        if (!out) return;

        const data = out.data;

        if (!data?.success) {
            alert("Ошибка завершения урока");
            completeBtn.disabled = false;
            completeBtn.classList.remove("is-loading");
            if (completeBtnText) completeBtnText.textContent = "Завершить урок";
            return;
        }


        openModal();

        goCourseBtn.onclick = null;
        goNextBtn.onclick = null;

        // secondary
        goCourseBtn.style.display = "inline-flex";
        goCourseBtn.disabled = false;
        goCourseBtn.textContent = "К курсу";
        goCourseBtn.onclick = () => {
            window.location.href = courseSlug ? `/courses/${courseSlug}` : "/dashboard";
        };

        if (data.courseCompleted) {
            modalTitle.textContent = "Курс завершён 🎉";
            modalText.textContent =
                "Вы прошли все уроки. Теперь можно пройти итоговое задание.";

            goNextBtn.style.display = "inline-flex";
            goNextBtn.disabled = true;
            goNextBtn.textContent = "Итоговое задание";

            try {
                const courseId = data.courseId;
                if (courseId) {
                    const taskOut = await authFetch(`/api/course/${courseId}/task`);
                    if (taskOut?.data?.success && taskOut.data.task?.id) {
                        const taskId = taskOut.data.task.id;
                        goNextBtn.disabled = false;
                        goNextBtn.onclick = () => {
                            window.location.href = `/finallytask.html?taskId=${taskId}`;
                        };
                    }
                }
            } catch (e) {
                console.error("task fetch error:", e);
            }

            return;
        }

        modalTitle.textContent = data.moduleCompleted ? "Модуль завершён 🏆" : "Урок завершён 🎉";
        modalText.textContent = data.moduleCompleted
            ? "Открыт следующий модуль. Перейти к следующему уроку?"
            : "Перейти к следующему уроку?";

        // ищем следующий урок
        goNextBtn.style.display = "inline-flex";
        goNextBtn.disabled = true;
        goNextBtn.textContent = "Следующий урок";

        try {
            const nextOut = await authFetch("/api/continue-lesson");
            const nextData = nextOut?.data;

            if (nextData?.success && nextData.lessonId) {
                goNextBtn.disabled = false;
                goNextBtn.onclick = () => {
                    // красивый URL под /lesson/:id
                    window.location.href = `/lesson/${nextData.lessonId}`;
                };
            } else {
                goNextBtn.style.display = "none";
            }
        } catch (e) {
            console.error("continue-lesson error:", e);
            goNextBtn.style.display = "none";
        }

    } catch (err) {
        console.error("complete lesson error:", err);
        if (err?.data) console.error("server payload:", err.data);
        alert("Ошибка завершения урока");
        completeBtn.disabled = false;
    } finally {

        if (completeBtn) {
            completeBtn.classList.remove("is-loading");
            if (completeBtnText) completeBtnText.textContent = "Завершить урок";

        }
    }
});

/* ================== BACK ================== */
backBtn?.addEventListener("click", () => {
    window.location.href = courseSlug ? `/courses/${courseSlug}` : "/dashboard";
});
