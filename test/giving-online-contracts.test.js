import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { handleContractsServiceApi } from '../src/api-contracts-service.js';
import { handleStaxGivingMockupPublicApi } from '../src/stax-giving-mockup.js';
import { resetAccessJwtCacheForTests } from '../src/access-jwt.js';

// Finance's Giving Entry → Online giving form page reads and writes these settings through
// giving-online-settings(-write)-v1. Same identity model as the Gift Entry batch contracts.
const TEAM = 'timothystl.cloudflareaccess.com';
const AUD = 'test-audience-tag';
const CERTS_URL = `https://${TEAM}/cdn-cgi/access/certs`;

function makeTestDb() {
  const sqlite = new DatabaseSync(':memory:');
  for (const f of readdirSync(new URL('../migrations/', import.meta.url)).filter((n) => n.endsWith('.sql')).sort()) {
    sqlite.exec(readFileSync(new URL(`../migrations/${f}`, import.meta.url), 'utf8'));
  }
  const stmt = (sql, args = []) => ({
    async run() {
      const r = sqlite.prepare(sql).run(...args);
      return { meta: { last_row_id: Number(r.lastInsertRowid), changes: r.changes } };
    },
    async first() { return sqlite.prepare(sql).get(...args); },
    async all() { return { results: sqlite.prepare(sql).all(...args) }; },
  });
  return {
    prepare(sql) { return { bind: (...args) => stmt(sql, args), ...stmt(sql) }; },
    async batch(stmts) { const out = []; for (const s of stmts) out.push(await s.run()); return out; },
    _raw: sqlite,
  };
}

function b64url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const b64urlJson = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));
async function signToken(privateKey, kid, payload) {
  const input = `${b64urlJson({ alg: 'RS256', kid, typ: 'JWT' })}.${b64urlJson(payload)}`;
  const sig = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, privateKey, new TextEncoder().encode(input));
  return `${input}.${b64url(new Uint8Array(sig))}`;
}

describe('Online giving form settings contracts (giving-online-*-v1)', () => {
  let keyPair, originalFetch;
  const kid = 'test-kid';
  beforeEach(async () => {
    resetAccessJwtCacheForTests();
    originalFetch = globalThis.fetch;
    keyPair = await crypto.subtle.generateKey(
      { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
    const jwk = { ...(await crypto.subtle.exportKey('jwk', keyPair.publicKey)), kid };
    globalThis.fetch = async (url) => {
      if (String(url) === CERTS_URL) return new Response(JSON.stringify({ keys: [jwk] }), { status: 200 });
      throw new Error(`Unexpected fetch in test: ${url}`);
    };
  });
  afterEach(() => { globalThis.fetch = originalFetch; });

  const env = (db) => ({ DB: db, FINANCE_CONTRACT_API_KEY: 'right-secret', FINANCE_ACCESS_TEAM_DOMAIN: TEAM, FINANCE_ACCESS_AUD: AUD });
  async function call(db, path, { email = 'sarah@timothystl.org', method = 'GET', body } = {}) {
    const now = Math.floor(Date.now() / 1000);
    const token = await signToken(keyPair.privateKey, kid, { email, iss: `https://${TEAM}`, aud: AUD, exp: now + 3600, iat: now });
    const req = new Request(`https://connect.example${path}`, {
      method,
      headers: { 'X-Contract-Key': 'right-secret', 'Cf-Access-Jwt-Assertion': token, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return handleContractsServiceApi(req, env(db), path);
  }
  const read = (db, email) => call(db, '/api/contracts/giving-online-settings-v1', { email });
  const write = (db, body, email) => call(db, '/api/contracts/giving-online-settings-write-v1', { method: 'POST', body, email });

  function setup() {
    const db = makeTestDb();
    db._raw.exec("DELETE FROM funds");
    db._raw.prepare("INSERT INTO funds (name, public_giving) VALUES ('General Fund', 1), ('Missions', 0), ('Building', 0)").run();
    db._raw.prepare("INSERT INTO funds (name, public_giving, active) VALUES ('Old Appeal', 1, 0)").run();
    const id = (name) => db._raw.prepare('SELECT id FROM funds WHERE name=?').get(name).id;
    for (const [username, role] of [['sarah', 'finance'], ['carl', 'council']]) {
      db._raw.prepare('INSERT INTO app_users (username, password_hash, role, active, email) VALUES (?,?,?,1,?)')
        .run(username, 'irrelevant-hash', role, `${username}@timothystl.org`);
    }
    return { db, id };
  }

  it('reads the 2% default and the active funds with their public-form flag', async () => {
    const { db } = setup();
    const res = await read(db);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ fee_percent: 2, default_fee_percent: 2, max_fee_percent: 10 });
    expect(body.funds.map((f) => [f.name, f.public_giving])).toEqual([['Building', 0], ['General Fund', 1], ['Missions', 0]]);
  });

  it('saves the fee percentage, which the public form and checkout then use', async () => {
    const { db } = setup();
    const saved = await write(db, { op: 'fee', fee_percent: '3' });
    expect(saved.status).toBe(200);
    expect(await saved.json()).toEqual({ ok: true, fee_percent: 3 });
    expect((await (await read(db)).json()).fee_percent).toBe(3);
    const req = new Request('https://connect.example/api/mockup/stax-giving/funds');
    const funds = await (await handleStaxGivingMockupPublicApi(req, { DB: db }, new URL(req.url), 'GET', 'funds')).json();
    expect(funds.estimatedFeeRate).toBe(0.03);
    const audit = db._raw.prepare("SELECT field, new_value FROM audit_log WHERE action='giving_online_fee_via_finance'").get();
    expect(audit).toEqual({ field: 'fee_percent=3', new_value: 'sarah@timothystl.org' });
  });

  it('sets the public-form flag on every active fund, leaving inactive funds alone', async () => {
    const { db, id } = setup();
    const res = await write(db, { op: 'funds', public_fund_ids: [id('Missions'), id('Building')] });
    expect(await res.json()).toEqual({ ok: true, public_count: 2 });
    const flags = Object.fromEntries(db._raw.prepare('SELECT name, public_giving FROM funds').all().map((r) => [r.name, r.public_giving]));
    expect(flags).toEqual({ 'General Fund': 0, Missions: 1, Building: 1, 'Old Appeal': 1 });
  });

  it('rejects bad percentages and unknown actions', async () => {
    const { db } = setup();
    for (const fee_percent of ['', 'abc', 0, -1, 10.5]) {
      expect((await write(db, { op: 'fee', fee_percent })).status).toBe(400);
    }
    expect((await write(db, { op: 'nope' })).status).toBe(400);
    expect((await (await read(db)).json()).fee_percent).toBe(2);
  });

  it('refuses council, whose Giving access is totals only', async () => {
    const { db } = setup();
    expect((await read(db, 'carl@timothystl.org')).status).toBe(403);
    expect((await write(db, { op: 'fee', fee_percent: 3 }, 'carl@timothystl.org')).status).toBe(403);
    expect((await write(db, { op: 'fee', fee_percent: 3 }, 'nobody@timothystl.org')).status).toBe(403);
  });
});
