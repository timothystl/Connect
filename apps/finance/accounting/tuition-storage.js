// Finance's own copy of Connect's src/tuition-storage.js (forked 2026-09-29), so Finance reads and writes its
// accounting records itself instead of asking Connect. Connect's copy serves only its remaining
// in-Connect Budget/Compensation screens and is retired with them; change this one, not that one.
// ── Tuition Aid storage: moving the tuition_* tables from Connect's D1 to Finance's ─────────────
// Andrew, Sept 28 2026: Tuition Aid moves to Finance for good. Connect's Worker is bound to both
// databases, and the release token cannot run D1 commands, so the move happens here, through the
// Worker's own bindings, in three modes set by TUITION_STORAGE_MODE (wrangler.toml):
//
//   connect  (default) Connect's D1 holds and serves the tuition records.
//   copying  Reads from Connect's D1; every change is refused while the move is prepared, so no
//            edit can land in Connect after the copy has been taken. Released first.
//   finance  Finance's D1 holds the records. On the first request after this release, the rows are
//            copied in one atomic batch, both sides are fingerprinted (row counts plus a SHA-256
//            over every row, column by column), and only a verified copy is used. A failed check
//            removes the copy and refuses Tuition Aid rather than serving two versions. The result
//            (counts and fingerprints, no names) is kept in tuition_storage_migration.
//
// Connect's rows are never changed or deleted: they are the backup of the moment of the move (and
// D1 Time Travel covers both databases). people/households stay in Connect; the only
// cross-database read (a student's name from their linked person) uses Connect's handle.

// Parents before children (tuition_student_years references tuition_students).
export const TUITION_TABLES = Object.freeze([
  { name: 'tuition_config', key: ['key'], columns: ['key', 'value'] },
  { name: 'tuition_history', key: ['id'], columns: ['id', 'school_year', 'tuition_cents', 'family_pct', 'sort_order'] },
  { name: 'tuition_year_rates', key: ['school_year'], columns: ['school_year', 'tuition_cents', 'updated_at'] },
  {
    name: 'tuition_students', key: ['id'],
    columns: ['id', 'person_id', 'household_id', 'family', 'child', 'is_pipeline', 'base_grade', 'birth_year',
      'outside_aid_cents', 'fam_pct', 'fam_pct_orig', 'touched', 'lhs_award_cents', 'lhs_award_orig_cents',
      'attends_lhs', 'timothy_award_exact_cents', 'family_owed_exact_cents', 'timothy_award_override_cents',
      'family_owed_override_cents', 'note', 'active', 'sort_order', 'created_at', 'updated_at'],
  },
  {
    name: 'tuition_student_years', key: ['id'],
    columns: ['id', 'student_id', 'school_year', 'grade', 'outside_aid_cents', 'fam_pct', 'timothy_award_cents',
      'family_owed_cents', 'lhs_award_cents', 'note', 'created_at', 'updated_at'],
  },
]);

// The same tables as Connect's (src/db.js), minus the references to people/households, which
// live only in Connect's database. Every statement is CREATE ... IF NOT EXISTS.
export const TUITION_FINANCE_SCHEMA = Object.freeze([
  `CREATE TABLE IF NOT EXISTS tuition_students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER,
    household_id INTEGER,
    family TEXT NOT NULL DEFAULT '',
    child TEXT NOT NULL DEFAULT '',
    is_pipeline INTEGER NOT NULL DEFAULT 0,
    base_grade TEXT NOT NULL DEFAULT '',
    birth_year INTEGER,
    outside_aid_cents INTEGER NOT NULL DEFAULT 0,
    fam_pct INTEGER NOT NULL DEFAULT 50,
    fam_pct_orig INTEGER NOT NULL DEFAULT 50,
    touched INTEGER NOT NULL DEFAULT 0,
    lhs_award_cents INTEGER NOT NULL DEFAULT 120000,
    lhs_award_orig_cents INTEGER NOT NULL DEFAULT 120000,
    attends_lhs INTEGER NOT NULL DEFAULT 1,
    timothy_award_exact_cents INTEGER,
    family_owed_exact_cents INTEGER,
    timothy_award_override_cents INTEGER,
    family_owed_override_cents INTEGER,
    note TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS tuition_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS tuition_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_year TEXT NOT NULL DEFAULT '',
    tuition_cents INTEGER NOT NULL DEFAULT 0,
    family_pct REAL NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS tuition_year_rates (
    school_year TEXT PRIMARY KEY,
    tuition_cents INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS tuition_student_years (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES tuition_students(id),
    school_year TEXT NOT NULL,
    grade TEXT NOT NULL DEFAULT '',
    outside_aid_cents INTEGER,
    fam_pct INTEGER,
    timothy_award_cents INTEGER,
    family_owed_cents INTEGER,
    lhs_award_cents INTEGER,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_tsy_student_year ON tuition_student_years(student_id, school_year)`,
  `CREATE INDEX IF NOT EXISTS idx_tsy_school_year ON tuition_student_years(school_year)`,
  `CREATE TABLE IF NOT EXISTS tuition_storage_migration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    finished_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL,
    manifest TEXT NOT NULL DEFAULT '',
    error TEXT NOT NULL DEFAULT ''
  )`,
]);

