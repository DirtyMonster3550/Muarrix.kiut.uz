const path = require('path');
const { archivesDirectory } = require('./paths');
const { resolveArchivePath } = require('./archiveStructure');
const { getArticleMetadata, loadFolderArticleIndex, normalizeAuthors, normalizeKeywords } = require('./articleMetadata');
const { buildDbCoverMap, resolveCoverUrl } = require('./issueCovers');

function normalizeFolder(folder) {
  return String(folder || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

function buildDownloadUrl(folderRel, fileName) {
  const parts = normalizeFolder(folderRel).split('/').filter(Boolean).map((p) => encodeURIComponent(p));
  return `/archives/${parts.join('/')}/${encodeURIComponent(fileName)}`;
}

function authorsFromDbField(authorsField) {
  return normalizeAuthors(
    String(authorsField || '')
      .split(/[,;]/)
      .map((a) => a.trim())
      .filter(Boolean)
  );
}

function pickFirst(...values) {
  for (const v of values) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return null;
}

function pickAuthors(...lists) {
  for (const list of lists) {
    const normalized = Array.isArray(list) ? list.filter(Boolean) : authorsFromDbField(list);
    if (normalized.length) return normalized;
  }
  return [];
}

async function getArchiveArticleDetail(db, folderRel, fileName) {
  const folder = normalizeFolder(folderRel);
  const file = String(fileName || '').trim();
  if (!folder || !file) return null;

  const archiveRoot = archivesDirectory();
  const folderAbs = resolveArchivePath(archiveRoot, folder);
  if (!folderAbs) return null;

  const folderIndex = await loadFolderArticleIndex(folderAbs);
  const fileMeta = await getArticleMetadata(folderAbs, file, folderIndex);

  let dbRow = null;
  if (fileMeta.submissionId) {
    dbRow = db.prepare(`
      SELECT s.*, i.title AS issue_title, i.issued_at, i.archive_folder, i.cover_image
      FROM submissions s
      LEFT JOIN issues i ON s.issue_id = i.id
      WHERE s.id = ? AND s.status = 'published'
    `).get(fileMeta.submissionId);
  }
  if (!dbRow) {
    dbRow = db.prepare(`
      SELECT s.*, i.title AS issue_title, i.issued_at, i.archive_folder, i.cover_image
      FROM submissions s
      LEFT JOIN issues i ON s.issue_id = i.id
      WHERE s.status = 'published'
        AND s.published_archive_file = ?
        AND REPLACE(TRIM(COALESCE(i.archive_folder, '')), '\\', '/') = ?
    `).get(file, folder);
  }

  const issueRow = db.prepare(`
    SELECT id, title, archive_folder, cover_image, issued_at
    FROM issues
    WHERE REPLACE(TRIM(COALESCE(archive_folder, '')), '\\', '/') = ?
    LIMIT 1
  `).get(folder);

  const dbCoverByFolder = buildDbCoverMap(db);
  const coverUrl = await resolveCoverUrl({ folder, archiveRoot, dbCoverByFolder });

  const ext = path.extname(file).toLowerCase();
  const issueTitle = pickFirst(dbRow?.issue_title, issueRow?.title, folder.split('/').pop());
  const journal = pickFirst(dbRow?.journal, fileMeta.journal, 'Muarrix.kiut.uz');

  return {
    folder,
    file,
    ext,
    title: pickFirst(dbRow?.title, fileMeta.title, file),
    authors: pickAuthors(dbRow?.authors, fileMeta.authors),
    abstract: pickFirst(dbRow?.abstract, fileMeta.abstract),
    keywords: normalizeKeywords(fileMeta.keywords),
    journal,
    authorDate: pickFirst(dbRow?.author_date, fileMeta.authorDate),
    submittedAt: dbRow?.submitted_at || null,
    publishedAt: pickFirst(dbRow?.published_at, fileMeta.publishedAt),
    pages: fileMeta.pages || null,
    doi: fileMeta.doi || null,
    submissionId: dbRow?.id || fileMeta.submissionId || null,
    issue: {
      id: issueRow?.id || dbRow?.issue_id || null,
      title: issueTitle,
      folder,
      issuedAt: pickFirst(issueRow?.issued_at, dbRow?.issued_at),
      coverUrl,
    },
    downloadUrl: buildDownloadUrl(folder, file),
  };
}

module.exports = {
  getArchiveArticleDetail,
  buildDownloadUrl,
  normalizeFolder,
};
