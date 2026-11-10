const { sign, cors } = require('../_lib/auth');
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  try {
    const cid = process.env.GOOGLE_CLIENT_ID;
    if (!cid) return res.status(500).json({ error: 'Google sign-in is not configured on the server.' });
    const cred = String((req.body || {}).credential || '');
    if (!cred) return res.status(400).json({ error: 'Missing Google credential.' });
    const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(cred)), g = await r.json();
    if (!r.ok || g.aud !== cid || g.email_verified !== 'true' || !g.email) return res.status(401).json({ error: 'Google could not verify this sign-in.' });
    const email = g.email.toLowerCase();
    res.json({ ok: true, email, name: g.name || '', picture: g.picture || '', session: sign({ e: email, p: 'google', x: Date.now() + 30 * 864e5 }) });
  } catch (e) { res.status(500).json({ error: 'Server error: ' + e.message }); }
};
