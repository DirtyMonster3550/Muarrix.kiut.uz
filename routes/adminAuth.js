const { verifyToken } = require('../lib/jwtAuth');
const { getSessionToken } = require('../middleware/hardening');

function requireAdmin(req, res, next) {
  const token = getSessionToken(req);
  if (!token) return res.status(401).json({ error: 'Не авторизован' });
  try {
    const payload = verifyToken(token);
    if (payload.role !== 'admin') return res.status(403).json({ error: 'Доступ запрещён' });
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Токен недействителен' });
  }
}

module.exports = { requireAdmin };
