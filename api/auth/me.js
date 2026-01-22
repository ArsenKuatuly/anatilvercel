const db = require("../../lib/db");
const { setCors } = require("../../lib/cors");
const { getBearerToken, verifyToken } = require("../../lib/jwt");

module.exports = async (req, res) => {
  if (setCors(req, res)) return;

  try {
    const token = getBearerToken(req);
    if (!token) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.end(JSON.stringify({ success: false, message: "Не авторизован" }));
    }

    const payload = verifyToken(token);

    const [rows] = await db.execute(
      "SELECT avatar FROM user_profiles WHERE user_id = ?",
      [payload.id]
    );

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        success: true,
        user: {
          id: payload.id,
          login: payload.login,
          role: payload.role,
          avatar: rows[0]?.avatar || "/uploads/avatars/default.png"
        }
      })
    );
  } catch (err) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ success: false, message: "Токен недействителен" }));
  }
};
