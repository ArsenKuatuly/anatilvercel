const { requireUser } = require("../../../lib/jwt");
const OpenAI = require("openai");

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      requireUser(req);
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY missing" });
    }

    const text = normalizeText(req.body?.text);
    const voice = normalizeText(req.body?.voice || "alloy");
    const speed = Number(req.body?.speed || 1);

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const input = text.slice(0, 1500);
    const openai = new OpenAI({ apiKey, timeout: 30000 });
    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice,
      input,
      format: "mp3",
      speed: Number.isFinite(speed) ? Math.max(0.7, Math.min(speed, 1.1)) : 1
    });

    const buffer = Buffer.from(await speech.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(buffer);
  } catch (err) {
    console.error("[ai/tts] error:", err?.message || err);
    return res.status(500).json({
      error: "TTS error",
      details: "Внутренняя ошибка TTS сервиса"
    });
  }
};
