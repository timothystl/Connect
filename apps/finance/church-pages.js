import { buildChurchReportView, buildLiveChurchReportView } from './church-report-service.js';
import { escapeHtml, formatCents, formatSignedCents, renderKpiCards, renderSectionHeading, renderTable } from './render-helpers.js';
import { accountDisplayName, buildBoardSections, isHiddenAccount } from './board-layout.js';

// Admin-only correction of one account's real, posted actual figure -- relayed live to Connect's
// finance_church_entries table (see finance-church-actual-override-v1 in
// src/api-contracts-service.js), never stored in Finance's own database. Shown only on Income &
// expense detail, the one page with the per-account rows a correction targets; Overview/Multi-year
// trend/Budget vs actual stay read-only summaries of the same underlying data. Leaving Amount blank
// clears a prior correction back to whatever the last real sync/import posted for that account,
// matching the legacy route's own delete-on-blank behavior.
function renderChurchActualOverrideForm(fiscalYear, entryStatus, entryMessage) {
  return `<section aria-label="Correct a Church Report actual figure">
    ${renderSectionHeading({ eyebrow: 'Church Report', heading: 'Correct an actual figure', badge: 'Relayed live to Connect' })}
    ${entryStatus === 'ok' ? '<p class="status">Saved in Connect.</p>' : ''}
    ${entryStatus === 'error' ? `<p class="status status-error">Not saved: ${escapeHtml(entryMessage || 'unknown error')}</p>` : ''}
    <form method="POST" action="/api/v1/connect-church-actual-override">
      <div class="grid form-grid">
        <div class="field"><label for="cao-year">Fiscal year</label><input id="cao-year" type="number" name="year" min="2000" max="2100" value="${escapeHtml(String(fiscalYear))}" required></div>
        <div class="field"><label for="cao-category">Account (category path)</label><input id="cao-category" type="text" name="category" placeholder="e.g. Expenses:Utilities" required></div>
        <div class="field"><label for="cao-classification">Classification</label><select id="cao-classification" name="classification"><option value="Expenses" selected>Expenses</option><option value="Income">Income</option><option value="Cost of Goods Sold">Cost of Goods Sold</option><option value="Other Income">Other Income</option><option value="Other Expenses">Other Expenses</option></select></div>
        <div class="field"><label for="cao-name">Account name</label><input id="cao-name" type="text" name="account_name" placeholder="optional -- defaults from the category path"></div>
        <div class="field"><label for="cao-amount">Corrected actual ($, blank clears a prior correction)</label><input id="cao-amount" type="number" name="amount" step="0.01"></div>
      </div>
      <button type="submit">Save correction</button>
    </form>
    <p><small>This writes directly into Connect's own <code>finance_church_entries</code> table as a manual correction that takes precedence over whatever the last QuickBooks sync or CSV import posted for this exact account -- every reader (Church Report, Financial Health, Planning) picks it up, and a later re-sync/re-import does not erase it. Only Connect's own admin role may save; Connect independently re-verifies your identity and role for every request.</small></p>
  </section>`;
}

// Admin-only Budget vs. Actuals .xlsx import -- relayed live to Connect's real
// finance_church_entries table (see finance-church-budget-xlsx-import-v1 in
// src/api-contracts-service.js), never stored in Finance's own database. Shown only on Budget vs
// actual, the page that already renders the actual-vs-budget comparison a fresh import would
// replace. A real `<input type="file">` upload (multipart/form-data), unlike every other write
// form in this app -- shell.js reads the uploaded bytes, base64-encodes them, and relays a single
// request that parses the sheet without writing, followed by a separate checkbox review and
// commit request. The fiscal year is read from the workbook itself, exactly as legacy
// determines it, so there is no fiscal-year field to fill in.
function renderChurchBudgetXlsxImportForm(entryStatus, entryMessage) {
  return `<section aria-label="Import Budget vs. Actuals from Excel">
    ${renderSectionHeading({ eyebrow: 'Church Report', heading: 'Import Budget vs. Actuals (.xlsx)', badge: 'Relayed live to Connect' })}
    ${entryStatus === 'ok' ? '<p class="status">Imported into Connect.</p>' : ''}
    ${entryStatus === 'error' ? `<p class="status status-error">Not imported: ${escapeHtml(entryMessage || 'unknown error')}</p>` : ''}
    <form method="POST" action="/api/v1/connect-church-budget-xlsx-preview" enctype="multipart/form-data">
      <div class="field"><label for="cbx-file">QuickBooks "Budget vs. Actuals" export (.xlsx, max 15 MB)</label><input id="cbx-file" type="file" name="file" accept=".xlsx" required></div>
      <button type="submit">Review file</button>
    </form>
    <p><small>First parses the workbook without changing data. After reviewing and selecting rows, the confirmed rows write directly into Connect's own <code>finance_church_entries</code> table, tagged <code>source='import'</code> -- the same table and source the legacy in-Connect Excel import writes, replacing prior imported rows for that fiscal year. The fiscal year comes from the workbook's own date-range line. Only Connect's own admin role may import; Connect independently re-verifies identity and role for both steps.</small></p>
  </section>`;
}

