(function(){

// НЕ ТРОГАЕМ ТВОЙ ОРИГИНАЛЬНЫЙ КОД ВЫШЕ 👆
// добавляем только безопасный override startConversation

    const originalStartConversation = startConversation;

    startConversation = async function(){
        applyOptionsFromUi();
        setScreen('conversation');
        updateSupportContent();

        state.paused = false;
        state.messages = [];
        state.sessionId = null;
        state.startedAt = Date.now();
        state.transcriptCount = 0;
        state.lastCorrection = null;

        pauseBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"></path></svg>';

        await startAiSession();

        let welcomeText = '';

        if (state.scenario === 'intro') {
            if (state.level === 'A1') welcomeText = 'Сәлеметсіз бе! Сіздің атыңыз кім?';
            else if (state.level === 'A2') welcomeText = 'Сәлем! Өзіңіз туралы қысқаша айтып беріңізші.';
            else welcomeText = 'Сәлем! Өзіңізді таныстырып, немен айналысатыныңызды айтып беріңізші.';
        }

        else if (state.scenario === 'cafe') {
            if (state.level === 'A1') welcomeText = 'Сәлеметсіз бе! Не қалайсыз?';
            else if (state.level === 'A2') welcomeText = 'Сәлеметсіз бе! Не ішесіз немесе жейсіз?';
            else welcomeText = 'Сәлеметсіз бе! Бүгін не тапсырыс бергіңіз келеді?';
        }

        else if (state.scenario === 'shop') {
            if (state.level === 'A1') welcomeText = 'Сәлеметсіз бе! Сізге не керек?';
            else if (state.level === 'A2') welcomeText = 'Сәлем! Қандай тауар іздеп жүрсіз?';
            else welcomeText = 'Сәлеметсіз бе! Қандай зат керек екенін айта аласыз ба?';
        }

        else if (state.scenario === 'taxi') {
            if (state.level === 'A1') welcomeText = 'Сәлеметсіз бе! Қайда барасыз?';
            else if (state.level === 'A2') welcomeText = 'Сәлем! Қай мекенжайға барамыз?';
            else welcomeText = 'Сәлеметсіз бе! Қай бағытқа барамыз, мекенжайды айтыңызшы.';
        }

        else if (state.scenario === 'university') {
            if (state.level === 'A1') welcomeText = 'Сәлем! Қай пән бар?';
            else if (state.level === 'A2') welcomeText = 'Сәлем! Бүгін қандай сабақ бар?';
            else welcomeText = 'Сәлеметсіз бе! Бүгінгі сабақтар туралы айтып беріңізші.';
        }

        else if (state.scenario === 'work') {
            if (state.level === 'A1') welcomeText = 'Сәлем! Не істеп жатырсыз?';
            else if (state.level === 'A2') welcomeText = 'Сәлеметсіз бе! Қандай тапсырма орындап жатырсыз?';
            else welcomeText = 'Сәлем! Қазіргі жұмысыңыз туралы қысқаша айтып беріңізші.';
        }

        else {
            welcomeText = 'Сәлеметсіз бе! Бастайық.';
        }

        addMessage({
            sender:'ai',
            text:welcomeText,
            translation:''
        });

        setStatus('listening');

        if (SpeechRecognitionCtor && !state.recognition) {
            state.recognition = createRecognition();
        }

        await speakText(welcomeText);
    };

})();