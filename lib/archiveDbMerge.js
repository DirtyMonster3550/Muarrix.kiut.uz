const path = require('path');
const { parseFolderMeta, sortIssues } = require('./archiveStructure');
const { normalizeArchiveFolder } = require('./issueCovers');

/** Добавляет выпуски из БД (archive_folder), которых ещё нет в файловом сканере. */
function mergeDbIssuesIntoArchive(fsIssues, db) {
  const rows = db.prepare(`
    SELECT i.archive_folder,
      (SELECT COUNT(*) FROM submissions s
       WHERE s.issue_id = i.id AND s.status = 'published') AS published_count
    FROM issues i
    WHERE i.archive_folder IS NOT NULL AND TRIM(i.archive_folder) != ''
  `).all();

  const byFolder = new Map(fsIssues.map((issue) => [issue.folder, { ...issue }]));

  for (const row of rows) {
    const folder = normalizeArchiveFolder(row.archive_folder);
    if (!folder) continue;

    const publishedCount = Number(row.published_count) || 0;
    if (byFolder.has(folder)) {
      const existing = byFolder.get(folder);
      if (existing.fileCount < publishedCount) existing.fileCount = publishedCount;
      continue;
    }

    const meta = parseFolderMeta(path.basename(folder), folder);
    byFolder.set(folder, {
      folder,
      ...meta,
      fileCount: publishedCount,
    });
  }

  return sortIssues([...byFolder.values()]);
}

module.exports = { mergeDbIssuesIntoArchive };
