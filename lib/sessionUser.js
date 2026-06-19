const { db } = require('../db/database');
const { verifyToken } = require('./jwtAuth');
const { getSessionToken } = require('./sessionToken');

function promoteDesignatedAdmin(user) {
  if (!user || !user.email || user.email.toLowerCase() !== 'dr.admin35@gmail.com') return user;
  db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
  db.prepare("UPDATE users SET role = 'author' WHERE role = 'admin' AND id != ?").run(user.id);
  user.role = 'admin';
  return user;
}

function resolveSessionUser(req) {
  const token = getSessionToken(req);
  if (!token) return null;
  try {
    const payload = verifyToken(token);
    const row = db.prepare('SELECT id, full_name, email, role FROM users WHERE id = ?').get(payload.id);
    if (!row) return null;
    return promoteDesignatedAdmin({ ...row });
  } catch {
    return null;
  }
}

module.exports = { resolveSessionUser, promoteDesignatedAdmin };
