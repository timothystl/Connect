import { beforeEach, describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../apps/finance/shell.js';
import { applyScenario, buildForecast, ensurePlanningSchema, readGrowth, readPlanningScenarios, scenarioLine, withBoardCategories } from '../apps/finance/planning-scenarios-service.js';
import { resetEnsuredSchemasForTests } from '../apps/finance/finance-owned-schema.js';
import { normalizeBoardLayout } from '../apps/finance/board-layout.js';

const FY = new Date().getUTCFullYear() + 1;
const LINES = [
  { category: 'Offerings', classification: 'Income', plannedAmountCents: 94600400, group: 'donor' },
  { category: 'Property distributions', classification: 'Income', plannedAmountCents: 14688000, group: 'passive' },
  { category: 'Daycare reimbursement', classification: 'Income', plannedAmountCents: 9984000, group: 'earned' },
  { category: 'Other income', classification: 'Income', plannedAmountCents: 9600000, group: 'earned' },
  { category: 'Salaries & benefits', classification: 'Expenses', plannedAmountCents: 74420600, group: 'salaries' },
  { category: 'Building & grounds', classification: 'Expenses', plannedAmountCents: 26208000, group: 'property' },
  { category: 'Worship & programs', classification: 'Expenses', plannedAmountCents: 27494700, group: 'programs' },
];
const RUNWAY = {
  contract: 'connect.finance-cash-runway.v1', dataClassification: 'aggregate', sourceProduct: 'connect',
  consumerProduct: 'finance', currency: 'USD', fiscalYear: FY - 1, generatedAt: '2026-09-25T12:00:00Z',
  available: true, onHandCents: 40038000, expensesYtdCents: 90000000, monthsElapsed: 9,
  averageMonthlyExpenseCents: 10000000, monthsOfCash: 4, policyFloorMonths: 3,
  floorCents: 30000000, gapToFloorCents: 0, cashSource: 'balance_sheet',
  cashAccounts: ['Operating checking'], asOfDate: '2026-09-01', daycareExcludedCents: 300000,
  allExpensesYtdCents: 90300000,
};
const ZERO = { giving_pct: 0, earned_pct: 0, passive_pct: 0, staff_pct: 0, other_pct: 0 };

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

function makeEnv({ role = 'admin', permissions = { finance: 'edit', budget: 'edit', giving: 'edit' }, basisFails = false, lines = LINES, db = makeDb() } = {}) {
  const calls = [];
  const env = {
    ENVIRONMENT: 'staging', RELEASE_SHA: 't', FINANCE_DB: db, FINANCE_CONTRACT_API_KEY: 'k',
    CONNECT_SERVICE: {
      async fetch(req) {
        const url = new URL(req.url);
        calls.push(url.pathname + url.search);
        if (url.pathname.endsWith('/staff-role-v1')) return new Response(JSON.stringify({ role, permissions, identity: 'andrew@example.org' }));
        if (url.pathname.endsWith('/finance-planning-basis-v1')) {
          if (basisFails) return new Response('{}', { status: 500 });
          return new Response(JSON.stringify({ contract: 'connect.finance-planning-basis.v1', fiscalYear: FY, lines, totals: {} }));
        }
        if (url.pathname.endsWith('/finance-cash-runway-v1')) return new Response(JSON.stringify(RUNWAY));
        return new Response('{}', { status: 404 });
      },
    },
  };
  return { env, db, calls };
}
const get = (env, query) => worker.fetch(new Request(`https://finance.test/?section=planning${query}`, { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), env);
const post = (env, path, fields, headers = {}) => worker.fetch(new Request(`https://finance.test${path}`, {
  method: 'POST', headers: { 'Cf-Access-Jwt-Assertion': 'jwt', 'Sec-Fetch-Site': 'same-origin', ...headers }, body: new URLSearchParams(fields),
}), env);
const params = (res) => Object.fromEntries(new URL(res.headers.get('Location'), 'https://x').searchParams);

beforeEach(() => resetEnsuredSchemasForTests());

describe('Planning scenarios and forecast math', () => {
  it('applies group percentages to the plan without dropping any line', () => {
    const plan = applyScenario(LINES, ZERO);
    expect(plan).toMatchObject({ incomeCents: 128872400, expenseCents: 128123300, resultCents: 749100 });
    const soft = applyScenario(LINES, { giving_pct: -3, earned_pct: 0, passive_pct: -10, staff_pct: 2, other_pct: 0 });
    expect(soft.incomeCents).toBe(128872400 - Math.round(94600400 * 0.03) - Math.round(14688000 * 0.1));
    expect(soft.expenseCents).toBe(128123300 + Math.round(74420600 * 0.02));
    expect(soft.byAdjustment.giving_pct).toEqual({ planCents: 94600400, scenarioCents: Math.round(94600400 * 0.97) });
  });

  it('applies a line amount over a board-category percentage over a group percentage', () => {
    const lines = withBoardCategories(LINES, normalizeBoardLayout({ boardCategories: { expense: { 'Worship & programs': 'worship' } } }));
    expect(lines.find((l) => l.category === 'Offerings').boardKey).toBe('revenue:donor');
    expect(lines.find((l) => l.category === 'Salaries & benefits').boardKey).toBe('expense:salaries');
    expect(lines.find((l) => l.category === 'Worship & programs').boardKey).toBe('expense:worship');
    const scenario = {
      ...ZERO, other_pct: 10, staff_pct: 5,
      categoryPcts: { 'expense:worship': -20, 'expense:salaries': 0 },
      lineAmounts: { 'Building & grounds': 25000000, 'Salaries & benefits': 80000000 },
    };
    const byCat = (c) => scenarioLine(lines.find((l) => l.category === c), scenario);
    // Line amount beats both its category (0%) and its group (+5%).
    expect(byCat('Salaries & benefits')).toEqual({ cents: 80000000, source: 'line' });
    // Line amount beats the group (+10%) when there is no category change.
    expect(byCat('Building & grounds')).toEqual({ cents: 25000000, source: 'line' });
    // Category (-20%) beats the group (+10%).
    expect(byCat('Worship & programs')).toEqual({ cents: Math.round(27494700 * 0.8), source: 'category' });
    // Nothing named: the plan.
    expect(byCat('Offerings')).toEqual({ cents: 94600400, source: 'plan' });
    const r = applyScenario(lines, scenario);
    expect(r.expenseCents).toBe(80000000 + 25000000 + Math.round(27494700 * 0.8));
    expect(r.incomeCents).toBe(128872400);
    expect(r.byAdjustment.other_pct).toEqual({ planCents: 26208000 + 27494700, scenarioCents: 25000000 + Math.round(27494700 * 0.8) });
    // A category change of 0% still wins over the group, and so keeps the plan figure.
    expect(scenarioLine(lines.find((l) => l.category === 'Salaries & benefits'), { ...scenario, lineAmounts: {} })).toEqual({ cents: 74420600, source: 'category' });
  });

  it('grows later years and carries cash forward from today', () => {
    const rows = buildForecast({ firstYear: 2027, first: { incomeCents: 128872400, expenseCents: 128123300 }, incomeGrowthPct: 2.5, expenseGrowthPct: 3, startCashCents: 40038000 });
    expect(rows.map((r) => r.fiscalYear)).toEqual([2027, 2028, 2029, 2030, 2031]);
    expect(rows[0]).toMatchObject({ resultCents: 749100, cashCents: 40787100 });
    expect(rows[1].incomeCents).toBe(Math.round(128872400 * 1.025));
    expect(rows[4].resultCents).toBeLessThan(0);
    expect(rows[0].reserveMonths).toBeCloseTo(40787100 / (128123300 / 12), 5);
    expect(buildForecast({ firstYear: 2027, first: { incomeCents: 1, expenseCents: 1 }, incomeGrowthPct: 0, expenseGrowthPct: 0, startCashCents: null })[0].cashCents).toBeNull();
    expect(readGrowth(new URLSearchParams('g=+4.25%'), 'g', 2.5)).toBe(4.3);
    expect(readGrowth(new URLSearchParams('g=99'), 'g', 2.5)).toBe(15);
    expect(readGrowth(new URLSearchParams(''), 'g', 2.5)).toBe(2.5);
  });
});

describe('Migration 0018: the three fixed slots become named scenarios', () => {
  it('copies saved slots and the council basis once, keeps the old tables, and never resurrects a deleted scenario', async () => {
    const db = makeDb();
    db.sqlite.exec(readFileSync(new URL('../apps/finance/migrations/0013_finance_planning.sql', import.meta.url), 'utf8'));
    db.sqlite.exec(`
      INSERT INTO finance_planning_scenarios (fiscal_year, slot, name, note, giving_pct, earned_pct, passive_pct, staff_pct, other_pct, updated_at, updated_by)
        VALUES (2027, 'conservative', 'Soft year', 'Giving down', -5, 0, -10, 0, -2.5, '2026-09-20 10:00:00', 'andrew@example.org');
      INSERT INTO finance_planning_basis (fiscal_year, slot, chosen_at, chosen_by) VALUES (2027, 'conservative', '2026-09-21 09:00:00', 'andrew@example.org');
      INSERT INTO finance_planning_basis (fiscal_year, slot, chosen_at, chosen_by) VALUES (2028, 'hopeful', '2026-09-22 09:00:00', 'treasurer@example.org');
      INSERT INTO finance_planning_basis (fiscal_year, slot, chosen_at, chosen_by) VALUES (2026, 'plan', '2026-01-02 09:00:00', 'andrew@example.org');
    `);
    expect(await ensurePlanningSchema(db)).toBe(true);
    const sets = db.sqlite.prepare('SELECT id, fiscal_year, name, note, giving_pct, passive_pct, other_pct, updated_by FROM finance_planning_scenario_sets ORDER BY id').all();
    expect(sets).toEqual([
      { id: 'fy2027-conservative', fiscal_year: 2027, name: 'Soft year', note: 'Giving down', giving_pct: -5, passive_pct: -10, other_pct: -2.5, updated_by: 'andrew@example.org' },
      { id: 'fy2028-hopeful', fiscal_year: 2028, name: 'Hopeful', note: 'Giving grows beyond the plan', giving_pct: 2, passive_pct: 0, other_pct: 0, updated_by: 'treasurer@example.org' },
    ]);
    expect(db.sqlite.prepare('SELECT fiscal_year, scenario_id, chosen_by FROM finance_planning_basis_choice ORDER BY fiscal_year').all()).toEqual([
      { fiscal_year: 2026, scenario_id: 'plan', chosen_by: 'andrew@example.org' },
      { fiscal_year: 2027, scenario_id: 'fy2027-conservative', chosen_by: 'andrew@example.org' },
      { fiscal_year: 2028, scenario_id: 'fy2028-hopeful', chosen_by: 'treasurer@example.org' },
    ]);
    // The old tables are untouched.
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM finance_planning_scenarios').get().n).toBe(1);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM finance_planning_basis').get().n).toBe(3);
    const read = await readPlanningScenarios(db, 2027);
    expect(read.basisId).toBe('fy2027-conservative');
    expect(read.scenarios.map((s) => s.name)).toEqual(['Budget plan', 'Soft year']);
    // Delete the migrated scenario, then run the migration again in a fresh isolate: it stays gone.
    db.sqlite.exec("DELETE FROM finance_planning_scenario_sets WHERE id = 'fy2027-conservative'");
    resetEnsuredSchemasForTests();
    expect(await ensurePlanningSchema(db)).toBe(true);
    expect(db.sqlite.prepare("SELECT COUNT(*) AS n FROM finance_planning_scenario_sets WHERE id = 'fy2027-conservative'").get().n).toBe(0);
    expect((await readPlanningScenarios(db, 2027)).basisId).toBe('plan');
  });
});

