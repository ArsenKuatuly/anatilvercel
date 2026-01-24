console.log("coursemodul.js загружен");

function getCourseSlug() {
    // 1) ?slug=
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("slug");
    if (fromQuery) return fromQuery;

    // 2) /courses/<slug>
    const parts = window.location.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("courses");
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];

    return null;
}

const courseSlug = getCourseSlug();

if (!courseSlug) {
    alert("Не удалось определить курс");
    throw new Error("Course slug not found");
}

console.log("COURSE SLUG:", courseSlug);

document.addEventListener("DOMContentLoaded", () => {
    const modulesEl = document.getElementById("modules");
    const courseTitleEl = document.getElementById("courseTitle");

    let finalTaskEl = document.getElementById("finalTask");
    let startTaskBtn = document.getElementById("startTaskBtn");
    let taskDescEl = document.getElementById("taskDescription");

    if (!modulesEl) {
        console.error("❌ #modules не найден");
        return;
    }

    // slug берём один раз
    const slug = courseSlug;

    // создаём блок итогового задания, если его нет в HTML
    if (!finalTaskEl) {
        finalTaskEl = document.createElement("div");
        finalTaskEl.id = "finalTask";
        finalTaskEl.className = "final-task";
        document.querySelector(".course")?.appendChild(finalTaskEl);
    }

    if (!taskDescEl) {
        taskDescEl = document.createElement("p");
        taskDescEl.id = "taskDescription";
        finalTaskEl.appendChild(taskDescEl);
    }

    if (!startTaskBtn) {
        startTaskBtn = document.createElement("button");
        startTaskBtn.id = "startTaskBtn";
        startTaskBtn.disabled = true;
        finalTaskEl.appendChild(startTaskBtn);
    }

    loadCourse();

    async function loadCourse() {
        try {
            const res = await authFetch(`/api/course/${encodeURIComponent(slug)}`);
            const data = await res.json();

            if (!data?.success) {
                modulesEl.innerHTML = "<p>Курс не найден</p>";
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
            checkCourseProgress(data.course, data.modules);
        } catch (err) {
            console.error("❌ ошибка загрузки курса", err);
            modulesEl.innerHTML = "<p>Ошибка загрузки курса</p>";
        }
    }

    function renderModules(modules) {
        modulesEl.innerHTML = "";

        modules.forEach((m) => {
            if (!Array.isArray(m.lessons)) return;

            const moduleEl = document.createElement("section");
            moduleEl.className = "module";

            moduleEl.innerHTML = `
        <div class="module-header">
          <h2>${escapeHtml(m.title || "")}</h2>
        </div>
        <div class="lessons"></div>
      `;

            const lessonsEl = moduleEl.querySelector(".lessons");

            // первый незавершённый урок в модуле
            const firstUncompletedIndex = m.lessons.findIndex((l) => !Number(l.completed));

            m.lessons.forEach((lesson, index) => {
                const completed = Number(lesson.completed) === 1;

                // если модуль залочен — уроки залочены тоже
                const canOpen =
                    !Number(m.locked) &&
                    (completed || index === firstUncompletedIndex || firstUncompletedIndex === -1);

                const lessonEl = document.createElement("div");
                lessonEl.className =
                    "lesson" + (completed ? " completed" : "") + (!canOpen ? " locked" : "");

                lessonEl.innerHTML = `
          <span>${escapeHtml(lesson.title || "")}</span>
          ${completed ? `<span>✔</span>` : ``}
        `;

                if (canOpen) {
                    lessonEl.addEventListener("click", () => {
                        // ✅ красивый URL под твой vercel.json
                        window.location.href = `/lesson/${lesson.id}`;
                    });
                }

                lessonsEl.appendChild(lessonEl);
            });

            modulesEl.appendChild(moduleEl);
        });
    }

    function allLessonsCompleted(modules) {
        if (!Array.isArray(modules)) return false;
        return modules.every(
            (m) => Array.isArray(m.lessons) && m.lessons.every((l) => Number(l.completed) === 1)
        );
    }

    async function checkCourseProgress(course, modules) {
        if (!finalTaskEl || !startTaskBtn || !taskDescEl) return;

        finalTaskEl.style.display = "block";

        const courseIsCompleted = !!course?.completed || allLessonsCompleted(modules);

        if (!courseIsCompleted) {
            startTaskBtn.disabled = true;
            startTaskBtn.textContent = "Завершите курс";
            taskDescEl.textContent = "Завершите все уроки курса, чтобы открыть задание";
            return;
        }

        if (course?.final_passed) {
            startTaskBtn.disabled = true;
            startTaskBtn.textContent = "Задание пройдено";
            taskDescEl.textContent = "Вы уже прошли итоговое задание";
            return;
        }

        startTaskBtn.disabled = false;
        startTaskBtn.textContent = "Пройти итоговое задание";

        // course.id нужен для /api/course/:courseId/task
        if (course?.id) {
            await loadFinalTask(course.id);
        } else {
            taskDescEl.textContent = "Не удалось определить courseId для задания";
        }
    }

    async function loadFinalTask(courseId) {
        if (!finalTaskEl || !startTaskBtn || !taskDescEl) return;

        try {
            const res = await authFetch(`/api/course/${courseId}/task`);
            const data = await res.json();

            if (!data?.success || !data?.task) return;

            taskDescEl.textContent =
                data.task.description || "Пройдите задание, чтобы получить результат";

            startTaskBtn.disabled = false;
            startTaskBtn.textContent = "Пройти итоговое задание";

            startTaskBtn.onclick = () => {
                window.location.href = `/finallytask.html?taskId=${data.task.id}`;
            };
        } catch (err) {
            console.error("❌ ошибка загрузки задания", err);
        }
    }

    // простая защита от XSS в title
    function escapeHtml(str) {
        return String(str)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
});
