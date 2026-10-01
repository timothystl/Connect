import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleContractsServiceApi } from '../src/api-contracts-service.js';
import { buildFinanceChurchYearV1, buildExpenseCategories } from '../src/api-finance-church-year-contract.js';
import { validateFinanceChurchYearV1, acceptFinanceChurchYearV1 } from '../contracts/validators/finance-church-year-consumer.js';
import { paceStatus, rankedExpenseCategories, groupFundsByCode, buildChurchYearCsv } from '../apps/finance/church-year-pages.js';
import worker from '../apps/finance/shell.js';
import { makeDb, seed } from './finance-health-fixture.js';

// Synthetic ledger from finance-health-fixture.js, plus a few months of invented history so the
// seasonal year-over-year and the supplies chart have something to read.
function seedMonthly(db) {
  const row = db.raw.prepare(`INSERT INTO finance_church_entries
    (fiscal_year,period_month,classification,category_path,account_name,depth,has_children,own_actual_cents,own_budget_cents,source)
    VALUES (?,?,?,?,?,2,0,?,NULL,'monthly_import')`);
  for (let m = 1; m <= 6; m += 1) {
    row.run(2026, m, 'Income', 'Income:40 Offerings & Contributions:40085 Sunday Offering', '40085 Sunday Offering', 1000000);
    row.run(2025, m, 'Income', 'Income:40 Offerings & Contributions:40085 Sunday Offering', '40085 Sunday Offering', 800000);
    row.run(2026, m, 'Expenses', 'Expenses:60 Salaries:60010 Pastor Salary', '60010 Pastor Salary', 600000);
    row.run(2025, m, 'Expenses', 'Expenses:60 Salaries:60010 Pastor Salary', '60010 Pastor Salary', 550000);
  }
  for (const m of [1, 2, 3]) row.run(2026, m, 'Expenses', 'Expenses:36 Office:36010 Office Supplies', '36010 Office Supplies', 10000);
  for (const m of [1, 2]) row.run(2025, m, 'Expenses', 'Expenses:36 Office:36010 Office Supplies', '36010 Office Supplies', 8000);
}