// "Statement of Activity" multi-year .xlsx import -- relayed live to Connect's real
// finance_church_entries table (source='import_activity'), never stored in Finance's own
// database. Shown only on Multi-year trend, the page whose underlying data (every fiscal year on
// file, resolveChurchYearPrecedence's 'import_activity' tier) this import directly feeds -- see
// importChurchActivityXlsx's header comment in src/api-finance.js. Unlike
// renderChurchBudgetXlsxImportForm above, this form is NOT admin-only: the legacy
// finance/church/activity-import(-preview) route carries no isAdmin check of its own, only the
// same blanket "finance edit" ACCESS_GATE every finance/church/* route not explicitly listed in
// financeSegItems falls through to (verified directly against src/api-chms.js's source) --
// Connect's own contract handler re-derives that real permission-matrix check independently of
// what this form shows or hides (UI hiding is never authorization).
function renderChurchActivityXlsxImportForm(entryStatus, entryMessage) {
  return `<section aria-label="Import Statement of Activity from Excel">
    ${renderSectionHeading({ eyebrow: 'Church Report', heading: 'Import Statement of Activity, multi-year (.xlsx)', badge: 'Relayed live to Connect' })}
    ${entryStatus === 'ok' ? '<p class="status">Imported into Connect.</p>' : ''}
    ${entryStatus === 'error' ? `<p class="status status-error">Not imported: ${escapeHtml(entryMessage || 'unknown error')}</p>` : ''}
    <form method="POST" action="/api/v1/connect-church-activity-xlsx-preview" enctype="multipart/form-data">
      <div class="field"><label for="cax-file">QuickBooks "Statement of Activity" multi-year export (.xlsx, max 15 MB)</label><input id="cax-file" type="file" name="file" accept=".xlsx" required></div>
      <button type="submit">Review file</button>
    </form>
    <p><small>Parses without changing data, then lets you select the fiscal-year account rows to commit through Connect's existing permission-checked importer. A separately uploaded "Budget by Year" file combines with this one into complete rows.</small></p>
  </section>`;
}

// "Budget by Year" multi-year .xlsx import -- same shape and same non-admin-only reasoning as
// renderChurchActivityXlsxImportForm above, for the budget-only counterpart file (see
// importChurchBudgetMultiYearXlsx's header comment in src/api-finance.js).
function renderChurchBudgetMultiYearXlsxImportForm(entryStatus, entryMessage) {
  return `<section aria-label="Import Budget by Year from Excel">
    ${renderSectionHeading({ eyebrow: 'Church Report', heading: 'Import Budget by Year, multi-year (.xlsx)', badge: 'Relayed live to Connect' })}
    ${entryStatus === 'ok' ? '<p class="status">Imported into Connect.</p>' : ''}
    ${entryStatus === 'error' ? `<p class="status status-error">Not imported: ${escapeHtml(entryMessage || 'unknown error')}</p>` : ''}
    <form method="POST" action="/api/v1/connect-church-budget-multi-year-xlsx-preview" enctype="multipart/form-data">
      <div class="field"><label for="cbmy-file">QuickBooks "Budget by Year" multi-year export (.xlsx, max 15 MB)</label><input id="cbmy-file" type="file" name="file" accept=".xlsx" required></div>
      <button type="submit">Review file</button>
    </form>
    <p><small>Parses without changing data, then lets you select the fiscal-year budget rows to commit through Connect's existing permission-checked importer. Selected budget values combine with Statement of Activity values rather than overwriting them.</small></p>
  </section>`;
}

