import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { handleContractsServiceApi } from '../src/api-contracts-service.js';
import { resetAccessJwtCacheForTests } from '../src/access-jwt.js';

const TEAM = 'timothystl.cloudflareaccess.com';
const AUD = 'test-audience-tag';
const CERTS_URL = `https://${TEAM}/cdn-cgi/access/certs`;

function makeTestDb() {
  const sqlite = new DatabaseSync(':memory:');
  // Every Connect migration, in order, so giving_entries/people/deposits carry their real columns.
  for (const f of readdirSync(new URL('../migrations/', import.meta.url)).filter((n) => n.endsWith('.sql')).sort()) {
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

describe('Council giving report contracts (giving-board-v1, giving-board-email-v1)', () => {
  let keyPair, jwk, kid, originalFetch, mail;
  beforeEach(async () => {
    resetAccessJwtCacheForTests();
    originalFetch = globalThis.fetch;
    kid = 'test-kid';
    keyPair = await makeKeyPair();
    jwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    jwk.kid = kid;
    mail = [];
    globalThis.fetch = async (url, init) => {
      if (String(url) === CERTS_URL) return new Response(JSON.stringify({ keys: [jwk] }), { status: 200 });
      if (String(url) === 'https://api.brevo.com/v3/smtp/email') {
        mail.push(JSON.parse(init.body));
        return new Response(JSON.stringify({ messageId: `m${mail.length}` }), { status: 201 });
      }
      throw new Error(`Unexpected fetch in test: ${url}`);
    };
  });
  afterEach(() => { globalThis.fetch = originalFetch; });

  const env = (db) => ({ DB: db, FINANCE_CONTRACT_API_KEY: 'right-secret', FINANCE_ACCESS_TEAM_DOMAIN: TEAM, FINANCE_ACCESS_AUD: AUD, BREVO_API_KEY: 'k' });
  async function call(db, path, { email = 'sarah@timothystl.org', method = 'GET', body, query = '' } = {}) {
    const token = await signToken(keyPair.privateKey, kid, accessPayload(email));
    const req = new Request(`https://connect.example${path}${query}`, {
      method,
      headers: { 'X-Contract-Key': 'right-secret', 'Cf-Access-Jwt-Assertion': token, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return handleContractsServiceApi(req, env(db), path);
  }

  function setup() {
    const db = makeTestDb();
    const raw = db._raw;
    raw.prepare("INSERT INTO funds (name, category) VALUES ('40085 General Fund','general'), ('50010 Missions','restricted')").run();
    const [general, missions] = raw.prepare('SELECT id FROM funds ORDER BY id').all().map((r) => r.id);
    insertUser(db, { username: 'sarah', email: 'sarah@timothystl.org', role: 'finance' });
    insertUser(db, { username: 'carl', email: 'carl@timothystl.org', role: 'council' });
    raw.prepare("INSERT INTO people (first_name, last_name) VALUES ('Walter','Krause'), ('Anna','Schreiber')").run();
    raw.prepare("INSERT INTO giving_batches (batch_date) VALUES ('2025-03-02'), ('2026-03-01')").run();
    const add = (batch, person, fund, cents, date, method = 'check') => raw.prepare(
      'INSERT INTO giving_entries (batch_id, person_id, fund_id, amount, method, contribution_date) VALUES (?,?,?,?,?,?)'
    ).run(batch, person, fund, cents, method, date);
    add(1, 1, general, 90000, '2025-03-02');
    add(2, 1, general, 100000, '2026-03-01');
    add(2, 2, general, 50000, '2026-03-01', 'ach');
    add(2, 2, missions, 20000, '2026-03-01');
    raw.prepare("INSERT INTO chms_config (key, value) VALUES ('church_from_email','office@timothystl.org'), ('church_from_name','Timothy Lutheran Church')").run();
    return { db };
  }

  it('returns the same report as Connect’s board, by category, and council may read it', async () => {
    const { db } = setup();
    const res = await call(db, '/api/contracts/giving-board-v1', { email: 'carl@timothystl.org', query: '?period=2026-06' });
    expect(res.status).toBe(200);
    const board = await res.json();
    expect(board).toMatchObject({ contract: 'connect.giving-board.v1', year: 2026, prior_year: 2025, through_month: 6, period_label: 'June 2026' });
    expect(board.categories.general).toMatchObject({ given_ytd_cents: 150000, households: 2, label: expect.any(String) });
    expect(board.categories.all.given_ytd_cents).toBe(170000);
    expect(board.categories.general.monthly.current[2]).toBe(150000);
    expect(board.categories.general.monthly.prior[2]).toBe(90000);
    expect((await call(db, '/api/contracts/giving-board-v1', { query: '?period=junk' })).status).toBe(400);
  });

  it('emails the packet one copy per address, from the church, only for Giving edit', async () => {
    const { db } = setup();
    const body = { to: 'a@example.org, B@example.org; a@example.org', subject: 'Council\nreport', html: '<p>Report</p>' };
    expect((await call(db, '/api/contracts/giving-board-email-v1', { method: 'POST', body, email: 'carl@timothystl.org' })).status).toBe(403);
    expect(mail).toHaveLength(0);
    const res = await call(db, '/api/contracts/giving-board-email-v1', { method: 'POST', body });
    expect(await res.json()).toMatchObject({ ok: true, sent: 2, failed: [] });
    expect(mail.map((m) => m.to[0].email)).toEqual(['a@example.org', 'b@example.org']);
    expect(mail[0]).toMatchObject({ subject: 'Council report', sender: { email: 'office@timothystl.org' }, htmlContent: '<p>Report</p>' });
    expect((await call(db, '/api/contracts/giving-board-email-v1', { method: 'POST', body: { to: 'not-an-address', html: 'x' } })).status).toBe(400);
    const many = Array.from({ length: 26 }, (_, i) => `p${i}@example.org`).join(',');
    expect((await call(db, '/api/contracts/giving-board-email-v1', { method: 'POST', body: { to: many, html: 'x' } })).status).toBe(400);
  });
});
