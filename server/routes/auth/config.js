const supabase = require('../../../lib/supabase');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  if (!supabase.isConfigured()) {
    return res.status(500).json({ success: false, message: 'Supabase is not configured' });
  }

  return res.status(200).json({
    success: true,
    url: supabase.url,
    anonKey: supabase.anonKey,
  });
};
