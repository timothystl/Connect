import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { handleContractsServiceApi } from '../src/api-contracts-service.js';
import { resetAccessJwtCacheForTests } from '../src/access-jwt.js';

const TEAM = 'timothystl.cloudflareaccess.com';
const AUD = 'test-audience-tag';
const CERTS_URL = `https://${TEAM}/cdn-cgi/access/certs`;

function makeTestDb({ before } = {}) {
  const sqlite = new DatabaseSync(':memory:');
  // Every Connect migration, in order (or those before `before`), so the tables carry their real columns.
  for (const f of readdirSync(new URL('../migrations/', import.meta.url)).filter((n) => n.endsWith('.sql') && (!before || n < before)).sort()) {
    sqlite.exec(readFileSync(new URL(`../migrations/${f}`, import.meta.url), 'utf8'));
  }
  return {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              const r = sqlite.prepare(sql).run(...args);
              return { meta: { last_row_id: Number(r.lastInsertRowid), changes: r.changes } };
            },
            async first() { return sqlite.prepare(sql).get(...args); },
            async all() { return { results: sqlite.prepare(sql).all(...args) }; },
          };
        },
        async run() { const r = sqlite.prepare(sql).run(); return { meta: { changes: r.changes } }; },
        async first() { return sqlite.prepare(sql).get(); },
        async all() { return { results: sqlite.prepare(sql).all() }; },
        _sql: sql,
      };
    },
    async batch(stmts) { for (const st of stmts) await st.run(); return []; },
    _raw: sqlite,
  };
}

function insertUser(db, { username, email, role, active = 1 }) {
  db._raw.prepare(
    `INSERT INTO app_users (username, password_hash, role, active, email) VALUES (?,?,?,?,?)`
  ).run(username, 'irrelevant-hash', role, active, email);
}

function insertFund(db, name) {
  db._raw.prepare('INSERT INTO funds (name) VALUES (?)').run(name);
  return db._raw.prepare('SELECT id FROM funds WHERE name=?').get(name).id;
}

// ── Minimal RSA JWT helpers, mirroring test/access-jwt.test.js ─────────────
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


describe('Pledges for Finance (giving-pledges-v1, giving-pledges-write-v1)', () => {
  let keyPair, jwk, kid, originalFetch;
  beforeEach(async () => {
    resetAccessJwtCacheForTests();
    originalFetch = globalThis.fetch;
    kid = 'test-kid';
    keyPair = await makeKeyPair();
    jwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    jwk.kid = kid;
    globalThis.fetch = async (url) => {
      if (String(url) === CERTS_URL) return new Response(JSON.stringify({ keys: [jwk] }), { status: 200 });
      throw new Error(`Unexpected fetch in test: ${url}`);
    };
  });
  afterEach(() => { globalThis.fetch = originalFetch; });

  const env = (db) => ({ DB: db, FINANCE_CONTRACT_API_KEY: 'right-secret', FINANCE_ACCESS_TEAM_DOMAIN: TEAM, FINANCE_ACCESS_AUD: AUD });
  async function call(db, path, { email = 'sarah@example.test', method = 'GET', body, query = '' } = {}) {
    const token = await signToken(keyPair.privateKey, kid, accessPayload(email));
    const req = new Request(`https://connect.example${path}${query}`, {
      method, headers: { 'X-Contract-Key': 'right-secret', 'Cf-Access-Jwt-Assertion': token, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return handleContractsServiceApi(req, env(db), path);
  }
  const list = (db, query, email) => call(db, '/api/contracts/giving-pledges-v1', { email, query });
  const write = (db, body, email) => call(db, '/api/contracts/giving-pledges-write-v1', { email, method: 'POST', body });

  // Fictional pledgers; one gift voided.
  function setup() {
    const db = makeTestDb();
    const raw = db._raw;
    const general = insertFund(db, '40085 General Fund');
    insertUser(db, { username: 'sarah', email: 'sarah@example.test', role: 'finance' });
    insertUser(db, { username: 'vic', email: 'vic@example.test', role: 'staff' });
    insertUser(db, { username: 'carl', email: 'carl@example.test', role: 'council' });
    raw.prepare("INSERT INTO chms_config (key, value) VALUES ('role_permissions_json', ?)").run(JSON.stringify({ staff: { giving: 'view' } }));
    raw.prepare("INSERT INTO households (id, name) VALUES (1, 'Sample Household')").run();
    raw.prepare("INSERT INTO people (first_name, last_name, household_id) VALUES ('Ada','Sample',1), ('Ben','Sample',1), ('Cara','Example',NULL)").run();
    raw.prepare("INSERT INTO giving_batches (batch_date) VALUES ('2026-03-01')").run();
    const add = (person, cents, date, original = cents) => raw.prepare(
      'INSERT INTO giving_entries (batch_id, person_id, fund_id, amount, method, contribution_date, original_amount_cents) VALUES (1,?,?,?,?,?,?)'
    ).run(person, general, cents, 'check', date, original);
    add(1, 60000, '2026-03-01');
    add(1, 0, '2026-04-01', 90000);
    add(1, 10000, '2025-12-31');
    raw.prepare("INSERT INTO pledges (person_id, fiscal_year, amount_cents, note) VALUES (1, 2026, 120000, 'monthly'), (3, 2026, 50000, ''), (1, 2025, 100000, '')").run();
    return { db };
  }

  it('lists the year’s pledges with what each pledger gave that year, and finds people to add', async () => {
    const { db } = setup();
    const res = await (await list(db, '?year=2026&q=samp', 'vic@example.test')).json();
    expect(res).toMatchObject({ contract: 'connect.giving-pledges.v1', year: 2026 });
    expect(res.pledges.map((p) => [p.last_name, p.amount_cents, p.given_cents, p.household_name])).toEqual([
      ['Example', 50000, 0, null], ['Sample', 120000, 60000, 'Sample Household'],
    ]);
    expect(res.people.map((p) => p.first_name)).toEqual(['Ada', 'Ben']);
    expect((await list(db, '?year=2026', 'carl@example.test')).status).toBe(403);
  });

  it('adds, changes and removes a pledge for Giving edit only', async () => {
    const { db } = setup();
    expect((await write(db, { op: 'set', person_id: 2, fiscal_year: 2026, amount_cents: 1000 }, 'vic@example.test')).status).toBe(403);
    expect((await write(db, { op: 'set', person_id: 2, fiscal_year: 2026, amount_cents: -1 })).status).toBe(400);
    expect((await write(db, { op: 'set', person_id: 99, fiscal_year: 2026, amount_cents: 1 })).status).toBe(404);
    await write(db, { op: 'set', person_id: 2, fiscal_year: 2026, amount_cents: 26000, note: 'new' });
    await write(db, { op: 'set', person_id: 1, fiscal_year: 2026, amount_cents: 130000, note: '' });
    const rows = db._raw.prepare('SELECT person_id, amount_cents, note FROM pledges WHERE fiscal_year=2026 ORDER BY person_id').all();
    expect(rows).toEqual([{ person_id: 1, amount_cents: 130000, note: '' }, { person_id: 2, amount_cents: 26000, note: 'new' }, { person_id: 3, amount_cents: 50000, note: '' }]);
    expect(await (await write(db, { op: 'delete', person_id: 3, fiscal_year: 2026 })).json()).toMatchObject({ ok: true, removed: 1 });
    expect(db._raw.prepare('SELECT COUNT(*) AS n FROM pledges').get().n).toBe(3);
  });
});
