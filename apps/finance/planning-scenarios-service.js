// Planning scenarios and the multi-year forecast (v3 design). The budget plan stays in Connect
// (connect.finance-planning-basis.v1 returns its lines, each sorted into a group); a scenario is a
// named set of changes applied to those lines, stored in Finance's own tables
// (migrations/0018_finance_planning_scenarios.sql). "Budget plan" is always the saved plan itself,
// unchanged, and is never stored.
//
// A fiscal year may hold any number of named scenarios (Andrew, September 28, 2026). Each has the
// five group percentages, and may add a percentage for a board category (Chart of Accounts) or a
// dollar amount for one plan line. For each line the most specific change wins: a line amount,
// else its board category's percentage, else its group's percentage. The three fixed slots of
// migration 0013 were copied into the new tables by 0018; the old tables are no longer written.
import { FormValidationError, text } from './form-fields.js';
import { runBudgetedReadBatch } from './query-budget.js';
import { ensureFinanceOwnedSchema } from './finance-owned-schema.js';
import { BOARD_EXPENSE_ORDER, BOARD_REVENUE_ORDER, boardCategoryFor, boardLabelFor, normalizeBoardLayout } from './board-layout.js';

export const PLAN_ID = 'plan';
export const MAX_SCENARIOS = 40;
export const MAX_COMPARE = 3;
export const ADJUSTMENTS = Object.freeze([
  { key: 'giving_pct', label: 'Giving', groups: ['donor', 'restricted'], side: 'Income' },
  { key: 'earned_pct', label: 'Earned income', groups: ['earned'], side: 'Income', hint: 'Daycare, rentals, fees' },
  { key: 'passive_pct', label: 'Passive income', groups: ['passive'], side: 'Income', hint: 'Investments, property distributions' },
  { key: 'staff_pct', label: 'Staff costs', groups: ['salaries'], side: 'Expenses', hint: 'Salaries and benefits' },
  { key: 'other_pct', label: 'Other expenses', groups: ['mdo', 'property', 'education', 'programs'], side: 'Expenses' },
]);

export const PLAN_SCENARIO = Object.freeze({
  id: PLAN_ID, name: 'Budget plan', note: 'The saved plan, unchanged',
  giving_pct: 0, earned_pct: 0, passive_pct: 0, staff_pct: 0, other_pct: 0, categoryPcts: Object.freeze({}), lineAmounts: Object.freeze({}),
});

// The two scenarios the page used to start with, offered as a one-click start for a new year.
export const STANDARD_SCENARIOS = Object.freeze([
  { key: 'conservative', name: 'Conservative', note: 'Plan for a soft year', giving_pct: -3, earned_pct: -2, passive_pct: -10, staff_pct: 0, other_pct: 0 },
  { key: 'hopeful', name: 'Hopeful', note: 'Giving grows beyond the plan', giving_pct: 2, earned_pct: 0, passive_pct: 0, staff_pct: 0, other_pct: 0 },
]);

// 0013 creates the old tables that 0018 copies from, so both run, in order.
export async function ensurePlanningSchema(db) {
  if (!(await ensureFinanceOwnedSchema(db, 'planning'))) return false;
  return ensureFinanceOwnedSchema(db, 'planningScenarios');
}

const PLANNING_READ_SQL = [
  'SELECT id, fiscal_year, name, note, giving_pct, earned_pct, passive_pct, staff_pct, other_pct, created_at, updated_at, updated_by FROM finance_planning_scenario_sets ORDER BY created_at, rowid',
  'SELECT scenario_id, kind, target, pct, amount_cents FROM finance_planning_scenario_overrides',
  'SELECT fiscal_year, scenario_id, chosen_at, chosen_by FROM finance_planning_basis_choice',
];

export async function readPlanningScenarios(db, fiscalYear) {
  const { results } = await runBudgetedReadBatch(db, 'planning', PLANNING_READ_SQL);
  const rows = (results[0]?.results || []).filter((r) => r.fiscal_year === fiscalYear);
  const overrides = results[1]?.results || [];
  const chosen = (results[2]?.results || []).find((r) => r.fiscal_year === fiscalYear) || null;
  const scenarios = [PLAN_SCENARIO, ...rows.map((r) => {
    const own = overrides.filter((o) => o.scenario_id === r.id);
    return {
      ...r,
      categoryPcts: Object.fromEntries(own.filter((o) => o.kind === 'category').map((o) => [o.target, o.pct])),
      lineAmounts: Object.fromEntries(own.filter((o) => o.kind === 'line').map((o) => [o.target, o.amount_cents])),
    };
  })];
  const basisId = chosen && scenarios.some((s) => s.id === chosen.scenario_id) ? chosen.scenario_id : PLAN_ID;
  return { fiscalYear, scenarios, basisId, basisChosen: chosen && basisId === chosen.scenario_id ? chosen : null };
}

