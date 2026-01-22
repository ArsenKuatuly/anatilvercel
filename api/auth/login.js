const bcrypt = require("bcrypt");
const db = require("../../lib/db");
const { setCors } = require("../../lib/cors");
const { readJson } = require("../../lib/body");
const { signToken } = require("../../lib/jwt");

module.exports = async (req, res) => {
  if (setCors(req, res)) return;

  try {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.end(JSON.stringify({ success: false, message: "Method not allowed" }));
    }

    const { login, password } = await readJson(req);

    const [rows] = await db.execute(
      "SELECT id, login, password, role FROM users WHERE login = ?",
      [login]
    );
    const user = rows[0];

    if (!user) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.end(JSON.stringify({ success: false, message: "Неверный логин или пароль" }));
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.end(JSON.stringify({ success: false, message: "Неверный логин или пароль" }));
    }

    const token = signToken({ id: user.id, login: user.login, role: user.role });

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ success: true, message: "Вход выполнен", token }));
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ success: false }));
  }
};
