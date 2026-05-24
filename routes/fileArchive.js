const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { archivesDirectory } = require('../lib/paths');
const {
  ALLOWED_EXT,
  resolveArchivePath,
  discoverIssuesInDir,
  groupIssuesByYearTom,
} = require('../lib/archiveStructure');
const { getArticleMetadata, loadFolderArticleIndex } = require('../lib/articleMetadata');
const { buildArchiveIndex, searchArchive } = require('../lib/archiveSearch');

const ARCHIVES_ROOT = archivesDirectory();

async function listFilesInFolder(folderRel) {
  const resolved = resolveArchivePath(ARCHIVES_ROOT, folderRel);
  if (!resolved) return null;
  let st;
  try {
    st = await fs.stat(resolved);
  } catch {
    return null;
  }
  if (!st.isDirectory()) return null;

  const folderIndex = await loadFolderArticleIndex(resolved);
  const dirents = await fs.readdir(resolved, { withFileTypes: true });
  const files = dirents
    .filter((f) => f.isFile() && !f.name.startsWith('.'))
    .filter((f) => ALLOWED_EXT.has(path.extname(f.name).toLowerCase()))
    .filter((f) => !f.name.toLowerCase().endsWith('.json'));

  const enriched = await Promise.all(
    files.map(async (f) => {
      const meta = await getArticleMetadata(resolved, f.name, folderIndex);
      return {
        name: f.name,
        ext: path.extname(f.name).toLowerCase(),
        title: meta.title,
        authors: meta.authors,
      };
    })
  );

  return enriched.sort((a, b) => a.name.localeCompare(b.name, 'ru', { numeric: true }));
}

router.get('/issues', async (_req, res) => {
  try {
    const discovered = await discoverIssuesInDir(ARCHIVES_ROOT);
    const groups = groupIssuesByYearTom(discovered);
    const issues = discovered.map(({ folder, fileCount, year, tom, num, label }) => ({
      folder,
      fileCount,
      year,
      tom,
      num,
      label,
    }));
    res.json({ groups, issues });
  } catch (e) {
    console.error('[file-archive]', e);
    res.status(500).json({ error: 'Не удалось прочитать каталог архива' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { articles, years } = await buildArchiveIndex(ARCHIVES_ROOT);
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const year = typeof req.query.year === 'string' ? req.query.year : '';
    const tom = typeof req.query.tom === 'string' ? req.query.tom : '';

    const results = searchArchive(articles, { q, year, tom }).map((a) => ({
      title: a.title,
      authors: a.authors,
      file: a.file,
      ext: a.ext,
      folder: a.folder,
      year: a.year,
      tom: a.tom,
      num: a.num,
      issueLabel: formatIssueLabel(a),
    }));

    res.json({ q, year, tom, years, count: results.length, results });
  } catch (e) {
    console.error('[file-archive search]', e);
    res.status(500).json({ error: 'Ошибка поиска по архиву' });
  }
});

function formatIssueLabel(a) {
  const parts = [];
  if (a.year > 0) parts.push(String(a.year));
  if (a.tom > 0) parts.push(`Том ${a.tom}`);
  if (a.num > 0) parts.push(`№ ${a.num}`);
  return parts.join(' · ') || a.folder;
}

router.get('/issue', async (req, res) => {
  const folder = typeof req.query.folder === 'string' ? req.query.folder : '';
  if (!folder.trim()) {
    return res.status(400).json({ error: 'Укажите параметр folder' });
  }
  try {
    const files = await listFilesInFolder(folder);
    if (files === null) {
      return res.status(404).json({ error: 'Выпуск не найден' });
    }
    res.json({ folder, files });
  } catch (e) {
    console.error('[file-archive]', e);
    res.status(500).json({ error: 'Ошибка чтения выпуска' });
  }
});

module.exports = router;
