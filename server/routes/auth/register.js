const db = require('../../../lib/db');
const { signToken } = require('../../../lib/jwt');
const supabase = require('../../../lib/supabase');

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

async function hasColumn(tableName, columnName, schema = 'public') {
  const q = `
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = $1
      AND table_name = $2
      AND column_name = $3
    LIMIT 1
  `;
  const { rows } = await db.query(q, [schema, tableName, columnName]);
  return rows.length > 0;
}

module.exports = async (req, res) => {
  let authUser = null;
  let client = null;

  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    if (!supabase.isAdminConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Supabase Auth ещё не настроен на сервере',
      });
    }

    const login = String(req.body?.login || '').trim();
    const password = String(req.body?.password || '');
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!login || !password || !email) {
      return res.status(400).json({ success: false, message: 'Заполните логин, email и пароль' });
    }

    if (login.length < 3) {
      return res.status(400).json({ success: false, message: 'Логин должен содержать минимум 3 символа' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Пароль должен содержать минимум 6 символов' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Введите корректный email' });
    }

    authUser = await supabase.createAuthUser({ email, password, emailConfirm: true });

    client = await db.getClient();
    await client.query('BEGIN');

    const roleExists = await hasColumn('users', 'role');
    const placeholderPassword = 'SUPABASE_AUTH';

    const userInsert = roleExists
      ? `
          INSERT INTO users (login, password, role)
          VALUES ($1, $2, 'user')
          RETURNING id, login, role
        `
      : `
          INSERT INTO users (login, password)
          VALUES ($1, $2)
          RETURNING id, login, 'user' AS role
        `;

    const userResult = await client.query(userInsert, [login, placeholderPassword]);
    const user = userResult.rows[0];

    await client.query(
      `
        INSERT INTO user_profiles (user_id, auth_id, email, updated_at)
        VALUES ($1, $2, $3, NOW())
      `,
      [user.id, authUser.id, email]
    );

    await client.query('COMMIT');

    const token = signToken({
      id: user.id,
      auth_id: authUser.id,
      login: user.login,
      email,
      role: user.role || 'user',
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        auth_id: authUser.id,
        login: user.login,
        email,
        role: user.role || 'user',
      },
    });
  } catch (err) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch {}
    }

    if (authUser?.id) {
      try { await supabase.deleteAuthUser(authUser.id); } catch (cleanupErr) {
        console.error('register cleanup error:', cleanupErr);
      }
    }

    if (err?.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Пользователь с таким логином или email уже существует',
      });
    }

    if (String(err?.message || '').toLowerCase().includes('already been registered')) {
      return res.status(409).json({
        success: false,
        message: 'Пользователь с таким email уже существует',
      });
    }

    console.error('register error:', err);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  } finally {
    try { client?.release(); } catch {}
  }
};
