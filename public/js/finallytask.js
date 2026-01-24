console.log("finallytask.js загружен");

const params = new URLSearchParams(window.location.search);
const taskId = params.get("taskId");

const taskDescriptionEl = document.getElementById("taskDescription");
const questionsContainer = document.getElementById("questionsContainer");
const submitBtn = document.getElementById("submitTaskBtn");
const backBtn = document.getElementById("backBtn");
const resultMessage = document.getElementById("resultMessage");

function pickPayload(x) {
    // authFetch может вернуть Response или {res,data}
    if (!x) return { ok: false, data: null };
    if (x.data !== undefined) return { ok: !!x.res?.ok, data: x.data };
    return { ok: !!x.ok, data: null };
}

async function toJson(x) {
    if (!x) return {};
    if (x.data !== undefined) return x.data || {};
    return await x.json().catch(() => ({}));
}

if (!taskId) {
    taskDescriptionEl.textContent = "Задание не найдено";
    submitBtn.disabled = true;
} else {
    loadTask();
}

async function loadTask() {
    try {
        const raw = await authFetch(`/api/task/${encodeURIComponent(taskId)}`);
        const data = await toJson(raw);

        if (!data.success || !data.task) {
            taskDescriptionEl.textContent = "Задание не найдено";
            submitBtn.disabled = true;
            return;
        }

        taskDescriptionEl.textContent = data.task.description || "Описание задания отсутствует";
        await loadQuestions(taskId);
    } catch (err) {
        console.error("Ошибка загрузки задания:", err);
        taskDescriptionEl.textContent = "Ошибка загрузки задания";
        submitBtn.disabled = true;
    }
}

async function loadQuestions(taskId) {
    try {
        const raw = await authFetch(`/api/task/${encodeURIComponent(taskId)}/questions`);
        const data = await toJson(raw);

        if (!data.success || !Array.isArray(data.questions) || data.questions.length === 0) {
            questionsContainer.innerHTML = "<p>Вопросы не найдены</p>";
            submitBtn.disabled = true;
            return;
        }

        questionsContainer.innerHTML = "";

        data.questions.forEach((q, i) => {
            const div = document.createElement("div");
            div.className = "question";

            let options = [];
            if (Array.isArray(q.options)) options = q.options;
            else if (typeof q.options === "string") {
                try {
                    const parsed = JSON.parse(q.options);
                    options = Array.isArray(parsed) ? parsed : q.options.split(",");
                } catch {
                    options = q.options.split(",");
                }
            }

            options = options.map((o) => String(o).trim()).filter(Boolean);

            div.innerHTML = `
        <p>${i + 1}. ${q.question}</p>
        ${options
                .map(
                    (o) => `
          <label>
            <input type="radio" name="q${q.id}" value="${o}">
            ${o}
          </label>
        `
                )
                .join("")}
      `;

            questionsContainer.appendChild(div);
        });

        submitBtn.disabled = false;
    } catch (err) {
        console.error("Ошибка загрузки вопросов:", err);
        questionsContainer.innerHTML = "<p>Ошибка загрузки вопросов</p>";
        submitBtn.disabled = true;
    }
}

submitBtn.addEventListener("click", async () => {
    const answers = [];

    document.querySelectorAll(".question").forEach((qEl) => {
        const input = qEl.querySelector("input:checked");
        if (input) {
            answers.push({
                questionId: input.name.slice(1),
                answer: input.value
            });
        }
    });

    if (answers.length === 0) {
        alert("Выберите хотя бы один ответ");
        return;
    }

    try {
        const raw = await authFetch(`/api/task/${encodeURIComponent(taskId)}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers })
        });

        const data = await toJson(raw);

        resultMessage.classList.remove("hidden");

        if (data.success && data.passed) {
            resultMessage.textContent = "Поздравляем! Вы прошли задание 🎉";
            resultMessage.style.color = "green";
            submitBtn.disabled = true;

            setTimeout(() => {
                window.location.href = "/profile.html";
            }, 1200);
        } else {
            resultMessage.textContent = "Задание не пройдено. Попробуйте снова.";
            resultMessage.style.color = "red";
        }
    } catch (err) {
        console.error("Ошибка отправки задания:", err);
        resultMessage.classList.remove("hidden");
        resultMessage.textContent = "Ошибка отправки задания";
        resultMessage.style.color = "red";
    }
});

backBtn.addEventListener("click", () => window.history.back());
