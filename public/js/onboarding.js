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
            selfDescription: "",
            speaking: "",
            totalScore: 0,
            aiReasoning: "",
            recommendedFullTest: false,
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
    const fullTestBtn = document.getElementById("fullTestBtn");

    const welcomeForm = document.getElementById("welcomeForm");
    const diagnosticForm = document.getElementById("diagnosticForm");

    const resultLevel = document.getElementById("resultLevel");
    const resultLevelText = document.getElementById("resultLevelText");
    const resultFullName = document.getElementById("resultFullName");
    const profileInitials = document.getElementById("profileInitials");
    const firstModule = document.getElementById("firstModule");
    const learningPace = document.getElementById("learningPace");
    const weeklyGoal = document.getElementById("weeklyGoal");

    const aiReasoningEl = document.getElementById("aiReasoning");
    const fullTestRecommendationEl = document.getElementById("fullTestRecommendation");

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

    async function init() {
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
                persistState();
            });
        });
    }

    function bindForms() {
        if (welcomeForm) {
            welcomeForm.addEventListener("submit", async (e) => {
                e.preventDefault();

                if (!validateWelcome()) return;

                state.profile.first_name = document.getElementById("firstName")?.value.trim() || "";
                state.profile.last_name = document.getElementById("lastName")?.value.trim() || "";

                persistState();
                await saveProfile(state.profile);

                state.currentStep = 2;
                persistState();
                updateView();
            });
        }

        if (diagnosticForm) {
            diagnosticForm.addEventListener("submit", async (e) => {
                e.preventDefault();

                if (!validateDiagnostic()) return;

                const selfDescriptionInput = document.getElementById("selfDescription");
                state.diagnostic.selfDescription = selfDescriptionInput?.value.trim() || "";
                state.diagnostic.totalScore = calculateScore();

                setDiagnosticSubmitting(true);

                try {
                    const aiResult = await diagnoseLevelWithAI();

                    if (aiResult?.level && levelMap[aiResult.level]) {
                        state.result = aiResult.level;
                        state.diagnostic.aiReasoning = aiResult.reasoning || "";
                        state.diagnostic.recommendedFullTest = Boolean(aiResult.recommendedFullTest);
                    } else {
                        state.result = getFallbackLevel(
                            state.diagnostic.totalScore,
                            state.diagnostic.selfDescription
                        );
                        state.diagnostic.aiReasoning =
                            "Мы определили стартовый уровень по вашим ответам. Для более точного результата рекомендуется пройти полный тест.";
                        state.diagnostic.recommendedFullTest = true;
                    }
                } catch (error) {
                    console.error("AI-диагностика не удалась:", error);

                    state.result = getFallbackLevel(
                        state.diagnostic.totalScore,
                        state.diagnostic.selfDescription
                    );
                    state.diagnostic.aiReasoning =
                        "Стартовый уровень определён по краткой диагностике. Для точного определения рекомендуем пройти полный тест.";
                    state.diagnostic.recommendedFullTest = true;
                } finally {
                    setDiagnosticSubmitting(false);
                }

                persistState();
                fillResult();
                state.currentStep = 3;
                persistState();
                updateView();

                await saveOnboardingMiniResult();
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
                    selfDescription: "",
                    speaking: "",
                    totalScore: 0,
                    aiReasoning: "",
                    recommendedFullTest: false,
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
                await saveOnboardingMiniResult();
                persistState();

                const level = state.result || "A1";
                const meta = levelMap[level] || levelMap.A1;
                window.location.href = meta.courseSlug || "/dashboard.html";
            });
        }

        if (fullTestBtn) {
            fullTestBtn.addEventListener("click", async () => {
                await saveProfile(state.profile);
                await saveOnboardingMiniResult();
                persistState();
                window.location.href = "/test.html";
            });
        }
    }

    function validateWelcome() {
        let valid = true;

        const firstName = document.getElementById("firstName");
        const lastName = document.getElementById("lastName");

        clearFieldState(firstName, "first_name");
        clearFieldState(lastName, "last_name");

        if (!firstName?.value.trim()) {
            setFieldError(firstName, "first_name", "Введите имя");
            valid = false;
        }

        if (!lastName?.value.trim()) {
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

        const selfDescription = document.getElementById("selfDescription");
        clearFieldState(selfDescription, "selfDescription");

        const text = selfDescription?.value?.trim() || "";
        if (!text) {
            setFieldError(selfDescription, "selfDescription", "Расскажите немного о себе");
            valid = false;
        } else if (text.length < 12) {
            setFieldError(selfDescription, "selfDescription", "Напишите хотя бы 1–2 коротких предложения");
            valid = false;
        }

        return valid;
    }

    function calculateScore() {
        let total = 0;

        document.querySelectorAll(".choice-btn.is-selected").forEach((btn) => {
            total += Number(btn.dataset.score || 0);
        });

        const answer = (document.getElementById("selfDescription")?.value || "").trim().toLowerCase();

        if (answer.length >= 20) total += 1;
        if (answer.length >= 45) total += 1;
        if (containsKazakhLetters(answer)) total += 1;
        if (looksLikeSentence(answer)) total += 1;

        return total;
    }

    function containsKazakhLetters(text) {
        return /[әіңғүұқөһә]/i.test(text);
    }

    function looksLikeSentence(text) {
        const words = text.split(/\s+/).filter(Boolean);
        return words.length >= 4;
    }

    async function diagnoseLevelWithAI() {
        const payload = {
            profile: {
                first_name: state.profile.first_name,
                last_name: state.profile.last_name,
            },
            diagnostic: {
                alphabet: state.diagnostic.alphabet,
                understanding: state.diagnostic.understanding,
                translation: state.diagnostic.translation,
                selfDescription: state.diagnostic.selfDescription,
                speaking: state.diagnostic.speaking,
                totalScore: state.diagnostic.totalScore,
            },
        };

        const response = await fetch("/api/onboarding-diagnose", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`AI diagnose failed: ${response.status}`);
        }

        const data = await response.json();

        return {
            level: normalizeLevel(data?.level),
            reasoning: typeof data?.reasoning === "string" ? data.reasoning : "",
            recommendedFullTest: Boolean(data?.recommendedFullTest),
        };
    }

    function normalizeLevel(level) {
        const normalized = String(level || "").toUpperCase().trim();
        return ["A1", "A2", "B1"].includes(normalized) ? normalized : "";
    }

    function getFallbackLevel(score, selfDescription) {
        const answer = (selfDescription || "").trim().toLowerCase();
        const words = answer.split(/\s+/).filter(Boolean).length;
        const hasKazakh = containsKazakhLetters(answer);
        const longEnough = answer.length >= 30;

        if (score >= 9 && hasKazakh && longEnough && words >= 6) {
            return "B1";
        }

        if (score >= 5) {
            return "A2";
        }

        return "A1";
    }

    function fillResult() {
        const level = state.result || "A1";
        const meta = levelMap[level] || levelMap.A1;

        const fullName =
            [state.profile.first_name, state.profile.last_name]
                .filter(Boolean)
                .join(" ")
                .trim() || "Пользователь";

        const initials =
            `${(state.profile.first_name[0] || "А").toUpperCase()}${(state.profile.last_name[0] || "К").toUpperCase()}`;

        if (resultLevel) resultLevel.textContent = level;
        if (resultLevelText) resultLevelText.textContent = meta.title;
        if (resultFullName) resultFullName.textContent = fullName;
        if (profileInitials) profileInitials.textContent = initials;
        if (firstModule) firstModule.textContent = meta.module;
        if (learningPace) learningPace.textContent = meta.pace;
        if (weeklyGoal) weeklyGoal.textContent = meta.goal;

        if (aiReasoningEl) {
            aiReasoningEl.textContent =
                state.diagnostic.aiReasoning ||
                "Мы подобрали стартовый уровень на основе ваших ответов.";
        }

        if (fullTestRecommendationEl) {
            fullTestRecommendationEl.textContent = state.diagnostic.recommendedFullTest
                ? "Для более точного определения уровня рекомендуем пройти полный тест."
                : "Ваших ответов достаточно для стартовой рекомендации, но полный тест даст более точный результат.";
        }
    }

    function updateView() {
        steps.forEach((step) => {
            step.classList.toggle("step-card--active", Number(step.dataset.step) === state.currentStep);
        });

        const percent = state.currentStep === 1 ? 33.333 : state.currentStep === 2 ? 66.666 : 100;

        if (topProgress) topProgress.style.width = `${percent}%`;
        if (stepPill) stepPill.textContent = `Шаг ${state.currentStep} из 3`;

        if (state.currentStep === 3) {
            fillResult();
        }
    }

    function setDiagnosticSubmitting(isSubmitting) {
        if (!diagnosticForm) return;

        const submitBtn = diagnosticForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = isSubmitting;
            submitBtn.textContent = isSubmitting ? "Определяем уровень..." : "Определить мой уровень";
        }
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
        const selfDescription = document.getElementById("selfDescription");
        if (selfDescription) selfDescription.value = "";

        document.querySelectorAll(".choice-btn").forEach((btn) => btn.classList.remove("is-selected"));

        ["alphabet", "understanding", "translation", "selfDescription", "speaking"].forEach(clearError);
        clearFieldState(selfDescription, "selfDescription");
    }

    function persistState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error("Не удалось сохранить onboarding state", error);
        }
    }

    function hydrateFromStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;

            const saved = JSON.parse(raw);
            if (!saved || typeof saved !== "object") return;

            state.currentStep = saved.currentStep || 1;
            state.profile = {
                ...state.profile,
                ...(saved.profile || {}),
            };
            state.diagnostic = {
                ...state.diagnostic,
                ...(saved.diagnostic || {}),
            };
            state.result = saved.result || null;

            const firstNameInput = document.getElementById("firstName");
            const lastNameInput = document.getElementById("lastName");
            const selfDescriptionInput = document.getElementById("selfDescription");

            if (firstNameInput) firstNameInput.value = state.profile.first_name || "";
            if (lastNameInput) lastNameInput.value = state.profile.last_name || "";
            if (selfDescriptionInput) selfDescriptionInput.value = state.diagnostic.selfDescription || "";

            Object.entries(state.diagnostic).forEach(([key, value]) => {
                if (!value || ["selfDescription", "totalScore", "aiReasoning", "recommendedFullTest"].includes(key)) return;

                const btn = document.querySelector(`.choice-btn[data-name="${key}"][data-value="${value}"]`);
                if (btn) btn.classList.add("is-selected");
            });
        } catch (error) {
            console.error("Не удалось восстановить onboarding state", error);
        }
    }

    async function saveProfile(profile) {
        if (!token) return;

        try {
            await fetch("/api/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
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

    async function saveOnboardingMiniResult() {
        if (!token || !state.result) return;

        try {
            await fetch("/api/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    first_name: state.profile.first_name || "",
                    last_name: state.profile.last_name || "",
                    mini_level: state.result,
                    onboarding_completed: true,
                }),
            });
        } catch (err) {
            console.error("Не удалось сохранить mini onboarding result", err);
        }
    }

    init();
})();