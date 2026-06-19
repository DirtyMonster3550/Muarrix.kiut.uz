const path = require('path');
const { resolveSessionUser } = require('../lib/sessionUser');

const BLOCKED_EXACT = new Set([
  '/package.json',
  '/server.js',
  '/.env',
  '/readme.md',
  '/muarrix.db',
]);

const BLOCKED_PREFIXES = [
  '/db/',
  '/node_modules/',
  '/routes/',
  '/middleware/',
  '/lib/',
  '/scripts/',
  '/uploads/../',
];

const PROTECTED_PAGES = {
  '/admin.html': ['admin'],
  '/expert.html': ['tech_expert', 'editorial_expert'],
  '/dashboard.html': ['author'],
};

function getCookie(req, name) {
  const raw = req.headers.cookie;
  if (!raw) return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = raw.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function extractBearer(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

function getSessionToken(req) {
  return getCookie(req, 'kiut_session') || extractBearer(req);
}

function blockSensitivePaths(req, res, next) {
  const decoded = decodeURIComponent(req.path || '');
  const lower = decoded.toLowerCase();

  if (lower.includes('..')) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (BLOCKED_EXACT.has(lower)) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (BLOCKED_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (lower.endsWith('.db') || lower.endsWith('.sqlite') || lower.endsWith('.sqlite3')) {
    return res.status(404).json({ error: 'Not found' });
  }

  return next();
}

function protectHtmlPages(req, res, next) {
  const allowedRoles = PROTECTED_PAGES[req.path];
  if (!allowedRoles) return next();

  const token = getSessionToken(req);
  if (!token) {
    const nextUrl = encodeURIComponent(req.path);
    return res.redirect(302, `/login.html?next=${nextUrl}`);
  }

  try {
    const user = resolveSessionUser(req);
    if (!user) return res.redirect(302, `/login.html?next=${encodeURIComponent(req.path)}`);
    const role = user.role;
    if (!allowedRoles.includes(role)) {
      if (role === 'admin') return res.redirect(302, '/admin.html');
      if (role === 'tech_expert' || role === 'editorial_expert') {
        return res.redirect(302, '/expert.html');
      }
      return res.status(403).send('Доступ запрещён. Выйдите из аккаунта и войдите снова: /login.html');
    }
    return next();
  } catch {
    return res.redirect(302, `/login.html?next=${encodeURIComponent(req.path)}`);
  }
}

function sessionCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

function setSessionCookie(res, token) {
  const opts = sessionCookieOptions();
  const parts = [
    `kiut_session=${encodeURIComponent(token)}`,
    `Path=${opts.path}`,
    `Max-Age=${Math.floor(opts.maxAge / 1000)}`,
    'HttpOnly',
    `SameSite=${opts.sameSite === 'strict' ? 'Strict' : 'Lax'}`,
  ];
  if (opts.secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
  const parts = [
    'kiut_session=',
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Strict',
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

module.exports = {
  blockSensitivePaths,
  protectHtmlPages,
  getSessionToken,
  setSessionCookie,
  clearSessionCookie,
  sessionCookieOptions,
};
