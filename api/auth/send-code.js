const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { sign, hm, cors, limit } = require('../_lib/auth');
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  try {
    const email = String((req.body || {}).email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (!(await limit('send:' + email, 5, 3600))) return res.status(429).json({ error: 'Too many codes requested. Try again in an hour.' });
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return res.status(500).json({ error: 'Email sending is not configured on the server.' });
    const code = String(crypto.randomInt(0, 10000)).padStart(4, '0'), x = Date.now() + 5 * 60 * 1000;
    try {
      const tr = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
      await tr.sendMail({
        from: 'ROOT LEARN <' + process.env.GMAIL_USER + '>',
        to: email,
        subject: 'Your ROOT LEARN code: ' + code,
        html: `<p>Your ROOT LEARN verification code is</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>It expires in 5 minutes. If you did not request it, ignore this email.</p>`
      });
    } catch (err) { return res.status(502).json({ error: 'Could not send the email. Try again shortly.' }); }
    res.json({ ok: true, token: sign({ e: email, x, h: hm(email + '|' + code + '|' + x) }), expiresIn: 300 });
  } catch (e) { res.status(500).json({ error: 'Server error: ' + e.message }); }
};
