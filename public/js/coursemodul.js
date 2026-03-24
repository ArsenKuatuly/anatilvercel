console.log("coursemodul.js загружен");

function getCourseSlug() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("slug") || params.get("course") || params.get("courseSlug");
    if (fromQuery) return fromQuery;

    const parts = window.location.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("courses");
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];

    return null;
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getModuleState(moduleItem) {
    const lessons = Array.isArray(moduleItem?.lessons) ? moduleItem.lessons : [];
    const isLocked = Number(moduleItem?.locked) === 1;
    const completedCount = lessons.filter((lesson) => Number(lesson.completed) === 1).length;
    const allDone = lessons.length > 0 && completedCount === lessons.length;

    if (isLocked) return "locked";
    if (allDone) return "done";
    return "open";
}

function getModuleIcon(state) {
    if (state === "done") return "✓";
    if (state === "locked") return "🔒";
    return "📘";
}

function getLessonState(moduleItem, lesson, index) {
    const lessons = Array.isArray(moduleItem?.lessons) ? moduleItem.lessons : [];
    const completed = Number(lesson?.completed) === 1;
    const firstUncompletedIndex = lessons.findIndex((item) => Number(item.completed) !== 1);

    const canOpen =
        !Number(moduleItem?.locked) &&
        (completed || index === firstUncompletedIndex || firstUncompletedIndex === -1);

    return {
        completed,
        canOpen,
    };
}

