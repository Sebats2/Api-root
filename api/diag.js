module.exports = (req, res) => {
  const out = {};
  for (const m of ['crypto', 'nodemailer', '../_lib/auth']) {
    try { require(m); out[m] = 'ok'; } catch (e) { out[m] = e.message; }
  }
  out.GMAIL_USER = !!process.env.GMAIL_USER;
  out.GMAIL_APP_PASSWORD = !!process.env.GMAIL_APP_PASSWORD;
  out.AUTH_SECRET = !!process.env.AUTH_SECRET;
  res.status(200).json(out);
};
