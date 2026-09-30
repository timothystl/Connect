// Planning → Budget planner. Connect's Budget Planner (src/frontend/js-finance.js, finRenderPlanning
// and its print sheet and outlook), rebuilt as a server-rendered Finance page with the builder's
// three tools (Grow every line, Project one category, Commit to Church report) kept on top.
//
// Every figure comes from connect.finance-budget-builder.v1: each line of the target year's plan
// beside the base year's budget, actual and projection. Every save goes through the existing relay
// routes to Connect; nothing here stores a copy. Finance pages run no script, so:
//   - the view (base and target year, Board view or QuickBooks order, which columns show, which
//     lines are left out, the outlook's rates) is a set of GET parameters;
//   - the whole table is ONE form. Each editable cell carries its original value in a hidden
//     orig_ field, and /api/v1/budget-planner-save relays only the cells that changed: Plan cells
//     to finance-budget-write-v1 (a council member's go to their own draft in Connect, as today),
//     base-year Projected to finance-base-projection-write-v1 and base-year Actual to
//     finance-church-actual-override-v1 (both admin only, re-checked by Connect);
//   - "Choose rows" puts a checkbox on each line that belongs to a separate GET form (the HTML
//     form attribute), so leaving lines out never submits the edit form;
//   - Export CSV is a GET route returning the current view, and Print is print=1.
import { escapeHtml as e } from './render-helpers.js';
import { accountDisplayName, buildBoardSections, isHiddenAccount } from './board-layout.js';
import { csvNum, csvText } from './payroll-report-render.js';

