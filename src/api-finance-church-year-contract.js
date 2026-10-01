// ── connect.finance-church-year.v1 — the Church Report's this-year detail ───────────────────────
// Finance's Church Report › This year in detail shows what Connect's legacy Church Report tab
// shows beyond the account ledger: where each expense category sits against budget (with its line
// items), this year against last year with the year-end projection, the supplies account by month,
// and Giving by fund. The figures come from readChurchThisYear, the exact payload the legacy tab
// fetches from finance/church/this-year; the expense categories are the same tree the tab builds
// in the browser (finBuildTreeFromFlatRows), ported here so Finance renders finished figures.
//
// Served by Connect, never from Finance's own database: Giving by fund reads Giving's monthly fund
// totals, which stay in Connect. Aggregate only (fund names and account labels), so council-safe.
import { json } from './auth.js';
import { validateFinanceChurchYearV1 } from '../contracts/validators/finance-church-year-consumer.js';
import { readChurchThisYear } from './api-finance.js';
import { elapsedYearFraction } from './api-finance-health-contract.js';

const CONTRACT = 'connect.finance-church-year.v1';

// finBuildTreeFromFlatRows: each account row carries only its own amount, so a node's total is its
// own figure plus every descendant's. An account's parent is the nearest ancestor path that has a
// stored row (a pure grouping label may have none).
export function buildAccountTree(rows) {
  const nodeByPath = new Map();
  const roots = [];
  for (const r of rows || []) {
    nodeByPath.set(r.category_path, {
      path: r.category_path, label: r.account_name, classification: r.classification,
      ownActual: r.own_actual_cents || 0, ownBudget: r.own_budget_cents || 0, children: [],
      totalActual: 0, totalBudget: 0,
    });
  }
  for (const r of rows || []) {
    const node = nodeByPath.get(r.category_path);
    const segments = String(r.category_path).split(':');
    let parent = null;
    for (let i = segments.length - 1; i > 0 && !parent; i -= 1) parent = nodeByPath.get(segments.slice(0, i).join(':')) || null;
    if (parent) parent.children.push(node); else roots.push(node);
  }
  const total = (node) => {
    node.totalActual = node.ownActual;
    node.totalBudget = node.ownBudget;
    for (const c of node.children) { total(c); node.totalActual += c.totalActual; node.totalBudget += c.totalBudget; }
  };
  roots.forEach(total);
  return roots;
}

// The Expenses section's direct categories, each with its direct line items. A line or category
// with no actual and no budget carries nothing, so it is left out (the legacy tab prunes the same).
export function buildExpenseCategories(entries) {
  const roots = buildAccountTree((entries || []).filter((e) => e.classification === 'Expenses'));
  const root = roots.find((n) => n.path === 'Expenses');
  const categories = root ? root.children : roots;
  return categories
    .filter((c) => c.totalActual || c.totalBudget)
    .map((c) => ({
      path: c.path, label: c.label, actualCents: c.totalActual, budgetCents: Math.max(0, c.totalBudget),
      children: c.children.filter((k) => k.totalActual || k.totalBudget)
        .map((k) => ({ label: k.label, actualCents: k.totalActual, budgetCents: Math.max(0, k.totalBudget) })),
    }));
}

function pair(summary, key) {
  const t = (summary.classificationTotals || {})[key] || { actualCents: 0, budgetCents: 0 };
  return { actualCents: t.actualCents || 0, budgetCents: Math.max(0, t.budgetCents || 0) };
}

// finChurchAsOfDate: the most recent sync or import stamp on any row, as a plain date.
function asOfDate(entries) {
  let latest = '';
  for (const e of entries || []) if (e.synced_at && e.synced_at > latest) latest = e.synced_at;
  const parsed = latest ? new Date(latest) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : '';
}

const seriesOf = (s) => ({
  currentYtdCents: s.currentYtdCents || 0, priorYtdCents: s.priorYtdCents || 0,
  priorFullYearCents: s.priorFullYearCents || 0, projectedFullYearCents: s.projectedFullYearCents || 0, method: s.method,
});

export async function buildFinanceChurchYearV1(db, { fiscalYear, now = new Date() }) {
  const d = await readChurchThisYear(db, fiscalYear);
  const entries = Array.isArray(d.entries) ? d.entries : [];
  const net = d.netIncome || { actualCents: 0, budgetCents: 0 };
  const yoy = d.yoy && d.yoy.available
    ? { available: true, seasonal: !!d.yoy.seasonal, throughMonth: d.yoy.throughMonth, income: seriesOf(d.yoy.income), expenses: seriesOf(d.yoy.expenses), net: seriesOf(d.yoy.net) }
    : { available: false };
  const supplies = d.supplies || {};
  return {
    contract: CONTRACT,
    dataClassification: 'aggregate',
    sourceProduct: 'connect',
    consumerProduct: 'finance',
    currency: 'USD',
    fiscalYear,
    generatedAt: now.toISOString(),
    hasLedger: entries.length > 0,
    hasBudgetData: !!d.hasBudgetData,
    asOfDate: asOfDate(entries),
    elapsedFraction: elapsedYearFraction(fiscalYear, now),
    totals: { income: pair(d, 'Income'), expenses: pair(d, 'Expenses'), net: { actualCents: net.actualCents || 0, budgetCents: net.budgetCents || 0 } },
    expenseCategories: buildExpenseCategories(entries),
    yoy,
    supplies: {
      monthly: (supplies.monthly || []).map((m) => ({ month: m.month, currentCents: m.currentCents || 0, priorCents: m.priorCents || 0 })),
      currentYtdCents: supplies.currentYtdCents || 0,
      priorYtdCents: supplies.priorYtdCents || 0,
    },
    givingCents: d.givingCents || 0,
    givingByFund: (d.givingByFund || []).map((f) => ({ fundName: String(f.fundName || ''), cents: f.cents || 0 })),
  };
}

export async function respondWithFinanceChurchYearV1(url, db) {
  const fiscalYearStr = url.searchParams.get('fiscal_year');
  if (!/^\d{4}$/.test(String(fiscalYearStr || ''))) return json({ error: 'fiscal_year is required as a 4-digit year' }, 400);
  const payload = await buildFinanceChurchYearV1(db, { fiscalYear: Number(fiscalYearStr), now: new Date() });
  const validation = validateFinanceChurchYearV1(payload);
  if (!validation.ok) return json({ error: 'Internal: assembled church year failed contract validation', details: validation.errors }, 500);
  return json(payload);
}
