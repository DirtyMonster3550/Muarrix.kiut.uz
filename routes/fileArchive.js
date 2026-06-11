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
const { buildArchiveIndex } = require('../lib/archiveSearch');
const { smartSearch, findSimilarArticles } = require('../lib/archiveSmartSearch');
const { buildDbCoverMap, resolveCoverUrl } = require('../lib/issueCovers');
const { mergeDbIssuesIntoArchive } = require('../lib/archiveDbMerge');
const { db } = require('../db/database');

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
    const merged = mergeDbIssuesIntoArchive(discovered, db);
    const dbCoverByFolder = buildDbCoverMap(db);
    const enriched = await Promise.all(merged.map(async (issue) => ({
      ...issue,
      coverUrl: await resolveCoverUrl({ folder: issue.folder, archiveRoot: ARCHIVES_ROOT, dbCoverByFolder }),
    })));
    const groups = groupIssuesByYearTom(enriched);
    const issues = enriched.map(({ folder, fileCount, year, tom, num, label, coverUrl }) => ({
      folder,
      fileCount,
      year,
      tom,
      num,
      label,
      coverUrl,
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
    const num = typeof req.query.num === 'string' ? req.query.num : '';

    const results = smartSearch(articles, { q, year, num }).map((a) => ({
      title: a.title,
      authors: a.authors,
      file: a.file,
      ext: a.ext,
      folder: a.folder,
      year: a.year,
      tom: a.tom,
      num: a.num,
      issueLabel: formatIssueLabel(a),
      relevance: a.relevance || 0,
      tags: a.tags || [],
    }));

    res.json({ q, year, num, years, count: results.length, smart: true, results });
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

router.get('/similar', async (req, res) => {
  const folder = typeof req.query.folder === 'string' ? req.query.folder : '';
  const file = typeof req.query.file === 'string' ? req.query.file : '';
  if (!folder.trim() || !file.trim()) {
    return res.status(400).json({ error: 'Укажите folder и file' });
  }

  try {
    const { articles } = await buildArchiveIndex(ARCHIVES_ROOT);
    const target = articles.find((a) => a.folder === folder && a.file === file);
    if (!target) return res.status(404).json({ error: 'Статья не найдена в архиве' });

    const similar = findSimilarArticles(articles, target, 5).map((a) => ({
      title: a.title,
      authors: a.authors,
      file: a.file,
      ext: a.ext,
      folder: a.folder,
      year: a.year,
      tom: a.tom,
      num: a.num,
      issueLabel: formatIssueLabel(a),
      similarity: a.similarity,
      tags: a.tags || [],
    }));

    res.json({ source: { title: target.title, folder, file }, similar });
  } catch (e) {
    console.error('[file-archive similar]', e);
    res.status(500).json({ error: 'Ошибка поиска похожих статей' });
  }
});

router.get('/issue', async (req, res) => {
  const folder = typeof req.query.folder === 'string' ? req.query.folder : '';
  if (!folder.trim()) {
    return res.status(400).json({ error: 'Укажите параметр folder' });
  }
  try {
    let files = await listFilesInFolder(folder);
    if (files === null) {
      const normalized = folder.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
      const issueRow = db.prepare(`
        SELECT id FROM issues
        WHERE REPLACE(TRIM(archive_folder), '\\', '/') = ?
        LIMIT 1
      `).get(normalized);
      if (!issueRow) {
        return res.status(404).json({ error: 'Выпуск не найден' });
      }
      files = [];
    }
    const dbCoverByFolder = buildDbCoverMap(db);
    const coverUrl = await resolveCoverUrl({ folder, archiveRoot: ARCHIVES_ROOT, dbCoverByFolder });
    res.json({ folder, files, coverUrl });
  } catch (e) {
    console.error('[file-archive]', e);
    res.status(500).json({ error: 'Ошибка чтения выпуска' });
  }
});

module.exports = router;
