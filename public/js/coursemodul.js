console.log("coursemodul.js загружен (fixed)");

// ---------- helpers ----------
function escapeHtml(str) {
    return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }

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

function badgeHtml(variant, text) {
    return `<span class="badge badge--${variant}">${escapeHtml(text)}</span>`;
}

function lessonIcon(status) {
    if (status === "completed") return "✓";
    if (status === "locked") return "🔒";
    return "▶";
}

function computeStats(modules) {
    const mods = Array.isArray(modules) ? modules : [];
    let moduleCount = mods.length;
    let lessonCount = 0;
    let completedLessons = 0;
    let nextLessonId = null;

    for (const m of mods) {
        const locked = Number(m.locked) === 1;
        const lessons = Array.isArray(m.lessons) ? m.lessons : [];
        lessonCount += lessons.length;

        const firstUncompletedIndex = lessons.findIndex((l) => !Number(l.completed));

        lessons.forEach((l, idx) => {
            const completed = Number(l.completed) === 1;
            if (completed) completedLessons++;

            const canOpen =
                !locked &&
                (completed || idx === firstUncompletedIndex || firstUncompletedIndex === -1);

            if (!nextLessonId && canOpen && !completed) {
                nextLessonId = l.id;
            }
        });
    }

    const progress = lessonCount ? Math.round((completedLessons / lessonCount) * 100) : 0;
    return { moduleCount, lessonCount, completedLessons, progress, nextLessonId };
}

function allLessonsCompleted(modules) {
    if (!Array.isArray(modules)) return false;
    return modules.every(
        (m) => Array.isArray(m.lessons) && m.lessons.every((l) => Number(l.completed) === 1)
    );
}

