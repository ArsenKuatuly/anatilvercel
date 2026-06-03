module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const explicitLogoUrl = String(process.env.BRAND_LOGO_URL || "").trim();
  const supabaseUrl = String(process.env.SUPABASE_URL || "").trim();
  const defaultLogoUrl = supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/branding/logo.png`
    : "";

  const logoUrl = explicitLogoUrl || defaultLogoUrl;
  if (!logoUrl) {
    return res.status(404).json({
      success: false,
      message: "Logo URL is not configured",
    });
  }

  return res.redirect(302, logoUrl);
};