document.addEventListener("DOMContentLoaded", () => {
    const modulesEl = document.getElementById("modules");
    const courseTitleEl = document.getElementById("courseTitle");
    const moduleCountEl = document.getElementById("moduleCount");
    const lessonCountEl = document.getElementById("lessonCount");
    const completedLessonsEl = document.getElementById("completedLessons");
    const totalLessonsEl = document.getElementById("totalLessons");
    const courseProgressEl = document.getElementById("courseProgress");
    const progressBarEl = document.getElementById("progressBar");
    const nextLessonBtn = document.getElementById("nextLessonBtn");
    const aiPracticeBtn = document.getElementById("aiPracticeBtn");
    const finalTaskBadgeEl = document.getElementById("finalTaskBadge");

    let finalTaskEl = document.getElementById("finalTask");
    let startTaskBtn = document.getElementById("startTaskBtn");
    let taskDescEl = document.getElementById("taskDescription");

    if (!modulesEl) {
        console.error("❌ #modules не найден");
        return;
    }

    const slug = getCourseSlug();
    if (!slug) {
        modulesEl.innerHTML = '<p>Не удалось определить slug курса (открой /courses/&lt;slug&gt;)</p>';
        return;
    }

    if (aiPracticeBtn) {
        aiPracticeBtn.href = `/anatilui.html?source=course&slug=${encodeURIComponent(slug)}`;
    }

    if (!finalTaskEl) {
        finalTaskEl = document.createElement("div");
        finalTaskEl.id = "finalTask";
        finalTaskEl.className = "final-task";
        document.querySelector(".course")?.appendChild(finalTaskEl);
    }

    if (!taskDescEl) {
        taskDescEl = document.createElement("p");
        taskDescEl.id = "taskDescription";
        taskDescEl.className = "final-task__desc";
        finalTaskEl.appendChild(taskDescEl);
    }

    if (!startTaskBtn) {
        startTaskBtn = document.createElement("button");
        startTaskBtn.id = "startTaskBtn";
        startTaskBtn.className = "final-task__btn";
        startTaskBtn.disabled = true;
        finalTaskEl.appendChild(startTaskBtn);
    }

    loadCourse();

    async function loadCourse() {
        try {
            const out = await authFetch(`/api/course/${encodeURIComponent(slug)}`);
            if (!out) return;

            const data = out.data;

            if (!data?.success) {
                modulesEl.innerHTML = "<p>Курс не найден или недоступен</p>";
                return;
            }

            if (data.course?.title && courseTitleEl) {
                courseTitleEl.textContent = data.course.title;
            }

            if (!Array.isArray(data.modules)) {
                modulesEl.innerHTML = "<p>Модули не найдены</p>";
                return;
            }

            renderModules(data.modules);
            updateCourseHero(data.course, data.modules);
            checkCourseProgress(data.course, data.modules);
        } catch (err) {
            console.error("❌ ошибка загрузки курса", err);
            if (err?.data) console.error("❌ server payload:", err.data);
            modulesEl.innerHTML = "<p>Ошибка загрузки курса</p>";
        }
    }

    function renderModules(modules) {
        modulesEl.innerHTML = "";

        modules.forEach((moduleItem, moduleIndex) => {
            if (!Array.isArray(moduleItem.lessons)) return;

            const state = getModuleState(moduleItem);
            const completedCount = moduleItem.lessons.filter((lesson) => Number(lesson.completed) === 1).length;
            const shouldOpenByDefault = state !== "locked" && moduleIndex === 0;

            const moduleEl = document.createElement("section");
            moduleEl.className = `module${shouldOpenByDefault ? " module--open" : ""}${state === "locked" ? " module--locked" : ""}`;

            const badgeHtml =
                state === "done"
                    ? '<span class="module__badge module__badge--done">Пройден</span>'
                    : state === "locked"
                        ? '<span class="module__badge module__badge--locked">Закрыт</span>'
                        : "";

            moduleEl.innerHTML = `
                <div class="module__head" role="button" tabindex="0" aria-expanded="${shouldOpenByDefault ? "true" : "false"}">
                    <div class="module__head-left">
                        <div class="module__icon module__icon--${state}">${getModuleIcon(state)}</div>
                        <div class="module__title-wrap">
                            <h2 class="module__name">${escapeHtml(moduleItem.title || "")}</h2>
                            <p class="module__sub">${completedCount} из ${moduleItem.lessons.length} уроков</p>
                        </div>
                    </div>
                    <div class="module__right">
                        ${badgeHtml}
                        ${state !== "locked" ? `
                        <div class="module__toggle" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>` : ""}
                    </div>
                </div>
                <div class="module__body" ${shouldOpenByDefault && state !== "locked" ? "" : "hidden"}>
                    <div class="lessons"></div>
                </div>
            `;

            const headEl = moduleEl.querySelector(".module__head");
            const bodyEl = moduleEl.querySelector(".module__body");
            const lessonsEl = moduleEl.querySelector(".lessons");

            const toggle = () => {
                if (state === "locked" || !bodyEl) return;
                const isOpen = !bodyEl.hidden;
                bodyEl.hidden = isOpen;
                headEl.setAttribute("aria-expanded", String(!isOpen));
                moduleEl.classList.toggle("module--open", !isOpen);
            };

            headEl.addEventListener("click", toggle);
            headEl.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle();
                }
            });

            moduleItem.lessons.forEach((lesson, index) => {
                const lessonState = getLessonState(moduleItem, lesson, index);
                const rowStateClass = lessonState.completed ? "lesson--done" : lessonState.canOpen ? "lesson--open" : "lesson--locked";
                const lessonEl = document.createElement("div");
                lessonEl.className = `lesson ${rowStateClass}`;
                lessonEl.innerHTML = `
                    <div class="lesson__icon">${lessonState.completed ? "✓" : lessonState.canOpen ? "○" : "🔒"}</div>
                    <div class="lesson__info">
                        <div class="lesson__title">${escapeHtml(lesson.title || "")}</div>
                        <div class="lesson__sub">${lessonState.completed ? "Завершено" : lessonState.canOpen ? "Доступно" : "Сначала пройдите предыдущие"}</div>
                    </div>
                    <div class="lesson__btn">${lessonState.completed ? "Повторить" : lessonState.canOpen ? "15 мин" : "Закрыто"}</div>
                `;

                if (lessonState.canOpen) {
                    const go = () => {
                        window.location.href = `/lesson/${lesson.id}`;
                    };
                    lessonEl.addEventListener("click", go);
                }

                lessonsEl.appendChild(lessonEl);
            });

            modulesEl.appendChild(moduleEl);
        });
    }

    function updateCourseHero(course, modules) {
        const moduleCount = Array.isArray(modules) ? modules.length : 0;
        let totalLessons = 0;
        let completedLessons = 0;
        let nextLesson = null;

        (modules || []).forEach((moduleItem) => {
            const lessons = Array.isArray(moduleItem.lessons) ? moduleItem.lessons : [];
            totalLessons += lessons.length;
            completedLessons += lessons.filter((lesson) => Number(lesson.completed) === 1).length;

            if (nextLesson) return;
            if (!Number(moduleItem.locked)) {
                const firstUncompletedIndex = lessons.findIndex((lesson) => Number(lesson.completed) !== 1);
                if (firstUncompletedIndex !== -1) {
                    nextLesson = lessons[firstUncompletedIndex];
                }
            }
        });

        let percent = 0;
        if (typeof course?.percent === "number") percent = course.percent;
        else if (totalLessons > 0) percent = Math.round((completedLessons / totalLessons) * 100);

        if (moduleCountEl) moduleCountEl.textContent = String(moduleCount);
        if (lessonCountEl) lessonCountEl.textContent = String(totalLessons);
        if (completedLessonsEl) completedLessonsEl.textContent = String(completedLessons);
        if (totalLessonsEl) totalLessonsEl.textContent = String(totalLessons);
        if (courseProgressEl) courseProgressEl.textContent = String(percent);
        if (progressBarEl) progressBarEl.style.width = `${percent}%`;

        if (nextLessonBtn) {
            if (nextLesson?.id) {
                nextLessonBtn.href = `/lesson/${nextLesson.id}`;
                nextLessonBtn.setAttribute("aria-disabled", "false");
                nextLessonBtn.innerHTML = 'Продолжить обучение <span aria-hidden="true">→</span>';
            } else {
                nextLessonBtn.href = "#";
                nextLessonBtn.setAttribute("aria-disabled", "true");
                nextLessonBtn.innerHTML = 'Все уроки пройдены <span aria-hidden="true">✓</span>';
            }
        }
    }

    function allLessonsCompleted(modules) {
        if (!Array.isArray(modules)) return false;
        return modules.every((moduleItem) => Array.isArray(moduleItem.lessons) && moduleItem.lessons.every((lesson) => Number(lesson.completed) === 1));
    }

    async function checkCourseProgress(course, modules) {
        if (!finalTaskEl || !startTaskBtn || !taskDescEl) return;

        finalTaskEl.style.display = "block";
        finalTaskEl.classList.remove("final-task--unlocked", "final-task--completed");

        const courseIsCompleted = !!course?.completed || allLessonsCompleted(modules);

        if (!courseIsCompleted) {
            if (finalTaskBadgeEl) finalTaskBadgeEl.textContent = "Закрыто";
            startTaskBtn.disabled = true;
            startTaskBtn.textContent = "Завершите курс";
            taskDescEl.textContent = "Завершите все уроки курса, чтобы открыть итоговое задание и перейти дальше.";
            return;
        }

        if (course?.final_passed) {
            finalTaskEl.classList.add("final-task--completed");
            if (finalTaskBadgeEl) finalTaskBadgeEl.textContent = "Пройдено";
            startTaskBtn.disabled = true;
            startTaskBtn.textContent = "Задание пройдено";
            taskDescEl.textContent = "Поздравляем! Вы уже успешно прошли итоговое задание этого курса.";
            return;
        }

        finalTaskEl.classList.add("final-task--unlocked");
        if (finalTaskBadgeEl) finalTaskBadgeEl.textContent = "Открыто";
        startTaskBtn.disabled = false;
        startTaskBtn.textContent = "Пройти итоговое задание";

        if (course?.id) {
            await loadFinalTask(course.id);
        } else {
            taskDescEl.textContent = "Не удалось определить courseId для задания";
        }
    }

    async function loadFinalTask(courseId) {
        try {
            const out = await authFetch(`/api/course/${courseId}/task`);
            if (!out) return;

            const data = out.data;
            if (!data?.success || !data?.task) return;

            taskDescEl.textContent = data.task.description || "Все уроки пройдены. Теперь вы можете приступить к финальному заданию.";
            startTaskBtn.disabled = false;
            startTaskBtn.textContent = "Пройти итоговое задание";
            startTaskBtn.onclick = () => {
                window.location.href = `/finallytask.html?taskId=${data.task.id}`;
            };
        } catch (err) {
            console.error("❌ ошибка загрузки задания", err);
            if (err?.data) console.error("❌ server payload:", err.data);
        }
    }
});
