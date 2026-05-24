const path = require('path');

/** Каталог выпусков: PDF архив. Env FILE_ARCHIVE_ROOT / ARCHIVES_STATIC_DIR — абсолютный путь. Иначе public/archives приложения. */
function archivesDirectory() {
  const envRoot = process.env.FILE_ARCHIVE_ROOT || process.env.ARCHIVES_STATIC_DIR;
  if (envRoot && String(envRoot).trim()) {
    return path.resolve(envRoot.trim());
  }
  return path.join(__dirname, '..', 'public', 'archives');
}

module.exports = { archivesDirectory };
