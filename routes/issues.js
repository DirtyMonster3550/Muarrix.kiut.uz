const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

// Публичный список выпусков (архив)
router.get('/', (req, res) => {
  const journal = typeof req.query.journal === 'string' ? req.query.journal.trim() : '';
  let sql = `
    SELECT id, journal, title, description, sort_order, accepting_submissions, issued_at, created_at, cover_image, archive_folder
    FROM issues
    WHERE 1=1
  `;
  const params = [];
  if (journal) {
    sql += ' AND journal = ?';
    params.push(journal);
  }
  sql += ' ORDER BY sort_order DESC, id DESC';
  res.json(db.prepare(sql).all(...params));
});

// Выпуски, в которые сейчас принимают статьи (для формы подачи)
router.get('/open', (req, res) => {
  const journal = typeof req.query.journal === 'string' && req.query.journal.trim()
    ? req.query.journal.trim()
    : 'stem';
  const rows = db.prepare(`
    SELECT id, journal, title, description, issued_at, cover_image, archive_folder
    FROM issues
    WHERE accepting_submissions = 1 AND journal = ?
    ORDER BY sort_order DESC, id DESC
  `).all(journal);
  res.json(rows);
});

// Опубликованные статьи выпуска (для гостей)
router.get('/:id/articles', (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Некорректный id' });

  const issue = db.prepare(`
    SELECT id, journal, title, archive_folder, cover_image, issued_at
    FROM issues WHERE id = ?
  `).get(id);
  if (!issue) return res.status(404).json({ error: 'Выпуск не найден' });

  const rows = db.prepare(`
    SELECT id, title, authors, published_at, published_archive_file
    FROM submissions
    WHERE issue_id = ? AND status = 'published'
    ORDER BY published_at DESC, id DESC
  `).all(id);

  const folder = issue.archive_folder
    ? String(issue.archive_folder).replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
    : null;

  const articles = rows.map((row) => {
    const authors = String(row.authors || '')
      .split(/[,;]/)
      .map((a) => a.trim())
      .filter(Boolean);
    const file = row.published_archive_file || null;
    let downloadUrl = null;
    if (file && folder) {
      const parts = folder.split('/').filter(Boolean).map((p) => encodeURIComponent(p));
      downloadUrl = `/archives/${parts.join('/')}/${encodeURIComponent(file)}`;
    }
    return {
      id: row.id,
      title: row.title,
      authors,
      published_at: row.published_at,
      file,
      downloadUrl,
    };
  });

  res.json({
    issue: {
      id: issue.id,
      title: issue.title,
      archive_folder: folder,
      cover_image: issue.cover_image,
      issued_at: issue.issued_at,
    },
    articles,
  });
});

module.exports = router;
