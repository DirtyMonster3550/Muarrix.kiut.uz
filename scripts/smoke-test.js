/**
 * Автоматическая проверка ключевой логики API (локально, без браузера).
 * Запуск: node scripts/smoke-test.js
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const { init, db } = require('../db/database');

const BASE = process.env.SMOKE_BASE || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const results = [];
let failed = 0;

function ok(name, detail) {
  results.push({ ok: true, name, detail });
}
function fail(name, detail) {
  results.push({ ok: false, name, detail });
  failed += 1;
}

async function api(method, urlPath, { token, body, expectStatus } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + urlPath, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (expectStatus != null && res.status !== expectStatus) {
    throw new Error(`${method} ${urlPath} → ${res.status}, expected ${expectStatus}: ${JSON.stringify(data)}`);
  }
  return { status: res.status, data };
}

async function login(email, password) {
  const { data } = await api('POST', '/api/auth/login', {
    body: { email, password },
    expectStatus: 200,
  });
  if (!data.token) throw new Error(`No token for ${email}`);
  return data.token;
}

function checkDbSchema() {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r) => r.name);
  for (const t of ['users', 'submissions', 'issues', 'notifications', 'settings', 'audit_log']) {
    if (tables.includes(t)) ok(`DB table: ${t}`, 'exists');
    else fail(`DB table: ${t}`, 'missing');
  }
  const subCols = db.prepare('PRAGMA table_info(submissions)').all().map((c) => c.name);
  for (const col of ['issue_id', 'assigned_editorial_id', 'published_archive_file', 'published_at']) {
    if (subCols.includes(col)) ok(`DB column submissions.${col}`, 'exists');
    else fail(`DB column submissions.${col}`, 'missing');
  }
}

function checkStatusValues() {
  const bad = db.prepare(`
    SELECT id, status FROM submissions
    WHERE status NOT IN ('pending','tech_approved','editorial_approved','published','rejected','approved')
  `).all();
  if (bad.length) fail('Submission statuses', `unknown: ${JSON.stringify(bad)}`);
  else ok('Submission statuses', 'all known values');

  const legacyApproved = db.prepare("SELECT COUNT(*) AS c FROM submissions WHERE status = 'approved'").get().c;
  if (legacyApproved > 0) fail('Legacy status approved', `${legacyApproved} rows (should be migrated)`);
  else ok('Legacy status approved', 'none');
}

function checkPublishedArchive() {
  const rows = db.prepare(`
    SELECT s.id, s.title, s.published_archive_file, i.archive_folder
    FROM submissions s
    LEFT JOIN issues i ON s.issue_id = i.id
    WHERE s.status = 'published'
  `).all();
  for (const row of rows) {
    if (!row.archive_folder) {
      fail(`Published #${row.id} archive_folder`, 'issue has no archive_folder');
      continue;
    }
    if (!row.published_archive_file) {
      fail(`Published #${row.id} file`, 'published_archive_file empty — run sync in admin');
      continue;
    }
    const folderAbs = path.join(__dirname, '..', 'public', 'archives', ...row.archive_folder.split('/'));
    const fileAbs = path.join(folderAbs, row.published_archive_file);
    if (fs.existsSync(fileAbs)) ok(`Published #${row.id} on disk`, row.published_archive_file);
    else fail(`Published #${row.id} on disk`, `missing ${fileAbs}`);
  }
  if (!rows.length) ok('Published submissions', 'none (skip file check)');
}

function checkSingleAdmin() {
  const admins = db.prepare("SELECT id, email FROM users WHERE role = 'admin'").all();
  if (admins.length === 1) ok('Single admin', admins[0].email);
  else if (admins.length === 0) fail('Single admin', 'no admin user');
  else fail('Single admin', `${admins.length} admins: ${admins.map((a) => a.email).join(', ')}`);
}

async function checkPublicApi() {
  const endpoints = [
    ['GET', '/api/issues?journal=muarrix'],
    ['GET', '/api/file-archive/issues'],
    ['GET', '/api/announce'],
  ];
  for (const [method, p] of endpoints) {
    const { status } = await api(method, p, { expectStatus: 200 });
    ok(`Public ${method} ${p}`, String(status));
  }
  const issue = db.prepare(`
    SELECT archive_folder FROM issues
    WHERE archive_folder IS NOT NULL AND TRIM(archive_folder) != ''
    LIMIT 1
  `).get();
  if (issue) {
    const folder = encodeURIComponent(issue.archive_folder);
    await api('GET', `/api/file-archive/issue?folder=${folder}`, { expectStatus: 200 });
    ok('Public archive issue', issue.archive_folder);
  }
}

async function checkAuthGuards() {
  await api('GET', '/api/admin/stats', { expectStatus: 401 });
  ok('Admin without token', '401');

  await api('GET', '/api/review/queue', { expectStatus: 401 });
  ok('Review queue without token', '401');
}

async function checkRoleWorkflow() {
  const admin = db.prepare("SELECT email FROM users WHERE role = 'admin' LIMIT 1").get();
  const tech = db.prepare("SELECT email FROM users WHERE role = 'tech_expert' LIMIT 1").get();
  const editorial = db.prepare("SELECT email FROM users WHERE role = 'editorial_expert' LIMIT 1").get();

  if (!admin) {
    fail('Role workflow', 'no admin in DB — skip login tests');
    return;
  }

  // Admin login — try common passwords from env or default
  const adminPass = process.env.ADMIN_PASSWORD || process.env.SMOKE_ADMIN_PASSWORD;
  if (!adminPass) {
    ok('Admin login test', 'skipped (set SMOKE_ADMIN_PASSWORD or ADMIN_PASSWORD)');
  } else {
    try {
      const adminToken = await login(admin.email, adminPass);
      const { data: stats } = await api('GET', '/api/admin/stats', { token: adminToken, expectStatus: 200 });
      if (typeof stats.published === 'number') ok('Admin stats API', `published=${stats.published}`);
      else fail('Admin stats API', JSON.stringify(stats));

      // Admin cannot approve pending (bypass experts)
      const pending = db.prepare("SELECT id FROM submissions WHERE status = 'pending' LIMIT 1").get();
      if (pending) {
        await api('POST', `/api/admin/submissions/${pending.id}/approve`, {
          token: adminToken,
          body: { note: 'test' },
          expectStatus: 400,
        });
        ok('Admin bypass blocked', `pending #${pending.id} → 400`);
      } else {
        ok('Admin bypass blocked', 'no pending row to test');
      }
    } catch (e) {
      fail('Admin login/API', e.message);
    }
  }

  const techPass = process.env.SMOKE_TECH_PASSWORD;
  if (tech && techPass) {
    try {
      const techToken = await login(tech.email, techPass);
      const { data: queue } = await api('GET', '/api/review/queue', { token: techToken, expectStatus: 200 });
      if (Array.isArray(queue)) ok('Tech expert queue', `${queue.length} items`);
      else fail('Tech expert queue', 'not array');
    } catch (e) {
      fail('Tech expert API', e.message);
    }
  } else if (tech) {
    ok('Tech expert API', 'skipped (set SMOKE_TECH_PASSWORD)');
  }

  const edPass = process.env.SMOKE_EDITORIAL_PASSWORD;
  if (editorial && edPass) {
    try {
      const edToken = await login(editorial.email, edPass);
      const { data: queue } = await api('GET', '/api/review/queue', { token: edToken, expectStatus: 200 });
      if (Array.isArray(queue)) {
        const actable = queue.filter((r) => r.can_review);
        ok('Editorial expert queue', `${queue.length} visible, ${actable.length} actionable`);
      } else fail('Editorial expert queue', 'not array');
    } catch (e) {
      fail('Editorial expert API', e.message);
    }
  } else if (editorial) {
    ok('Editorial expert API', 'skipped (set SMOKE_EDITORIAL_PASSWORD)');
  }
}

async function checkUploadsProtected() {
  const row = db.prepare('SELECT file_path FROM submissions WHERE file_path IS NOT NULL LIMIT 1').get();
  if (!row) {
    ok('Uploads protected', 'no files');
    return;
  }
  const { status } = await api('GET', `/uploads/${encodeURIComponent(row.file_path)}`, { expectStatus: 401 });
  ok('Uploads without token', String(status));
}

async function main() {
  init();
  console.log(`Smoke test → ${BASE}\n`);

  checkDbSchema();
  checkStatusValues();
  checkSingleAdmin();
  checkPublishedArchive();

  try {
    await checkPublicApi();
    await checkAuthGuards();
    await checkUploadsProtected();
    await checkRoleWorkflow();
  } catch (e) {
    fail('HTTP connection', e.message);
    console.error('\n⚠ Server not running? Start: npm start\n');
  }

  console.log('─'.repeat(60));
  for (const r of results) {
    console.log(`${r.ok ? '✓' : '✗'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
  }
  console.log('─'.repeat(60));
  console.log(`Total: ${results.length}, failed: ${failed}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
