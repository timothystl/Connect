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


describe('Transactions page contract and gift corrections (giving-transactions-v1)', () => {
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
  async function call(db, path, { email = 'sarah@timothystl.org', method = 'GET', body, query = '' } = {}) {
    const token = await signToken(keyPair.privateKey, kid, accessPayload(email));
    const req = new Request(`https://connect.example${path}${query}`, {
      method,
      headers: { 'X-Contract-Key': 'right-secret', 'Cf-Access-Jwt-Assertion': token, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return handleContractsServiceApi(req, env(db), path);
  }
  const write = (db, body, email) => call(db, '/api/contracts/giving-batch-write-v1', { method: 'POST', body, email });
  const search = async (db, query) => (await call(db, '/api/contracts/giving-transactions-v1', { query })).json();

  async function setup() {
    const db = makeTestDb();
    const general = insertFund(db, 'General Fund');
    const missions = insertFund(db, 'Missions');
    insertUser(db, { username: 'sarah', email: 'sarah@timothystl.org', role: 'finance' });
    insertUser(db, { username: 'carl', email: 'carl@timothystl.org', role: 'council' });
    db._raw.prepare(`INSERT INTO people (first_name, last_name, envelope_number, envelope_history) VALUES
      ('Walter','Krause','212','["88"]'), ('Anna','Schreiber','',  '[]')`).run();
    const walter = db._raw.prepare("SELECT id FROM people WHERE last_name='Krause'").get().id;
    const anna = db._raw.prepare("SELECT id FROM people WHERE last_name='Schreiber'").get().id;
    const { batch_id } = await (await write(db, { op: 'create_batch', batch_date: '2026-09-27' })).json();
    const a = await (await write(db, { op: 'add_gift', batch_id, person_id: walter, method: 'check', check_number: '2207', splits: [{ fund_id: general, amount: '100' }] })).json();
    const b = await (await write(db, { op: 'add_gift', batch_id, person_id: anna, method: 'cash', splits: [{ fund_id: missions, amount: '40' }] })).json();
    const c = await (await write(db, { op: 'add_gift', batch_id, method: 'cash', notes: 'Loose cash', gift_date: '2026-03-01', splits: [{ fund_id: general, amount: '12.50' }] })).json();
    await write(db, { op: 'close_batch', batch_id });
    return { db, general, missions, walter, anna, batch_id, ids: { walter: a.ids[0], anna: b.ids[0], loose: c.ids[0] } };
  }

  it('lists gifts with Breeze-style totals, fund and method overviews, and filters', async () => {
    const { db, general } = await setup();
    let r = await search(db, '?from=2026-01-01&to=2026-12-31');
    expect(r.totals).toMatchObject({ gift_count: 3, total_cents: 15250, giver_count: 2, anonymous_count: 1 });
    expect(r.by_fund.map((f) => [f.fund_name, f.gift_count, f.total_cents])).toEqual([['General Fund', 2, 11250], ['Missions', 1, 4000]]);
    expect(r.by_method.map((m) => m.method).sort()).toEqual(['cash', 'check']);
    expect(r.rows[0]).toMatchObject({ gift_date: '2026-09-27' });
    expect(r.methods).toEqual(['cash', 'check']);

    expect((await search(db, `?from=2026-01-01&to=2026-12-31&funds=${general}&methods=cash`)).totals.gift_count).toBe(1);
    expect((await search(db, '?from=2026-01-01&to=2026-12-31&min=20&max=50')).rows.map((x) => x.person_name)).toEqual(['Anna Schreiber']);
    expect((await search(db, '?from=2026-09-01&to=2026-09-30')).totals.gift_count).toBe(2);
    // Name, current envelope, an envelope the giver used before, and a check number all find Walter.
    for (const q of ['krause', '212', '88', '2207']) {
      expect((await search(db, `?from=2026-01-01&to=2026-12-31&q=${q}`)).rows.map((x) => x.person_name)).toEqual(['Walter Krause']);
    }
    expect((await search(db, '?from=2026-01-01&to=2026-12-31&sort=amount_asc')).rows.map((x) => x.amount)).toEqual([1250, 4000, 10000]);
  });

  it('finds a giver by an old envelope number in Gift Entry too', async () => {
    const { db } = await setup();
    const ws = await (await call(db, '/api/contracts/giving-batch-workspace-v1', { query: '?q=88' })).json();
    expect(ws.people.map((p) => p.last_name)).toEqual(['Krause']);
  });

  it('corrects a gift in a closed batch in place and keeps who changed what and why', async () => {
    const { db, missions, anna, ids } = await setup();
    expect((await write(db, { op: 'correct_gift', entry_id: ids.walter, amount: '150' })).status).toBe(400); // reason required
    const res = await write(db, { op: 'correct_gift', entry_id: ids.walter, amount: '150', fund_id: missions, person_id: anna, gift_date: '2026-09-20', reason: 'Check was $150 for missions, Anna’s envelope' });
    expect(res.status).toBe(200);
    expect((await res.json()).changed).toBe(4);
    const row = db._raw.prepare('SELECT amount, fund_id, person_id, contribution_date FROM giving_entries WHERE id=?').get(ids.walter);
    expect(row).toEqual({ amount: 15000, fund_id: missions, person_id: anna, contribution_date: '2026-09-20' });
    const detail = (await search(db, `?entry_id=${ids.walter}`)).detail;
    expect(detail.history.map((h) => h.field).sort()).toEqual(['amount', 'fund', 'gift date', 'giver']);
    expect(detail.history.find((h) => h.field === 'amount')).toMatchObject({ old_value: '$100.00', new_value: '$150.00' });
    expect(detail.history.find((h) => h.field === 'giver')).toMatchObject({ old_value: 'Walter Krause', new_value: 'Anna Schreiber' });
    expect(detail.history.find((h) => h.field === 'fund')).toMatchObject({ old_value: 'General Fund', new_value: 'Missions' });
    expect(detail.history[0]).toMatchObject({ changed_by: 'sarah@timothystl.org', action: 'corrected', reason: 'Check was $150 for missions, Anna’s envelope' });
    // Moving a gift to anonymous, and nothing-changed is a no-op.
    expect((await (await write(db, { op: 'correct_gift', entry_id: ids.anna, person_id: '', reason: 'Asked to be anonymous' })).json()).changed).toBe(1);
    expect((await (await write(db, { op: 'correct_gift', entry_id: ids.anna, method: 'cash', reason: 'x' })).json()).changed).toBe(0);
    expect((await search(db, '?from=2026-01-01&to=2026-12-31&status=changed')).totals.gift_count).toBe(2);
  });

  it('voids, refunds and restores gifts so totals and statements count only what was kept', async () => {
    const { db, walter, ids } = await setup();
    expect((await write(db, { op: 'void_gift', entry_id: ids.walter, kind: 'returned', reason: 'Bank returned it 10/2' })).status).toBe(200);
    let row = db._raw.prepare('SELECT amount, original_amount_cents, voided_at, void_reason FROM giving_entries WHERE id=?').get(ids.walter);
    expect(row).toMatchObject({ amount: 0, original_amount_cents: 10000, void_reason: 'Returned check (NSF): Bank returned it 10/2' });
    expect(row.voided_at).not.toBe('');
    expect((await write(db, { op: 'void_gift', entry_id: ids.walter, kind: 'error' })).status).toBe(409);
    expect((await write(db, { op: 'correct_gift', entry_id: ids.walter, amount: '100', reason: 'x' })).status).toBe(409);
    let r = await search(db, '?from=2026-01-01&to=2026-12-31');
    expect(r.totals).toMatchObject({ total_cents: 5250, voided_count: 1 });
    expect((await search(db, '?from=2026-01-01&to=2026-12-31&status=voided')).rows.map((x) => x.id)).toEqual([ids.walter]);

    expect((await write(db, { op: 'restore_gift', entry_id: ids.walter })).status).toBe(400);
    expect((await write(db, { op: 'restore_gift', entry_id: ids.walter, reason: 'Bank re-presented it' })).status).toBe(200);
    expect(db._raw.prepare('SELECT amount, voided_at FROM giving_entries WHERE id=?').get(ids.walter)).toEqual({ amount: 10000, voided_at: '' });

    expect((await write(db, { op: 'void_gift', entry_id: ids.walter, kind: 'refund', refund_amount: '150' })).status).toBe(400);
    expect((await write(db, { op: 'void_gift', entry_id: ids.walter, kind: 'refund', refund_amount: '25', reason: 'Overpaid' })).status).toBe(200);
    row = db._raw.prepare('SELECT amount, refunded_cents, original_amount_cents FROM giving_entries WHERE id=?').get(ids.walter);
    expect(row).toEqual({ amount: 7500, refunded_cents: 2500, original_amount_cents: 10000 });
    r = await search(db, '?from=2026-01-01&to=2026-12-31&status=refunded');
    expect(r.totals.total_cents).toBe(7500);

    // A fully voided gift drops off the giving statement; a partial refund shows the net.
    await write(db, { op: 'void_gift', entry_id: ids.anna, kind: 'error' });
    const statement = db._raw.prepare(
      `SELECT ge.amount FROM giving_entries ge JOIN giving_batches gb ON gb.id=ge.batch_id WHERE ge.person_id=? AND ge.amount > 0`
    ).all(walter);
    expect(statement).toEqual([{ amount: 7500 }]);
  });

  it('leaves online-processor gifts to the processor, and nets gifts voided before this change', async () => {
    const { db, general, batch_id } = await setup();
    db._raw.prepare(`INSERT INTO giving_entries (batch_id, fund_id, amount, method, processor, external_txn_id, contribution_date)
      VALUES (?,?,?,?,?,?,?)`).run(batch_id, general, 5000, 'card', 'stax', 'txn_1', '2026-09-27');
    const stax = db._raw.prepare("SELECT id FROM giving_entries WHERE external_txn_id='txn_1'").get().id;
    expect((await write(db, { op: 'void_gift', entry_id: stax, kind: 'refund' })).status).toBe(409);

    db._raw.prepare(`INSERT INTO giving_entries (batch_id, fund_id, amount, method, voided_at, contribution_date) VALUES (?,?,?,?,?,?)`)
      .run(batch_id, general, 3000, 'cash', '2026-09-28 10:00:00', '2026-09-27');
    db._raw.prepare(`INSERT INTO giving_entries (batch_id, fund_id, amount, method, refunded_cents, contribution_date) VALUES (?,?,?,?,?,?)`)
      .run(batch_id, general, 2000, 'card', 2000, '2026-09-27');
    const backfill = readFileSync(new URL('../migrations/0059_giving_entry_corrections.sql', import.meta.url), 'utf8');
    db._raw.exec(backfill.slice(backfill.indexOf('UPDATE giving_entries')));
    db._raw.exec(backfill.slice(backfill.indexOf('UPDATE giving_entries')));
    expect(db._raw.prepare('SELECT amount, original_amount_cents FROM giving_entries WHERE original_amount_cents > 0 ORDER BY id').all())
      .toEqual([{ amount: 0, original_amount_cents: 3000 }, { amount: 0, original_amount_cents: 2000 }]);
  });

  it('refuses council (anonymous-only Giving) and needs Giving edit to correct', async () => {
    const { db, ids } = await setup();
    expect((await call(db, '/api/contracts/giving-transactions-v1', { email: 'carl@timothystl.org' })).status).toBe(403);
    expect((await write(db, { op: 'void_gift', entry_id: ids.walter, kind: 'error' }, 'carl@timothystl.org')).status).toBe(403);
    expect(db._raw.prepare('SELECT amount FROM giving_entries WHERE id=?').get(ids.walter).amount).toBe(10000);
  });

  it('shows online payments, recurring gifts and who gives online, and matches an online gift to a person', async () => {
    const { db, general, walter, batch_id } = await setup();
    db._raw.prepare(`INSERT INTO giving_entries (batch_id, fund_id, amount, method, processor, external_txn_id, fee_cents, contribution_date)
      VALUES (?,?,?,?,?,?,?,date('now'))`).run(batch_id, general, 28867, 'card', 'stax', 'txn_9', 867);
    const entry = db._raw.prepare("SELECT id FROM giving_entries WHERE external_txn_id='txn_9'").get().id;
    db._raw.prepare(`INSERT INTO giving_stax_unmatched (giving_entry_id, payer_name, payer_email, card_brand, card_last4, stax_customer_id)
      VALUES (?,?,?,?,?,?)`).run(entry, 'W. Krause', 'wk@example.org', 'visa', '4242', 'cus_1');
    db._raw.prepare(`INSERT INTO giving_stax_recurring_schedules (person_id, fund_id, amount_cents, interval, status, payer_name)
      VALUES (?,?,?,?,?,?)`).run(walter, general, 5000, 'monthly', 'active', 'Walter Krause');

    let online = await (await call(db, '/api/contracts/giving-online-v1')).json();
    expect(online.totals).toMatchObject({ year_cents: 28867, year_fee_cents: 867, year_count: 1 });
    expect(online.unmatched.map((u) => [u.payer_name, u.card_last4, u.amount])).toEqual([['W. Krause', '4242', 28867]]);
    expect(online.recurring[0]).toMatchObject({ person_name: 'Walter Krause', amount_cents: 5000, status: 'active' });
    expect(online.payments[0]).toMatchObject({ id: entry, fee_cents: 867, payer_name: 'W. Krause' });

    expect((await write(db, { op: 'link_online_gift', queue_id: online.unmatched[0].queue_id, person_id: walter })).status).toBe(200);
    expect(db._raw.prepare('SELECT person_id FROM giving_entries WHERE id=?').get(entry).person_id).toBe(walter);
    expect(db._raw.prepare('SELECT stax_customer_id FROM giving_stax_customers WHERE person_id=?').get(walter).stax_customer_id).toBe('cus_1');
    expect((await write(db, { op: 'ignore_online_gift', queue_id: online.unmatched[0].queue_id })).status).toBe(409);

    online = await (await call(db, '/api/contracts/giving-online-v1')).json();
    expect(online.unmatched).toEqual([]);
    expect(online.connections[0]).toMatchObject({ person_name: 'Walter Krause', processor_accounts: 1, active_recurring: 1, year_cents: 28867 });

    const schedule = online.recurring[0].id;
    expect((await write(db, { op: 'update_recurring', schedule_id: schedule, fund_id: general, amount: '75', interval: 'weekly' })).status).toBe(200);
    expect(db._raw.prepare('SELECT amount_cents, interval FROM giving_stax_recurring_schedules WHERE id=?').get(schedule)).toEqual({ amount_cents: 7500, interval: 'weekly' });
    expect((await write(db, { op: 'cancel_recurring', schedule_id: schedule })).status).toBe(200);
    expect(db._raw.prepare('SELECT status FROM giving_stax_recurring_schedules WHERE id=?').get(schedule).status).toBe('cancelled');
    expect((await call(db, '/api/contracts/giving-online-v1', { email: 'carl@timothystl.org' })).status).toBe(403);
  });
});
