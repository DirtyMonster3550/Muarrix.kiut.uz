/**
 * Отдельный роутер для выпусков: монтируется на /api/admin/issues до основного admin.
 * Так запросы гарантированно не теряются (Express 5 / порядок маршрутов).
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { db } = require('../db/database');
const { requireAdmin } = require('./adminAuth');
const {
  normalizeArchiveFolder,
  ensureCoversDir,
  coversDir,
  deleteCoverFileIfLocal,
} = require('../lib/issueCovers');

const ALLOWED_JOURNALS = ['muarrix', 'finecs', 'conference'];
const COVER_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

let archiveFoldersCache = { at: 0, folders: [] };
const ARCHIVE_FOLDERS_TTL_MS = 60 * 1000;

ensureCoversDir().catch((e) => console.error('[covers]', e));

const coverStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      fs.mkdirSync(coversDir(), { recursive: true });
      cb(null, coversDir());
    } catch (e) {
      cb(e);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.params.id}${ext}`);
  },
});

const coverUpload = multer({
  storage: coverStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (COVER_EXTS.has(ext)) cb(null, true);
    else cb(new Error('Разрешены только JPG, PNG и WEBP'));
  },
});

router.get('/', requireAdmin, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM issues ORDER BY sort_order DESC, id DESC').all();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка базы: нет таблицы issues? Перезапустите сервер после обновления.' });
  }
});

router.get('/archive-folders', requireAdmin, async (_req, res) => {
  try {
    const now = Date.now();
    if (now - archiveFoldersCache.at < ARCHIVE_FOLDERS_TTL_MS) {
      return res.json(archiveFoldersCache.folders);
    }
    const { archivesDirectory } = require('../lib/paths');
    const { discoverIssuesInDir } = require('../lib/archiveStructure');
    const discovered = await discoverIssuesInDir(archivesDirectory());
    const folders = discovered.map((d) => d.folder).sort((a, b) => a.localeCompare(b, 'ru', { numeric: true }));
    archiveFoldersCache = { at: now, folders };
    res.json(folders);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Не удалось прочитать папки архива' });
  }
});

router.post('/', requireAdmin, (req, res) => {
  const { journal, title, description, sort_order, accepting_submissions, issued_at, archive_folder } = req.body;
  if (!title || !journal) {
    return res.status(400).json({ error: 'Укажите журнал и название выпуска' });
  }
  if (!ALLOWED_JOURNALS.includes(journal)) {
    return res.status(400).json({ error: 'Недопустимое значение журнала' });
  }
  if (String(title).length > 300) return res.status(400).json({ error: 'Название выпуска слишком длинное' });
  if (description && String(description).length > 2000) return res.status(400).json({ error: 'Описание слишком длинное' });
  const acc = accepting_submissions === false || accepting_submissions === 0 || accepting_submissions === '0' ? 0 : 1;
  const ord = Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0;
  const when = issued_at && String(issued_at).trim() ? String(issued_at).trim() : null;
  const folder = normalizeArchiveFolder(archive_folder);

  try {
    const r = db.prepare(`
      INSERT INTO issues (journal, title, description, sort_order, accepting_submissions, issued_at, archive_folder)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(journal, title, description != null ? String(description) : null, ord, acc, when, folder);
    res.json({ success: true, id: r.lastInsertRowid });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Не удалось сохранить выпуск. Проверьте, что сервер перезапущен и миграции БД применились.' });
  }
});

router.put('/:id', requireAdmin, (req, res) => {
  const { journal, title, description, sort_order, accepting_submissions, issued_at, archive_folder } = req.body;
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Некорректный id' });
  if (journal && !ALLOWED_JOURNALS.includes(journal)) {
    return res.status(400).json({ error: 'Недопустимое значение журнала' });
  }
  if (title && String(title).length > 300) return res.status(400).json({ error: 'Название выпуска слишком длинное' });
  if (description && String(description).length > 2000) return res.status(400).json({ error: 'Описание слишком длинное' });
  const ex = db.prepare('SELECT id FROM issues WHERE id = ?').get(id);
  if (!ex) return res.status(404).json({ error: 'Не найдено' });
  const acc = accepting_submissions === false || accepting_submissions === 0 || accepting_submissions === '0' ? 0 : 1;
  const ord = Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0;
  const when = issued_at && String(issued_at).trim() ? String(issued_at).trim() : null;
  const folder = archive_folder != null ? normalizeArchiveFolder(archive_folder) : null;

  db.prepare(`
    UPDATE issues SET journal = ?, title = ?, description = ?, sort_order = ?, accepting_submissions = ?, issued_at = ?, archive_folder = ?
    WHERE id = ?
  `).run(journal, title, description != null ? String(description) : null, ord, acc, when, folder, id);
  res.json({ success: true });
});

router.post('/:id/cover', requireAdmin, (req, res, next) => {
  coverUpload.single('cover')(req, res, (err) => {
    if (err) {
      const msg = err.code === 'EACCES' || err.code === 'EPERM'
        ? 'Нет прав на запись обложки на сервере (uploads/issue-covers). Обратитесь к администратору.'
        : (err.message || 'Ошибка загрузки файла');
      return res.status(400).json({ error: msg });
    }
    next();
  });
}, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Некорректный id' });
  if (!req.file) return res.status(400).json({ error: 'Выберите файл обложки (JPG, PNG или WEBP)' });

  const row = db.prepare('SELECT cover_image, accepting_submissions, journal FROM issues WHERE id = ?').get(id);
  if (!row) {
    try { fs.unlinkSync(req.file.path); } catch { /* ignore */ }
    return res.status(404).json({ error: 'Выпуск не найден' });
  }

  const coverPath = `/covers/issues/${req.file.filename}`;
  if (row.cover_image && row.cover_image !== coverPath) {
    await deleteCoverFileIfLocal(row.cover_image);
    const oldExt = path.extname(row.cover_image);
    const newExt = path.extname(req.file.filename);
    if (oldExt !== newExt) {
      const stale = path.join(coversDir(), `${id}${oldExt}`);
      try { fs.unlinkSync(stale); } catch { /* ignore */ }
    }
  }

  db.prepare('UPDATE issues SET cover_image = ? WHERE id = ?').run(coverPath, id);

  if (row.journal === 'muarrix' && row.accepting_submissions) {
    const siteCover = path.join(__dirname, '..', 'public', 'img', 'journal-cover.png');
    try {
      fs.copyFileSync(req.file.path, siteCover);
    } catch (e) {
      console.error('[covers] journal-cover update:', e.message);
    }
  }

  res.json({ success: true, cover_image: coverPath });
});

router.delete('/bulk-unused', requireAdmin, async (_req, res) => {
  try {
    const rows = db.prepare(`
      SELECT i.id, i.cover_image FROM issues i
      WHERE NOT EXISTS (SELECT 1 FROM submissions s WHERE s.issue_id = i.id)
    `).all();
    for (const row of rows) {
      if (row.cover_image) await deleteCoverFileIfLocal(row.cover_image);
      db.prepare('DELETE FROM issues WHERE id = ?').run(row.id);
    }
    res.json({ success: true, deleted: rows.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Не удалось удалить выпуски' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Некорректный id' });
  const inUse = db.prepare('SELECT COUNT(*) AS c FROM submissions WHERE issue_id = ?').get(id).c;
  if (inUse > 0) {
    return res.status(400).json({ error: 'К выпуску привязаны статьи — удаление невозможно' });
  }
  const row = db.prepare('SELECT cover_image FROM issues WHERE id = ?').get(id);
  const r = db.prepare('DELETE FROM issues WHERE id = ?').run(id);
  if (!r.changes) return res.status(404).json({ error: 'Не найдено' });
  if (row?.cover_image) await deleteCoverFileIfLocal(row.cover_image);
  res.json({ success: true });
});

module.exports = router;
