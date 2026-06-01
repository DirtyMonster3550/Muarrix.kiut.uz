const { db } = require('../db/database');

const admins = db.prepare("SELECT id, email, full_name FROM users WHERE role = 'admin' ORDER BY id ASC").all();
if (admins.length <= 1) {
  console.log('Single admin OK:', admins[0]?.email || 'none');
  process.exit(0);
}

const keep = admins[0];
const extras = admins.slice(1);
for (const u of extras) {
  db.prepare("UPDATE users SET role = 'author' WHERE id = ?").run(u.id);
  console.log(`Demoted ${u.email} (${u.full_name}) → author; kept ${keep.email} as admin`);
}
