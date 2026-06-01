const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../db/database');
const { requireAuth } = require('./auth');

// ── File magic-byte signatures ────────────────────────────────────────────────
// Проверяем первые байты файла, чтобы нельзя было подменить расширение.

function readMagic(filePath, n) {
  const buf = Buffer.alloc(n);
  const fd = fs.openSync(filePath, 'r');
  try {
    const bytesRead = fs.readSync(fd, buf, 0, n, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    fs.closeSync(fd);
  }
}

function validateWordUpload(file) {
  const ext = normalizeUploadExt(file);
  if (!ALLOWED_EXTS.includes(ext)) return { ok: false, reason: 'ext' };

  const fullPath = uploadedFilePath(file);
  let stat;
  try {
    stat = fs.statSync(fullPath);
  } catch {
    return { ok: false, reason: 'missing', fullPath };
  }
  if (!stat.size) return { ok: false, reason: 'empty', fullPath };

  // Блокируем только явный PDF, переименованный в .doc/.docx
  try {
    const head = readMagic(fullPath, 4);
    if (head.length >= 4 && head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46) {
      return { ok: false, reason: 'pdf', fullPath };
    }
  } catch {
    // не удалось прочитать заголовок — всё равно принимаем по расширению
  }

  return { ok: true, fullPath, ext };
}

const ALLOWED_EXTS = ['.doc', '.docx'];
const MAX_AUTHOR_NAMES = 5;
const UPLOADS_DIR = path.join(__dirname, '../uploads');

function uploadedFilePath(file) {
  if (file?.path && fs.existsSync(file.path)) return file.path;
  return path.join(UPLOADS_DIR, file.filename);
}

function extFromUpload(file) {
  let ext = path.extname(file.originalname || '').toLowerCase();
  if (ALLOWED_EXTS.includes(ext)) return ext;
  const mime = String(file.mimetype || '').toLowerCase();
  if (
    mime.includes('wordprocessingml') ||
    mime.includes('ms-word.document') ||
    mime.includes('macroenabled')
  ) {
    return '.docx';
  }
  if (mime === 'application/msword') return '.doc';
  return ext;
}

// ── Multer storage ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const crypto = require('crypto');
    const rand = crypto.randomBytes(16).toString('hex');
    const ext = extFromUpload(file);
    cb(null, `${Date.now()}_${rand}${ext}`);
  },
});

function normalizeUploadExt(file) {
  const fromSaved = path.extname(file.filename || '').toLowerCase();
  if (ALLOWED_EXTS.includes(fromSaved)) return fromSaved;
  return extFromUpload(file);
}

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = extFromUpload(file);
    if (ALLOWED_EXTS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только DOC и DOCX файлы'));
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
    if (!issueId) {
      const open = db.prepare(`
        SELECT id FROM issues
        WHERE journal = 'stem' AND accepting_submissions = 1
        ORDER BY sort_order DESC, id DESC
        LIMIT 1
      `).get();
      if (!open) return { error: 'Сейчас нет выпуска с открытым приёмом статей' };
      issueId = open.id;
    }
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
  const journal = (req.body.journal || 'stem').trim();
  const { title, authors, abstract, issue_id: issueIdRaw, author_date } = req.body;

  if (!title || !authors) {
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

  if (!req.file) {
    return res.status(400).json({ error: 'Прикрепите файл рукописи (DOC или DOCX)' });
  }

  const check = validateWordUpload(req.file);
  if (!check.ok) {
    if (check.fullPath && fs.existsSync(check.fullPath)) fs.unlinkSync(check.fullPath);
    if (check.reason === 'pdf') {
      return res.status(400).json({ error: 'PDF не принимается. Загрузите рукопись в формате DOC или DOCX.' });
    }
    if (check.reason === 'empty') {
      return res.status(400).json({ error: 'Файл пустой. Сохраните документ Word и попробуйте снова.' });
    }
    if (check.reason === 'ext') {
      return res.status(400).json({ error: 'Разрешены только DOC и DOCX файлы' });
    }
    console.error('[upload] file not found:', check.fullPath, req.file?.originalname);
    return res.status(400).json({ error: 'Не удалось сохранить файл. Попробуйте ещё раз.' });
  }

  const filePath = req.file.filename;

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
