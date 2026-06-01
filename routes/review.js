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

function notifyUser(userId, submissionId, type, message) {
  db.prepare(`
    INSERT INTO notifications (user_id, submission_id, type, message)
    VALUES (?, ?, ?, ?)
  `).run(userId, submissionId, type, message);
}

function notifyAdmins(submissionId, message) {
  const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
  for (const a of admins) {
    notifyUser(a.id, submissionId, 'info', message);
  }
}

// ── Editorial experts list (for tech expert assignment) ───────────────────────
router.get('/editorial-experts', requireRole('tech_expert'), (req, res) => {
  const rows = db.prepare(`
    SELECT id, full_name, email
    FROM users
    WHERE role = 'editorial_expert' AND COALESCE(is_banned, 0) = 0
    ORDER BY full_name COLLATE NOCASE
  `).all();
  res.json(rows);
});

// ── Queue: submissions waiting for this reviewer's stage ─────────────────────
router.get('/queue', requireRole('tech_expert', 'editorial_expert', 'admin'), (req, res) => {
  let rows;

  if (req.user.role === 'tech_expert') {
    rows = db.prepare(`
      SELECT s.id, s.title, s.authors, s.journal, s.abstract, s.status,
             s.submitted_at, s.file_path, s.admin_note,
             s.assigned_editorial_id,
             u.full_name, u.email,
             i.title AS issue_title,
             ae.full_name AS assigned_editorial_name,
             CASE WHEN s.status = 'pending' THEN 1 ELSE 0 END AS can_review
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN issues i ON s.issue_id = i.id
      LEFT JOIN users ae ON s.assigned_editorial_id = ae.id
      WHERE s.status IN ('pending', 'tech_approved')
      ORDER BY
        CASE s.status WHEN 'pending' THEN 0 ELSE 1 END,
        s.submitted_at ASC
    `).all().map(normalizeQueueRow);
  } else if (req.user.role === 'editorial_expert') {
    rows = db.prepare(`
      SELECT s.id, s.title, s.authors, s.journal, s.abstract, s.status,
             s.submitted_at, s.file_path, s.admin_note,
             s.assigned_editorial_id,
             u.full_name, u.email,
             i.title AS issue_title,
             te.full_name AS tech_reviewer_name,
             ae.full_name AS assigned_editorial_name,
             CASE WHEN s.status = 'tech_approved' AND s.assigned_editorial_id = ? THEN 1 ELSE 0 END AS can_review
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN issues i ON s.issue_id = i.id
      LEFT JOIN users te ON s.tech_reviewer_id = te.id
      LEFT JOIN users ae ON s.assigned_editorial_id = ae.id
      WHERE s.status IN ('tech_approved', 'editorial_approved')
      ORDER BY
        CASE WHEN s.status = 'tech_approved' AND s.assigned_editorial_id = ? THEN 0 ELSE 1 END,
        s.submitted_at ASC
    `).all(req.user.id, req.user.id).map(normalizeQueueRow);
  } else {
    rows = db.prepare(`
      SELECT s.id, s.title, s.authors, s.journal, s.abstract, s.status,
             s.submitted_at, s.file_path, s.admin_note,
             u.full_name, u.email,
             i.title AS issue_title
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN issues i ON s.issue_id = i.id
      WHERE s.status = 'editorial_approved'
      ORDER BY s.submitted_at ASC
    `).all().map(normalizeQueueRow);
  }

  res.json(rows);
});

function normalizeQueueRow(row) {
  return {
    ...row,
    can_review: row.can_review === 1 || row.can_review === true,
  };
}

// ── Stats for reviewer ────────────────────────────────────────────────────────
router.get('/stats', requireRole('tech_expert', 'editorial_expert'), (req, res) => {
  const isTech = req.user.role === 'tech_expert';

  const inQueue = isTech
    ? db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status = 'pending'").get().c
    : db.prepare(`
        SELECT COUNT(*) as c FROM submissions
        WHERE status = 'tech_approved' AND assigned_editorial_id = ?
      `).get(req.user.id).c;

  const visible = isTech
    ? db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status IN ('pending', 'tech_approved')").get().c
    : db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status IN ('tech_approved', 'editorial_approved')").get().c;

  const approved = isTech
    ? db.prepare(`
        SELECT COUNT(*) as c FROM submissions
        WHERE tech_reviewer_id = ? AND status IN ('tech_approved', 'editorial_approved', 'published')
      `).get(req.user.id).c
    : db.prepare(`
        SELECT COUNT(*) as c FROM submissions
        WHERE editorial_reviewer_id = ? AND status IN ('editorial_approved', 'published')
      `).get(req.user.id).c;

  const rejected = db.prepare(`
    SELECT COUNT(*) as c FROM submissions
    WHERE status = 'rejected' AND rejection_stage = ?
  `).get(isTech ? 'tech' : 'editorial').c;

  const total = db.prepare('SELECT COUNT(*) as c FROM submissions').get().c;

  res.json({ inQueue, visible, approved, rejected, total });
});

