const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env.local") });
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "OK" : "MISSING");

const express = require("express");

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    console.log("REQ:", req.method, req.url);
    next();
});


app.use(express.static(path.join(__dirname, "public")));



app.all(/^\/api\/(.+)$/, async (req, res) => {
    try {
        const rel = req.params[0]; // "ai/chat"
        const file = path.join(__dirname, "api", rel + ".js");

        delete require.cache[require.resolve(file)];
        const handler = require(file);

        return handler(req, res);
    } catch (e) {
        console.error("API load error:", e);

        if (e && (e.code === "MODULE_NOT_FOUND" || String(e.message || "").includes("Cannot find module"))) {
            return res.status(404).json({ error: "API route not found", details: e.message });
        }

        return res.status(500).json({ error: "API handler crashed", details: e.message });
    }

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Local dev: http://localhost:" + PORT));
