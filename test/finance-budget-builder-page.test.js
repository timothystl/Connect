import { describe, expect, it } from 'vitest';
import worker from '../apps/finance/shell.js';
import { parsePlannerForm, parseProjectLine, plannerParams, summarizeBuilder, outlookYears, defaultProjectBaseCents } from '../apps/finance/planning-builder-pages.js';

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
const post = (env, path, fields, site = 'same-origin') => worker.fetch(new Request(`https://finance.test${path}`, {
  method: 'POST', headers: { 'Cf-Access-Jwt-Assertion': 'jwt', 'Sec-Fetch-Site': site }, body: new URLSearchParams(fields),
}), env);
const writes = (calls) => calls.filter((c) => c.body);

// The table form exactly as the page renders it for an admin, before any edit.
function adminForm(extra = {}) {
  const f = { target_year: String(FY), base_year: String(FY - 1), fiscal_year: String(FY), back: `target=${FY}&base=${FY - 1}&view=qb` };
  BUILDER.lines.forEach((l, i) => {
    Object.assign(f, { [`p_${i}`]: l.category, [`c_${i}`]: l.classification, [`n_${i}`]: l.name, [`notes_${i}`]: l.plan?.notes || '' });
    const plan = l.plan ? String(Math.round(l.plan.plannedAmountCents / 100)) : '';
    const proj = String(Math.round(l.projectedCents / 100));
    const act = String(l.baseActualCents / 100);
    Object.assign(f, { [`plan_${i}`]: plan, [`orig_plan_${i}`]: plan, [`proj_${i}`]: proj, [`orig_proj_${i}`]: proj, [`act_${i}`]: act, [`orig_act_${i}`]: act });
  });
  return { ...f, ...extra };
}

