(function () {
  // -----------------------------
  // Helpers
  // -----------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function nowTimeRU() {
    const d = new Date();
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }

  function setHidden(el, hidden) {
    if (!el) return;
    el.hidden = !!hidden;
  }

  function toast(msg) {
    const t = $("#toast");
    const tt = $("#toastText");
    if (!t || !tt) return;
    tt.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => (t.hidden = true), 1400);
  }

  // -----------------------------
  // Routing (hash-based)
  // -----------------------------
  const views = {
    home: $("#viewHome"),
    sentence: $("#viewSentence"),
    dialog: $("#viewDialog"),
    tutor: $("#viewTutor"),
  };

  const backBar = $("#backBar");
  const backBtn = $("#backBtn");

  function showView(name) {
    Object.keys(views).forEach((k) => setHidden(views[k], k !== name));
    setHidden(backBar, name === "home");
  }

  function getRoute() {
    const h = (location.hash || "#/").trim();
    const path = h.replace(/^#\/?/, "");
    if (!path) return "home";
    if (views[path]) return path;
    return "home";
  }

  function go(route) {
    location.hash = route === "home" ? "#/" : `#/${route}`;
  }

  window.addEventListener("hashchange", () => {
    const route = getRoute();
    showView(route);

    // When opening dialog/tutor on mobile, ensure sheet closed
    closeMobileSettings();
  });

  // -----------------------------
  // History panel (Sheet)
  // -----------------------------
  const historySheet = $("#historySheet");
  const historyOpenBtn = $("#historyOpenBtn");
  const historyCloseBtn = $("#historyCloseBtn");
  const historyBackdrop = $("#historyBackdrop");
  const historyList = $("#historyList");

  const historyItems = [
    { id: "1", mode: "sentence", date: "1 марта, 14:32", topic: "Проверка предложения", preview: "Мен кофе ішемін..." },
    { id: "2", mode: "dialog", date: "1 марта, 12:15", topic: "Диалог: Кафе", preview: "Практиковал заказ в кафе" },
    { id: "3", mode: "tutor", date: "28 февраля, 18:45", topic: "Урок 12 — Келер шақ", preview: "Вопросы по будущему времени" },
  ];

  function modeBadgeClass(mode) {
    if (mode === "sentence") return "hitem__badge hitem__badge--purple";
    if (mode === "dialog") return "hitem__badge hitem__badge--blue";
    return "hitem__badge hitem__badge--green";
  }
  function modeLabel(mode) {
    if (mode === "sentence") return "Проверка";
    if (mode === "dialog") return "Диалог";
    return "Репетитор";
  }
  function modeIcon(mode) {
    if (mode === "sentence") return "✍️";
    if (mode === "dialog") return "💬";
    return "🎓";
  }

  function renderHistory() {
    if (!historyList) return;
    historyList.innerHTML = historyItems
      .map((it) => {
        return `
          <div class="hitem" data-go="${it.mode}">
            <div class="hitem__top">
              <div class="${modeBadgeClass(it.mode)}">${modeIcon(it.mode)} ${modeLabel(it.mode)}</div>
              <div class="hitem__date"><span class="icon icon--clock" aria-hidden="true"></span>${it.date}</div>
            </div>
            <h4 class="hitem__title">${it.topic}</h4>
            <p class="hitem__preview">${it.preview}</p>
          </div>
        `;
      })
      .join("");

    $$(".hitem", historyList).forEach((node) => {
      node.addEventListener("click", () => {
        const r = node.getAttribute("data-go") || "home";
        closeHistory();
        go(r);
      });
    });
  }

  function openHistory() {
    if (!historySheet) return;
    historySheet.classList.add("sheet--open");
    historySheet.setAttribute("aria-hidden", "false");
  }
  function closeHistory() {
    if (!historySheet) return;
    historySheet.classList.remove("sheet--open");
    historySheet.setAttribute("aria-hidden", "true");
  }

  historyOpenBtn && historyOpenBtn.addEventListener("click", openHistory);
  historyCloseBtn && historyCloseBtn.addEventListener("click", closeHistory);
  historyBackdrop && historyBackdrop.addEventListener("click", closeHistory);

  renderHistory();

  // -----------------------------
  // Home: achievements
  // -----------------------------
  const achievementsList = $("#achievementsList");
  const achievements = [
    { icon: "✅", title: "Проверил 10 предложений", achieved: true },
    { icon: "💬", title: "Прошёл 3 диалога подряд", achieved: true },
    { icon: "🔥", title: "7 дней подряд практика", achieved: false },
  ];

  function renderAchievements() {
    if (!achievementsList) return;
    achievementsList.innerHTML = achievements
      .map((a) => {
        const cls = a.achieved ? "ach ach--on" : "ach ach--off";
        return `
          <div class="${cls}">
            <div class="ach__icon">${a.icon}</div>
            <div class="ach__text">${a.title}</div>
          </div>
        `;
      })
      .join("");
  }
  renderAchievements();

  // Home mode cards navigation
  $$("#modesGrid [data-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const r = btn.getAttribute("data-route");
      if (r) go(r);
    });
  });

  // Back button
  backBtn && backBtn.addEventListener("click", () => go("home"));

  // -----------------------------
  // Sentence mode
  // -----------------------------
  let sentenceState = {
    level: "A1",
    complexity: "simple",
    sentence: "",
    loading: false,
    result: null,
  };

  const sentenceLevel = $("#sentenceLevel");
  const sentenceComplexity = $("#sentenceComplexity");
  const sentenceTextarea = $("#sentenceTextarea");
  const sentenceCheckBtn = $("#sentenceCheckBtn");
  const sentenceLoading = $("#sentenceLoading");
  const sentenceResult = $("#sentenceResult");
  const sentenceEmpty = $("#sentenceEmpty");

  function setChipActive(container, selectorAttr, value) {
    if (!container) return;
    $$(`button[${selectorAttr}]`, container).forEach((b) => {
      b.classList.toggle("chip--active", b.getAttribute(selectorAttr) === value);
    });
  }

  function sentenceUpdateUI() {
    setHidden(sentenceLoading, !sentenceState.loading);
    setHidden(sentenceEmpty, sentenceState.loading || !!sentenceState.result);
    setHidden(sentenceResult, !sentenceState.result || sentenceState.loading);

    if (sentenceCheckBtn) {
      const can = !!sentenceState.sentence.trim() && !sentenceState.loading;
      sentenceCheckBtn.disabled = !can;
    }

    if (sentenceResult && sentenceState.result && !sentenceState.loading) {
      sentenceResult.innerHTML = renderResultCard(sentenceState.result);
      bindResultCard(sentenceResult, sentenceState.result);
    }
  }

  function renderResultCard(res) {
    const errorsHtml = (res.errors || [])
      .map(
        (e) => `
        <div class="err">
          <p class="err__title">${e.text}</p>
          <p class="err__desc">${e.explanation}</p>
        </div>
      `
      )
      .join("");

    const examplesHtml = (res.examples || [])
      .map((ex) => `<li>${ex}</li>`)
      .join("");

    return `
      <div class="result">
        <section class="card result__card">
          <div class="result__section">
            <div class="result__head">
              <span class="icon icon--check" style="color:#16A34A" aria-hidden="true"></span>
              <h4 class="result__h">Исправленный вариант</h4>
            </div>
            <div class="result__box result__box--green">
              <p>${escapeHtml(res.corrected)}</p>
              <button class="button button--ghost result__copy" data-copy type="button" title="Копировать">
                ⧉
              </button>
            </div>
          </div>

          ${
            (res.errors || []).length
              ? `
            <div class="result__section">
              <div class="result__head">
                <span class="icon icon--bulb" style="color:#D97706" aria-hidden="true"></span>
                <h4 class="result__h">Ошибки (${(res.errors || []).length})</h4>
              </div>
              <div class="result__errors">${errorsHtml}</div>
            </div>
          `
              : ""
          }

          ${
            res.rule
              ? `
            <div class="result__section">
              <div class="result__head">
                <span class="icon icon--book" style="color:#2563EB" aria-hidden="true"></span>
                <h4 class="result__h">Правило</h4>
              </div>
              <div class="result__rule">${escapeHtml(res.rule)}</div>
            </div>
          `
              : ""
          }

          ${
            (res.examples || []).length
              ? `
            <div class="result__section">
              <div class="result__head">
                <span class="icon icon--book" style="color:#2563EB" aria-hidden="true"></span>
                <h4 class="result__h">Примеры</h4>
              </div>
              <div class="result__examples">
                <ul>${examplesHtml}</ul>
              </div>
            </div>
          `
              : ""
          }

          ${
            res.exercise
              ? `
            <div class="result__section">
              <div class="result__head">
                <span class="icon icon--target" aria-hidden="true"></span>
                <h4 class="result__h">Задание</h4>
              </div>
              <div class="result__exercise">${escapeHtml(res.exercise)}</div>
            </div>
          `
              : ""
          }
        </section>
      </div>
    `;
  }

  function bindResultCard(root, res) {
    const copyBtn = $("[data-copy]", root);
    copyBtn &&
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(res.corrected || "");
          toast("Скопировано!");
        } catch {
          // Fallback
          toast("Не удалось скопировать");
        }
      });
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  sentenceLevel &&
    sentenceLevel.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-level]");
      if (!btn) return;
      sentenceState.level = btn.getAttribute("data-level");
      setChipActive(sentenceLevel, "data-level", sentenceState.level);
    });

  sentenceComplexity &&
    sentenceComplexity.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-complexity]");
      if (!btn) return;
      sentenceState.complexity = btn.getAttribute("data-complexity");
      setChipActive(sentenceComplexity, "data-complexity", sentenceState.complexity);
    });

  sentenceTextarea &&
    sentenceTextarea.addEventListener("input", () => {
      sentenceState.sentence = sentenceTextarea.value;
      sentenceState.result = null;
      sentenceUpdateUI();
    });

  sentenceCheckBtn &&
    sentenceCheckBtn.addEventListener("click", () => {
      if (!sentenceState.sentence.trim() || sentenceState.loading) return;

      sentenceState.loading = true;
      sentenceState.result = null;
      sentenceUpdateUI();

      // Simulate API call (как в TSX)
      setTimeout(() => {
        sentenceState.result = {
          original: sentenceState.sentence,
          corrected: "Мен кофе ішемін.",
          errors: [
            {
              text: "кафе → кофе",
              explanation: "В казахском языке используется слово 'кофе', а не 'кафе'",
            },
          ],
          rule:
            "В казахском языке заимствованные слова часто сохраняют звучание близкое к оригиналу. Слово 'кофе' пришло из европейских языков.",
          examples: [
            "Мен таңертең кофе ішемін (Я пью кофе утром)",
            "Ол кофені жақсы көреді (Он любит кофе)",
            "Кофе дайындаймын (Готовлю кофе)",
          ],
          exercise: "Перефразируй это предложение в прошедшем времени",
        };
        sentenceState.loading = false;
        sentenceUpdateUI();
      }, 1000);
    });

  // -----------------------------
  // Dialog mode
  // -----------------------------
  const dialogScenario = $("#dialogScenario");
  const dialogLevel = $("#dialogLevel");
  const dialogTone = $("#dialogTone");
  const dialogStartBtn = $("#dialogStartBtn");
  const dialogMessages = $("#dialogMessages");
  const dialogInput = $("#dialogInput");
  const dialogSendBtn = $("#dialogSendBtn");
  const dialogEmpty = $("#dialogEmpty");
  const dialogHintBtn = $("#dialogHintBtn");

  const scenarios = [
    { value: "cafe", label: "Кафе", icon: "☕" },
    { value: "taxi", label: "Такси", icon: "🚕" },
    { value: "shop", label: "Магазин", icon: "🛒" },
    { value: "university", label: "Универ", icon: "🎓" },
    { value: "meet", label: "Знакомство", icon: "👋" },
  ];

  let dialogState = {
    scenario: "cafe",
    level: "A1",
    tone: "friendly",
    started: false,
    messages: [],
  };

  function renderDialogScenarios() {
    if (!dialogScenario) return;
    dialogScenario.innerHTML = scenarios
      .map((s) => {
        const active = s.value === dialogState.scenario ? "chip chip--active chip--center" : "chip chip--center";
        return `<button class="${active}" type="button" data-scenario="${s.value}"><span>${s.icon}</span>${s.label}</button>`;
      })
      .join("");
  }

  function renderChatBubble({ isAI, message, feedback, timestamp }) {
    const rootCls = isAI ? "bubble" : "bubble bubble--user";
    const avatarCls = isAI ? "bubble__avatar bubble__avatar--ai" : "bubble__avatar bubble__avatar--user";
    const msgCls = isAI ? "bubble__msg bubble__msg--ai" : "bubble__msg bubble__msg--user";

    return `
      <div class="${rootCls}">
        <div class="${avatarCls}" aria-hidden="true">${isAI ? "🤖" : "👤"}</div>
        <div class="bubble__col">
          <div class="${msgCls}">${escapeHtml(message)}</div>
          ${
            feedback
              ? `<div class="bubble__feedback">
                  <div style="display:flex;flex-direction:column;gap:4px">
                    <div style="font-weight:600;color:#15803D">✓ Отлично!</div>
                    <div style="font-size:12px;color:#4B5563">${escapeHtml(feedback)}</div>
                  </div>
                </div>`
              : ""
          }
          ${timestamp ? `<div class="bubble__time">${escapeHtml(timestamp)}</div>` : ""}
        </div>
      </div>
    `;
  }

  function dialogUpdateUI() {
    if (!dialogInput || !dialogSendBtn || !dialogMessages || !dialogEmpty) return;

    dialogInput.disabled = !dialogState.started;
    dialogSendBtn.disabled = !dialogState.started || !dialogInput.value.trim();

    if (!dialogState.started) {
      dialogMessages.innerHTML = dialogEmpty.outerHTML;
      return;
    }

    dialogMessages.innerHTML = dialogState.messages.map(renderChatBubble).join("");
    dialogMessages.scrollTop = dialogMessages.scrollHeight;
  }

  renderDialogScenarios();

  dialogScenario &&
    dialogScenario.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-scenario]");
      if (!btn) return;
      dialogState.scenario = btn.getAttribute("data-scenario");
      renderDialogScenarios();
    });

  dialogLevel &&
    dialogLevel.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-level]");
      if (!btn) return;
      dialogState.level = btn.getAttribute("data-level");
      setChipActive(dialogLevel, "data-level", dialogState.level);
    });

  dialogTone &&
    dialogTone.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-tone]");
      if (!btn) return;
      dialogState.tone = btn.getAttribute("data-tone");
      setChipActive(dialogTone, "data-tone", dialogState.tone);
    });

  dialogStartBtn &&
    dialogStartBtn.addEventListener("click", () => {
      dialogState.started = true;
      dialogState.messages = [
        {
          id: "1",
          isAI: true,
          message: "Сәлеметсіз бе! Не тапсырыс бересіз?\n(Здравствуйте! Что будете заказывать?)",
          timestamp: nowTimeRU(),
        },
      ];
      if (dialogInput) dialogInput.value = "";
      dialogUpdateUI();
    });

  dialogInput &&
    dialogInput.addEventListener("input", () => {
      dialogUpdateUI();
    });

  function dialogSend() {
    if (!dialogInput || !dialogInput.value.trim() || !dialogState.started) return;

    const text = dialogInput.value;
    dialogState.messages.push({
      id: String(Date.now()),
      isAI: false,
      message: text,
      timestamp: nowTimeRU(),
    });
    dialogInput.value = "";
    dialogUpdateUI();

    // Simulate AI response (как в TSX)
    setTimeout(() => {
      dialogState.messages.push({
        id: String(Date.now() + 1),
        isAI: true,
        message: "Жақсы, бір американо әкелемін. Тағы не керек?\n(Хорошо, принесу один американо. Что-то ещё нужно?)",
        feedback: 'Вы правильно использовали форму "бір" для обозначения количества',
        timestamp: nowTimeRU(),
      });
      dialogUpdateUI();
    }, 1000);
  }

  dialogSendBtn && dialogSendBtn.addEventListener("click", dialogSend);
  dialogInput &&
    dialogInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") dialogSend();
    });

  dialogHintBtn &&
    dialogHintBtn.addEventListener("click", () => {
      toast("Подсказка: попробуй ответить коротко (мысалы: «Бір американо, өтінемін.»)");
    });

  // -----------------------------
  // Tutor mode
  // -----------------------------
  const tutorMessages = $("#tutorMessages");
  const tutorInput = $("#tutorInput");
  const tutorSendBtn = $("#tutorSendBtn");

  const lessonTrigger = $("#lessonTrigger");
  const lessonMenu = $("#lessonMenu");
  const lessonValue = $("#lessonValue");

  const lessons = [
    { value: "current", label: "Текущий урок (Урок 12 — Келер шақ)" },
    { value: "lesson1", label: "Урок 1 — Приветствия" },
    { value: "lesson2", label: "Урок 2 — Местоимения" },
    { value: "lesson5", label: "Урок 5 — Настоящее время" },
    { value: "lesson8", label: "Урок 8 — Прошедшее время" },
  ];

  let tutorState = {
    lesson: "current",
    messages: [
      {
        id: "1",
        isAI: true,
        message:
          "Сәлеметсіз! Я ваш AI-репетитор. Задавайте вопросы по уроку 'Келер шақ' (будущее время). Я помогу разобраться с темой подробно и структурированно.",
        timestamp: nowTimeRU(),
      },
    ],
  };

  function renderLessons() {
    if (!lessonMenu) return;
    lessonMenu.innerHTML = lessons
      .map((l) => {
        const active = l.value === tutorState.lesson ? "select__item select__item--active" : "select__item";
        return `<button class="${active}" type="button" role="option" data-lesson="${l.value}">${escapeHtml(l.label)}</button>`;
      })
      .join("");
  }

  function updateLessonLabel() {
    const found = lessons.find((l) => l.value === tutorState.lesson);
    if (lessonValue) lessonValue.textContent = found ? found.label : lessons[0].label;
  }

  function openLessonMenu() {
    if (!lessonMenu || !lessonTrigger) return;
    lessonMenu.classList.add("select__menu--open");
    lessonTrigger.setAttribute("aria-expanded", "true");
    lessonMenu.setAttribute("aria-hidden", "false");
  }
  function closeLessonMenu() {
    if (!lessonMenu || !lessonTrigger) return;
    lessonMenu.classList.remove("select__menu--open");
    lessonTrigger.setAttribute("aria-expanded", "false");
    lessonMenu.setAttribute("aria-hidden", "true");
  }
  function toggleLessonMenu() {
    if (!lessonMenu) return;
    if (lessonMenu.classList.contains("select__menu--open")) closeLessonMenu();
    else openLessonMenu();
  }

  function tutorUpdateUI() {
    if (!tutorMessages) return;
    tutorMessages.innerHTML = tutorState.messages.map((m) => renderChatBubble(m)).join("");
    tutorMessages.scrollTop = tutorMessages.scrollHeight;

    if (tutorSendBtn) tutorSendBtn.disabled = !tutorInput.value.trim();
  }

  renderLessons();
  updateLessonLabel();
  tutorUpdateUI();

  lessonTrigger && lessonTrigger.addEventListener("click", toggleLessonMenu);

  lessonMenu &&
    lessonMenu.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-lesson]");
      if (!btn) return;
      tutorState.lesson = btn.getAttribute("data-lesson");
      renderLessons();
      updateLessonLabel();
      closeLessonMenu();
      toast("Урок выбран");
    });

  document.addEventListener("click", (e) => {
    // close select if click outside
    const sel = $("#lessonSelect");
    if (!sel) return;
    if (sel.contains(e.target)) return;
    closeLessonMenu();
  });

  function tutorSend() {
    if (!tutorInput || !tutorInput.value.trim()) return;
    const text = tutorInput.value;
    tutorState.messages.push({ id: String(Date.now()), isAI: false, message: text, timestamp: nowTimeRU() });
    tutorInput.value = "";
    tutorUpdateUI();

    // Simulate AI response
    setTimeout(() => {
      tutorState.messages.push({
        id: String(Date.now() + 1),
        isAI: true,
        message:
          "Хороший вопрос! Для «келер шақ» обычно используют конструкцию: етістік түбірі + -а/-е/-й + жатырымын/отырымын/тұрмын/жүрмін.\nНапример: «Мен бара жатырмын» — Я собираюсь идти / Я буду идти (в ближайшем будущем).",
        timestamp: nowTimeRU(),
      });
      tutorUpdateUI();
    }, 1000);
  }

  tutorSendBtn && tutorSendBtn.addEventListener("click", tutorSend);
  tutorInput &&
    tutorInput.addEventListener("input", () => tutorUpdateUI());
  tutorInput &&
    tutorInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") tutorSend();
    });

  // -----------------------------
  // Mobile settings sheet (bottom)
  // -----------------------------
  const mobileSettingsSheet = $("#mobileSettingsSheet");
  const mobileSettingsBackdrop = $("#mobileSettingsBackdrop");
  const mobileSettingsCloseBtn = $("#mobileSettingsCloseBtn");
  const mobileSettingsBody = $("#mobileSettingsBody");

  const dialogMobileSettingsBtn = $("#dialogMobileSettingsBtn");
  const tutorMobileSettingsBtn = $("#tutorMobileSettingsBtn");

  function openMobileSettings(fromMode) {
    if (!mobileSettingsSheet || !mobileSettingsBody) return;

    // Clone the settings panel from the corresponding mode to keep layout identical
    mobileSettingsBody.innerHTML = "";
    if (fromMode === "dialog") {
      const src = $("#dialogSettings");
      if (src) mobileSettingsBody.appendChild(src.cloneNode(true));
    } else if (fromMode === "tutor") {
      const src = $("#tutorSettings");
      if (src) mobileSettingsBody.appendChild(src.cloneNode(true));
    } else {
      // sentence doesn't have mobile trigger in this simplified build
    }

    // Re-bind interactions inside cloned node (chips/select)
    rebindMobileSettings(fromMode);

    mobileSettingsSheet.classList.add("sheet--open");
    mobileSettingsSheet.setAttribute("aria-hidden", "false");
  }

  function closeMobileSettings() {
    if (!mobileSettingsSheet) return;
    mobileSettingsSheet.classList.remove("sheet--open");
    mobileSettingsSheet.setAttribute("aria-hidden", "true");
  }

  function rebindMobileSettings(fromMode) {
    // Important: cloned DOM must control SAME state objects
    if (!mobileSettingsBody) return;

    if (fromMode === "dialog") {
      const sc = $(".chips--grid", mobileSettingsBody);
      const lvl = $("#dialogLevel", mobileSettingsBody);
      const tone = $("#dialogTone", mobileSettingsBody);
      const start = $("#dialogStartBtn", mobileSettingsBody);

      // render scenarios inside cloned sheet
      if (sc) {
        sc.innerHTML = scenarios
          .map((s) => {
            const active = s.value === dialogState.scenario ? "chip chip--active chip--center" : "chip chip--center";
            return `<button class="${active}" type="button" data-scenario="${s.value}"><span>${s.icon}</span>${s.label}</button>`;
          })
          .join("");

        sc.addEventListener("click", (e) => {
          const btn = e.target.closest("button[data-scenario]");
          if (!btn) return;
          dialogState.scenario = btn.getAttribute("data-scenario");
          renderDialogScenarios(); // update desktop too
          // update mobile too
          rebindMobileSettings("dialog");
        });
      }

      if (lvl) {
        lvl.addEventListener("click", (e) => {
          const btn = e.target.closest("button[data-level]");
          if (!btn) return;
          dialogState.level = btn.getAttribute("data-level");
          setChipActive(dialogLevel, "data-level", dialogState.level);
          // update cloned
          setChipActive(lvl, "data-level", dialogState.level);
        });
      }

      if (tone) {
        tone.addEventListener("click", (e) => {
          const btn = e.target.closest("button[data-tone]");
          if (!btn) return;
          dialogState.tone = btn.getAttribute("data-tone");
          setChipActive(dialogTone, "data-tone", dialogState.tone);
          setChipActive(tone, "data-tone", dialogState.tone);
        });
      }

      if (start) {
        start.addEventListener("click", () => {
          dialogStartBtn && dialogStartBtn.click(); // trigger main handler
          closeMobileSettings();
        });
      }

      // sync active classes
      if (lvl) setChipActive(lvl, "data-level", dialogState.level);
      if (tone) setChipActive(tone, "data-tone", dialogState.tone);
    }

    if (fromMode === "tutor") {
      // For tutor, easiest: just open menu works visually but we keep desktop select as source of truth
      const trigger = $("#lessonTrigger", mobileSettingsBody);
      const menu = $("#lessonMenu", mobileSettingsBody);
      const value = $("#lessonValue", mobileSettingsBody);

      if (value) value.textContent = lessonValue ? lessonValue.textContent : value.textContent;

      if (menu) {
        menu.innerHTML = lessons
          .map((l) => {
            const active = l.value === tutorState.lesson ? "select__item select__item--active" : "select__item";
            return `<button class="${active}" type="button" role="option" data-lesson="${l.value}">${escapeHtml(l.label)}</button>`;
          })
          .join("");
      }

      if (trigger && menu) {
        trigger.addEventListener("click", () => {
          menu.classList.toggle("select__menu--open");
        });
      }

      if (menu) {
        menu.addEventListener("click", (e) => {
          const btn = e.target.closest("button[data-lesson]");
          if (!btn) return;
          const v = btn.getAttribute("data-lesson");
          tutorState.lesson = v;
          renderLessons();
          updateLessonLabel();
          tutorUpdateUI();

          // update mobile UI
          if (value) value.textContent = lessons.find((x) => x.value === v)?.label || value.textContent;
          $$(".select__item", menu).forEach((b) => b.classList.toggle("select__item--active", b.getAttribute("data-lesson") === v));
          menu.classList.remove("select__menu--open");

          toast("Урок выбран");
        });
      }
    }
  }

  mobileSettingsBackdrop && mobileSettingsBackdrop.addEventListener("click", closeMobileSettings);
  mobileSettingsCloseBtn && mobileSettingsCloseBtn.addEventListener("click", closeMobileSettings);

  dialogMobileSettingsBtn && dialogMobileSettingsBtn.addEventListener("click", () => openMobileSettings("dialog"));
  tutorMobileSettingsBtn && tutorMobileSettingsBtn.addEventListener("click", () => openMobileSettings("tutor"));

  // -----------------------------
  // Initial route
  // -----------------------------
  showView(getRoute());

  // initial UI sync
  sentenceUpdateUI();
  dialogUpdateUI();
  tutorUpdateUI();
})();