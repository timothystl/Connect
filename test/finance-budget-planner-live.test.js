import { describe, expect, it } from 'vitest';
import worker from '../apps/finance/shell.js';
import { buildPlannerModel, plannerParams, plannerRows } from '../apps/finance/planning-builder-pages.js';
import { BUDGET_PLANNER_LIVE_JS, computeBudgetTotals } from '../apps/finance/budget-planner-live.js';

const FY = new Date().getUTCFullYear() + 1;
const BUILDER = {
  contract: 'connect.finance-budget-builder.v1', targetYear: FY, baseYear: FY - 1, priorYear: FY - 2, throughWeek: 37.6, prorated: true,
  lines: [
    { category: 'Income:Offerings', classification: 'Income', name: 'Offerings', priorActualCents: 91840000, baseBudgetCents: 96000000, baseActualCents: 66000000, projectedCents: 91845000, projectedOverridden: false, plan: { plannedAmountCents: 94600400, basis: 'grown', growthPct: 0.03, baseAmountCents: 91845000, notes: '' } },
    { category: 'Expenses:Utilities', classification: 'Expenses', name: 'Utilities & insurance', priorActualCents: 8390000, baseBudgetCents: 8800000, baseActualCents: 6000000, projectedCents: 8424000, projectedOverridden: true, plan: { plannedAmountCents: 9845200, basis: 'grown', growthPct: 0.05, baseAmountCents: 8424000, notes: 'Ameren rate case' } },
    { category: 'Expenses:Missions', classification: 'Expenses', name: 'Missions & synod', priorActualCents: 9600000, baseBudgetCents: 9600000, baseActualCents: 7000000, projectedCents: 9600000, projectedOverridden: false, plan: { plannedAmountCents: 9000000, basis: 'manual', growthPct: null, baseAmountCents: null, notes: 'Council goal' } },
    { category: 'Expenses:Office', classification: 'Expenses', name: 'Office', priorActualCents: 4610000, baseBudgetCents: 4800000, baseActualCents: 3000000, projectedCents: 4770000, projectedOverridden: false, plan: null },
  ],
};
// What Connect's planning/church returns to a council member: the shared plan with their own draft
// merged over it (Missions changed, and a line only in their draft).
const COUNCIL_ROWS = [
  { category: 'Income:Offerings', classification: 'Income', fiscal_year: FY, planned_amount_cents: 94600400, basis: 'grown', notes: '' },
  { category: 'Expenses:Missions', classification: 'Expenses', fiscal_year: FY, planned_amount_cents: 12000000, basis: 'manual', notes: 'More for missions' },
  { category: 'Expenses:Utilities', classification: 'Expenses', fiscal_year: FY, planned_amount_cents: 9845200, basis: 'grown', notes: 'Ameren rate case' },
  { category: 'Expenses:Missions', classification: 'Expenses', fiscal_year: FY + 1, planned_amount_cents: 1, basis: 'manual', notes: '' },
];

