import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { handleContractsServiceApi } from '../src/api-contracts-service.js';
import { resetAccessJwtCacheForTests } from '../src/access-jwt.js';
import { rebuildGivingLetterSendsIfLegacy } from '../src/db.js';

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


describe('Donor letters for Finance (giving-letters-v1, -send-v1, -mark-v1)', () => {
  let keyPair, jwk, kid, originalFetch, brevo;
  beforeEach(async () => {
    resetAccessJwtCacheForTests();
    originalFetch = globalThis.fetch;
    kid = 'test-kid';
    keyPair = await makeKeyPair();
    jwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    jwk.kid = kid;
    brevo = { calls: [], answer: () => new Response(JSON.stringify({ messageId: 'm1' }), { status: 201 }) };
    globalThis.fetch = async (url, init) => {
      if (String(url) === CERTS_URL) return new Response(JSON.stringify({ keys: [jwk] }), { status: 200 });
      if (String(url) === 'https://api.brevo.com/v3/smtp/email') {
        brevo.calls.push(JSON.parse(init.body));
        return brevo.answer(brevo.calls.length);
      }
      throw new Error(`Unexpected fetch in test: ${url}`);
    };
  });
  afterEach(() => { globalThis.fetch = originalFetch; });

  const env = (db) => ({ DB: db, FINANCE_CONTRACT_API_KEY: 'right-secret', FINANCE_ACCESS_TEAM_DOMAIN: TEAM, FINANCE_ACCESS_AUD: AUD, BREVO_API_KEY: 'test-key' });
  async function call(db, path, { email = 'sarah@example.test', method = 'GET', body, query = '' } = {}) {
    const token = await signToken(keyPair.privateKey, kid, accessPayload(email));
    const req = new Request(`https://connect.example${path}${query}`, {
      method,
      headers: { 'X-Contract-Key': 'right-secret', 'Cf-Access-Jwt-Assertion': token, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return handleContractsServiceApi(req, env(db), path);
  }
  const read = (db, op, query = '', email) => call(db, '/api/contracts/giving-letters-v1', { email, query: `?op=${op}${query}` });
  const send = (db, letters, email) => call(db, '/api/contracts/giving-letters-send-v1', { email, method: 'POST', body: { letters } });
  const mark = (db, marks, unmark = false, email) => call(db, '/api/contracts/giving-letters-mark-v1', { email, method: 'POST', body: { marks, unmark } });

  // Fictional givers: a household of two and a single giver whose only gift was voided.
  function setup() {
    const db = makeTestDb();
    const raw = db._raw;
    const general = insertFund(db, '40085 General Fund');
    insertUser(db, { username: 'sarah', email: 'sarah@example.test', role: 'finance' });
    insertUser(db, { username: 'vic', email: 'vic@example.test', role: 'staff' });
    insertUser(db, { username: 'carl', email: 'carl@example.test', role: 'council' });
    raw.prepare("INSERT INTO chms_config (key, value) VALUES ('role_permissions_json', ?)").run(JSON.stringify({ staff: { giving: 'view' } }));
    raw.prepare("INSERT INTO chms_config (key, value) VALUES ('church_name','Sample Church'), ('church_from_email','office@example.test'), ('church_ein','00-0000000')").run();
    raw.prepare("INSERT INTO households (id, name) VALUES (1, 'Sample Household')").run();
    raw.prepare("INSERT INTO people (first_name, last_name, household_id, email) VALUES ('Ada','Sample',1,'ada@example.test'), ('Ben','Sample',1,''), ('Cara','Example',NULL,'cara@example.test')").run();
    raw.prepare("INSERT INTO giving_batches (batch_date) VALUES ('2026-03-01')").run();
    const add = (person, cents, date, original = cents) => raw.prepare(
      'INSERT INTO giving_entries (batch_id, person_id, fund_id, amount, method, contribution_date, original_amount_cents) VALUES (1,?,?,?,?,?,?)'
    ).run(person, general, cents, 'check', date, original);
    add(1, 100000, '2026-03-01');
    add(2, 50000, '2026-07-15');
    add(3, 0, '2026-03-01', 25000); // voided
    return { db };
  }

  it('hands letter senders the church’s EIN and templates', async () => {
    const { db } = setup();
    const cfg = await (await read(db, 'config', '', 'vic@example.test')).json();
    expect(cfg).toMatchObject({ contract: 'connect.giving-letters.v1', church_name: 'Sample Church', church_ein: '00-0000000', from_email: 'office@example.test', logo_url: '' });
    expect(cfg.templates.year_end).toContain('{{gift_table}}');
  });

  it('gives statements without voided gifts, ended early by `through`', async () => {
    const { db } = setup();
    const res = await (await read(db, 'statements', '&year=2026&keys=h1,p3,p999,bad')).json();
    expect(res.statements.map((s) => s.key)).toEqual(['h1', 'p3']);
    expect(res.statements[0]).toMatchObject({ kind: 'household', total_cents: 150000 });
    expect(res.statements[1]).toMatchObject({ kind: 'person', total_cents: 0, entries: [] });
    const mid = await (await read(db, 'statements', '&year=2026&keys=h1&through=2026-06-30')).json();
    expect(mid.statements[0].total_cents).toBe(100000);
  });

  it('lists year-end recipients without voided-only givers', async () => {
    const { db } = setup();
    const res = await (await read(db, 'status', '&year=2026&letter_type=year_end&channel=email&scope=givers')).json();
    const names = res.recipients.map((r) => r.recipient_key);
    expect(names).toContain('p1');
    expect(names).not.toContain('p3');
    expect((await read(db, 'nope')).status).toBe(404);
  });

  it('keeps letters from council and sending from Giving view', async () => {
    const { db } = setup();
    expect((await read(db, 'config', '', 'carl@example.test')).status).toBe(403);
    expect((await send(db, [], 'vic@example.test')).status).toBe(403);
    expect((await mark(db, [], false, 'vic@example.test')).status).toBe(403);
  });

  it('sends through Brevo, records each send, and stops at the daily limit', async () => {
    const { db } = setup();
    brevo.answer = (n) => (n === 2 ? new Response(JSON.stringify({ message: 'daily limit' }), { status: 429 }) : new Response(JSON.stringify({ messageId: 'm' }), { status: 201 }));
    const letter = (key, to) => ({ recipient_key: key, to_email: to, to_name: 'X', subject: 'S', html: '<p>hi</p>', year: 2026, letter_type: 'year_end', person_id: 1 });
    const res = await (await send(db, [letter('p1', 'ada@example.test'), letter('p2', 'ben@example.test'), letter('p3', 'cara@example.test'), letter('p4', 'nope')])).json();
    expect(res).toMatchObject({ ok: true, sent: ['p1'], failed: [], stopped: true });
    expect(brevo.calls).toHaveLength(2);
    expect(brevo.calls[0]).toMatchObject({ sender: { email: 'office@example.test', name: 'Timothy Lutheran Church' }, to: [{ email: 'ada@example.test' }] });
    expect(db._raw.prepare('SELECT recipient_key, channel FROM giving_letter_sends').all()).toEqual([{ recipient_key: 'p1', channel: 'email' }]);
  });

  it('records a printed copy beside an emailed one, and undoes a mark', async () => {
    const { db } = setup();
    const base = { year: 2026, letter_type: 'year_end', person_id: 1 };
    await mark(db, [{ ...base, recipient_key: 'p1', channel: 'email' }]);
    const r = await (await mark(db, [{ ...base, recipient_key: 'p1', channel: 'print' }, { ...base, recipient_key: 'h1', channel: 'print', person_id: 0, household_id: 1 }, { recipient_key: 'x', year: 2026, letter_type: 'year_end' }])).json();
    expect(r.marked).toBe(2);
    expect(db._raw.prepare('SELECT recipient_key, channel FROM giving_letter_sends ORDER BY id').all()).toEqual([
      { recipient_key: 'p1', channel: 'email' }, { recipient_key: 'p1', channel: 'print' }, { recipient_key: 'h1', channel: 'print' },
    ]);
    await mark(db, [{ ...base, recipient_key: 'p1', channel: 'print' }], true);
    expect(db._raw.prepare('SELECT COUNT(*) AS n FROM giving_letter_sends').get().n).toBe(2);
  });

  it('rebuilds a legacy ledger without its per-person UNIQUE, keeping every row', async () => {
    const db = makeTestDb({ before: '0060' });
    db._raw.prepare("INSERT INTO giving_letter_sends (person_id, year, letter_type, channel, recipient_key) VALUES (1, 2025, 'year_end', 'email', 'p1'), (2, 2025, 'year_end', 'email', NULL)").run();
    expect(() => db._raw.prepare("INSERT INTO giving_letter_sends (person_id, year, letter_type, channel, recipient_key) VALUES (1, 2025, 'year_end', 'print', 'p1')").run()).toThrow();
    expect(await rebuildGivingLetterSendsIfLegacy(db)).toBe(true);
    expect(db._raw.prepare('SELECT COUNT(*) AS n FROM giving_letter_sends').get().n).toBe(2);
    db._raw.prepare("INSERT INTO giving_letter_sends (person_id, year, letter_type, channel, recipient_key) VALUES (1, 2025, 'year_end', 'print', 'p1')").run();
    expect(() => db._raw.prepare("INSERT INTO giving_letter_sends (person_id, year, letter_type, channel, recipient_key) VALUES (2, 2025, 'year_end', 'email', NULL)").run()).toThrow();
    expect(await rebuildGivingLetterSendsIfLegacy(db)).toBe(false);
  });
});