// ── Approve submission ────────────────────────────────────────────────────────
router.post('/submissions/:id/approve', requireRole('tech_expert', 'editorial_expert'), (req, res) => {
  const { note, editorial_expert_id: editorialExpertIdRaw } = req.body;
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
  if (!isTech && (sub.status !== 'tech_approved' || sub.assigned_editorial_id !== req.user.id)) {
    return res.status(400).json({ error: 'Статья не находится в вашей очереди' });
  }

  if (isTech) {
    const editorialExpertId = parseInt(String(editorialExpertIdRaw || ''), 10);
    if (Number.isNaN(editorialExpertId)) {
      return res.status(400).json({ error: 'Выберите редакционного эксперта для проверки статьи' });
    }
    const edExpert = db.prepare(`
      SELECT id, full_name FROM users
      WHERE id = ? AND role = 'editorial_expert' AND COALESCE(is_banned, 0) = 0
    `).get(editorialExpertId);
    if (!edExpert) {
      return res.status(400).json({ error: 'Некорректный редакционный эксперт' });
    }

    db.prepare(`
      UPDATE submissions
      SET status = 'tech_approved',
          tech_reviewer_id = ?,
          assigned_editorial_id = ?,
          admin_note = ?,
          reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, editorialExpertId, note || null, id);

    notifyUser(
      sub.user_id,
      id,
      'info',
      `Ваша статья «${sub.title}» прошла техническую проверку и передана редакционному эксперту (${edExpert.full_name}).`
    );
    notifyUser(
      editorialExpertId,
      id,
      'info',
      `Вам назначена статья «${sub.title}» для редакционной проверки.`
    );
    const allEditorial = db.prepare(`
      SELECT id FROM users
      WHERE role = 'editorial_expert' AND COALESCE(is_banned, 0) = 0 AND id != ?
    `).all(editorialExpertId);
    for (const ed of allEditorial) {
      notifyUser(
        ed.id,
        id,
        'info',
        `Новая статья «${sub.title}» на редакционной проверке (назначена: ${edExpert.full_name}).`
      );
    }

    auditLog(req.user.id, 'tech_approve', 'submission', id, `${sub.title} → ${edExpert.full_name}`);
  } else {
    db.prepare(`
      UPDATE submissions
      SET status = 'editorial_approved',
          editorial_reviewer_id = ?,
          admin_note = ?,
          reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, note || null, id);

    notifyUser(
      sub.user_id,
      id,
      'info',
      `Ваша статья «${sub.title}» одобрена редакционным советом и ожидает публикации администратором.`
    );
    notifyAdmins(
      id,
      `Статья «${sub.title}» одобрена обоими экспертами и готова к публикации.`
    );

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
  if (!isTech && (sub.status !== 'tech_approved' || sub.assigned_editorial_id !== req.user.id)) {
    return res.status(400).json({ error: 'Статья не находится в вашей очереди' });
  }

  const stage = isTech ? 'tech' : 'editorial';
  const stageName = isTech ? 'техническим экспертом' : 'редакционным советом';
  const cleanReason = String(reason).trim();

  db.prepare(`
    UPDATE submissions
    SET status = 'rejected',
        rejection_reason = ?,
        rejection_stage = ?,
        assigned_editorial_id = NULL,
        reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(cleanReason, stage, id);

  notifyUser(
    sub.user_id,
    id,
    'rejected',
    `Ваша статья «${sub.title}» возвращена на доработку ${stageName}. Замечание: ${cleanReason}`
  );

  auditLog(req.user.id, `${stage}_reject`, 'submission', id, `${sub.title} | ${cleanReason}`);

  const emailResult = await sendRejectionEmail(sub.email, sub.full_name, sub.title, sub.journal, cleanReason);
  res.json({ success: true, emailSent: emailResult?.success });
});

module.exports = router;
