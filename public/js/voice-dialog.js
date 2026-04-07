(function(){


    function setScenario(id){
        if (!SCENARIOS[id]) return;

        state.scenario = id;

        scenarioButtons.forEach(function(btn){
            btn.classList.toggle('is-selected', btn.dataset.scenario === id);
        });

        startDialogBtn.disabled = false;
        updateSupportContent();
    }


    function buildAiPayload(userText, action){
        const scenario = SCENARIOS[state.scenario] || SCENARIOS.intro;

        return {
            message: userText,
            action: action || 'message',
            sessionId: state.sessionId,

            // 👇 КЛЮЧЕВОЕ
            scenarioKey: state.scenario,

            scenario: scenario.title,
            level: state.level,

            history: state.messages.slice(-6).map(function(item){
                return {
                    role: item.sender === 'ai' ? 'assistant' : 'user',
                    text: item.text
                };
            })
        };
    }


    async function askAi(userText, action){
        const payload = buildAiPayload(userText, action);

        try {
            const res = await fetch('/api/ai/voice-dialog', {
                method:'POST',
                headers:{ 'Content-Type':'application/json' },
                credentials:'include',
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            return {
                text: data.assistantText || 'Кешіріңіз, қайталап айта аласыз ба?',
                correction: data.correction || {},
                translation: '',
                explanation: ''
            };

        } catch (e) {
            return {
                text: 'Кешіріңіз, байланыс қатесі.',
                correction: {},
                translation: '',
                explanation: ''
            };
        }
    }


    document.addEventListener('DOMContentLoaded', function(){
        setScenario('intro');
    });

})();