export class TuitionStorageError extends Error {
  constructor(message, status = 503) { super(message); this.status = status; }
}

export function tuitionStorageMode(env) {
  const mode = env.TUITION_STORAGE_MODE || 'connect';
  if (!['connect', 'copying', 'finance'].includes(mode)) throw new TuitionStorageError('Tuition Aid storage is misconfigured.');
  return mode;
}

async function readTable(db, table) {
  // Every listed column, in key order. Connect's older tuition_students added two columns with
  // ALTER TABLE, so its physical column order may differ; naming the columns makes that moot.
  return (await db.prepare(`SELECT ${table.columns.join(', ')} FROM ${table.name} ORDER BY ${table.key.join(', ')}`).all()).results || [];
}

async function sha256Hex(text) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Counts plus a fingerprint of every row and column: two databases with the same manifest hold
// the same tuition records. Values only; the manifest itself names no student.
export async function tuitionManifest(db, rowsByTable = null) {
  const out = [];
  for (const table of TUITION_TABLES) {
    const rows = rowsByTable ? rowsByTable[table.name] : await readTable(db, table);
    const canonical = JSON.stringify(rows.map((row) => table.columns.map((c) => (row[c] === undefined ? null : row[c]))));
    out.push({ table: table.name, count: rows.length, sha256: await sha256Hex(canonical) });
  }
  return out;
}

async function destinationCounts(fdb) {
  const counts = {};
  for (const table of TUITION_TABLES) counts[table.name] = (await fdb.prepare(`SELECT COUNT(*) AS n FROM ${table.name}`).first())?.n || 0;
  return counts;
}

