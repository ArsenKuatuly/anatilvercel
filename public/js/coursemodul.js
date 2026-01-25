console.log("coursemodul.js загружен");

function getCourseSlug() {
    // 1) ?slug=
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("slug") || params.get("course") || params.get("courseSlug");
    if (fromQuery) return fromQuery;

    // 2) /courses/<slug>
    const parts = window.location.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("courses");
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];

    return null;
}

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

    const slug = getCourseSlug();
    if (!slug) {
        modulesEl.innerHTML = "<p>Не удалось определить slug курса (открой /courses/<slug>)</p>";
        return;
    }

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
            const out = await authFetch(`/api/course/${encodeURIComponent(slug)}`);
            if (!out) return; // если был 401, authFetch уже редиректнул

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

        modules.forEach((m) => {
            if (!Array.isArray(m.lessons)) return;

            const moduleEl = document.createElement("section");
            moduleEl.className = "module" + (Number(m.locked) ? " module--locked" : "");

            moduleEl.innerHTML = `
      <div class="module__head" role="button" tabindex="0" aria-expanded="false">
        <div class="module__title">
          <h2 class="module__name">${escapeHtml(m.title || "")}</h2>
          <div class="module__meta">
            <span class="module__meta-item">
              ${m.lessons.length} урок(ов)
            </span>
            ${
                Number(m.locked)
                    ? `<span class="module__badge module__badge--locked">Закрыто</span>`
                    : `<span class="module__badge module__badge--open">Открыто</span>`
            }
          </div>
        </div>

        <div class="module__toggle" aria-hidden="true">
          <span class="module__chev">⌄</span>
        </div>
      </div>

      <div class="module__body" hidden>
        <div class="lessons"></div>
      </div>
    `;

            const headEl = moduleEl.querySelector(".module__head");
            const bodyEl = moduleEl.querySelector(".module__body");
            const lessonsEl = moduleEl.querySelector(".lessons");

            // Раскрытие/сворачивание модуля
            const toggle = () => {
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

            // первый модуль открыт
            if (!Number(m.locked)) {
                bodyEl.hidden = false;
                headEl.setAttribute("aria-expanded", "true");
                moduleEl.classList.add("module--open");
            }

            // первый незавершённый урок
            const firstUncompletedIndex = m.lessons.findIndex((l) => !Number(l.completed));

            m.lessons.forEach((lesson, index) => {
                const completed = Number(lesson.completed) === 1;

                const canOpen =
                    !Number(m.locked) &&
                    (completed || index === firstUncompletedIndex || firstUncompletedIndex === -1);

                const lessonEl = document.createElement("div");
                lessonEl.className =
                    "lesson" +
                    (completed ? " lesson--done" : "") +
                    (!canOpen ? " lesson--locked" : " lesson--open");

                lessonEl.innerHTML = `
        <div class="lesson__left">
          <div class="lesson__icon">
            ${
                    completed
                        ? "✔"
                        : canOpen
                            ? "▶"
                            : "🔒"
                }
          </div>
          <div class="lesson__info">
            <div class="lesson__title">${escapeHtml(lesson.title || "")}</div>
            <div class="lesson__sub">
              ${
                    completed
                        ? "Завершено"
                        : canOpen
                            ? "Доступно"
                            : "Сначала пройдите предыдущие"
                }
            </div>
          </div>
        </div>

        <button class="lesson__btn" type="button" ${canOpen ? "" : "disabled"}>
          ${completed ? "Повторить" : canOpen ? "Открыть" : "Закрыто"}
        </button>
      `;

                if (canOpen) {
                    const go = () => (window.location.href = `/lesson/${lesson.id}`);
                    lessonEl.addEventListener("click", (e) => {
                        // чтобы кнопка тоже работала
                        if (e.target.closest(".lesson__btn")) return;
                        go();
                    });
                    lessonEl.querySelector(".lesson__btn").addEventListener("click", go);
                }

                lessonsEl.appendChild(lessonEl);
            });

            modulesEl.appendChild(moduleEl);
        });
    }


    function updateCourseHero(course, modules) {
        const moduleCountEl = document.getElementById("moduleCount");
        const lessonCountEl = document.getElementById("lessonCount");
        const courseProgressEl = document.getElementById("courseProgress");
        const progressBarEl = document.getElementById("progressBar");
        const nextLessonBtn = document.getElementById("nextLessonBtn");

        const moduleCount = Array.isArray(modules) ? modules.length : 0;

        let totalLessons = 0;
        let completedLessons = 0;


        let nextLesson = null;

        (modules || []).forEach((m) => {
            const lessons = Array.isArray(m.lessons) ? m.lessons : [];
            totalLessons += lessons.length;
            completedLessons += lessons.filter((l) => Number(l.completed) === 1).length;

            if (nextLesson) return;


            if (!Number(m.locked)) {
                const firstUncompletedIndex = lessons.findIndex((l) => !Number(l.completed));
                if (firstUncompletedIndex !== -1) {
                    nextLesson = lessons[firstUncompletedIndex];
                } else if (lessons.length) {

                }
            }
        });


        let percent = 0;
        if (typeof course?.percent === "number") percent = course.percent;
        else if (totalLessons > 0) percent = Math.round((completedLessons / totalLessons) * 100);

        if (moduleCountEl) moduleCountEl.textContent = String(moduleCount);
        if (lessonCountEl) lessonCountEl.textContent = String(totalLessons);
        if (courseProgressEl) courseProgressEl.textContent = String(percent);

        if (progressBarEl) progressBarEl.style.width = `${percent}%`;


        if (nextLessonBtn) {
            if (nextLesson?.id) {
                nextLessonBtn.href = `/lesson/${nextLesson.id}`;
                nextLessonBtn.setAttribute("aria-disabled", "false");
                nextLessonBtn.style.pointerEvents = "auto";
                nextLessonBtn.style.opacity = "1";
            } else {
                nextLessonBtn.href = "#";
                nextLessonBtn.setAttribute("aria-disabled", "true");
                nextLessonBtn.style.pointerEvents = "none";
                nextLessonBtn.style.opacity = "0.6";
                nextLessonBtn.textContent = "Все уроки пройдены";
            }
        }
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

            taskDescEl.textContent =
                data.task.description || "Пройдите задание, чтобы получить результат";

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

    function escapeHtml(str) {
        return String(str)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
});
