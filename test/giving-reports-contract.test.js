import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { handleContractsServiceApi } from '../src/api-contracts-service.js';
import { resetAccessJwtCacheForTests } from '../src/access-jwt.js';
import { handleReportsApi } from '../src/api-reports.js';

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


describe('Giving analysis reports for Finance (giving-reports-v1, giving-impact-write-v1)', () => {
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
      method,
      headers: { 'X-Contract-Key': 'right-secret', 'Cf-Access-Jwt-Assertion': token, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return handleContractsServiceApi(req, env(db), path);
  }
  const report = (db, name, query = '', email) => call(db, '/api/contracts/giving-reports-v1', { email, query: `?report=${name}${query}` });

  // Fictional givers: two households and a single person, gifts in 2025 and 2026, and a week of
  // attendance.
  function setup() {
    const db = makeTestDb();
    const raw = db._raw;
    const general = insertFund(db, '40085 General Fund');
    const missions = insertFund(db, '50010 Missions');
    insertUser(db, { username: 'sarah', email: 'sarah@example.test', role: 'finance' });
    insertUser(db, { username: 'carl', email: 'carl@example.test', role: 'council' });
    insertUser(db, { username: 'ada', email: 'ada@example.test', role: 'admin' });
    raw.prepare("INSERT INTO households (id, name) VALUES (1, 'Sample Household')").run();
    raw.prepare("INSERT INTO people (first_name, last_name, household_id) VALUES ('Ada','Sample',1), ('Ben','Sample',1), ('Cara','Example',NULL)").run();
    raw.prepare("INSERT INTO giving_batches (batch_date) VALUES ('2025-03-02'), ('2026-03-01'), ('2026-03-08')").run();
    const add = (batch, person, fund, cents, date, method = 'check') => raw.prepare(
      'INSERT INTO giving_entries (batch_id, person_id, fund_id, amount, method, contribution_date) VALUES (?,?,?,?,?,?)'
    ).run(batch, person, fund, cents, method, date);
    add(1, 3, general, 90000, '2025-03-02');
    add(2, 1, general, 100000, '2026-03-01');
    add(2, 2, general, 50000, '2026-03-01', 'ach');
    add(3, 1, missions, 20000, '2026-03-08');
    raw.prepare("INSERT INTO worship_services (service_date, attendance) VALUES ('2026-03-01', 120), ('2026-03-08', 110)").run();
    return { db, general };
  }

  it('gives council the totals-only reports, computed exactly as Connect’s own reports', async () => {
    const { db } = setup();
    const dist = await (await report(db, 'distribution', '&year=2026', 'carl@example.test')).json();
    expect(dist).toMatchObject({ contract: 'connect.giving-reports.v1', report: 'distribution', year: 2026, scope: 'household', givers: 1, total_cents: 170000, median_cents: 170000 });
    const direct = await (await handleReportsApi(new Request('https://x/admin/api/reports/giving-distribution?year=2026'), env(db), new URL('https://x/admin/api/reports/giving-distribution?year=2026'), 'GET', 'reports/giving-distribution', db, false, false, false, false, true)).json();
    expect({ ...dist, contract: undefined, report: undefined }).toEqual({ ...direct, contract: undefined, report: undefined });
    const summary = await (await report(db, 'summary', '&from=2026-01-01&to=2026-12-31', 'carl@example.test')).json();
    expect(summary).toMatchObject({ grand_total_cents: 170000, total_givers: 2, total_transactions: 3 });
    expect(summary.by_method.map((m) => m.method).sort()).toEqual(['ach', 'check']);
    const gva = await (await report(db, 'vs-attendance', '&from=2026-03-01&to=2026-03-14', 'carl@example.test')).json();
    expect(gva.weeks).toEqual([
      { week_start: '2026-03-01', attendance: 120, giving_cents: 150000, givers: 2 },
      { week_start: '2026-03-08', attendance: 110, giving_cents: 20000, givers: 1 },
    ]);
    expect((await report(db, 'multiyear', '&end=2026&years=2', 'carl@example.test')).status).toBe(200);
    expect((await report(db, 'funds', '', 'carl@example.test')).status).toBe(200);
  });

  it('keeps the named reports and bands to Giving view, as Connect does', async () => {
    const { db } = setup();
    for (const name of ['insights', 'yoy', 'plateaus', 'bands', 'impact']) {
      const r = await report(db, name, '&year=2026', 'carl@example.test');
      expect(r.status, name).toBe(403);
    }
    const yoy = await (await report(db, 'yoy', '&year=2026')).json();
    expect(yoy.years).toEqual(['2024', '2025', '2026']);
    expect(yoy.people.find((p) => p.first_name === 'Cara')).toMatchObject({ prior_total: 90000, curr_total: 0 });
    const insights = await (await report(db, 'insights', '&year=2026')).json();
    expect(insights.lapsed.map((p) => p.first_name)).toEqual(['Cara']);
    const plateaus = await (await report(db, 'plateaus', '&year=2025&scope=household')).json();
    expect(plateaus.summary.total_givers).toBe(1);
    expect(plateaus).not.toHaveProperty('givers');
  });

  it('passes on only each report’s own parameters', async () => {
    const { db, general } = setup();
    const bands = await (await report(db, 'bands', `&year=2025&freq=monthly&uplift_cents=2500&fund_id=${general}&seg=reports/giving-insights`)).json();
    expect(bands).toMatchObject({ report: 'bands', freq: 'monthly', uplift_cents: 2500, fund_id: general, year: 2025 });
    expect(bands.summary.givers).toBe(1);
    const none = await (await report(db, 'bands', '&year=2025&uplift_cents=0')).json();
    expect(none).toMatchObject({ uplift_cents: 0, summary: { uplift_annual_cents: 0 } });
    expect((await (await report(db, 'bands', '&year=2025')).json()).uplift_cents).toBe(1000);
    expect(bands).not.toHaveProperty('top_givers');
    expect((await report(db, 'giving-statement')).status).toBe(404);
    expect((await report(db, '__proto__')).status).toBe(404);
  });

  it('lets only an admin change the impact statements, cleaned as Connect cleans them', async () => {
    const { db } = setup();
    const statements = [{ monthly_cents: 5000, label: '  a month of Sunday school supplies ' }, { monthly_cents: 0, label: 'dropped' }, { monthly_cents: 900, label: '' }];
    expect((await call(db, '/api/contracts/giving-impact-write-v1', { method: 'POST', body: { statements } })).status).toBe(403);
    expect((await call(db, '/api/contracts/giving-impact-write-v1', { email: 'carl@example.test', method: 'POST', body: { statements } })).status).toBe(403);
    const saved = await (await call(db, '/api/contracts/giving-impact-write-v1', { email: 'ada@example.test', method: 'POST', body: { statements } })).json();
    expect(saved.statements).toEqual([{ monthly_cents: 5000, label: 'a month of Sunday school supplies' }]);
    const read = await (await report(db, 'impact')).json();
    expect(read).toMatchObject({ statements: saved.statements, can_edit: false });
    expect((await (await report(db, 'impact', '', 'ada@example.test')).json()).can_edit).toBe(true);
  });
});
