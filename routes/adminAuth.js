const { verifyToken } = require('../lib/jwtAuth');
const { getSessionToken } = require('../middleware/hardening');
const { db } = require('../db/database');

function requireAdmin(req, res, next) {
  const token = getSessionToken(req);
  if (!token) return res.status(401).json({ error: 'Не авторизован' });
  try {
    const payload = verifyToken(token);
    const row = db.prepare('SELECT role FROM users WHERE id = ?').get(payload.id);
    if ((row?.role || payload.role) !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    req.user = { ...payload, role: row?.role || payload.role };
    next();
  } catch {
    res.status(401).json({ error: 'Токен недействителен' });
  }
}

module.exports = { requireAdmin };
