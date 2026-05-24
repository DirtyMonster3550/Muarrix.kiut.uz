const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'kiut_nashrlar.db'));

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
      journal TEXT NOT NULL DEFAULT 'stem',
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
  if (!subCols.includes('published_at')) {
    db.exec('ALTER TABLE submissions ADD COLUMN published_at DATETIME');
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
    ['announce_text', 'Приём статей открыт! Ближайший выпуск STEM — 1 июня 2026.'],
    ['announce_enabled', '1'],
    ['announce_cta', 'Подать статью →'],
    ['site_email', 'g.isamova@gmail.com'],
    ['site_phone', '+998 78 129 40 40'],
    ['site_address', 'ул. Шота Руставели, 156, Ташкент'],
  ];
  for (const [key, value] of defaultSettings) {
    db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  }

  db.prepare(`
    UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP
    WHERE key = 'site_email' AND value = 'info@kiut.uz'
  `).run('g.isamova@gmail.com');

  const issueCount = db.prepare('SELECT COUNT(*) as c FROM issues').get().c;
  if (issueCount === 0) {
    const insert = db.prepare(`
      INSERT INTO issues (journal, title, description, sort_order, accepting_submissions, issued_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insert.run(
      'stem',
      "Том 6 № 2 (2026): STEM 2-son to'plami",
      'Выпуск для подачи материалов на новой платформе (пример). Редактор может переименовать или добавить выпуски в админке.',
      20,
      1,
      '2026-04-28'
    );
    insert.run(
      'stem',
      'Том 5 № 1 (2025)',
      null,
      10,
      0,
      '2025-12-01'
    );
    insert.run(
      'stem',
      'Том 1 № 1 (2024)',
      null,
      1,
      0,
      '2024-06-01'
    );
  }

  // Create default admin if not exists
  const admin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!admin) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@kiut2024', 10);
    db.prepare(`
      INSERT INTO users (full_name, email, password, role)
      VALUES (?, ?, ?, 'admin')
    `).run('Администратор', process.env.ADMIN_EMAIL || 'admin@kiut.uz', hash);
    console.log('✅ Admin account created');
  }
}

module.exports = { db, init };
