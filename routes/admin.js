const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { db, dbPath } = require('../db/database');
const { sendApprovalEmail, sendRejectionEmail, sendTestEmail } = require('../utils/mailer');
const { requireAdmin } = require('./adminAuth');
const { auditLog } = require('../middleware/security');
const { publishSubmissionToArchive, syncPublishedToArchive } = require('../lib/publishSubmission');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const publishPdfUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const rand = crypto.randomBytes(16).toString('hex');
      cb(null, `${Date.now()}_${rand}.pdf`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mime = String(file.mimetype || '').toLowerCase();
    if (ext === '.pdf' || mime === 'application/pdf') cb(null, true);
    else cb(new Error('Для публикации принимается только PDF'));
  },
});

function isPdfFile(filePath) {
  try {
    const head = Buffer.alloc(4);
    const fd = fs.openSync(filePath, 'r');
    try {
      fs.readSync(fd, head, 0, 4, 0);
    } finally {
      fs.closeSync(fd);
    }
    return head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
  } catch {
    return false;
  }
}

// Dashboard stats
router.get('/stats', requireAdmin, (req, res) => {
  const total             = db.prepare('SELECT COUNT(*) as c FROM submissions').get().c;
  const pending           = db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status = 'pending'").get().c;
  const tech_approved     = db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status = 'tech_approved'").get().c;
  const editorial_approved= db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status = 'editorial_approved'").get().c;
  const published         = db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status = 'published'").get().c;
  const rejected          = db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status = 'rejected'").get().c;
  const users             = db.prepare("SELECT COUNT(*) as c FROM users WHERE role NOT IN ('admin')").get().c;
  res.json({ total, pending, tech_approved, editorial_approved, published, rejected, users });
});

// Get all submissions
router.get('/submissions', requireAdmin, (req, res) => {
  const { status, search } = req.query;
  let query = `
    SELECT s.*, u.full_name, u.email, i.title AS issue_title
    FROM submissions s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN issues i ON s.issue_id = i.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'all') {
    query += ' AND s.status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (s.title LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  query += ' ORDER BY s.submitted_at DESC';

  res.json(db.prepare(query).all(...params));
});

// Get single submission
router.get('/submissions/:id', requireAdmin, (req, res) => {
  const row = db.prepare(`
    SELECT s.*, u.full_name, u.email, i.title AS issue_title
    FROM submissions s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN issues i ON s.issue_id = i.id
    WHERE s.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Не найдено' });
  res.json(row);
});

