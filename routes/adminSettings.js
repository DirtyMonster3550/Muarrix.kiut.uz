const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, dbPath } = require('../db/database');
const { sendTestEmail } = require('../utils/mailer');
const { requireAdmin } = require('./adminAuth');
const { auditLog } = require('../middleware/security');

// Audit log
router.get('/audit-log', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, u.full_name AS admin_name, u.email AS admin_email
    FROM audit_log a
    LEFT JOIN users u ON a.admin_id = u.id
    ORDER BY a.created_at DESC LIMIT 500
  `).all();
  res.json(rows);
});

// Test email
router.post('/test-email', requireAdmin, async (req, res) => {
  const admin = db.prepare('SELECT email FROM users WHERE id = ?').get(req.user.id);
  const result = await sendTestEmail(admin?.email || req.body.email);
  auditLog(req.user.id, 'test_email', null, null, admin?.email);
  res.json(result);
});

// Database backup
router.get('/backup', requireAdmin, (req, res) => {
  const filename = `stem_backup_${new Date().toISOString().slice(0, 10)}.db`;
  auditLog(req.user.id, 'download_backup', null, null, filename);
  res.download(dbPath, filename);
});

// Get settings
router.get('/settings', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  rows.forEach(r => { obj[r.key] = r.value; });
  res.json(obj);
});

// Update settings
router.put('/settings', requireAdmin, (req, res) => {
  const allowed = ['announce_text', 'announce_enabled', 'announce_cta', 'site_email', 'site_phone', 'site_address'];
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
  const update = db.transaction((data) => {
    for (const [key, value] of Object.entries(data)) {
      if (allowed.includes(key)) stmt.run(key, String(value));
    }
  });
  update(req.body);
  res.json({ success: true });
});

// Change admin password
router.put('/change-password', requireAdmin, (req, res) => {
  const { current_password, new_password } = req.body;
  const admin = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!admin || !bcrypt.compareSync(current_password, admin.password)) {
    return res.status(400).json({ error: 'Неверный текущий пароль' });
  }
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Новый пароль должен быть не менее 6 символов' });
  }
  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ success: true });
});

module.exports = router;
