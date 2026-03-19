const { requireUser } = require("../../../lib/jwt");
const OpenAI = require("openai");

function safeJsonParse(text) {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function normalizeLevel(level) {
    const value = String(level || "").trim().toUpperCase();
    return ["A1", "A2", "B1"].includes(value) ? value : "";
}

function normalizeBoolean(value, fallback = true) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const v = value.trim().toLowerCase();
        if (v === "true") return true;
        if (v === "false") return false;
    }
    return fallback;
}

function fallbackLevel(diagnostic) {
    let score = Number(diagnostic?.totalScore || 0);

    const selfDescription = String(diagnostic?.selfDescription || "").trim().toLowerCase();
    const words = selfDescription.split(/\s+/).filter(Boolean).length;
    const hasKazakhLetters = /[әіңғүұқөһә]/i.test(selfDescription);

    if (selfDescription.length >= 20) score += 1;
    if (selfDescription.length >= 45) score += 1;
    if (hasKazakhLetters) score += 1;
    if (words >= 4) score += 1;

    if (score >= 9 && hasKazakhLetters && words >= 6) return "B1";
    if (score >= 5) return "A2";
    return "A1";
}

function fallbackReasoning(level) {
    if (level === "B1") {
        return "Пользователь понимает базовые конструкции и может связно рассказать о себе простыми предложениями.";
    }
    if (level === "A2") {
        return "Пользователь понимает часть базовых фраз и может строить простые ответы, но запас языка пока ограничен.";
    }
    return "Пользователь находится на начальном этапе и пока использует очень базовые знания казахского языка.";
}

module.exports = async (req, res) => {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({
                success: false,
                message: "Method not allowed",
            });
        }

        try {
            requireUser(req);
        } catch {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                success: false,
                message: "OPENAI_API_KEY missing",
            });
        }

        const body = req.body || {};
        const profile = body.profile || {};
        const diagnostic = body.diagnostic || {};

        const payload = {
            first_name: String(profile.first_name || "").trim(),
            last_name: String(profile.last_name || "").trim(),
            alphabet: String(diagnostic.alphabet || "").trim(),
            understanding: String(diagnostic.understanding || "").trim(),
            translation: String(diagnostic.translation || "").trim(),
            selfDescription: String(diagnostic.selfDescription || "").trim(),
            speaking: String(diagnostic.speaking || "").trim(),
            totalScore: Number(diagnostic.totalScore || 0),
        };

        if (
            !payload.alphabet ||
            !payload.understanding ||
            !payload.translation ||
            !payload.selfDescription ||
            !payload.speaking
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing required diagnostic fields",
            });
        }

        const openai = new OpenAI({
            apiKey,
            timeout: 20000,
        });

        const systemPrompt = `
Ты — эксперт по определению стартового уровня казахского языка для платформы AnaTil.

Нужно определить стартовый уровень только из:
- A1
- A2
- B1

Оценивай ответы осторожно. Не завышай уровень.
Если сомневаешься между двумя уровнями — выбирай более низкий.

Обязательно оцени:
1. Общие ответы пользователя
2. Насколько он знает алфавит
3. Насколько понимает простые фразы
4. Правильность перевода
5. Насколько уверенно он оценивает разговорную речь
6. Самое важное: текст "рассказ о себе"

Критерии:
- A1: отдельные слова, очень простые конструкции, минимальное понимание
- A2: может понять и построить простые фразы о себе, быте, учебе, повседневных темах
- B1: может более-менее связно рассказать о себе простыми, но осмысленными предложениями; заметна базовая уверенность

Также верни:
- краткое объяснение на русском языке
- рекомендацию пройти полный тест

Поле recommendedFullTest:
- almost always true
- false только если ты очень уверен в результате мини-диагностики

Верни только JSON без лишнего текста:
{
  "level": "A1|A2|B1",
  "reasoning": "краткое объяснение на русском, 1-2 предложения",
  "recommendedFullTest": true
}
        `.trim();

        const userPrompt = `
Проанализируй мини-диагностику пользователя и определи стартовый уровень казахского языка.

Профиль:
Имя: ${payload.first_name || "Не указано"}
Фамилия: ${payload.last_name || "Не указано"}

Ответы пользователя:
1. Знает ли алфавит: ${payload.alphabet}
2. Понимание простых фраз: ${payload.understanding}
3. Перевод слова: ${payload.translation}
4. Рассказ о себе:
${payload.selfDescription}
5. Уверенность в разговоре: ${payload.speaking}

Дополнительный технический балл фронтенда: ${payload.totalScore}

Определи стартовый уровень только из A1, A2, B1.
        `.trim();

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
        });

        const content = completion.choices?.[0]?.message?.content || "{}";
        const parsed = safeJsonParse(content) || {};

        const level = normalizeLevel(parsed.level) || fallbackLevel(payload);
        const reasoning =
            typeof parsed.reasoning === "string" && parsed.reasoning.trim()
                ? parsed.reasoning.trim()
                : fallbackReasoning(level);

        const recommendedFullTest = normalizeBoolean(parsed.recommendedFullTest, true);

        return res.status(200).json({
            success: true,
            level,
            reasoning,
            recommendedFullTest,
        });
    } catch (err) {
        console.error("onboarding diagnose error:", err);

        const diagnostic = req.body?.diagnostic || {};
        const level = fallbackLevel(diagnostic);

        return res.status(200).json({
            success: true,
            level,
            reasoning: fallbackReasoning(level),
            recommendedFullTest: true,
            fallback: true,
        });
    }
};