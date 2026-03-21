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

function getLessonId() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("id");
    if (fromQuery) return fromQuery;

    const parts = window.location.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("lesson");
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];

    return null;
}

function setHtml(el, html) {
    if (!el) return;
    el.innerHTML = html;
}

function buildAchievementsText(unlocked) {
    const map = {
        FIRST_LESSON: "🏅 Достижение: Первый урок",
        FIRST_MODULE: "⭐ Достижение: Первый модуль",
        FIRST_COURSE: "🏆 Достижение: Первый курс",
    };

    const lines = (Array.isArray(unlocked) ? unlocked : [])
        .map((code) => map[code])
        .filter(Boolean);

    return lines.length ? "\n\n" + lines.join("\n") : "";
}

function setBusy(isBusy) {
    if (!completeBtn) return;
    completeBtn.disabled = isBusy;
    completeBtn.classList.toggle("is-loading", isBusy);
    if (completeBtnText) completeBtnText.textContent = isBusy ? "Завершение..." : "Завершить урок";
}

async function fetchFinalTaskId(courseId) {
    if (!courseId) return null;
    try {
        const taskOut = await authFetch(`/api/course/${courseId}/task`);
        if (taskOut?.data?.success && taskOut.data.task?.id) return taskOut.data.task.id;
    } catch (e) {
        console.error("task fetch error:", e);
    }
    return null;
}

async function fetchNextLessonId() {
    try {
        const nextOut = await authFetch("/api/continue-lesson");
        const nextData = nextOut?.data;
        if (nextData?.success && nextData.lessonId) return nextData.lessonId;
    } catch (e) {
        console.error("continue-lesson error:", e);
    }
    return null;
}

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

const lessonId = getLessonId();
let courseSlug = null;

if (!lessonId) {
    alert("Урок не найден");
    window.location.href = "/dashboard";
}

const lessonTitle = document.getElementById("lessonTitle");
const lessonContent = document.getElementById("lessonContent");
const completeBtn = document.getElementById("completeLessonBtn");
const completeBtnText = document.getElementById("completeBtnText");
const backBtn = document.getElementById("backBtn");

const modal = document.getElementById("completionModal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const goCourseBtn = document.getElementById("goCourseBtn");
const goNextBtn = document.getElementById("goNextBtn");
const modalBadge = document.getElementById("modalBadge");
const modalStatus = document.getElementById("modalStatus");
const modalNextStep = document.getElementById("modalNextStep");

const modalOverlay = document.getElementById("modalOverlay");
const modalCloseBtn = document.getElementById("modalCloseBtn");

modalOverlay?.addEventListener("click", closeModal);
modalCloseBtn?.addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) closeModal();
});

async function loadLesson() {
    try {
        const out = await authFetch(`/api/lesson/${encodeURIComponent(lessonId)}`);
        if (!out) return;

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

completeBtn?.addEventListener("click", async () => {
    if (completeBtn?.disabled) return;

    try {
        setBusy(true);

        const out = await authFetch("/api/lesson/complete", {
            method: "POST",
            body: JSON.stringify({ lessonId: Number(lessonId) }),
        });
        if (!out) return;

        const data = out.data;

        if (!data?.success) {
            alert("Ошибка завершения урока");
            setBusy(false);
            return;
        }

        openModal();

        goCourseBtn.onclick = null;
        goNextBtn.onclick = null;

        goCourseBtn.style.display = "inline-flex";
        goCourseBtn.disabled = false;
        goCourseBtn.textContent = "К курсу";
        goCourseBtn.onclick = () => {
            window.location.href = courseSlug ? `/courses/${courseSlug}` : "/dashboard";
        };

        if (data.courseCompleted) {
            modalTitle.textContent = "Курс завершён";
            modalText.textContent =
                "Вы прошли все уроки курса. Теперь можно перейти к итоговому заданию." +
                buildAchievementsText(data.unlocked);
            if (modalBadge) modalBadge.textContent = "Поздравляем";
            if (modalStatus) modalStatus.textContent = "Курс пройден";
            if (modalNextStep) modalNextStep.textContent = "Открыть итоговое задание";

            goNextBtn.style.display = "inline-flex";
            goNextBtn.disabled = true;
            goNextBtn.textContent = "Итоговое задание";

            const taskId = await fetchFinalTaskId(data.courseId);
            if (taskId) {
                goNextBtn.disabled = false;
                goNextBtn.onclick = () => {
                    window.location.href = `/finallytask.html?taskId=${taskId}`;
                };
            } else {
                goNextBtn.style.display = "none";
            }

            return;
        }

        modalTitle.textContent = data.moduleCompleted ? "Модуль завершён" : "Урок завершён";
        modalText.textContent =
            (data.moduleCompleted
                ? "Отличная работа! Следующий модуль уже открыт."
                : "Отличная работа! Можно перейти к следующему уроку.") +
            buildAchievementsText(data.unlocked);
        if (modalBadge) modalBadge.textContent = data.moduleCompleted ? "Новый модуль открыт" : "Урок пройден";
        if (modalStatus) modalStatus.textContent = data.moduleCompleted ? "Модуль завершён" : "Урок завершён";
        if (modalNextStep) modalNextStep.textContent = "Перейти к следующему уроку";

        goNextBtn.style.display = "inline-flex";
        goNextBtn.disabled = true;
        goNextBtn.textContent = "Следующий урок";

        const nextLessonId = await fetchNextLessonId();
        if (nextLessonId) {
            goNextBtn.disabled = false;
            goNextBtn.onclick = () => {
                window.location.href = `/lesson/${nextLessonId}`;
            };
        } else {
            goNextBtn.style.display = "none";
        }
    } catch (err) {
        console.error("complete lesson error:", err);
        if (err?.data) console.error("server payload:", err.data);
        alert("Ошибка завершения урока");
        setBusy(false);
    } finally {
        setBusy(false);
    }
});

backBtn?.addEventListener("click", () => {
    window.location.href = courseSlug ? `/courses/${courseSlug}` : "/dashboard";
});