function renderChurchMonthlyXlsxImportForm(entryStatus, entryMessage) {
  return `<section aria-label="Import monthly Profit and Loss from Excel">
    ${renderSectionHeading({ eyebrow: 'Church Report', heading: 'Import Profit and Loss by Month (.xlsx)', badge: 'Relayed live to Connect' })}
    ${entryStatus === 'ok' ? '<p class="status">Imported into Connect.</p>' : ''}
    ${entryStatus === 'error' ? `<p class="status status-error">Not imported: ${escapeHtml(entryMessage || 'unknown error')}</p>` : ''}
    <form method="POST" action="/api/v1/connect-church-monthly-xlsx-preview" enctype="multipart/form-data">
      <div class="field"><label for="cmx-file">QuickBooks "Profit and Loss by Month" export (.xlsx, max 15 MB)</label><input id="cmx-file" type="file" name="file" accept=".xlsx" required></div>
      <button type="submit">Review file</button>
    </form>
    <p><small>Parses without changing data, then lets you select the monthly account rows to commit through Connect's existing permission-checked importer.</small></p>
  </section>`;
}

export function renderChurchRows(rows) {
  return rows.map((row) => {
    const variance = row.classification === 'Income'
      ? row.own_actual_cents - row.own_budget_cents
      : row.own_budget_cents - row.own_actual_cents;
    return `<tr><td>${escapeHtml(row.classification)}</td><td>${escapeHtml(row.account_name)}</td><td>${formatCents(row.own_actual_cents)}</td><td>${formatCents(row.own_budget_cents)}</td><td>${formatSignedCents(variance)}</td></tr>`;
  }).join('');
}

// Live rows carry the contract's own camelCase shape (see church-report-service.js's
// buildLiveChurchReportView) and a genuinely nullable budgetCents -- real accounts commonly have an
// actual with no budget entered at all (confirmed 2026-09-14), unlike the synthetic fixture, which
// always has both. A null budget renders '--' rather than a fabricated $0 comparison.
export function renderLiveChurchRows(rows) {
  return rows.map((row) => {
    const hasBudget = row.budgetCents !== null;
    const variance = !hasBudget ? null : (row.classification === 'Income'
      ? row.actualCents - row.budgetCents
      : row.budgetCents - row.actualCents);
    return `<tr><td>${escapeHtml(row.classification)}</td><td>${escapeHtml(row.accountName)}</td><td>${formatCents(row.actualCents)}</td><td>${hasBudget ? formatCents(row.budgetCents) : '—'}</td><td>${variance === null ? '—' : formatSignedCents(variance)}</td></tr>`;
  }).join('');
}

