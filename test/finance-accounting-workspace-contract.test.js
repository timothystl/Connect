import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleContractsServiceApi } from '../src/api-contracts-service.js';
import { resetAccessJwtCacheForTests } from '../src/access-jwt.js';

const TEAM = 'timothystl.cloudflareaccess.com';
const AUD = 'test-audience-tag';
const PATH = '/api/contracts/finance-workspace-v1';
const CERTS_URL = `https://${TEAM}/cdn-cgi/access/certs`;

function makeTestDb() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_baseline.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0008_app_users_email.sql', import.meta.url), 'utf8'));
  sqlite.exec(`CREATE TABLE finance_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT (datetime('now')))`);
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
      };
    },
    _raw: sqlite,
  };
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

// Every name/dollar figure below is entirely fabricated for this test -- never a real production
// value.
const PLAN = { roster: [{ name: 'Test Worker', currentPayCents: 5000000 }], compMethod: 'flat' };

describe('accounting workspace contract', () => {
  let db, keyPair, token, originalFetch, env;
  beforeEach(async () => {
    db = makeTestDb();
    db._raw.exec(`CREATE TABLE finance_budget_plan(id INTEGER PRIMARY KEY, category TEXT, classification TEXT, fiscal_year INTEGER, planned_amount_cents INTEGER, basis TEXT, notes TEXT, updated_at TEXT);
      INSERT INTO finance_budget_plan VALUES(1,'Test', 'Expenses',2027,10000,'manual','','now');`);
    insertUser(db, { username: 'alice', email: 'alice@example.test', role: 'admin' });
    resetAccessJwtCacheForTests();
    keyPair = await makeKeyPair();
    const jwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey); jwk.kid = 'workspace';
    token = await signToken(keyPair.privateKey, 'workspace', accessPayload('alice@example.test'));
    originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ keys: [jwk] }));
    env = { DB: db, FINANCE_CONTRACT_API_KEY: 'key', FINANCE_ACCESS_TEAM_DOMAIN: TEAM, FINANCE_ACCESS_AUD: AUD };
  });
  afterEach(() => { globalThis.fetch = originalFetch; db._raw.close(); });
  function call(path, method = 'GET', body, headers = {}) {
    const req = new Request('https://connect.example'+PATH+'?path='+encodeURIComponent(path), {
      method, headers: { 'X-Contract-Key': 'key', 'Cf-Access-Jwt-Assertion': token, 'Content-Type':'application/json', ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return handleContractsServiceApi(req, env, PATH);
  }
  it('reuses the real read handler and preserves source values', async () => {
    const r = await call('planning/church'); expect(r.status).toBe(200);
    expect(JSON.stringify(await r.json())).toContain('10000');
  });
  it('saves settings with the established handler', async () => {
    const r = await call('planning/board-categories','PUT',{ accountLabels:{test:'Test category'} });
    expect(r.status).toBe(200);
    expect(JSON.stringify(db._raw.prepare('SELECT * FROM finance_settings').all())).toContain('Test category');
  });
  it('rejects missing or invalid identity and contract keys', async () => {
    expect((await call('planning/church','GET',undefined,{'X-Contract-Key':'bad'})).status).toBe(401);
    expect((await call('planning/church','GET',undefined,{'Cf-Access-Jwt-Assertion':'bad'})).status).toBe(401);
    db._raw.exec('UPDATE app_users SET active=0');
    expect((await call('planning/church')).status).toBe(403);
  });
  it('cannot become a general proxy, expose QuickBooks or revive clear-all', async () => {
    for (const p of ['../people','//evil.test','qb/connect','church/clear-all','church/this-year/../clear-all']) {
      expect((await call(p)).status).toBe(404);
    }
    expect((await call('planning/church','DELETE')).status).toBe(404);
  });
  it('enforces the existing view/edit and admin-only gates, ignoring forged actor headers', async () => {
    db._raw.exec("UPDATE app_users SET role='staff'");
    expect((await call('planning/church','GET',undefined,{'X-Role':'admin'})).status).toBe(403);
    db._raw.exec("UPDATE app_users SET role='finance'");
    expect((await call('planning/church')).status).toBe(200);
    expect((await call('planning/board-categories','PUT',{expenseLabels:{test:'forbidden'}})).status).toBe(403);
    expect(db._raw.prepare('SELECT COUNT(*) n FROM finance_settings').get().n).toBe(0);
  });
  it('preserves permission-checked salary reads without adding a salary writer', async () => {
    db._raw.exec("UPDATE app_users SET role='staff'");
    expect((await call('planning/salary')).status).toBe(403);
    db._raw.prepare("INSERT OR REPLACE INTO chms_config(key,value) VALUES('role_permissions_json',?)").run(JSON.stringify({staff:{compensation:'view'}}));
    expect((await call('planning/salary')).status).toBe(200);
    expect((await call('planning/salary','PUT',{})).status).toBe(404);
  });
  it('keeps council budget reads and writes in the verified user’s private overlay', async () => {
    db._raw.exec("UPDATE app_users SET role='council'");
    // Council has compensation by default, but Budget is separately granted.
    db._raw.prepare("INSERT INTO finance_settings(key,value) VALUES('irrelevant','{}')").run();
    const { getRolePermissions, permissionsForRole } = await import('../src/api-utils.js');
    // Grant Budget through Connect's existing settings, not a role supplied by Finance.
    db._raw.prepare("INSERT OR REPLACE INTO chms_config(key,value) VALUES('role_permissions_json',?)").run(JSON.stringify({council:{budget:'edit'}}));
    expect(permissionsForRole(await getRolePermissions(db),'council').budget).toBe('edit');
    const r = await call('planning/church/override','POST',{category:'Test',fiscal_year:2027,planned_amount:321}, {'X-Username':'bob'});
    expect(r.status).toBe(200);
    const rows = db._raw.prepare("SELECT key,value FROM finance_settings WHERE key LIKE '%council%'").all();
    expect(rows).toHaveLength(1); expect(rows[0].key).toContain('alice'); expect(rows[0].key).not.toContain('bob');
    expect(db._raw.prepare('SELECT planned_amount_cents FROM finance_budget_plan').get().planned_amount_cents).toBe(10000);
    expect(JSON.stringify(await (await call('planning/church')).json())).toContain('32100');
  });
  it('keeps maintenance writes paused', async () => {
    env.FINANCE_STORAGE_MODE='copying';
    expect((await call('planning/board-categories','PUT',{})).status).toBe(503);
  });
});
