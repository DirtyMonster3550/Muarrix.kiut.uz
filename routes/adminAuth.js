const { resolveSessionUser } = require('../lib/sessionUser');

function requireAdmin(req, res, next) {
  const user = resolveSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Не авторизован' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'Доступ запрещён' });
  req.user = user;
  next();
}

module.exports = { requireAdmin };
