const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_FILE = 'muarrix.db';
const LEGACY_DB_FILES = [];

function resolveDatabasePath() {
  // In Docker: DB_PATH=/app/data/muarrix.db (separate mounted volume)
  if (process.env.DB_PATH) return path.resolve(process.env.DB_PATH);
  const dir = __dirname;
  const newPath = path.join(dir, DB_FILE);
  if (fs.existsSync(newPath)) return newPath;

  for (const legacyFile of LEGACY_DB_FILES) {
    const legacyPath = path.join(dir, legacyFile);
    if (!fs.existsSync(legacyPath)) continue;
    try {
      fs.renameSync(legacyPath, newPath);
      for (const ext of ['-wal', '-shm']) {
        const from = legacyPath + ext;
        const to = newPath + ext;
        if (fs.existsSync(from)) fs.renameSync(from, to);
      }
      return newPath;
    } catch {
      return legacyPath;
    }
  }

  return newPath;
}

const dbPath = resolveDatabasePath();
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'author',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      authors TEXT NOT NULL,
      journal TEXT NOT NULL,
      abstract TEXT,
      file_path TEXT,
      status TEXT DEFAULT 'pending',
      admin_note TEXT,
      payment_status TEXT DEFAULT 'unpaid',
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      submission_id INTEGER,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (submission_id) REFERENCES submissions(id)
    );

    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      journal TEXT NOT NULL DEFAULT 'muarrix',
      title TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      accepting_submissions INTEGER DEFAULT 1,
      issued_at TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Audit log for admin actions
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Security tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS security_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT NOT NULL,
      user_id INTEGER,
      event_type TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ip_bans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT NOT NULL UNIQUE,
      reason TEXT,
      is_auto INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      banned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      unbanned_at DATETIME,
      unbanned_by TEXT
    );
  `);

  // Migrations for existing tables
  const subCols = db.prepare('PRAGMA table_info(submissions)').all().map((c) => c.name);
  if (!subCols.includes('issue_id')) {
    db.exec('ALTER TABLE submissions ADD COLUMN issue_id INTEGER REFERENCES issues(id)');
  }
  if (!subCols.includes('author_date')) {
    db.exec('ALTER TABLE submissions ADD COLUMN author_date TEXT');
  }
  if (!subCols.includes('rejection_reason')) {
    db.exec('ALTER TABLE submissions ADD COLUMN rejection_reason TEXT');
  }
  if (!subCols.includes('rejection_stage')) {
    db.exec('ALTER TABLE submissions ADD COLUMN rejection_stage TEXT');
  }
  if (!subCols.includes('tech_reviewer_id')) {
    db.exec('ALTER TABLE submissions ADD COLUMN tech_reviewer_id INTEGER');
  }
  if (!subCols.includes('editorial_reviewer_id')) {
    db.exec('ALTER TABLE submissions ADD COLUMN editorial_reviewer_id INTEGER');
  }
  if (!subCols.includes('assigned_editorial_id')) {
    db.exec('ALTER TABLE submissions ADD COLUMN assigned_editorial_id INTEGER');
  }
  if (!subCols.includes('published_at')) {
    db.exec('ALTER TABLE submissions ADD COLUMN published_at DATETIME');
  }
  if (!subCols.includes('published_archive_file')) {
    db.exec('ALTER TABLE submissions ADD COLUMN published_archive_file TEXT');
  }
  if (!subCols.includes('published_pdf_path')) {
    db.exec('ALTER TABLE submissions ADD COLUMN published_pdf_path TEXT');
  }

  const issueCols = db.prepare('PRAGMA table_info(issues)').all().map((c) => c.name);
  if (!issueCols.includes('cover_image')) {
    db.exec('ALTER TABLE issues ADD COLUMN cover_image TEXT');
  }
  if (!issueCols.includes('archive_folder')) {
    db.exec('ALTER TABLE issues ADD COLUMN archive_folder TEXT');
  }

  const userCols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  if (!userCols.includes('is_banned')) {
    db.exec('ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0');
  }
  if (!userCols.includes('reset_token')) {
    db.exec('ALTER TABLE users ADD COLUMN reset_token TEXT');
  }
  if (!userCols.includes('reset_token_expires')) {
    db.exec('ALTER TABLE users ADD COLUMN reset_token_expires DATETIME');
  }

  // Default settings
  const defaultSettings = [
    ['announce_text', 'Приём статей открыт! Ближайший выпуск Muarrix.kiut.uz — 1 июня 2026.'],
    ['announce_enabled', '1'],
    ['announce_cta', 'Подать статью →'],
    ['site_email', 'g.isamova@kiut.uz'],
    ['site_phone', '+998 78 129 40 40 (121)'],
    ['site_address', 'ул. Шота Руставели, 156, Ташкент'],
  ];
  for (const [key, value] of defaultSettings) {
    db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  }

  db.prepare(`
    UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP
    WHERE key = 'site_email' AND value IN ('info@kiut.uz', 'g.isamova@gmail.com')
  `).run('g.isamova@kiut.uz');

  db.prepare(`
    UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP
    WHERE key = 'site_phone' AND value = '+998 78 129 40 40'
  `).run('+998 78 129 40 40 (121)');

  db.prepare(`
    UPDATE submissions SET rejection_stage = 'tech'
    WHERE status = 'rejected' AND (rejection_stage IS NULL OR TRIM(rejection_stage) = '')
  `).run();

  try {
    const { syncArchiveIssueCovers } = require('../lib/syncIssueCovers');
    syncArchiveIssueCovers(db);
  } catch (e) {
    console.error('[syncIssueCovers]', e.message);
  }

  // Выпуск с открытым приёмом — без него авторы не могут подать статью
  const openMuarrix = db.prepare(`
    SELECT id FROM issues WHERE journal = 'muarrix' AND accepting_submissions = 1 LIMIT 1
  `).get();
  if (!openMuarrix) {
    const year = new Date().getFullYear();
    db.prepare(`
      INSERT INTO issues (journal, title, description, sort_order, accepting_submissions, issued_at)
      VALUES ('muarrix', ?, ?, 1, 1, ?)
    `).run(
      `Выпуск Muarrix.kiut.uz ${year}`,
      'Приём статей открыт',
      `${year}-06-01`
    );
    console.log('[init] Создан выпуск Muarrix с открытым приёмом статей');
  }

  // Админ: из ADMIN_EMAIL + ADMIN_PASSWORD в .env на сервере, иначе один раз по умолчанию
  if (!syncAdminFromEnv(db)) {
    ensureDefaultAdmin(db);
  }

  // Старый статус approved обходил экспертизу — возвращаем в очередь тех. эксперта
  const legacy = db.prepare("SELECT COUNT(*) AS c FROM submissions WHERE status = 'approved'").get().c;
  if (legacy > 0) {
    db.prepare("UPDATE submissions SET status = 'pending' WHERE status = 'approved'").run();
    console.log(`[init] ${legacy} статей переведено из approved → pending (очередь тех. эксперта)`);
  }
}

/**
 * Назначает админа из ADMIN_EMAIL + ADMIN_PASSWORD в .env (файл на сервере).
 * Если пользователь уже зарегистрирован — повышает до admin и обновляет пароль.
 * @returns {boolean} true если переменные заданы и синхронизация выполнена
 */
function syncAdminFromEnv(db) {
  const email = String(process.env.ADMIN_EMAIL || '').trim();
  const password = String(process.env.ADMIN_PASSWORD || '').trim();
  if (!email || !password) return false;

  const hash = bcrypt.hashSync(password, 10);
  const existing = db.prepare('SELECT id, email, role FROM users WHERE LOWER(email) = LOWER(?)').get(email);

  if (existing) {
    db.prepare('UPDATE users SET password = ?, role = ? WHERE id = ?').run(hash, 'admin', existing.id);
    console.log(`[init] Админ: назначен ${existing.email} (был: ${existing.role})`);
  } else {
    db.prepare(`
      INSERT INTO users (full_name, email, password, role)
      VALUES (?, ?, ?, 'admin')
    `).run('Администратор', email, hash);
    console.log(`[init] Админ: создан ${email}`);
  }

  const keep = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
  if (keep) {
    const demoted = db.prepare(`
      UPDATE users SET role = 'author' WHERE role = 'admin' AND id != ?
    `).run(keep.id);
    if (demoted.changes > 0) {
      console.log(`[init] Снята роль admin у ${demoted.changes} других пользователей`);
    }
  }
  return true;
}

function ensureDefaultAdmin(db) {
  const admin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!admin) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@kiut2024', 10);
    db.prepare(`
      INSERT INTO users (full_name, email, password, role)
      VALUES (?, ?, ?, 'admin')
    `).run('Администратор', process.env.ADMIN_EMAIL || 'admin@kiut.uz', hash);
    console.log('[init] Создан админ по умолчанию (задайте ADMIN_EMAIL и ADMIN_PASSWORD в .env на сервере)');
  }

  const admins = db.prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC").all();
  if (admins.length > 1) {
    const keepId = admins[0].id;
    const demote = admins.slice(1).map((a) => a.id);
    db.prepare(`UPDATE users SET role = 'author' WHERE id IN (${demote.map(() => '?').join(',')})`).run(...demote);
    console.log(`[init] Оставлен один admin (#${keepId}), снята роль у: ${demote.join(', ')}`);
  }
}

module.exports = { db, init, dbPath, DB_FILE, syncAdminFromEnv };
