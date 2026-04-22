

function qs(sel, root = document){ return root.querySelector(sel); }
function qsa(sel, root = document){ return [...root.querySelectorAll(sel)]; }

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function getCourseSlug() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("slug") || params.get("course") || params.get("courseSlug");
  if (fromQuery) return fromQuery;

  const parts = window.location.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("courses");
  if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];

  return null;
}

function renderSkeleton(){
  return `
    <section class="card skel" aria-busy="true">
      <div class="skel__block">
        <div class="skel__left">
          <div class="skel__line" style="height:34px; width:75%"></div>
          <div class="skel__line" style="width:100%"></div>
          <div class="skel__line" style="width:65%"></div>
          <div class="skel__line" style="height:32px; width:260px"></div>
        </div>
        <div class="skel__right">
          <div class="skel__line" style="height:14px; width:60%"></div>
          <div class="skel__line" style="height:10px; width:100%"></div>
          <div class="skel__line" style="height:14px; width:35%"></div>
          <div class="skel__line" style="height:44px; width:100%"></div>
        </div>
      </div>
      <div class="skel__mods">
        <div class="skel__mod"><div class="skel__line" style="height:18px; width:70%"></div></div>
        <div class="skel__mod"><div class="skel__line" style="height:18px; width:62%"></div></div>
        <div class="skel__mod"><div class="skel__line" style="height:18px; width:68%"></div></div>
      </div>
    </section>
  `;
}

function badgeHtml(variant, text){
  return `<span class="badge badge--${variant}">${escapeHtml(text)}</span>`;
}

function lessonIcon(status){
  if (status === "completed") return "✓";
  if (status === "locked") return "🔒";
  return "▶";
}

function lessonStatusBadge(status){
  if (status === "completed") return badgeHtml("success","Пройден");
  if (status === "locked") return badgeHtml("locked","Закрыт");
  return badgeHtml("info","Доступен");
}

function moduleStatusBadge(locked){
  return locked ? badgeHtml("locked","Закрыт") : badgeHtml("info","Доступен");
}

function computeStats(modules){
  const mods = Array.isArray(modules) ? modules : [];
  const moduleCount = mods.length;

  let lessonCount = 0;
  let completedLessons = 0;
  let nextLessonId = null;

  for (const m of mods){
    const lessons = Array.isArray(m.lessons) ? m.lessons : [];
    lessonCount += lessons.length;

    const locked = Number(m.locked) === 1;
    const firstUncompletedIndex = lessons.findIndex(l => !Number(l.completed));

    lessons.forEach((l, idx) => {
      const completed = Number(l.completed) === 1;
      if (completed) completedLessons += 1;

      const canOpen = !locked && (completed || idx === firstUncompletedIndex || firstUncompletedIndex === -1);
      if (!nextLessonId && canOpen && !completed) nextLessonId = l.id;
    });
  }

  const progress = lessonCount ? Math.round((completedLessons / lessonCount) * 100) : 0;
  return { moduleCount, lessonCount, completedLessons, progress, nextLessonId };
}

