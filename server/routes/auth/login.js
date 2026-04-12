const db = require('../../../lib/db');
const { signToken } = require('../../../lib/jwt');
const bcrypt = require('bcrypt');
const supabase = require('../../../lib/supabase');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const loginRaw = String(req.body?.login || '').trim();
    const password = String(req.body?.password || '');

    if (!loginRaw || !password) {
      return res.status(400).json({ success: false, message: 'Введите логин или email и пароль' });
    }

    const normalized = loginRaw.toLowerCase();
    const { rows } = await db.query(
      `
        SELECT
          u.id,
          u.login,
          u.password,
          COALESCE(u.role, 'user') AS role,
          COALESCE(p.email, '') AS email,
          p.auth_id
        FROM users u
        LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE lower(u.login) = $1
           OR lower(COALESCE(p.email, '')) = $1
        ORDER BY u.id ASC
        LIMIT 1
      `,
      [normalized]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: 'Неверный логин, email или пароль' });
    }

    if (user.auth_id && user.email && supabase.isConfigured()) {
      try {
        await supabase.signInWithPassword(user.email, password);
      } catch (e) {
        return res.status(401).json({ success: false, message: 'Неверный логин, email или пароль' });
      }
    } else {
      const ok = await bcrypt.compare(password, String(user.password || ''));
      if (!ok) {
        return res.status(401).json({ success: false, message: 'Неверный логин, email или пароль' });
      }
    }

    const token = signToken({
      id: user.id,
      auth_id: user.auth_id || null,
      login: user.login,
      email: user.email,
      role: user.role,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        auth_id: user.auth_id || null,
        login: user.login,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};
