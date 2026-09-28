import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { initDb, _resetInitForTests } from '../src/db.js';

// .github/workflows/purge-stax-sandbox-gifts.yml deletes production giving rows, so its SQL is run
// here, exactly as written in the workflow, against Connect's real schema (initDb, with the giving
// rollup triggers) holding sandbox gifts next to real ones.

const workflow = readFileSync(new URL('../.github/workflows/purge-stax-sandbox-gifts.yml', import.meta.url), 'utf8');
const shellVar = (name) => workflow.match(new RegExp(`${name}="([^"]+)"`))[1];
const ENTRIES = shellVar('ENTRIES');
const EMPTY = shellVar('EMPTY_MOCKUP_BATCHES');
const expand = (sql) => sql.replace(/\$ENTRIES/g, ENTRIES).replace(/\$EMPTY_MOCKUP_BATCHES/g, EMPTY);
const COUNT_SQL = expand(workflow.match(/count_sql="([\s\S]+?)"\n/)[1]);
const STRAY_SQL = workflow.match(/stray=\$\(q "([^"]+)"/)[1];
const DELETE_SQL = expand(workflow.match(/q "(DELETE FROM giving_entry_changes[\s\S]+?)" > \/dev\/null/)[1]);

async function makeDb() {
  const sqlite = new DatabaseSync(':memory:');
  const q = (sql) => sql.replace(/=""/g, "=''"); // D1 accepts "" literals; node:sqlite does not
  const db = {
    prepare(sql) {
      const mk = (args) => ({
        async run() { const r = sqlite.prepare(q(sql)).run(...args); return { meta: { last_row_id: Number(r.lastInsertRowid) } }; },
        async first() { return sqlite.prepare(q(sql)).get(...args); },
        async all() { return { results: sqlite.prepare(q(sql)).all(...args) }; },
      });
      return { bind: (...args) => mk(args), ...mk([]) };
    },
    batch: async () => [],
  };
  await initDb(db);
  return sqlite;
}

function seed(sqlite) {
  const run = (sql, ...args) => Number(sqlite.prepare(sql).run(...args).lastInsertRowid);
  const fund = run("INSERT INTO funds (name) VALUES ('General Fund')");
  const person = run("INSERT INTO people (first_name, last_name) VALUES ('Real', 'Giver')");
  const mockBatch = run("INSERT INTO giving_batches (batch_date, description) VALUES ('2026-09-19', 'Stax Giving (mockup) 2026-09')");
  const realBatch = run("INSERT INTO giving_batches (batch_date, description) VALUES ('2026-09-20', 'Plate & envelopes')");
  const gift = (batch, personId, amount, source, processor, txn) => run(
    `INSERT INTO giving_entries (batch_id, person_id, fund_id, amount, contribution_date, source, processor, external_txn_id)
     VALUES (?,?,?,?, '2026-09-19', ?,?,?)`, batch, personId, fund, amount, source, processor, txn);
  const unmatched1 = gift(mockBatch, null, 100, 'stax_mockup', 'stax', 't1');
  const unmatched2 = gift(mockBatch, null, 5000, 'stax_mockup', 'stax', 't2');
  gift(mockBatch, person, 2500, 'stax_mockup', 'stax', 't3');
  const real = gift(realBatch, person, 10000, '', '', '');
  const tithely = gift(realBatch, person, 4200, 'tithely', 'tithely', 'tly-1');
  for (const id of [unmatched1, unmatched2]) run("INSERT INTO giving_stax_unmatched (giving_entry_id, payer_name) VALUES (?, 'Test Payer')", id);
  // D1, like node:sqlite, enforces foreign keys, so a review row cannot outlive its gift; one is
  // forced in here only to exercise the workflow's clean-up of such rows.
  sqlite.exec('PRAGMA foreign_keys=OFF');
  run("INSERT INTO giving_stax_unmatched (giving_entry_id, payer_name) VALUES (99999, 'Already removed gift')");
  sqlite.exec('PRAGMA foreign_keys=ON');
  run("INSERT INTO giving_entry_changes (entry_id, action) VALUES (?, 'void')", unmatched2);
  run("INSERT INTO giving_entry_changes (entry_id, action) VALUES (?, 'correct')", real);
  run("INSERT INTO giving_deposits (deposit_date) VALUES ('2026-09-21')");
  run('INSERT INTO giving_deposit_lines (deposit_id, batch_id, amount_cents) VALUES (1, ?, 5100)', mockBatch);
  run('INSERT INTO giving_deposit_lines (deposit_id, batch_id, amount_cents) VALUES (1, ?, 14200)', realBatch);
  run("INSERT INTO giving_stax_recurring_schedules (fund_id, amount_cents) VALUES (?, 2500)", fund);
  run("INSERT INTO giving_stax_customers (person_id, stax_customer_id) VALUES (?, 'sandbox-cust')", person);
  return { realBatch, real, tithely };
}

beforeEach(() => _resetInitForTests());

describe('purge-stax-sandbox-gifts workflow SQL', () => {
  it('counts only the sandbox gifts and the mockup-only tables', async () => {
    const sqlite = await makeDb();
    seed(sqlite);
    expect(sqlite.prepare(COUNT_SQL).get()).toMatchObject({
      gifts: 3, gift_cents: 7600, matched_gifts: 1, other_stax_gifts: 0, change_rows: 1,
      review_rows: 3, review_rows_outside: 1, mockup_batches: 1, mockup_batches_all: 1,
      deposit_links: 1, schedules: 1, customer_links: 1,
    });
    expect(sqlite.prepare(STRAY_SQL).get().n).toBe(0);
  });

  it('removes the sandbox data, keeps every other gift, and keeps the rollups consistent', async () => {
    const sqlite = await makeDb();
    const { realBatch, real, tithely } = seed(sqlite);
    sqlite.exec(DELETE_SQL);
    expect(sqlite.prepare(COUNT_SQL).get()).toMatchObject({
      gifts: 0, review_rows: 0, mockup_batches: 0, mockup_batches_all: 0, deposit_links: 0, schedules: 0, customer_links: 0,
    });
    expect(sqlite.prepare('SELECT id FROM giving_entries ORDER BY id').all().map((r) => r.id)).toEqual([real, tithely]);
    expect(sqlite.prepare('SELECT entry_id FROM giving_entry_changes').all()).toEqual([{ entry_id: real }]);
    expect(sqlite.prepare('SELECT batch_id FROM giving_deposit_lines').all()).toEqual([{ batch_id: realBatch }]);
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM people').get().n).toBe(1);
    // The triggers moved the totals with the deletes: only the real gifts are counted.
    expect(sqlite.prepare('SELECT batch_id, entry_count, total_cents FROM giving_batch_totals').all())
      .toEqual([{ batch_id: realBatch, entry_count: 2, total_cents: 14200 }]);
    expect(sqlite.prepare('SELECT COALESCE(SUM(total_cents),0) AS c FROM giving_monthly_fund_totals').get().c).toBe(14200);
    // Running it again changes nothing.
    sqlite.exec(DELETE_SQL);
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM giving_entries').get().n).toBe(2);
  });

  it('keeps a mockup batch that also holds a non-sandbox gift', async () => {
    const sqlite = await makeDb();
    seed(sqlite);
    sqlite.prepare("INSERT INTO giving_entries (batch_id, fund_id, amount, contribution_date) VALUES (1, 1, 700, '2026-09-19')").run();
    sqlite.exec(DELETE_SQL);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM giving_batches WHERE description LIKE 'Stax Giving (mockup) %'").get().n).toBe(1);
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM giving_deposit_lines WHERE batch_id=1').get().n).toBe(1);
  });
});
