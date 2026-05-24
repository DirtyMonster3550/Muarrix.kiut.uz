const { db } = require('../db/database');

// ── Thresholds ────────────────────────────────────────────────────────────────
// NOTE: relaxed for local development — restore before production
const FAILED_LOGIN_LIMIT  = 100;  // auto-ban after N failed logins
const FAILED_LOGIN_WINDOW = 15;   // minutes
const REGISTER_LIMIT      = 50;   // auto-ban after N registrations
const REGISTER_WINDOW     = 60;   // minutes

// ── Helpers ───────────────────────────────────────────────────────────────────
function clientIp(req) {
  // honour proxy headers when behind nginx/cloudflare
  const forwarded = req.headers['x-forwarded-for'];
  return (forwarded ? forwarded.split(',')[0].trim() : null)
    || req.ip
    || req.connection?.remoteAddress
    || 'unknown';
}

// ── Log a security event ──────────────────────────────────────────────────────
function logEvent(ip, eventType, details = null, userId = null) {
  try {
    db.prepare(`
      INSERT INTO security_events (ip, user_id, event_type, details)
      VALUES (?, ?, ?, ?)
    `).run(ip, userId, eventType, details);
  } catch (e) {
    console.error('[security] logEvent error:', e.message);
  }
}

// ── Auto-ban an IP ─────────────────────────────────────────────────────────────
function banIp(ip, reason) {
  try {
    db.prepare(`
      INSERT INTO ip_bans (ip, reason, is_auto, is_active)
      VALUES (?, ?, 1, 1)
      ON CONFLICT(ip) DO UPDATE SET
        is_active  = 1,
        reason     = excluded.reason,
        banned_at  = CURRENT_TIMESTAMP,
        unbanned_at = NULL,
        unbanned_by = NULL
    `).run(ip, reason);
    console.warn(`[security] AUTO-BANNED IP: ${ip} — ${reason}`);
  } catch (e) {
    console.error('[security] banIp error:', e.message);
  }
}

// ── Check threshold and auto-ban if exceeded ───────────────────────────────────
function autobanIfNeeded(ip, eventType) {
  try {
    let count, windowMin, reason;

    if (eventType === 'failed_login') {
      windowMin = FAILED_LOGIN_WINDOW;
      count = db.prepare(`
        SELECT COUNT(*) AS c FROM security_events
        WHERE ip = ? AND event_type = 'failed_login'
          AND created_at >= datetime('now', ? || ' minutes')
      `).get(ip, `-${windowMin}`).c;
      reason = `${count} неудачных попыток входа за ${windowMin} мин`;

      if (count >= FAILED_LOGIN_LIMIT) {
        banIp(ip, reason);
        logEvent(ip, 'auto_banned', reason);
        return true;
      }
    }

    if (eventType === 'register_attempt') {
      windowMin = REGISTER_WINDOW;
      count = db.prepare(`
        SELECT COUNT(*) AS c FROM security_events
        WHERE ip = ? AND event_type = 'register_attempt'
          AND created_at >= datetime('now', ? || ' minutes')
      `).get(ip, `-${windowMin}`).c;
      reason = `${count} попыток регистрации за ${windowMin} мин`;

      if (count >= REGISTER_LIMIT) {
        banIp(ip, reason);
        logEvent(ip, 'auto_banned', reason);
        return true;
      }
    }
  } catch (e) {
    console.error('[security] autobanIfNeeded error:', e.message);
  }
  return false;
}

// ── Express middleware — run on every request ─────────────────────────────────
function checkBan(req, res, next) {
  const ip = clientIp(req);

  // Skip static assets
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    return next();
  }

  // Skip auth endpoints — login/register/reset must always work
  if (req.path.startsWith('/api/auth/')) {
    return next();
  }

  try {
    // 1. Check if requester is an authenticated admin — admins bypass IP ban
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const jwt = require('jsonwebtoken');
      try {
        const payload = jwt.verify(
          authHeader.split(' ')[1],
          process.env.JWT_SECRET || 'secret'
        );
        // Admins are never blocked by IP ban
        if (payload?.role === 'admin') return next();

        // Non-admin: check if their account is banned
        if (payload?.id) {
          const user = db.prepare(
            'SELECT is_banned FROM users WHERE id = ?'
          ).get(payload.id);
          if (user?.is_banned) {
            return res.status(403).json({
              error: 'Ваш аккаунт заблокирован. Обратитесь к администратору.',
            });
          }
        }
      } catch {
        // invalid token — let the auth middleware handle it
      }
    }

    // 2. IP ban check (only for unauthenticated or non-admin requests)
    const ipBan = db.prepare(
      'SELECT id FROM ip_bans WHERE ip = ? AND is_active = 1'
    ).get(ip);

    if (ipBan) {
      logEvent(ip, 'blocked_request', req.path);
      return res.status(403).json({
        error: 'Ваш IP заблокирован. Обратитесь к администратору.',
      });
    }
  } catch (e) {
    console.error('[security] checkBan error:', e.message);
  }

  next();
}

// ── Audit log for admin actions ───────────────────────────────────────────────
function auditLog(adminId, action, targetType = null, targetId = null, details = null) {
  try {
    db.prepare(`
      INSERT INTO audit_log (admin_id, action, target_type, target_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(adminId, action, targetType, targetId, details);
  } catch (e) {
    console.error('[security] auditLog error:', e.message);
  }
}

module.exports = { checkBan, logEvent, autobanIfNeeded, clientIp, banIp, auditLog };
