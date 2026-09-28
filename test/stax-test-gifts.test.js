import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { initDb, _resetInitForTests } from '../src/db.js';
import { handleStaxGivingMockupPublicApi, recordStaxGift, staxTestMode } from '../src/stax-giving-mockup.js';
import { readOnlineGiving, clearTestGifts } from '../src/giving-online.js';

// Andrew, 2026-09-28: test the Stax giving form on the live system, never count test gifts, and
// give Finance a button to remove them. While Connect has only sandbox keys (no STAX_LIVE), gifts
// go to giving_test_gifts and never to the ledger. Runs against the real schema and triggers.

const forNodeSqlite = (sql) => sql.replace(/=""/g, "=''");
function makeDb() {
  const sqlite = new DatabaseSync(':memory:');
  const db = {
    prepare(sql) {
      const q = forNodeSqlite(sql);
      const mk = (args) => ({
        async run() { const r = sqlite.prepare(q).run(...args); return { meta: { last_row_id: Number(r.lastInsertRowid), changes: r.changes } }; },
        async first() { return sqlite.prepare(q).get(...args); },
        async all() { return { results: sqlite.prepare(q).all(...args) }; },
      });
      return { bind: (...args) => mk(args), ...mk([]) };
    },
    async batch(stmts) { const out = []; for (const s of stmts) out.push(await s.run()); return out; },
    _raw: sqlite,
  };
  return db;
}
const count = (db, sql) => db._raw.prepare(sql).get().n;

async function setup() {
  const db = makeDb();
  await initDb(db);
  const fundId = Number(db._raw.prepare("INSERT INTO funds (name, public_giving) VALUES ('Test General', 1)").run().lastInsertRowid);
  db._raw.prepare("INSERT INTO people (first_name,last_name,email,phone,active,status) VALUES ('Jamie','Vogel','jamie@example.com','',1,'active')").run();
  const personId = db._raw.prepare("SELECT id FROM people WHERE email='jamie@example.com'").get().id;
  return { db, fundId, personId };
}
const checkout = (db, env, body) => {
  const req = new Request('https://connect.timothystl.org/api/mockup/stax-giving/checkout', { method: 'POST', body: JSON.stringify(body) });
  return handleStaxGivingMockupPublicApi(req, { ...env, DB: db }, new URL(req.url), 'POST', 'checkout');
};

beforeEach(() => _resetInitForTests());