// Budget vs actual laid out the way the Budget planner's Board view is: the Chart of Accounts
// board categories under their saved headings, Unrestricted and Restricted gifts inside the Donor
// Income wrapper, each account under its display rename, a total for every group and side, and
// the net result. A line with no actual and no budget is left out; a line hidden in Chart of
// Accounts is left out too while it has no money (shown again with `showHidden`). Every row that
// carries money is kept, so the totals match the report's own.
export function buildBudgetActualBoard(accounts, layout, { showHidden = false } = {}) {
  const quiet = (a) => !a.actualCents && !a.budgetCents;
  const lines = accounts.filter((a) => a.classification === 'Income' || a.classification === 'Expenses');
  const hidden = lines.filter((a) => quiet(a) && isHiddenAccount(layout, a.categoryPath));
  const shown = lines.filter((a) => !quiet(a) || (showHidden && isHiddenAccount(layout, a.categoryPath)));
  const sections = buildBoardSections(shown, layout, (a) => ({ path: a.categoryPath, name: a.accountName, isRevenue: a.classification === 'Income' }));
  const sum = (items) => items.reduce((t, a) => ({
    actualCents: t.actualCents + (a.actualCents || 0),
    budgetCents: t.budgetCents + (a.budgetCents || 0),
    hasBudget: t.hasBudget || a.budgetCents !== null,
  }), { actualCents: 0, budgetCents: 0, hasBudget: false });
  const rows = [];
  const group = (g, depth) => {
    rows.push({ kind: 'header', label: g.label, depth });
    for (const a of g.items) {
      rows.push({
        kind: 'leaf', depth: depth + 1, isRevenue: g.isRevenue, label: accountDisplayName(layout, a.categoryPath, a.accountName),
        qbName: a.accountName, hidden: isHiddenAccount(layout, a.categoryPath),
        actualCents: a.actualCents || 0, budgetCents: a.budgetCents, hasBudget: a.budgetCents !== null,
      });
    }
    rows.push({ kind: 'total', label: `Total ${g.label}`, depth, isRevenue: g.isRevenue, ...sum(g.items) });
    return g.items;
  };
  const side = (label, list, isRevenue) => {
    if (!list.length) return sum([]);
    rows.push({ kind: 'side', label });
    const items = list.flatMap((sec) => {
      if (sec.kind !== 'wrapper') return group(sec, 0);
      rows.push({ kind: 'header', label: sec.label, depth: 0 });
      const inner = sec.groups.flatMap((g) => group(g, 1));
      rows.push({ kind: 'total', label: `Total ${sec.label}`, depth: 0, isRevenue, ...sum(inner) });
      return inner;
    });
    const total = sum(items);
    rows.push({ kind: 'sidetotal', label: `Total ${label}`, isRevenue, ...total });
    return total;
  };
  const revenue = side('Revenue', sections.revenue, true);
  const expense = side('Expenses', sections.expense, false);
  if (rows.length) {
    rows.push({ kind: 'net', label: 'Net (Revenue − Expenses)', isRevenue: true, actualCents: revenue.actualCents - expense.actualCents, budgetCents: revenue.budgetCents - expense.budgetCents, hasBudget: revenue.hasBudget || expense.hasBudget });
  }
  return { rows, hiddenCount: hidden.length };
}

function renderBudgetActualBoard(board, fiscalYear, showHidden) {
  const e = escapeHtml;
  const money = (c) => formatSignedCents(c);
  const figures = (r) => {
    const variance = r.hasBudget ? (r.isRevenue ? r.actualCents - r.budgetCents : r.budgetCents - r.actualCents) : null;
    return `<td>${money(r.actualCents)}</td><td${r.hasBudget ? '' : ' class="tone-muted"'}>${r.hasBudget ? money(r.budgetCents) : '—'}</td><td class="${variance === null ? 'tone-muted' : variance < 0 ? 'bp-up' : ''}">${variance === null ? '—' : money(variance)}</td>`;
  };
  const body = board.rows.map((r) => {
    const pad = `style="padding-left:${10 + (r.depth || 0) * 16}px"`;
    if (r.kind === 'side') return `<tr class="bb-group"><td colspan="4">${e(r.label)}</td></tr>`;
    if (r.kind === 'header') return `<tr class="bp-header"><td colspan="4" ${pad}>${e(r.label)}</td></tr>`;
    if (r.kind === 'leaf') {
      // Only the display name shows (Andrew, 2026-09-29): the QuickBooks name under a renamed line
      // read as a repeat. The rename itself is managed in Chart of Accounts › Budget layout.
      const sub = r.hidden ? 'Hidden old line' : '';
      return `<tr${r.hidden ? ' class="coa-hidden"' : ''}><td ${pad}>${e(r.label)}${sub ? `<small>${sub}</small>` : ''}</td>${figures(r)}</tr>`;
    }
    if (r.kind === 'total') return `<tr class="bb-subtotal"><td ${pad}>${e(r.label)}</td>${figures(r)}</tr>`;
    if (r.kind === 'sidetotal') return `<tr class="bb-total"><td>${e(r.label)}</td>${figures(r)}</tr>`;
    return `<tr class="bb-result"><td>${e(r.label)}</td>${figures(r)}</tr>`;
  }).join('');
  const base = `/?section=church&amp;page=budget-actual`;
  const toggle = board.hiddenCount
    ? (showHidden
      ? `<p class="muted-line"><a href="${base}">Hide the ${board.hiddenCount} old line${board.hiddenCount === 1 ? '' : 's'} again</a></p>`
      : `<p class="muted-line">${board.hiddenCount} old line${board.hiddenCount === 1 ? '' : 's'} hidden in Chart of Accounts › Budget layout. <a href="${base}&amp;hidden=1">Show hidden lines</a></p>`)
    : '';
  return `<div class="table-wrap"><table class="bb-table"><thead><tr><th>Account</th><th>FY${fiscalYear} Actual</th><th>FY${fiscalYear} Budget</th><th>Favorable variance</th></tr></thead><tbody>${body || '<tr><td colspan="4" class="tone-muted">No actual or budget figures for this year yet.</td></tr>'}</tbody></table></div>
    ${toggle}
    <p><small>Grouped and named as in the Budget planner. Headings, account names and hidden lines are set in Chart of Accounts › Budget layout. Lines with no actual and no budget are left out.</small></p>`;
}

