const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

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
