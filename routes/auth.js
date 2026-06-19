const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db } = require('../db/database');
const { logEvent, autobanIfNeeded, clientIp } = require('../middleware/security');
const { sendPasswordResetEmail } = require('../utils/mailer');
const { signToken, verifyToken } = require('../lib/jwtAuth');
const { setSessionCookie, clearSessionCookie, getSessionToken } = require('../middleware/hardening');

// ── Simple email format check ─────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/;

// Register
router.post('/register', (req, res) => {
  const ip = clientIp(req);
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  if (typeof full_name !== 'string' || full_name.trim().length < 2 || full_name.length > 200) {
    return res.status(400).json({ error: 'Укажите корректное имя' });
  }

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Укажите корректный email' });
  }

  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 8 символов и содержать буквы и цифры' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email уже зарегистрирован' });
  }

  // Track registration attempts and auto-ban flood
  logEvent(ip, 'register_attempt', email);
  if (autobanIfNeeded(ip, 'register_attempt')) {
    return res.status(403).json({ error: 'Слишком много попыток регистрации. Ваш IP заблокирован.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)'
  ).run(full_name, email, hash);

  const token = signToken({ id: result.lastInsertRowid, role: 'author' });
  setSessionCookie(res, token);

  res.json({
    success: true,
    token,
    user: { id: result.lastInsertRowid, full_name, email, role: 'author' },
  });
});

// Login
router.post('/login', (req, res) => {
  const ip = clientIp(req);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Введите email и пароль' });
  }

  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    // Log failed login and auto-ban if threshold exceeded
    logEvent(ip, 'failed_login', email);
    if (autobanIfNeeded(ip, 'failed_login')) {
      return res.status(403).json({ error: 'Слишком много неудачных попыток. Ваш IP заблокирован.' });
    }
    return res.status(401).json({ error: 'Неверный email или пароль' });
  }

  // Check account ban
  if (user.is_banned) {
    logEvent(ip, 'blocked_request', `banned user login attempt: ${email}`, user.id);
    return res.status(403).json({ error: 'Ваш аккаунт заблокирован. Обратитесь к администратору.' });
  }

  // Назначенный админ журнала — при входе всегда получает роль admin
  if (user.email.toLowerCase() === 'dr.admin35@gmail.com') {
    db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
    db.prepare("UPDATE users SET role = 'author' WHERE role = 'admin' AND id != ?").run(user.id);
    user.role = 'admin';
  }

  const token = signToken({ id: user.id, role: user.role });
  setSessionCookie(res, token);

  res.json({
    success: true,
    token,
    user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
  });
});

// Logout — clear httpOnly session cookie
router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

// Полноценный POST-переход: надёжно ставит httpOnly cookie на телефонах (fetch Set-Cookie часто не успевает)
router.post('/cookie-bridge', (req, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
  if (!token) return res.redirect(302, '/login.html?session=invalid');
  try {
    const payload = verifyToken(token);
    let user = db.prepare('SELECT id, full_name, email, role FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.redirect(302, '/login.html?session=invalid');

    if (user.email.toLowerCase() === 'dr.admin35@gmail.com') {
      db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
      db.prepare("UPDATE users SET role = 'author' WHERE role = 'admin' AND id != ?").run(user.id);
      user.role = 'admin';
    }

    const fresh = signToken({ id: user.id, role: user.role });
    setSessionCookie(res, fresh);

    if (user.role === 'admin') return res.redirect(302, '/admin.html');
    if (user.role === 'tech_expert' || user.role === 'editorial_expert') {
      return res.redirect(302, '/expert.html');
    }
    return res.redirect(302, '/dashboard.html');
  } catch {
    return res.redirect(302, '/login.html?session=invalid');
  }
});

// Sync localStorage token → httpOnly cookie (для защиты HTML-страниц)
router.post('/session-sync', (req, res) => {
  const token = getSessionToken(req);
  if (!token) return res.status(401).json({ error: 'Не авторизован' });
  try {
    const payload = verifyToken(token);
    let user = db.prepare('SELECT id, full_name, email, role FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: 'Пользователь не найден' });

    if (user.email.toLowerCase() === 'dr.admin35@gmail.com') {
      db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
      db.prepare("UPDATE users SET role = 'author' WHERE role = 'admin' AND id != ?").run(user.id);
      user.role = 'admin';
    }

    const fresh = signToken({ id: user.id, role: user.role });
    setSessionCookie(res, fresh);
    res.json({
      success: true,
      token: fresh,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
    });
  } catch {
    res.status(401).json({ error: 'Токен недействителен' });
  }
});

// Forgot password — sends reset link to email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Введите email' });

  const user = db.prepare('SELECT id, full_name, email FROM users WHERE email = ?').get(email);
  // Always return success to prevent email enumeration attacks
  if (!user) return res.json({ success: true });

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
    .run(token, expires, user.id);

  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  const resetLink = `${baseUrl}/reset-password.html?token=${token}`;

  await sendPasswordResetEmail(user.email, user.full_name, resetLink);

  res.json({ success: true });
});

// Reset password — verifies token and sets new password
router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Неверный запрос' });

  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 8 символов и содержать буквы и цифры' });
  }

  const user = db.prepare(
    "SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > datetime('now')"
  ).get(token);

  if (!user) {
    return res.status(400).json({ error: 'Ссылка недействительна или срок действия истёк' });
  }

  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?')
    .run(hash, user.id);

  res.json({ success: true });
});

// Get current user
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, full_name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json(user);
});

// Обновить JWT после смены роли в БД (без повторного ввода пароля)
router.post('/refresh-session', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, full_name, email, role, is_banned FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  if (user.is_banned) return res.status(403).json({ error: 'Аккаунт заблокирован' });
  const token = signToken({ id: user.id, role: user.role });
  setSessionCookie(res, token);
  res.json({
    success: true,
    token,
    user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
  });
});

function requireAuth(req, res, next) {
  const token = getSessionToken(req);
  if (!token) return res.status(401).json({ error: 'Не авторизован' });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Токен недействителен' });
  }
}

module.exports = router;
module.exports.requireAuth = requireAuth;
