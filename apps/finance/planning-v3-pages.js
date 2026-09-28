// Planning, v3 design: Scenarios and Multi-year forecast. Both start from the fiscal year's budget
// plan in Connect (read live through connect.finance-planning-basis.v1). Scenario settings are
// Finance's own (planning-scenarios-service.js); the forecast is a GET form and saves nothing.
//
// Scenarios: any number of named scenarios per year. The page lists them all, compares up to three
// side by side against the plan (cmp=, a GET choice), and edits one (edit=): its group
// percentages, a percentage for any board category, and a dollar amount for any plan line.
import { escapeHtml as e } from './render-helpers.js';
import {
  ADJUSTMENTS, MAX_COMPARE, PLAN_ID, applyScenario, adjustmentFor, boardCategoryOptions, buildForecast, readGrowth, scenarioLine, withBoardCategories,
} from './planning-scenarios-service.js';

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const money = (cents) => USD.format(Math.round((Number(cents) || 0) / 100));
const signed = (cents) => `${cents < 0 ? '−' : '+'}${money(Math.abs(cents))}`;
const compact = (cents) => {
  const d = Math.abs(cents) / 100;
  const body = d >= 1e6 ? `$${(d / 1e6).toFixed(1)}M` : d >= 1e3 ? `$${Math.round(d / 1e3)}k` : `$${Math.round(d)}`;
  return `${cents < 0 ? '−' : '+'}${body}`;
};
const pctText = (v) => (Number(v) ? `${v > 0 ? '+' : ''}${Number(v)}%` : 'As planned');
export const DEFAULT_INCOME_GROWTH = 2.5;
export const DEFAULT_EXPENSE_GROWTH = 3;

function href(page, params = {}) {
  const q = new URLSearchParams({ section: 'planning', page });
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  return `/?${q.toString().replace(/&/g, '&amp;')}`;
}

function statusBanner(status) {
  return status ? `<p class="status${status.ok ? '' : ' status-error'}">${e(status.message)}</p>` : '';
}

function noPlan(fiscalYear) {
  return `<div class="panel"><h2>No FY${fiscalYear} budget plan yet</h2><p class="muted-line">Scenarios and the forecast start from the budget plan. Build it on the <a href="${href('builder')}">Budget planner</a> page first.</p></div>`;
}

function unavailable(message) {
  return `<p class="status status-error">The FY budget plan could not be read from Connect: ${e(message)} Nothing here is a real $0.</p>`;
}

// ── Scenarios ─────────────────────────────────────────────────────────────────────────────────

// The scenarios to compare: cmp= (repeated or comma-separated) naming up to three saved scenarios;
// by default the council basis and then the first ones saved.
export function compareIds(params, planning) {
  const saved = planning.scenarios.filter((s) => s.id !== PLAN_ID).map((s) => s.id);
  const asked = (params?.getAll ? params.getAll('cmp') : []).flatMap((v) => String(v).split(',')).map((v) => v.trim()).filter((v) => saved.includes(v));
  const ids = asked.length ? asked : [...(planning.basisId !== PLAN_ID ? [planning.basisId] : []), ...saved];
  return [...new Set(ids)].slice(0, MAX_COMPARE);
}

function changeSummary(s) {
  if (s.id === PLAN_ID) return 'The saved plan, unchanged';
  const groups = ADJUSTMENTS.filter((a) => Number(s[a.key])).length;
  const cats = Object.keys(s.categoryPcts || {}).length;
  const lines = Object.keys(s.lineAmounts || {}).length;
  const parts = [groups && `${groups} group${groups === 1 ? '' : 's'}`, cats && `${cats} categor${cats === 1 ? 'y' : 'ies'}`, lines && `${lines} line${lines === 1 ? '' : 's'}`].filter(Boolean);
  return parts.length ? `Changes ${parts.join(', ')}` : 'No changes yet: same as the plan';
}

