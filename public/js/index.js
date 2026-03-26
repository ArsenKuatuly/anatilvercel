(function () {
  const body = document.body;
  const menuButton = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileOverlay = document.querySelector('.mobile-overlay');
  const mobileLinks = document.querySelectorAll('.mobile-menu__link');

  function openMenu() {
    if (!menuButton || !mobileMenu || !mobileOverlay) return;
    mobileMenu.hidden = false;
    mobileOverlay.hidden = false;
    menuButton.classList.add('is-open');
    menuButton.setAttribute('aria-expanded', 'true');
    body.classList.add('is-menu-open');
  }

  function closeMenu() {
    if (!menuButton || !mobileMenu || !mobileOverlay) return;
    mobileMenu.hidden = true;
    mobileOverlay.hidden = true;
    menuButton.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    body.classList.remove('is-menu-open');
  }

  if (menuButton) {
    menuButton.addEventListener('click', function () {
      if (mobileMenu.hidden) openMenu();
      else closeMenu();
    });
  }

  if (mobileOverlay) mobileOverlay.addEventListener('click', closeMenu);
  mobileLinks.forEach(function (link) { link.addEventListener('click', closeMenu); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1024) closeMenu(); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeMenu(); });

  const translations = {
    ru: {
      htmlLang: 'ru',
      title: 'AnaTil',
      description: 'AnaTil — платформа для изучения казахского языка с уроками и AI-практикой.',
      navAria: 'Основная навигация',
      menuAria: 'Открыть меню',
      navLinks: ['О платформе', 'Как это работает', 'Возможности AI', 'Уровни', 'FAQ'],
      headerButtons: ['Войти', 'Начать обучение'],
      mobileButtons: ['Войти', 'Начать обучение'],
      heroTitle: 'Изучай казахский язык и начни говорить уверенно',
      heroSubtitle: 'Пошаговые уроки, практика, проверка уровня и AI-помощник, который помогает тренироваться в любое время.',
      heroButtons: ['Начать обучение', 'Войти в аккаунт'],
      heroBenefits: ['Уроки по уровням A1–C1', 'Диалоги с ИИ в любое время', 'Проверка грамотности и объяснение ошибок', 'AI-репетитор по уроку'],
      mockupLesson: 'Урок 5: Знакомство',
      mockupOnline: 'Онлайн',
      mockupTranslation: 'Здравствуйте! Меня зовут Айдар.',
      mockupHintLabel: 'AI-подсказка',
      mockupHintText: 'Попробуйте представиться, используя изученную фразу',
      mockupProgress: 'Прогресс урока',
      section1Title: 'Почему AnaTil',
      section1Text: 'Современная платформа для изучения казахского языка с акцентом на практику и AI-технологии',
      featureTitles: ['Удобный путь от уровня к уровню', 'Понятные уроки без перегруза', 'Практика не только через теорию', 'Можно тренироваться в любое время', 'Для русскоязычных пользователей', 'Интерфейс для ежедневного обучения'],
      featureTexts: ['Понятная структура обучения от A1 до C1 с постепенным усложнением', 'Информация подается небольшими порциями с практическими примерами', 'Тренируйтесь в диалогах с AI и применяйте знания в реальных ситуациях', 'Учитесь в удобном темпе, AI-помощник доступен 24/7', 'Все объяснения на русском языке с учетом особенностей восприятия', 'Простой и понятный интерфейс, в котором легко учиться каждый день'],
      section2Title: 'Как проходит обучение',
      section2Text: 'Простой и понятный путь от регистрации до уверенного владения языком',
      stepTitles: ['Регистрируешься или входишь', 'Проходишь определение уровня или начинаешь с нуля', 'Изучаешь уроки своего уровня', 'Практикуешься с AI'],
      stepTexts: ['Создайте аккаунт за несколько секунд и начните обучение', 'Пройдите короткий тест или начните с уровня A1', 'Постепенно двигайтесь по программе с четкой структурой', 'Диалоги, проверка предложений и персональная помощь репетитора'],
      aiBadge: 'Искусственный интеллект',
      aiTitle: 'AI-возможности платформы',
      aiText: 'Не просто теория, а живая практика и персональная помощь в обучении',
      aiCardTitles: ['Проверка предложения', 'Диалоги с ИИ', 'AI-репетитор'],
      aiCardTexts: [
        'Пользователь пишет фразу на казахском, а система исправляет ошибки, объясняет правило и показывает правильный вариант.',
        'Пользователь может в любое время тренировать разговорный казахский в реальных ситуациях: знакомство, магазин, кафе, работа, учеба.',
        'ИИ помогает по теме урока, объясняет непонятные места, задает вопросы и помогает закрепить материал.'
      ],
      aiExampleLabels: ['Ваш вариант:', 'Правильно:'],
      aiExampleWrong: 'Мен университетке барам',
      aiExampleCorrect: 'Мен университетке барамын',
      aiExampleFooter: 'В личных формах глагола нужно добавить окончание -мын/-мін',
      aiTags: ['Знакомство', 'В магазине', 'В кафе', 'На работе', 'В учебе'],
      aiDots: ['Объясняет правила', 'Отвечает на вопросы', 'Помогает с практикой'],
      levelsBadge: 'От простого к сложному',
      levelsTitle: 'Уровни обучения',
      levelsText: 'Четкая система уровней от базового до продвинутого владения казахским языком',
      levelTitles: ['Элементарный', 'Базовый', 'Средний', 'Выше среднего', 'Продвинутый'],
      levelTexts: ['Базовые фразы, приветствия, простые диалоги о себе и повседневной жизни', 'Общение на знакомые темы, описание событий, планов и повседневных ситуаций', 'Понимание текстов на разные темы, выражение мнения, описание опыта', 'Свободное общение на сложные темы, понимание технических текстов', 'Уверенное владение языком, понимание сложных текстов, свободное выражение мыслей'],
      levelMeta: ['1 из 5', '2 из 5', '3 из 5', '4 из 5', '5 из 5'],
      levelsCtaTitle: 'Не знаете свой уровень?',
      levelsCtaText: 'Пройдите короткий тест на определение уровня или начните с A1',
      levelsCtaButton: 'Определить уровень',
      audienceTitle: 'Для кого платформа',
      audienceText: 'AnaTil создан для всех, кто хочет освоить казахский язык и говорить уверенно',
      audienceCardTitles: ['Для тех, кто хочет начать с нуля', 'Для русскоязычных пользователей', 'Для тех, кто понимает, но стесняется говорить', 'Для тех, кто хочет больше практики'],
      audienceCardTexts: ['Даже если вы никогда не учили казахский, наша программа подходит для абсолютных новичков', 'Все объяснения на русском языке с учетом особенностей перехода с русского на казахский', 'Практикуйтесь в безопасной среде с AI без страха ошибок и стеснения', 'Не только теория, но и постоянная разговорная практика с AI-помощником'],
      faqTitle: 'Часто задаваемые вопросы',
      faqText: 'Ответы на популярные вопросы о платформе AnaTil',
      faqQuestions: ['Подойдет ли мне, если я не знаю казахский?', 'Можно ли начать с нуля?', 'Как определяется уровень?', 'Чем AI помогает в обучении?', 'Можно ли заниматься в любое время?', 'Есть ли практика разговорной речи?'],
      faqAnswers: [
        'Да, платформа AnaTil подходит для абсолютных новичков. Вы можете начать с уровня A1, где изучаются базовые фразы и основы языка. Все объяснения даются на русском языке.',
        'Конечно! Наша программа разработана так, чтобы начинающие могли легко освоить казахский язык с самых основ. Первые уроки уровня A1 не требуют никаких предварительных знаний.',
        'При регистрации вы можете пройти короткий тест на определение уровня владения казахским языком. По результатам теста система подберет подходящую программу обучения. Также вы можете начать с уровня A1, если не уверены в своих знаниях.',
        'AI-помощник в AnaTil выполняет три основные функции: проверяет ваши предложения и объясняет ошибки, проводит диалоги на различные темы для практики разговорного языка, и работает как персональный репетитор, отвечая на вопросы по урокам.',
        'Да, платформа доступна 24/7. Вы можете учиться в удобное для вас время, а AI-помощник всегда готов помочь с практикой и ответить на ваши вопросы.',
        'Да, это одна из ключевых особенностей AnaTil. Вы можете практиковать разговорный казахский в диалогах с AI в различных ситуациях: знакомство, общение в магазине, кафе, на работе или в учебе. AI создает реалистичные диалоги и помогает преодолеть языковой барьер.'
      ],
      faqSupportText: 'Не нашли ответ на свой вопрос?',
      faqSupportButton: 'Связаться с поддержкой',
      finalBadge: 'Начните прямо сейчас',
      finalTitle: 'Начни изучать казахский уже сейчас',
      finalText: 'Зарегистрируйся, определи свой уровень и переходи к урокам и AI-практике',
      finalButtons: ['Начать обучение', 'Войти'],
      finalBenefits: ['Доступ 24/7', 'AI-помощник', 'Для всех уровней'],
      footerDescription: 'Современная платформа для изучения казахского языка с AI-технологиями',
      footerTitles: ['Платформа', 'Помощь', 'Аккаунт'],
      footerPlatformLinks: ['О платформе', 'Как это работает', 'Возможности AI', 'Уровни'],
      footerHelpLinks: ['FAQ', 'Поддержка', 'Контакты'],
      footerAccountLinks: ['Войти', 'Регистрация'],
      footerCopyright: '© 2026 AnaTil. Все права защищены.',
      footerBottomLinks: ['Политика конфиденциальности', 'Условия использования']
    },
    en: {
      htmlLang: 'en',
      title: 'AnaTil',
      description: 'AnaTil is a platform for learning Kazakh with lessons and AI practice.',
      navAria: 'Main navigation',
      menuAria: 'Open menu',
      navLinks: ['About', 'How it works', 'AI features', 'Levels', 'FAQ'],
      headerButtons: ['Log in', 'Start learning'],
      mobileButtons: ['Log in', 'Start learning'],
      heroTitle: 'Learn Kazakh and start speaking with confidence',
      heroSubtitle: 'Step-by-step lessons, practice, level assessment, and an AI assistant that helps you train anytime.',
      heroButtons: ['Start learning', 'Log in to account'],
      heroBenefits: ['Lessons from A1 to C1', 'AI dialogues anytime', 'Grammar checks with explanations', 'AI tutor for each lesson'],
      mockupLesson: 'Lesson 5: Introduction',
      mockupOnline: 'Online',
      mockupTranslation: 'Hello! My name is Aidar.',
      mockupHintLabel: 'AI hint',
      mockupHintText: 'Try introducing yourself using the phrase you just learned',
      mockupProgress: 'Lesson progress',
      section1Title: 'Why AnaTil',
      section1Text: 'A modern platform for learning Kazakh with a strong focus on practice and AI tools',
      featureTitles: ['A clear path from one level to the next', 'Simple lessons without overload', 'Practice beyond theory', 'Train anytime you want', 'Built for Russian-speaking learners', 'An interface for everyday learning'],
      featureTexts: ['A structured learning path from A1 to C1 with gradual difficulty', 'The material is delivered in small portions with practical examples', 'Practice in AI dialogues and apply your knowledge in real-life situations', 'Study at your own pace with an AI assistant available 24/7', 'All explanations are adapted for Russian-speaking learners', 'A clean and easy interface that makes daily learning comfortable'],
      section2Title: 'How learning works',
      section2Text: 'A simple and clear path from sign-up to confident language use',
      stepTitles: ['Sign up or log in', 'Take a level assessment or start from zero', 'Study lessons for your level', 'Practice with AI'],
      stepTexts: ['Create an account in seconds and begin learning', 'Take a short test or start right away from A1', 'Move through the program step by step with a clear structure', 'Use dialogues, sentence checks, and personal tutor support'],
      aiBadge: 'Artificial intelligence',
      aiTitle: 'AI features of the platform',
      aiText: 'Not just theory, but live practice and personal support throughout your learning',
      aiCardTitles: ['Sentence check', 'AI dialogues', 'AI tutor'],
      aiCardTexts: [
        'The learner writes a phrase in Kazakh, and the system corrects mistakes, explains the rule, and shows the proper version.',
        'The learner can practice spoken Kazakh anytime in real-life situations: introductions, shopping, cafés, work, and study.',
        'The AI helps with the current lesson topic, explains difficult parts, asks questions, and helps reinforce the material.'
      ],
      aiExampleLabels: ['Your version:', 'Correct:'],
      aiExampleWrong: 'Мен университетке барам',
      aiExampleCorrect: 'Мен университетке барамын',
      aiExampleFooter: 'In personal verb forms, you need to add the ending -мын/-мін',
      aiTags: ['Introduction', 'Shopping', 'At a café', 'At work', 'At school'],
      aiDots: ['Explains rules', 'Answers questions', 'Helps with practice'],
      levelsBadge: 'From simple to advanced',
      levelsTitle: 'Learning levels',
      levelsText: 'A clear level system from basic to advanced Kazakh proficiency',
      levelTitles: ['Elementary', 'Basic', 'Intermediate', 'Upper-intermediate', 'Advanced'],
      levelTexts: ['Basic phrases, greetings, and simple dialogues about yourself and daily life', 'Communication on familiar topics, describing events, plans, and daily situations', 'Understanding texts on different topics, expressing opinions, and describing experience', 'Freer communication on complex topics and understanding more technical texts', 'Confident language use, understanding complex texts, and expressing thoughts fluently'],
      levelMeta: ['1 of 5', '2 of 5', '3 of 5', '4 of 5', '5 of 5'],
      levelsCtaTitle: 'Not sure about your level?',
      levelsCtaText: 'Take a short placement test or start from A1',
      levelsCtaButton: 'Find my level',
      audienceTitle: 'Who the platform is for',
      audienceText: 'AnaTil is built for everyone who wants to learn Kazakh and speak with confidence',
      audienceCardTitles: ['For learners starting from zero', 'For Russian-speaking learners', 'For those who understand but feel shy to speak', 'For those who want more practice'],
      audienceCardTexts: ['Even if you have never studied Kazakh before, the program is suitable for complete beginners', 'All explanations are adapted for learners transitioning from Russian to Kazakh', 'Practice in a safe environment with AI, without fear of mistakes or embarrassment', 'Not only theory, but constant speaking practice with an AI assistant'],
      faqTitle: 'Frequently asked questions',
      faqText: 'Answers to common questions about the AnaTil platform',
      faqQuestions: ['Is it suitable if I do not know Kazakh?', 'Can I start from zero?', 'How is my level determined?', 'How does AI help in learning?', 'Can I study at any time?', 'Is there speaking practice?'],
      faqAnswers: [
        'Yes, AnaTil is suitable for complete beginners. You can start from A1, where you learn basic phrases and the foundations of the language. All explanations are provided in Russian.',
        'Absolutely. The program is designed so that beginners can start learning Kazakh from the very basics. The first A1 lessons do not require any prior knowledge.',
        'During registration, you can take a short placement test to determine your Kazakh level. Based on the results, the system will suggest the most suitable learning path. You can also start from A1 if you are unsure.',
        'The AI assistant in AnaTil performs three main functions: it checks your sentences and explains mistakes, runs dialogues on different topics for speaking practice, and acts as a personal tutor by answering lesson-related questions.',
        'Yes, the platform is available 24/7. You can study whenever it is convenient for you, and the AI assistant is always ready to help with practice and questions.',
        'Yes, this is one of AnaTil’s key strengths. You can practice spoken Kazakh in AI dialogues across different situations: introductions, shopping, cafés, work, or study. The AI creates realistic dialogues and helps you overcome the language barrier.'
      ],
      faqSupportText: 'Did not find the answer you need?',
      faqSupportButton: 'Contact support',
      finalBadge: 'Start right now',
      finalTitle: 'Start learning Kazakh today',
      finalText: 'Sign up, find your level, and move straight to lessons and AI practice',
      finalButtons: ['Start learning', 'Log in'],
      finalBenefits: ['24/7 access', 'AI assistant', 'All levels'],
      footerDescription: 'A modern platform for learning Kazakh with AI-powered tools',
      footerTitles: ['Platform', 'Help', 'Account'],
      footerPlatformLinks: ['About', 'How it works', 'AI features', 'Levels'],
      footerHelpLinks: ['FAQ', 'Support', 'Contacts'],
      footerAccountLinks: ['Log in', 'Sign up'],
      footerCopyright: '© 2026 AnaTil. All rights reserved.',
      footerBottomLinks: ['Privacy policy', 'Terms of use']
    }
  };

  function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function setTextAll(selector, values) {
    const nodes = document.querySelectorAll(selector);
    nodes.forEach(function (node, index) {
      if (typeof values[index] !== 'undefined') node.textContent = values[index];
    });
  }

  function applyLanguage(lang) {
    const dict = translations[lang] || translations.ru;

    document.documentElement.lang = dict.htmlLang;
    document.title = dict.title;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', dict.description);

    const nav = document.querySelector('.site-header__nav');
    if (nav) nav.setAttribute('aria-label', dict.navAria);
    if (menuButton) menuButton.setAttribute('aria-label', dict.menuAria);

    setTextAll('.site-header__nav-link', dict.navLinks);
    setTextAll('.mobile-menu__link', dict.navLinks);
    setTextAll('.site-header__actions .button', dict.headerButtons);
    setTextAll('.mobile-menu__buttons .button', dict.mobileButtons);

    setText('.hero__title', dict.heroTitle);
    setText('.hero__subtitle', dict.heroSubtitle);
    setTextAll('.hero__buttons .button', dict.heroButtons);
    setTextAll('.hero-benefit__text', dict.heroBenefits);

    setText('.mockup-card__lesson-title', dict.mockupLesson);
    setText('.mockup-card__status span:last-child', dict.mockupOnline);
    setText('.mockup-message__translation', dict.mockupTranslation);
    setText('.mockup-tip__label', dict.mockupHintLabel);
    setText('.mockup-tip__text', dict.mockupHintText);
    setText('.mockup-progress__top span:first-child', dict.mockupProgress);

    setText('#about .section-heading__title', dict.section1Title);
    setText('#about .section-heading__text', dict.section1Text);
    setTextAll('.feature-card__title', dict.featureTitles);
    setTextAll('.feature-card__text', dict.featureTexts);

    setText('#how-it-works .section-heading__title', dict.section2Title);
    setText('#how-it-works .section-heading__text', dict.section2Text);
    setTextAll('.step-card__title', dict.stepTitles);
    setTextAll('.step-card__text', dict.stepTexts);

    setText('#ai-features .section-badge span', dict.aiBadge);
    setText('#ai-features .section-heading__title', dict.aiTitle);
    setText('#ai-features .section-heading__text', dict.aiText);
    setTextAll('.ai-card__title', dict.aiCardTitles);
    setTextAll('.ai-card__text', dict.aiCardTexts);
    setTextAll('.ai-example__label', dict.aiExampleLabels);
    setText('.ai-example__wrong', dict.aiExampleWrong);
    setText('.ai-example__correct', dict.aiExampleCorrect);
    setText('.ai-example__footer p', dict.aiExampleFooter);
    setTextAll('.tag', dict.aiTags);
    setTextAll('.dot-list__item span:last-child', dict.aiDots);

    setText('#levels .section-badge span', dict.levelsBadge);
    setText('#levels .section-heading__title', dict.levelsTitle);
    setText('#levels .section-heading__text', dict.levelsText);
    setTextAll('.level-card__title', dict.levelTitles);
    setTextAll('.level-card__text', dict.levelTexts);
    setTextAll('.level-card__meta', dict.levelMeta);
    setText('.levels-cta__title', dict.levelsCtaTitle);
    setText('.levels-cta__text', dict.levelsCtaText);
    setText('.levels-cta .button', dict.levelsCtaButton);

    const sectionHeadings = document.querySelectorAll('.section-heading__title');
    const sectionTexts = document.querySelectorAll('.section-heading__text');
    if (sectionHeadings[4]) sectionHeadings[4].textContent = dict.audienceTitle;
    if (sectionTexts[4]) sectionTexts[4].textContent = dict.audienceText;
    setTextAll('.audience-card__title', dict.audienceCardTitles);
    setTextAll('.audience-card__text', dict.audienceCardTexts);

    setText('#faq .section-heading__title', dict.faqTitle);
    setText('#faq .section-heading__text', dict.faqText);
    document.querySelectorAll('.faq-item').forEach(function (item, index) {
      const question = item.querySelector('.faq-item__button span:first-child');
      const answer = item.querySelector('.faq-item__content p');
      if (question && typeof dict.faqQuestions[index] !== 'undefined') question.textContent = dict.faqQuestions[index];
      if (answer && typeof dict.faqAnswers[index] !== 'undefined') answer.textContent = dict.faqAnswers[index];
    });
    setText('.faq-support__text', dict.faqSupportText);
    setText('.faq-support .button', dict.faqSupportButton);

    setText('.final-cta .section-badge span', dict.finalBadge);
    setText('.final-cta__title', dict.finalTitle);
    setText('.final-cta__text', dict.finalText);
    document.querySelectorAll('.final-cta__buttons .button').forEach(function (button, index) {
      const arrow = button.querySelector('.button__arrow');
      if (arrow) {
        button.childNodes[0].textContent = dict.finalButtons[index] + ' ';
      } else if (typeof dict.finalButtons[index] !== 'undefined') {
        button.textContent = dict.finalButtons[index];
      }
    });
    setTextAll('.final-cta__benefit span:last-child', dict.finalBenefits);

    setText('.site-footer__description', dict.footerDescription);
    setTextAll('.site-footer__title', dict.footerTitles);
    setTextAll('.site-footer__column:nth-child(2) .site-footer__link', dict.footerPlatformLinks);
    setTextAll('.site-footer__column:nth-child(3) .site-footer__link', dict.footerHelpLinks);
    setTextAll('.site-footer__column:nth-child(4) .site-footer__link', dict.footerAccountLinks);
    setText('.site-footer__copyright', dict.footerCopyright);
    setTextAll('.site-footer__bottom-link', dict.footerBottomLinks);

    document.querySelectorAll('[data-lang-option]').forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-lang-option') === lang);
    });

    localStorage.setItem('anatil-home-lang', lang);
  }

  const langButtons = document.querySelectorAll('[data-lang-option]');
  langButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      applyLanguage(button.getAttribute('data-lang-option'));
    });
  });

  const savedLang = localStorage.getItem('anatil-home-lang');
  applyLanguage(savedLang === 'en' ? 'en' : 'ru');

  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    const button = item.querySelector('.faq-item__button');
    if (!button) return;
    button.addEventListener('click', function () {
      const isOpen = item.classList.contains('is-open');
      faqItems.forEach(function (other) { other.classList.remove('is-open'); });
      if (!isOpen) item.classList.add('is-open');
    });
  });
})();
