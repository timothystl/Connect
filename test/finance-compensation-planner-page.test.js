import { describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import worker from '../apps/finance/shell.js';
import { churchYearFromReport, councilDraftFromPlan, plannerViewer } from '../apps/finance/connect-planner.js';

// Fabricated plan and ledger; no real people or figures.
const PLAN = { roster: [{ name: 'Test Pastor', role: 'pastor', accountCode: '58001' }], compMethod: 'scalepct', compScalePct: 92 };
const FY = new Date().getUTCFullYear();
const REPORT = {
  contract: 'connect.finance-church-report.v1', dataClassification: 'aggregate', sourceProduct: 'connect', consumerProduct: 'finance', currency: 'USD', fiscalYear: FY, generatedAt: '2026-09-15T12:00:00Z',
  accounts: [{ classification: 'Expenses', categoryPath: 'Expenses:58001 Pastor Salary', accountName: '58001 Pastor Salary', depth: 0, hasChildren: false, actualCents: 7000000, budgetCents: 9880000, source: 'import' }],
  totals: { incomeActualCents: 0, incomeBudgetCents: 0, expenseActualCents: 7000000, expenseBudgetCents: 9880000, netIncomeActualCents: -7000000, netIncomeBudgetCents: -9880000, hasBudgetData: true },
  reconciliation: { accountCount: 1, incomeCount: 0, expenseCount: 1, otherIncomeCount: 0, otherExpenseCount: 0, costOfGoodsSoldCount: 0, accountsWithBudgetCount: 1, totalsMatch: true },
};

function financeDb() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec("CREATE TABLE finance_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '')");
  const statement = (sql, args = []) => ({
    bind: (...next) => statement(sql, next),
    async run() { sqlite.prepare(sql).run(...args); return {}; },
    async first() { return sqlite.prepare(sql).get(...args) ?? null; },
    async all() { return { results: sqlite.prepare(sql).all(...args) }; },
  });
  return { prepare: (sql) => statement(sql), _raw: sqlite };
}