describe('connect.finance-church-year.v1', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-07-01T12:00:00Z')); });
  afterEach(() => { vi.useRealTimers(); });

  it('builds expense categories with their line items, giving by fund and an honest fallback projection', async () => {
    const db = makeDb();
    seed(db);
    const report = await buildFinanceChurchYearV1(db, { fiscalYear: 2026, now: new Date() });
    expect(validateFinanceChurchYearV1(report)).toEqual({ ok: true, errors: [] });
    expect(report.totals).toEqual({
      income: { actualCents: 8900000, budgetCents: 12000000 },
      expenses: { actualCents: 9000000, budgetCents: 8200000 },
      net: { actualCents: -100000, budgetCents: 3800000 },
    });
    const byLabel = Object.fromEntries(report.expenseCategories.map((c) => [c.label, c]));
    expect(byLabel['60 Salaries']).toMatchObject({ actualCents: 4000000, budgetCents: 6000000, children: [{ label: '60010 Pastor Salary', actualCents: 4000000, budgetCents: 6000000 }] });
    expect(byLabel['34 Utilities']).toMatchObject({ actualCents: 600000, budgetCents: 1200000 });
    expect(byLabel['57 MDO Expenses']).toMatchObject({ actualCents: 4000000, budgetCents: 0 });
    expect(report.expenseCategories.reduce((s, c) => s + c.actualCents, 0)).toBe(report.totals.expenses.actualCents);
    expect(report.givingCents).toBe(1950000);
    expect(report.givingByFund).toEqual([{ fundName: '40085 General Fund', cents: 1700000 }, { fundName: '25004 Building Fund', cents: 250000 }]);
    // No month-by-month rows: a straight-line estimate, labeled as one, and no supplies months.
    expect(report.yoy).toMatchObject({ available: true, seasonal: false, throughMonth: 7 });
    expect(report.yoy.net.method).toBe('straight-line-annual');
    expect(report.supplies.monthly.every((m) => !m.currentCents && !m.priorCents)).toBe(true);
    expect(report.elapsedFraction).toBeCloseTo(181.5 / 365, 4);
  });

  it('carries the seasonal comparison and the supplies months when monthly history is loaded', async () => {
    const db = makeDb();
    seed(db);
    seedMonthly(db);
    const report = await buildFinanceChurchYearV1(db, { fiscalYear: 2026, now: new Date() });
    expect(validateFinanceChurchYearV1(report).ok).toBe(true);
    expect(report.yoy.seasonal).toBe(true);
    expect(report.yoy.income).toMatchObject({ currentYtdCents: 6000000, priorYtdCents: 4800000, method: 'prior-year-ratio' });
    expect(report.supplies.monthly.slice(0, 4)).toEqual([
      { month: 1, currentCents: 10000, priorCents: 8000 }, { month: 2, currentCents: 10000, priorCents: 8000 },
      { month: 3, currentCents: 10000, priorCents: 0 }, { month: 4, currentCents: 0, priorCents: 0 },
    ]);
    expect(report.supplies).toMatchObject({ currentYtdCents: 30000, priorYtdCents: 16000 });
  });

  it('is served to Finance with its key, refuses a missing year, and names no donor', async () => {
    const db = makeDb();
    seed(db);
    const env = { DB: db, FINANCE_CONTRACT_API_KEY: 'right-secret' };
    const call = (key, query = '?fiscal_year=2026') => handleContractsServiceApi(
      new Request(`https://connect.example/api/contracts/finance-church-year-v1${query}`, { headers: { 'X-Contract-Key': key } }), env, '/api/contracts/finance-church-year-v1');
    expect((await call('wrong')).status).toBe(401);
    expect((await call('right-secret', '')).status).toBe(400);
    const res = await call('right-secret');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(acceptFinanceChurchYearV1(body).fiscalYear).toBe(2026);
    expect(JSON.stringify(body)).not.toMatch(/person_id|household_id|first_name|last_name|email/);
  });

  it('rejects a payload with extra fields or a donor-shaped fund row', () => {
    const base = {
      contract: 'connect.finance-church-year.v1', dataClassification: 'aggregate', sourceProduct: 'connect', consumerProduct: 'finance', currency: 'USD',
      fiscalYear: 2026, generatedAt: '2026-07-01T12:00:00.000Z', hasLedger: true, hasBudgetData: true, asOfDate: '', elapsedFraction: 0.5,
      totals: { income: { actualCents: 1, budgetCents: 1 }, expenses: { actualCents: 1, budgetCents: 1 }, net: { actualCents: 0, budgetCents: 0 } },
      expenseCategories: [], yoy: { available: false }, supplies: { monthly: [], currentYtdCents: 0, priorYtdCents: 0 }, givingCents: 0, givingByFund: [],
    };
    expect(validateFinanceChurchYearV1(base)).toEqual({ ok: true, errors: [] });
    expect(validateFinanceChurchYearV1({ ...base, extra: 1 }).ok).toBe(false);
    expect(validateFinanceChurchYearV1({ ...base, givingByFund: [{ fundName: 'x', cents: 1, person_id: 4 }] }).ok).toBe(false);
    expect(validateFinanceChurchYearV1({ ...base, currency: 'EUR' }).ok).toBe(false);
  });

  it('groups a parent with only grouping rows and skips lines with nothing in them', () => {
    const rows = [
      { classification: 'Expenses', category_path: 'Expenses', account_name: 'Expenses', own_actual_cents: 0, own_budget_cents: null },
      { classification: 'Expenses', category_path: 'Expenses:Job Materials:Lumber', account_name: 'Lumber', own_actual_cents: 500, own_budget_cents: 1000 },
      { classification: 'Expenses', category_path: 'Expenses:Job Materials:Nails', account_name: 'Nails', own_actual_cents: 0, own_budget_cents: 0 },
      { classification: 'Expenses', category_path: 'Expenses:Dead', account_name: 'Dead', own_actual_cents: 0, own_budget_cents: null },
    ];
    // "Job Materials" has no row of its own, so Lumber/Nails sit directly under the Expenses root.
    expect(buildExpenseCategories(rows).map((c) => c.label)).toEqual(['Lumber']);
  });
});

