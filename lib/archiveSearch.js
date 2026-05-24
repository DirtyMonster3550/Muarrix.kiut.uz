const fs = require('fs').promises;
const path = require('path');
const { discoverIssuesInDir } = require('./archiveStructure');
const { getArticleMetadata, loadFolderArticleIndex } = require('./articleMetadata');
const { ALLOWED_EXT, resolveArchivePath } = require('./archiveStructure');

let cachedIndex = null;
let cacheTime = 0;
const CACHE_MS = 5 * 60 * 1000;

async function listArticlesInFolder(root, folderRel, issueMeta) {
  const resolved = resolveArchivePath(root, folderRel);
  if (!resolved) return [];

  const folderIndex = await loadFolderArticleIndex(resolved);
  let dirents;
  try {
    dirents = await fs.readdir(resolved, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = dirents
    .filter((f) => f.isFile() && !f.name.startsWith('.'))
    .filter((f) => ALLOWED_EXT.has(path.extname(f.name).toLowerCase()))
    .filter((f) => !f.name.toLowerCase().endsWith('.json'));

  const articles = await Promise.all(
    files.map(async (f) => {
      const meta = await getArticleMetadata(resolved, f.name, folderIndex);
      const authors = meta.authors || [];
      return {
        folder: folderRel,
        file: f.name,
        ext: path.extname(f.name).toLowerCase(),
        title: meta.title || f.name,
        authors,
        authorsText: authors.join(' '),
        year: issueMeta.year,
        tom: issueMeta.tom,
        num: issueMeta.num,
      };
    })
  );

  return articles;
}

async function buildArchiveIndex(root) {
  const now = Date.now();
  if (cachedIndex && now - cacheTime < CACHE_MS) {
    return cachedIndex;
  }

  const issues = await discoverIssuesInDir(root);
  const articles = [];
  for (const issue of issues) {
    const batch = await listArticlesInFolder(root, issue.folder, issue);
    articles.push(...batch);
  }

  const years = [...new Set(articles.map((a) => a.year).filter((y) => y > 0))].sort((a, b) => b - a);

  cachedIndex = { articles, years, issueCount: issues.length };
  cacheTime = now;
  return cachedIndex;
}

function normalizeQuery(q) {
  if (typeof q !== 'string') return '';
  return q.trim().toLowerCase();
}

function matchesArticle(article, q) {
  if (!q) return true;
  const haystack = [article.title, article.authorsText, article.file, article.folder]
    .join(' ')
    .toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  return terms.every((term) => haystack.includes(term));
}

function searchArchive(articles, options = {}) {
  const q = normalizeQuery(options.q);
  const year = options.year ? Number(options.year) : null;
  const tom = options.tom ? Number(options.tom) : null;
  const num = options.num ? Number(options.num) : null;

  let results = articles;

  if (year && !Number.isNaN(year)) {
    results = results.filter((a) => a.year === year);
  }
  if (tom && !Number.isNaN(tom)) {
    results = results.filter((a) => a.tom === tom);
  }
  if (num && !Number.isNaN(num)) {
    results = results.filter((a) => a.num === num);
  }
  if (q) {
    results = results.filter((a) => matchesArticle(a, q));
  }

  results.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    if (a.tom !== b.tom) return a.tom - b.tom;
    if (a.num !== b.num) return a.num - b.num;
    return a.title.localeCompare(b.title, 'ru', { sensitivity: 'base' });
  });

  return results;
}

function invalidateArchiveIndexCache() {
  cachedIndex = null;
  cacheTime = 0;
}

module.exports = {
  buildArchiveIndex,
  searchArchive,
  invalidateArchiveIndexCache,
};
