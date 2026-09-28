import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { handleContractsServiceApi } from '../src/api-contracts-service.js';
import { resetAccessJwtCacheForTests } from '../src/access-jwt.js';

const TEAM = 'timothystl.cloudflareaccess.com';
const AUD = 'test-audience-tag';
const PATH = '/api/contracts/tuition-aid-workspace-v1';
const CERTS_URL = `https://${TEAM}/cdn-cgi/access/certs`;

function makeTestDb() {
  const sqlite = new DatabaseSync(':memory:');
  // Every Connect migration, in order, so people and the tuition tables carry their real columns.
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
      };
    },
    async batch(statements) { return Promise.all(statements.map((st) => st.all())); },
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

describe('Tuition Aid planner contract (tuition-aid-workspace-v1)', () => {
  let db, keyPair, token, originalFetch, env;
  beforeEach(async () => {
    db = makeTestDb();
    insertUser(db, { username: 'sarah', email: 'sarah@example.test', role: 'finance' });
    db._raw.exec("INSERT INTO people (first_name, last_name) VALUES ('Test','Child')");
    resetAccessJwtCacheForTests();
    keyPair = await makeKeyPair();
    const jwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey); jwk.kid = 'tuition';
    token = await signToken(keyPair.privateKey, 'tuition', accessPayload('sarah@example.test'));
    originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ keys: [jwk] }));
    env = { DB: db, FINANCE_CONTRACT_API_KEY: 'key', FINANCE_ACCESS_TEAM_DOMAIN: TEAM, FINANCE_ACCESS_AUD: AUD };
  });
  afterEach(() => { globalThis.fetch = originalFetch; db._raw.close(); });
  function call(path, method = 'GET', body, headers = {}) {
    const req = new Request('https://connect.example' + PATH + '?path=' + encodeURIComponent(path), {
      method, headers: { 'X-Contract-Key': 'key', 'Cf-Access-Jwt-Assertion': token, 'Content-Type': 'application/json', ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return handleContractsServiceApi(req, env, PATH);
  }

  it('reads the planner bundle and saves a student through Connect’s own handlers', async () => {
    const add = await call('tuition-aid/students', 'POST', { family: 'Test', child: 'Child', base_grade: 3, outside_aid_cents: 0 });
    expect(add.status).toBe(200);
    const bundle = await (await call('tuition-aid/students')).json();
    expect(bundle.students.map((s) => s.child)).toContain('Child');
    const id = bundle.students.find((s) => s.child === 'Child').id;
    expect((await call(`tuition-aid/students/${id}`, 'PATCH', { outside_aid_cents: 50000 })).status).toBe(200);
    expect(db._raw.prepare('SELECT outside_aid_cents FROM tuition_students WHERE id=?').get(id).outside_aid_cents).toBe(50000);
    expect((await call('tuition-aid/config', 'PATCH', { key: 'growth_pct', value: '3' })).status).toBeLessThan(500);
  });

  it('lets the link-a-person search through, and nothing else about people', async () => {
    expect((await call('people?q=child')).status).toBe(200);
    expect((await call('people?q=child&limit=10')).status).toBe(200);
    for (const p of ['people', 'people?status=archived', 'people/1', 'people?q=x&export=1']) expect((await call(p)).status).toBe(404);
    expect((await call('people?q=child', 'POST', {})).status).toBe(404);
  });

  it('is not a general proxy', async () => {
    for (const p of ['../giving', 'finance/status', 'giving', 'tuition-aid/students/1/../../people', 'tuition-aid/students/abc']) {
      expect((await call(p)).status).toBe(404);
    }
    expect((await call('tuition-aid/config')).status).toBe(404); // PATCH only
  });

  it('keeps Connect’s Tuition Aid permission in charge, ignoring forged headers', async () => {
    db._raw.exec("UPDATE app_users SET role='council'");
    expect((await call('tuition-aid/students', 'GET', undefined, { 'X-Role': 'admin' })).status).toBe(403);
    db._raw.prepare("INSERT OR REPLACE INTO chms_config(key,value) VALUES('role_permissions_json',?)").run(JSON.stringify({ council: { tuitionaid: 'view' } }));
    expect((await call('tuition-aid/students')).status).toBe(200);
    expect((await call('tuition-aid/students', 'POST', { family: 'X', child: 'Y' })).status).toBe(403);
    db._raw.exec('UPDATE app_users SET active=0');
    expect((await call('tuition-aid/students')).status).toBe(403);
    expect((await call('tuition-aid/students', 'GET', undefined, { 'Cf-Access-Jwt-Assertion': 'bad' })).status).toBe(401);
  });
});
