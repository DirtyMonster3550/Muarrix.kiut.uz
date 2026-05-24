const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('../db/database');
const { auditLog } = require('../middleware/security');
const { sendRejectionEmail } = require('../utils/mailer');

// ── Auth middleware for reviewers ─────────────────────────────────────────────
function requireRole(...roles) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Не авторизован' });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      if (!roles.includes(payload.role)) {
        return res.status(403).json({ error: 'Доступ запрещён' });
      }
      req.user = payload;
      next();
    } catch {
      res.status(401).json({ error: 'Токен недействителен' });
    }
  };
}

// ── Queue: submissions waiting for this reviewer's stage ─────────────────────
router.get('/queue', requireRole('tech_expert', 'editorial_expert', 'admin'), (req, res) => {
  const stageMap = {
    tech_expert:       'pending',
    editorial_expert:  'tech_approved',
    admin:             'editorial_approved',
  };
  const status = stageMap[req.user.role];

  const rows = db.prepare(`
    SELECT s.id, s.title, s.authors, s.journal, s.abstract, s.status,
           s.submitted_at, s.file_path, s.admin_note,
           u.full_name, u.email,
           i.title AS issue_title
    FROM submissions s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN issues i ON s.issue_id = i.id
    WHERE s.status = ?
    ORDER BY s.submitted_at ASC
  `).all(status);

  res.json(rows);
});

// ── Stats for reviewer ────────────────────────────────────────────────────────
router.get('/stats', requireRole('tech_expert', 'editorial_expert'), (req, res) => {
  const isTech = req.user.role === 'tech_expert';
  const queueStatus = isTech ? 'pending' : 'tech_approved';
  const approvedStatus = isTech ? 'tech_approved' : 'editorial_approved';

  const inQueue   = db.prepare(`SELECT COUNT(*) as c FROM submissions WHERE status = ?`).get(queueStatus).c;
  const approved  = db.prepare(`SELECT COUNT(*) as c FROM submissions WHERE status = ? OR status = 'editorial_approved' OR status = 'published'`).get(approvedStatus).c;
  const rejected  = db.prepare(`SELECT COUNT(*) as c FROM submissions WHERE status = 'rejected' AND rejection_stage = ?`).get(isTech ? 'tech' : 'editorial').c;
  const total     = db.prepare(`SELECT COUNT(*) as c FROM submissions`).get().c;

  res.json({ inQueue, approved, rejected, total });
});

// ── Approve submission ────────────────────────────────────────────────────────
router.post('/submissions/:id/approve', requireRole('tech_expert', 'editorial_expert'), (req, res) => {
  const { note } = req.body;
  const id = parseInt(req.params.id, 10);

  const sub = db.prepare(`
    SELECT s.*, u.full_name, u.email
    FROM submissions s JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `).get(id);
  if (!sub) return res.status(404).json({ error: 'Не найдено' });

  const isTech = req.user.role === 'tech_expert';

  if (isTech && sub.status !== 'pending') {
    return res.status(400).json({ error: 'Статья не находится в вашей очереди' });
  }
  if (!isTech && sub.status !== 'tech_approved') {
    return res.status(400).json({ error: 'Статья не находится в вашей очереди' });
  }

  if (isTech) {
    db.prepare(`
      UPDATE submissions
      SET status = 'tech_approved', tech_reviewer_id = ?, admin_note = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, note || null, id);

    db.prepare(`INSERT INTO notifications (user_id, submission_id, type, message) VALUES (?, ?, 'info', ?)`)
      .run(sub.user_id, id,
        `Ваша статья «${sub.title}» прошла техническую проверку и передана в редакционный совет.`);

    auditLog(req.user.id, 'tech_approve', 'submission', id, sub.title);
  } else {
    db.prepare(`
      UPDATE submissions
      SET status = 'editorial_approved', editorial_reviewer_id = ?, admin_note = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, note || null, id);

    db.prepare(`INSERT INTO notifications (user_id, submission_id, type, message) VALUES (?, ?, 'info', ?)`)
      .run(sub.user_id, id,
        `Ваша статья «${sub.title}» одобрена редакционным советом и ожидает публикации администратором.`);

    auditLog(req.user.id, 'editorial_approve', 'submission', id, sub.title);
  }

  res.json({ success: true });
});

// ── Reject submission with mandatory reason ───────────────────────────────────
router.post('/submissions/:id/reject', requireRole('tech_expert', 'editorial_expert'), async (req, res) => {
  const { reason } = req.body;
  const id = parseInt(req.params.id, 10);

  if (!reason || !String(reason).trim()) {
    return res.status(400).json({ error: 'Укажите причину отклонения' });
  }

  const sub = db.prepare(`
    SELECT s.*, u.full_name, u.email
    FROM submissions s JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `).get(id);
  if (!sub) return res.status(404).json({ error: 'Не найдено' });

  const isTech = req.user.role === 'tech_expert';

  if (isTech && sub.status !== 'pending') {
    return res.status(400).json({ error: 'Статья не находится в вашей очереди' });
  }
  if (!isTech && sub.status !== 'tech_approved') {
    return res.status(400).json({ error: 'Статья не находится в вашей очереди' });
  }

  const stage = isTech ? 'tech' : 'editorial';
  const stageName = isTech ? 'техническим экспертом' : 'редакционным советом';
  const cleanReason = String(reason).trim();

  db.prepare(`
    UPDATE submissions
    SET status = 'rejected', rejection_reason = ?, rejection_stage = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(cleanReason, stage, id);

  db.prepare(`INSERT INTO notifications (user_id, submission_id, type, message) VALUES (?, ?, 'rejected', ?)`)
    .run(sub.user_id, id,
      `Ваша статья «${sub.title}» возвращена на доработку ${stageName}. Замечание: ${cleanReason}`);

  auditLog(req.user.id, `${stage}_reject`, 'submission', id, `${sub.title} | ${cleanReason}`);

  const emailResult = await sendRejectionEmail(sub.email, sub.full_name, sub.title, sub.journal, cleanReason);
  res.json({ success: true, emailSent: emailResult?.success });
});

module.exports = router;
