const courseCard = document.getElementById("courseCard");
const goProfile = document.getElementById("goProfile");
const goHome = document.getElementById("goHome");

function getToken() {
    return localStorage.getItem("token");
}

function authHeaders() {
    const token = getToken();
    return token ? { Authorization: "Bearer " + token } : {};
}

function goToCourse(slug) {
    window.location.href = `/coursemodul.html?slug=${encodeURIComponent(slug)}`;
}

function renderMessage(text) {
    courseCard.innerHTML = `
    <div class="course__card">
      <h2 class="course__title">Мои курсы</h2>
      <p class="course__level">${text}</p>
      <button class="btn btn--primary" id="goAuth">Войти</button>
    </div>
  `;
    document.getElementById("goAuth").onclick = () => (window.location.href = "/auth.html");
}

function translateLevel(level) {
    const map = {
        elementary: "Элементарный",
        basic: "Базовый",
        intermediate: "Средний",
        upper: "Выше среднего",
        advanced: "Высокий",
        A1: "Элементарный",
        A2: "Базовый",
        B1: "Средний",
        B2: "Выше среднего",
        C1: "Высокий"
    };
    return map[level] || level;
}

async function fetchJson(url) {
    const res = await fetch(url, { headers: authHeaders() });
    return { res, data: await res.json().catch(() => ({})) };
}

async function loadMyCoursesSmart() {
    // 0) нет токена -> на вход
    if (!getToken()) {
        renderMessage("Войдите, чтобы увидеть ваш курс.");
        return;
    }

    try {
        // 1) активный курс
        const active = await fetchJson("/api/my-active-course");

        if (active.res.status === 401) {
            localStorage.removeItem("token");
            renderMessage("Сессия истекла. Войдите снова.");
            return;
        }

        if (active.data && active.data.success && active.data.slug) {
            // сразу открываем активный курс
            goToCourse(active.data.slug);
            return;
        }

        // 2) курс по уровню (рекомендованный)
        const rec = await fetchJson("/api/my-course");

        if (rec.res.status === 401) {
            localStorage.removeItem("token");
            renderMessage("Сессия истекла. Войдите снова.");
            return;
        }

        if (!rec.data.success || !rec.data.course) {
            courseCard.innerHTML = `
        <div class="course__card">
          <h2 class="course__title">Мои курсы</h2>
          <p class="course__level">${rec.data.message || "Курс не найден. Пройдите тест уровня."}</p>
          <button class="btn btn--primary" id="goTest">Пройти тест</button>
        </div>
      `;
            document.getElementById("goTest").onclick = () => (window.location.href = "/test.html");
            return;
        }

        const course = rec.data.course;

        // показываем карточку и кнопку
        courseCard.innerHTML = `
      <div class="course__card">
        <h2 class="course__title">${course.title}</h2>
        <p class="course__level">Уровень: ${translateLevel(course.level)}</p>

        <button class="btn btn--primary" id="openCourse">Продолжить</button>
      </div>
    `;

        document.getElementById("openCourse").onclick = () => goToCourse(course.slug);

    } catch (err) {
        console.error(err);
        courseCard.innerHTML = `
      <div class="course__card">
        <h2 class="course__title">Мои курсы</h2>
        <p class="course__level">Ошибка загрузки. Попробуйте ещё раз.</p>
        <button class="btn btn--primary" id="reload">Обновить</button>
      </div>
    `;
        document.getElementById("reload").onclick = () => location.reload();
    }
}

// кнопки
goProfile?.addEventListener("click", () => (window.location.href = "/profile.html"));
goHome?.addEventListener("click", () => (window.location.href = "/dashboard.html"));

loadMyCoursesSmart();