describe('Stax test gifts are kept out of real giving', () => {
  it('is test mode unless STAX_LIVE=1', () => {
    expect(staxTestMode({})).toBe(true);
    expect(staxTestMode({ STAX_SANDBOX_API_KEY: 'sk' })).toBe(true);
    expect(staxTestMode({ STAX_LIVE: '1' })).toBe(false);
  });

  it('records a form gift as a test gift, never in the ledger, batches or totals', async () => {
    const { db, fundId, personId } = await setup();
    const ledgerBefore = count(db, 'SELECT COUNT(*) AS n FROM giving_entries');
    const res = await checkout(db, {}, {
      gifts: [{ fund_id: fundId, amount: '25.00' }],
      payer_first_name: 'Jamie', payer_last_name: 'Vogel', payer_email: 'jamie@example.com',
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, test: true, matched: true, personId });
    expect(count(db, 'SELECT COUNT(*) AS n FROM giving_entries')).toBe(ledgerBefore);
    expect(count(db, "SELECT COUNT(*) AS n FROM giving_batches WHERE description LIKE 'Stax Giving%'")).toBe(0);
    expect(count(db, 'SELECT COUNT(*) AS n FROM giving_stax_unmatched')).toBe(0);
    expect(count(db, 'SELECT COALESCE(SUM(total_cents),0) AS n FROM giving_monthly_fund_totals')).toBe(0);
    expect(db._raw.prepare('SELECT fund_id, amount_cents, person_id, payer_name FROM giving_test_gifts').all())
      .toEqual([{ fund_id: fundId, amount_cents: 2500, person_id: personId, payer_name: 'Jamie Vogel' }]);
  });

  it('records the same processor transaction once', async () => {
    const { db, fundId } = await setup();
    const g = { test: true, externalTxnId: 'txn_1', splits: [{ fundId, amountCents: 1000 }], payerEmail: 'x@example.com' };
    expect((await recordStaxGift(db, g)).alreadyRecorded).toBe(false);
    expect((await recordStaxGift(db, g)).alreadyRecorded).toBe(true);
    expect(count(db, 'SELECT COUNT(*) AS n FROM giving_test_gifts')).toBe(1);
  });

  it('lists test gifts for Finance without counting them in the online totals', async () => {
    const { db, fundId } = await setup();
    await recordStaxGift(db, { test: true, externalTxnId: 'txn_2', splits: [{ fundId, amountCents: 5000 }], payerFirstName: 'Pat', payerLastName: 'Doe' });
    db._raw.prepare("INSERT INTO giving_stax_recurring_schedules (fund_id, amount_cents, test) VALUES (?, 2500, 1)").run(fundId);
    const data = await readOnlineGiving(db, '2026-09-28');
    expect(data.totals).toMatchObject({ month_cents: 0, year_cents: 0, year_count: 0 });
    expect(data.payments).toEqual([]);
    expect(data.test_totals).toEqual({ gifts: 1, gift_cents: 5000, schedules: 1 });
    expect(data.test_gifts[0]).toMatchObject({ amount_cents: 5000, payer_name: 'Pat Doe', person_id: null });
    expect(data.recurring[0]).toMatchObject({ test: 1 });
  });

  it('removes only test gifts, test schedules and their customer links', async () => {
    const { db, fundId, personId } = await setup();
    await recordStaxGift(db, { test: true, externalTxnId: 'txn_3', splits: [{ fundId, amountCents: 700 }], staxCustomerId: 'cus_test' });
    db._raw.prepare("INSERT INTO giving_stax_recurring_schedules (fund_id, amount_cents, stax_customer_id, test) VALUES (?, 2500, 'cus_test', 1)").run(fundId);
    db._raw.prepare('INSERT INTO giving_stax_recurring_schedules (fund_id, amount_cents, test) VALUES (?, 9900, 0)').run(fundId);
    db._raw.prepare("INSERT INTO giving_stax_customers (person_id, stax_customer_id) VALUES (?, 'cus_test')").run(personId);
    const batchId = Number(db._raw.prepare("INSERT INTO giving_batches (batch_date, description) VALUES ('2026-09-28','Plate')").run().lastInsertRowid);
    db._raw.prepare("INSERT INTO giving_entries (batch_id, fund_id, amount, contribution_date) VALUES (?, ?, 4200, '2026-09-28')").run(batchId, fundId);

    expect(await clearTestGifts(db, {})).toEqual({ ok: true, removed_gifts: 1, removed_schedules: 1, stax_cancelled: 0 });
    expect(count(db, 'SELECT COUNT(*) AS n FROM giving_test_gifts')).toBe(0);
    expect(db._raw.prepare('SELECT amount_cents, test FROM giving_stax_recurring_schedules').all()).toEqual([{ amount_cents: 9900, test: 0 }]);
    expect(count(db, 'SELECT COUNT(*) AS n FROM giving_stax_customers')).toBe(0);
    expect(count(db, 'SELECT COUNT(*) AS n FROM giving_entries')).toBe(1);
  });

  it('does not remember a test-mode customer on the person', async () => {
    const { db, personId } = await setup();
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ id: 'cus_sandbox' }), { status: 200 });
    try {
      const req = new Request('https://connect.timothystl.org/api/mockup/stax-giving/stax-customer', {
        method: 'POST', body: JSON.stringify({ payer_first_name: 'Jamie', payer_last_name: 'Vogel', payer_email: 'jamie@example.com' }),
      });
      const res = await handleStaxGivingMockupPublicApi(req, { STAX_SANDBOX_API_KEY: 'sk', STAX_SANDBOX_WEB_PAYMENTS_TOKEN: 'wpt', DB: db }, new URL(req.url), 'POST', 'stax-customer');
      expect(await res.json()).toEqual({ customerId: 'cus_sandbox' });
    } finally { globalThis.fetch = realFetch; }
    expect(db._raw.prepare('SELECT COUNT(*) AS n FROM giving_stax_customers WHERE person_id=?').get(personId).n).toBe(0);
  });
});
