// Church Report › This year in detail. What Connect's legacy Church Report tab shows beyond the
// account ledger, from connect.finance-church-year.v1: where each expense category sits against
// budget (click one for its line items), this year against last year with the year-end projection,
// the supplies account by month, and Giving by fund. No script: the drill-downs are <details>.
import { escapeHtml, formatCents, formatSignedCents, renderKpiCards, renderSectionHeading } from './render-helpers.js';
import { csvNum, csvText } from './payroll-report-render.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// finExpensePaceStatus: a category is "off pace" once it is more than $1,500 from where the
// calendar says it should be.
const PACE_THRESHOLD_CENTS = 150000;

export function paceStatus(cat, elapsed) {
  if (!(cat.budgetCents > 0)) return { key: 'none', label: 'No budget', diffCents: 0 };
  const diffCents = Math.round(cat.actualCents - cat.budgetCents * elapsed);
  if (cat.actualCents > cat.budgetCents) return { key: 'over', label: 'Over budget', diffCents };
  if (diffCents > PACE_THRESHOLD_CENTS) return { key: 'warn', label: `${formatSignedCents(diffCents)} over pace`, diffCents };
  if (diffCents < -PACE_THRESHOLD_CENTS) return { key: 'under', label: `${formatSignedCents(diffCents)} under pace`, diffCents };
  return { key: 'ok', label: 'On pace', diffCents };
}

// Largest overspend first, so the lines that need a decision lead.
export function rankedExpenseCategories(categories, elapsed) {
  return (categories || []).map((cat) => ({ cat, status: paceStatus(cat, elapsed) }))
    .sort((a, b) => b.status.diffCents - a.status.diffCents || a.cat.label.localeCompare(b.cat.label));
}

function moneyOf(cents, budget) {
  return `${formatCents(cents)}${budget > 0 ? ` of ${formatCents(budget)}` : ''}`;
}

function renderPace(report) {
  const e = escapeHtml;
  const ranked = rankedExpenseCategories(report.expenseCategories, report.elapsedFraction);
  if (!ranked.length) return '<p class="muted-line">No expense categories yet.</p>';
  const pct = Math.round(report.elapsedFraction * 100);
  const rows = ranked.map(({ cat, status }) => {
    const spent = cat.budgetCents > 0 ? Math.min(100, (cat.actualCents / cat.budgetCents) * 100) : 0;
    const items = cat.children.length
      ? `<ul class="cy-items">${cat.children.map((c) => `<li><span>${e(c.label)}</span><span>${e(moneyOf(c.actualCents, c.budgetCents))}</span></li>`).join('')}</ul>`
      : '<p class="muted-line">No separate line items.</p>';
    return `<details class="cy-pace cy-${status.key}"><summary><span class="cy-name">${e(cat.label)}</span><span class="cy-meta">${e(moneyOf(cat.actualCents, cat.budgetCents))}</span><span class="cy-status">${e(status.label)}</span></summary>
      ${cat.budgetCents > 0 ? `<div class="cy-track" role="img" aria-label="${e(cat.label)}: ${Math.round(spent)}% of budget spent, ${pct}% of the year gone"><span class="cy-fill" style="width:${spent.toFixed(1)}%"></span><span class="cy-mark" style="left:${pct}%"></span></div>` : ''}
      ${items}</details>`;
  }).join('');
  return `<p>Sorted by how far each category is from where the calendar says it should be. The marker shows ${pct}% of the year gone; the bar shows the share of budget spent. Click a category for its line items.</p>${rows}`;
}

function seriesRow(label, s, hasPrior) {
  const dash = '<td class="num tone-muted">—</td>';
  const prior = (cents) => (hasPrior ? `<td class="num tone-muted">${formatSignedCents(cents)}</td>` : dash);
  return `<tr><td>${escapeHtml(label)}</td><td class="num">${formatSignedCents(s.currentYtdCents)}</td>${prior(s.priorYtdCents)}${prior(s.priorFullYearCents)}<td class="num"><b>${formatSignedCents(s.projectedFullYearCents)}</b></td></tr>`;
}

function renderYoy(report) {
  const yoy = report.yoy;
  if (!yoy.available) {
    return '<p class="status status-pending">This year against last year, and a year-end projection, are not available yet. They need the church ledger for this year (and last year’s month-by-month figures for a seasonal projection) to be loaded under Data &amp; Imports.</p>';
  }
  const hasPrior = yoy.income.method !== 'straight-line-annual';
  const note = hasPrior
    ? 'The projection assumes this year follows last year’s month-to-month pattern. It is an estimate for planning, not a guarantee; one large gift or expense can move it a lot.'
    : 'Last year’s month-by-month figures are not loaded, so there is no same-point comparison. The projection simply carries this year’s pace through December.';
  return `<div class="table-wrap"><table><thead><tr><th>Through ${escapeHtml(MONTHS[yoy.throughMonth - 1])}</th><th class="num">This year so far</th><th class="num">Last year, same point</th><th class="num">Last year, full year</th><th class="num">Projected full year</th></tr></thead><tbody>
    ${seriesRow('Revenue', yoy.income, hasPrior)}${seriesRow('Expenses', yoy.expenses, hasPrior)}${seriesRow('Net income', yoy.net, hasPrior)}</tbody></table></div><p><small>${escapeHtml(note)}</small></p>`;
}