function card(s, r, { planning, fiscalYear, canEdit, cmp }) {
  const isBasis = planning.basisId === s.id;
  const keep = cmp.join(',');
  const action = isBasis
    ? '<span class="pl-basis-tag">Basis for council</span>'
    : canEdit ? `<form method="POST" action="/api/v1/planning/scenario-basis"><input type="hidden" name="fiscal_year" value="${fiscalYear}"><input type="hidden" name="id" value="${e(s.id)}"><input type="hidden" name="cmp" value="${e(keep)}"><button type="submit" class="button-outline pl-use">Use this scenario</button></form>` : '';
  const edit = canEdit && s.id !== PLAN_ID ? `<a class="pl-edit" href="${href('scenarios', { edit: s.id, cmp: keep })}">Edit</a>` : '';
  return `<div class="pl-card${isBasis ? ' is-basis' : ''}">
      <div class="pl-card-head"><h2>${e(s.name)}</h2><span>${e(s.note || '')}</span></div>
      <p class="pl-changes">${e(changeSummary(s))}${edit}</p>
      <dl class="pl-totals"><div><dt>Income</dt><dd>${money(r.incomeCents)}</dd></div><div><dt>Expenses</dt><dd>${money(r.expenseCents)}</dd></div>
        <div><dt>Result</dt><dd class="${r.resultCents < 0 ? 'tone-bad' : 'tone-good'}">${signed(r.resultCents)}</dd></div></dl>
      ${action}
    </div>`;
}

// Up to three scenarios beside the plan, by group, then income, expenses and the net result.
function comparison(lines, planning, cmp, results) {
  const plan = results.get(PLAN_ID);
  const chosen = cmp.map((id) => planning.scenarios.find((s) => s.id === id)).filter(Boolean);
  const cell = (planCents, cents, isExpense = false) => {
    const diff = cents - planCents;
    const tone = diff === 0 ? 'tone-muted' : (diff > 0) !== isExpense ? 'tone-good' : 'tone-bad';
    return `<td>${money(cents)}<small class="${tone}">${diff === 0 ? 'same as plan' : `${signed(diff)} vs. plan`}</small></td>`;
  };
  const groupRows = ADJUSTMENTS.map((a) => {
    const members = lines.filter((l) => l.classification === a.side && a.groups.includes(l.group)).length;
    const p = plan.byAdjustment[a.key].scenarioCents;
    return `<tr><td>${a.label}<small>${a.hint ? `${a.hint} · ` : ''}${members} line${members === 1 ? '' : 's'}</small></td><td>${money(p)}</td>${chosen.map((s) => cell(p, results.get(s.id).byAdjustment[a.key].scenarioCents, a.side === 'Expenses')).join('')}</tr>`;
  }).join('');
  const totals = [['Income', 'incomeCents', false], ['Expenses', 'expenseCents', true]].map(([label, key, isExp]) => `<tr class="total-row"><td>${label}</td><td>${money(plan[key])}</td>${chosen.map((s) => cell(plan[key], results.get(s.id)[key], isExp)).join('')}</tr>`).join('');
  const net = `<tr class="total-row"><td>Net result</td><td class="${plan.resultCents < 0 ? 'tone-bad' : 'tone-good'}">${signed(plan.resultCents)}</td>${chosen.map((s) => {
    const r = results.get(s.id).resultCents;
    return `<td class="${r < 0 ? 'tone-bad' : 'tone-good'}">${signed(r)}<small>${r === plan.resultCents ? 'same as plan' : `${signed(r - plan.resultCents)} vs. plan`}</small></td>`;
  }).join('')}</tr>`;
  const saved = planning.scenarios.filter((s) => s.id !== PLAN_ID);
  const picker = saved.length ? `<form method="GET" action="/" class="pl-compare-pick"><input type="hidden" name="section" value="planning"><input type="hidden" name="page" value="scenarios">
      ${Array.from({ length: MAX_COMPARE }, (_, i) => `<label class="field"><span>Scenario ${i + 1}</span><select name="cmp"><option value="">—</option>${saved.map((s) => `<option value="${e(s.id)}"${cmp[i] === s.id ? ' selected' : ''}>${e(s.name)}</option>`).join('')}</select></label>`).join('')}
      <button type="submit" class="button-outline">Compare</button></form>` : '';
  return `<div class="panel panel-spaced list-panel"><div class="panel-head"><h2>Side by side</h2><span class="muted">Up to ${MAX_COMPARE} scenarios against the budget plan</span></div>
      ${picker}
      ${chosen.length ? '' : '<p class="muted-line">Add a scenario to compare it with the plan.</p>'}
      <div class="table-scroll"><table class="pm-table pl-num pl-compare"><thead><tr><th>Group</th><th>Budget plan</th>${chosen.map((s) => `<th>${e(s.name)}${planning.basisId === s.id ? ' <small>basis</small>' : ''}</th>`).join('')}</tr></thead>
      <tbody>${groupRows}${totals}${net}</tbody></table></div>
      <details class="pl-lines"><summary>Which plan lines are in each group</summary><ul>${ADJUSTMENTS.map((a) => `<li><b>${a.label}:</b> ${e(lines.filter((l) => l.classification === a.side && a.groups.includes(l.group)).map((l) => l.category).join(', ') || 'none')}</li>`).join('')}</ul>
      <p class="muted-line">Lines are grouped the way Connect classifies them for the Health page (revenue streams and expense categories, including any mapping saved under Accounts &amp; Data). Board categories are the ones set on Chart of Accounts.</p></details></div>`;
}

