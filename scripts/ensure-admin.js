/**
 * Однократный запуск: назначить админа из ADMIN_EMAIL + ADMIN_PASSWORD в .env.
 * Локально: node scripts/ensure-admin.js
 */
require('dotenv').config();
const { db, syncAdminFromEnv } = require('../db/database');

const email = String(process.env.ADMIN_EMAIL || '').trim();
if (!email || !String(process.env.ADMIN_PASSWORD || '').trim()) {
  console.error('Задайте ADMIN_EMAIL и ADMIN_PASSWORD в .env');
  process.exit(1);
}

if (syncAdminFromEnv(db)) {
  console.log('Готово. Войдите на сайт с этим email и паролем.');
} else {
  console.error('Синхронизация не выполнена.');
  process.exit(1);
}