// ── Applying a scenario ──────────────────────────────────────────────────────────────────────

function lastSegment(category) {
  const parts = String(category || '').split(':').map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : String(category || '');
}

// Each plan line's board category key ('revenue:donor', 'expense:salaries'), placed the way the
// Budget planner and Chart of Accounts place it: the saved assignment, else the name rule.
export function withBoardCategories(lines, layout) {
  const l = layout || normalizeBoardLayout(null);
  return lines.map((line) => {
    const isRevenue = line.classification === 'Income';
    return { ...line, boardKey: `${isRevenue ? 'revenue' : 'expense'}:${boardCategoryFor(l, line.category, lastSegment(line.category), isRevenue).key}` };
  });
}

// The board categories the plan's lines fall in, in board order, for the editor.
export function boardCategoryOptions(lines, layout) {
  const l = layout || normalizeBoardLayout(null);
  const present = new Set(lines.map((x) => x.boardKey));
  return [
    ...BOARD_REVENUE_ORDER.map((k) => ({ key: `revenue:${k}`, label: boardLabelFor(l, k, true), side: 'Income' })),
    ...BOARD_EXPENSE_ORDER.map((k) => ({ key: `expense:${k}`, label: boardLabelFor(l, k, false), side: 'Expenses' })),
  ].filter((o) => present.has(o.key));
}

export function adjustmentFor(line) {
  return ADJUSTMENTS.find((a) => a.side === line.classification && a.groups.includes(line.group)) || null;
}

const has = (obj, key) => obj != null && Object.prototype.hasOwnProperty.call(obj, key);

// One line under a scenario: a line amount, else a board-category percentage, else the group
// percentage. `source` says which rule decided it.
export function scenarioLine(line, scenario) {
  if (has(scenario.lineAmounts, line.category)) return { cents: Math.round(Number(scenario.lineAmounts[line.category]) || 0), source: 'line' };
  if (line.boardKey && has(scenario.categoryPcts, line.boardKey)) {
    return { cents: Math.round(line.plannedAmountCents * (1 + (Number(scenario.categoryPcts[line.boardKey]) || 0) / 100)), source: 'category' };
  }
  const adj = adjustmentFor(line);
  const pct = adj ? Number(scenario[adj.key]) || 0 : 0;
  return { cents: Math.round(line.plannedAmountCents * (1 + pct / 100)), source: pct ? 'group' : 'plan' };
}

// Totals for the plan with a scenario's changes applied. Lines in a group no adjustment names
// pass through unless a line or category change names them, so no line is ever dropped.
export function applyScenario(lines, scenario) {
  let incomeCents = 0;
  let expenseCents = 0;
  const byAdjustment = Object.fromEntries(ADJUSTMENTS.map((a) => [a.key, { planCents: 0, scenarioCents: 0 }]));
  const perLine = [];
  for (const line of lines) {
    const { cents, source } = scenarioLine(line, scenario);
    if (line.classification === 'Income') incomeCents += cents; else expenseCents += cents;
    const adj = adjustmentFor(line);
    if (adj) { byAdjustment[adj.key].planCents += line.plannedAmountCents; byAdjustment[adj.key].scenarioCents += cents; }
    perLine.push({ category: line.category, planCents: line.plannedAmountCents, cents, source });
  }
  return { incomeCents, expenseCents, resultCents: incomeCents - expenseCents, byAdjustment, lines: perLine };
}

// Five fiscal years: the first is the scenario-adjusted plan; each later year grows income and
// expenses by the given annual rates. Cash starts from today's operating cash and adds each
// year's result; months of reserve divide year-end cash by that year's monthly expenses.
export function buildForecast({ firstYear, first, incomeGrowthPct, expenseGrowthPct, startCashCents, years = 5 }) {
  const rows = [];
  let income = first.incomeCents;
  let expense = first.expenseCents;
  let cash = Number.isFinite(startCashCents) ? startCashCents : null;
  for (let i = 0; i < years; i += 1) {
    if (i > 0) {
      income = Math.round(income * (1 + incomeGrowthPct / 100));
      expense = Math.round(expense * (1 + expenseGrowthPct / 100));
    }
    const result = income - expense;
    if (cash !== null) cash += result;
    rows.push({
      fiscalYear: firstYear + i, incomeCents: income, expenseCents: expense, resultCents: result,
      cashCents: cash, reserveMonths: cash !== null && expense > 0 ? cash / (expense / 12) : null,
    });
  }
  return rows;
}

