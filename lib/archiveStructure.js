const fs = require('fs').promises;
const path = require('path');
const { parseMuarrixFolderMeta } = require('./sortArchiveFolders');

const ALLOWED_EXT = new Set(['.pdf', '.docx', '.doc']);

function safeRelativePath(rel) {
  if (typeof rel !== 'string' || !rel.trim()) return null;
  const normalized = rel.replace(/\\/g, '/').replace(/^\/+/, '');
  const segments = normalized.split('/').filter(Boolean);
  if (!segments.length || segments.some((s) => s === '..' || s === '.')) return null;
  return segments.join('/');
}

function resolveArchivePath(root, relPath) {
  const safe = safeRelativePath(relPath);
  if (!safe) return null;
  const resolved = path.resolve(root, ...safe.split('/'));
  const rootResolved = path.resolve(root);
  if (resolved !== rootResolved && !resolved.startsWith(rootResolved + path.sep)) return null;
  return resolved;
}

function parseFolderMeta(name, relPath) {
  const combined = [relPath, name].filter(Boolean).join(' ');
  const parsed = parseMuarrixFolderMeta(combined);
  let { year, tom, num } = parsed;

  if (year < 0) {
    const y = combined.match(/\b(20\d{2})\b/);
    if (y) year = Number(y[1]);
  }
  if (tom < 0) {
    const t = combined.match(/Том\s*(\d+)/i);
    if (t) tom = Number(t[1]);
  }
  if (num < 0) {
    const n = combined.match(/№\s*(\d+)/i);
    if (n) num = Number(n[1]);
  }

  const displayName = name || relPath || combined;
  let label = displayName;
  if (num > 0) label = `№ ${num}`;
  else if (/^№\s*\d+/i.test(displayName)) label = displayName.match(/^№\s*\d+/i)[0];

  return { year, tom, num, label, displayName };
}

async function countArticleFiles(dirAbs) {
  let count = 0;
  let entries;
  try {
    entries = await fs.readdir(dirAbs, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    if (!entry.isFile() || entry.name.startsWith('.')) continue;
    if (ALLOWED_EXT.has(path.extname(entry.name).toLowerCase())) count++;
  }
  return count;
}

async function discoverIssuesInDir(root, relDir = '') {
  const absDir = relDir ? resolveArchivePath(root, relDir) : path.resolve(root);
  if (!absDir) return [];

  let entries;
  try {
    entries = await fs.readdir(absDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const subdirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith('.'));
  const fileCount = await countArticleFiles(absDir);

  if (fileCount > 0 && relDir) {
    const name = path.basename(relDir);
    const meta = parseFolderMeta(name, relDir.replace(/\\/g, '/'));
    return [{ folder: relDir.replace(/\\/g, '/'), ...meta, fileCount }];
  }

  const issues = [];
  for (const sub of subdirs) {
    const childRel = relDir ? `${relDir}/${sub.name}` : sub.name;
    const childIssues = await discoverIssuesInDir(root, childRel);
    issues.push(...childIssues);
  }
  return issues;
}

function sortIssues(issues) {
  return [...issues].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    if (a.tom !== b.tom) return a.tom - b.tom;
    if (a.num !== b.num) return a.num - b.num;
    return a.folder.localeCompare(b.folder, 'ru', { numeric: true });
  });
}

function groupIssuesByYearTom(issues) {
  const sorted = sortIssues(issues);
  const groups = [];
  const map = new Map();

  for (const issue of sorted) {
    const year = issue.year > 0 ? issue.year : 0;
    const tom = issue.tom > 0 ? issue.tom : 0;
    const key = `${year}-${tom}`;
    if (!map.has(key)) {
      const group = {
        year,
        tom,
        label: year > 0 && tom > 0 ? `${year} · Том ${tom}` : issue.displayName || issue.folder,
        issues: [],
      };
      map.set(key, group);
      groups.push(group);
    }
    map.get(key).issues.push(issue);
  }

  for (const group of groups) {
    group.issues.sort((a, b) => {
      if (a.num !== b.num) return a.num - b.num;
      return a.folder.localeCompare(b.folder, 'ru', { numeric: true });
    });
  }

  groups.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return a.tom - b.tom;
  });

  return groups;
}

module.exports = {
  ALLOWED_EXT,
  safeRelativePath,
  resolveArchivePath,
  parseFolderMeta,
  discoverIssuesInDir,
  sortIssues,
  groupIssuesByYearTom,
  countArticleFiles,
};