describe('Church Report › This year in detail (Finance)', () => {
  it('ranks the biggest overspend first and calls an unbudgeted category what it is', () => {
    const cats = [
      { path: 'a', label: 'Steady', actualCents: 500000, budgetCents: 1000000, children: [] },
      { path: 'b', label: 'Fast', actualCents: 900000, budgetCents: 1000000, children: [] },
      { path: 'c', label: 'Overspent', actualCents: 1200000, budgetCents: 1000000, children: [] },
      { path: 'd', label: 'Unbudgeted', actualCents: 400000, budgetCents: 0, children: [] },
    ];
    const ranked = rankedExpenseCategories(cats, 0.5);
    expect(ranked.map((r) => [r.cat.label, r.status.key])).toEqual([['Overspent', 'over'], ['Fast', 'warn'], ['Steady', 'ok'], ['Unbudgeted', 'none']]);
    expect(paceStatus(cats[0], 0.9).key).toBe('under');
  });

  it('combines funds that share an account number on one line', () => {
    const groups = groupFundsByCode([
      { fundName: '40085 Lent', cents: 100 }, { fundName: '40085 General Fund', cents: 900 }, { fundName: 'Mission Trip', cents: 50 },
    ]);
    expect(groups.map((g) => [g.label, g.cents, g.rows.length])).toEqual([['40085 General Fund', 1000, 2], ['Mission Trip', 50, 1]]);
  });

  const YEAR = {
    contract: 'connect.finance-church-year.v1', dataClassification: 'aggregate', sourceProduct: 'connect', consumerProduct: 'finance', currency: 'USD',
    fiscalYear: 2026, generatedAt: '2026-07-01T12:00:00.000Z', hasLedger: true, hasBudgetData: true, asOfDate: '2026-06-30', elapsedFraction: 0.5,
    totals: { income: { actualCents: 8900000, budgetCents: 12000000 }, expenses: { actualCents: 9000000, budgetCents: 8200000 }, net: { actualCents: -100000, budgetCents: 3800000 } },
    expenseCategories: [
      { path: 'Expenses:34 Utilities', label: '34 Utilities', actualCents: 600000, budgetCents: 1200000, children: [{ label: '34010 Electric', actualCents: 600000, budgetCents: 1200000 }] },
      { path: 'Expenses:60 Salaries', label: '60 Salaries', actualCents: 4000000, budgetCents: 6000000, children: [] },
    ],
    yoy: { available: true, seasonal: true, throughMonth: 6,
      income: { currentYtdCents: 6000000, priorYtdCents: 4800000, priorFullYearCents: 9600000, projectedFullYearCents: 12000000, method: 'prior-year-ratio' },
      expenses: { currentYtdCents: 4000000, priorYtdCents: 3300000, priorFullYearCents: 6600000, projectedFullYearCents: 8000000, method: 'prior-year-ratio' },
      net: { currentYtdCents: 2000000, priorYtdCents: 1500000, priorFullYearCents: 3000000, projectedFullYearCents: 4000000, method: 'prior-year-ratio' } },
    supplies: { monthly: [{ month: 1, currentCents: 10000, priorCents: 8000 }, { month: 2, currentCents: 0, priorCents: 0 }], currentYtdCents: 10000, priorYtdCents: 8000 },
    givingCents: 1950000,
    givingByFund: [{ fundName: '40085 General Fund', cents: 1700000 }, { fundName: '40085 Lent', cents: 100000 }, { fundName: '=SUM(A1)', cents: 150000 }],
  };

  function makeEnv(answer) {
    return {
      ENVIRONMENT: 'staging', RELEASE_SHA: 't', FINANCE_DB: { prepare: (sql) => ({ sql }) }, FINANCE_CONTRACT_API_KEY: 'k',
      CONNECT_SERVICE: {
        async fetch(req) {
          const url = new URL(req.url);
          if (url.pathname.endsWith('/staff-role-v1')) return new Response(JSON.stringify({ role: 'admin', permissions: { finance: 'edit', giving: 'edit' } }));
          if (url.pathname.endsWith('/finance-church-year-v1')) return answer ? new Response(JSON.stringify(answer)) : new Response('down', { status: 503 });
          return new Response('{}', { status: 404 });
        },
      },
    };
  }
  const get = (env, query) => worker.fetch(new Request(`https://finance.test/?section=church&page=year-detail${query}`, { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), env);

  it('shows the pace, comparison, supplies and giving by fund, with line items on click', async () => {
    const html = await (await get(makeEnv(YEAR), '')).text();
    expect(html).toContain('This year in detail');
    expect(html).toContain('Where expenses sit against budget');
    expect(html).toContain('34010 Electric');
    expect(html).toContain('Through June');
    expect(html).toContain('Projected full year');
    expect(html).toContain('Supplies by month');
    expect(html).toContain('40085 General Fund');
    expect(html).toContain('(2 funds)');
    expect(html).toContain('format=csv');
  });

  it('says so, and shows no figures, when Connect cannot answer', async () => {
    const html = await (await get(makeEnv(null), '')).text();
    expect(html).toContain('could not be read from Connect');
    expect(html).not.toContain('Where expenses sit against budget');
  });

  it('downloads the page as a spreadsheet, guarding formula-looking fund names', async () => {
    const res = await get(makeEnv(YEAR), '&format=csv');
    expect(res.headers.get('Content-Type')).toContain('text/csv');
    expect(res.headers.get('Content-Disposition')).toContain('church-report-2026.csv');
    const csv = await res.text();
    expect(csv).toContain('"Net income","-1000.00","38000.00"');
    expect(csv).toContain('"Giving by fund (Connect records)"');
    expect(csv).toContain(`"'=SUM(A1)"`);
    expect(buildChurchYearCsv(YEAR)).toBe(csv);
  });
});