async function copyAndVerify(env) {
  const fdb = env.FINANCE_DB;
  for (const sql of TUITION_FINANCE_SCHEMA) await fdb.prepare(sql).run();
  const verified = await fdb.prepare(`SELECT id FROM tuition_storage_migration WHERE status='verified' ORDER BY id DESC LIMIT 1`).first();
  if (verified) return;
  // A failed check is not retried on its own: the same data would fail the same way. Setting
  // TUITION_STORAGE_MODE back to "connect" restores Tuition Aid from Connect's untouched rows.
  const failed = await fdb.prepare(`SELECT id FROM tuition_storage_migration WHERE status='failed' LIMIT 1`).first();
  if (failed) throw new TuitionStorageError('Tuition Aid could not be moved to Finance safely, so it is paused. Nothing was lost; Connect still has every record.');
  const counts = await destinationCounts(fdb);
  if (Object.values(counts).some((n) => n > 0)) {
    // Another request is copying right now, or an earlier attempt needs a person to look at it.
    // Never copy on top of rows this request did not write, and never delete them.
    throw new TuitionStorageError('Tuition Aid is finishing its move to Finance. Try again in a minute.');
  }
  // Refuse, rather than silently drop, any column the live Connect table has that this copy does
  // not know about (a manual change that never reached the code).
  for (const table of TUITION_TABLES) {
    const live = ((await env.DB.prepare(`PRAGMA table_info(${table.name})`).all()).results || []).map((c) => c.name);
    const unknown = live.filter((c) => !table.columns.includes(c));
    if (unknown.length) {
      await fdb.prepare(`INSERT INTO tuition_storage_migration (started_at, status, error) VALUES (?, 'failed', ?)`)
        .bind(new Date().toISOString(), `${table.name} has columns this copy does not cover: ${unknown.join(', ')}`).run();
      throw new TuitionStorageError('Tuition Aid could not be moved to Finance safely, so it is paused. Nothing was lost; Connect still has every record.');
    }
  }
  const startedAt = new Date().toISOString();
  const source = {};
  for (const table of TUITION_TABLES) source[table.name] = await readTable(env.DB, table);
  const inserts = [];
  for (const table of TUITION_TABLES) {
    const placeholders = table.columns.map(() => '?').join(', ');
    for (const row of source[table.name]) {
      inserts.push(fdb.prepare(`INSERT INTO ${table.name} (${table.columns.join(', ')}) VALUES (${placeholders})`)
        .bind(...table.columns.map((c) => (row[c] === undefined ? null : row[c]))));
    }
  }
  // One batch is one transaction: all of the rows land, or none do.
  if (inserts.length) {
    try {
      await fdb.batch(inserts);
    } catch (e) {
      throw new TuitionStorageError('Tuition Aid is finishing its move to Finance. Try again in a minute.');
    }
  }
  const expected = await tuitionManifest(null, source);
  const actual = await tuitionManifest(fdb);
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    await fdb.batch(TUITION_TABLES.slice().reverse().map((t) => fdb.prepare(`DELETE FROM ${t.name}`)));
    await fdb.prepare(`INSERT INTO tuition_storage_migration (started_at, status, manifest, error) VALUES (?, 'failed', ?, ?)`)
      .bind(startedAt, JSON.stringify({ expected, actual }), 'The copy did not match Connect row for row; it was removed.').run();
    throw new TuitionStorageError('Tuition Aid could not be moved to Finance safely, so it is paused. Nothing was lost; Connect still has every record.');
  }
  await fdb.prepare(`INSERT INTO tuition_storage_migration (started_at, status, manifest) VALUES (?, 'verified', ?)`)
    .bind(startedAt, JSON.stringify(expected)).run();
}

const ready = new WeakMap();

// The database the tuition handlers should use for this request, and whether changes are allowed.
// connectDb is the request's own handle on Connect's D1 (it may count queries for attribution).
export async function tuitionStorage(env, connectDb = env.DB) {
  const mode = tuitionStorageMode(env);
  if (mode === 'connect') return { db: connectDb, mode, writable: true };
  if (mode === 'copying') return { db: connectDb, mode, writable: false };
  if (!env.FINANCE_DB) throw new TuitionStorageError('Tuition Aid is set to Finance’s database, but that database is not connected.');
  let pending = ready.get(env.FINANCE_DB);
  if (!pending) {
    pending = copyAndVerify(env);
    ready.set(env.FINANCE_DB, pending);
    pending.catch(() => ready.delete(env.FINANCE_DB));
  }
  await pending;
  return { db: env.FINANCE_DB, mode, writable: true };
}

// What the move did, for the Finance page: counts and when, never names.
export async function tuitionStorageStatus(env) {
  const mode = tuitionStorageMode(env);
  if (mode !== 'finance' || !env.FINANCE_DB) return { mode };
  const row = await env.FINANCE_DB.prepare(
    `SELECT started_at, finished_at, status, manifest FROM tuition_storage_migration ORDER BY id DESC LIMIT 1`
  ).first().catch(() => null);
  if (!row) return { mode, status: 'pending' };
  let tables = [];
  try {
    const manifest = JSON.parse(row.manifest || '[]');
    tables = (Array.isArray(manifest) ? manifest : manifest.expected || []).map(({ table, count }) => ({ table, count }));
  } catch { tables = []; }
  return { mode, status: row.status, moved_at: row.finished_at, tables };
}
