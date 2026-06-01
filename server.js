require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { archivesDirectory } = require('./lib/paths');
const jwt = require('jsonwebtoken');
const { init, db } = require('./db/database');
const { checkBan } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],  // allow onclick/onchange/etc. in HTML
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'same-origin' },
}));

// ── CORS – only same origin (change if you have a separate front-end domain) ──
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || false, // false = same-origin only
  credentials: true,
}));

// ── Body size limits ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ── Rate limiters ─────────────────────────────────────────────────────────────
// NOTE: limits are relaxed for local development — tighten before production
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток. Повторите через 15 минут.' },
});

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов. Повторите позже.' },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов.' },
});

// Apply general limiter only to API routes, not static files
app.use('/api', generalLimiter);

// ── Ban check (before any routes) ────────────────────────────────────────────
app.use(checkBan);

// ── Архив PDF: только под /archives/… (до общего public, чтобы env-путь переопределял раздачу)
app.use('/archives', express.static(archivesDirectory()));

// ── Static files (public only — NO /uploads here) ────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Protected /uploads – staff + author of the submission ─────────────────────
app.use('/uploads', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
    || req.query.token;
  if (!token) return res.status(401).json({ error: 'Не авторизован' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const staffRoles = ['admin', 'tech_expert', 'editorial_expert'];
    if (staffRoles.includes(payload.role)) return next();

    const filename = path.basename(decodeURIComponent(req.path));
    const sub = db.prepare('SELECT user_id FROM submissions WHERE file_path = ?').get(filename);
    if (sub && sub.user_id === payload.id) return next();

    return res.status(403).json({ error: 'Нет доступа к файлу' });
  } catch {
    return res.status(401).json({ error: 'Токен недействителен' });
  }
}, express.static(path.join(__dirname, 'uploads')));

// ── Public API ────────────────────────────────────────────────────────────────

app.get('/api/announce', (req, res) => {
  const rows = db.prepare("SELECT key, value FROM settings WHERE key IN ('announce_text','announce_enabled','announce_cta','site_email','site_phone','site_address')").all();
  const obj = {};
  rows.forEach(r => { obj[r.key] = r.value; });
  res.json(obj);
});

// ── Routes ────────────────────────────────────────────────────────────────────
const authRouter = require('./routes/auth');
// Rate-limit only sensitive auth actions, not /me (called on every page load)
app.use('/api/auth/login',          authLimiter);
app.use('/api/auth/register',       authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password',  authLimiter);
app.use('/api/auth', authRouter);
app.use('/api/issues', require('./routes/issues'));
app.use('/api/file-archive', require('./routes/fileArchive'));
app.use('/api/submissions', submitLimiter, require('./routes/submissions'));
app.use('/api/admin/issues', require('./routes/adminIssues'));
app.use('/api/admin/security', require('./routes/adminSecurity'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/review', require('./routes/review'));

app.get('/stem-current-issue', (req, res) => {
  res.redirect(302, '/#stem-current-issue');
});

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Global error handler (never leak stack traces to clients) ─────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: status === 500 ? 'Внутренняя ошибка сервера' : err.message });
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
init();

const server = app.listen(PORT);
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Порт ${PORT} уже занят — сервер STEM, скорее всего, уже запущен.`);
    console.error(`Откройте http://localhost:${PORT} или остановите старый процесс (Ctrl+C в том терминале).`);
    console.error('Windows: netstat -ano | findstr :3000  →  taskkill /PID <номер> /F');
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});
