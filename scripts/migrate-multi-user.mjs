// One-off migration to multi-user. Gives every existing book, concept and project an
// owner, adds usernames, milestones and timeline dates. Safe to run twice.
//
//   node scripts/migrate-multi-user.mjs                         (one account in the DB)
//   OWNER_EMAIL=you@example.com node scripts/migrate-multi-user.mjs
//
// It copies sqlite.db to sqlite.db.before-multi-user first.
import Database from 'better-sqlite3';
import fs from 'fs';

const DB_PATH = 'sqlite.db';
const db = new Database(DB_PATH);

const bookColumns = db.prepare("PRAGMA table_info('books')").all().map((c) => c.name);
if (bookColumns.includes('user_id')) {
  console.log('Already migrated, nothing to do.');
  process.exit(0);
}

const users = db.prepare('SELECT id, email, name FROM user ORDER BY rowid').all();
const ownerEmail = process.env.OWNER_EMAIL;
const owner = ownerEmail ? users.find((u) => u.email === ownerEmail) : users.length === 1 ? users[0] : null;
if (!owner) {
  console.error(ownerEmail
    ? `No user with email ${ownerEmail}.`
    : `Found ${users.length} users. Set OWNER_EMAIL to the account that should own the existing data.`);
  process.exit(1);
}

fs.copyFileSync(DB_PATH, `${DB_PATH}.before-multi-user`);

function toUsername(seed, taken) {
  let base = seed.split('@')[0].toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
  if (base.length < 3) base = `user-${base}`.replace(/-+$/, '');
  let candidate = base;
  for (let i = 2; taken.has(candidate); i++) candidate = `${base.slice(0, 26)}-${i}`;
  taken.add(candidate);
  return candidate;
}

const sql = fs.readFileSync(new URL('./migrate-multi-user.sql', import.meta.url), 'utf8')
  .replaceAll('__OWNER_ID__', owner.id.replaceAll("'", "''"));

db.pragma('foreign_keys = OFF');
db.transaction(() => {
  db.exec(sql);
  const taken = new Set();
  const setUsername = db.prepare('UPDATE user SET username = ? WHERE id = ?');
  for (const u of users) setUsername.run(toUsername(u.email || u.name || 'user', taken), u.id);
})();
db.pragma('foreign_keys = ON');

const problems = db.pragma('foreign_key_check');
if (problems.length) console.warn('Foreign key problems:', problems);

for (const u of db.prepare('SELECT email, username FROM user').all()) {
  console.log(`${u.email} -> /u/${u.username}`);
}
console.log(`Existing books, concepts and projects now belong to ${owner.email}.`);
