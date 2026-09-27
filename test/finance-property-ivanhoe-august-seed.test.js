import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { initDb, _resetInitForTests } from '../src/db.js';

// Same dialect shim as db-init-fastpath.test.js: D1 accepts `=""`, node:sqlite does not.
const forNodeSqlite = (sql) => sql.replace(/=""/g, "=''");

function makeDb() {
  const sqlite = new DatabaseSync(':memory:');
  const db = {
    prepare(sql) {
      const q = forNodeSqlite(sql);
      const mk = (args) => ({
        async run() { const r = sqlite.prepare(q).run(...args); return { meta: { last_row_id: Number(r.lastInsertRowid) } }; },
        async first() { return sqlite.prepare(q).get(...args) ?? null; },
        async all() { return { results: sqlite.prepare(q).all(...args) }; },
      });
      return { bind: (...args) => mk(args), ...mk([]) };
    },
    async batch(stmts) { const out = []; for (const s of stmts) out.push(await s.run()); return out; },
  };
  return { db, sqlite };
}

beforeEach(() => _resetInitForTests());

describe('3277 Ivanhoe August 2026 report seed', () => {
  it('adds August, the September reserve and the July distribution, and fills only blank fields', async () => {
    const { db, sqlite } = makeDb();
    await initDb(db);
    const month = (p) => sqlite.prepare("SELECT * FROM finance_property_monthly WHERE property_key='ivanhoe' AND period=?").get(p);
    const aug = month('2026-08');
    expect(aug).toMatchObject({ total_revenue_cents: 976276, total_expenses_cents: 636769, net_income_cents: 339507, net_operating_income_cents: 433203, loan_payment_cents: 378303, interest_expense_cents: 93196 });
    expect(aug.total_revenue_cents - aug.total_expenses_cents).toBe(aug.net_income_cents);
    expect(month('2026-01').total_expenses_cents).toBe(422727);
    expect(month('2026-01').total_revenue_cents - month('2026-01').total_expenses_cents).toBe(month('2026-01').net_income_cents);
    expect(month('2026-05').total_revenue_cents - month('2026-05').total_expenses_cents).toBe(month('2026-05').net_income_cents);
    // Already-recorded values stay as they were.
    expect(month('2026-03').available_for_distribution_cents).toBe(411482);
    expect(month('2026-03').reserve_balance_cents).toBe(830000);
    const sep = sqlite.prepare("SELECT * FROM finance_property_reserves WHERE reserve_key='property_tax' AND report_month='2026-09'").get();
    expect(sep).toMatchObject({ reserve_before_cents: 696667, contribution_cents: 110833, reserve_after_cents: 807500 });
    expect(sqlite.prepare("SELECT amount_cents FROM finance_property_distributions WHERE period='2026-07'").get().amount_cents).toBe(658444);
  });

  it('does not add the July distribution again when August already has one', async () => {
    const { db, sqlite } = makeDb();
    await initDb(db);
    sqlite.exec("DELETE FROM finance_property_distributions WHERE period='2026-07'");
    sqlite.exec("INSERT INTO finance_property_distributions (property_key, period, amount_cents) VALUES ('ivanhoe','2026-08',658444)");
    sqlite.exec("DELETE FROM finance_settings WHERE key='finance_property_ivanhoe_2026_08_seeded'");
    sqlite.exec("DELETE FROM chms_config WHERE key='schema_fingerprint'");
    _resetInitForTests();
    await initDb(db);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM finance_property_distributions WHERE period IN ('2026-07','2026-08')").get().n).toBe(1);
  });
});
