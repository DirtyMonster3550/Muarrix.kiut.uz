/**
 * Отдельный роутер для выпусков: монтируется на /api/admin/issues до основного admin.
 * Так запросы гарантированно не теряются (Express 5 / порядок маршрутов).
 */
const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { requireAdmin } = require('./adminAuth');

router.get('/', requireAdmin, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM issues ORDER BY sort_order DESC, id DESC').all();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка базы: нет таблицы issues? Перезапустите сервер после обновления.' });
  }
});

const ALLOWED_JOURNALS = ['stem', 'finecs', 'conference'];

router.post('/', requireAdmin, (req, res) => {
  const { journal, title, description, sort_order, accepting_submissions, issued_at } = req.body;
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

  try {
    const r = db.prepare(`
      INSERT INTO issues (journal, title, description, sort_order, accepting_submissions, issued_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(journal, title, description != null ? String(description) : null, ord, acc, when);
    res.json({ success: true, id: r.lastInsertRowid });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Не удалось сохранить выпуск. Проверьте, что сервер перезапущен и миграции БД применились.' });
  }
});

router.put('/:id', requireAdmin, (req, res) => {
  const { journal, title, description, sort_order, accepting_submissions, issued_at } = req.body;
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

  db.prepare(`
    UPDATE issues SET journal = ?, title = ?, description = ?, sort_order = ?, accepting_submissions = ?, issued_at = ?
    WHERE id = ?
  `).run(journal, title, description != null ? String(description) : null, ord, acc, when, id);
  res.json({ success: true });
});

router.delete('/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Некорректный id' });
  const inUse = db.prepare('SELECT COUNT(*) AS c FROM submissions WHERE issue_id = ?').get(id).c;
  if (inUse > 0) {
    return res.status(400).json({ error: 'К выпуску привязаны статьи — удаление невозможно' });
  }
  const r = db.prepare('DELETE FROM issues WHERE id = ?').run(id);
  if (!r.changes) return res.status(404).json({ error: 'Не найдено' });
  res.json({ success: true });
});

module.exports = router;
