const jwt = require("jsonwebtoken");

function getJwtSecret() {
    const value = String(process.env.JWT_SECRET || "").trim();
    if (value) return value;
    if (process.env.NODE_ENV === "production") {
        throw new Error("JWT_SECRET is required in production");
    }
    console.warn("[jwt] JWT_SECRET is missing; using insecure development fallback");
    return "dev_secret";
}

const JWT_SECRET = getJwtSecret();

function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}


function getBearerToken(req) {
    const auth = req.headers.authorization || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    return m ? m[1] : null;
}


function requireUser(req) {
    const token = getBearerToken(req);
    if (!token) throw new Error("Unauthorized");
    return verifyToken(token);
}

module.exports = { signToken, verifyToken, requireUser };
