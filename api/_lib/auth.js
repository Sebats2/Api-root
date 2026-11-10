const crypto = require('crypto');
const secret = () => { if (!process.env.AUTH_SECRET) throw Error('AUTH_SECRET is not set'); return process.env.AUTH_SECRET; };
const hm = s => crypto.createHmac('sha256', secret()).update(s).digest('base64url');
const sign = o => { const p = Buffer.from(JSON.stringify(o)).toString('base64url'); return p + '.' + hm(p); };
const read = t => {
  const [p, g] = String(t || '').split('.');
  if (!p || !g) return null;
  const a = Buffer.from(hm(p)), b = Buffer.from(g);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { const o = JSON.parse(Buffer.from(p, 'base64url').toString()); return o.x > Date.now() ? o : null; } catch (e) { return null; }
};
const cors = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Use POST' }); return true; }
  return false;
};
// Attempt limiting. Uses Upstash Redis when UPSTASH_REDIS_REST_URL/TOKEN are set (reliable);
// otherwise falls back to per-instance memory (best effort only on serverless).
const mem = new Map();
async function limit(key, max, ttl) {
  const u = process.env.UPSTASH_REDIS_REST_URL, t = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (u && t) {
    const r = await fetch(u + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + t },
      body: JSON.stringify([['INCR', key], ['EXPIRE', key, ttl, 'NX']]) }).then(r => r.json());
    return r[0].result <= max;
  }
  const n = Date.now(), e = mem.get(key);
  if (!e || e.x < n) { mem.set(key, { c: 1, x: n + ttl * 1000 }); return true; }
  return ++e.c <= max;
}
module.exports = { sign, read, hm, cors, limit };