export function renderChurchTrendRows(rows) {
  return rows.map((row) => `<tr><td>${row.fiscal_year}</td><td>${formatCents(row.income_cents)}</td><td>${formatCents(row.expense_cents)}</td><td>${formatSignedCents(row.net_cents)}</td></tr>`).join('');
}

// Live trend rows carry the connect.finance-church-report-trend.v1 contract's own camelCase shape
// (see church-report-service.js's resolveChurchTrend) -- fiscalYear/incomeActualCents/
// expenseActualCents/netIncomeActualCents, the same full bottom-line netIncomeActualCents
// definition the single-year contract's own totals use (folds in Cost of Goods Sold and Other
// Income/Expenses), NOT a naive income-minus-expense figure. This matches production's own
// existing multi-year trend chart/table (src/frontend/js-finance.js's finRenderChurchMultiYear),
// which never shows a budget column here either -- actual-only, same as this render.
export function renderLiveChurchTrendRows(years) {
  return years.map((row) => `<tr><td>${row.fiscalYear}</td><td>${formatCents(row.incomeActualCents)}</td><td>${formatCents(row.expenseActualCents)}</td><td>${formatSignedCents(row.netIncomeActualCents)}</td></tr>`).join('');
}

// `churchReport` here is resolveChurchReport()'s result -- { source: 'live', fiscalYear, accounts,
// totals } or { source: 'synthetic-fallback', fallbackReason, rows } -- never the raw synthetic row
// array church-pages.js used to receive directly. `churchTrendLive` is resolveChurchTrend()'s
// result in the same two shapes -- { source: 'live', years } or { source: 'synthetic-fallback',
// fallbackReason, rows } -- for the 'trend' (multi-year) page specifically. Health/Charts/Packet's
// own still-synthetic churchReport/churchTrends usage in shell.js is untouched, out of scope for
// this contract.
export function renderChurchPage(pageId, {
  churchReport, churchTrendLive, canManageChurchReport, churchOverrideStatus, churchOverrideMessage,
  churchBudgetXlsxImportStatus, churchBudgetXlsxImportMessage,
  canImportChurchMultiYear,
  churchActivityXlsxImportStatus, churchActivityXlsxImportMessage,
  churchBudgetMultiYearXlsxImportStatus, churchBudgetMultiYearXlsxImportMessage,
  boardLayout = null, showHidden = false,
}) {
  if (pageId === 'trend') {
    const isTrendLive = churchTrendLive.source === 'live';
    const badge = isTrendLive ? 'Live from Connect' : 'Synthetic staging';
    const rows = isTrendLive ? renderLiveChurchTrendRows(churchTrendLive.years) : renderChurchTrendRows(churchTrendLive.rows);
    const fallbackNote = isTrendLive ? '' : `<p><small>The committed synthetic fixture (the live endpoint is not configured or did not answer${churchTrendLive.fallbackReason ? `: ${escapeHtml(churchTrendLive.fallbackReason)}` : ''}).</small></p>`;
    return `<section class="report" aria-label="Church Report multi-year trend">
      ${renderSectionHeading({ eyebrow: 'Church Report', heading: 'Multi-year operating trend', badge })}
      ${renderTable({ head: ['Fiscal year', 'Income', 'Expenses', 'Net result'], rows })}
      ${fallbackNote}
    </section>${canImportChurchMultiYear ? renderChurchMonthlyXlsxImportForm(churchActivityXlsxImportStatus, churchActivityXlsxImportMessage) : ''}${canImportChurchMultiYear ? renderChurchActivityXlsxImportForm(churchActivityXlsxImportStatus, churchActivityXlsxImportMessage) : ''}${canImportChurchMultiYear ? renderChurchBudgetMultiYearXlsxImportForm(churchBudgetMultiYearXlsxImportStatus, churchBudgetMultiYearXlsxImportMessage) : ''}`;
  }

  const isLive = churchReport.source === 'live';
  const report = isLive
    ? buildLiveChurchReportView(churchReport.accounts, churchReport.fiscalYear, churchReport.totals)
    : buildChurchReportView(churchReport.rows);
  const variance = report.totals.actualNetCents - report.totals.budgetNetCents;
  const badge = isLive ? 'Live from Connect' : 'Synthetic staging';
  const rows = isLive ? renderLiveChurchRows([...report.income, ...report.expenses]) : renderChurchRows([...report.income, ...report.expenses]);
  const fallbackNote = isLive ? '' : `<p><small>The committed synthetic fixture (the live endpoint is not configured or did not answer${churchReport.fallbackReason ? `: ${escapeHtml(churchReport.fallbackReason)}` : ''}).</small></p>`;

  if (pageId === 'income-expense') {
    return `<section class="report" aria-label="Church Report income and expense detail">
      ${renderSectionHeading({ eyebrow: 'Church Report', heading: `Income &amp; expense detail · FY${report.fiscalYear}`, badge })}
      ${renderTable({ head: ['Classification', 'Account', 'Actual', 'Budget', 'Favorable variance'], rows })}
      ${fallbackNote}
    </section>${canManageChurchReport ? renderChurchActualOverrideForm(report.fiscalYear, churchOverrideStatus, churchOverrideMessage) : ''}`;
  }
  if (pageId === 'budget-actual') {
    return `<section class="report" aria-label="Church Report budget vs actual">
      ${renderSectionHeading({ eyebrow: 'Church Report', heading: `Budget vs actual · FY${report.fiscalYear}`, badge: variance >= 0 ? 'Favorable' : 'Unfavorable' })}
      ${renderKpiCards([
        { label: 'Actual net result', value: formatSignedCents(report.totals.actualNetCents) },
        { label: 'Budgeted net result', value: formatSignedCents(report.totals.budgetNetCents) },
        { label: 'Variance', value: formatSignedCents(variance), hint: variance >= 0 ? 'Ahead of budget' : 'Behind budget' },
      ])}
      ${isLive && boardLayout
    ? renderBudgetActualBoard(buildBudgetActualBoard(churchReport.accounts, boardLayout, { showHidden }), report.fiscalYear, showHidden)
    : renderTable({ head: ['Classification', 'Account', 'Actual', 'Budget', 'Favorable variance'], rows })}
      ${isLive && !boardLayout ? '<p><small>The Budget planner’s layout could not be read from Connect just now, so lines are listed in QuickBooks order.</small></p>' : ''}
      ${fallbackNote}
    </section>${canManageChurchReport ? renderChurchBudgetXlsxImportForm(churchBudgetXlsxImportStatus, churchBudgetXlsxImportMessage) : ''}`;
  }
  // 'overview' (default)
  return `<section class="report" aria-label="Church Report overview">
    ${renderSectionHeading({ eyebrow: 'Church Report', heading: `Fiscal year ${report.fiscalYear}`, badge })}
    ${renderKpiCards([
      { label: 'Income', value: formatCents(report.totals.incomeActualCents) },
      { label: 'Expenses', value: formatCents(report.totals.expenseActualCents) },
      { label: 'Net result', value: formatSignedCents(report.totals.actualNetCents), hint: `Budget ${formatSignedCents(report.totals.budgetNetCents)} · variance ${formatSignedCents(variance)}` },
    ])}
    <p>See Income &amp; expense detail, Multi-year trend, and Budget vs actual for the full breakdown behind these totals.</p>
    ${fallbackNote}
  </section>`;
}