const SOURCE_TEXT = { line: 'set for this line', category: 'from its category', group: 'from its group', plan: 'as planned' };

// One scenario's editor: group percentages, then a percentage for any board category, then a
// dollar amount for any line. A blank field means no change at that level.
function editor(s, lines, layout, { fiscalYear, cmp }) {
  const keep = cmp.join(',');
  const categories = boardCategoryOptions(lines, layout);
  const catRows = categories.map((c) => {
    const members = lines.filter((l) => l.boardKey === c.key);
    const planCents = members.reduce((t, l) => t + l.plannedAmountCents, 0);
    const groups = [...new Set(members.map((l) => adjustmentFor(l)).filter(Boolean))];
    const otherwise = groups.length ? groups.map((a) => `${a.label}: ${Number(s[a.key]) ? pctText(s[a.key]) : 'no change'}`).join(', ') : 'as planned';
    const v = s.categoryPcts?.[c.key];
    return `<tr><td>${e(c.label)}<small>${c.side === 'Income' ? 'Revenue' : 'Expense'} · ${members.length} line${members.length === 1 ? '' : 's'} · otherwise ${e(otherwise)}</small></td><td>${money(planCents)}</td>
      <td><input name="cat__${e(c.key)}" inputmode="decimal" value="${v == null ? '' : e(v)}" placeholder="—" aria-label="${e(c.label)} change (%)" class="pl-input"> %</td></tr>`;
  }).join('');
  const lineRows = lines.map((l, i) => {
    const v = s.lineAmounts?.[l.category];
    const now = scenarioLine(l, s);
    const catLabel = categories.find((c) => c.key === l.boardKey)?.label || '';
    return `<tr><td>${e(l.category)}<small>${e(catLabel)} · ${l.classification === 'Income' ? 'Revenue' : 'Expense'}</small><input type="hidden" name="line_path_${i}" value="${e(l.category)}"></td><td>${money(l.plannedAmountCents)}</td><td>${money(now.cents)}<small>${SOURCE_TEXT[now.source]}</small></td>
      <td>$ <input name="line_amt_${i}" inputmode="decimal" value="${v == null ? '' : e(Math.round(v / 100))}" placeholder="—" aria-label="${e(l.category)} amount ($)" class="pl-input pl-input-wide"></td></tr>`;
  }).join('');
  return `<div class="panel panel-spaced pl-editor" id="edit"><div class="panel-head"><h2>Edit ${e(s.name)}</h2><a href="${href('scenarios', { cmp: keep })}">Close</a></div>
      <form method="POST" action="/api/v1/planning/scenario-save">
        <input type="hidden" name="fiscal_year" value="${fiscalYear}"><input type="hidden" name="id" value="${e(s.id)}"><input type="hidden" name="cmp" value="${e(keep)}">
        <div class="form-grid">
          <label class="field"><span>Name</span><input name="name" maxlength="40" value="${e(s.name)}" required></label>
          <label class="field"><span>Note</span><input name="note" maxlength="80" value="${e(s.note || '')}"></label>
        </div>
        <h3>By group</h3>
        <div class="form-grid">${ADJUSTMENTS.map((a) => `<label class="field"><span>${a.label} (% vs. plan)</span><input name="${a.key}" inputmode="decimal" value="${Number(s[a.key]) || 0}"></label>`).join('')}</div>
        <h3>By board category <small class="muted">overrides its group; leave blank to follow the group</small></h3>
        <div class="table-scroll"><table class="pm-table pl-num"><thead><tr><th>Category</th><th>Plan</th><th>Change</th></tr></thead><tbody>${catRows}</tbody></table></div>
        <h3>By line <small class="muted">a dollar amount for the year overrides everything else; leave blank to follow the category or group</small></h3>
        <div class="table-scroll"><table class="pm-table pl-num"><thead><tr><th>Plan line</th><th>Plan</th><th>This scenario now</th><th>Set to</th></tr></thead><tbody>${lineRows}</tbody></table></div>
        <div class="form-actions"><button type="submit">Save ${e(s.name)}</button></div>
      </form>
      <div class="pl-editor-foot">
        <form method="POST" action="/api/v1/planning/scenario-create"><input type="hidden" name="fiscal_year" value="${fiscalYear}"><input type="hidden" name="from" value="${e(s.id)}"><input type="hidden" name="cmp" value="${e(keep)}"><button type="submit" class="button-outline">Duplicate</button></form>
        <form method="POST" action="/api/v1/planning/scenario-delete"><input type="hidden" name="fiscal_year" value="${fiscalYear}"><input type="hidden" name="id" value="${e(s.id)}"><input type="hidden" name="cmp" value="${e(keep)}">
          <label><input type="checkbox" name="confirm" value="yes" required> Delete ${e(s.name)}</label> <button type="submit" class="button-outline">Delete</button></form>
      </div>
    </div>`;
}