function renderSupplies(report) {
  const s = report.supplies;
  if (!s.monthly.some((m) => m.currentCents || m.priorCents)) {
    return '<p class="muted-line">No supplies spending by month yet. This needs the church ledger loaded month by month under Data &amp; Imports.</p>';
  }
  const top = Math.max(1, ...s.monthly.map((m) => Math.max(m.currentCents, m.priorCents)));
  const bar = (cents, cls) => `<span class="cy-bar ${cls}" style="width:${Math.max(0, (cents / top) * 100).toFixed(1)}%"></span>`;
  const rows = s.monthly.map((m) => `<tr><td>${escapeHtml(MONTHS[m.month - 1].slice(0, 3))}</td><td class="num">${formatCents(m.currentCents)}</td><td class="num tone-muted">${formatCents(m.priorCents)}</td><td class="cy-bars" aria-hidden="true">${bar(m.currentCents, 'cur')}${bar(m.priorCents, 'prior')}</td></tr>`).join('');
  return `<div class="table-wrap"><table><thead><tr><th>Month</th><th class="num">This year</th><th class="num">Last year</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    <p><small>So far this year: ${formatCents(s.currentYtdCents)} against ${formatCents(s.priorYtdCents)} last year. Any QuickBooks account with “Supplies” in its name; it is still counted under Other Expenses in the totals, shown here for visibility.</small></p>`;
}

// groupRowsByFundCode: funds sharing a leading account number read as one line ("40085 Lent" and
// "40085 General Fund" are the General Fund family); a fund with no code stays its own line.
export function groupFundsByCode(rows) {
  const groups = new Map();
  rows.forEach((r, i) => {
    const m = /^(\d+)\s/.exec(r.fundName);
    const key = m ? `c${m[1]}` : `u${i}`;
    if (!groups.has(key)) groups.set(key, { rows: [], cents: 0 });
    const g = groups.get(key);
    g.rows.push(r); g.cents += r.cents;
  });
  return [...groups.values()].map((g) => ({
    label: [...g.rows].sort((a, b) => b.cents - a.cents)[0].fundName, cents: g.cents, rows: g.rows,
  }));
}

function renderGivingByFund(report) {
  const e = escapeHtml;
  if (!report.givingByFund.length) return '<p class="muted-line">No giving recorded in Connect for this year.</p>';
  const rows = groupFundsByCode(report.givingByFund).map((g) => (g.rows.length < 2
    ? `<tr><td>${e(g.label)}</td><td class="num">${formatCents(g.cents)}</td></tr>`
    : `<tr><td colspan="2"><details class="cy-fund"><summary><span>${e(g.label)} <small class="tone-muted">(${g.rows.length} funds)</small></span><span class="num">${formatCents(g.cents)}</span></summary>
        <ul class="cy-items">${g.rows.map((f) => `<li><span>${e(f.fundName)}</span><span>${formatCents(f.cents)}</span></li>`).join('')}</ul></details></td></tr>`)).join('');
  return `<div class="table-wrap"><table><thead><tr><th>Fund</th><th class="num">Given this year</th></tr></thead><tbody>${rows}
    <tr><td><b>All giving</b></td><td class="num"><b>${formatCents(report.givingCents)}</b></td></tr></tbody></table></div>
    <p><small>The reference figure from Connect’s giving records; the ledger above counts what reached the bank.</small></p>`;
}

export function renderChurchYearDetail(result) {
  const e = escapeHtml;
  const head = (badge) => renderSectionHeading({ eyebrow: 'Church Report', heading: `This year in detail${result?.ok ? ` · FY${result.report.fiscalYear}` : ''}`, badge });
  if (!result || !result.ok) {
    return `<section class="report" aria-label="Church Report this year in detail">${head('Connect unavailable')}
      <p class="status status-error">These figures could not be read from Connect just now${result?.reason ? ` (${e(result.reason.replace(/_/g, ' '))})` : ''}. Nothing is shown rather than a blank or zero figure. Reload in a moment.</p></section>`;
  }
  const report = result.report;
  if (!report.hasLedger) {
    return `<section class="report" aria-label="Church Report this year in detail">${head('No ledger yet')}
      <p class="status status-pending">There is no church ledger for FY${report.fiscalYear} yet. Connect QuickBooks or import a Budget vs. Actuals file under Data &amp; Imports.</p></section>`;
  }
  const t = report.totals;
  const csv = '/?section=church&amp;page=year-detail&amp;format=csv';
  return `<section class="report" aria-label="Church Report this year in detail">
    ${head(report.asOfDate ? `As of ${e(report.asOfDate)}` : 'Live from Connect')}
    ${renderKpiCards([
    { label: 'Total revenue', value: formatCents(t.income.actualCents), hint: report.hasBudgetData ? `Budget ${formatCents(t.income.budgetCents)}` : '' },
    { label: 'Total expenses', value: formatCents(t.expenses.actualCents), hint: report.hasBudgetData ? `Budget ${formatCents(t.expenses.budgetCents)}` : '' },
    { label: 'Net income', value: formatSignedCents(t.net.actualCents), hint: report.hasBudgetData ? `Budget ${formatSignedCents(t.net.budgetCents)}` : '' },
  ])}
    <p><a class="button-outline" href="${csv}">Download CSV</a></p>
    <h3>Where expenses sit against budget</h3>${renderPace(report)}
    <h3>This year vs. last year</h3>${renderYoy(report)}
    <h3>Supplies by month</h3>${renderSupplies(report)}
    <h3>Giving by fund</h3>${renderGivingByFund(report)}
  </section>`;
}

