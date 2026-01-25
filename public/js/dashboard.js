// dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
    // ====== header логотип ======
    const logoBtn = document.getElementById("logoBtn");
    if (logoBtn) {
        logoBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            const r = await apiFetch("/api/auth/me", { method: "GET", headers: {} });
            window.location.href = r && r.res && r.res.ok ? "/dashboard.html" : "/index.html";
        });
    }

    // ====== logout (если кнопка есть в DOM) ======
    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("token");
            window.location.href = "/index.html";
        });
    }

    // ====== user/me ======
    let user = null;
    const me = await apiFetch("/api/auth/me", { method: "GET", headers: {} });
    if (me && me.data && me.data.success) user = me.data.user;

    // инициалы в аватарке
    const userInitial = document.getElementById("userInitial");
    if (userInitial) {
        const src = (user?.name || user?.login || user?.email || "A").trim();
        userInitial.textContent = (src[0] || "A").toUpperCase();
    }

    // админ кнопка (если когда-нибудь добавишь в html)
    if (user?.role === "admin") {
        const adminBtn = document.getElementById("adminBtn");
        if (adminBtn) adminBtn.style.display = "inline-block";
    }

    // ====== модалка теста ======
    setupTestModal();

    // ====== прогресс курса ======
    await loadCourseProgress();
});

/* ================== MODAL ================== */
function setupTestModal() {
    const openBtn = document.getElementById("takeTestBtn");
    const modal = document.getElementById("testModal");
    const confirmBtn = document.getElementById("confirmTestBtn");

    if (!modal) return;

    const close = () => (modal.hidden = true);
    const open = () => (modal.hidden = false);

    // открыть по кнопке "Пройти тест"
    if (openBtn) openBtn.addEventListener("click", open);

    // закрыть по любому [data-close]
    modal.addEventListener("click", (e) => {
        const t = e.target;
        if (t && t.closest && t.closest("[data-close='1']")) close();
    });

    // ESC
    document.addEventListener("keydown", (e) => {
        if (!modal.hidden && e.key === "Escape") close();
    });

    // "Да, начать" — поставь сюда свой роут теста
    if (confirmBtn) {
        confirmBtn.addEventListener("click", () => {
            // пример: window.location.href = "/test.html";
            close();
        });
    }
}

/* ================== COURSE PROGRESS ================== */
async function loadCourseProgress() {
    const wrap = document.getElementById("courseWrap");
    if (!wrap) return;

    // сначала рендерим каркас (чтобы ids точно существовали)
    renderCourseSkeleton(wrap);

    const percentEl = document.getElementById("lessonPercent");
    const courseTitleEl = document.getElementById("courseTitle");
    const courseDescEl = document.getElementById("courseDesc");
    const lastLessonEl = document.getElementById("lastLesson");
    const nextLessonEl = document.getElementById("nextLesson");
    const circleEl = document.querySelector(".course__circle");
    const btn = document.getElementById("goToCourseBtn");

    try {
        const out = await apiFetch("/api/lessons/progress/current", { method: "GET" });
        if (!out) return;

        const { data } = out;
        if (!data?.success) return;

        // если курс не назначен
        if (!data.course) {
            setCourseEmptyState({
                percentEl,
                courseTitleEl,
                courseDescEl,
                lastLessonEl,
                nextLessonEl,
                circleEl,
                btn,
            });
            return;
        }

        const percent = Number(data.percent || 0);
        const completed = Number(data.completedLessons || 0);
        const total = Number(data.totalLessons || 0);

        if (percentEl) percentEl.textContent = `${percent}%`;
        if (courseTitleEl) courseTitleEl.textContent = data.course.title || "Ваш текущий курс";

        if (courseDescEl) {
            courseDescEl.textContent =
                total > 0 ? `Пройдено уроков: ${completed} из ${total}` : "Продолжайте обучение";
        }

        if (lastLessonEl) lastLessonEl.textContent = data.lastLesson ? data.lastLesson.title : "—";
        if (nextLessonEl)
            nextLessonEl.textContent = data.nextLesson ? data.nextLesson.title : "Все уроки пройдены";

        // круг прогресса (под твой CSS .course__circle / .course__percent)
        if (circleEl) {
            const clamped = Math.max(0, Math.min(100, percent));
            const deg = clamped * 3.6;
            circleEl.style.background = `conic-gradient(#2563eb ${deg}deg, #e6e8ee 0deg)`;
            circleEl.style.borderRadius = "999px";
            circleEl.style.padding = "6px";
            circleEl.style.boxSizing = "border-box";
        }

        // кнопка перехода
        if (btn) {
            const href = `/courses/${data.course.slug}`;
            btn.setAttribute("href", href);
            btn.style.pointerEvents = "";
            btn.style.opacity = "";
        }
    } catch (err) {
        console.error("Ошибка загрузки прогресса", err);
    }
}

function renderCourseSkeleton(wrap) {
    wrap.innerHTML = `
    <section class="course" aria-label="Course progress">
      <h2 class="course__title">Ваш курс</h2>

      <div class="course__grid">
        <div class="course__left">
          <div class="course__circle" aria-label="Прогресс курса">
            <div class="course__percent" id="lessonPercent">0%</div>
          </div>

          <div class="course__info">
            <h3 class="course__name" id="courseTitle">Загрузка…</h3>
            <p class="course__desc" id="courseDesc">Пожалуйста, подождите</p>
          </div>
        </div>

        <div class="course__right">
          <div class="lesson lesson--last">
            <div class="lesson__body">
              <p class="lesson__cap">Последний урок</p>
              <p class="lesson__txt" id="lastLesson">—</p>
            </div>
          </div>

          <div class="lesson lesson--next">
            <div class="lesson__body">
              <p class="lesson__cap">Следующий урок</p>
              <p class="lesson__txt" id="nextLesson">—</p>
            </div>
          </div>

          <a class="course__go" id="goToCourseBtn" href="#">
            Перейти к курсу
          </a>
        </div>
      </div>
    </section>
  `;
}

function setCourseEmptyState({ percentEl, courseTitleEl, courseDescEl, lastLessonEl, nextLessonEl, circleEl, btn }) {
    if (percentEl) percentEl.textContent = "0%";
    if (courseTitleEl) courseTitleEl.textContent = "Курс пока не назначен";
    if (courseDescEl) courseDescEl.textContent = "";
    if (lastLessonEl) lastLessonEl.textContent = "—";
    if (nextLessonEl) nextLessonEl.textContent = "—";

    if (circleEl) {
        circleEl.style.background = `conic-gradient(#e6e8ee 0deg, #e6e8ee 360deg)`;
        circleEl.style.borderRadius = "999px";
        circleEl.style.padding = "6px";
        circleEl.style.boxSizing = "border-box";
    }

    if (btn) {
        btn.setAttribute("href", "#");
        btn.style.pointerEvents = "none";
        btn.style.opacity = "0.6";
    }
}