function newScenarioForm(planning, { fiscalYear, cmp }) {
  const saved = planning.scenarios.filter((s) => s.id !== PLAN_ID);
  return `<details class="panel panel-spaced edit-panel"${saved.length ? '' : ' open'}><summary>New scenario</summary>
      <form method="POST" action="/api/v1/planning/scenario-create" class="form-grid">
        <input type="hidden" name="fiscal_year" value="${fiscalYear}"><input type="hidden" name="cmp" value="${e(cmp.join(','))}">
        <label class="field"><span>Name</span><input name="name" maxlength="40" placeholder="e.g. Second pastor"></label>
        <label class="field"><span>Note</span><input name="note" maxlength="80"></label>
        <label class="field"><span>Start from</span><select name="from"><option value="plan">The budget plan, unchanged</option>${saved.map((s) => `<option value="${e(s.id)}">A copy of ${e(s.name)}</option>`).join('')}</select></label>
        <div class="form-actions"><button type="submit">Create scenario</button></div>
      </form>
      <form method="POST" action="/api/v1/planning/scenario-create"><input type="hidden" name="fiscal_year" value="${fiscalYear}"><input type="hidden" name="from" value="standard"><input type="hidden" name="cmp" value="${e(cmp.join(','))}">
        <button type="submit" class="button-outline">Add the standard Conservative and Hopeful scenarios</button></form>
    </details>`;
}

export function renderScenariosPage({ basis, planning, canEdit, status, params = null, layout = null }) {
  if (!basis.ok) return `${statusBanner(status)}${unavailable(basis.message)}`;
  const { fiscalYear } = basis.data;
  if (!basis.data.lines.length) return `${statusBanner(status)}${noPlan(fiscalYear)}`;
  const lines = withBoardCategories(basis.data.lines, layout);
  const results = new Map(planning.scenarios.map((s) => [s.id, applyScenario(lines, s)]));
  const cmp = compareIds(params, planning);
  const ctx = { planning, fiscalYear, canEdit, cmp };
  const cards = planning.scenarios.map((s) => card(s, results.get(s.id), ctx)).join('');
  const editId = params?.get('edit');
  const editing = canEdit && editId ? planning.scenarios.find((s) => s.id === editId && s.id !== PLAN_ID) : null;
  const chosen = planning.basisChosen;
  return `${statusBanner(status)}
    <p class="lede">Versions of FY${fiscalYear}, each built from the budget plan saved in Connect. A scenario raises or lowers groups of plan lines by a percentage, and can go further: a percentage for one board category, or a dollar amount for one line (a line amount wins over its category, which wins over its group). The Budget plan is the saved plan itself. The one you pick becomes the basis the council sees and the starting point for the Multi-year forecast.</p>
    <div class="pl-cards">${cards}</div>
    ${chosen ? `<p class="muted-line">Basis chosen ${e(String(chosen.chosen_at || '').slice(0, 10))}${chosen.chosen_by ? ` by ${e(chosen.chosen_by)}` : ''}.</p>` : ''}
    ${comparison(lines, planning, cmp, results)}
    ${editing ? editor(editing, lines, layout, ctx) : ''}
    ${canEdit && !editing ? newScenarioForm(planning, ctx) : ''}`;
}

// ── Multi-year forecast ───────────────────────────────────────────────────────────────────────