// Everything on the page as one spreadsheet, formula-guarded by the shared payroll CSV helpers.
export function buildChurchYearCsv(report) {
  const d = (cents) => csvNum(((Number(cents) || 0) / 100).toFixed(2));
  const lines = [];
  const add = (...cells) => lines.push(cells.join(','));
  add(csvText(`Church Report FY${report.fiscalYear}`), csvText(report.asOfDate ? `as of ${report.asOfDate}` : ''));
  add();
  add(csvText('Totals'), csvText('Actual'), csvText('Budget'));
  add(csvText('Revenue'), d(report.totals.income.actualCents), d(report.totals.income.budgetCents));
  add(csvText('Expenses'), d(report.totals.expenses.actualCents), d(report.totals.expenses.budgetCents));
  add(csvText('Net income'), d(report.totals.net.actualCents), d(report.totals.net.budgetCents));
  add();
  add(csvText('Expense category'), csvText('Actual'), csvText('Budget'), csvText('Pace'));
  for (const { cat, status } of rankedExpenseCategories(report.expenseCategories, report.elapsedFraction)) {
    add(csvText(cat.label), d(cat.actualCents), d(cat.budgetCents), csvText(status.label));
    for (const c of cat.children) add(csvText(`  ${c.label}`), d(c.actualCents), d(c.budgetCents), csvText(''));
  }
  add();
  if (report.yoy.available) {
    add(csvText(`Through ${MONTHS[report.yoy.throughMonth - 1]}`), csvText('This year so far'), csvText('Last year, same point'), csvText('Last year, full year'), csvText('Projected full year'));
    for (const [label, s] of [['Revenue', report.yoy.income], ['Expenses', report.yoy.expenses], ['Net income', report.yoy.net]]) {
      add(csvText(label), d(s.currentYtdCents), d(s.priorYtdCents), d(s.priorFullYearCents), d(s.projectedFullYearCents));
    }
    add();
  }
  if (report.supplies.monthly.some((m) => m.currentCents || m.priorCents)) {
    add(csvText('Supplies by month'), csvText('This year'), csvText('Last year'));
    for (const m of report.supplies.monthly) add(csvText(MONTHS[m.month - 1]), d(m.currentCents), d(m.priorCents));
    add();
  }
  add(csvText('Giving by fund (Connect records)'), csvText('Given'));
  for (const g of groupFundsByCode(report.givingByFund)) {
    add(csvText(g.label), d(g.cents));
    if (g.rows.length > 1) for (const f of g.rows) add(csvText(`    ${f.fundName}`), d(f.cents));
  }
  add(csvText('All giving'), d(report.givingCents));
  return `${lines.join('\r\n')}\r\n`;
}

export const CHURCH_YEAR_STYLES = `
    .cy-pace { border-bottom:1px solid #E5E7EB; padding:8px 0; }
    .cy-pace summary { display:flex; gap:12px; align-items:baseline; cursor:pointer; flex-wrap:wrap; }
    .cy-name { font-weight:600; flex:1 1 180px; }
    .cy-meta { color:#6B7280; font-size:13px; }
    .cy-status { font-weight:700; font-size:13px; white-space:nowrap; }
    .cy-over .cy-status { color:#B42318; }
    .cy-warn .cy-status { color:#9A6B00; }
    .cy-under .cy-status { color:#2F7D4F; }
    .cy-ok .cy-status { color:#1F6F8B; }
    .cy-none .cy-status { color:#6B7280; }
    .cy-track { position:relative; height:8px; background:#E5E7EB; border-radius:4px; margin:8px 0; }
    .cy-fill { display:block; height:100%; background:#1F6F8B; border-radius:4px; }
    .cy-over .cy-fill { background:#B42318; }
    .cy-warn .cy-fill { background:#C9973A; }
    .cy-under .cy-fill { background:#2F7D4F; }
    .cy-mark { position:absolute; top:-3px; width:2px; height:14px; background:#13294B; }
    .cy-items { list-style:none; margin:6px 0 0; padding:0; font-size:13px; }
    .cy-items li { display:flex; justify-content:space-between; gap:12px; padding:2px 0; color:#4B5563; }
    .cy-fund summary { display:flex; justify-content:space-between; cursor:pointer; }
    .cy-bars { width:40%; }
    .cy-bar { display:block; height:6px; border-radius:3px; margin:2px 0; }
    .cy-bar.cur { background:#2E7EA6; }
    .cy-bar.prior { background:#C9973A; }
`;
