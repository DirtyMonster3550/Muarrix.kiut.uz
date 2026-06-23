const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { archivesDirectory } = require('./paths');
const { resolveArchivePath, safeRelativePath } = require('./archiveStructure');
const { normalizeAuthors, normalizeKeywords } = require('./articleMetadata');
const { invalidateArchiveIndexCache } = require('./archiveSearch');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const ARCHIVE_EXTS = new Set(['.pdf']);

function slugifyForFilename(text, maxLen = 72) {
  const t = String(text || '')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
  return t || 'article';
}

async function readArticlesJson(folderAbs) {
  const p = path.join(folderAbs, 'articles.json');
  try {
    const raw = await fs.readFile(p, 'utf8');
    const data = JSON.parse(raw);
    if (data.files && typeof data.files === 'object') return data.files;
    if (Array.isArray(data.articles)) {
      const files = {};
      for (const row of data.articles) {
        if (row && row.file) files[row.file] = row;
      }
      return files;
    }
    return {};
  } catch {
    return {};
  }
}

async function writeArticlesJson(folderAbs, filesMap) {
  const payload = {
    updatedAt: new Date().toISOString(),
    files: filesMap,
  };
  await fs.writeFile(
    path.join(folderAbs, 'articles.json'),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );
}

async function pickArchiveFileName(folderAbs, title, ext) {
  const base = slugifyForFilename(title);
  let name = `${base}${ext}`;
  let n = 1;
  while (fsSync.existsSync(path.join(folderAbs, name))) {
    n += 1;
    name = `${base} (${n})${ext}`;
  }
  return name;
}

function authorsFromSubmission(authorsField) {
  return normalizeAuthors(
    String(authorsField || '')
      .split(/[,;]/)
      .map((a) => a.trim())
      .filter(Boolean)
  );
}

/**
 * Копирует файл статьи в public/archives/{issue.archive_folder}/ и обновляет articles.json.
 */
async function publishSubmissionToArchive(submissionId, db) {
  const sub = db.prepare(`
    SELECT s.*, i.archive_folder, i.title AS issue_title
    FROM submissions s
    LEFT JOIN issues i ON s.issue_id = i.id
    WHERE s.id = ?
  `).get(submissionId);

  if (!sub) return { ok: false, error: 'Статья не найдена' };

  const srcRel = String(sub.published_pdf_path || '').trim();
  if (!srcRel) {
    return { ok: false, error: 'Загрузите PDF файл для публикации в архиве' };
  }

  const folderRel = safeRelativePath(String(sub.archive_folder || '').trim());
  if (!folderRel) {
    return {
      ok: false,
      error: 'У выпуска не указана папка архива. Задайте «Папка в архиве» в разделе «Выпуски».',
    };
  }

  const archiveRoot = archivesDirectory();
  const folderAbs = resolveArchivePath(archiveRoot, folderRel);
  if (!folderAbs) return { ok: false, error: 'Некорректный путь папки архива' };

  const srcPath = path.join(UPLOADS_DIR, path.basename(srcRel));
  if (!fsSync.existsSync(srcPath)) {
    return { ok: false, error: 'PDF файл публикации не найден на сервере' };
  }

  const ext = path.extname(srcRel).toLowerCase();
  if (!ARCHIVE_EXTS.has(ext)) {
    return { ok: false, error: 'Формат файла не поддерживается в публичном архиве' };
  }

  await fs.mkdir(folderAbs, { recursive: true });

  let archiveFileName = sub.published_archive_file;
  if (archiveFileName && fsSync.existsSync(path.join(folderAbs, archiveFileName))) {
    invalidateArchiveIndexCache();
    return { ok: true, archiveFile: archiveFileName, folder: folderRel, skipped: true };
  }

  archiveFileName = await pickArchiveFileName(folderAbs, sub.title, ext);
  await fs.copyFile(srcPath, path.join(folderAbs, archiveFileName));

  const files = await readArticlesJson(folderAbs);
  files[archiveFileName] = {
    file: archiveFileName,
    title: sub.title,
    authors: authorsFromSubmission(sub.authors),
    abstract: sub.abstract ? String(sub.abstract).trim() : null,
    journal: sub.journal ? String(sub.journal).trim() : 'Muarrix.kiut.uz',
    authorDate: sub.author_date || null,
    submissionId: sub.id,
    publishedAt: sub.published_at || new Date().toISOString(),
  };
  await writeArticlesJson(folderAbs, files);

  db.prepare('UPDATE submissions SET published_archive_file = ? WHERE id = ?').run(archiveFileName, sub.id);
  invalidateArchiveIndexCache();

  return { ok: true, archiveFile: archiveFileName, folder: folderRel };
}

