const supabase = require('../../../lib/supabase');

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
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

    const appUrl = String(process.env.APP_URL || '').replace(/\/$/, '');
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
