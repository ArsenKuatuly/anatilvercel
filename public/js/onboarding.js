(() => {
    "use strict";

    const LEGACY_STORAGE_KEY = "anatil_onboarding_v2";
    const token = (() => {
        try {
            return localStorage.getItem("token") || "";
        } catch {
            return "";
        }
    })();

    function parseJwtPayload(jwtToken) {
        try {
            if (!jwtToken) return null;
            const part = jwtToken.split(".")[1];
            if (!part) return null;
            const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
            const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
            return JSON.parse(atob(padded));
        } catch {
            return null;
        }
    }

    const tokenPayload = parseJwtPayload(token);
    const storageScope = tokenPayload?.id || tokenPayload?.login || "guest";
    const STORAGE_KEY = `anatil_onboarding_v2_${storageScope}`;

    const state = {
        currentStep: 1,
        profile: {
            first_name: "",
            last_name: "",
        },
    };

    const welcomeForm = document.getElementById("welcomeForm");
    const firstNameInput = document.getElementById("firstName");
    const lastNameInput = document.getElementById("lastName");
    const chooseTestBtn = document.getElementById("chooseTestBtn");
    const chooseA1Btn = document.getElementById("chooseA1Btn");

    const stepPanels = Array.from(document.querySelectorAll(".step-panel"));
    const desktopHeroes = Array.from(document.querySelectorAll("[data-hero-step]"));
    const mobileHeroes = Array.from(document.querySelectorAll("[data-mobile-hero-step]"));
    const benefitBlocks = Array.from(document.querySelectorAll("[data-benefits-step]"));
    const desktopPill = document.getElementById("stepPillDesktop");
    const mobilePill = document.getElementById("stepPillMobile");

    function init() {
        hydrateFromStorage();
        bindEvents();
        updateView();
    }

    function bindEvents() {
        if (welcomeForm) {
            welcomeForm.addEventListener("submit", async (event) => {
                event.preventDefault();

                if (!validateWelcome()) return;

                state.profile.first_name = firstNameInput?.value.trim() || "";
                state.profile.last_name = lastNameInput?.value.trim() || "";

                persistState();
                await saveProfile();

                state.currentStep = 2;
                persistState();
                updateView();
            });
        }

        if (chooseTestBtn) {
            chooseTestBtn.addEventListener("click", async () => {
                await saveProfile();
                await completeOnboarding({ onboarding_completed: true });
                window.location.href = "/test.html";
            });
        }

        if (chooseA1Btn) {
            chooseA1Btn.addEventListener("click", async () => {
                await saveProfile();
                await completeOnboarding({
                    mini_level: "A1",
                    onboarding_completed: true,
                });
                window.location.href = "/levelcourses.html";
            });
        }

        [firstNameInput, lastNameInput].forEach((input) => {
            if (!input) return;
            input.addEventListener("input", () => {
                clearFieldError(input, input.name);
            });
        });
    }

    function validateWelcome() {
        let valid = true;

        clearFieldError(firstNameInput, "first_name");
        clearFieldError(lastNameInput, "last_name");

        if (!firstNameInput?.value.trim()) {
            setFieldError(firstNameInput, "first_name", "Введите имя");
            valid = false;
        }

        if (!lastNameInput?.value.trim()) {
            setFieldError(lastNameInput, "last_name", "Введите фамилию");
            valid = false;
        }

        return valid;
    }

    function setFieldError(input, field, message) {
        if (input) input.classList.add("field--invalid");
        const errorElement = document.querySelector(`[data-error-for="${field}"]`);
        if (errorElement) errorElement.textContent = message;
    }

    function clearFieldError(input, field) {
        if (input) input.classList.remove("field--invalid");
        const errorElement = document.querySelector(`[data-error-for="${field}"]`);
        if (errorElement) errorElement.textContent = "";
    }

    function updateView() {
        stepPanels.forEach((panel) => {
            panel.classList.toggle("step-panel--active", Number(panel.dataset.step) === state.currentStep);
        });

        desktopHeroes.forEach((hero) => {
            hero.classList.toggle("step-hero--active", Number(hero.dataset.heroStep) === state.currentStep);
        });

        mobileHeroes.forEach((hero) => {
            hero.classList.toggle("step-hero--active", Number(hero.dataset.mobileHeroStep) === state.currentStep);
        });

        benefitBlocks.forEach((block) => {
            block.classList.toggle("step-benefits--active", Number(block.dataset.benefitsStep) === state.currentStep);
        });

        const pillText = `Шаг ${state.currentStep} из 2`;
        if (desktopPill) desktopPill.textContent = pillText;
        if (mobilePill) mobilePill.textContent = pillText;
    }

    function hydrateFromStorage() {
        try {
            const rawState = localStorage.getItem(STORAGE_KEY);
            if (!rawState) return;

            const savedState = JSON.parse(rawState);
            if (!savedState || typeof savedState !== "object") return;

            if (savedState.profile && typeof savedState.profile === "object") {
                state.profile.first_name = savedState.profile.first_name || "";
                state.profile.last_name = savedState.profile.last_name || "";
            }

            if (savedState.currentStep === 2) {
                state.currentStep = 2;
            }

            if (firstNameInput) firstNameInput.value = state.profile.first_name;
            if (lastNameInput) lastNameInput.value = state.profile.last_name;

            if (localStorage.getItem(LEGACY_STORAGE_KEY)) {
                localStorage.removeItem(LEGACY_STORAGE_KEY);
            }
        } catch (error) {
            console.error("Не удалось восстановить onboarding state", error);
        }
    }

    function persistState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error("Не удалось сохранить onboarding state", error);
        }
    }

    async function saveProfile() {
        if (!token) return;
        if (!state.profile.first_name && !state.profile.last_name) return;

        try {
            await fetch("/api/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    first_name: state.profile.first_name,
                    last_name: state.profile.last_name,
                }),
            });
        } catch (error) {
            console.error("Не удалось сохранить профиль", error);
        }
    }

    async function completeOnboarding(extraPayload = {}) {
        try {
            persistState();
            localStorage.setItem("onboarding_completed", "true");
        } catch (error) {
            console.error("Не удалось обновить localStorage onboarding", error);
        }

        if (!token) return;

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
                    onboarding_completed: true,
                    ...extraPayload,
                }),
            });
        } catch (error) {
            console.error("Не удалось завершить onboarding", error);
        }
    }

    init();
})();