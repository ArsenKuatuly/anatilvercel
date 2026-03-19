(() => {
    "use strict";

    const state = {
        currentStep: 1,
        profile: {
            first_name: "",
            last_name: "",
        },
        diagnostic: {
            alphabet: "",
            understanding: "",
            translation: "",
            construction: "",
            speaking: "",
            totalScore: 0,
        },
        result: null,
    };

    const STORAGE_KEY = "anatil_onboarding";
    const token = (() => {
        try {
            return localStorage.getItem("token") || "";
        } catch {
            return "";
        }
    })();

    const steps = Array.from(document.querySelectorAll(".step-card"));
    const topProgress = document.getElementById("topProgress");
    const stepPill = document.getElementById("stepPill");
    const startLearningBtn = document.getElementById("startLearningBtn");
    const retakeBtn = document.getElementById("retakeBtn");
    const welcomeForm = document.getElementById("welcomeForm");
    const diagnosticForm = document.getElementById("diagnosticForm");
    const resultLevel = document.getElementById("resultLevel");
    const resultLevelText = document.getElementById("resultLevelText");
    const resultFullName = document.getElementById("resultFullName");
    const profileInitials = document.getElementById("profileInitials");
    const firstModule = document.getElementById("firstModule");
    const learningPace = document.getElementById("learningPace");
    const weeklyGoal = document.getElementById("weeklyGoal");

    const levelMap = {
        A1: {
            title: "Начальный уровень",
            module: "Приветствие и знакомство",
            pace: "3 урока в неделю",
            goal: "2 урока + 1 AI-практика",
            courseSlug: "/levelcourses.html",
        },
        A2: {
            title: "Базовый уровень",
            module: "Повседневное общение",
            pace: "3–4 урока в неделю",
            goal: "3 урока + 2 AI-практики",
            courseSlug: "/levelcourses.html",
        },
        B1: {
            title: "Средний уровень",
            module: "Разговорная практика и грамматика",
            pace: "4 урока в неделю",
            goal: "3 урока + 2 диалога с AI",
            courseSlug: "/levelcourses.html",
        },
    };

    function init() {
        bindChoiceButtons();
        bindForms();
        bindActions();
        hydrateFromStorage();
        updateView();
    }

    function bindChoiceButtons() {
        const buttons = document.querySelectorAll(".choice-btn");
        buttons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const name = btn.dataset.name;
                const value = btn.dataset.value;
                if (!name) return;

                document
                    .querySelectorAll(`.choice-btn[data-name="${name}"]`)
                    .forEach((item) => item.classList.remove("is-selected"));

                btn.classList.add("is-selected");
                state.diagnostic[name] = value;
                clearError(name);
            });
        });
    }

    function bindForms() {
        if (welcomeForm) {
            welcomeForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                if (!validateWelcome()) return;

                state.profile.first_name = document.getElementById("firstName").value.trim();
                state.profile.last_name = document.getElementById("lastName").value.trim();

                persistState();
                await saveProfile(state.profile);
                state.currentStep = 2;
                updateView();
            });
        }

        if (diagnosticForm) {
            diagnosticForm.addEventListener("submit", (e) => {
                e.preventDefault();
                if (!validateDiagnostic()) return;

                const construction = document.getElementById("construction");
                state.diagnostic.construction = construction.value.trim();
                state.diagnostic.totalScore = calculateScore();
                state.result = getLevelByScore(state.diagnostic.totalScore, state.diagnostic.construction);
                persistState();
                fillResult();
                state.currentStep = 3;
                updateView();
            });
        }
    }

    function bindActions() {
        if (retakeBtn) {
            retakeBtn.addEventListener("click", () => {
                state.currentStep = 2;
                state.diagnostic = {
                    alphabet: "",
                    understanding: "",
                    translation: "",
                    construction: "",
                    speaking: "",
                    totalScore: 0,
                };
                state.result = null;
                resetDiagnosticUI();
                persistState();
                updateView();
            });
        }

        if (startLearningBtn) {
            startLearningBtn.addEventListener("click", async () => {
                await saveProfile(state.profile);
                persistState();
                window.location.href = "/dashboard.html";
            });
        }
    }

    function validateWelcome() {
        let valid = true;
        const firstName = document.getElementById("firstName");
        const lastName = document.getElementById("lastName");

        clearFieldState(firstName, "first_name");
        clearFieldState(lastName, "last_name");

        if (!firstName.value.trim()) {
            setFieldError(firstName, "first_name", "Введите имя");
            valid = false;
        }
        if (!lastName.value.trim()) {
            setFieldError(lastName, "last_name", "Введите фамилию");
            valid = false;
        }

        return valid;
    }

    function validateDiagnostic() {
        let valid = true;
        const requiredChoiceFields = ["alphabet", "understanding", "translation", "speaking"];
        requiredChoiceFields.forEach((field) => {
            clearError(field);
            if (!state.diagnostic[field]) {
                showError(field, "Выберите один вариант");
                valid = false;
            }
        });

        const construction = document.getElementById("construction");
        clearFieldState(construction, "construction");
        if (!construction.value.trim()) {
            setFieldError(construction, "construction", "Введите короткий ответ");
            valid = false;
        }

        return valid;
    }

    function calculateScore() {
        let total = 0;
        document.querySelectorAll(".choice-btn.is-selected").forEach((btn) => {
            total += Number(btn.dataset.score || 0);
        });

        const answer = (document.getElementById("construction").value || "").trim().toLowerCase();
        const hasCorrectPattern =
            answer.includes("мен") &&
            (answer.includes("атым") || answer.includes("аты") || answer.includes("есімім") || answer.includes("есимим"));

        if (hasCorrectPattern) total += 2;
        else if (answer.length >= 6) total += 1;

        return total;
    }

    function getLevelByScore(score, construction) {
        const answer = (construction || "").trim().toLowerCase();
        const strongWriting = answer.includes("менің атым") || answer.includes("менин атым") || answer.includes("есімім");

        if (score >= 9 && strongWriting) return "B1";
        if (score >= 5) return "A2";
        return "A1";
    }

    function fillResult() {
        const level = state.result || "A1";
        const meta = levelMap[level] || levelMap.A1;
        const fullName = [state.profile.first_name, state.profile.last_name].filter(Boolean).join(" ").trim() || "Пользователь";
        const initials = `${(state.profile.first_name[0] || "А").toUpperCase()}${(state.profile.last_name[0] || "К").toUpperCase()}`;

        if (resultLevel) resultLevel.textContent = level;
        if (resultLevelText) resultLevelText.textContent = meta.title;
        if (resultFullName) resultFullName.textContent = fullName;
        if (profileInitials) profileInitials.textContent = initials;
        if (firstModule) firstModule.textContent = meta.module;
        if (learningPace) learningPace.textContent = meta.pace;
        if (weeklyGoal) weeklyGoal.textContent = meta.goal;
    }

    function updateView() {
        steps.forEach((step) => {
            step.classList.toggle("step-card--active", Number(step.dataset.step) === state.currentStep);
        });

        const percent = state.currentStep === 1 ? 33.333 : state.currentStep === 2 ? 66.666 : 100;
        if (topProgress) topProgress.style.width = `${percent}%`;
        if (stepPill) stepPill.textContent = `Шаг ${state.currentStep} из 3`;

        if (state.currentStep === 3) fillResult();
    }

    function showError(field, text) {
        const errorEl = document.querySelector(`[data-error-for="${field}"]`);
        if (errorEl) errorEl.textContent = text;

        const choiceGroup = document.querySelector(`[data-choice-group="${field}"]`);
        if (choiceGroup) choiceGroup.classList.add("is-invalid");
    }

    function clearError(field) {
        const errorEl = document.querySelector(`[data-error-for="${field}"]`);
        if (errorEl) errorEl.textContent = "";

        const choiceGroup = document.querySelector(`[data-choice-group="${field}"]`);
        if (choiceGroup) choiceGroup.classList.remove("is-invalid");
    }

    function setFieldError(input, field, text) {
        if (input) input.classList.add("field--invalid");
        const errorEl = document.querySelector(`[data-error-for="${field}"]`);
        if (errorEl) errorEl.textContent = text;
    }

    function clearFieldState(input, field) {
        if (input) input.classList.remove("field--invalid");
        const errorEl = document.querySelector(`[data-error-for="${field}"]`);
        if (errorEl) errorEl.textContent = "";
    }

    function resetDiagnosticUI() {
        const construction = document.getElementById("construction");
        if (construction) construction.value = "";

        document.querySelectorAll(".choice-btn").forEach((btn) => btn.classList.remove("is-selected"));
        ["alphabet", "understanding", "translation", "construction", "speaking"].forEach(clearError);
        clearFieldState(construction, "construction");
    }

    function persistState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {}
    }

    function hydrateFromStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (!saved || typeof saved !== "object") return;

            Object.assign(state, saved);

            const firstNameInput = document.getElementById("firstName");
            const lastNameInput = document.getElementById("lastName");
            const construction = document.getElementById("construction");

            if (firstNameInput) firstNameInput.value = state.profile.first_name || "";
            if (lastNameInput) lastNameInput.value = state.profile.last_name || "";
            if (construction) construction.value = state.diagnostic.construction || "";

            Object.entries(state.diagnostic).forEach(([key, value]) => {
                if (!value || key === "construction" || key === "totalScore") return;
                const btn = document.querySelector(`.choice-btn[data-name="${key}"][data-value="${value}"]`);
                if (btn) btn.classList.add("is-selected");
            });
        } catch {}
    }

    async function saveProfile(profile) {
        if (!token) return;

        try {
            await fetch("/api/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    first_name: profile.first_name || "",
                    last_name: profile.last_name || "",
                }),
            });
        } catch (err) {
            console.error("Не удалось сохранить профиль", err);
        }
    }

    init();
})();
