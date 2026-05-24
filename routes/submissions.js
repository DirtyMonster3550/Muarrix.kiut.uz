const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../db/database');
const { requireAuth } = require('./auth');

// ── File magic-byte signatures ────────────────────────────────────────────────
// We read the first 8 bytes of the saved file and verify the real format,
// so attackers cannot bypass the filter by just renaming a .php to .pdf.
const MAGIC = {
  pdf:  [0x25, 0x50, 0x44, 0x46],                         // %PDF
  doc:  [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // OLE2 (old .doc)
  docx: [0x50, 0x4B, 0x03, 0x04],                         // ZIP (OOXML)
};

function readMagic(filePath, n) {
  const buf = Buffer.alloc(n);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buf, 0, n, 0);
  fs.closeSync(fd);
  return buf;
}

function isAllowedMime(filePath, ext) {
  try {
    if (ext === '.pdf') {
      const b = readMagic(filePath, 4);
      return MAGIC.pdf.every((v, i) => b[i] === v);
    }
    if (ext === '.doc') {
      const b = readMagic(filePath, 8);
      return MAGIC.doc.every((v, i) => b[i] === v);
    }
    if (ext === '.docx') {
      const b = readMagic(filePath, 4);
      return MAGIC.docx.every((v, i) => b[i] === v);
    }
    return false;
  } catch {
    return false;
  }
}

// ── Multer storage ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    // Use crypto-random suffix so filenames are not guessable
    const crypto = require('crypto');
    const rand = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}_${rand}${ext}`);
  },
});

const ALLOWED_EXTS = ['.pdf', '.doc', '.docx'];
const MAX_AUTHOR_NAMES = 5;

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только PDF, DOC, DOCX файлы'));
    }
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function splitAuthorNames(authors) {
  return String(authors)
    .split(/[,;]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function validateAuthorDate(s) {
  const t = String(s || '').trim();
  if (!t) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

function resolveIssueOrError(journal, issueIdRaw) {
  let issueId = issueIdRaw ? parseInt(String(issueIdRaw), 10) : null;
  if (Number.isNaN(issueId)) issueId = null;

  if (journal === 'stem') {
    if (!issueId) return { error: 'Выберите выпуск журнала STEM' };
    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(issueId);
    if (!issue || issue.journal !== 'stem') return { error: 'Некорректный выпуск' };
    if (!issue.accepting_submissions) return { error: 'Приём статей в этот выпуск закрыт' };
    return { issue_id: issueId };
  }

  if (!issueId) return { issue_id: null };
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(issueId);
  if (!issue || issue.journal !== journal) return { error: 'Некорректный выпуск для выбранного журнала' };
  if (!issue.accepting_submissions) return { error: 'Приём в этот выпуск закрыт' };
  return { issue_id: issueId };
}

// ── Submit article ────────────────────────────────────────────────────────────
router.post('/', requireAuth, upload.single('file'), (req, res) => {
  const { title, authors, journal, abstract, issue_id: issueIdRaw, author_date } = req.body;

  if (!title || !authors || !journal) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }

  // Sanitise text length to prevent DB bloat
  if (title.length > 500) return res.status(400).json({ error: 'Название слишком длинное' });
  if (abstract && abstract.length > 5000) return res.status(400).json({ error: 'Аннотация слишком длинная' });

  const dateOk = validateAuthorDate(author_date);
  if (!dateOk) {
    return res.status(400).json({ error: 'Укажите дату в формате ГГГГ-ММ-ДД' });
  }

  const authorNames = splitAuthorNames(authors);
  if (!authorNames.length) {
    return res.status(400).json({ error: 'Укажите авторов через запятую' });
  }
  if (authorNames.length > MAX_AUTHOR_NAMES) {
    return res.status(400).json({
      error: `Укажите не более ${MAX_AUTHOR_NAMES} авторов (сейчас ${authorNames.length})`,
    });
  }

  const issueRes = resolveIssueOrError(journal, issueIdRaw);
  if (issueRes.error) return res.status(400).json({ error: issueRes.error });

  // ── MIME check (magic bytes) ──────────────────────────────────────────────
  if (req.file) {
    const ext = path.extname(req.file.originalname).toLowerCase();
    const fullPath = req.file.path;
    if (!isAllowedMime(fullPath, ext)) {
      fs.unlinkSync(fullPath); // delete suspicious file immediately
      return res.status(400).json({ error: 'Файл не является корректным PDF/DOC/DOCX' });
    }
  }

  const filePath = req.file ? req.file.filename : null;

  const result = db.prepare(`
    INSERT INTO submissions (user_id, title, authors, journal, abstract, file_path, issue_id, author_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    title,
    authors,
    journal,
    abstract || '',
    filePath,
    issueRes.issue_id,
    dateOk
  );

  db.prepare(`
    INSERT INTO notifications (user_id, submission_id, type, message)
    VALUES (?, ?, 'submitted', ?)
  `).run(req.user.id, result.lastInsertRowid, `Ваша статья "${title}" успешно отправлена на рассмотрение.`);

  res.json({ success: true, id: result.lastInsertRowid });
});

// ── Get my submissions ────────────────────────────────────────────────────────
router.get('/my', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT s.*, i.title AS issue_title
    FROM submissions s
    LEFT JOIN issues i ON s.issue_id = i.id
    WHERE s.user_id = ?
    ORDER BY s.submitted_at DESC
  `).all(req.user.id);
  res.json(rows);
});

// ── Notifications ─────────────────────────────────────────────────────────────
router.get('/notifications', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY sent_at DESC LIMIT 50
  `).all(req.user.id);
  res.json(rows);
});

router.put('/notifications/:id/read', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);
  res.json({ success: true });
});

module.exports = router;
