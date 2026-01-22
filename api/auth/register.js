const bcrypt = require("bcrypt");
const db = require("../../lib/db");
const { setCors } = require("../../lib/cors");
const { readJson } = require("../../lib/body");

module.exports = async (req, res) => {
  if (setCors(req, res)) return;

  try {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.end(JSON.stringify({ success: false, message: "Method not allowed" }));
    }

    const { login, password } = await readJson(req);

    if (!login || !password) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.end(JSON.stringify({ success: false, message: "Некорректные данные" }));
    }

    const hash = await bcrypt.hash(password, 10);
    await db.execute("INSERT INTO users (login, password) VALUES (?, ?)", [login, hash]);

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ success: true, message: "Регистрация успешна" }));
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.end(JSON.stringify({ success: false, message: "Пользователь уже существует" }));
    }
    console.error(err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ success: false }));
  }
};
