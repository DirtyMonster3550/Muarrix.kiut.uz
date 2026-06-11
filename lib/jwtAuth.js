const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_ALG = 'HS256';
const WEAK_SECRETS = new Set(['secret', 'change_me', 'jwt_secret', 'your_secret']);

let cachedSecret = null;

function getJwtSecret() {
  if (cachedSecret) return cachedSecret;

  const secret = (process.env.JWT_SECRET || '').trim();
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    if (!secret || secret.length < 32 || WEAK_SECRETS.has(secret.toLowerCase())) {
      console.error('[security] FATAL: В production задайте JWT_SECRET — случайная строка минимум 32 символа (.env)');
      process.exit(1);
    }
    cachedSecret = secret;
    return cachedSecret;
  }

  if (secret && secret.length >= 32 && !WEAK_SECRETS.has(secret.toLowerCase())) {
    cachedSecret = secret;
    return cachedSecret;
  }

  if (secret && WEAK_SECRETS.has(secret.toLowerCase())) {
    console.warn('[security] JWT_SECRET слабый — задайте длинную случайную строку в .env');
  } else if (!secret) {
    console.warn('[security] JWT_SECRET не задан — используется временный dev-секрет (перезапуск сбросит сессии)');
  }

  cachedSecret = secret && !WEAK_SECRETS.has(secret.toLowerCase())
    ? secret
    : crypto.randomBytes(48).toString('base64url');
  return cachedSecret;
}

function signToken(payload, options = {}) {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: JWT_ALG,
    expiresIn: options.expiresIn || '7d',
  });
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret(), { algorithms: [JWT_ALG] });
}

module.exports = {
  getJwtSecret,
  signToken,
  verifyToken,
  JWT_ALG,
};
