const fs = require('fs').promises;
const path = require('path');
const { resolveArchivePath } = require('./archiveStructure');

const COVER_NAMES = ['cover.jpg', 'cover.jpeg', 'cover.png', 'cover.webp'];
const DEFAULT_COVER = '/img/journal-cover.png';
/** URL-путь для браузера (не менять — ссылки в БД) */
const COVERS_URL_PREFIX = '/covers/issues/';
/** Файлы на диске — в uploads (Docker volume с правами на запись), не в public/ */
const COVERS_STORAGE_DIR = path.join(__dirname, '..', 'uploads', 'issue-covers');
const LEGACY_COVERS_DIR = path.join(__dirname, '..', 'public', 'covers', 'issues');

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

async function migrateLegacyCovers() {
  try {
    const legacy = await fs.readdir(LEGACY_COVERS_DIR);
    for (const name of legacy) {
      if (name.startsWith('.')) continue;
      const dest = path.join(COVERS_STORAGE_DIR, name);
      try {
        await fs.access(dest);
      } catch {
        await fs.copyFile(path.join(LEGACY_COVERS_DIR, name), dest);
      }
    }
  } catch {
    /* no legacy dir */
  }
}

async function ensureCoversDir() {
  await fs.mkdir(COVERS_STORAGE_DIR, { recursive: true });
  await migrateLegacyCovers();
}

function coversDir() {
  return COVERS_STORAGE_DIR;
}

function coverFileAbs(coverPath) {
  if (!coverPath || !coverPath.startsWith(COVERS_URL_PREFIX)) return null;
  const name = path.basename(coverPath);
  if (!name || name === '.' || name === '..') return null;
  return path.join(coversDir(), name);
}

async function deleteCoverFileIfLocal(coverPath) {
  const abs = coverFileAbs(coverPath);
  if (!abs) return;
  try {
    await fs.unlink(abs);
  } catch {
    /* ignore */
  }
}

module.exports = {
  DEFAULT_COVER,
  COVERS_URL_PREFIX,
  COVER_NAMES,
  normalizeArchiveFolder,
  findFolderCoverFile,
  buildDbCoverMap,
  resolveCoverUrl,
  ensureCoversDir,
  coversDir,
  coverFileAbs,
  deleteCoverFileIfLocal,
};