// Approve submission — только после экспертизы (legacy: editorial_approved → publish через /publish)
router.post('/submissions/:id/approve', requireAdmin, async (req, res) => {
  const { note } = req.body;
  const sub = db.prepare(`
    SELECT s.*, u.full_name, u.email
    FROM submissions s JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!sub) return res.status(404).json({ error: 'Не найдено' });

  if (sub.status === 'pending' || sub.status === 'tech_approved') {
    return res.status(400).json({
      error: 'Статья проходит экспертизу. Дождитесь решения тех. и ред. экспертов или верните на доработку.',
    });
  }
  if (sub.status === 'editorial_approved') {
    return res.status(400).json({
      error: 'Статья уже одобрена экспертами. Опубликуйте её во вкладке «К публикации».',
    });
  }
  if (sub.status === 'published') {
    return res.status(400).json({ error: 'Статья уже опубликована' });
  }
  if (sub.status !== 'approved') {
    return res.status(400).json({ error: 'Нельзя одобрить статью в текущем статусе' });
  }

  db.prepare(`
    UPDATE submissions SET status = 'approved', admin_note = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(note || null, req.params.id);

  db.prepare(`
    INSERT INTO notifications (user_id, submission_id, type, message)
    VALUES (?, ?, 'approved', ?)
  `).run(sub.user_id, sub.id, `Ваша статья "${sub.title}" прошла редакционную комиссию и одобрена к публикации!`);

  auditLog(req.user.id, 'approve_submission', 'submission', sub.id, sub.title);

  const emailResult = await sendApprovalEmail(sub.email, sub.full_name, sub.title, sub.journal, note);
  res.json({ success: true, emailSent: emailResult.success, stub: emailResult.stub });
});

// Reject submission (admin may return to author at any pre-publish stage)
router.post('/submissions/:id/reject', requireAdmin, async (req, res) => {
  const { note } = req.body;
  const sub = db.prepare(`
    SELECT s.*, u.full_name, u.email
    FROM submissions s JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!sub) return res.status(404).json({ error: 'Не найдено' });
  if (sub.status === 'published') {
    return res.status(400).json({ error: 'Нельзя отклонить опубликованную статью' });
  }

  db.prepare(`
    UPDATE submissions
    SET status = 'rejected',
        admin_note = ?,
        assigned_editorial_id = NULL,
        rejection_stage = 'admin',
        rejection_reason = ?,
        reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(note || null, note || 'Возвращено администратором', req.params.id);

  db.prepare(`
    INSERT INTO notifications (user_id, submission_id, type, message)
    VALUES (?, ?, 'rejected', ?)
  `).run(sub.user_id, sub.id, `Ваша статья "${sub.title}" возвращена на доработку.${note ? ' Примечание: ' + note : ''}`);

  auditLog(req.user.id, 'reject_submission', 'submission', sub.id, sub.title);

  const emailResult = await sendRejectionEmail(sub.email, sub.full_name, sub.title, sub.journal, note);
  res.json({ success: true, emailSent: emailResult.success, stub: emailResult.stub });
});

// ── Publish submission (admin uploads PDF + publishes editorial_approved) ───────
router.post('/submissions/:id/publish', requireAdmin, (req, res) => {
  publishPdfUpload.single('pdf')(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ error: uploadErr.message || 'Ошибка загрузки PDF' });
    }

    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Некорректный id' });

    const note = req.body && req.body.note != null ? String(req.body.note).trim() : '';
    const sub = db.prepare(`
      SELECT s.*, u.full_name, u.email
      FROM submissions s JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(id);

    if (!sub) {
      if (req.file) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
      return res.status(404).json({ error: 'Не найдено' });
    }
    if (sub.status !== 'editorial_approved') {
      if (req.file) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
      return res.status(400).json({ error: 'Статья не в очереди на публикацию' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Загрузите PDF файл для публикации в архиве' });
    }
    if (!isPdfFile(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(400).json({ error: 'Файл не является корректным PDF' });
    }

    const issueIdRaw = req.body && req.body.issue_id != null ? req.body.issue_id : sub.issue_id;
    const issueId = parseInt(String(issueIdRaw || ''), 10);
    if (Number.isNaN(issueId)) {
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(400).json({ error: 'Выберите выпуск журнала, в который добавить статью' });
    }
    const issue = db.prepare('SELECT id, title, archive_folder FROM issues WHERE id = ?').get(issueId);
    if (!issue) {
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(400).json({ error: 'Выпуск журнала не найден' });
    }
    if (!String(issue.archive_folder || '').trim()) {
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(400).json({
        error: `У выпуска «${issue.title}» не указана «Папка в архиве». Откройте «Выпуски журналов» → Изменить → заполните папку.`,
      });
    }

    db.prepare('UPDATE submissions SET issue_id = ? WHERE id = ?').run(issueId, id);

    const pdfName = path.basename(req.file.filename);
    db.prepare('UPDATE submissions SET published_pdf_path = ? WHERE id = ?').run(pdfName, id);

    const archiveResult = await publishSubmissionToArchive(id, db);
    if (!archiveResult.ok) {
      db.prepare('UPDATE submissions SET published_pdf_path = NULL WHERE id = ?').run(id);
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(400).json({ error: archiveResult.error });
    }

    db.prepare(`
      UPDATE submissions
      SET status = 'published', admin_note = ?, published_at = CURRENT_TIMESTAMP, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(note || null, id);

    db.prepare(`INSERT INTO notifications (user_id, submission_id, type, message) VALUES (?, ?, 'approved', ?)`)
      .run(sub.user_id, sub.id,
        `Ваша статья «${sub.title}» опубликована! Она доступна в архиве на сайте журнала.`);

    auditLog(req.user.id, 'publish_submission', 'submission', sub.id, sub.title);
    res.json({
      success: true,
      archiveFolder: archiveResult.folder,
      archiveFile: archiveResult.archiveFile,
      pdfFile: pdfName,
    });
  });
});

// ── Backfill: опубликованные статьи → файловый архив ────────────────────────
router.post('/archive/sync-published', requireAdmin, async (_req, res) => {
  try {
    const result = await syncPublishedToArchive(db);
    res.json({ success: true, ...result });
  } catch (e) {
    console.error('[admin sync-published]', e);
    res.status(500).json({ error: 'Не удалось синхронизировать архив' });
  }
});

