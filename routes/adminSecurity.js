const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { requireAdmin } = require('./adminAuth');
const { banIp, logEvent } = require('../middleware/security');

// ── Overview stats ─────────────────────────────────────────────────────────────
router.get('/stats', requireAdmin, (req, res) => {
  const activeBans    = db.prepare("SELECT COUNT(*) AS c FROM ip_bans WHERE is_active = 1").get().c;
  const bannedUsers   = db.prepare("SELECT COUNT(*) AS c FROM users WHERE is_banned = 1").get().c;
  const eventsToday   = db.prepare(`
    SELECT COUNT(*) AS c FROM security_events
    WHERE created_at >= date('now')
  `).get().c;
  const autobanToday  = db.prepare(`
    SELECT COUNT(*) AS c FROM security_events
    WHERE event_type = 'auto_banned' AND created_at >= date('now')
  `).get().c;

  res.json({ activeBans, bannedUsers, eventsToday, autobanToday });
});

// ── IP Bans: list ─────────────────────────────────────────────────────────────
router.get('/bans', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM ip_bans ORDER BY banned_at DESC LIMIT 200
  `).all();
  res.json(rows);
});

// ── IP Bans: manual ban ───────────────────────────────────────────────────────
router.post('/bans', requireAdmin, (req, res) => {
  const { ip, reason } = req.body;
  if (!ip || typeof ip !== 'string' || ip.trim().length === 0) {
    return res.status(400).json({ error: 'Укажите IP-адрес' });
  }
  const cleanIp = ip.trim();
  try {
    banIp(cleanIp, reason || 'Ручной бан администратором');
    logEvent(cleanIp, 'manual_ban', `Admin: ${reason || '—'}`);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Не удалось добавить бан' });
  }
});

// ── IP Bans: lift ban ─────────────────────────────────────────────────────────
router.delete('/bans/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Некорректный id' });

  const ban = db.prepare('SELECT * FROM ip_bans WHERE id = ?').get(id);
  if (!ban) return res.status(404).json({ error: 'Бан не найден' });

  db.prepare(`
    UPDATE ip_bans SET is_active = 0, unbanned_at = CURRENT_TIMESTAMP, unbanned_by = 'admin'
    WHERE id = ?
  `).run(id);

  logEvent(ban.ip, 'ban_lifted', `Ban #${id} lifted by admin`);
  res.json({ success: true });
});

// ── Security events: list ─────────────────────────────────────────────────────
router.get('/events', requireAdmin, (req, res) => {
  const { type, ip: filterIp } = req.query;
  let sql = `
    SELECT e.*, u.email AS user_email
    FROM security_events e
    LEFT JOIN users u ON e.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (type && type !== 'all') {
    sql += ' AND e.event_type = ?';
    params.push(type);
  }
  if (filterIp) {
    sql += ' AND e.ip LIKE ?';
    params.push(`%${filterIp}%`);
  }
  sql += ' ORDER BY e.created_at DESC LIMIT 300';

  res.json(db.prepare(sql).all(...params));
});

// ── Users: ban account ────────────────────────────────────────────────────────
router.post('/users/:id/ban', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Некорректный id' });

  const user = db.prepare('SELECT id, role, email FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  if (user.role === 'admin') return res.status(400).json({ error: 'Нельзя заблокировать администратора' });

  db.prepare('UPDATE users SET is_banned = 1 WHERE id = ?').run(id);
  logEvent('admin', 'user_banned', `User #${id} (${user.email}) banned by admin`, id);
  res.json({ success: true });
});

// ── Users: unban account ──────────────────────────────────────────────────────
router.post('/users/:id/unban', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Некорректный id' });

  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

  db.prepare('UPDATE users SET is_banned = 0 WHERE id = ?').run(id);
  logEvent('admin', 'user_unbanned', `User #${id} (${user.email}) unbanned by admin`, id);
  res.json({ success: true });
});

// ── Users: banned list ────────────────────────────────────────────────────────
router.get('/users/banned', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT id, full_name, email, role, created_at FROM users WHERE is_banned = 1
  `).all();
  res.json(rows);
});

module.exports = router;
