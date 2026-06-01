/**
 * Копирует 14 обложек в папки архива (cover.png) и в public/covers/issues/,
 * затем создаёт/обновляет записи выпусков в БД.
 */
const fs = require('fs');
const path = require('path');
const { parseStemFolderMeta } = require('../lib/sortArchiveFolders');

const ASSETS_DIR = path.join(
  process.env.USERPROFILE || '',
  '.cursor',
  'projects',
  'c-Users-Dirty-Desktop-STEM',
  'assets'
);
const ARCHIVES_ROOT = path.join(__dirname, '..', 'public', 'archives');
const COVERS_DIR = path.join(__dirname, '..', 'public', 'covers', 'issues');

function findCoverAsset(n) {
  if (!fs.existsSync(ASSETS_DIR)) return null;
  const files = fs.readdirSync(ASSETS_DIR);
  const re = new RegExp(`images_${n}-[a-f0-9-]+\\.png$`, 'i');
  const hit = files.find((f) => re.test(f) && f.includes('3102c28b560fdc405b38d88ed8ce8f53'));
  return hit ? path.join(ASSETS_DIR, hit) : null;
}

function listArchiveFolders() {
  return fs.readdirSync(ARCHIVES_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => {
      const ma = parseStemFolderMeta(a);
      const mb = parseStemFolderMeta(b);
      if (ma.year !== mb.year) return ma.year - mb.year;
      if (ma.tom !== mb.tom) return ma.tom - mb.tom;
      if (ma.num !== mb.num) return ma.num - mb.num;
      return a.localeCompare(b, 'ru', { numeric: true });
    });
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function main() {
  const folders = listArchiveFolders();
  if (folders.length !== 14) {
    console.warn(`Expected 14 archive folders, found ${folders.length}. Continuing anyway.`);
  }

  const mappings = [];
  for (let i = 0; i < folders.length; i += 1) {
    const n = i + 1;
    const folder = folders[i];
    const asset = findCoverAsset(n);
    if (!asset) {
      console.error(`Missing asset for cover #${n}`);
      process.exit(1);
    }

    const archiveCover = path.join(ARCHIVES_ROOT, folder, 'cover.png');
    const publicCover = path.join(COVERS_DIR, `${n}.png`);
    copyFile(asset, archiveCover);
    copyFile(asset, publicCover);

    const meta = parseStemFolderMeta(folder);
    const sortOrder = meta.year * 10 + meta.tom;
    const accepting = meta.tom === 6 && meta.num === 2 ? 1 : 0;
    const issuedAt = meta.year > 0 ? `${meta.year}-06-01` : null;

    mappings.push({
      n,
      folder,
      coverPath: `/covers/issues/${n}.png`,
      title: folder,
      sortOrder,
      accepting,
      issuedAt,
    });
    console.log(`#${n} -> ${folder}`);
  }

  console.log('Done:', mappings.length, 'covers installed.');
  console.log('Restart the server to sync the database (or run with the same Node as the app).');
}

main();
