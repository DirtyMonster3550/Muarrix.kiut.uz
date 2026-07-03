const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../db/database');
const { requireAdmin } = require('./adminAuth');
const { auditLog } = require('../middleware/security');

const ASSIGNABLE_ROLES = ['author', 'tech_expert', 'editorial_expert'];
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/;

function validateUserPassword(password) {
  if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Пароль: минимум 8 символов, буквы и цифры';
  }
  return null;
}

// Get all users
router.get('/users', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT id, full_name, email, role, is_banned, created_at,
      (SELECT COUNT(*) FROM submissions WHERE user_id = users.id) as submissions_count
    FROM users ORDER BY created_at DESC
  `).all();
  res.json(rows);
});

// User detail + submissions
router.get('/users/:id/submissions', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Некорректный id' });
  const user = db.prepare('SELECT id, full_name, email, role, is_banned, created_at FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const submissions = db.prepare(`
    SELECT s.*, i.title AS issue_title FROM submissions s
    LEFT JOIN issues i ON s.issue_id = i.id
    WHERE s.user_id = ? ORDER BY s.submitted_at DESC
  `).all(id);
  res.json({ user, submissions });
});

// Create user
router.post('/users', requireAdmin, (req, res) => {
  const { full_name, email, password, role } = req.body;

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }
  if (typeof full_name !== 'string' || full_name.trim().length < 2 || full_name.length > 200) {
    return res.status(400).json({ error: 'Укажите корректное имя' });
  }
  if (!EMAIL_RE.test(String(email).trim()) || String(email).length > 254) {
    return res.status(400).json({ error: 'Укажите корректный email' });
  }
  const pwdError = validateUserPassword(password);
  if (pwdError) return res.status(400).json({ error: pwdError });
  if (!ASSIGNABLE_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Недопустимая роль' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'Email уже зарегистрирован' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (full_name, email, password, role)
    VALUES (?, ?, ?, ?)
  `).run(full_name.trim(), normalizedEmail, hash, role);

  auditLog(req.user.id, 'create_user', 'user', result.lastInsertRowid, `${full_name.trim()} · ${role}`);

  res.json({
    success: true,
    user: {
      id: result.lastInsertRowid,
      full_name: full_name.trim(),
      email: normalizedEmail,
      role,
    },
  });
});

// Change user role
router.put('/users/:id/role', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { role } = req.body;

  if (!ASSIGNABLE_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Недопустимая роль' });
  }
  if (id === req.user.id) {
    return res.status(400).json({ error: 'Нельзя изменить собственную роль' });
  }

  const user = db.prepare('SELECT id, full_name, role FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  if (user.role === 'admin') {
    return res.status(400).json({ error: 'Роль администратора нельзя изменить' });
  }

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  auditLog(req.user.id, 'change_role', 'user', id, `${user.role} → ${role}`);

  res.json({ success: true, id, role });
});

// Reset user password
router.put('/users/:id/password', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { new_password } = req.body;

  if (Number.isNaN(id)) return res.status(400).json({ error: 'Некорректный id' });

  const pwdError = validateUserPassword(new_password);
  if (pwdError) return res.status(400).json({ error: pwdError });

  const user = db.prepare('SELECT id, full_name, email, role FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  if (user.role === 'admin') {
    return res.status(400).json({ error: 'Пароль администратора нельзя сбросить через эту форму' });
  }

  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare(`
    UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?
  `).run(hash, id);

  auditLog(req.user.id, 'reset_user_password', 'user', id, user.email);

  res.json({ success: true });
});

// Delete user
router.delete('/users/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Некорректный id' });
  if (id === req.user.id) {
    return res.status(400).json({ error: 'Нельзя удалить собственный аккаунт' });
  }

  const user = db.prepare('SELECT id, full_name, email, role FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  if (user.role === 'admin') {
    return res.status(400).json({ error: 'Администратора нельзя удалить' });
  }

  const submissionsCount = db.prepare('SELECT COUNT(*) AS c FROM submissions WHERE user_id = ?').get(id).c;
  if (submissionsCount > 0) {
    return res.status(400).json({
      error: `У пользователя ${submissionsCount} статей. Удаление невозможно — заблокируйте аккаунт.`,
    });
  }

  const deleteUser = db.transaction((userId) => {
    db.prepare('UPDATE submissions SET tech_reviewer_id = NULL WHERE tech_reviewer_id = ?').run(userId);
    db.prepare('UPDATE submissions SET editorial_reviewer_id = NULL WHERE editorial_reviewer_id = ?').run(userId);
    db.prepare('UPDATE submissions SET assigned_editorial_id = NULL WHERE assigned_editorial_id = ?').run(userId);
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  });

  deleteUser(id);
  auditLog(req.user.id, 'delete_user', 'user', id, `${user.full_name} · ${user.email}`);

  res.json({ success: true });
});

module.exports = router;
