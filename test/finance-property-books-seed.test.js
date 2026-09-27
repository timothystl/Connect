import { beforeEach, describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { resetEnsuredSchemasForTests } from '../apps/finance/finance-owned-schema.js';
import { readPropertyBooks, reconcile, summarizeReceivables } from '../apps/finance/property-books-service.js';
import {
  PROPERTY_BANK_REC_SEED, PROPERTY_RECEIVABLES_SEED, resetPropertyBooksSeedForTests, seedPropertyBooksFromReports,
} from '../apps/finance/property-books-seed.js';

function makeDb() {
  const sqlite = new DatabaseSync(':memory:');
  const statement = (sql, args = []) => ({
    sql,
    bind: (...next) => statement(sql, next),
    async run() { const r = sqlite.prepare(sql).run(...args); return { meta: { last_row_id: Number(r.lastInsertRowid) } }; },
    async first() { return sqlite.prepare(sql).get(...args) ?? null; },
    async all() { return { results: sqlite.prepare(sql).all(...args) }; },
  });
  return {
    sqlite,
    prepare: (sql) => statement(sql),
    async batch(stmts) {
      const out = [];
      for (const s of stmts) out.push(/^\s*SELECT/i.test(s.sql) ? await s.all() : await s.run());
      return out;
    },
  };
}

beforeEach(() => { resetEnsuredSchemasForTests(); resetPropertyBooksSeedForTests(); });

describe('AHRA report seed for the property books', () => {
  it('every seeded month reconciles bank to the manager’s cash', () => {
    for (const [month, bank, transit, checks, book] of PROPERTY_BANK_REC_SEED) {
      const r = reconcile({ statement_balance_cents: bank, deposits_in_transit_cents: transit, outstanding_checks_cents: checks, book_balance_cents: book });
      expect(r.reconciled, month).toBe(true);
    }
  });

  it('receivable totals match each report’s aging and deposit ledger totals', () => {
    const totals = (m) => summarizeReceivables(PROPERTY_RECEIVABLES_SEED[m].map(([, c, d60, d90, o90, dep]) => ({
      current_cents: c, days_31_60_cents: d60, days_61_90_cents: d90, over_90_cents: o90, deposit_held_cents: dep,
    })));
    expect(totals('2025-12')).toMatchObject({ owedCents: 73721, depositsCents: 652500 });
    expect(totals('2026-01')).toMatchObject({ owedCents: 148432, depositsCents: 545000 });
    expect(totals('2026-03')).toMatchObject({ owedCents: 459497, depositsCents: 545000 });
    expect(totals('2026-05')).toMatchObject({ owedCents: 164921, depositsCents: 390000 });
    expect(totals('2026-06')).toMatchObject({ owedCents: 104096, depositsCents: 492500 });
    expect(totals('2026-07')).toMatchObject({ owedCents: 110221, depositsCents: 492500 });
    expect(totals('2026-08')).toMatchObject({ owedCents: -2884, depositsCents: 492500 });
  });

  it('never names a resident', () => {
    const tenants = Object.values(PROPERTY_RECEIVABLES_SEED).flat().map(([[tenant]]) => tenant);
    expect(new Set(tenants)).toEqual(new Set(['Magnatone', 'Breakout Fitness', '2nd-floor apartment', '1st-floor apartment']));
  });

  it('loads once in production, keeps what an admin already entered, and does not return after removal', async () => {
    const db = makeDb();
    const env = { ENVIRONMENT: 'production', FINANCE_DB: db };
    // An admin already recorded August by hand before the seed ran.
    await seedPropertyBooksFromReports({ ENVIRONMENT: 'staging', FINANCE_DB: db });
    db.sqlite.exec(`CREATE TABLE IF NOT EXISTS finance_property_bank_recs (property_key TEXT NOT NULL DEFAULT 'ivanhoe', statement_month TEXT NOT NULL, statement_balance_cents INTEGER NOT NULL, deposits_in_transit_cents INTEGER NOT NULL DEFAULT 0, outstanding_checks_cents INTEGER NOT NULL DEFAULT 0, book_balance_cents INTEGER NOT NULL, note TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT (datetime('now')), updated_by TEXT NOT NULL DEFAULT '', PRIMARY KEY (property_key, statement_month))`);
    db.sqlite.exec(`INSERT INTO finance_property_bank_recs (statement_month, statement_balance_cents, book_balance_cents, note) VALUES ('2026-08', 100, 100, 'hand entry')`);

    expect(await seedPropertyBooksFromReports(env)).toBe(true);
    let books = await readPropertyBooks(db);
    expect(books.bankRecs).toHaveLength(8);
    expect(books.bankRecs.find((r) => r.statement_month === '2026-08').note).toBe('hand entry');
    expect(books.receivables.filter((r) => r.report_month === '2026-08')).toHaveLength(4);

    // Removing a month afterwards sticks, even in a fresh isolate.
    db.sqlite.exec(`DELETE FROM finance_property_receivables WHERE report_month='2026-02'`);
    resetPropertyBooksSeedForTests();
    expect(await seedPropertyBooksFromReports(env)).toBe(false);
    books = await readPropertyBooks(db);
    expect(books.receivables.some((r) => r.report_month === '2026-02')).toBe(false);
    expect(books.receivables.filter((r) => r.report_month === '2026-08')).toHaveLength(4);
  });

  it('does nothing outside production', async () => {
    const db = makeDb();
    expect(await seedPropertyBooksFromReports({ ENVIRONMENT: 'staging', FINANCE_DB: db })).toBe(false);
    expect(db.sqlite.prepare("SELECT name FROM sqlite_master WHERE name='finance_seed_log'").get()).toBeUndefined();
  });
});
