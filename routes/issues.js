const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

// Публичный список выпусков (архив)
router.get('/', (req, res) => {
  const journal = typeof req.query.journal === 'string' ? req.query.journal.trim() : '';
  let sql = `
    SELECT id, journal, title, description, sort_order, accepting_submissions, issued_at, created_at
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
    SELECT id, journal, title, description, issued_at
    FROM issues
    WHERE accepting_submissions = 1 AND journal = ?
    ORDER BY sort_order DESC, id DESC
  `).all(journal);
  res.json(rows);
});

module.exports = router;
