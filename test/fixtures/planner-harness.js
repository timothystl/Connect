// A local Finance Worker for driving the Compensation Planner in a real browser: the shell with a
// fake Connect behind it that answers the planner's contracts from a fabricated plan and ledger.
// Every name and figure here is invented; none is a real person or a real salary.
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import worker from '../../apps/finance/shell.js';

export const PLANNER_FIXTURE_PLAN = {
  roster: [
    { name: 'Test Pastor', position: 'Lead Pastor', role: 'pastor', trackKey: '', education: 'mdiv', yearsExperience: 12, responsibilityStipend: 0, responsibilityStipendKey: 'none', attendanceBonus: 0, selfEmployedFica: true, hasDependents: true, healthTier: 'family', healthMode: 'family', healthEnrolled: true, accountCode: '58001', ftePct: 100, concordia: { churchLcmsLow: '70000', churchLcmsMid: '80000', churchLcmsHigh: '90000', asOfDate: '07/01/2026' } },
    { name: 'Test Director', position: 'Music Director', role: 'other', trackKey: 'secretary', education: 'bachelors', yearsExperience: 4, responsibilityStipend: 0, responsibilityStipendKey: 'none', attendanceBonus: 0, selfEmployedFica: false, hasDependents: false, healthTier: 'optout', healthMode: 'optout', healthEnrolled: false, accountCode: '', actualSalaryCents: 4000000, ftePct: 100 },
    { name: 'Test Helper', position: 'Office Helper', role: 'other', trackKey: 'secretary', education: 'none', yearsExperience: 1, responsibilityStipend: 0, responsibilityStipendKey: 'none', attendanceBonus: 0, selfEmployedFica: false, hasDependents: false, accountCode: '', actualSalaryCents: 1300000, ftePct: 20, cashOnly: true },
  ],
  compMethod: 'custom', compCustomPct: 3, compScalePct: 90, healthPlanOption: 'renewal', keepMe: { untouched: true },
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

export const PLANNER_FIXTURE_LEDGER = [{ classification: 'Expenses', categoryPath: 'Expenses:58001 Pastor Salary', accountName: '58001 Pastor Salary', depth: 0, hasChildren: false, actualCents: 7000000, budgetCents: 9000000, source: 'import' }];

export function plannerEnv({ role = 'admin', compensation = 'edit', plan = PLANNER_FIXTURE_PLAN } = {}) {
  const writes = [];
  const state = { plan: JSON.parse(JSON.stringify(plan)) };
  const report = (fiscalYear) => ({
    contract: 'connect.finance-church-report.v1', dataClassification: 'aggregate', sourceProduct: 'connect', consumerProduct: 'finance', currency: 'USD', fiscalYear, generatedAt: '2026-09-15T12:00:00Z',
    accounts: PLANNER_FIXTURE_LEDGER,
    totals: { incomeActualCents: 0, incomeBudgetCents: 0, expenseActualCents: 7000000, expenseBudgetCents: 9000000, netIncomeActualCents: -7000000, netIncomeBudgetCents: -9000000, hasBudgetData: true },
    reconciliation: { accountCount: 1, incomeCount: 0, expenseCount: 1, otherIncomeCount: 0, otherExpenseCount: 0, costOfGoodsSoldCount: 0, accountsWithBudgetCount: 1, totalsMatch: true },
  });
  const env = {
    ENVIRONMENT: 'staging', RELEASE_SHA: 'harness', FINANCE_CONTRACT_API_KEY: 'k', FINANCE_DB: financeDb(),
    CONNECT_SERVICE: {
      async fetch(req) {
        const url = new URL(req.url);
        const p = url.pathname;
        if (p.endsWith('/staff-role-v1')) return new Response(JSON.stringify({ role, username: 'tester', permissions: { compensation } }));
        if (p.endsWith('/finance-compensation-plan-v1')) return new Response(JSON.stringify({ data: state.plan }));
        if (p.endsWith('/finance-compensation-write-v1')) { const body = await req.json(); writes.push(body); state.plan = body; return new Response(JSON.stringify({ ok: true })); }
        if (p.endsWith('/finance-church-report-v1')) return new Response(JSON.stringify(report(Number(url.searchParams.get('fiscalYear') || url.searchParams.get('year')) || 2026)));
        if (p.endsWith('/finance-board-layout-v1')) return new Response(JSON.stringify({ contract: 'connect.finance-board-layout.v1', boardCategories: { accountLabels: {} }, purposeTags: { tags: [{ id: 'youth', label: 'Youth' }], categories: {} } }));
        return new Response('{}', { status: 404 });
      },
    },
  };
  return { env, writes, state };
}

// Serves the Worker on a local port. Same-origin posts need Sec-Fetch-Site, which a real browser sends.
export function servePlanner(env) {
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
    headers.set('Cf-Access-Jwt-Assertion', 'jwt');
    const request = new Request('http://' + req.headers.host + req.url, {
      method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
    });
    const out = await worker.fetch(request, env);
    res.writeHead(out.status, Object.fromEntries(out.headers));
    res.end(Buffer.from(await out.arrayBuffer()));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, origin: 'http://127.0.0.1:' + server.address().port })));
}