function makeEnv({ role = 'admin', compensation = 'edit', username = 'tester' } = {}) {
  const writes = [];
  return {
    writes,
    env: {
      ENVIRONMENT: 'staging', RELEASE_SHA: 'sha1', FINANCE_CONTRACT_API_KEY: 'k', FINANCE_DB: financeDb(),
      CONNECT_SERVICE: {
        async fetch(req) {
          const p = new URL(req.url).pathname;
          if (p.endsWith('/staff-role-v1')) return new Response(JSON.stringify({ role, username, permissions: { compensation } }));
          if (p.endsWith('/finance-compensation-plan-v1')) return new Response(JSON.stringify({ data: PLAN }));
          if (p.endsWith('/finance-compensation-write-v1')) { writes.push(await req.json()); return new Response(JSON.stringify({ ok: true })); }
          if (p.endsWith('/finance-church-report-v1')) return new Response(JSON.stringify(REPORT));
          if (p.endsWith('/finance-board-layout-v1')) return new Response(JSON.stringify({ contract: 'connect.finance-board-layout.v1', boardCategories: { revenue: {}, accountLabels: { a: 'b' } }, purposeTags: { tags: [{ id: 'youth', label: 'Youth' }], categories: {} } }));
          return new Response('{}', { status: 404 });
        },
      },
    },
  };
}
const call = (env, path, init = {}) => worker.fetch(new Request(`https://finance.test${path}`, { ...init, headers: { 'Cf-Access-Jwt-Assertion': 'jwt', ...(init.headers || {}) } }), env);
const save = (env, body, site = 'same-origin') => call(env, '/api/v1/connect-planner/salary-save', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': site }, body: JSON.stringify(body) });

describe('Compensation Planner in Finance', () => {
  it('opens Compensation on the Planner, Finance’s own page, with its script allowed and nothing inline', async () => {
    const res = await call(makeEnv().env, '/?section=compensation');
    const html = await res.text();
    expect(html).toContain('<div id="cp-root" class="cp">');
    expect(html).toContain('<script src="/compensation-planner/app.js?v=sha1" defer></script>');
    expect(html).not.toContain('<iframe');
    // Plan (new view) is retired; the nav no longer offers it.
    expect(html).not.toContain('Plan (new view)');
    expect(html).not.toContain('page=plan"');
    const config = JSON.parse(html.match(/<script type="application\/json" id="cp-config">([^<]*)<\/script>/)[1]);
    expect(config).toMatchObject({ role: 'admin', permissions: { compensation: 'edit' }, preview: false });
    expect(config.targetYear).toBe(config.baseYear + 1);
    const csp = res.headers.get('content-security-policy');
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).not.toContain('unsafe-inline\'; script');
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    // Every other page still runs no script at all.
    const plan = await call(makeEnv().env, '/?section=compensation&page=benefits');
    expect(plan.headers.get('content-security-policy')).not.toContain('script-src');
  });

  it('serves the bundled planner script, which carries no inline handlers', async () => {
    const js = await call(makeEnv().env, '/compensation-planner/app.js');
    expect(js.status).toBe(200);
    expect(js.headers.get('content-type')).toContain('text/javascript');
    const code = await js.text();
    expect(code).toContain('cp-root');
    expect(code).toContain('/api/v1/connect-planner/salary-save');
    expect(code).not.toMatch(/onclick=|oninput=|onchange=/);
    expect((await call(makeEnv().env, '/connect-planner')).status).toBe(404);
  });

  it('sends the printable version to the Council report', async () => {
    const res = await call(makeEnv().env, '/?section=compensation&page=planner&print=1');
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('/?section=compensation&page=council&print=1');
  });

  it('is only for admin, compensation and council accounts', async () => {
    expect((await call(makeEnv({ role: 'volunteer' }).env, '/api/v1/connect-planner/salary')).status).toBe(403);
    expect(plannerViewer({ ok: true, role: 'council', permissions: { compensation: 'view' } })).toEqual({ role: 'council', permissions: { compensation: 'view' } });
    const council = await (await call(makeEnv({ role: 'council', compensation: 'view' }).env, '/?section=compensation')).text();
    const config = JSON.parse(council.match(/<script type="application\/json" id="cp-config">([^<]*)<\/script>/)[1]);
    expect(config).toMatchObject({ role: 'council', permissions: { compensation: 'view' } });
  });

  it('reads the plan, the base-year ledger rows and the chart of accounts settings through Connect', async () => {
    const { env } = makeEnv();
    expect(await (await call(env, '/api/v1/connect-planner/salary')).json()).toEqual({ data: PLAN });
    const ledger = await (await call(env, `/api/v1/connect-planner/church-year?year=${FY}`)).json();
    expect(ledger.entries).toEqual([{ category_path: 'Expenses:58001 Pastor Salary', account_name: '58001 Pastor Salary', classification: 'Expenses', depth: 0, own_actual_cents: 7000000, own_budget_cents: 9880000 }]);
    expect((await (await call(env, '/api/v1/connect-planner/board-categories')).json()).accountLabels).toEqual({ a: 'b' });
    expect((await (await call(env, '/api/v1/connect-planner/purpose-tags')).json()).tags).toEqual([{ id: 'youth', label: 'Youth' }]);
    expect(churchYearFromReport(null)).toEqual({ entries: [] });
  });

  it('relays an admin save as the whole plan, and refuses a cross-site one', async () => {
    const { env, writes } = makeEnv();
    const body = { ...PLAN, compMethod: 'worksheet', compPerWorkerMethod: { 0: 'none' } };
    expect((await save(env, body)).status).toBe(200);
    expect(writes).toEqual([body]);
    expect((await save(env, body, 'cross-site')).status).toBe(403);
    expect(writes).toHaveLength(1);
  });

  it('saves a council member’s changes as their private draft, never the shared plan', async () => {
    const { env, writes } = makeEnv({ role: 'council', username: 'Pat.Council' });
    const res = await save(env, { ...PLAN, compMethod: 'cola', compPerWorkerMethod: { 0: 'worksheet', 1: 'bogus' }, compOverrides: { 0: '1' }, compCustomPct: 4 });
    expect(await res.json()).toEqual({ ok: true, draft: true });
    expect(writes).toHaveLength(0);
    const row = env.FINANCE_DB._raw.prepare('SELECT value FROM finance_settings WHERE key=?').get('finance_salary_planner_council_patcouncil');
    expect(JSON.parse(row.value)).toEqual({ compMethod: 'cola', compPerWorkerMethod: { 0: 'worksheet' }, compCustomPct: 4, compScalePct: 92 });
    expect((await save(makeEnv({ role: 'council', compensation: 'view' }).env, PLAN)).status).toBe(403);
    expect(councilDraftFromPlan({ compBaselineRosterOnly: 1 })).toEqual({ compBaselineRosterOnly: true });
  });

  it('shows Connect’s Chart of Accounts as a tab beside Finance’s own pages; the Budget planner opens Connect’s own planner, with Finance’s at native=1', async () => {
    const budget = await (await call(makeEnv().env, '/?section=planning&page=connect')).text();
    expect(budget).toContain('<iframe src="/accounting?section=planning"');
    expect(budget).toContain('<h1 class="page-title">Budget planner</h1>');
    const own = await (await call(makeEnv().env, '/?section=planning&page=builder&native=1')).text();
    expect(own).not.toContain('<iframe src="/accounting?section=planning"');
    const coa = await (await call(makeEnv().env, '/?section=accounts&page=connect')).text();
    expect(coa).toContain('<iframe src="/accounting?section=accounts"');
    const workspace = await call(makeEnv().env, '/accounting?section=planning');
    expect(workspace.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(await workspace.text()).toContain('<a href="/" target="_top">New Finance pages</a>');
  });
});