describe('Budget planner (Finance)', () => {
  it('totals the plan against the base-year budget', () => {
    expect(summarizeBuilder(BUILDER)).toMatchObject({ incomeCents: 94600400, expenseCents: 9845200 + 9000000, grown: 2, manual: 1, planned: 3, unplanned: 1 });
  });

  it('shows Connect’s planner: years, the navy strip, the category table and Δ%', async () => {
    const { env, calls } = makeEnv();
    const html = await (await get(env)).text();
    expect(calls.find((c) => c.path.endsWith('/finance-budget-builder-v1')).search).toBe(`?target_year=${FY}`);
    expect(html).toContain('<h1 class="page-title">Budget planner</h1>');
    expect(html).toContain(`<h2>Budget FY${FY}</h2>`);
    expect(html).toContain(`<option value="${FY - 1}" selected>${FY - 1}</option>`);
    // Strip: base projected expenses, planned, change, revenue needed vs this year's revenue.
    expect(html).toContain(`<small>FY${FY - 1} projected expenses</small><strong data-bp-strip="baseExp">$227,940</strong>`);
    expect(html).toContain('<strong class="bp-gold" data-bp-strip="planExp">$188,452</strong>');
    expect(html).toContain('<strong data-bp-strip="change">−$39,488</strong><span data-bp-strip="changePct">−17.3%</span>');
    expect(html).toContain('<small>Revenue needed to balance</small><strong class="bp-green" data-bp-strip="needed">$188,452</strong>');
    // Three builder tools stay on top.
    expect(html).toContain('Grow every line');
    expect(html).toContain('Generate all: apply to every grown line');
    // Columns, editable cells with their originals, and Δ% tones.
    expect(html).toContain(`<th>FY${FY - 1} Budget</th><th>FY${FY - 1} Actual</th><th>FY${FY - 1} Projected</th><th>FY${FY} Plan</th><th>Δ%</th>`);
    expect(html).toContain('name="plan_0" value="946004"');
    expect(html).toContain('name="orig_plan_0" value="946004"');
    expect(html).toContain('name="proj_1" value="84240" class="bp-input is-corrected"');
    expect(html).toContain('name="act_2" value="70000"');
    expect(html).toContain('<td class="bp-up" data-col="delta">+11.9%</td>');
    expect(html).toContain('<td class="bp-down" data-col="delta">−6.3%</td>');
    expect(html).toContain('Net (Revenue − Expenses)');
    // No per-line "Manual" label or Remove link: lines are edited, not removed, here.
    expect(html).not.toContain('formaction="/api/v1/connect-budget-plan-remove"');
    expect(html).not.toContain('>Manual');
    expect(html).toContain('<button type="submit">Save changes</button>');
    expect(html).toContain('Five-year outlook');
    expect(html).toContain('<svg viewBox="0 0 480 180"');
    expect(html).not.toContain('<iframe');
    // The one script is the live-totals file from this Worker; no inline script.
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(html).toContain('<script src="/budget-planner/live.js?v=t" defer></script>');
  });

  it('reads another base year, hides columns and leaves chosen lines out of every total', async () => {
    const { env, calls } = makeEnv();
    const older = await (await get(env, `&target=${FY}&base=${FY - 2}`)).text();
    expect(calls.find((c) => c.path.endsWith('/finance-budget-builder-v1')).search).toBe(`?target_year=${FY}&base_year=${FY - 2}`);
    // This fixture answers for FY-1 (as a Connect without base_year would), so the page says so.
    expect(older).toContain(`Base year ${FY - 1} (annualized`);
    expect(older).toContain(`<th>FY${FY - 1} Budget</th>`);
    expect(plannerParams(new URLSearchParams(`target=${FY}&base=${FY + 3}`)).base).toBe(FY - 1);
    const cols = await (await get(makeEnv().env, '&cols=bud,plan')).text();
    expect(cols).toContain(`<th>Category</th><th>FY${FY - 1} Budget</th><th>FY${FY} Plan</th></tr>`);
    expect(cols).toContain('class="chip bp-chip-off"');
    expect(cols).not.toContain('name="proj_0"');
    const left = await (await get(makeEnv().env, '&view=qb&x=Expenses%3AOffice')).text();
    expect(left).not.toContain('<b>Office</b>');
    expect(left).toContain('1 line left out');
    expect(left).toContain(`<td style="padding-left:10px">Total Expenses</td><td data-col="bud">$184,000</td>`);
    const pick = await (await get(makeEnv().env, '&view=qb&pick=1&x=Expenses%3AOffice')).text();
    expect(pick).toContain('<form method="GET" action="/" id="bp-pick"');
    expect(pick).toContain('<input type="checkbox" form="bp-pick" name="x" value="Expenses:Office" checked');
    expect(pick).toContain('<tr class="bp-excluded" data-bp="leaf" data-side="');
    expect(pick).toContain('Done choosing rows');
  });

  it('exports the current view as CSV and prints both sheets with an optional DRAFT mark', async () => {
    const { env } = makeEnv();
    const res = await worker.fetch(new Request(`https://finance.test/api/v1/budget-planner-csv?target=${FY}&base=${FY - 1}&view=qb&cols=bud,plan,delta&x=Expenses%3AOffice`, { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), env);
    expect(res.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
    expect(res.headers.get('Content-Disposition')).toContain(`budget-FY${FY}-from-FY${FY - 1}.csv`);
    const csv = await res.text();
    expect(csv.split('\r\n')[0]).toBe(`"Category","FY${FY - 1} Budget","FY${FY} Plan","Δ%"`);
    expect(csv).toContain('"Utilities & insurance","88000.00","98452.00","11.9%"');
    expect(csv).toContain('"Total Expenses","184000.00","188452.00","2.4%"');
    expect(csv).not.toContain('Office');
    const denied = await worker.fetch(new Request('https://finance.test/api/v1/budget-planner-csv', { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), makeEnv({ role: 'member' }).env);
    expect(denied.status).toBe(403);
    const print = await (await get(makeEnv().env, '&view=qb&print=1&draft=1')).text();
    expect(print).toContain('<div class="bp-watermark" aria-hidden="true">DRAFT</div>');
    expect(print).toContain(`Fiscal Year ${FY} Budget`);
    expect(print).toContain('<th class="n">Change</th>');
    expect(print).not.toContain('name="plan_0"');
    const thisYear = await (await get(makeEnv().env, '&view=qb&print=1&print_mode=thisyear')).text();
    expect(thisYear).toContain(`Fiscal Year ${FY - 1} Budget`);
    expect(thisYear).not.toContain('<th class="n">Change</th>');
    expect(thisYear).not.toContain('<div class="bp-watermark"');
  });

  it('saves only the cells that changed, each to its own Connect contract', async () => {
    const { env, calls } = makeEnv();
    const res = await post(env, '/api/v1/budget-planner-save', adminForm({ plan_1: '99,000', proj_0: '', act_3: '31000.50', plan_3: '' }));
    expect(res.status).toBe(303);
    const loc = new URL(res.headers.get('Location'), 'https://x');
    expect(Object.fromEntries(loc.searchParams)).toMatchObject({ section: 'planning', page: 'builder', target: String(FY), view: 'qb', op: 'planner', status: 'ok' });
    expect(loc.searchParams.get('msg')).toBe(`Saved in Connect: 1 plan figure, 1 FY${FY - 1} projection, 1 FY${FY - 1} actual correction.`);
    const sent = writes(calls);
    expect(sent.map((c) => c.path.split('/').pop())).toEqual(['finance-budget-write-v1', 'finance-base-projection-write-v1', 'finance-church-actual-override-v1']);
    expect(sent[0].body).toEqual({ rows: [{ category: 'Expenses:Utilities', classification: 'Expenses', fiscal_year: FY, planned_amount: '99000', notes: 'Ameren rate case' }] });
    expect(sent[1].body).toEqual({ year: FY - 1, rows: [{ category: 'Income:Offerings', amount: '' }] });
    expect(sent[2].body).toEqual({ year: FY - 1, rows: [{ category: 'Expenses:Office', classification: 'Expenses', account_name: 'Office', amount: '31000.50' }] });
    const none = await post(makeEnv().env, '/api/v1/budget-planner-save', adminForm());
    expect(new URL(none.headers.get('Location'), 'https://x').searchParams.get('msg')).toBe('No changes to save.');
    const bad = await post(makeEnv().env, '/api/v1/budget-planner-save', adminForm({ plan_0: 'lots' }));
    expect(new URL(bad.headers.get('Location'), 'https://x').searchParams.get('msg')).toContain('is not a dollar amount');
    const cross = makeEnv();
    const refused = await post(cross.env, '/api/v1/budget-planner-save', adminForm({ plan_0: '1' }), 'cross-site');
    expect(new URL(refused.headers.get('Location'), 'https://x').searchParams.get('status')).toBe('error');
    expect(writes(cross.calls)).toHaveLength(0);
    const page = await (await get(makeEnv().env, `&op=planner&status=ok&msg=${encodeURIComponent('Saved in Connect: 1 plan figure.')}`)).text();
    expect(page).toContain('<p class="status">Saved in Connect: 1 plan figure.</p>');
  });

  it('lets a council member edit Plan cells only, as their own draft', async () => {
    const { env, calls } = makeEnv({ role: 'council' });
    const html = await (await get(env)).text();
    expect(calls.find((c) => c.path.endsWith('/finance-workspace-v1')).search).toBe('?path=planning%2Fchurch');
    expect(html).toContain('1 Plan figure is your own draft');
    expect(html).toContain('Your draft');
    expect(html).toContain('name="plan_2" value="120000" class="bp-input is-draft"');
    expect(html).not.toContain('name="proj_0"');
    expect(html).not.toContain('name="act_0"');
    expect(html).not.toContain('Generate all');
    expect(html).not.toContain('connect-budget-plan-remove');
    // Projected/Actual fields in a council save are ignored; the plan row goes to their draft.
    const save = makeEnv({ role: 'council' });
    const res = await post(save.env, '/api/v1/budget-planner-save', adminForm({ plan_0: '950000', proj_1: '1', act_1: '2' }));
    expect(new URL(res.headers.get('Location'), 'https://x').searchParams.get('msg')).toBe('Saved in Connect: 1 plan figure to your draft.');
    expect(writes(save.calls).map((c) => c.path.split('/').pop())).toEqual(['finance-budget-write-v1']);
    // Without budget edit, or when the draft cannot be read, nothing is editable.
    const viewOnly = await (await get(makeEnv({ role: 'council', budget: 'view' }).env)).text();
    expect(viewOnly).not.toContain('name="plan_0"');
    const noDraft = await (await get(makeEnv({ role: 'council', draftStatus: 500 }).env)).text();
    expect(noDraft).toContain('Your own draft could not be read from Connect');
    expect(noDraft).not.toContain('name="plan_0"');
    const staff = makeEnv({ role: 'staff' });
    const denied = await post(staff.env, '/api/v1/budget-planner-save', adminForm({ plan_0: '1' }));
    expect(new URL(denied.headers.get('Location'), 'https://x').searchParams.get('status')).toBe('error');
    expect(writes(staff.calls)).toHaveLength(0);
  });

  it('projects one category with its own classification and a default starting amount', async () => {
    const html = await (await get(makeEnv().env, '&tab=project')).text();
    expect(html).toContain(`<optgroup label="Income"><option value="Income|Income:Offerings">Offerings — FY${FY - 1} $918,450</option></optgroup>`);
    expect(html).toContain('<optgroup label="Expense"><option value="Expenses|Expenses:Utilities">');
    expect(html).not.toContain('name="classification"><option value="Expenses">Expense</option><option value="Income">Income</option></select></label>\n        <label class="field"><span>Starting amount');
    const { env, calls } = makeEnv();
    const res = await post(env, '/api/v1/connect-budget-generate', { line: 'Income|Income:Offerings', base_amount: '', growth_percent: '3', target_years: `${FY},${FY + 1}`, target_year: String(FY), base_year: String(FY - 1) });
    expect(res.headers.get('Location')).toContain('status=ok');
    const sent = writes(calls).find((c) => c.path.endsWith('/finance-budget-generate-v1')).body;
    expect(sent).toMatchObject({ category: 'Income:Offerings', classification: 'Income', base_amount: '918450', target_years: [String(FY), String(FY + 1)] });
    expect(Number(sent.growth_pct)).toBeCloseTo(0.03, 10);
    expect(parseProjectLine('Expenses|Expenses:A|B')).toEqual({ classification: 'Expenses', category: 'Expenses:A|B' });
    expect(parseProjectLine('Other|x')).toBeNull();
    expect(defaultProjectBaseCents({ projectedCents: null, baseActualCents: 0, baseBudgetCents: 500 })).toBe(500);
  });

  it('runs the outlook at the rates asked for, and still converts a growth percentage for Connect', async () => {
    expect(outlookYears({ firstYear: 2027, revenueCents: 100, expenseCents: 100, revenuePct: 0, expensePct: 3 }).map((y) => y.expenseCents)).toEqual([100, 103, 106, 109, 112]);
    const html = await (await get(makeEnv().env, '&out_exp=5&out_rev=2')).text();
    expect(html).toContain('name="out_exp" value="5"');
    expect(html).toContain('At 5% expense growth and 2% revenue growth');
    const { env, calls } = makeEnv();
    await post(env, '/api/v1/connect-budget-generate-all', { base_year: String(FY - 1), target_year: String(FY), growth_percent: '3' });
    expect(Number(writes(calls).find((c) => c.path.includes('generate-all')).body.growth_pct)).toBeCloseTo(0.03, 10);
  });

  it('replaces the framed Connect planner: its old address lands here, and a failed read falls back', async () => {
    const old = await (await worker.fetch(new Request('https://finance.test/?section=planning&page=connect', { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), makeEnv().env)).text();
    expect(old).toContain('<h1 class="page-title">Budget planner</h1>');
    expect(old).not.toContain('<iframe');
    expect(old).not.toContain('Connect budget planner');
    const fallback = await (await get(makeEnv({ builderStatus: 500 }).env)).text();
    expect(fallback).not.toContain('class="bb-banner');
  });

  it('parses the table form without trusting a non-admin with corrections', () => {
    const form = new URLSearchParams(adminForm({ plan_0: '1,000.4', proj_0: '5', act_0: '7' }));
    expect(parsePlannerForm(form, { canEditActuals: false })).toMatchObject({ plan: [{ planned_amount: '1000' }], projections: [], actuals: [] });
    expect(parsePlannerForm(form, { canEditActuals: true }).projections).toEqual([{ category: 'Income:Offerings', amount: '5' }]);
    expect(parsePlannerForm(new URLSearchParams({ target_year: 'x' })).errors).toHaveLength(1);
  });
});
