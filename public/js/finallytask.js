console.log("finallytask.js загружен");

const params = new URLSearchParams(window.location.search);
const taskId = params.get("taskId");

const taskDescriptionEl = document.getElementById("taskDescription");
const questionsContainer = document.getElementById("questionsContainer");
const submitBtn = document.getElementById("submitTaskBtn");
const backBtn = document.getElementById("backBtn");
const resultMessage = document.getElementById("resultMessage");

let loadedTask = null;

if (!taskId) {
    taskDescriptionEl.textContent = "Задание не найдено";
    submitBtn.disabled = true;
} else {
    loadTask();
}

async function loadTask() {
    try {
        // ✅ теперь этот роут существует
        const res = await authFetch(`/api/task/${encodeURIComponent(taskId)}`);
        const data = await res.json();

        if (!data?.success || !data?.task) {
            taskDescriptionEl.textContent = "Задание не найдено";
            submitBtn.disabled = true;
            return;
        }

        loadedTask = data.task;

        taskDescriptionEl.textContent =
            loadedTask.description || "Описание задания отсутствует";

        await loadQuestions(taskId);
    } catch (err) {
        console.error("Ошибка загрузки задания:", err);
        taskDescriptionEl.textContent = "Ошибка загрузки задания";
        submitBtn.disabled = true;
    }
}

async function loadQuestions(taskId) {
    try {
        const res = await authFetch(`/api/task/${encodeURIComponent(taskId)}/questions`);
        const data = await res.json();

        if (!data?.success || !Array.isArray(data.questions) || data.questions.length === 0) {
            questionsContainer.innerHTML = "<p>Вопросы не найдены</p>";
            submitBtn.disabled = true;
            return;
        }

        questionsContainer.innerHTML = "";

        data.questions.forEach((q, i) => {
            const div = document.createElement("div");
            div.className = "question";

            // ✅ в Postgres-роуте поле называется question_text
            const text = q.question_text ?? q.question ?? "";

            // ✅ options может быть массивом или строкой JSON
            let options = [];
            if (Array.isArray(q.options)) {
                options = q.options;
            } else if (typeof q.options === "string") {
                try {
                    const parsed = JSON.parse(q.options);
                    options = Array.isArray(parsed) ? parsed : String(q.options).split(",");
                } catch {
                    options = String(q.options).split(",");
                }
            }

            options = options.map((o) => String(o).trim()).filter(Boolean);

            div.innerHTML = `
        <p>${i + 1}. ${escapeHtml(text)}</p>
        ${options
                .map(
                    (o) => `
          <label>
            <input type="radio" name="q${q.id}" value="${escapeAttr(o)}">
            ${escapeHtml(o)}
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
        if (!input) return;

        // name="q12" -> 12
        const qid = Number(String(input.name).slice(1));
        if (!Number.isFinite(qid)) return;

        answers.push({ questionId: qid, answer: input.value });
    });

    if (answers.length === 0) {
        alert("Выберите хотя бы один ответ");
        return;
    }

    try {
        submitBtn.disabled = true;

        const res = await authFetch(`/api/task/${encodeURIComponent(taskId)}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers }),
        });

        const data = await res.json();

        resultMessage.classList.remove("hidden");

        if (data?.success && data.passed) {
            resultMessage.textContent = `Поздравляем! Вы прошли задание 🎉 (баллы: ${data.score ?? "—"})`;
            resultMessage.style.color = "green";

            // можно отправить в профиль
            setTimeout(() => {
                window.location.href = "/profile.html";
            }, 1200);
        } else {
            resultMessage.textContent = `Задание не пройдено. Баллы: ${data.score ?? "—"}. Попробуйте снова.`;
            resultMessage.style.color = "red";
            submitBtn.disabled = false;
        }
    } catch (err) {
        console.error("Ошибка отправки задания:", err);
        resultMessage.classList.remove("hidden");
        resultMessage.textContent = "Ошибка отправки задания";
        resultMessage.style.color = "red";
        submitBtn.disabled = false;
    }
});

backBtn.addEventListener("click", () => {
    // если хочешь — можно вернуть на курс, но для этого нужен slug
    window.history.back();
});

// --- helpers ---
function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
function escapeAttr(str) {
    // для value=""
    return String(str).replaceAll('"', "&quot;");
}
