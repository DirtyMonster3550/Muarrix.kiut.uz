const fs = require('fs').promises;
const path = require('path');
const { resolveArchivePath, safeRelativePath } = require('./archiveStructure');
const { archivesDirectory } = require('./paths');
const { invalidateArchiveIndexCache } = require('./archiveSearch');

const FULL_ISSUE_RE = /^(full\s*issue|полный\s*выпуск|сборник)/i;

function normalizeFullIssueFileName(name) {
  if (name == null) return null;
  const trimmed = String(name).trim();
  if (!trimmed) return null;
  const base = path.basename(trimmed.replace(/\\/g, '/'));
  if (!base || base.includes('..')) return null;
  if (path.extname(base).toLowerCase() !== '.pdf') return null;
  return base;
}

function isFullIssueFileName(fileName, configuredName = null) {
  if (!fileName || typeof fileName !== 'string') return false;
  const base = path.basename(fileName);
  const configured = normalizeFullIssueFileName(configuredName);
  if (configured && base.toLowerCase() === configured.toLowerCase()) return true;
  const stem = base.replace(/\.[^.]+$/i, '');
  return FULL_ISSUE_RE.test(stem);
}

function buildArchiveFileUrl(folderRel, fileName) {
  const parts = String(folderRel || '').split('/').filter(Boolean).map((p) => encodeURIComponent(p));
  return `/archives/${parts.join('/')}/${encodeURIComponent(fileName)}`;
}

async function fileExistsInFolder(folderAbs, fileName) {
  if (!folderAbs || !fileName) return false;
  try {
    const st = await fs.stat(path.join(folderAbs, fileName));
    return st.isFile();
  } catch {
    return false;
  }
}

/**
 * @param {object} issueRow — строка issues с archive_folder и full_issue_file
 * @param {string} archiveRoot
 */
async function resolveFullIssueForIssue(issueRow, archiveRoot) {
  const fileName = normalizeFullIssueFileName(issueRow?.full_issue_file);
  const folderRel = issueRow?.archive_folder
    ? String(issueRow.archive_folder).replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
    : null;

  if (!fileName || !folderRel) {
    return { file: fileName, folder: folderRel, exists: false, pending: !!fileName, url: null };
  }

  const folderAbs = resolveArchivePath(archiveRoot, folderRel);
  if (!folderAbs) {
    return { file: fileName, folder: folderRel, exists: false, pending: true, url: null };
  }

  const exists = await fileExistsInFolder(folderAbs, fileName);
  return {
    file: fileName,
    folder: folderRel,
    exists,
    pending: !exists,
    url: exists ? buildArchiveFileUrl(folderRel, fileName) : null,
  };
}

async function resolveFullIssueByFolder(db, folderRel, archiveRoot) {
  const normalized = String(folderRel || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  if (!normalized) return { file: null, folder: null, exists: false, pending: false, url: null };

  const issueRow = db.prepare(`
    SELECT id, archive_folder, full_issue_file
    FROM issues
    WHERE REPLACE(TRIM(archive_folder), '\\', '/') = ?
    LIMIT 1
  `).get(normalized);

  if (!issueRow) return { file: null, folder: normalized, exists: false, pending: false, url: null };
  return resolveFullIssueForIssue(issueRow, archiveRoot);
}

function isPdfBuffer(buf) {
  return (
    buf
    && buf.length >= 4
    && buf[0] === 0x25
    && buf[1] === 0x50
    && buf[2] === 0x44
    && buf[3] === 0x46
  );
}

/**
 * Сохраняет PDF полного сборника в папку архива выпуска (загрузка через сайт).
 */
async function saveFullIssuePdf(db, issueId, pdfBuffer, options = {}) {
  const id = Number(issueId);
  if (!Number.isFinite(id)) return { ok: false, error: 'Некорректный выпуск' };
  if (!isPdfBuffer(pdfBuffer)) return { ok: false, error: 'Файл не является корректным PDF' };

  const issue = db.prepare('SELECT id, archive_folder, full_issue_file FROM issues WHERE id = ?').get(id);
  if (!issue) return { ok: false, error: 'Выпуск не найден' };

  const folderRel = safeRelativePath(String(issue.archive_folder || '').trim());
  if (!folderRel) {
    return {
      ok: false,
      error: 'У выпуска не задана «Папка в архиве». Сначала укажите папку и сохраните выпуск.',
    };
  }

  const archiveRoot = archivesDirectory();
  const folderAbs = resolveArchivePath(archiveRoot, folderRel);
  if (!folderAbs) return { ok: false, error: 'Некорректный путь папки архива' };

  let fileName = normalizeFullIssueFileName(options.fileName);
  if (!fileName && options.originalName) {
    fileName = normalizeFullIssueFileName(options.originalName);
  }
  if (!fileName) fileName = 'сборник.pdf';

  await fs.mkdir(folderAbs, { recursive: true });

  const oldName = normalizeFullIssueFileName(issue.full_issue_file);
  if (oldName && oldName.toLowerCase() !== fileName.toLowerCase()) {
    try {
      await fs.unlink(path.join(folderAbs, oldName));
    } catch {
      /* ignore */
    }
  }

  await fs.writeFile(path.join(folderAbs, fileName), pdfBuffer);
  db.prepare('UPDATE issues SET full_issue_file = ? WHERE id = ?').run(fileName, id);
  invalidateArchiveIndexCache();

  return { ok: true, file: fileName, folder: folderRel };
}

module.exports = {
  FULL_ISSUE_RE,
  normalizeFullIssueFileName,
  isFullIssueFileName,
  buildArchiveFileUrl,
  resolveFullIssueForIssue,
  resolveFullIssueByFolder,
  saveFullIssuePdf,
  isPdfBuffer,
};