/** Синхронизировать все опубликованные статьи без файла в архиве (для уже опубликованных ранее). */
async function syncPublishedToArchive(db) {
  const rows = db.prepare(`
    SELECT id FROM submissions
    WHERE status = 'published'
      AND (published_archive_file IS NULL OR TRIM(published_archive_file) = '')
      AND published_pdf_path IS NOT NULL AND TRIM(published_pdf_path) != ''
  `).all();

  const results = { ok: 0, failed: [] };
  for (const row of rows) {
    const r = await publishSubmissionToArchive(row.id, db);
    if (r.ok) results.ok += 1;
    else results.failed.push({ id: row.id, error: r.error });
  }
  return results;
}

/**
 * Быстрая публикация PDF в архив выпуска (минуя экспертизу и подачу).
 */
async function publishPdfToIssueArchive(db, options = {}) {
  const issueId = Number(options.issueId);
  if (!Number.isFinite(issueId)) {
    return { ok: false, error: 'Укажите выпуск журнала' };
  }

  let pdfBytes = null;
  if (options.pdfBuffer && Buffer.isBuffer(options.pdfBuffer) && options.pdfBuffer.length) {
    pdfBytes = options.pdfBuffer;
  } else {
    const pdfSourcePath = options.pdfSourcePath;
    if (!pdfSourcePath || !fsSync.existsSync(pdfSourcePath)) {
      return { ok: false, error: 'PDF-файл не найден' };
    }
    pdfBytes = await fs.readFile(pdfSourcePath);
  }

  const title = String(options.title || '').trim();
  if (!title) return { ok: false, error: 'Укажите название статьи' };

  const issue = db.prepare('SELECT id, title, archive_folder FROM issues WHERE id = ?').get(issueId);
  if (!issue) return { ok: false, error: 'Выпуск не найден' };

  const folderRel = safeRelativePath(String(issue.archive_folder || '').trim());
  if (!folderRel) {
    return {
      ok: false,
      error: 'У выпуска не задана «Папка в архиве». Откройте «Выпуски журналов» и укажите папку.',
    };
  }

  const archiveRoot = archivesDirectory();
  const folderAbs = resolveArchivePath(archiveRoot, folderRel);
  if (!folderAbs) return { ok: false, error: 'Некорректный путь папки архива' };

  if (
    pdfBytes.length < 4
    || pdfBytes[0] !== 0x25
    || pdfBytes[1] !== 0x50
    || pdfBytes[2] !== 0x44
    || pdfBytes[3] !== 0x46
  ) {
    return { ok: false, error: 'Файл не является корректным PDF' };
  }

  await fs.mkdir(folderAbs, { recursive: true });

  const archiveFileName = await pickArchiveFileName(folderAbs, title, '.pdf');
  await fs.writeFile(path.join(folderAbs, archiveFileName), pdfBytes);

  const files = await readArticlesJson(folderAbs);
  files[archiveFileName] = {
    file: archiveFileName,
    title,
    authors: normalizeAuthors(options.authors),
    abstract: options.abstract ? String(options.abstract).trim() : '',
    keywords: normalizeKeywords(options.keywords),
    journal: 'Muarrix.kiut.uz',
    publishedAt: new Date().toISOString(),
    quickPublish: true,
  };
  await writeArticlesJson(folderAbs, files);
  invalidateArchiveIndexCache();

  return {
    ok: true,
    archiveFile: archiveFileName,
    folder: folderRel,
    issueTitle: issue.title,
  };
}

module.exports = { publishSubmissionToArchive, syncPublishedToArchive, publishPdfToIssueArchive };