// ── Export submissions as CSV ─────────────────────────────────────────────────
router.get('/submissions/export', requireAdmin, (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT s.id, s.title, s.authors, s.journal, s.status,
           s.submitted_at, s.reviewed_at, s.admin_note,
           u.full_name, u.email, i.title AS issue_title
    FROM submissions s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN issues i ON s.issue_id = i.id
    WHERE 1=1
  `;
  const params = [];
  if (status && status !== 'all') { query += ' AND s.status = ?'; params.push(status); }
  query += ' ORDER BY s.submitted_at DESC';
  const rows = db.prepare(query).all(...params);

  function csvCell(v) { return `"${String(v ?? '').replace(/"/g, '""')}"`; }

  const headers = ['ID','Название','Авторы','Журнал','Email автора','ФИО автора','Статус','Выпуск','Дата подачи','Дата решения','Примечание'];
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      r.id,
      csvCell(r.title),
      csvCell(r.authors),
      r.journal,
      csvCell(r.email),
      csvCell(r.full_name),
      r.status,
      csvCell(r.issue_title || ''),
      r.submitted_at || '',
      r.reviewed_at || '',
      csvCell(r.admin_note || ''),
    ].join(',')),
  ];
  const csv = '\uFEFF' + lines.join('\r\n'); // BOM for correct encoding in Excel

  auditLog(req.user.id, 'export_csv', 'submissions', null, `status=${status || 'all'}, count=${rows.length}`);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="submissions_${new Date().toISOString().slice(0,10)}.csv"`);
  res.send(csv);
});

// ── Bulk action on submissions ────────────────────────────────────────────────
router.post('/submissions/bulk', requireAdmin, async (req, res) => {
  const { ids, action, note } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'Укажите статьи' });
  if (action !== 'reject') {
    return res.status(400).json({ error: 'Массовое одобрение отключено — статьи проходят экспертизу' });
  }

  const cleanIds = ids.map(id => parseInt(id, 10)).filter(id => !Number.isNaN(id));
  if (!cleanIds.length) return res.status(400).json({ error: 'Некорректные ID' });

  let processed = 0;

  for (const id of cleanIds) {
    const sub = db.prepare(`
      SELECT s.*, u.full_name, u.email FROM submissions s
      JOIN users u ON s.user_id = u.id WHERE s.id = ?
    `).get(id);
    if (!sub || sub.status === 'published') continue;

    db.prepare(`
      UPDATE submissions
      SET status = 'rejected',
          admin_note = ?,
          assigned_editorial_id = NULL,
          rejection_stage = 'admin',
          rejection_reason = ?,
          reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(note || null, note || 'Возвращено администратором', id);

    const msg = `Ваша статья "${sub.title}" возвращена на доработку.${note ? ' Примечание: ' + note : ''}`;
    db.prepare(`INSERT INTO notifications (user_id, submission_id, type, message) VALUES (?, ?, 'rejected', ?)`)
      .run(sub.user_id, id, msg);

    auditLog(req.user.id, 'bulk_reject', 'submission', id, sub.title);
    processed++;
  }

  res.json({ success: true, processed });
});

// ── User's submissions (for detail modal) ─────────────────────────────────────
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

// ── Audit log ─────────────────────────────────────────────────────────────────
router.get('/audit-log', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, u.full_name AS admin_name, u.email AS admin_email
    FROM audit_log a
    LEFT JOIN users u ON a.admin_id = u.id
    ORDER BY a.created_at DESC LIMIT 500
  `).all();
  res.json(rows);
});

// ── Test email ────────────────────────────────────────────────────────────────
router.post('/test-email', requireAdmin, async (req, res) => {
  const admin = db.prepare('SELECT email FROM users WHERE id = ?').get(req.user.id);
  const result = await sendTestEmail(admin?.email || req.body.email);
  auditLog(req.user.id, 'test_email', null, null, admin?.email);
  res.json(result);
});

// ── Database backup ───────────────────────────────────────────────────────────
router.get('/backup', requireAdmin, (req, res) => {
  const filename = `stem_backup_${new Date().toISOString().slice(0, 10)}.db`;
  auditLog(req.user.id, 'download_backup', null, null, filename);
  res.download(dbPath, filename);
});

// ===== SETTINGS =====
router.get('/settings', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  rows.forEach(r => { obj[r.key] = r.value; });
  res.json(obj);
});

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
  const bcrypt = require('bcryptjs');
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

// Get all users
router.get('/users', requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT id, full_name, email, role, is_banned, created_at,
      (SELECT COUNT(*) FROM submissions WHERE user_id = users.id) as submissions_count
    FROM users ORDER BY created_at DESC
  `).all();
  res.json(rows);
});

// Change user role (admin role cannot be assigned — only one admin exists in the system)
const ASSIGNABLE_ROLES = ['author', 'tech_expert', 'editorial_expert'];

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

module.exports = router;