export function renderForecastPage({ basis, planning, runway, params, layout = null }) {
  if (!basis.ok) return unavailable(basis.message);
  const { fiscalYear } = basis.data;
  if (!basis.data.lines.length) return noPlan(fiscalYear);
  const lines = withBoardCategories(basis.data.lines, layout);
  const requested = params?.get('scenario');
  const scenario = planning.scenarios.find((s) => s.id === requested) || planning.scenarios.find((s) => s.id === planning.basisId) || planning.scenarios[0];
  const incomeGrowth = readGrowth(params, 'income_growth', DEFAULT_INCOME_GROWTH);
  const expenseGrowth = readGrowth(params, 'expense_growth', DEFAULT_EXPENSE_GROWTH);
  const startCash = runway ? runway.operatingCashCents : null;
  const rows = buildForecast({ firstYear: fiscalYear, first: applyScenario(lines, scenario), incomeGrowthPct: incomeGrowth, expenseGrowthPct: expenseGrowth, startCashCents: startCash });
  const last = rows.at(-1);
  const target = runway?.policyFloorMonths ?? null;
  const fy = (y) => `FY${String(y).slice(2)}`;
  const kpis = `<div class="grid">
      <div class="card"><small>FY${last.fiscalYear} result</small><strong class="${last.resultCents < 0 ? 'tone-bad' : ''}">${signed(last.resultCents)}</strong><span>If these growth rates hold</span></div>
      <div class="card"><small>Operating cash, end FY${last.fiscalYear}</small><strong>${last.cashCents === null ? '—' : money(last.cashCents)}</strong><span>${startCash === null ? 'Operating cash is not available from Connect' : `Starting from ${money(startCash)} today`}</span></div>
      <div class="card"><small>Months of reserve, FY${last.fiscalYear}</small><strong>${last.reserveMonths === null ? '—' : last.reserveMonths.toFixed(1)}</strong><span class="${target !== null && last.reserveMonths !== null ? (last.reserveMonths >= target ? 'tone-good' : 'tone-warn') : ''}">${target === null ? 'No council target set' : `Council target: ${target} months`}</span></div>
    </div>`;
  const chips = planning.scenarios.map((s) => (s.id === scenario.id
    ? `<span class="chip is-on">${e(s.name)}${s.id === planning.basisId ? ' · basis' : ''}</span>`
    : `<a class="chip" href="${href('multi-year', { scenario: s.id, income_growth: String(incomeGrowth), expense_growth: String(expenseGrowth) })}">${e(s.name)}${s.id === planning.basisId ? ' · basis' : ''}</a>`)).join('');
  const form = `<form method="GET" action="/" class="panel panel-spaced pl-rates">
      <input type="hidden" name="section" value="planning"><input type="hidden" name="page" value="multi-year"><input type="hidden" name="scenario" value="${e(scenario.id)}">
      <label>Income growth / yr <span><input type="number" name="income_growth" value="${incomeGrowth}" step="0.1" min="-15" max="15">%</span></label>
      <label>Expense growth / yr <span><input type="number" name="expense_growth" value="${expenseGrowth}" step="0.1" min="-15" max="15">%</span></label>
      <button type="submit">Recalculate</button><a class="pl-reset" href="${href('multi-year', { scenario: scenario.id })}">Reset</a>
    </form>`;
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.resultCents)));
  const chart = `<div class="pl-bars">${rows.map((r) => `<div class="pl-bar-col"><span class="pl-bar-value">${compact(r.resultCents)}</span><div class="pl-bar${r.resultCents < 0 ? ' is-deficit' : ''}" style="height:${Math.max(2, Math.abs(r.resultCents) / max * 150).toFixed(0)}px"></div><span class="pl-bar-label">${fy(r.fiscalYear)}</span></div>`).join('')}</div>`;
  const cell = (fn) => rows.map((r) => `<td>${fn(r)}</td>`).join('');
  const table = `<div class="table-scroll"><table class="pm-table pl-num"><thead><tr><th>Line</th>${rows.map((r) => `<th>${fy(r.fiscalYear)}</th>`).join('')}</tr></thead><tbody>
      <tr><td>Income</td>${cell((r) => money(r.incomeCents))}</tr>
      <tr><td>Expenses</td>${cell((r) => money(r.expenseCents))}</tr>
      <tr class="total-row"><td>Result</td>${rows.map((r) => `<td class="${r.resultCents < 0 ? 'tone-bad' : 'tone-good'}">${signed(r.resultCents)}</td>`).join('')}</tr>
      <tr><td>Operating cash, year end</td>${cell((r) => (r.cashCents === null ? '—' : money(r.cashCents)))}</tr>
      <tr><td>Months of reserve</td>${cell((r) => (r.reserveMonths === null ? '—' : r.reserveMonths.toFixed(1)))}</tr>
    </tbody></table></div>`;
  return `<p class="lede">Five fiscal years from the FY${fiscalYear} plan. The first year is the ${e(scenario.name)} scenario; each later year grows income and expenses by the rates below. Year-end cash adds each year’s result to today’s operating cash, so the rest of this year is not counted.</p>
    ${kpis}
    <div class="chip-row">${chips}</div>
    ${form}
    <div class="panel panel-spaced"><div class="panel-head"><h2>Planned result by year</h2><span class="muted">Red = deficit</span></div>${chart}</div>
    <div class="panel panel-spaced list-panel"><div class="panel-head"><h2>Five-year forecast</h2><span class="muted">FY${fiscalYear} = ${e(scenario.name)}</span></div>${table}</div>`;
}

