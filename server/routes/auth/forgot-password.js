const supabase = require('../../../lib/supabase');

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function buildAppUrl(req) {
  const raw = String(process.env.APP_URL || '').trim();
  if (raw) {
    try {
      const u = new URL(raw);
      return `${u.origin}${u.pathname}`.replace(/\/$/, '');
    } catch {
      throw new Error('APP_URL is invalid');
    }
  }

  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').trim();
  if (!host) {
    throw new Error('APP_URL is missing and host is unavailable');
  }

  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim() || 'https';
  return `${proto}://${host}`.replace(/\/$/, '');
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    if (!supabase.isConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Supabase Auth ещё не настроен на сервере',
      });
    }

    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Введите корректный email' });
    }

    const appUrl = buildAppUrl(req);
    const redirectTo = `${appUrl}/reset-password.html`;

    await supabase.sendPasswordReset(email, redirectTo);

    return res.status(200).json({
      success: true,
      message: 'Если такой email существует, мы отправили письмо со ссылкой для сброса пароля',
    });
  } catch (err) {
    console.error('forgot-password error:', err);
    return res.status(500).json({ success: false, message: 'Не удалось отправить письмо для сброса пароля' });
  }
};
