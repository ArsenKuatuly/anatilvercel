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

    kz: {
      htmlLang: 'kk',
      title: 'AnaTil',
      description: 'AnaTil — қазақ тілін үйренуге арналған сабақтар мен AI практикасы бар платформа.',
      navAria: 'Негізгі навигация',
      menuAria: 'Мәзірді ашу',
      navLinks: ['Платформа туралы', 'Бұл қалай жұмыс істейді', 'AI мүмкіндіктері', 'Деңгейлер', 'FAQ'],
      headerButtons: ['Кіру', 'Оқуды бастау'],
      mobileButtons: ['Кіру', 'Оқуды бастау'],
      heroTitle: 'Қазақ тілін үйреніп, сенімді сөйлей баста',
      heroSubtitle: 'Қадамдық сабақтар, практика, деңгей анықтау және кез келген уақытта жаттығуға көмектесетін AI-көмекші.',
      heroButtons: ['Оқуды бастау', 'Аккаунтқа кіру'],
      heroBenefits: ['A1–C1 деңгейлері бойынша сабақтар', 'Кез келген уақытта AI-мен диалогтар', 'Сауаттылықты тексеру және қателерді түсіндіру', 'Сабақ бойынша AI-репетитор'],
      mockupLesson: '5-сабақ: Танысу',
      mockupOnline: 'Онлайн',
      mockupTranslation: 'Сәлеметсіз бе! Менің атым Айдар.',
      mockupHintLabel: 'AI-кеңес',
      mockupHintText: 'Үйренген сөйлемді қолданып, өзіңізді таныстырып көріңіз',
      mockupProgress: 'Сабақ прогресі',
      section1Title: 'Неліктен AnaTil',
      section1Text: 'Практика мен AI технологияларға басымдық беретін қазақ тілін үйренуге арналған заманауи платформа',
      featureTitles: ['Деңгейден деңгейге ыңғайлы жол', 'Артық жүктемесіз түсінікті сабақтар', 'Тек теория емес, нағыз практика', 'Кез келген уақытта жаттығуға болады', 'Орыс тілді қолданушылар үшін', 'Күнделікті оқуға арналған интерфейс'],
      featureTexts: ['A1-ден C1-ге дейінгі оқу құрылымы түсінікті және біртіндеп күрделенеді', 'Ақпарат шағын бөліктермен және практикалық мысалдармен беріледі', 'AI-мен диалогтарда жаттығып, білімді шынайы жағдайларда қолданасыз', 'Өзіңізге ыңғайлы қарқынмен оқыңыз, AI-көмекші 24/7 қолжетімді', 'Барлық түсіндірмелер орыс тілді аудиторияның ерекшеліктерін ескере отырып жасалған', 'Қарапайым әрі түсінікті интерфейс күн сайын оқуға көмектеседі'],
      section2Title: 'Оқу қалай өтеді',
      section2Text: 'Тіркелуден бастап тілді сенімді меңгеруге дейінгі қарапайым әрі түсінікті жол',
      stepTitles: ['Тіркелесіз немесе кіресіз', 'Деңгейді анықтайсыз немесе нөлден бастайсыз', 'Өз деңгейіңізге сай сабақтарды өтесіз', 'AI-мен практика жасайсыз'],
      stepTexts: ['Бірнеше секундта аккаунт ашып, оқуды бастаңыз', 'Қысқа тесттен өтіңіз немесе A1 деңгейінен бастаңыз', 'Нақты құрылымы бар бағдарлама бойынша біртіндеп алға жылжыңыз', 'Диалогтар, сөйлем тексеру және жеке репетитор көмегі'],
      aiBadge: 'Жасанды интеллект',
      aiTitle: 'Платформаның AI мүмкіндіктері',
      aiText: 'Тек теория емес, тірі практика және оқудағы жеке көмек',
      aiCardTitles: ['Сөйлемді тексеру', 'AI-мен диалогтар', 'AI-репетитор'],
      aiCardTexts: [
        'Пайдаланушы қазақша сөйлем жазады, ал жүйе қателерді түзетіп, ережені түсіндіреді және дұрыс нұсқаны көрсетеді.',
        'Пайдаланушы кез келген уақытта шынайы жағдайларда сөйлесу қазақ тілін жаттықтыра алады: танысу, дүкен, кафе, жұмыс, оқу.',
        'AI сабақ тақырыбы бойынша көмектеседі, түсініксіз жерлерді түсіндіреді, сұрақтар қояды және материалды бекітуге жәрдемдеседі.'
      ],
      aiExampleLabels: ['Сіздің нұсқаңыз:', 'Дұрысы:'],
      aiExampleWrong: 'Мен университетке барам',
      aiExampleCorrect: 'Мен университетке барамын',
      aiExampleFooter: 'Жіктік формадағы етістікке -мын/-мін жалғауын қосу керек',
      aiTags: ['Танысу', 'Дүкенде', 'Кафеде', 'Жұмыста', 'Оқуда'],
      aiDots: ['Ережелерді түсіндіреді', 'Сұрақтарға жауап береді', 'Практикаға көмектеседі'],
      levelsBadge: 'Оқу жүйесі',
      levelsTitle: 'Сізге лайық деңгейден бастаңыз',
      levelsText: 'Платформада қазақ тілін үйренуге арналған бірнеше деңгей бар: бастауыштан сенімді сөйлеуге дейін',
      levelTitles: ['A1 — Элементар деңгей', 'A2 — Базалық деңгей', 'B1 — Орта деңгей', 'B2 — Ортадан жоғары деңгей', 'C1 — Жоғары деңгей'],
      levelTexts: ['Қарапайым сөздер, танысу, күнделікті тіркестер', 'Негізгі сөйлемдер, күнделікті тақырыптар, қысқа диалогтар', 'Еркінірек сөйлеу, ойды жеткізу, кеңейтілген грамматика', 'Сенімді диалогтар, күрделі тақырыптар, тілдік икемділік', 'Еркін сөйлеу, терең түсіну, академиялық және кәсіби тіл'],
      levelMeta: ['Бастау', 'Негіз', 'Орта', 'Сенімді', 'Еркін'],
      levelsCtaTitle: 'Қай деңгейден бастау керегін білмейсіз бе?',
      levelsCtaText: 'Қысқа тесттен өтіп, деңгейіңізді анықтаңыз немесе A1-ден бастаңыз',
      levelsCtaButton: 'Деңгейді анықтау',
      audienceTitle: 'Платформа кімдерге арналған',
      audienceText: 'AnaTil — қазақ тілін үйреніп, сенімді сөйлегісі келетіндердің бәріне арналған',
      audienceCardTitles: ['Нөлден бастайтындар үшін', 'Орыс тілді оқушылар үшін', 'Түсінеді, бірақ сөйлеуге қысылады', 'Көбірек практика қалайтындар үшін'],
      audienceCardTexts: ['Егер сіз бұрын қазақ тілін мүлде оқымаған болсаңыз да, бағдарлама толық бастауыштарға лайық', 'Барлық түсіндірмелер орыс тілінен қазақ тіліне өтетіндерге бейімделген', 'Қателесуден немесе ұялудан қорықпай, AI-мен қауіпсіз ортада жаттығыңыз', 'Тек теория емес, AI көмекшісімен тұрақты сөйлесу практикасы'],
      faqTitle: 'Жиі қойылатын сұрақтар',
      faqText: 'AnaTil платформасы туралы ең жиі қойылатын сұрақтарға жауаптар',
      faqQuestions: ['Егер мен қазақ тілін білмесем, бұл маған сай ма?', 'Нөлден бастауға бола ма?', 'Менің деңгейім қалай анықталады?', 'AI оқуға қалай көмектеседі?', 'Кез келген уақытта оқи аламын ба?', 'Сөйлеу практикасы бар ма?'],
      faqAnswers: [
        'Иә, AnaTil мүлде жаңадан бастайтындарға да сай келеді. Сіз A1 деңгейінен бастап, негізгі сөз тіркестері мен тілдің іргетасын үйрене аласыз. Барлық түсіндірмелер орыс тілінде беріледі.',
        'Әрине. Бағдарлама жаңадан бастағандар қазақ тілін ең қарапайым деңгейден бастай алатындай жасалған. A1 деңгейінің алғашқы сабақтары алдын ала білімді талап етпейді.',
        'Тіркелу кезінде қысқа тесттен өтіп, қазақ тілі деңгейіңізді анықтай аласыз. Нәтижеге қарай жүйе сізге ең қолайлы оқу жолын ұсынады. Қаласаңыз, A1 деңгейінен де бастай аласыз.',
        'AnaTil-дегі AI-көмекші үш негізгі қызмет атқарады: сөйлемдеріңізді тексеріп, қателерді түсіндіреді; түрлі тақырыптарда диалогтар жүргізіп, сөйлеу практикасын береді; және сабақ бойынша сұрақтарға жауап беретін жеке репетитор ретінде көмектеседі.',
        'Иә, платформа тәулік бойы қолжетімді. Сіз өзіңізге ыңғайлы уақытта оқи аласыз, ал AI-көмекші әрқашан практика мен сұрақтарға көмектесуге дайын.',
        'Иә, бұл AnaTil-дің басты артықшылықтарының бірі. Сіз танысу, дүкен, кафе, жұмыс немесе оқу сияқты түрлі жағдайларда AI-мен қазақша сөйлеу практикасын жасай аласыз. AI шынайы диалогтар құрып, тілдік кедергіні жеңуге көмектеседі.'
      ],
      faqSupportText: 'Қажетті жауабыңызды таппадыңыз ба?',
      faqSupportButton: 'Қолдауға жазу',
      finalBadge: 'Дәл қазір бастаңыз',
      finalTitle: 'Қазақ тілін бүгіннен бастап үйреніңіз',
      finalText: 'Тіркеліңіз, деңгейіңізді анықтаңыз және бірден сабақтар мен AI практикасына өтіңіз',
      finalButtons: ['Оқуды бастау', 'Кіру'],
      finalBenefits: ['24/7 қолжетімділік', 'AI көмекші', 'Барлық деңгейлер'],
      footerDescription: 'AI құралдары бар қазақ тілін үйренуге арналған заманауи платформа',
      footerTitles: ['Платформа', 'Көмек', 'Аккаунт'],
      footerPlatformLinks: ['Платформа туралы', 'Қалай жұмыс істейді', 'AI мүмкіндіктері', 'Деңгейлер'],
      footerHelpLinks: ['FAQ', 'Қолдау', 'Байланыс'],
      footerAccountLinks: ['Кіру', 'Тіркелу'],
      footerCopyright: '© 2026 AnaTil. Барлық құқықтар қорғалған.',
      footerBottomLinks: ['Құпиялық саясаты', 'Пайдалану шарттары']
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
    document.querySelectorAll('.lang-toggle__value').forEach(function (value) {
      value.textContent = lang === 'kz' ? 'KZ' : 'RU';
    });

    localStorage.setItem('anatil-home-lang', lang);
  }

  const langButtons = document.querySelectorAll('.lang-toggle');
  langButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      const current = localStorage.getItem('anatil-home-lang') === 'kz' ? 'kz' : 'ru';
      const next = current === 'ru' ? 'kz' : 'ru';
      applyLanguage(next);
    });
  });

  const savedLang = localStorage.getItem('anatil-home-lang');
  applyLanguage(savedLang === 'kz' ? 'kz' : 'ru');

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
