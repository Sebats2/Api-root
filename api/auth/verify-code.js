const crypto = require('crypto');
const { sign, read, hm, cors, limit } = require('../_lib/auth');
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  try {
    const { email: e0, code, token } = req.body || {}, email = String(e0 || '').trim().toLowerCase(), c = String(code || '');
    if (!/^\d{4}$/.test(c)) return res.status(400).json({ error: 'Enter the 4-digit code.' });
    if (!(await limit('ver:' + email, 5, 600))) return res.status(429).json({ error: 'Too many attempts. Request a new code in 10 minutes.' });
    const t = read(token);
    if (!t || t.e !== email) return res.status(400).json({ error: 'This code has expired. Request a new one.' });
    const a = Buffer.from(hm(email + '|' + c + '|' + t.x)), b = Buffer.from(String(t.h));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(400).json({ error: 'Incorrect code.' });
    res.json({ ok: true, email, session: sign({ e: email, p: 'email', x: Date.now() + 30 * 864e5 }) });
  } catch (e) { res.status(500).json({ error: 'Server error: ' + e.message }); }
};
