const fs = require('fs').promises;
const path = require('path');
const { resolveArchivePath } = require('./archiveStructure');

const COVER_NAMES = ['cover.jpg', 'cover.jpeg', 'cover.png', 'cover.webp'];
const DEFAULT_COVER = '/img/journal-cover.png';
const COVERS_PUBLIC_DIR = path.join(__dirname, '..', 'public', 'covers', 'issues');

function normalizeArchiveFolder(rel) {
  if (typeof rel !== 'string' || !rel.trim()) return null;
  return rel.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

function encodeArchiveUrl(folderRel, fileName) {
  const parts = folderRel.split('/').filter(Boolean).map((p) => encodeURIComponent(p));
  return `/archives/${parts.join('/')}/${encodeURIComponent(fileName)}`;
}

async function findFolderCoverFile(archiveRoot, folderRel) {
  const resolved = resolveArchivePath(archiveRoot, folderRel);
  if (!resolved) return null;
  for (const name of COVER_NAMES) {
    try {
      await fs.access(path.join(resolved, name));
      return encodeArchiveUrl(folderRel, name);
    } catch {
      /* next */
    }
  }
  return null;
}

function buildDbCoverMap(db) {
  const rows = db.prepare(`
    SELECT id, cover_image, archive_folder
    FROM issues
    WHERE cover_image IS NOT NULL OR archive_folder IS NOT NULL
  `).all();
  const byFolder = new Map();
  for (const row of rows) {
    const folder = normalizeArchiveFolder(row.archive_folder);
    if (folder && row.cover_image) byFolder.set(folder, row.cover_image);
  }
  return byFolder;
}

async function resolveCoverUrl({ folder, archiveRoot, dbCoverByFolder }) {
  const normalized = normalizeArchiveFolder(folder);
  if (!normalized) return DEFAULT_COVER;

  const fromDb = dbCoverByFolder.get(normalized);
  if (fromDb) return fromDb;

  const fromFolder = await findFolderCoverFile(archiveRoot, normalized);
  if (fromFolder) return fromFolder;

  return DEFAULT_COVER;
}

async function ensureCoversDir() {
  await fs.mkdir(COVERS_PUBLIC_DIR, { recursive: true });
}

function coversDir() {
  return COVERS_PUBLIC_DIR;
}

async function deleteCoverFileIfLocal(coverPath) {
  if (!coverPath || !coverPath.startsWith('/covers/issues/')) return;
  const abs = path.join(__dirname, '..', 'public', coverPath.replace(/^\//, '').split('/').join(path.sep));
  try {
    await fs.unlink(abs);
  } catch {
    /* ignore */
  }
}

module.exports = {
  DEFAULT_COVER,
  COVER_NAMES,
  normalizeArchiveFolder,
  findFolderCoverFile,
  buildDbCoverMap,
  resolveCoverUrl,
  ensureCoversDir,
  coversDir,
  deleteCoverFileIfLocal,
};