const FLAT_FORM_ID = 'bp-flat';
const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const money = (cents) => (cents == null ? '—' : `${cents < 0 ? '−' : ''}${USD.format(Math.abs(Math.round(cents / 100)))}`);
const signed = (cents) => `${cents < 0 ? '−' : '+'}${USD.format(Math.abs(Math.round(cents / 100)))}`;
const dollars = (cents) => (cents == null ? '' : String(Math.round(cents / 100)));
const pctText = (v) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}%`;
const TABS = [['grow', 'Grow every line'], ['project', 'Project one category'], ['commit', 'Commit to Church report']];

// Screen columns, in Connect's order. 'change' is print-only (plan less base budget).
export const PLANNER_COLUMNS = Object.freeze(['bud', 'act', 'used', 'proj', 'plan', 'delta']);
const COLUMN_LABELS = { bud: (p) => `FY${p.base} Budget`, act: (p) => `FY${p.base} Actual`, used: (p) => `FY${p.base} % of budget`, proj: (p) => `FY${p.base} Projected`, plan: (p) => `FY${p.target} Plan`, change: () => 'Change', delta: () => 'Δ%' };
export const OUTLOOK_DEFAULTS = Object.freeze({ expense: 3, revenue: 0 });

// ── View parameters ──────────────────────────────────────────────────────────────────────────

function rate(raw, fallback) {
  if (raw == null || raw === '') return fallback;
  const n = Number(String(raw).replace(/[%\s+]/g, ''));
  return Number.isFinite(n) ? Math.min(15, Math.max(-15, Math.round(n * 10) / 10)) : fallback;
}

// Everything the page reads from its query string, validated. Defaults: projecting for next year
// from this year, Board view, every column, no lines left out, 3% expense growth and flat revenue.
export function plannerParams(params, now = new Date()) {
  const get = (k) => (params && params.get(k)) || '';
  const t = Number(get('target'));
  const target = Number.isInteger(t) && t >= 2001 && t <= 2100 ? t : now.getUTCFullYear() + 1;
  const b = Number(get('base'));
  const base = Number.isInteger(b) && b >= 2000 && b < target ? b : target - 1;
  const rawCols = get('cols');
  const cols = rawCols === 'none' ? [] : rawCols ? PLANNER_COLUMNS.filter((c) => rawCols.split(',').includes(c)) : [...PLANNER_COLUMNS];
  const exclude = [...new Set((params && params.getAll ? params.getAll('x') : []).map((x) => String(x).slice(0, 200)).filter(Boolean))].slice(0, 400);
  const flat = [...new Set((params && params.getAll ? params.getAll('f') : []).map((x) => String(x).slice(0, 200)).filter(Boolean))].slice(0, 400);
  const tab = TABS.some(([k]) => k === get('tab')) ? get('tab') : '';
  return {
    target, base, view: get('view') === 'qb' ? 'qb' : 'board', cols, exclude, pick: get('pick') === '1', flat, flatPick: get('fpick') === '1', tab,
    printMode: get('print_mode') === 'thisyear' ? 'thisyear' : 'plan', draft: get('draft') === '1', showHidden: get('hidden') === '1',
    outExp: rate(get('out_exp'), OUTLOOK_DEFAULTS.expense), outRev: rate(get('out_rev'), OUTLOOK_DEFAULTS.revenue),
  };
}

// The years the figures are actually for: the ones Connect answered with (a Connect that does not
// yet read base_year answers for the year before the target), so labels never misstate them.
export function plannerYears(p, builder) {
  const target = Number.isInteger(builder?.targetYear) ? builder.targetYear : p.target;
  const base = Number.isInteger(builder?.baseYear) ? builder.baseYear : p.base;
  return target === p.target && base === p.base ? p : { ...p, target, base };
}

// The view as query pairs (only what differs from the defaults, plus both years), with overrides.
// `omit` drops keys a form supplies itself.
export function plannerQuery(p, overrides = {}, omit = []) {
  const v = { ...p, ...overrides };
  const pairs = [['target', String(v.target)], ['base', String(v.base)]];
  if (v.view === 'qb') pairs.push(['view', 'qb']);
  if (v.cols.length !== PLANNER_COLUMNS.length) pairs.push(['cols', v.cols.length ? v.cols.join(',') : 'none']);
  for (const x of v.exclude) pairs.push(['x', x]);
  for (const f of v.flat) pairs.push(['f', f]);
  if (v.pick) pairs.push(['pick', '1']);
  if (v.flatPick) pairs.push(['fpick', '1']);
  if (v.showHidden) pairs.push(['hidden', '1']);
  if (v.tab) pairs.push(['tab', v.tab]);
  if (v.outExp !== OUTLOOK_DEFAULTS.expense) pairs.push(['out_exp', String(v.outExp)]);
  if (v.outRev !== OUTLOOK_DEFAULTS.revenue) pairs.push(['out_rev', String(v.outRev)]);
  return pairs.filter(([k]) => !omit.includes(k));
}

function href(p, overrides = {}) {
  const q = new URLSearchParams([['section', 'planning'], ['page', 'builder'], ...plannerQuery(p, overrides)]);
  return `/?${q.toString().replace(/&/g, '&amp;')}`;
}

function hiddenView(p, omit = []) {
  return [['section', 'planning'], ['page', 'builder'], ...plannerQuery(p, {}, omit)]
    .map(([k, v]) => `<input type="hidden" name="${e(k)}" value="${e(v)}">`).join('');
}

// ── Model ────────────────────────────────────────────────────────────────────────────────────

// A council member's own draft, read back through Connect (their saved Plan edits merged over the
// shared plan): every target-year row whose amount differs from the shared plan replaces it, marked
// as the draft. Rows are whatever Connect's planning/church GET returned for this viewer.
export function applyCouncilDraft(builder, draftRows) {
  if (!Array.isArray(draftRows) || !draftRows.length) return builder;
  const byCategory = new Map(builder.lines.map((l) => [l.category, l]));
  const lines = builder.lines.map((l) => ({ ...l }));
  const index = new Map(lines.map((l, i) => [l.category, i]));
  for (const r of draftRows) {
    if (Number(r?.fiscal_year) !== builder.targetYear || !r.category) continue;
    const cents = Math.round(Number(r.planned_amount_cents));
    if (!Number.isFinite(cents)) continue;
    const shared = byCategory.get(r.category);
    if (shared?.plan && shared.plan.plannedAmountCents === cents) continue;
    const plan = { basis: 'manual', growthPct: null, baseAmountCents: null, ...(shared?.plan || {}), notes: r.notes ?? shared?.plan?.notes ?? '', plannedAmountCents: cents, draft: true };
    if (index.has(r.category)) lines[index.get(r.category)] = { ...lines[index.get(r.category)], plan };
    else {
      index.set(r.category, lines.length);
      lines.push({ category: r.category, classification: r.classification === 'Income' ? 'Income' : 'Expenses', name: String(r.category).split(':').pop().trim(), priorActualCents: null, baseBudgetCents: null, baseActualCents: null, projectedCents: null, projectedOverridden: false, plan });
    }
  }
  return { ...builder, lines };
}

function sumLines(lines) {
  const out = { bud: 0, hasBud: false, act: 0, proj: 0, plan: 0, hasPlan: false };
  for (const l of lines) {
    if (l.baseBudgetCents != null) { out.bud += l.baseBudgetCents; out.hasBud = true; }
    out.act += l.baseActualCents || 0;
    out.proj += l.projectedCents || 0;
    if (l.plan) { out.plan += l.plan.plannedAmountCents || 0; out.hasPlan = true; }
  }
  return out;
}

function lineFigures(l) {
  return { bud: l.baseBudgetCents, hasBud: l.baseBudgetCents != null, act: l.baseActualCents || 0, proj: l.projectedCents || 0, plan: l.plan ? l.plan.plannedAmountCents : 0, hasPlan: Boolean(l.plan) };
}

// Board view: legacy's board categories (Chart of Accounts), Unrestricted and Restricted gifts
// under the Donor Income wrapper.
function boardTree(lines, layout) {
  const sections = buildBoardSections(lines, layout, (l) => ({ path: l.category, name: l.name, isRevenue: l.classification === 'Income' }));
  const group = (g, depth) => ({ kind: 'group', key: g.key, isRevenue: g.isRevenue, label: g.label, depth, children: g.items.map((line) => ({ kind: 'leaf', line, depth: depth + 1 })) });
  const side = (list) => list.map((s) => (s.kind === 'wrapper'
    ? { kind: 'group', wrapper: true, label: s.label, depth: 0, children: s.groups.map((g) => group(g, 1)) } : group(s, 0)));
  return { revenue: side(sections.revenue), expense: side(sections.expense) };
}

// QuickBooks order: the account paths as a tree ("Expenses:Property:Utilities" sits under
// Expenses › Property), each parent with its own "Total" row, as Connect's QuickBooks view does.
function qbTree(lines) {
  const side = (isRevenue) => {
    const root = { children: new Map() };
    for (const line of lines.filter((l) => (l.classification === 'Income') === isRevenue)) {
      const parts = String(line.category).split(':').map((s) => s.trim()).filter(Boolean);
      if (!parts.length) parts.push(line.category || '(no category)');
      let node = root;
      for (const part of parts) {
        if (!node.children.has(part)) node.children.set(part, { label: part, children: new Map(), line: null });
        node = node.children.get(part);
      }
      node.line = line;
    }
    const convert = (n, depth) => {
      if (!n.children.size) return { kind: 'leaf', line: n.line, depth };
      const kids = [...n.children.values()].map((c) => convert(c, depth + 1));
      if (n.line) kids.unshift({ kind: 'leaf', line: n.line, depth: depth + 1 });
      return { kind: 'group', label: n.label, depth, children: kids };
    };
    return [...root.children.values()].map((c) => convert(c, 0));
  };
  return { revenue: side(true), expense: side(false) };
}

function leavesOf(node) {
  return node.kind === 'leaf' ? [node.line] : node.children.flatMap(leavesOf);
}

// A line with nothing in any column this year (no budget, actual, projection or plan): dropped from
// the table, the export and the print unless the view asks for unused lines, so the budget lists only
// what is in use. Chart of Accounts › Budget layout still lists every account ever used, and a line
// hidden there is labeled as such. A line with money always stays.
function isQuietHiddenLine(l) {
  return !l.baseBudgetCents && !l.baseActualCents && !l.projectedCents && !l.plan?.plannedAmountCents;
}

export function buildPlannerModel(builder, { layout = null, params }) {
  const excluded = new Set(params.exclude);
  const kept = (l) => !excluded.has(l.category);
  const boardView = Boolean(layout) && params.view !== 'qb';
  const quiet = builder.lines.filter(isQuietHiddenLine);
  const shown = quiet.length && !params.showHidden ? builder.lines.filter((l) => !isQuietHiddenLine(l)) : builder.lines;
  const tree = boardView ? boardTree(shown, layout) : qbTree(shown);
  const keptLines = shown.filter(kept);
  const flat = new Set(params.flat || []);
  const flatPlan = (list) => list.filter((l) => flat.has(l.category)).reduce((t, l) => t + (l.plan?.plannedAmountCents || 0), 0);
  return {
    builder, layout, boardView, tree, kept,
    hiddenCount: quiet.length,
    excludedCount: shown.length - keptLines.length,
    flat,
    flatCount: keptLines.filter((l) => flat.has(l.category)).length,
    revenue: { ...sumLines(keptLines.filter((l) => l.classification === 'Income')), flatPlan: flatPlan(keptLines.filter((l) => l.classification === 'Income')) },
    expense: { ...sumLines(keptLines.filter((l) => l.classification !== 'Income')), flatPlan: flatPlan(keptLines.filter((l) => l.classification !== 'Income')) },
  };
}

// The table as a flat list of rows (side headers, group headers, lines, "Total" rows, the net
// row), shared by the page, the CSV and the print sheet so the three always agree. Left-out lines
// are skipped (or, while choosing rows, listed dimmed) and never counted in a total.
export function plannerRows(model, { includeExcluded = false } = {}) {
  const rows = [];
  let current = 'revenue';
  const push = (row) => rows.push({ ...row, side: current });
  const walk = (node) => {
    if (node.kind === 'leaf') {
      const isKept = model.kept(node.line);
      if (isKept || includeExcluded) push({ kind: 'leaf', line: node.line, depth: node.depth, fig: lineFigures(node.line), excluded: !isKept });
      return;
    }
    const keptLeaves = leavesOf(node).filter(model.kept);
    if (!keptLeaves.length && !includeExcluded) return;
    push({ kind: 'header', label: node.label, depth: node.depth, key: node.key, isRevenue: node.isRevenue, wrapper: node.wrapper });
    node.children.forEach(walk);
    push({ kind: 'total', label: `Total ${node.label}`, depth: node.depth, fig: sumLines(keptLeaves) });
  };
  const side = (key, label, roots, fig) => {
    current = key;
    if (!roots.length) return;
    if (model.boardView) push({ kind: 'side', label });
    roots.forEach(walk);
    if (model.boardView || roots.length !== 1) push({ kind: 'sidetotal', label: `Total ${label}`, fig });
  };
  side('revenue', 'Revenue', model.tree.revenue, model.revenue);
  side('expense', 'Expenses', model.tree.expense, model.expense);
  if (rows.length) {
    const r = model.revenue;
    const x = model.expense;
    current = 'net';
    push({ kind: 'net', label: 'Net (Revenue − Expenses)', fig: { bud: r.bud - x.bud, hasBud: r.hasBud || x.hasBud, act: r.act - x.act, proj: r.proj - x.proj, plan: r.plan - x.plan, hasPlan: r.hasPlan || x.hasPlan } });
  }
  return rows;
}

function lineName(l, layout) {
  return layout ? accountDisplayName(layout, l.category, l.name) : l.name;
}

// Δ% is the plan against the base-year budget, as in Connect: terracotta above +4%, green when
// the plan shrinks, muted otherwise; no budget to compare against shows as —.
export function deltaPct(budgetCents, planCents) {
  return budgetCents ? ((planCents - budgetCents) / Math.abs(budgetCents)) * 100 : null;
}

function deltaTone(pct) {
  return pct == null ? 'tone-muted' : pct > 4 ? 'bp-up' : pct < 0 ? 'bp-down' : 'bp-flat';
}

// How much of the base-year budget the actual has used: what the year-to-date view is read against.
function usedText(f) {
  return f.hasBud && f.bud ? `${Math.round((f.act / f.bud) * 100)}%` : '—';
}

function cellText(key, f, net = false) {
  const m = net ? (c) => (c < 0 ? `−${USD.format(Math.abs(Math.round(c / 100)))}` : USD.format(Math.round(c / 100))) : money;
  if (key === 'bud') return f.hasBud ? m(f.bud) : '—';
  if (key === 'act') return m(f.act);
  if (key === 'used') return usedText(f);
  if (key === 'proj') return m(f.proj);
  if (key === 'plan') return f.hasPlan ? m(f.plan) : '—';
  if (key === 'change') return f.hasBud && f.hasPlan ? signed(f.plan - f.bud) : '—';
  const pct = f.hasBud && f.hasPlan ? deltaPct(f.bud, f.plan) : null;
  return pct == null ? '—' : pctText(pct);
}

function figureCell(key, f, kind) {
  if (kind === 'net' && (key === 'delta' || key === 'used')) return '<td></td>';
  if (kind === 'net' && key === 'change') return '<td></td>';
  // data-col marks the figure columns for budget-planner-live.js, which redraws totals as a cell is
  // typed in; a line's own cells also carry the stored cents so the script can re-add them.
  const attrs = ` data-col="${key}"${kind === 'leaf' && key !== 'delta' && key !== 'used' ? ` data-c="${f[key] ?? 0}" data-has="${key === 'bud' ? (f.hasBud ? 1 : 0) : key === 'plan' ? (f.hasPlan ? 1 : 0) : 1}"` : ''}`;
  if (kind === 'net') {
    const v = { bud: f.bud, act: f.act, proj: f.proj, plan: f.plan }[key];
    if ((key === 'bud' && !f.hasBud) || (key === 'plan' && !f.hasPlan)) return `<td class="tone-muted"${attrs}>—</td>`;
    return `<td class="${v < 0 ? 'bp-down-net' : 'bp-up-net'}"${attrs}>${cellText(key, f, true)}</td>`;
  }
  if (key === 'delta') {
    const pct = f.hasBud && f.hasPlan ? deltaPct(f.bud, f.plan) : null;
    return `<td class="${deltaTone(pct)}"${attrs}>${cellText(key, f)}</td>`;
  }
  const text = cellText(key, f);
  return `<td${text === '—' ? ' class="tone-muted"' : ''}${attrs}>${text}</td>`;
}

// ── CSV ──────────────────────────────────────────────────────────────────────────────────────

// The current view as CSV: the same rows and columns as the table, dollars with cents, Δ% as a
// percentage. Left-out lines are not included. Labels go through Finance's one text escaper
// (csvText, with the formula guard); figures are computed here, so csvNum keeps them numbers.
export function plannerCsv(model, p) {
  const cols = p.cols;
  const d = (c) => (c / 100).toFixed(2);
  const value = (key, f, kind) => {
    if (key === 'bud') return f.hasBud ? d(f.bud) : '';
    if (key === 'act') return d(f.act);
    if (key === 'used') return f.hasBud && f.bud ? `${((f.act / f.bud) * 100).toFixed(1)}%` : '';
    if (key === 'proj') return d(f.proj);
    if (key === 'plan') return f.hasPlan ? d(f.plan) : '';
    if (kind === 'net') return '';
    const pct = f.hasBud && f.hasPlan ? deltaPct(f.bud, f.plan) : null;
    return pct == null ? '' : `${pct.toFixed(1)}%`;
  };
  const lines = [['Category', ...cols.map((c) => COLUMN_LABELS[c](p))]];
  for (const r of plannerRows(model)) {
    if (r.kind === 'side' || r.kind === 'header') lines.push([r.label, ...cols.map(() => '')]);
    else if (r.kind === 'leaf') lines.push([lineName(r.line, model.layout), ...cols.map((c) => value(c, r.fig, 'leaf'))]);
    else lines.push([r.label, ...cols.map((c) => value(c, r.fig, r.kind))]);
  }
  return `${lines.map(([label, ...figures]) => [csvText(label), ...figures.map(csvNum)].join(',')).join('\r\n')}\r\n`;
}

// ── Saving: the one form, reduced to the cells that changed ──────────────────────────────────

const clean = (v) => String(v ?? '').replace(/[$,\s]/g, '');
const sameNumber = (a, b) => a === b || (a !== '' && b !== '' && Number(a) === Number(b));

// Returns { targetYear, baseYear, plan, projections, actuals, errors }. Plan and Projected are whole
// dollars (rounded, as Connect does); Actual keeps cents. A blank Projected or Actual clears that
// correction; a blank Plan cell is left alone (Remove takes a line out of the plan). Only an admin's
// Projected and Actual cells are read at all.
export function parsePlannerForm(form, { canEditActuals = false } = {}) {
  // Display names and headings renamed in place (admin only, like the corrections below).
  const names = { accountLabels: {}, revenueLabels: {}, expenseLabels: {} };
  const errors = [];
  const year = (v) => { const n = Number(v); return Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : null; };
  const targetYear = year(form.get('target_year'));
  const baseYear = year(form.get('base_year'));
  if (!targetYear || !baseYear || baseYear >= targetYear) errors.push('The plan’s years could not be read.');
  const plan = [];
  const projections = [];
  const actuals = [];
  for (let i = 0; form.has(`p_${i}`) && i < 2000; i += 1) {
    const category = String(form.get(`p_${i}`) || '').trim();
    if (!category) continue;
    const classification = form.get(`c_${i}`) === 'Income' ? 'Income' : 'Expenses';
    const name = String(form.get(`n_${i}`) || category.split(':').pop() || category).trim();
    if (form.has(`plan_${i}`)) {
      const v = clean(form.get(`plan_${i}`));
      if (v !== '' && !sameNumber(v, clean(form.get(`orig_plan_${i}`)))) {
        if (!/^-?\d+(\.\d+)?$/.test(v)) errors.push(`The FY${targetYear} plan for ${name} is not a dollar amount.`);
        else plan.push({ category, classification, fiscal_year: targetYear, planned_amount: String(Math.round(Number(v))), notes: String(form.get(`notes_${i}`) || '') });
      }
    }
    if (canEditActuals && form.has(`lname_${i}`)) {
      const v = String(form.get(`lname_${i}`) || '').trim();
      if (v !== String(form.get(`orig_lname_${i}`) || '').trim()) names.accountLabels[category] = v;
    }
    if (canEditActuals && form.has(`proj_${i}`)) {
      const v = clean(form.get(`proj_${i}`));
      if (!sameNumber(v, clean(form.get(`orig_proj_${i}`)))) {
        if (v !== '' && !/^-?\d+(\.\d+)?$/.test(v)) errors.push(`The FY${baseYear} projection for ${name} is not a dollar amount.`);
        else projections.push({ category, amount: v === '' ? '' : String(Math.round(Number(v))) });
      }
    }
    if (canEditActuals && form.has(`act_${i}`)) {
      const v = clean(form.get(`act_${i}`));
      if (!sameNumber(v, clean(form.get(`orig_act_${i}`)))) {
        if (v !== '' && !/^-?\d+(\.\d{1,2})?$/.test(v)) errors.push(`The FY${baseYear} actual for ${name} must be dollars and cents.`);
        else actuals.push({ category, classification, account_name: name, amount: v });
      }
    }
  }
  if (canEditActuals) {
    for (const [field, value] of form.entries()) {
      const m = /^hl_(wrapper|revenue_[a-z_]+|expense_[a-z_]+)$/.exec(field);
      if (!m) continue;
      const v = String(value || '').trim().slice(0, 80);
      if (v === String(form.get(`orig_${field}`) || '').trim()) continue;
      if (m[1] === 'wrapper') names.donorWrapperLabel = v;
      else if (m[1].startsWith('revenue_')) names.revenueLabels[m[1].slice(8)] = v;
      else names.expenseLabels[m[1].slice(8)] = v;
    }
  }
  const renames = {};
  for (const key of ['accountLabels', 'revenueLabels', 'expenseLabels']) if (Object.keys(names[key]).length) renames[key] = names[key];
  if (names.donorWrapperLabel !== undefined) renames.donorWrapperLabel = names.donorWrapperLabel;
  return { targetYear, baseYear, plan, projections, actuals, renames, errors };
}

// The view to return to after a save: only the planner's own view keys survive.
export function plannerBackQuery(raw) {
  const src = new URLSearchParams(String(raw || '').slice(0, 4000));
  const out = new URLSearchParams([['section', 'planning'], ['page', 'builder']]);
  for (const [k, v] of src) if (['target', 'base', 'view', 'cols', 'x', 'f', 'out_exp', 'out_rev'].includes(k)) out.append(k, v.slice(0, 200));
  return out;
}

// "Project one category": the line's classification travels with it ("Income|Income:Offerings").
export function parseProjectLine(value) {
  const s = String(value || '');
  const cut = s.indexOf('|');
  if (cut < 0) return null;
  const classification = s.slice(0, cut);
  const category = s.slice(cut + 1).trim();
  if (!['Income', 'Expenses'].includes(classification) || !category) return null;
  return { classification, category };
}

// A blank starting amount starts from the line's base-year projection, then its actual, then its
// budget -- what Connect's planner shows beside the line.
export function defaultProjectBaseCents(line) {
  if (!line) return null;
  if (line.projectedCents) return line.projectedCents;
  if (line.baseActualCents) return line.baseActualCents;
  return line.baseBudgetCents ?? null;
}

// ── Page pieces ──────────────────────────────────────────────────────────────────────────────

function statusLine({ budgetEntryStatus, budgetEntryMessage, planOpKind, planOpStatus, planOpMessage, baseProjectionEntryStatus, baseProjectionEntryMessage, plannerStatus, plannerMessage }) {
  const verbs = { generate: 'Projection', 'generate-all': 'Grown lines', commit: 'Committed plan', remove: 'Removed line' };
  if (plannerStatus === 'ok') return `<p class="status">${e(plannerMessage || 'Saved in Connect.')}</p>`;
  if (plannerStatus === 'error') return `<p class="status status-error">${e(plannerMessage || 'Not saved.')}</p>`;
  if (budgetEntryStatus === 'ok') return '<p class="status">Line saved in Connect.</p>';
  if (budgetEntryStatus === 'error') return `<p class="status status-error">Not saved: ${e(budgetEntryMessage || 'unknown error')}</p>`;
  if (baseProjectionEntryStatus === 'ok') return '<p class="status">Projection correction saved in Connect.</p>';
  if (baseProjectionEntryStatus === 'error') return `<p class="status status-error">Correction not saved: ${e(baseProjectionEntryMessage || 'unknown error')}</p>`;
  if (planOpStatus === 'ok') return `<p class="status">${e(verbs[planOpKind] || 'Change')} saved in Connect.</p>`;
  if (planOpStatus === 'error') return `<p class="status status-error">Not saved: ${e(planOpMessage || 'unknown error')}</p>`;
  return '';
}

export function summarizeBuilder(builder) {
  const sum = (cls, pick) => builder.lines.filter((l) => l.classification === cls).reduce((t, l) => t + (pick(l) || 0), 0);
  const plan = (l) => l.plan?.plannedAmountCents;
  const planned = builder.lines.filter((l) => l.plan);
  return {
    incomeCents: sum('Income', plan),
    expenseCents: sum('Expenses', plan),
    baseBudgetIncomeCents: sum('Income', (l) => l.baseBudgetCents),
    baseBudgetExpenseCents: sum('Expenses', (l) => l.baseBudgetCents),
    grown: planned.filter((l) => l.plan.basis === 'grown').length,
    manual: planned.filter((l) => l.plan.basis !== 'grown').length,
    planned: planned.length,
    unplanned: builder.lines.length - planned.length,
  };
}

function tabPanel(builder, p, layout) {
  const { targetYear, baseYear } = builder;
  const current = TABS.find(([k]) => k === p.tab)?.[0] || 'grow';
  const nav = `<div class="bb-tabs" role="tablist">${TABS.map(([k, label]) => (k === current
    ? `<span class="is-on" role="tab" aria-selected="true">${label}</span>`
    : `<a href="${href(p, { tab: k })}" role="tab">${label}</a>`)).join('')}</div>`;
  let body;
  if (current === 'project') {
    const options = (cls) => builder.lines.filter((l) => l.classification === cls)
      .map((l) => `<option value="${e(`${cls}|${l.category}`)}">${e(lineName(l, layout))}${l.projectedCents ? ` — FY${baseYear} ${money(l.projectedCents)}` : ''}</option>`).join('');
    body = `<form method="POST" action="/api/v1/connect-budget-generate" class="bb-form">
        <input type="hidden" name="target_year" value="${targetYear}"><input type="hidden" name="base_year" value="${baseYear}">
        <label class="field"><span>Category</span><select name="line" required><optgroup label="Income">${options('Income')}</optgroup><optgroup label="Expense">${options('Expenses')}</optgroup></select></label>
        <label class="field"><span>Starting amount ($)</span><input type="number" name="base_amount" step="1" min="0" placeholder="FY${baseYear} projection"></label>
        <label class="field"><span>Growth per year (%)</span><input type="number" name="growth_percent" step="0.1" value="3" required></label>
        <label class="field"><span>Years</span><input name="target_years" value="${targetYear},${targetYear + 1},${targetYear + 2}" required></label>
        <button type="submit">Project this line</button>
      </form>
      <p class="muted-line">Income or expense follows the line chosen. Leave the starting amount blank to start from the line’s FY${baseYear} projection (or its actual, or its budget). Compounds once per listed year and saves each year as a grown line.</p>`;
  } else if (current === 'commit') {
    body = `<form method="POST" action="/api/v1/connect-budget-commit" class="bb-form">
        <input type="hidden" name="fiscal_year" value="${targetYear}">
        <button type="submit">Commit the FY${targetYear} plan to the Church report</button>
      </form>
      <p class="muted-line">The Church report then shows this plan as FY${targetYear}’s budget until real figures arrive. Re-commit after changing the plan.</p>`;
  } else {
    body = `<form method="POST" action="/api/v1/connect-budget-generate-all" class="bb-form">
        <input type="hidden" name="base_year" value="${baseYear}"><input type="hidden" name="target_year" value="${targetYear}">
        <label class="field"><span>Growth assumption for every grown line (%)</span><input type="number" name="growth_percent" step="0.1" value="3" required></label>
        <button type="submit">Generate all: apply to every grown line</button>
      </form>
      <p class="muted-line">Grows each line from its FY${baseYear} ${builder.prorated ? 'projection (year-to-date actual extended to a full year)' : 'actual'}, or its budget when there is no actual. Manual lines are left alone.</p>`;
  }
  return `<div class="panel panel-spaced bb-tools">${nav}${body}</div>`;
}

function header(builder, p, now) {
  const thisYear = now.getUTCFullYear();
  const targets = [];
  for (let y = Math.min(p.target, thisYear - 1); y <= Math.max(p.target, thisYear + 3); y += 1) targets.push(y);
  const bases = [];
  for (let y = p.target - 6; y < p.target; y += 1) bases.push(y);
  const opt = (y, sel) => `<option value="${y}"${y === sel ? ' selected' : ''}>${y}</option>`;
  return `<div class="bp-head">
      <div><h2>Budget FY${p.target}</h2><p class="muted-line">Base year ${p.base}${builder.prorated ? ` (annualized from ${Math.round(builder.throughWeek)} weeks of actuals, ${Math.round((builder.throughWeek / 52) * 100)}% of the year)` : ''} · independent of QuickBooks until you commit</p></div>
      <form method="GET" action="/" class="bp-years">${hiddenView(p, ['target', 'base', 'x', 'pick', 'tab'])}
        <label class="field"><span>Base year</span><select name="base">${bases.map((y) => opt(y, p.base)).join('')}</select></label>
        <label class="field"><span>Projecting for</span><select name="target">${targets.map((y) => opt(y, p.target)).join('')}</select></label>
        <button type="submit" class="button-outline">Show</button>
      </form>
    </div>`;
}

// Connect's navy strip: what the base year is projected to cost, what the plan costs, the change,
// and what revenue would have to be for the plan to balance against this year's.
function summaryStrip(model, p) {
  const baseExp = model.expense.proj;
  const planExp = model.expense.plan;
  const change = planExp - baseExp;
  const pct = baseExp ? (change / Math.abs(baseExp)) * 100 : null;
  const gap = planExp - model.revenue.proj;
  return `<div class="bb-banner bp-strip" data-base="${p.base}">
      <div><small>FY${p.base} projected expenses</small><strong data-bp-strip="baseExp">${money(baseExp)}</strong></div>
      <div><small>FY${p.target} planned</small><strong class="bp-gold" data-bp-strip="planExp">${money(planExp)}</strong></div>
      <div><small>Change</small><strong data-bp-strip="change">${signed(change)}</strong><span data-bp-strip="changePct">${pct == null ? '' : pctText(pct)}</span></div>
      <div class="bp-strip-last"><small>Revenue needed to balance</small><strong class="bp-green" data-bp-strip="needed">${money(planExp)}</strong><span data-bp-strip="gap">${gap >= 0 ? '+' : '−'}${money(Math.abs(gap))} on this year’s revenue (FY${p.base} projected ${money(model.revenue.proj)})</span></div>
    </div>`;
}

function toolbar(model, p, { pickFormId }) {
  const chip = (key) => {
    const on = p.cols.includes(key);
    const cols = on ? p.cols.filter((c) => c !== key) : PLANNER_COLUMNS.filter((c) => c === key || p.cols.includes(c));
    return `<a class="chip${on ? ' is-on' : ' bp-chip-off'}" href="${href(p, { cols })}" aria-pressed="${on}">${e(COLUMN_LABELS[key](p))}</a>`;
  };
  const pick = p.pick
    ? `<form method="GET" action="/" id="${pickFormId}" class="bp-pick">${hiddenView(p, ['x', 'pick'])}<button type="submit" class="button-outline">Done choosing rows</button></form>`
    : `<a class="button-outline bp-button" href="${href(p, { pick: true, flatPick: false })}">Choose rows</a>`;
  const flatPick = p.flatPick
    ? `<form method="GET" action="/" id="${FLAT_FORM_ID}" class="bp-pick">${hiddenView(p, ['f', 'fpick'])}<button type="submit" class="button-outline">Done choosing growing lines</button></form>`
    : `<a class="button-outline bp-button" href="${href(p, { flatPick: true, pick: false })}" title="Pick which lines grow in the five-year outlook">Choose lines that grow</a>`;
  const csv = `/api/v1/budget-planner-csv?${new URLSearchParams(plannerQuery(p, {}, ['pick', 'tab'])).toString().replace(/&/g, '&amp;')}`;
  return `<div class="bp-toolbar">
      <span class="bp-label">Columns</span><div class="chip-row bp-chips">${PLANNER_COLUMNS.map(chip).join('')}</div>
      ${pick}
      ${flatPick}
      ${p.flat.length && !p.flatPick ? `<span class="muted-line">${p.flat.length} line${p.flat.length === 1 ? '' : 's'} held flat in the outlook</span><a href="${href(p, { flat: [] })}">Let every line grow</a>` : ''}
      ${model.excludedCount ? `<span class="muted-line">${model.excludedCount} line${model.excludedCount === 1 ? '' : 's'} left out</span><a href="${href(p, { exclude: [], pick: false })}">Include all lines</a>` : ''}
      ${model.hiddenCount ? (p.showHidden
    ? `<a href="${href(p, { showHidden: false })}">Hide the ${model.hiddenCount} unused line${model.hiddenCount === 1 ? '' : 's'} again</a>`
    : `<span class="muted-line">${model.hiddenCount} unused line${model.hiddenCount === 1 ? '' : 's'} hidden (nothing in them this year)</span><a href="${href(p, { showHidden: true })}">Show unused lines</a>`) : ''}
      <span class="bp-spacer"></span>
      <a class="button-outline bp-button" href="${csv}">Export CSV</a>
      <form method="GET" action="/" class="bp-print">${hiddenView(p, ['pick', 'tab'])}<input type="hidden" name="print" value="1">
        <label><input type="radio" name="print_mode" value="plan"${p.printMode === 'plan' ? ' checked' : ''}> Plan for next year</label>
        <label><input type="radio" name="print_mode" value="thisyear"${p.printMode === 'thisyear' ? ' checked' : ''}> Just this year</label>
        <label title="Stamps a DRAFT watermark across the printed sheet, for a plan not yet committed"><input type="checkbox" name="draft" value="1"${p.draft ? ' checked' : ''}> Mark DRAFT</label>
        <button type="submit">Print</button>
      </form>
    </div>`;
}

// One account line. Editable cells carry their original value so only changes are saved.
function leafRow(r, ctx) {
  const l = r.line;
  const { p, canEditPlan, canEditActuals, layout } = ctx;
  const shown = lineName(l, layout);
  const editable = !r.excluded && (canEditPlan || canEditActuals);
  const i = editable ? ctx.counter++ : null;
  const ids = editable ? `<input type="hidden" name="p_${i}" value="${e(l.category)}"><input type="hidden" name="c_${i}" value="${l.classification === 'Income' ? 'Income' : 'Expenses'}"><input type="hidden" name="n_${i}" value="${e(l.name || shown)}"><input type="hidden" name="notes_${i}" value="${e(l.plan?.notes || '')}">` : '';
  const pickBox = p.pick ? `<input type="checkbox" form="${ctx.pickFormId}" name="x" value="${e(l.category)}"${r.excluded ? ' checked' : ''} aria-label="Leave out ${e(shown)}" title="Tick to leave this line out of the totals, the export and the printed sheet">` : '';
  const flatBox = p.flatPick ? `<input type="checkbox" form="${FLAT_FORM_ID}" name="f" value="${e(l.category)}"${ctx.model.flat.has(l.category) ? ' checked' : ''} aria-label="Hold ${e(shown)} flat in the outlook" title="Tick to hold this line flat: it does not grow in the five-year outlook">` : '';
  const sub = [
    layout && isHiddenAccount(layout, l.category) ? 'Hidden in Chart of Accounts' : (isQuietHiddenLine(l) ? 'Unused this year' : ''),
    shown !== l.name ? e(l.name) : '',
    l.plan?.draft ? 'Your draft' : '',
    l.plan?.notes ? e(l.plan.notes) : '',
  ].filter(Boolean).join(' · ');
  // An admin renames a line in place; it saves with the rest of the table, to the same display names
  // Chart of Accounts keeps. A blank name goes back to the QuickBooks name.
  const nameCell = editable && ctx.canManage && layout
    ? `<input type="text" name="lname_${i}" value="${e(shown)}" class="bp-name-input" aria-label="Name of ${e(shown)}" maxlength="120"><input type="hidden" name="orig_lname_${i}" value="${e(shown)}">`
    : `<b>${e(shown)}</b>`;
  const label = `<td class="bp-name" style="padding-left:${10 + r.depth * 16}px">${pickBox}${flatBox}${ids}${nameCell}${sub ? `<small>${sub}</small>` : ''}</td>`;
  const f = r.fig;
  const input = (name, value, extra, aria) => `<input type="text" inputmode="${extra.inputmode}" name="${name}_${i}" value="${e(value)}" class="bp-input${extra.cls ? ` ${extra.cls}` : ''}" aria-label="${e(aria)}"${extra.title ? ` title="${e(extra.title)}"` : ''}><input type="hidden" name="orig_${name}_${i}" value="${e(value)}">`;
  const cells = p.cols.map((key) => {
    if (!editable) return figureCell(key, f, 'leaf');
    if (key === 'plan' && canEditPlan) return `<td data-col="plan" data-c="${l.plan ? l.plan.plannedAmountCents || 0 : 0}" data-has="${l.plan ? 1 : 0}">${input('plan', dollars(l.plan?.plannedAmountCents), { inputmode: 'numeric', cls: l.plan?.draft ? 'is-draft' : '' }, `FY${p.target} plan for ${shown}`)}</td>`;
    if (key === 'proj' && canEditActuals) return `<td data-col="proj" data-c="${l.projectedCents || 0}" data-has="1">${input('proj', dollars(l.projectedCents), { inputmode: 'numeric', cls: l.projectedOverridden ? 'is-corrected' : '', title: 'Whole dollars. Clear the box to go back to the computed projection.' }, `FY${p.base} projection for ${shown}`)}</td>`;
    if (key === 'act' && canEditActuals) return `<td data-col="act" data-c="${l.baseActualCents || 0}" data-has="1">${input('act', String((l.baseActualCents || 0) / 100), { inputmode: 'decimal', title: 'Corrects this account’s imported or synced actual. Clear the box to go back to the real figure.' }, `FY${p.base} actual for ${shown}`)}</td>`;
    return figureCell(key, f, 'leaf');
  }).join('');
  return `<tr class="${r.excluded ? 'bp-excluded' : ''}" data-bp="leaf" data-side="${r.side}">${label}${cells}</tr>`;
}

function tableRows(model, ctx) {
  const rows = plannerRows(model, { includeExcluded: ctx.p.pick });
  const span = ctx.p.cols.length + 1;
  if (!rows.length) return `<tr><td colspan="${span}" class="tone-muted">No budget lines for FY${ctx.p.base} or FY${ctx.p.target} yet — sync or import FY${ctx.p.base} on the Church report first.</td></tr>`;
  return rows.map((r) => {
    if (r.kind === 'leaf') return leafRow(r, ctx);
    if (r.kind === 'side') return `<tr class="bb-group"><td colspan="${span}">${e(r.label)}</td></tr>`;
    if (r.kind === 'header') {
      const field = r.wrapper ? 'hl_wrapper' : r.key ? `hl_${r.isRevenue ? 'revenue' : 'expense'}_${r.key}` : '';
      const text = ctx.form && ctx.canManage && ctx.layout && field
        ? `<input type="text" name="${field}" value="${e(r.label)}" class="bp-name-input bp-heading-input" aria-label="Heading ${e(r.label)}" maxlength="80"><input type="hidden" name="orig_${field}" value="${e(r.label)}">`
        : e(r.label);
      return `<tr class="bp-header" data-bp="header" data-side="${r.side}"><td colspan="${span}" style="padding-left:${10 + r.depth * 16}px">${text}</td></tr>`;
    }
    const cls = r.kind === 'net' ? 'bb-result' : r.kind === 'sidetotal' ? 'bb-total' : 'bb-subtotal';
    const pad = r.kind === 'total' ? ` style="padding-left:${10 + r.depth * 16}px"` : '';
    return `<tr class="${cls}" data-bp="${r.kind}" data-side="${r.side}"><td${pad}>${e(r.label)}</td>${ctx.p.cols.map((k) => figureCell(k, r.fig, r.kind)).join('')}</tr>`;
  }).join('');
}

// ── Five-year outlook ────────────────────────────────────────────────────────────────────────

// Only the lines that grow compound at the rate; `...FixedCents` is the part of each side (the lines
// chosen to hold flat) that stays where the plan puts it.
export function outlookYears({ firstYear, revenueCents, expenseCents, revenuePct, expensePct, revenueFixedCents = 0, expenseFixedCents = 0, years = 5 }) {
  const out = [];
  let rev = revenueCents - revenueFixedCents;
  let exp = expenseCents - expenseFixedCents;
  for (let i = 0; i < years; i += 1) {
    const revenue = rev + revenueFixedCents;
    const expense = exp + expenseFixedCents;
    out.push({ year: firstYear + i, revenueCents: revenue, expenseCents: expense, gapCents: expense - revenue });
    rev = Math.round(rev * (1 + revenuePct / 100));
    exp = Math.round(exp * (1 + expensePct / 100));
  }
  return out;
}

// Connect's gap chart: expenses compounding (solid terracotta) against revenue (dashed teal), the
// band between them filled. Server-rendered SVG.
export function outlookChart(years) {
  const all = years.flatMap((y) => [y.revenueCents, y.expenseCents]);
  const maxV = Math.max(1, ...all);
  const minV = Math.min(0, ...all);
  const span = Math.max(1, maxV - minV);
  const x0 = 70; const x1 = 458; const yTop = 20; const yBot = 140;
  const px = (i) => (years.length > 1 ? x0 + ((x1 - x0) * i) / (years.length - 1) : x0);
  const py = (c) => yBot - ((c - minV) / span) * (yBot - yTop);
  const pts = (key) => years.map((y, i) => `${px(i).toFixed(1)},${py(y[key]).toFixed(1)}`).join(' ');
  const band = `${pts('expenseCents')} ${years.map((y, i) => `${px(years.length - 1 - i).toFixed(1)},${py(years[years.length - 1 - i].revenueCents).toFixed(1)}`).join(' ')}`;
  const grid = [0, 1, 2].map((i) => {
    const y = yBot - ((yBot - yTop) * i) / 2;
    return `<line x1="64" y1="${y.toFixed(1)}" x2="470" y2="${y.toFixed(1)}" stroke="#E3E7EE"/><text x="60" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="9.5" fill="#6B7280">${money(minV + (span * i) / 2)}</text>`;
  }).join('');
  const last = years[years.length - 1];
  return `<svg viewBox="0 0 480 180" width="100%" class="bp-outlook-chart" role="img" aria-label="Outlook: expenses from ${money(years[0].expenseCents)} to ${money(last.expenseCents)} against revenue from ${money(years[0].revenueCents)} to ${money(last.revenueCents)}">
    ${grid}
    <polygon points="${band}" fill="#F6E1DA"/>
    <polyline points="${pts('expenseCents')}" fill="none" stroke="#B5412F" stroke-width="3"/>
    <polyline points="${pts('revenueCents')}" fill="none" stroke="#2E7EA6" stroke-width="3" stroke-dasharray="6 5"/>
    ${years.map((y, i) => `<text x="${px(i).toFixed(1)}" y="158" text-anchor="middle" font-size="10" fill="#4B5563">FY${y.year}</text>`).join('')}
    <text x="70" y="176" font-size="10.5" font-weight="700" fill="#B5412F">— Expenses</text><text x="160" y="176" font-size="10.5" font-weight="700" fill="#2E7EA6">- - Revenue</text>
  </svg>`;
}

function outlook(model, p) {
  const years = outlookYears({ firstYear: p.target, revenueCents: model.revenue.plan, expenseCents: model.expense.plan, revenuePct: p.outRev, expensePct: p.outExp, revenueFixedCents: model.revenue.flatPlan, expenseFixedCents: model.expense.flatPlan });
  const last = years[years.length - 1];
  const rates = `${p.outExp}% expense growth and ${p.outRev === 0 ? 'flat revenue' : `${p.outRev}% revenue growth`}${model.flatCount ? `, with the ${model.flatCount} line${model.flatCount === 1 ? '' : 's'} you chose held flat` : ''}`;
  return `<div class="panel panel-spaced bp-outlook">
      <div class="panel-head"><h2>Five-year outlook</h2><span class="muted">From the FY${p.target} plan</span></div>
      <p class="muted-line">At ${rates}, the gap ${last.gapCents > 0 ? `compounds to ${money(last.gapCents)} by FY${last.year}` : `stays closed through FY${last.year}`}. Not a forecast so much as the question “if nothing changes on the revenue side, what does this plan cost us?”</p>
      <form method="GET" action="/" class="pl-rates">${hiddenView(p, ['out_exp', 'out_rev', 'pick'])}
        <label>Expenses grow <span><input type="number" name="out_exp" value="${p.outExp}" step="0.1" min="-15" max="15">% / yr</span></label>
        <label>Revenue grows <span><input type="number" name="out_rev" value="${p.outRev}" step="0.1" min="-15" max="15">% / yr</span></label>
        <button type="submit">Recalculate</button><a class="pl-reset" href="${href(p, { outExp: OUTLOOK_DEFAULTS.expense, outRev: OUTLOOK_DEFAULTS.revenue })}">Reset</a>
      </form>
      <div class="bp-outlook-body">${outlookChart(years)}
        <div class="table-scroll"><table class="pm-table pl-num"><thead><tr><th>Year</th><th>Revenue</th><th>Expenses</th><th>Gap</th></tr></thead>
          <tbody>${years.map((y) => `<tr><td>FY${y.year}</td><td>${money(y.revenueCents)}</td><td>${money(y.expenseCents)}</td><td class="${y.gapCents > 0 ? 'tone-bad' : 'tone-good'}">${y.gapCents > 0 ? money(y.gapCents) : `${money(-y.gapCents)} surplus`}</td></tr>`).join('')}</tbody></table></div>
      </div>
    </div>`;
}

// ── The page ─────────────────────────────────────────────────────────────────────────────────

export function renderBudgetBuilderPage({ liveVersion = 'local', builder: rawBuilder, params, canEditPlan = false, canEditActuals = false, canManageBudgetPlan = false, statuses = {}, councilViewer = false, councilDraft = null, councilDraftFailed = false, layout = null, now = new Date() }) {
  const p = plannerYears(plannerParams(params, now), rawBuilder);
  const builder = councilDraft ? applyCouncilDraft(rawBuilder, councilDraft) : rawBuilder;
  const model = buildPlannerModel(builder, { layout, params: p });
  const pickFormId = 'bp-pick';
  const form = canEditPlan || canEditActuals;
  const ctx = { model, p, canEditPlan, canEditActuals, canManage: canManageBudgetPlan, layout, counter: 0, pickFormId, form };
  const rows = tableRows(model, ctx);
  const drafts = builder.lines.filter((l) => l.plan?.draft).length;
  const viewToggle = layout
    ? `<div class="bb-view" role="group" aria-label="Layout">${model.boardView ? '<span class="is-on">Board view</span>' : `<a href="${href(p, { view: 'board' })}">Board view</a>`}${model.boardView ? `<a href="${href(p, { view: 'qb' })}">QuickBooks order</a>` : '<span class="is-on">QuickBooks order</span>'}${canManageBudgetPlan ? '<a href="/?section=accounts&amp;page=chart#layout">Edit the layout in Chart of Accounts</a>' : ''}</div>`
    : '<p class="muted-line">The board layout from Chart of Accounts could not be read, so lines are listed in QuickBooks order.</p>';
  const table = `<div class="table-scroll"><table class="pm-table bb-table bp-table"><thead><tr><th>Category</th>${p.cols.map((k) => `<th>${e(COLUMN_LABELS[k](p))}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  const editNote = canEditActuals
    ? `Plan, FY${p.base} Projected and FY${p.base} Actual are editable; only the cells you change are saved. A blank Projected or Actual goes back to the computed or imported figure.`
    : 'Your Plan figures are saved as your own draft in Connect; the shared plan is not changed.';
  const body = form
    ? `<script src="/budget-planner/live.js?v=${encodeURIComponent(liveVersion)}" defer></script>
      <form method="POST" action="/api/v1/budget-planner-save" class="bp-form">
        <button type="submit" class="bp-default-submit" tabindex="-1" aria-hidden="true">Save changes</button>
        <input type="hidden" name="target_year" value="${p.target}"><input type="hidden" name="base_year" value="${p.base}"><input type="hidden" name="fiscal_year" value="${p.target}">
        <input type="hidden" name="back" value="${e(new URLSearchParams(plannerQuery(p, {}, ['pick', 'fpick', 'tab'])).toString())}">
        ${table}
        <div class="bp-actions"><button type="submit">Save changes</button><span class="muted-line">${editNote}</span></div>
      </form>`
    : table;
  const lede = `<p class="lede">The FY${p.target} church budget, category by category, built from FY${p.base}. Grouped the way the board reads a budget, not the way QuickBooks numbers it (set on Chart of Accounts). Δ% flags anything planned to grow more than 4% over the FY${p.base} budget. FY${p.base} projected is ${builder.prorated ? `the year-to-date actual extended to a full year (week ${builder.throughWeek} of 52)` : 'the full-year actual'}, unless a correction has been set.</p>`;
  return `${statusLine(statuses)}
    ${header(builder, p, now)}
    ${lede}
    ${councilDraftFailed ? '<p class="status status-error">Your own draft could not be read from Connect, so these are the shared plan’s figures and the Plan column cannot be edited right now.</p>' : ''}
    ${councilViewer ? `<p class="muted-line">${drafts ? `${drafts} Plan figure${drafts === 1 ? ' is' : 's are'} your own draft (marked “Your draft”). ` : ''}A council member’s Plan changes are kept as a private draft in Connect; the shared plan and other members’ drafts are not changed.</p>` : ''}
    ${summaryStrip(model, p)}
    ${canManageBudgetPlan ? tabPanel(builder, p, layout) : ''}
    <div class="panel panel-spaced list-panel bp-panel">
      <div class="bp-panel-head"><h2>Category by category</h2>${viewToggle}</div>
      ${toolbar(model, p, { pickFormId })}
      ${p.flatPick ? '<p class="muted-line">Tick the lines that will <b>not</b> grow. They stay where the plan puts them in the five-year outlook; every other line grows at the rates below. Then choose Done choosing growing lines.</p>' : ''}
      ${p.pick ? '<p class="muted-line">Tick the lines to leave out of the totals, the export and the printed sheet, then choose Done choosing rows.</p>' : ''}
      ${body}
    </div>
    ${outlook(model, p)}
    ${canManageBudgetPlan ? `<details class="panel panel-spaced edit-panel"><summary>Add a line that is not listed</summary>
      <form method="POST" action="/api/v1/connect-budget-plan-write" class="bb-form">
        <label class="field"><span>Category</span><input name="category" placeholder="e.g. Expenses:Utilities" required></label>
        <label class="field"><span>Income or expense</span><select name="classification"><option value="Expenses">Expense</option><option value="Income">Income</option></select></label>
        <input type="hidden" name="fiscal_year" value="${p.target}">
        <label class="field"><span>FY${p.target} plan ($)</span><input type="number" name="planned_amount" step="1" min="0" required></label>
        <label class="field"><span>Notes</span><input name="notes"></label>
        <button type="submit">Add line</button>
      </form></details>` : ''}`;
}

// ── Print sheet (print=1) ────────────────────────────────────────────────────────────────────
// Connect's printed budget: a summary page (tiles and a short narrative), then Revenue and
// Expenses on their own pages. "Plan for next year" prints Budget, Actual, Projected, Plan, Change
// and Δ%; "Just this year" prints the base year alone. DRAFT stamps a watermark on every page.
export function renderPlannerPrint({ builder: rawBuilder, params, councilDraft = null, layout = null, now = new Date() }) {
  const p = plannerYears(plannerParams(params, now), rawBuilder);
  const builder = councilDraft ? applyCouncilDraft(rawBuilder, councilDraft) : rawBuilder;
  const model = buildPlannerModel(builder, { layout, params: p });
  const showPlan = p.printMode !== 'thisyear';
  const cols = showPlan ? ['bud', 'act', 'used', 'proj', 'plan', 'change', 'delta'] : ['bud', 'act', 'used', 'proj'];
  const today = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const r = model.revenue;
  const x = model.expense;
  const pctNote = (bud, plan, suffix) => (bud ? `${pctText(((plan - bud) / Math.abs(bud)) * 100)} ${suffix}` : '');
  const tile = (label, value, sub) => `<div class="bp-print-tile"><small>${e(label)}</small><strong>${value}</strong><span>${e(sub)}</span></div>`;
  const basis = builder.prorated ? 'annualized from actuals' : 'full year actuals';
  const tiles = showPlan
    ? tile('Planned revenue', money(r.plan), pctNote(r.hasBud ? r.bud : 0, r.plan, `on FY${p.base} budget`))
      + tile('Planned expenses', money(x.plan), pctNote(x.hasBud ? x.bud : 0, x.plan, `on FY${p.base} budget`))
      + tile('Planned net', signed(r.plan - x.plan), 'revenue less expenses')
      + tile(`FY${p.base} net, projected`, signed(r.proj - x.proj), basis)
    : tile(`FY${p.base} budget revenue`, money(r.bud), '') + tile(`FY${p.base} budget expenses`, money(x.bud), '')
      + tile('Net so far', signed(r.act - x.act), `actual through ${today}`) + tile('Net, projected', signed(r.proj - x.proj), basis);
  const narrative = showPlan
    ? `The proposed FY${p.target} budget plans ${money(r.plan)} of revenue against ${money(x.plan)} of expenses, ${r.plan - x.plan >= 0 ? `a surplus of ${money(r.plan - x.plan)}` : `a deficit of ${money(x.plan - r.plan)}`}. Expenses are ${x.proj ? `${signed(x.plan - x.proj)} (${pctText(((x.plan - x.proj) / Math.abs(x.proj)) * 100)}) against` : 'compared with'} FY${p.base}’s projected ${money(x.proj)}; balancing the plan needs ${money(x.plan)} of revenue, ${x.plan - r.proj >= 0 ? `${money(x.plan - r.proj)} more` : `${money(r.proj - x.plan)} less`} than this year is projected to bring in.`
    : `Through ${today}, FY${p.base} has brought in ${money(r.act)} and spent ${money(x.act)}. At the current pace the year ends with ${money(r.proj)} of revenue and ${money(x.proj)} of expenses, ${r.proj - x.proj >= 0 ? `a surplus of ${money(r.proj - x.proj)}` : `a deficit of ${money(x.proj - r.proj)}`}${r.hasBud || x.hasBud ? `, against a budgeted net of ${signed(r.bud - x.bud)}` : ''}.`;
  const rows = plannerRows(model);
  const renderRow = (row) => {
    if (row.kind === 'leaf') return `<tr><td style="padding-left:${6 + row.depth * 12}px">${e(lineName(row.line, layout))}</td>${cols.map((k) => figureCell(k, row.fig, 'leaf')).join('')}</tr>`;
    if (row.kind === 'side') return '';
    if (row.kind === 'header') return `<tr class="bp-print-group"><td colspan="${cols.length + 1}" style="padding-left:${6 + row.depth * 12}px">${e(row.label)}</td></tr>`;
    return `<tr class="bp-print-total${row.kind === 'net' ? ' is-net' : ''}"><td>${e(row.label)}</td>${cols.map((k) => figureCell(k, row.fig, row.kind)).join('')}</tr>`;
  };
  const thead = `<thead><tr><th>Category</th>${cols.map((k) => `<th class="n">${e(COLUMN_LABELS[k](p).replace('Projected', 'Proj.'))}</th>`).join('')}</tr></thead>`;
  const watermark = p.draft ? '<div class="bp-watermark" aria-hidden="true">DRAFT</div>' : '';
  if (!rows.length) return `${watermark}<p>No budget lines for FY${p.base} or FY${p.target}.</p>`;
  const revenueRows = rows.filter((row) => row.side === 'revenue');
  const expenseRows = rows.filter((row) => row.side === 'expense');
  const net = rows.find((row) => row.kind === 'net');
  return `${watermark}
    <div class="bp-print-hd"><span>Timothy Lutheran Church · St. Louis</span><span>${showPlan ? `Proposed FY${p.target} Budget` : `FY${p.base} Budget`} · prepared ${e(today)}</span></div>
    <div class="print-eyebrow">Church Budget</div>
    <h2 class="bp-print-h1">Fiscal Year ${showPlan ? p.target : p.base} Budget</h2>
    <p class="bp-print-sub">${showPlan ? `Built on FY${p.base} (${builder.prorated ? `annualized from ${Math.round(builder.throughWeek)} weeks of actuals` : 'a full year of actuals'}) · independent of QuickBooks until committed` : `Actual through ${e(today)}${builder.prorated ? `, annualized from ${Math.round(builder.throughWeek)} weeks of actuals to project year end` : ''}`}</p>
    <div class="bp-print-tiles">${tiles}</div>
    <p>${narrative}</p>
    ${model.excludedCount ? `<p class="bp-print-foot">${model.excludedCount} line${model.excludedCount === 1 ? '' : 's'} left out of this sheet with Choose rows.</p>` : ''}
    <div class="print-newpage"><h3>Revenue</h3><p class="bp-print-foot">Grouped ${model.boardView ? 'the way the board reads a budget (Board view)' : 'in QuickBooks order'}, whole dollars.</p>
      <table class="bp-print-table">${thead}<tbody>${revenueRows.map(renderRow).join('')}</tbody></table></div>
    <div class="print-newpage"><h3>Expenses</h3>
      <table class="bp-print-table">${thead}<tbody>${expenseRows.map(renderRow).join('')}${net ? renderRow(net) : ''}</tbody></table></div>`;
}

export const BUDGET_BUILDER_STYLES = `
    .bb-banner { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:18px; margin-top:16px; padding:20px 24px; border-radius:10px; background:var(--navy); color:#fff; }
    .bb-banner small { display:block; color:#C9D2E2; font-size:13px; }
    .bb-banner strong { display:block; font-size:28px; margin:4px 0; font-family:Outfit, sans-serif; }
    .bb-banner span { color:#C9D2E2; font-size:12px; }
    .bp-strip .bp-gold { color:#E4C47A; } .bp-strip .bp-green { color:#9FD3B0; }
    .bp-strip-last { border-left:1px solid rgba(255,255,255,.18); padding-left:18px; }
    .bb-tabs { display:flex; gap:22px; border-bottom:1px solid #E3E7EE; margin:-6px 0 14px; }
    .bb-tabs a, .bb-tabs span { padding:10px 0; font-weight:600; font-size:14px; color:#4B5563; text-decoration:none; }
    .bb-tabs .is-on { color:var(--navy); border-bottom:2px solid #9A6B12; }
    .bb-form { display:flex; flex-wrap:wrap; gap:12px 16px; align-items:flex-end; }
    .bb-form button { margin-top:0; }
    .bb-table td, .bb-table th:not(:first-child) { text-align:right; white-space:nowrap; }
    .bb-table td:first-child { text-align:left; white-space:normal; min-width:180px; }
    .bb-table th, .bb-table td { padding-left:8px; padding-right:8px; }
    .bb-table td:first-child small { display:block; color:#6B7280; font-size:11px; }
    .bb-group td { font-weight:700; background:#F4F6F9; text-align:left !important; }
    .bb-total td { font-weight:700; border-top:1px solid #C3CDDD; background:#F7F8FA; }
    .bp-header td { font-weight:700; color:var(--navy); text-align:left !important; padding-top:12px; }
    .bb-subtotal td { font-weight:600; font-size:13px; color:#374151; border-top:1px dashed #D5DAE3; }
    .bb-view { display:flex; flex-wrap:wrap; gap:16px; margin:0; font-size:14px; }
    .bb-view .is-on { font-weight:700; color:var(--navy); }
    .coa-layout td { vertical-align:top; }
    .coa-side td { font-weight:700; background:#F4F6F9; }
    .coa-cat td, .coa-wrapper td { padding-top:12px; color:var(--navy); }
    .coa-sub td { padding-left:20px; color:#374151; }
    .coa-hidden td { opacity:.6; }
    .bb-result td { font-weight:700; background:#FBF5E6; border-top:2px solid var(--navy); }
    .bp-head { display:flex; justify-content:space-between; align-items:flex-end; gap:16px; flex-wrap:wrap; margin-top:8px; }
    .bp-head h2 { margin:0; font-size:26px; }
    .bp-years { display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap; }
    .bp-years button { margin:0; }
    .bp-panel-head { display:flex; justify-content:space-between; align-items:flex-end; gap:12px; flex-wrap:wrap; }
    .bp-panel-head h2 { margin:0; }
    .bp-toolbar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; border-top:1px solid #E3E7EE; border-bottom:1px solid #E3E7EE; padding:9px 0; margin:10px 0 6px; font-size:13px; }
    .bp-label { font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:#6B7280; }
    .bp-chips { margin:0; }
    .bp-chip-off { text-decoration:line-through; color:#9CA3AF; }
    .bp-spacer { flex:1; }
    .bp-button { padding:6px 12px; font-size:13px; }
    .bp-pick, .bp-print { display:inline-flex; gap:10px; align-items:center; flex-wrap:wrap; margin:0; }
    .bp-pick button, .bp-print button { margin:0; }
    .bp-print label { display:inline-flex; gap:4px; align-items:center; font-weight:600; color:#4B5563; }
    .bp-name-input { width:100%; max-width:420px; font:inherit; font-weight:700; color:inherit; background:transparent; border:1px solid transparent; border-radius:6px; padding:2px 6px; margin-left:-7px; }
    .bp-name-input:hover { border-color:#D5DBE5; background:#fff; }
    .bp-name-input:focus { border-color:#B98B2E; background:#fff; outline:none; }
    .bp-heading-input { font-size:13px; }
    .bp-table .bp-name small { display:block; color:#6B7280; font-size:11px; }
    .bp-table .bp-name input[type=checkbox] { margin-right:8px; vertical-align:middle; }
    .bp-excluded td { opacity:.45; }
    .bp-input { width:100px; text-align:right; padding:4px 6px; }
    .bp-input.is-corrected { border-color:#C9962E; }
    .bp-input.is-draft { border-color:#2E7EA6; background:#F2F8FC; }
    .bp-up { color:#B5412F; font-weight:600; } .bp-down { color:#2F7D5B; font-weight:600; } .bp-flat { color:#4B5563; font-weight:600; }
    .bp-up-net { color:#2F7D5B; } .bp-down-net { color:#B5412F; }
    .bp-remove { margin-left:8px; font-size:11px; }
    .bp-default-submit { position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden; }
    .bp-actions { display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-top:12px; }
    .bp-actions button { margin:0; }
    .bp-outlook-body { display:grid; grid-template-columns:minmax(0,1.3fr) minmax(0,1fr); gap:18px; align-items:start; }
    @media(max-width:900px){ .bp-outlook-body { grid-template-columns:1fr; } }
    .bp-outlook-chart { display:block; height:auto; }
`;