function renderHero(course, stats){
  const { title, description } = course;
  const { moduleCount, lessonCount, progress, nextLessonId } = stats;
  const ctaDisabled = !nextLessonId;

  return `
    <section class="card hero">
      <div class="hero__grid">
        <div class="hero__left">
          <h1>${escapeHtml(title || "Курс")}</h1>
          ${description ? `<p class="hero__desc">${escapeHtml(description)}</p>` : ""}

          <div class="badges">
            ${badgeHtml("info", `Модулей: ${moduleCount}`)}
            ${badgeHtml("info", `Уроков: ${lessonCount}`)}
            ${badgeHtml("warning", `Прогресс: ${progress}%`)}
          </div>

          <div class="hero__cta">
            <button class="btn btn--primary ${ctaDisabled ? "is-disabled":""}" type="button" id="btnContinue" ${ctaDisabled ? "disabled":""}>
              Продолжить обучение
            </button>
            <button class="btn btn--secondary" type="button" id="btnAllModules">
              К модулям
            </button>
          </div>
        </div>

        <div class="hero__right">
          <div class="progress">
            <div class="progress__top">
              <div class="progress__label">Прогресс курса</div>
              <div class="progress__value">${progress}%</div>
            </div>
            <div class="progress__bar">
              <div class="progress__fill" style="width:${Math.max(0, Math.min(100, progress))}%"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderModules(modules){
  const mods = Array.isArray(modules) ? modules : [];
  let openedFirst = false;

  const html = mods.map((m) => {
    const lessons = Array.isArray(m.lessons) ? m.lessons : [];
    const locked = Number(m.locked) === 1;

    const completedCount = lessons.filter(l => Number(l.completed) === 1).length;

    const open = !openedFirst && !locked;
    if (open) openedFirst = true;

    const firstUncompletedIndex = lessons.findIndex(l => !Number(l.completed));

    return `
      <section class="card module ${open ? "is-open":""}" data-module="${escapeHtml(m.id)}">
        <button class="module__head" type="button" data-module-toggle="${escapeHtml(m.id)}" ${locked ? "disabled":""}>
          <div>
            <h3 class="module__title">${escapeHtml(m.title || "")}</h3>
            <div class="module__meta">
              ${moduleStatusBadge(locked)}
              <div class="module__count">${completedCount}/${lessons.length} уроков</div>
            </div>
          </div>
          <div class="module__toggle" aria-hidden="true">${open ? "▴" : "▾"}</div>
        </button>

        <div class="module__body">
          <div class="lesson-list">
            ${lessons.map((l, idx) => {
              const completed = Number(l.completed) === 1;
              const canOpen = !locked && (completed || idx === firstUncompletedIndex || firstUncompletedIndex === -1);

              const status = locked || !canOpen ? "locked" : (completed ? "completed" : "available");
              const clickable = canOpen;

              return `
                <div class="lesson lesson--${status} ${clickable ? "is-clickable":""}"
                     data-lesson="${escapeHtml(l.id)}"
                     data-can-open="${clickable ? "1":"0"}">
                  <div class="lesson__left">
                    <div class="lesson__icon" aria-hidden="true">${lessonIcon(status)}</div>
                    <div class="lesson__title" title="${escapeHtml(l.title || "")}">${escapeHtml(l.title || "")}</div>
                  </div>
                  <div class="lesson__right">
                    ${lessonStatusBadge(status)}
                    <button class="lesson__btn" type="button" ${clickable ? "" : "disabled"}>
                      ${completed ? "Повторить" : (clickable ? "Открыть" : "Закрыто")}
                    </button>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </section>
    `;
  }).join("");

  return `<section class="modules" id="modules">${html}</section>`;
}

function renderFinalTask({ isUnlocked, isCompleted, description, taskId }){
  const icon = isCompleted ? "🏆" : (isUnlocked ? "🏆" : "🔒");
  const iconBg = isCompleted ? "background:#ECFDF5;border-color:#BBF7D0;color:#15803D"
              : (isUnlocked ? "background:#FFFBEB;border-color:#FDE68A;color:#B45309"
              : "background:#F3F4F6;border-color:#E5E7EB;color:#6B7280");

  const title = isCompleted ? "Итоговое задание выполнено" : "Итоговое задание";
  const desc = isCompleted
    ? "Отлично! Ты завершил курс и сдал итоговую работу."
    : (isUnlocked
      ? (description || "Открылось! Пройди задание, чтобы получить результат.")
      : "Станет доступно после прохождения всех уроков курса.");

  const badge = isCompleted
    ? badgeHtml("success","Готово")
    : (isUnlocked ? badgeHtml("warning","Доступно") : badgeHtml("locked","Закрыто"));

  const btnText = isCompleted ? "Задание пройдено" : (isUnlocked ? "Пройти итоговое задание" : "Завершите курс");

  return `
    <section class="final" id="finalTask">
      <div class="final__inner">
        <div class="final__icon" style="${iconBg}" aria-hidden="true">${icon}</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px">
            <h2 class="final__title">${escapeHtml(title)}</h2>
            ${badge}
          </div>
          <p class="final__desc" id="taskDescription">${escapeHtml(desc)}</p>
          <div class="final__actions">
            <button class="btn ${isUnlocked && !isCompleted ? "btn--primary" : "is-disabled"}" type="button" id="btnFinalStart" ${isUnlocked && !isCompleted ? "" : "disabled"}>
              ${escapeHtml(btnText)}
            </button>
            <button class="btn btn--secondary" type="button" id="btnBackCourses">К курсам</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderEmpty(title, text){
  return `
    <section class="card empty">
      <div class="empty__icon empty__icon--error">!</div>
      <h2 class="empty__title">${escapeHtml(title)}</h2>
      <p class="empty__text">${escapeHtml(text)}</p>
      <button class="btn btn--primary" type="button" id="btnEmptyAction">К курсам</button>
    </section>
  `;
}

function setupHeader(){
  const burger = qs("#burger");
  const mobile = qs("#mobileMenu");
  if (!burger || !mobile) return;

  burger.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!open));
    mobile.hidden = open;
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860){
      burger.setAttribute("aria-expanded", "false");
      mobile.hidden = true;
    }
  });
}

function allLessonsCompleted(modules){
  if (!Array.isArray(modules)) return false;
  return modules.every(m => Array.isArray(m.lessons) && m.lessons.every(l => Number(l.completed) === 1));
}

async function fetchFinalTask(courseId){
  try{
      const out = await authFetch(`/api/${courseId}/task`);
    if (!out) return null;
    const data = out.data;
    if (!data?.success || !data?.task) return null;
    return { id: data.task.id, description: data.task.description || "" };
  }catch(e){
    console.error("❌ ошибка загрузки задания", e);
    return null;
  }
}

function bindInteractions(stats){
  const btnContinue = qs("#btnContinue");
  const btnAllModules = qs("#btnAllModules");

  if (btnContinue){
    btnContinue.addEventListener("click", () => {
      if (!stats.nextLessonId) return;
      window.location.href = `/lesson/${stats.nextLessonId}`;
    });
  }
  if (btnAllModules){
    btnAllModules.addEventListener("click", () => {
      const el = qs("#modules");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // accordion
  qsa("[data-module-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-module-toggle");
      const mod = id ? qs(`[data-module="${CSS.escape(id)}"]`) : null;
      if (!mod) return;
      mod.classList.toggle("is-open");
      const tog = qs(".module__toggle", mod);
      if (tog) tog.textContent = mod.classList.contains("is-open") ? "▴" : "▾";
    });
  });

  // lessons
  qsa(".lesson").forEach(row => {
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

  const btnBack = qs("#btnBackCourses");
  if (btnBack) btnBack.addEventListener("click", () => window.location.href = "/courses.html");
}

async function renderApp(){
  setupHeader();

  const app = qs("#app");
  if (!app) return;

  app.innerHTML = renderSkeleton();

  const slug = getCourseSlug();
  if (!slug){
    app.innerHTML = renderEmpty("Не удалось определить курс", "Открой /courses/<slug> или добавь ?slug=...");
    const b = qs("#btnEmptyAction");
    if (b) b.addEventListener("click", () => window.location.href = "/courses.html");
    return;
  }

  try{
    const out = await authFetch(`/api/course/${encodeURIComponent(slug)}`);
    if (!out) return;

    const data = out.data;
    if (!data?.success){
      app.innerHTML = renderEmpty("Курс не найден", "Курс не найден или недоступен.");
      const b = qs("#btnEmptyAction");
      if (b) b.addEventListener("click", () => window.location.href = "/courses.html");
      return;
    }

    const course = data.course || {};
    const modules = Array.isArray(data.modules) ? data.modules : [];
    const stats = computeStats(modules);

    // final state
    const courseIsCompleted = !!course?.completed || allLessonsCompleted(modules);
    const finalPassed = !!course?.final_passed;

    let finalTask = { isUnlocked: courseIsCompleted, isCompleted: finalPassed, description:"", taskId:null };

    if (courseIsCompleted && !finalPassed && course?.id){
      const task = await fetchFinalTask(course.id);
      if (task){
        finalTask.description = task.description || "";
        finalTask.taskId = task.id;
      }
    }

    // admin hint: ?admin=1
    const admin = new URL(window.location.href).searchParams.get("admin") === "1";
    if (admin){
      const a1 = qs("#adminLink"); const a2 = qs("#adminLinkMobile");
      if (a1) a1.hidden = false;
      if (a2) a2.hidden = false;
    }

    app.innerHTML = [
      renderHero({ title: course.title, description: course.description || "" }, stats),
      renderModules(modules),
      renderFinalTask(finalTask)
    ].join("");

    bindInteractions(stats);

    const btnFinal = qs("#btnFinalStart");
    if (btnFinal){
      btnFinal.addEventListener("click", () => {
        if (!finalTask.isUnlocked || finalTask.isCompleted) return;
        if (!finalTask.taskId){
            alert("Не удалось определить taskId. Проверь API /api/{id}/task");
          return;
        }
        window.location.href = `/finallytask.html?taskId=${finalTask.taskId}`;
      });
    }

  }catch(e){
    console.error(e);
    app.innerHTML = renderEmpty("Ошибка загрузки курса", "Проверь подключение и попробуй ещё раз.");
    const b = qs("#btnEmptyAction");
    if (b) b.addEventListener("click", () => window.location.href = "/courses.html");
  }
}

renderApp();