// ---------- UI renderers (не ломаем DOM узлы) ----------
function renderHero(course, stats) {
    const title = course?.title || "Курс";
    const desc = course?.description || "";
    const disabled = !stats.nextLessonId;

    return `
    <section class="card hero" id="courseHero">
      <div class="hero__grid">
        <div class="hero__left">
          <h1 id="courseTitle">${escapeHtml(title)}</h1>
          ${desc ? `<p class="hero__desc">${escapeHtml(desc)}</p>` : ""}

          <div class="badges">
            ${badgeHtml("info", `Модулей: ${stats.moduleCount}`)}
            ${badgeHtml("info", `Уроков: ${stats.lessonCount}`)}
            ${badgeHtml("warning", `Прогресс: ${stats.progress}%`)}
          </div>

          <div class="hero__cta">
            <button class="btnx btnx--primary ${disabled ? "is-disabled" : ""}" id="btnContinue" type="button" ${
        disabled ? "disabled" : ""
    }>
              Продолжить обучение
            </button>
            <button class="btnx btnx--secondary" id="btnToModules" type="button">
              К модулям
            </button>
          </div>
        </div>

        <div class="hero__right">
          <div class="progress">
            <div class="progress__top">
              <div class="progress__label">Прогресс курса</div>
              <div class="progress__value">${stats.progress}%</div>
            </div>
            <div class="progress__bar">
              <div class="progress__fill" style="width:${Math.max(
        0,
        Math.min(100, stats.progress)
    )}%"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderModulesHTML(modules) {
    const mods = Array.isArray(modules) ? modules : [];
    let openedFirst = false;

    return `
    <section class="modules">
      ${mods
        .map((m) => {
            const lessons = Array.isArray(m.lessons) ? m.lessons : [];
            const locked = Number(m.locked) === 1;

            const completedCount = lessons.filter((l) => Number(l.completed) === 1).length;

            const open = !openedFirst && !locked;
            if (open) openedFirst = true;

            const firstUncompletedIndex = lessons.findIndex((l) => !Number(l.completed));

            return `
            <section class="card module ${open ? "is-open" : ""}" data-module="${escapeHtml(m.id)}">
              <button class="module__head" type="button" data-module-toggle="${escapeHtml(m.id)}" ${
                locked ? "disabled" : ""
            }>
                <div>
                  <h3 class="module__title">${escapeHtml(m.title || "")}</h3>
                  <div class="module__meta">
                    ${locked ? badgeHtml("locked", "Закрыт") : badgeHtml("info", "Доступен")}
                    <div class="module__count">${completedCount}/${lessons.length} уроков</div>
                  </div>
                </div>
                <div class="module__toggle" aria-hidden="true">${open ? "▴" : "▾"}</div>
              </button>

              <div class="module__body">
                <div class="lesson-list">
                  ${lessons
                .map((lesson, index) => {
                    const completed = Number(lesson.completed) === 1;

                    const canOpen =
                        !locked &&
                        (completed ||
                            index === firstUncompletedIndex ||
                            firstUncompletedIndex === -1);

                    const status =
                        locked || !canOpen
                            ? "locked"
                            : completed
                                ? "completed"
                                : "available";

                    const clickable = canOpen;

                    return `
                        <div class="lesson lesson--${status} ${clickable ? "is-clickable" : ""}"
                            data-lesson="${escapeHtml(lesson.id)}"
                            data-can-open="${clickable ? "1" : "0"}">
                          <div class="lesson__left">
                            <div class="lesson__icon" aria-hidden="true">${lessonIcon(status)}</div>
                            <div class="lesson__title" title="${escapeHtml(lesson.title || "")}">
                              ${escapeHtml(lesson.title || "")}
                            </div>
                          </div>
                          <div class="lesson__right">
                            ${
                        status === "completed"
                            ? badgeHtml("success", "Пройден")
                            : status === "locked"
                                ? badgeHtml("locked", "Закрыт")
                                : badgeHtml("info", "Доступен")
                    }
                            <button class="lesson__btn" type="button" ${
                        clickable ? "" : "disabled"
                    }>
                              ${completed ? "Повторить" : clickable ? "Открыть" : "Закрыто"}
                            </button>
                          </div>
                        </div>
                      `;
                })
                .join("")}
                </div>
              </div>
            </section>
          `;
        })
        .join("")}
    </section>
  `;
}

// ---------- main ----------
document.addEventListener("DOMContentLoaded", () => {
    const modulesEl = document.getElementById("modules");
    const courseRoot = document.querySelector(".course");
    const oldTitleEl = document.getElementById("courseTitle");

    let finalTaskEl = document.getElementById("finalTask");
    let startTaskBtn = document.getElementById("startTaskBtn");
    let taskDescEl = document.getElementById("taskDescription");

    if (!modulesEl) {
        console.error("❌ #modules не найден");
        return;
    }

    const slug = getCourseSlug();
    if (!slug) {
        modulesEl.innerHTML = "<p>Не удалось определить slug курса (открой /courses/&lt;slug&gt;)</p>";
        return;
    }

    // финалка — как у тебя
    if (!finalTaskEl) {
        finalTaskEl = document.createElement("div");
        finalTaskEl.id = "finalTask";
        finalTaskEl.className = "final-task"; // можешь переименовать под новый css
        courseRoot?.appendChild(finalTaskEl);
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
            if (!out) return;

            const data = out.data;

            if (!data?.success) {
                modulesEl.innerHTML = "<p>Курс не найден или недоступен</p>";
                return;
            }

            if (!Array.isArray(data.modules)) {
                modulesEl.innerHTML = "<p>Модули не найдены</p>";
                return;
            }

            // 1) Hero (не ломаем твой хедер/структуру)
            const stats = computeStats(data.modules);

            // спрячем старый title если был в html
            if (oldTitleEl) oldTitleEl.style.display = "none";

            // вставим hero перед modules
            let hero = document.getElementById("courseHero");
            if (hero) hero.remove();
            const heroWrap = document.createElement("div");
            heroWrap.innerHTML = renderHero(data.course, stats);
            courseRoot?.insertBefore(heroWrap.firstElementChild, modulesEl);

            // 2) Modules — ВАЖНО: только innerHTML, не outerHTML!
            modulesEl.innerHTML = renderModulesHTML(data.modules);

            // 3) Bind UI actions
            bindUI(stats);

            // 4) финалка — оставил твою логику
            checkCourseProgress(data.course, data.modules);
        } catch (err) {
            console.error("❌ ошибка загрузки курса", err);
            if (err?.data) console.error("❌ server payload:", err.data);
            modulesEl.innerHTML = "<p>Ошибка загрузки курса</p>";
        }
    }

    function bindUI(stats) {
        const btnContinue = document.getElementById("btnContinue");
        const btnToModules = document.getElementById("btnToModules");

        if (btnContinue) {
            btnContinue.onclick = () => {
                if (!stats.nextLessonId) return;
                window.location.href = `/lesson/${stats.nextLessonId}`;
            };
        }

        if (btnToModules) {
            btnToModules.onclick = () => {
                document.getElementById("modules")?.scrollIntoView({ behavior: "smooth", block: "start" });
            };
        }

        // accordion
        qsa("[data-module-toggle]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-module-toggle");
                const card = id ? qs(`[data-module="${CSS.escape(id)}"]`) : null;
                if (!card) return;
                card.classList.toggle("is-open");
                const toggle = qs(".module__toggle", card);
                if (toggle) toggle.textContent = card.classList.contains("is-open") ? "▴" : "▾";
            });
        });

        // lesson open
        qsa(".lesson").forEach((row) => {
            const id = row.getAttribute("data-lesson");
            const can = row.getAttribute("data-can-open") === "1";
            if (!id || !can) return;

            const go = () => (window.location.href = `/lesson/${id}`);

            row.addEventListener("click", (e) => {
                if (e.target.closest(".lesson__btn")) return;
                go();
            });

            const btn = qs(".lesson__btn", row);
            if (btn) btn.addEventListener("click", go);
        });
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
});
