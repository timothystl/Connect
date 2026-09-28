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


describe('Deposit tools for Finance (giving-deposit-v1 and the deposit write ops)', () => {
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
  const write = async (db, body, email) => call(db, '/api/contracts/giving-batch-write-v1', { email, method: 'POST', body });
  const detail = async (db, id, q = '') => (await call(db, '/api/contracts/giving-deposit-v1', { query: `?id=${id}${q}` })).json();

  // A closed $1,000 batch of checks, and two online gifts on no deposit (fictional givers).
  function setup() {
    const db = makeTestDb();
    const raw = db._raw;
    const general = insertFund(db, '40085 General Fund');
    insertUser(db, { username: 'sarah', email: 'sarah@example.test', role: 'finance' });
    insertUser(db, { username: 'vic', email: 'vic@example.test', role: 'staff' });
    raw.prepare("INSERT INTO chms_config (key, value) VALUES ('role_permissions_json', ?)").run(JSON.stringify({ staff: { giving: 'view' } }));
    raw.prepare("INSERT INTO people (first_name, last_name) VALUES ('Ada','Sample'), ('Cara','Example')").run();
    raw.prepare("INSERT INTO giving_batches (batch_date, description, closed) VALUES ('2026-09-20', 'Sunday', 1), ('2026-09-23', 'Online', 0)").run();
    const add = (batch, person, cents, method, date, fee = 0) => raw.prepare(
      'INSERT INTO giving_entries (batch_id, person_id, fund_id, amount, method, contribution_date, original_amount_cents, fee_cents) VALUES (?,?,?,?,?,?,?,?)'
    ).run(batch, person, general, cents, method, date, cents, fee);
    add(1, 1, 60000, 'check', '2026-09-20');
    add(1, 2, 40000, 'check', '2026-09-20');
    add(2, 1, 15000, 'online', '2026-09-23', 480);
    add(2, 2, 5000, 'online', '2026-09-24', 160);
    return { db, raw };
  }

  it('splits a batch across two deposits and refuses more than is left', async () => {
    const { db, raw } = setup();
    const first = await (await write(db, { op: 'deposit_batch', batch_id: 1, deposit_date: '2026-09-21', amount: '600.00' })).json();
    expect(first.ok).toBe(true);
    expect((await write(db, { op: 'deposit_batch', batch_id: 1, deposit_date: '2026-09-22', amount: '500' })).status).toBe(400);
    const second = await (await write(db, { op: 'create_deposit', deposit_date: '2026-09-22', source: 'check' })).json();
    expect((await write(db, { op: 'set_deposit_line', deposit_id: second.deposit_id, batch_id: 1, amount: '400.01' })).status).toBe(400);
    expect((await write(db, { op: 'set_deposit_line', deposit_id: second.deposit_id, batch_id: 1 })).status).toBe(200);
    expect(raw.prepare('SELECT deposit_id, amount_cents FROM giving_deposit_lines ORDER BY deposit_id').all()).toEqual([
      { deposit_id: first.deposit_id, amount_cents: 60000 }, { deposit_id: second.deposit_id, amount_cents: 40000 },
    ]);
    const ledger = await (await call(db, '/api/contracts/giving-batch-ledger-v1')).json();
    expect(ledger.summary.awaiting_deposit).toMatchObject({ count: 1, cents: 20000 }); // only the online batch is left
    expect(ledger.deposits.map((d) => d.given_cents)).toEqual([40000, 60000]);
    // Taking the only line off a deposit deletes the empty slip.
    const off = await (await write(db, { op: 'remove_deposit_line', deposit_id: second.deposit_id, batch_id: 1 })).json();
    expect(off).toMatchObject({ ok: true, deposit_deleted: true });
  });

  it('puts online gifts on a deposit and shows fees against the bank figure', async () => {
    const { db, raw } = setup();
    const dep = await (await write(db, { op: 'create_deposit', deposit_date: '2026-09-25', source: 'online', external_ref: 'Payout' })).json();
    const before = await detail(db, dep.deposit_id, '&from=2026-09-01&to=2026-09-30');
    expect(before.unassigned.map((g) => g.id)).toEqual([4, 3, 2, 1]); // no batch has deposit lines yet
    expect(before.batches_to_add.map((b) => b.id)).toEqual([1]);
    await write(db, { op: 'deposit_batch', batch_id: 1, deposit_date: '2026-09-21' });
    expect((await detail(db, dep.deposit_id)).unassigned.map((g) => g.id)).toEqual([4, 3]); // batch 1 is now deposited by its line
    await write(db, { op: 'assign_gifts', deposit_id: dep.deposit_id, entry_ids: [3, 4, 1] });
    expect(raw.prepare('SELECT id FROM giving_entries WHERE deposit_id=? ORDER BY id').all(dep.deposit_id).map((r) => r.id)).toEqual([1, 3, 4]);
    await write(db, { op: 'unassign_gifts', deposit_id: dep.deposit_id, entry_ids: [1] });
    await write(db, { op: 'reconcile_deposit', deposit_id: dep.deposit_id, bank_amount: '193.60' });
    const after = await detail(db, dep.deposit_id);
    expect(after.deposit).toMatchObject({ status: 'reconciled', given_cents: 20000, bank_cents: 19360 });
    expect(after.totals).toMatchObject({ fee_cents: 640, net_cents: 19360, balanced: true });
    expect(after.bank_gap_cents).toBe(640);
    expect(after.unassigned).toEqual([]);
    expect((await write(db, { op: 'assign_gifts', deposit_id: dep.deposit_id, entry_ids: [1] })).status).toBe(409);
    expect((await write(db, { op: 'delete_deposit', deposit_id: dep.deposit_id })).status).toBe(409);
  });

  it('edits and deletes an open deposit without deleting any gift, and keeps writes to Giving edit', async () => {
    const { db, raw } = setup();
    const dep = await (await write(db, { op: 'create_deposit', deposit_date: '2026-09-25' })).json();
    await write(db, { op: 'assign_gifts', deposit_id: dep.deposit_id, entry_ids: [3] });
    await write(db, { op: 'update_deposit', deposit_id: dep.deposit_id, deposit_date: '2026-09-26', source: 'online', external_ref: 'Ref 9', notes: 'Stax payout' });
    expect(raw.prepare('SELECT deposit_date, source, external_ref, notes FROM giving_deposits WHERE id=?').get(dep.deposit_id)).toEqual({ deposit_date: '2026-09-26', source: 'online', external_ref: 'Ref 9', notes: 'Stax payout' });
    expect((await write(db, { op: 'delete_deposit', deposit_id: dep.deposit_id }, 'vic@example.test')).status).toBe(403);
    expect((await call(db, '/api/contracts/giving-deposit-v1', { email: 'vic@example.test', query: `?id=${dep.deposit_id}` })).status).toBe(200);
    await write(db, { op: 'delete_deposit', deposit_id: dep.deposit_id });
    expect(raw.prepare('SELECT COUNT(*) AS n FROM giving_deposits').get().n).toBe(0);
    expect(raw.prepare('SELECT COUNT(*) AS n FROM giving_entries WHERE deposit_id IS NULL').get().n).toBe(4);
    expect((await call(db, '/api/contracts/giving-deposit-v1', { query: '?id=999' })).status).toBe(404);
  });
});