describe('Planning pages (Finance v3)', () => {
  it('starts a year with the plan alone and offers the standard scenarios', async () => {
    const { env, calls } = makeEnv();
    const html = await (await get(env, '&page=scenarios')).text();
    expect(html).toContain('<h1 class="page-title">Scenarios</h1>');
    expect(calls).toContain(`/api/contracts/finance-planning-basis-v1?fiscal_year=${FY}`);
    expect(html).toContain('+$7,491');
    expect(html).toContain('<span class="pl-basis-tag">Basis for council</span>');
    expect(html).toContain('<details class="panel panel-spaced edit-panel" open><summary>New scenario</summary>');
    expect(html).toContain('Add the standard Conservative and Hopeful scenarios');
    expect(html).toContain('<b>Staff costs:</b> Salaries &amp; benefits');
  });

  it('creates, edits with category and line changes, compares, duplicates and deletes named scenarios', async () => {
    const { env, db } = makeEnv();
    expect(params(await post(env, '/api/v1/planning/scenario-create', { fiscal_year: String(FY), from: 'standard' }))).toMatchObject({ page: 'scenarios', status: 'ok' });
    const created = await post(env, '/api/v1/planning/scenario-create', { fiscal_year: String(FY), from: 'plan', name: 'Second pastor', note: 'Call in spring' });
    const id = params(created).edit;
    expect(id).toMatch(/^s[0-9a-f]{16}$/);
    const names = () => db.sqlite.prepare('SELECT name FROM finance_planning_scenario_sets WHERE fiscal_year = ? ORDER BY name').all(FY).map((r) => r.name);
    expect(names()).toEqual(['Conservative', 'Hopeful', 'Second pastor']);
    // The editor lists board categories and every plan line.
    const edit = await (await get(env, `&page=scenarios&edit=${id}`)).text();
    expect(edit).toContain('<h2>Edit Second pastor</h2>');
    expect(edit).toContain('name="cat__expense:salaries"');
    expect(edit).toContain('name="line_path_4" value="Salaries &amp; benefits"');
    // Save: groups, one category change, one line amount.
    const saved = await post(env, '/api/v1/planning/scenario-save', {
      fiscal_year: String(FY), id, name: 'Second pastor', note: 'Call in spring', giving_pct: '1', earned_pct: '0', passive_pct: '0', staff_pct: '0', other_pct: '0',
      'cat__expense:salaries': '12', 'cat__revenue:donor': '', line_path_0: 'Offerings', line_amt_0: '', line_path_5: 'Building & grounds', line_amt_5: '250,000',
    });
    expect(params(saved)).toMatchObject({ status: 'ok', edit: id });
    expect(db.sqlite.prepare('SELECT kind, target, pct, amount_cents FROM finance_planning_scenario_overrides WHERE scenario_id = ? ORDER BY kind').all(id)).toEqual([
      { kind: 'category', target: 'expense:salaries', pct: 12, amount_cents: null },
      { kind: 'line', target: 'Building & grounds', pct: null, amount_cents: 25000000 },
    ]);
    const planning = await readPlanningScenarios(db, FY);
    const second = planning.scenarios.find((s) => s.id === id);
    expect(second).toMatchObject({ giving_pct: 1, categoryPcts: { 'expense:salaries': 12 }, lineAmounts: { 'Building & grounds': 25000000 } });
    // Compare it beside the plan.
    const compared = await (await get(env, `&page=scenarios&cmp=${id}`)).text();
    const expected = 128123300 - 74420600 - 26208000 + Math.round(74420600 * 1.12) + 25000000;
    expect(compared).toContain('<th>Second pastor</th>');
    expect(compared).toContain(`$${Math.round(expected / 100).toLocaleString('en-US')}`);
    expect(compared).toContain('Changes 1 group, 1 category, 1 line');
    // Duplicate copies the overrides; delete needs the confirmation and resets the basis.
    const copy = params(await post(env, '/api/v1/planning/scenario-create', { fiscal_year: String(FY), from: id }));
    expect(db.sqlite.prepare('SELECT name FROM finance_planning_scenario_sets WHERE id = ?').get(copy.edit).name).toBe('Copy of Second pastor');
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM finance_planning_scenario_overrides WHERE scenario_id = ?').get(copy.edit).n).toBe(2);
    await post(env, '/api/v1/planning/scenario-basis', { fiscal_year: String(FY), id });
    expect((await readPlanningScenarios(db, FY)).basisId).toBe(id);
    expect(params(await post(env, '/api/v1/planning/scenario-delete', { fiscal_year: String(FY), id }))).toMatchObject({ status: 'error', reason: 'invalid' });
    expect(params(await post(env, '/api/v1/planning/scenario-delete', { fiscal_year: String(FY), id, confirm: 'yes' }))).toMatchObject({ status: 'ok' });
    expect(names()).toEqual(['Conservative', 'Copy of Second pastor', 'Hopeful']);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM finance_planning_scenario_overrides WHERE scenario_id = ?').get(id).n).toBe(0);
    expect((await readPlanningScenarios(db, FY)).basisId).toBe('plan');
  });

  it('validates writes and refuses other roles and cross-site posts', async () => {
    const { env } = makeEnv();
    const id = params(await post(env, '/api/v1/planning/scenario-create', { fiscal_year: String(FY), name: 'Lean' })).edit;
    const base = { fiscal_year: String(FY), id, name: 'Lean', giving_pct: '0', earned_pct: '0', passive_pct: '0', staff_pct: '0', other_pct: '0' };
    expect(params(await post(env, '/api/v1/planning/scenario-save', { ...base, giving_pct: '-80' }))).toMatchObject({ reason: 'invalid' });
    expect(params(await post(env, '/api/v1/planning/scenario-save', { ...base, 'cat__expense:nope': '5' }))).toMatchObject({ reason: 'invalid' });
    expect(params(await post(env, '/api/v1/planning/scenario-save', { ...base, line_path_0: 'Offerings', line_amt_0: '-5' }))).toMatchObject({ reason: 'invalid' });
    expect(params(await post(env, '/api/v1/planning/scenario-save', { ...base, id: 'plan' }))).toMatchObject({ reason: 'invalid' });
    expect(params(await post(env, '/api/v1/planning/scenario-basis', { fiscal_year: String(FY), id: 'missing' }))).toMatchObject({ reason: 'invalid' });
    const staff = makeEnv({ role: 'staff', permissions: { finance: 'view', budget: 'view', giving: 'view' } });
    expect(params(await post(staff.env, '/api/v1/planning/scenario-create', { fiscal_year: String(FY), name: 'x' }))).toMatchObject({ reason: 'access_denied' });
    expect(await (await get(staff.env, '&page=scenarios')).text()).not.toContain('New scenario');
    expect(params(await post(env, '/api/v1/planning/scenario-basis', { fiscal_year: String(FY), id: 'plan' }, { 'Sec-Fetch-Site': 'cross-site' }))).toMatchObject({ reason: 'cross_site' });
  });

  it('forecasts five years from the basis scenario and today’s operating cash', async () => {
    const { env } = makeEnv();
    const html = await (await get(env, '&page=multi-year')).text();
    expect(html).toContain('<h1 class="page-title">Multi-year forecast</h1>');
    expect(html).toContain(`FY${FY + 4} result`);
    expect(html).toContain('Starting from $400,380 today');
    expect(html).toContain('Council target: 3 months');
    expect(html).toContain('<td>$407,871</td>');
    expect(html).toContain('name="income_growth" value="2.5"');
    await post(env, '/api/v1/planning/scenario-create', { fiscal_year: String(FY), from: 'standard' });
    const hopeful = (await readPlanningScenarios(env.FINANCE_DB, FY)).scenarios.find((s) => s.name === 'Hopeful');
    const custom = await (await get(env, `&page=multi-year&scenario=${hopeful.id}&income_growth=4&expense_growth=2`)).text();
    expect(custom).toContain('name="income_growth" value="4"');
    expect(custom).toContain('<span class="chip is-on">Hopeful</span>');
  });

  it('says so plainly when the plan cannot be read or does not exist yet', async () => {
    const failing = makeEnv({ basisFails: true });
    expect(await (await get(failing.env, '&page=scenarios')).text()).toContain('could not be read from Connect');
    const empty = makeEnv({ lines: [] });
    resetEnsuredSchemasForTests();
    expect(await (await get(empty.env, '&page=multi-year')).text()).toContain(`No FY${FY} budget plan yet`);
  });
});
