import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { handleContractsServiceApi } from '../src/api-contracts-service.js';
import { resetAccessJwtCacheForTests } from '../src/access-jwt.js';
import { TUITION_FINANCE_SCHEMA, tuitionManifest } from '../src/tuition-storage.js';

const TEAM = 'timothystl.cloudflareaccess.com';
const AUD = 'test-audience-tag';
const PATH = '/api/contracts/tuition-aid-workspace-v1';
const CERTS_URL = `https://${TEAM}/cdn-cgi/access/certs`;

// A D1-shaped handle over node:sqlite whose batch() is one transaction, as D1's is.
function d1(sqlite) {
  const stmt = (sql, args = []) => ({
    sql, args, sqlite,
    bind: (...a) => stmt(sql, a),
    async run() { const r = sqlite.prepare(sql).run(...args); return { meta: { last_row_id: Number(r.lastInsertRowid), changes: r.changes } }; },
    async first() { return sqlite.prepare(sql).get(...args); },
    async all() { return { results: sqlite.prepare(sql).all(...args) }; },
  });
  return {
    prepare: (sql) => stmt(sql),
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const out = statements.map((s) => ({ results: /^\s*(SELECT|WITH)/i.test(s.sql) ? sqlite.prepare(s.sql).all(...s.args) : (sqlite.prepare(s.sql).run(...s.args), []) }));
        sqlite.exec('COMMIT');
        return out;
      } catch (e) { sqlite.exec('ROLLBACK'); throw e; }
    },
    _raw: sqlite,
  };
}

function connectDb() {
  const sqlite = new DatabaseSync(':memory:');
  for (const f of readdirSync(new URL('../migrations/', import.meta.url)).filter((n) => n.endsWith('.sql')).sort()) {
    sqlite.exec(readFileSync(new URL(`../migrations/${f}`, import.meta.url), 'utf8'));
  }
  return d1(sqlite);
}

function insertUser(db, { username, email, role, active = 1 }) {
  db._raw.prepare(
    `INSERT INTO app_users (username, password_hash, role, active, email) VALUES (?,?,?,?,?)`
  ).run(username, 'irrelevant-hash', role, active, email);
}

// ── Minimal RSA JWT helpers, mirroring test/finance-budget-write-contract.test.js ──
function b64url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlJson(obj) { return b64url(new TextEncoder().encode(JSON.stringify(obj))); }

async function makeKeyPair() {
  return crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  );
}
async function signToken(privateKey, kid, payload) {
  const header = { alg: 'RS256', kid, typ: 'JWT' };
  const signingInput = `${b64urlJson(header)}.${b64urlJson(payload)}`;
  const sig = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, privateKey, new TextEncoder().encode(signingInput));
  return `${signingInput}.${b64url(new Uint8Array(sig))}`;
}
function accessPayload(email, overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  return { email, iss: `https://${TEAM}`, aud: AUD, exp: now + 3600, iat: now, ...overrides };
}