export const PLANNING_V3_STYLES = `
    .pl-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:16px; margin-top:16px; }
    .pl-card { background:#fff; border:1px solid #E3E7EE; border-radius:10px; padding:20px 22px; display:flex; flex-direction:column; gap:12px; }
    .pl-card.is-basis { border:2px solid var(--navy); }
    .pl-card-head { display:flex; justify-content:space-between; align-items:baseline; gap:10px; flex-wrap:wrap; }
    .pl-card-head h2 { margin:0; }
    .pl-card-head span { color:#9A6B12; font-size:12px; font-weight:600; }
    .pl-changes { margin:0; font-size:13px; color:#4B5563; display:flex; justify-content:space-between; gap:8px; }
    .pl-edit { font-weight:600; }
    .pl-card dl { margin:0; }
    .pl-card dl div { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #EEF0F4; font-size:14px; }
    .pl-card dt { color:#4B5563; }
    .pl-card dd { margin:0; }
    .pl-totals { background:#F4F6F9; border-radius:8px; padding:8px 14px; }
    .pl-totals div { border-bottom:none !important; }
    .pl-totals dd { font-weight:700; }
    .pl-basis-tag { display:block; text-align:center; padding:9px 16px; border-radius:8px; background:var(--navy); color:#fff; font-weight:600; font-size:14px; }
    .pl-card form button, .pl-use { width:100%; margin-top:0; }
    .pl-num td, .pl-num th:not(:first-child) { text-align:right; }
    .pl-num td:first-child { text-align:left; }
    .pl-num td small { display:block; color:#6B7280; font-size:12px; }
    .pl-num td small.tone-good { color:var(--green); } .pl-num td small.tone-bad { color:#B85C3A; }
    .pl-compare-pick { display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap; margin:6px 0 12px; }
    .pl-compare-pick button { margin:0; }
    .pl-editor h3 { margin:18px 0 8px; font-size:15px; }
    .pl-editor h3 small { font-weight:400; }
    .pl-input { width:72px; text-align:right; padding:4px 6px; }
    .pl-input-wide { width:110px; }
    .pl-editor-foot { display:flex; gap:16px; align-items:center; flex-wrap:wrap; margin-top:16px; padding-top:12px; border-top:1px solid #E3E7EE; }
    .pl-editor-foot form { display:flex; gap:8px; align-items:center; margin:0; }
    .pl-editor-foot button { margin:0; }
    .total-row td { font-weight:700; border-top:2px solid var(--navy); }
    .pl-lines { margin-top:14px; font-size:14px; }
    .pl-lines ul { margin:8px 0; padding-left:18px; }
    .pl-rates { display:flex; flex-wrap:wrap; gap:18px; align-items:center; flex-direction:row; }
    .pl-rates label { display:flex; align-items:center; gap:10px; font-weight:600; }
    .pl-rates label span { display:flex; align-items:center; gap:4px; font-weight:400; }
    .pl-rates input { width:84px; text-align:right; }
    .pl-rates button { margin-top:0; }
    .pl-reset { font-size:14px; }
    .pl-bars { display:flex; align-items:flex-end; gap:24px; height:200px; padding:10px 20px 0; border-bottom:1px solid #D5DAE3; margin-bottom:34px; }
    .pl-bar-col { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; position:relative; }
    .pl-bar { width:min(44px,60%); background:var(--navy); border-radius:3px 3px 0 0; }
    .pl-bar.is-deficit { background:#B5412F; }
    .pl-bar-value { font-size:12px; color:#4B5563; margin-bottom:4px; }
    .pl-bar-label { position:absolute; bottom:-24px; font-size:12px; color:#4B5563; }
`;
