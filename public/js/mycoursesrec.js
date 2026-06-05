document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("recommendedCourse");
    if (!container) return;

    const token = localStorage.getItem("token");


    if (!token) {
        container.innerHTML = `
      <p>Войдите, чтобы увидеть рекомендованный курс</p>
      <button class="btn btn--primary" id="goAuthBtn">Войти</button>
    `;
        document.getElementById("goAuthBtn")?.addEventListener("click", () => {
            window.location.href = "/auth.html";
        });
        return;
    }

    try {
        const res = await fetch("/api/my-course", {
            headers: {
                Authorization: "Bearer " + token
            }
        });

        if (res.status === 401) {
            localStorage.removeItem("token");
            container.innerHTML = `
        <p>Сессия истекла. Войдите снова</p>
        <button class="btn btn--primary" id="goAuthBtn">Войти</button>
      `;
            document.getElementById("goAuthBtn")?.addEventListener("click", () => {
                window.location.href = "/auth.html";
            });
            return;
        }

        const data = await res.json();

        if (!data.success || !data.course) {
            container.innerHTML = `
        <p>${data.message || "Вы ещё не проходили тест"}</p>
        <button class="btn btn--primary" id="goTestBtn">Пройти тест</button>
      `;
            document.getElementById("goTestBtn")?.addEventListener("click", () => {
                window.location.href = "/test.html";
            });
            return;
        }

        const course = data.course;

        container.innerHTML = `
      <div class="course-rec">
        <h3 class="course-rec__title">${course.title}</h3>
        <p class="course-rec__meta">Уровень: <b>${humanLevel(course.level)}</b></p>

        <button class="btn btn--primary" id="openCourseBtn">
          Перейти к курсу
        </button>
      </div>
    `;

        document.getElementById("openCourseBtn")?.addEventListener("click", () => {

            window.location.href = `/coursemodul.html?slug=${encodeURIComponent(course.slug)}`;


        });
    } catch (e) {
        console.error(e);
        container.innerHTML = "<p>Ошибка загрузки курса</p>";
    }
});

function humanLevel(level) {
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