describe('Tuition Aid storage move (TUITION_STORAGE_MODE)', () => {
  let db, fdb, keyPair, token, originalFetch;
  beforeEach(async () => {
    db = connectDb();
    fdb = d1(new DatabaseSync(':memory:'));
    insertUser(db, { username: 'sarah', email: 'sarah@example.test', role: 'finance' });
    db._raw.exec(`INSERT INTO people (first_name, last_name) VALUES ('Linked','Person');
      INSERT INTO tuition_config (key, value) VALUES ('tuition_base_cents','850000'), ('k8_budget_cents','7500000');
      INSERT INTO tuition_history (school_year, tuition_cents, family_pct, sort_order) VALUES ('2025-26', 810000, 44.4, 0);
      INSERT INTO tuition_year_rates (school_year, tuition_cents) VALUES ('2026-27', 850000);
      INSERT INTO tuition_students (family, child, base_grade, outside_aid_cents, fam_pct, note) VALUES ('Sample','Ada','3',150000,40,'it''s fine'), ('Example','Ben','6',0,50,'');
      INSERT INTO tuition_student_years (student_id, school_year, grade, timothy_award_cents) VALUES (1, '2025-26', '2', 510000);`);
    resetAccessJwtCacheForTests();
    keyPair = await makeKeyPair();
    const jwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey); jwk.kid = 'move';
    token = await signToken(keyPair.privateKey, 'move', accessPayload('sarah@example.test'));
    originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ keys: [jwk] }));
  });
  afterEach(() => { globalThis.fetch = originalFetch; });
  const envFor = (mode, extra = {}) => ({ DB: db, FINANCE_DB: fdb, TUITION_STORAGE_MODE: mode, FINANCE_CONTRACT_API_KEY: 'key', FINANCE_ACCESS_TEAM_DOMAIN: TEAM, FINANCE_ACCESS_AUD: AUD, ...extra });
  function call(env, path, method = 'GET', body) {
    const req = new Request('https://connect.example' + PATH + '?path=' + encodeURIComponent(path), {
      method, headers: { 'X-Contract-Key': 'key', 'Cf-Access-Jwt-Assertion': token, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return handleContractsServiceApi(req, env, PATH);
  }
  const connectManifest = () => tuitionManifest(db);

  it('connect mode keeps using Connect and never touches Finance', async () => {
    const env = envFor('connect');
    expect((await (await call(env, 'tuition-aid/students')).json()).students).toHaveLength(2);
    expect((await call(env, 'tuition-aid/config', 'PATCH', { key: 'growth_pct', value: '4' })).status).toBeLessThan(400);
    expect(fdb._raw.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name LIKE 'tuition_%'").get().n).toBe(0);
    expect(await (await call(env, 'tuition-aid/storage')).json()).toEqual({ mode: 'connect' });
  });

  it('copying mode reads from Connect and refuses every change', async () => {
    const env = envFor('copying');
    const before = await connectManifest();
    expect((await (await call(env, 'tuition-aid/students')).json()).students).toHaveLength(2);
    for (const [path, method, body] of [['tuition-aid/students', 'POST', { family: 'X', child: 'Y' }], ['tuition-aid/students/1', 'PATCH', { note: 'x' }], ['tuition-aid/config', 'PATCH', { key: 'a', value: 'b' }]]) {
      const r = await call(env, path, method, body);
      expect(r.status).toBe(503);
      expect((await r.json()).error).toContain('Changes are paused');
    }
    expect(await connectManifest()).toEqual(before);
  });

  it('finance mode copies every row once, checks it, and then reads and writes only Finance', async () => {
    const env = envFor('finance');
    const before = await connectManifest();
    const bundle = await (await call(env, 'tuition-aid/students')).json();
    expect(bundle.students.map((s) => s.child)).toEqual(['Ada', 'Ben']);
    expect(bundle.studentYears).toHaveLength(1);
    expect(bundle.config.k8_budget_cents).toBe('7500000');
    expect(await tuitionManifest(fdb)).toEqual(before);
    const log = fdb._raw.prepare('SELECT status, manifest FROM tuition_storage_migration').all();
    expect(log.map((r) => r.status)).toEqual(['verified']);
    expect(log[0].manifest).not.toContain('Ada');

    // A change after the move lands in Finance; Connect's rows stay exactly as they were.
    expect((await call(env, 'tuition-aid/students/1', 'PATCH', { outside_aid_cents: 200000, person_id: 1 })).status).toBe(200);
    expect(fdb._raw.prepare('SELECT outside_aid_cents, family, child FROM tuition_students WHERE id=1').get())
      .toEqual({ outside_aid_cents: 200000, family: 'Person', child: 'Linked' });
    expect(await connectManifest()).toEqual(before);
    // Only once: a second request does not copy again.
    await call(env, 'tuition-aid/students');
    expect(fdb._raw.prepare('SELECT COUNT(*) n FROM tuition_storage_migration').get().n).toBe(1);

    const status = await (await call(env, 'tuition-aid/storage')).json();
    expect(status).toMatchObject({ mode: 'finance', status: 'verified' });
    expect(status.tables.find((t) => t.table === 'tuition_students').count).toBe(2);
  });

  it('removes a copy that does not match row for row, pauses, and does not retry on its own', async () => {
    for (const sql of TUITION_FINANCE_SCHEMA) fdb._raw.exec(sql);
    // Something on the Finance side changes a value as it is written.
    fdb._raw.exec("CREATE TRIGGER garble AFTER INSERT ON tuition_config BEGIN UPDATE tuition_config SET value='x' WHERE key=NEW.key; END");
    const env = envFor('finance');
    const r = await call(env, 'tuition-aid/students');
    expect(r.status).toBe(503);
    expect((await r.json()).error).toContain('Connect still has every record');
    expect(fdb._raw.prepare('SELECT COUNT(*) n FROM tuition_students').get().n).toBe(0);
    expect(fdb._raw.prepare('SELECT status FROM tuition_storage_migration').all().map((x) => x.status)).toEqual(['failed']);
    expect((await call(envFor('finance'), 'tuition-aid/students')).status).toBe(503);
    expect(fdb._raw.prepare('SELECT COUNT(*) n FROM tuition_storage_migration').get().n).toBe(1);
    // Back to Connect restores the planner from Connect's untouched rows.
    expect((await (await call(envFor('connect'), 'tuition-aid/students')).json()).students).toHaveLength(2);
  });

  it('refuses to move a table with a column the copy does not know about', async () => {
    db._raw.exec("ALTER TABLE tuition_config ADD COLUMN surprise TEXT NOT NULL DEFAULT ''");
    const r = await call(envFor('finance'), 'tuition-aid/students');
    expect(r.status).toBe(503);
    expect(fdb._raw.prepare('SELECT error FROM tuition_storage_migration').get().error).toContain('surprise');
    expect(fdb._raw.prepare('SELECT COUNT(*) n FROM tuition_students').get().n).toBe(0);
  });

  it('never copies over, or deletes, rows it did not write', async () => {
    for (const sql of TUITION_FINANCE_SCHEMA) fdb._raw.exec(sql);
    fdb._raw.exec("INSERT INTO tuition_config (key, value) VALUES ('in_progress','1')");
    const r = await call(envFor('finance'), 'tuition-aid/students');
    expect(r.status).toBe(503);
    expect((await r.json()).error).toContain('finishing its move');
    expect(fdb._raw.prepare('SELECT COUNT(*) n FROM tuition_config').get().n).toBe(1);
  });

  it('refuses rather than falls back when Finance’s database is not connected', async () => {
    const r = await call(envFor('finance', { FINANCE_DB: undefined }), 'tuition-aid/students');
    expect(r.status).toBe(503);
    expect((await call(envFor('sideways'), 'tuition-aid/students')).status).toBe(503);
  });
});

describe('Tuition Aid storage columns', () => {
  it('copies every column Connect’s tuition tables have, so no field is left behind', async () => {
    const { TUITION_TABLES } = await import('../src/tuition-storage.js');
    const sqlite = connectDb()._raw;
    // Connect's runtime schema (initDb) also adds two tuition_students columns by ALTER TABLE.
    for (const sql of ['ALTER TABLE tuition_students ADD COLUMN timothy_award_override_cents INTEGER', 'ALTER TABLE tuition_students ADD COLUMN family_owed_override_cents INTEGER']) {
      try { sqlite.exec(sql); } catch { /* already added by a migration */ }
    }
    const finance = new DatabaseSync(':memory:');
    for (const sql of TUITION_FINANCE_SCHEMA) finance.exec(sql);
    for (const table of TUITION_TABLES) {
      const connectCols = sqlite.prepare(`PRAGMA table_info(${table.name})`).all().map((c) => c.name).sort();
      expect([...table.columns].sort(), table.name).toEqual(connectCols);
      expect(finance.prepare(`PRAGMA table_info(${table.name})`).all().map((c) => c.name).sort(), table.name).toEqual(connectCols);
    }
    const tuitionTables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'tuition_%' ORDER BY name").all().map((r) => r.name);
    expect(tuitionTables).toEqual(TUITION_TABLES.map((t) => t.name).sort());
  });
});