function makeEnv({ role = 'admin', budget = 'edit', builderStatus = 200, draftStatus = 200, writeStatus = 200 } = {}) {
  const calls = [];
  return {
    calls,
    env: {
      ENVIRONMENT: 'staging', RELEASE_SHA: 't', FINANCE_DB: { prepare: (sql) => ({ sql }) }, FINANCE_CONTRACT_API_KEY: 'k',
      CONNECT_SERVICE: {
        async fetch(req) {
          const url = new URL(req.url);
          const body = req.method === 'POST' ? await req.json().catch(() => null) : null;
          calls.push({ path: url.pathname, search: url.search, body });
          if (url.pathname.endsWith('/staff-role-v1')) return new Response(JSON.stringify({ role, username: 'pat', permissions: { finance: 'edit', budget, giving: 'edit' } }));
          if (url.pathname.endsWith('/finance-budget-builder-v1')) return builderStatus === 200 ? new Response(JSON.stringify(BUILDER)) : new Response('{}', { status: builderStatus });
          if (url.pathname.endsWith('/finance-workspace-v1')) return draftStatus === 200 ? new Response(JSON.stringify({ rows: COUNCIL_ROWS })) : new Response('{"error":"no"}', { status: draftStatus });
          if (url.pathname.includes('generate-all')) return new Response(JSON.stringify({ ok: true, generated: 3 }));
          if (/-(write|override|generate|remove)-v1$/.test(url.pathname)) return writeStatus === 200 ? new Response(JSON.stringify({ ok: true, saved: 1 })) : new Response(JSON.stringify({ error: 'Access denied: editing budget plans requires admin access' }), { status: writeStatus });
          return new Response('{}', { status: 404 });
        },
      },
    },
  };
}
const get = (env, q = '') => worker.fetch(new Request(`https://finance.test/?section=planning&page=builder${q}`, { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), env);


describe('Budget planner live totals', () => {
  // The script must add up exactly as the server does, so the two are checked against each other.
  const rowsOf = (params) => {
    const p = plannerParams(new URLSearchParams(params), new Date());
    const model = buildPlannerModel(BUILDER, { layout: null, params: p });
    return plannerRows(model, { includeExcluded: p.pick });
  };
  const asScriptRows = (rows) => rows.map((r) => ({ kind: r.kind, side: r.side, excluded: Boolean(r.excluded), fig: r.kind === 'leaf' ? r.fig : null }));

  it.each([[''], ['x=Expenses:Missions'], ['x=Income:Offerings&pick=1']])('matches the server totals (%s)', (query) => {
    const rows = rowsOf(`target=${FY}&base=${FY - 1}&${query}`);
    const totals = computeBudgetTotals(asScriptRows(rows));
    rows.forEach((r, i) => {
      if (['total', 'sidetotal', 'net'].includes(r.kind)) expect(totals[i]).toEqual(r.fig);
      else expect(totals[i]).toBeNull();
    });
  });

  it('follows an edited Plan figure up through its group and the Net row', () => {
    const rows = asScriptRows(rowsOf(`target=${FY}&base=${FY - 1}`));
    const office = rows.findIndex((r) => r.kind === 'leaf' && r.fig.plan === 0 && r.side === 'expense' && !r.fig.hasPlan);
    const before = computeBudgetTotals(rows);
    rows[office].fig = { ...rows[office].fig, plan: 500000, hasPlan: true };
    const after = computeBudgetTotals(rows);
    const side = rows.findIndex((r) => r.kind === 'total' && r.side === 'expense');
    const net = rows.findIndex((r) => r.kind === 'net');
    expect(after[side].plan - before[side].plan).toBe(500000);
    expect(after[net].plan - before[net].plan).toBe(-500000);
  });

  it('serves the script from this Worker, and only the planner page may run it', async () => {
    const { env } = makeEnv();
    const asset = await worker.fetch(new Request('https://finance.test/budget-planner/live.js', { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), env);
    expect(asset.status).toBe(200);
    expect(asset.headers.get('Content-Type')).toContain('text/javascript');
    expect(await asset.text()).toBe(BUDGET_PLANNER_LIVE_JS);
    const page = await get(env);
    expect(page.headers.get('Content-Security-Policy')).toContain("script-src 'self'");
    expect(page.headers.get('Content-Security-Policy')).not.toContain('unsafe-inline\'; img-src \'self\' data');
    const html = await page.text();
    expect(html).toContain('<script src="/budget-planner/live.js?v=t" defer></script>');
    expect(html).toContain('data-bp="leaf"');
    // The actual as a share of the budget, per line (Offerings: $660,000 of $960,000).
    expect(html).toContain('data-col="used">69%</td>');
    const other = await worker.fetch(new Request('https://finance.test/?section=planning&page=scenarios', { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), env);
    expect(other.headers.get('Content-Security-Policy')).not.toContain('script-src');
  });

  it('is not loaded where nothing can be edited', async () => {
    const { env } = makeEnv({ role: 'council', budget: 'view' });
    const html = await (await get(env)).text();
    expect(html).not.toContain('/budget-planner/live.js');
  });
});

describe('Budget planner lists only lines in use', () => {
  const quiet = { category: 'Income:48030 Grants', classification: 'Income', name: '48030 Grants', priorActualCents: 0, baseBudgetCents: null, baseActualCents: 0, projectedCents: null, projectedOverridden: false, plan: null };
  const builder = { ...BUILDER, lines: [...BUILDER.lines, quiet] };
  const names = (q) => plannerRows(buildPlannerModel(builder, { layout: null, params: plannerParams(new URLSearchParams(`target=${FY}&base=${FY - 1}${q}`), new Date()) }))
    .filter((r) => r.kind === 'leaf').map((r) => r.line.name);

  it('drops a line with nothing in any column, without it having to be hidden first', () => {
    expect(names('')).not.toContain('48030 Grants');
    expect(names('')).toContain('Offerings');
    expect(names('&hidden=1')).toContain('48030 Grants');
  });
});
