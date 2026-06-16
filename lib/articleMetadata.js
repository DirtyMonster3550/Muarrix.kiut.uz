const fs = require('fs').promises;
const path = require('path');

const FULL_ISSUE_RE = /^(full\s*issue|полный\s*выпуск|сборник)/i;
const NUMERIC_ONLY_RE = /^[\d.\-]+$/;

function prettyFileMuarrix(muarrix) {
  return muarrix
    .replace(/\+/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+-\s*$/g, '')
    .trim();
}

function looksLikePersonName(text) {
  if (!text || text.length < 4) return false;
  if (/^(pdf|doc|docx|maqola|статья)$/i.test(text)) return false;
  // Фамилия Имя [Отчество] — минимум 2 слова с заглавной
  return /^[A-ZА-ЯЁ][A-Za-zА-Яа-яЁё'-]+\s+[A-ZА-ЯЁ][A-Za-zА-Яа-яЁё'-]+/.test(text.trim());
}

/** Несколько авторов через дефис, точку с запятой и т.д. */
function splitAuthorString(raw) {
  return raw
    .split(/(?:\s*[-–—]\s*|\s*;\s*)/)
    .map((a) => a.replace(/\s+-\s*$/g, '').trim())
    .filter((a) => a && looksLikePersonName(a));
}

function parseTitleDotAuthors(muarrix) {
  const lastDot = muarrix.lastIndexOf('.');
  if (lastDot <= 0 || lastDot >= muarrix.length - 2) return null;

  const titlePart = prettyFileMuarrix(muarrix.slice(0, lastDot)).replace(/\.{2,}\s*$/g, '').trim();
  const authorPart = prettyFileMuarrix(muarrix.slice(lastDot + 1));
  if (!titlePart || !authorPart) return null;

  const authors = splitAuthorString(authorPart);
  if (!authors.length) return null;

  return { title: titlePart, authors };
}

/** «TITLE... Author Name» или «TITLE Author Name» */
function parseTitleSpaceAuthors(muarrix) {
  const pretty = prettyFileMuarrix(muarrix);
  const match = pretty.match(/^(.+?)(?:\.{2,}\s*|\s+)([A-ZА-ЯЁ][A-Za-zА-Яа-яЁё'-]+(?:\s+[A-ZА-ЯЁ][A-Za-zА-Яа-яЁё'-]+)+)\s*$/);
  if (!match) return null;

  const title = match[1].replace(/\.{2,}\s*$/, '').trim();
  const authors = splitAuthorString(match[2]);
  if (!title || !authors.length) return null;
  return { title, authors };
}

function normalizeAuthors(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((a) => String(a).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[,;|/]/)
      .map((a) => a.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeKeywords(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((k) => String(k).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[,;|]/)
      .map((k) => k.trim())
      .filter(Boolean);
  }
  return [];
}

function metaFromStoredRow(row, fileName) {
  const base = fileName.replace(/\.[^.]+$/, '');
  return {
    title: row.title ? String(row.title).trim() : prettyFileMuarrix(base),
    authors: normalizeAuthors(row.authors),
    abstract: row.abstract ? String(row.abstract).trim() : null,
    keywords: normalizeKeywords(row.keywords),
    journal: row.journal ? String(row.journal).trim() : null,
    publishedAt: row.publishedAt || row.published_at || null,
    authorDate: row.authorDate || row.author_date || null,
    submissionId: row.submissionId || row.submission_id || null,
    pages: row.pages ? String(row.pages).trim() : null,
    doi: row.doi ? String(row.doi).trim() : null,
  };
}

/** Эвристика: название и автор(ы) из имени файла. */
function parseFromFilename(fileName) {
  const muarrix = fileName.replace(/\.[^.]+$/, '');
  const pretty = prettyFileMuarrix(muarrix);

  if (!pretty || FULL_ISSUE_RE.test(pretty) || NUMERIC_ONLY_RE.test(pretty)) {
    return { title: pretty || fileName, authors: [] };
  }

  const dotParsed = parseTitleDotAuthors(muarrix);
  if (dotParsed) return dotParsed;

  const spaceParsed = parseTitleSpaceAuthors(muarrix);
  if (spaceParsed) return spaceParsed;

  const parts = muarrix.split('_').map((p) => prettyFileMuarrix(p)).filter(Boolean);
  if (parts.length >= 2) {
    const authorParts = [];
    let titleStart = parts.length;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (/^[A-ZА-ЯЁ][a-zа-яё]*(?:\.[A-ZА-ЯЁa-zа-яё]*)?$/.test(part) || /^[A-ZА-ЯЁ]\.[A-ZА-ЯЁa-zа-яё]+$/.test(part)) {
        authorParts.push(part);
      } else if (authorParts.length && part.length <= 4) {
        authorParts.push(part);
      } else {
        break;
      }
      titleStart = i + 1;
    }
    if (authorParts.length && titleStart < parts.length) {
      return {
        title: parts.slice(titleStart).join(' '),
        authors: authorParts,
      };
    }
  }

  return { title: pretty, authors: [] };
}

async function readJsonSafe(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Метаданные статьи: sidecar .json → articles.json в папке → имя файла.
 */
async function getArticleMetadata(folderAbs, fileName, folderIndex) {
  const base = fileName.replace(/\.[^.]+$/, '');

  const sidecar = await readJsonSafe(path.join(folderAbs, `${base}.json`));
  if (sidecar && (sidecar.title || sidecar.authors || sidecar.abstract)) {
    return metaFromStoredRow(sidecar, fileName);
  }

  if (folderIndex && folderIndex[fileName]) {
    return metaFromStoredRow(folderIndex[fileName], fileName);
  }

  return parseFromFilename(fileName);
}

async function loadFolderArticleIndex(folderAbs) {
  const data = await readJsonSafe(path.join(folderAbs, 'articles.json'));
  if (!data) return null;
  if (data.files && typeof data.files === 'object') return data.files;
  if (Array.isArray(data.articles)) {
    const map = {};
    for (const row of data.articles) {
      if (row && row.file) map[row.file] = row;
    }
    return map;
  }
  return null;
}

module.exports = {
  getArticleMetadata,
  loadFolderArticleIndex,
  parseFromFilename,
  prettyFileMuarrix,
  normalizeAuthors,
  normalizeKeywords,
};