export function readGrowth(params, key, fallback) {
  const raw = params?.get(key);
  if (raw === null || raw === undefined || raw === '') return fallback;
  const n = Number(String(raw).replace(/[%\s+]/g, ''));
  return Number.isFinite(n) ? Math.min(15, Math.max(-15, Math.round(n * 10) / 10)) : fallback;
}

// ── Writers ──────────────────────────────────────────────────────────────────────────────────

function percent(value, label, max = 50) {
  const v = String(value ?? '').replace(/[%\s+]/g, '');
  if (!/^-?\d{1,3}(\.\d)?$/.test(v) || Math.abs(Number(v)) > max) throw new FormValidationError(`${label} must be a percentage between -${max} and ${max}, like -2.5.`);
  return Number(v);
}

function dollarsToCents(value, label) {
  const v = String(value ?? '').replace(/[$,\s]/g, '');
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(v)) throw new FormValidationError(`${label} must be a dollar amount of zero or more.`);
  return Math.round(Number(v) * 100);
}

function fiscalYearField(value) {
  const v = String(value ?? '').trim();
  if (!/^\d{4}$/.test(v) || Number(v) < 2000 || Number(v) > 2100) throw new FormValidationError('Unknown fiscal year.');
  return Number(v);
}

function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `s${[...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

async function scenarioRow(db, fiscalYear, id) {
  const row = /^[a-z0-9-]{1,40}$/.test(String(id || '')) && id !== PLAN_ID
    ? await db.prepare('SELECT * FROM finance_planning_scenario_sets WHERE id = ? AND fiscal_year = ?').bind(id, fiscalYear).first() : null;
  if (!row) throw new FormValidationError('That scenario no longer exists.');
  return row;
}

const INSERT_SET = `INSERT INTO finance_planning_scenario_sets (id, fiscal_year, name, note, giving_pct, earned_pct, passive_pct, staff_pct, other_pct, updated_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
const INSERT_OVERRIDE = 'INSERT INTO finance_planning_scenario_overrides (scenario_id, kind, target, pct, amount_cents) VALUES (?, ?, ?, ?, ?)';

// New scenario: blank (the plan unchanged), a copy of another scenario with its overrides, or the
// two standard starting scenarios. Returns the page to the new scenario's editor.
async function createScenario(db, form, actor) {
  const fiscalYear = fiscalYearField(form.fiscal_year);
  const count = (await db.prepare('SELECT COUNT(*) AS n FROM finance_planning_scenario_sets WHERE fiscal_year = ?').bind(fiscalYear).first())?.n || 0;
  const from = String(form.from || '').trim();
  if (from === 'standard') {
    if (count + STANDARD_SCENARIOS.length > MAX_SCENARIOS) throw new FormValidationError(`A year can hold ${MAX_SCENARIOS} scenarios. Delete one first.`);
    await db.batch(STANDARD_SCENARIOS.map((s) => db.prepare(INSERT_SET).bind(newId(), fiscalYear, s.name, s.note, s.giving_pct, s.earned_pct, s.passive_pct, s.staff_pct, s.other_pct, String(actor || ''))));
    return {};
  }
  if (count >= MAX_SCENARIOS) throw new FormValidationError(`A year can hold ${MAX_SCENARIOS} scenarios. Delete one first.`);
  const id = newId();
  if (from && from !== PLAN_ID) {
    const source = await scenarioRow(db, fiscalYear, from);
    const name = text(form.name, 40, 'Name') || `Copy of ${source.name}`.slice(0, 40);
    const { results: overrides = [] } = await db.prepare('SELECT kind, target, pct, amount_cents FROM finance_planning_scenario_overrides WHERE scenario_id = ?').bind(source.id).all();
    await db.batch([
      db.prepare(INSERT_SET).bind(id, fiscalYear, name, source.note, source.giving_pct, source.earned_pct, source.passive_pct, source.staff_pct, source.other_pct, String(actor || '')),
      ...overrides.map((o) => db.prepare(INSERT_OVERRIDE).bind(id, o.kind, o.target, o.pct, o.amount_cents)),
    ]);
    return { params: { edit: id } };
  }
  const name = text(form.name, 40, 'Name', { required: true });
  const note = text(form.note, 80, 'Note');
  await db.prepare(INSERT_SET).bind(id, fiscalYear, name, note, 0, 0, 0, 0, 0, String(actor || '')).run();
  return { params: { edit: id } };
}

// The editor: name, note, the five group percentages, and every category and line override
// (a blank field means no override). Overrides are replaced as a whole, in one batch.
async function saveScenario(db, form, actor) {
  const fiscalYear = fiscalYearField(form.fiscal_year);
  const row = await scenarioRow(db, fiscalYear, form.id);
  const name = text(form.name, 40, 'Name', { required: true });
  const note = text(form.note, 80, 'Note');
  const values = ADJUSTMENTS.map((a) => percent(form[a.key], a.label));
  const overrides = [];
  const allowedCategories = new Set([...BOARD_REVENUE_ORDER.map((k) => `revenue:${k}`), ...BOARD_EXPENSE_ORDER.map((k) => `expense:${k}`)]);
  for (const [field, value] of Object.entries(form)) {
    if (!field.startsWith('cat__') || String(value).trim() === '') continue;
    const target = field.slice(5);
    if (!allowedCategories.has(target)) throw new FormValidationError('Unknown board category.');
    overrides.push(['category', target, percent(value, 'A category change', 100), null]);
  }
  const lineFields = Object.keys(form).filter((k) => /^line_path_\d{1,4}$/.test(k));
  if (lineFields.length > 2000) throw new FormValidationError('Too many plan lines in one save.');
  for (const field of lineFields) {
    const target = String(form[field] || '').trim();
    const value = String(form[`line_amt_${field.slice(10)}`] ?? '').trim();
    if (!target || value === '') continue;
    if (target.length > 200) throw new FormValidationError('A plan line name is too long.');
    overrides.push(['line', target, null, dollarsToCents(value, `The amount for ${target}`)]);
  }
  await db.batch([
    db.prepare(`UPDATE finance_planning_scenario_sets SET name = ?, note = ?, giving_pct = ?, earned_pct = ?, passive_pct = ?, staff_pct = ?, other_pct = ?,
      updated_by = ?, updated_at = datetime('now') WHERE id = ?`).bind(name, note, ...values, String(actor || ''), row.id),
    db.prepare('DELETE FROM finance_planning_scenario_overrides WHERE scenario_id = ?').bind(row.id),
    ...overrides.map(([kind, target, pct, amount]) => db.prepare(INSERT_OVERRIDE).bind(row.id, kind, target, pct, amount)),
  ]);
  return { params: { edit: row.id } };
}

async function deleteScenario(db, form) {
  const fiscalYear = fiscalYearField(form.fiscal_year);
  const row = await scenarioRow(db, fiscalYear, form.id);
  if (form.confirm !== 'yes') throw new FormValidationError(`Tick “Delete ${row.name}” to confirm.`);
  await db.batch([
    db.prepare('DELETE FROM finance_planning_scenario_overrides WHERE scenario_id = ?').bind(row.id),
    db.prepare('DELETE FROM finance_planning_scenario_sets WHERE id = ?').bind(row.id),
    // The council basis falls back to the saved plan if it was this scenario.
    db.prepare("UPDATE finance_planning_basis_choice SET scenario_id = 'plan', chosen_at = datetime('now') WHERE fiscal_year = ? AND scenario_id = ?").bind(fiscalYear, row.id),
  ]);
  return {};
}

async function chooseBasis(db, form, actor) {
  const fiscalYear = fiscalYearField(form.fiscal_year);
  const id = String(form.id || form.slot || '').trim();
  if (id !== PLAN_ID) await scenarioRow(db, fiscalYear, id);
  await db.prepare(
    `INSERT INTO finance_planning_basis_choice (fiscal_year, scenario_id, chosen_by) VALUES (?, ?, ?)
     ON CONFLICT(fiscal_year) DO UPDATE SET scenario_id=excluded.scenario_id, chosen_by=excluded.chosen_by, chosen_at=datetime('now')`
  ).bind(fiscalYear, id, String(actor || '')).run();
  return {};
}

export const PLANNING_WRITERS = Object.freeze({
  'planning-scenario-save-v1': { run: saveScenario, page: 'scenarios', keepParams: ['cmp'] },
  'planning-scenario-create-v1': { run: createScenario, page: 'scenarios', keepParams: ['cmp'] },
  'planning-scenario-delete-v1': { run: deleteScenario, page: 'scenarios', keepParams: ['cmp'] },
  'planning-scenario-basis-v1': { run: chooseBasis, page: 'scenarios', keepParams: ['cmp'] },
});

export function canEditPlanning(roleResult) {
  if (!roleResult || !roleResult.ok) return false;
  return roleResult.role === 'admin' || roleResult.permissions?.budget === 'edit';
}
