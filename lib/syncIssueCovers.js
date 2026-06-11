const fs = require('fs');
const path = require('path');
const { parseMuarrixFolderMeta } = require('./sortArchiveFolders');
const { archivesDirectory } = require('./paths');

function listArchiveFolders(archivesRoot) {
  if (!fs.existsSync(archivesRoot)) return [];
  return fs.readdirSync(archivesRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => {
      const ma = parseMuarrixFolderMeta(a);
      const mb = parseMuarrixFolderMeta(b);
      if (ma.year !== mb.year) return ma.year - mb.year;
      if (ma.tom !== mb.tom) return ma.tom - mb.tom;
      if (ma.num !== mb.num) return ma.num - mb.num;
      return a.localeCompare(b, 'ru', { numeric: true });
    });
}

/**
 * Синхронизирует выпуски Muarrix.kiut.uz с папками архива и обложками cover.png / covers/issues/N.png
 */
function syncArchiveIssueCovers(db) {
  const archivesRoot = archivesDirectory();
  const coversDir = path.join(__dirname, '..', 'public', 'covers', 'issues');
  const folders = listArchiveFolders(archivesRoot);
  if (!folders.length) return;

  const updateByFolder = db.prepare(`
    UPDATE issues SET
      title = @title,
      sort_order = @sortOrder,
      accepting_submissions = @accepting,
      issued_at = @issuedAt,
      cover_image = @coverPath,
      archive_folder = @folder
    WHERE archive_folder = @folder
  `);

  const updateByTitle = db.prepare(`
    UPDATE issues SET
      sort_order = @sortOrder,
      accepting_submissions = @accepting,
      issued_at = @issuedAt,
      cover_image = @coverPath,
      archive_folder = @folder
    WHERE title = @title
  `);

  const insert = db.prepare(`
    INSERT INTO issues (journal, title, description, sort_order, accepting_submissions, issued_at, archive_folder, cover_image)
    VALUES ('muarrix', @title, NULL, @sortOrder, @accepting, @issuedAt, @folder, @coverPath)
  `);

  folders.forEach((folder, index) => {
    const n = index + 1;
    const coverInArchive = path.join(archivesRoot, folder, 'cover.png');
    const coverPublic = path.join(coversDir, `${n}.png`);
    if (!fs.existsSync(coverInArchive) && !fs.existsSync(coverPublic)) return;

    const meta = parseMuarrixFolderMeta(folder);
    const sortOrder = (meta.year > 0 ? meta.year : 0) * 10 + (meta.tom > 0 ? meta.tom : 0);
    const accepting = meta.tom === 6 && meta.num === 2 ? 1 : 0;
    const issuedAt = meta.year > 0 ? `${meta.year}-06-01` : null;
    const coverPath = fs.existsSync(coverPublic) ? `/covers/issues/${n}.png` : null;

    const params = {
      title: folder,
      folder,
      coverPath,
      sortOrder,
      accepting,
      issuedAt,
    };

    if (db.prepare('SELECT id FROM issues WHERE archive_folder = ?').get(folder)) {
      updateByFolder.run(params);
      return;
    }
    if (db.prepare('SELECT id FROM issues WHERE title = ?').get(folder)) {
      updateByTitle.run(params);
      return;
    }
    insert.run(params);
  });

  // Только Том 6 № 2 принимает статьи
  db.prepare(`
    UPDATE issues SET accepting_submissions = 0
    WHERE journal = 'muarrix' AND (archive_folder IS NULL OR archive_folder NOT LIKE '%Том 6 № 2%')
  `).run();
  db.prepare(`
    UPDATE issues SET accepting_submissions = 1
    WHERE journal = 'muarrix' AND archive_folder LIKE '%Том 6 № 2%'
  `).run();

  const latestCover = path.join(coversDir, `${folders.length}.png`);
  const defaultCover = path.join(__dirname, '..', 'public', 'img', 'journal-cover.png');
  if (fs.existsSync(latestCover)) {
    fs.mkdirSync(path.dirname(defaultCover), { recursive: true });
    fs.copyFileSync(latestCover, defaultCover);
  }
}

module.exports = { syncArchiveIssueCovers, listArchiveFolders };
