import { buildDataStatusView } from './data-status-service.js';
import { buildAccountsReportView } from './accounts-report-service.js';
import { renderLayoutEditor } from './accounts-pages.js';
import { escapeHtml, renderKpiCards, renderSectionHeading, renderTable } from './render-helpers.js';
import {
  expenseAccountOf, findTransactionExceptions, isSpending, searchTransactions, sortRows, spendingCents,
  summarizeExpenseAccounts, summarizeExpenseLines, summarizeVendorSpend, TRANSACTION_SORTS, transactionsForName,
} from './quickbooks-transactions-service.js';

function flattenAccountHierarchy(nodes) {
  return nodes.flatMap((node) => [node, ...flattenAccountHierarchy(node.children)]);
}

function renderMappingRows(nodes) {
  return flattenAccountHierarchy(nodes)
    .filter((node) => node.account)
    .map((node) => `<tr><td>${escapeHtml(node.path)}</td><td>${escapeHtml(node.account.boardCategoryLabel)}</td><td>${node.account.purposeTagLabel ? escapeHtml(node.account.purposeTagLabel) : '—'}</td></tr>`)
    .join('');
}

const QB_STATUS_MESSAGES = {
  connected: 'QuickBooks connected. Run a sync to load the latest figures.',
  disconnected: 'QuickBooks disconnected and its access revoked.',
  restored: 'Restored. The QuickBooks figures are back to the chosen backup; the figures that were replaced were backed up first.',
};

function renderQuickbooksStatusLine(params) {
  const qb = params && params.get('qb');
  if (!qb) return '';
  if (qb === 'error') return `<p class="status status-error">${escapeHtml(params.get('message') || 'QuickBooks request failed.')}</p>`;
  if (qb === 'synced') {
    const warnings = Number(params.get('warnings')) || 0;
    return `<p class="status">Synced ${escapeHtml(params.get('rows') || '0')} Church Report rows of actuals from QuickBooks${warnings ? ` with ${warnings} warning${warnings === 1 ? '' : 's'}` : ''}. The previous figures were backed up first; restore them below if these look wrong.</p>`;
  }
  return QB_STATUS_MESSAGES[qb] ? `<p class="status">${QB_STATUS_MESSAGES[qb]}</p>` : '';
}

// Finance's own QuickBooks connection (quickbooks-oauth-routes.js), shown once FINANCE_QB_ENABLED
// is on. Admins get the controls; everyone who can see the section gets the status.
export function renderQuickbooksConnection(own, { canManage, backups, params } = {}) {
  const thisYear = new Date().getFullYear();
  const yearBoxes = Array.from({ length: 6 }, (_, i) => thisYear - i).map((y) => `<label><input type="checkbox" name="fiscal_year" value="${y}"> ${y}</label>`).join(' ');
  const controls = !canManage ? '' : own.connected
    ? `<p>Sync brings in actuals only: yearly Profit &amp; Loss for ${thisYear - 4}–${thisYear} (this year to date), monthly Profit &amp; Loss for ${thisYear - 1}–${thisYear}, and the chart of accounts. Budgets are not imported from QuickBooks. It replaces only earlier QuickBooks figures, and backs them up first.</p>
      <form method="POST" action="/api/v1/qb/sync" style="display:inline"><button type="submit">Sync now</button></form>
      <form method="POST" action="/api/v1/qb/disconnect" style="display:inline"><button type="submit" onclick="return confirm('Disconnect QuickBooks and revoke Finance’s access?')">Disconnect</button></form>
      <form method="POST" action="/api/v1/qb/sync-years"><fieldset><legend>Sync actuals for specific years</legend>${yearBoxes}</fieldset><button type="submit">Sync selected years</button></form>`
    : '<p><a class="button" href="/api/v1/qb/connect">Connect QuickBooks</a></p>';
  return `<section aria-label="QuickBooks connection">
    ${renderSectionHeading({ eyebrow: 'QuickBooks', heading: 'Connection', badge: own.connected ? 'Connected to Finance' : 'Not connected' })}
    ${renderQuickbooksStatusLine(params)}
    ${own.connected
      ? renderKpiCards([
        { label: 'Company', value: escapeHtml(own.companyName || 'QuickBooks company'), hint: own.environment === 'sandbox' ? 'Sandbox' : 'Production' },
        { label: 'Connected', value: escapeHtml((own.connectedAt || '').slice(0, 10) || '—') },
        { label: 'Last sync', value: escapeHtml((own.lastSyncedAt || '').slice(0, 16).replace('T', ' ') || 'Never'), hint: own.reconnectBy ? `Reconnect before ${escapeHtml(own.reconnectBy.slice(0, 10))}` : undefined },
      ])
      : '<p>Finance is not connected to QuickBooks. An admin connects it once; Finance then keeps its own access current.</p>'}
    ${controls}
    ${canManage ? renderSyncBackups(backups) : ''}
  </section>`;
}

// Pre-sync backups (quickbooks-sync-backup.js), newest first, each with a Restore button.
export function renderSyncBackups(backups) {
  if (!backups) return '';
  if (!backups.ok) return `<p class="status status-error">Backups could not be listed: ${escapeHtml(backups.error || 'unknown error')}</p>`;
  const intro = '<h3>Backups before each sync</h3><p>Every sync first saves the QuickBooks figures it is about to replace. Restoring puts those figures back (and saves the current ones first, so a restore can be undone). Imports, committed budget plans and hand-typed corrections are never changed by a sync or a restore.</p>';
  if (!backups.backups.length) return `${intro}<p>No backups yet. The first one is made automatically when you sync.</p>`;
  const rows = backups.backups.map((b) => {
    const when = escapeHtml(String(b.createdAt || '').slice(0, 16).replace('T', ' ') + ' UTC');
    const years = b.churchRows ? (b.firstYear === b.lastYear ? String(b.firstYear) : `${b.firstYear}–${b.lastYear}`) : 'none';
    return `<tr><td>${when}</td><td>${escapeHtml(b.reason || '')}</td><td>${escapeHtml(String(b.churchRows))} rows (${escapeHtml(years)})</td>
      <td><form method="POST" action="/api/v1/qb/restore"><input type="hidden" name="backup_id" value="${escapeHtml(String(b.id))}"><button type="submit" onclick="return confirm('Put the QuickBooks figures back to this backup? The current figures are backed up first.')">Restore</button></form></td></tr>`;
  }).join('');
  return `${intro}${renderTable({ head: ['Saved at', 'Reason', 'QuickBooks figures', ''], rows })}`;
}

function money(cents) {
  return cents == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function transactionLink(row) {
  return row.viewUrl
    ? `<a href="${escapeHtml(row.viewUrl)}" target="_blank" rel="noopener">View in QuickBooks</a>`
    : '—';
}

// Every view state lives in the query string (these pages run no script), so search, sort,
// filters, and drill-downs are ordinary links and survive a reload or a shared URL.
const VIEW_PARAMS = ['start_date', 'end_date', 'q', 'type', 'sort', 'dir', 'account', 'vendor', 'vendor_id'];

function readView(searchParams) {
  const get = (name) => (searchParams && searchParams.get(name)) || '';
  return Object.fromEntries(VIEW_PARAMS.map((name) => [name, get(name).trim()]));
}

function pageHref(pageId, result, view, changes = {}) {
  const params = new URLSearchParams({ section: 'quickbooks', page: pageId });
  const merged = { ...view, start_date: result?.startDate || view.start_date, end_date: result?.endDate || view.end_date, ...changes };
  for (const name of VIEW_PARAMS) if (merged[name]) params.set(name, merged[name]);
  return `/?${params}`;
}

function sortHeader(label, key, pageId, result, view, { defaultKey, numeric = false } = {}) {
  const activeKey = view.sort || defaultKey;
  const activeDir = view.dir || (numeric || activeKey === 'date' ? 'desc' : 'asc');
  const active = activeKey === key;
  const nextDir = active ? (activeDir === 'asc' ? 'desc' : 'asc') : (numeric || key === 'date' ? 'desc' : 'asc');
  const arrow = active ? (activeDir === 'asc' ? ' ▲' : ' ▼') : '';
  const aria = active ? ` aria-sort="${activeDir === 'asc' ? 'ascending' : 'descending'}"` : '';
  return `<th${numeric ? ' class="num"' : ''}${aria}><a href="${escapeHtml(pageHref(pageId, result, view, { sort: key, dir: nextDir }))}" title="Sort by ${escapeHtml(label.toLowerCase())}">${escapeHtml(label)}${arrow}</a></th>`;
}

function table(headHtml, rowsHtml, emptyMessage) {
  const body = rowsHtml || `<tr><td colspan="99">${escapeHtml(emptyMessage)}</td></tr>`;
  return `<div class="table-wrap"><table><thead><tr>${headHtml}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function renderFilterForm(pageId, result, view, { types = [], searchLabel = 'Search', searchPlaceholder = '' } = {}) {
  const hidden = ['sort', 'dir', 'account', 'vendor', 'vendor_id']
    .filter((name) => view[name])
    .map((name) => `<input type="hidden" name="${name}" value="${escapeHtml(view[name])}">`).join('');
  const typeSelect = types.length ? `<div class="field"><label for="qb-type">Transaction type</label><select id="qb-type" name="type"><option value="">All types</option>${types.map((type) => `<option${type === view.type ? ' selected' : ''}>${escapeHtml(type)}</option>`).join('')}</select></div>` : '';
  const clear = view.q || view.type ? ` <a href="${escapeHtml(pageHref(pageId, result, view, { q: '', type: '' }))}">Clear search</a>` : '';
  return `<form method="GET" action="/" class="filter-form">
    <input type="hidden" name="section" value="quickbooks"><input type="hidden" name="page" value="${escapeHtml(pageId)}">${hidden}
    <div class="field"><label for="qb-start">From</label><input id="qb-start" type="date" name="start_date" value="${escapeHtml(result?.startDate || view.start_date || '')}" required></div>
    <div class="field"><label for="qb-end">Through</label><input id="qb-end" type="date" name="end_date" value="${escapeHtml(result?.endDate || view.end_date || '')}" required></div>
    <div class="field"><label for="qb-q">${escapeHtml(searchLabel)}</label><input id="qb-q" type="search" name="q" value="${escapeHtml(view.q)}" placeholder="${escapeHtml(searchPlaceholder)}"></div>
    ${typeSelect}
    <p><button type="submit">Load</button>${clear}</p>
  </form>`;
}

function amountCell(row) {
  return `<td class="num">${row.amountCents == null ? escapeHtml(row.amount || '—') : money(row.amountCents)}</td>`;
}

// The smaller QuickBooks details under the memo, only those the report carried for this row.
function transactionDetails(row) {
  const parts = [
    row.paymentMethod && `Paid by ${row.paymentMethod}`,
    row.dueDate && `Due ${row.dueDate}`,
    row.cleared && /^(c|r|cleared|reconciled)$/i.test(row.cleared) && (/^r/i.test(row.cleared) ? 'Reconciled' : 'Cleared'),
    row.className && `Class: ${row.className}`,
    row.location && `Location: ${row.location}`,
    row.createdBy && `Entered by ${row.createdBy}`,
  ].filter(Boolean);
  return parts.length ? `<br><small class="muted">${escapeHtml(parts.join(' · '))}</small>` : '';
}

function renderTransactionTable(pageId, result, view, rows, { includeReason = false, emptyMessage = 'No transactions match.' } = {}) {
  const sorted = sortRows(rows, TRANSACTION_SORTS, view.sort || 'date', view.dir || (!view.sort || view.sort === 'date' || view.sort === 'amount' ? 'desc' : 'asc'));
  const h = (label, key, options) => sortHeader(label, key, pageId, result, view, { defaultKey: 'date', ...options });
  const head = [h('Date', 'date'), h('Type', 'type'), h('Number', 'number'), h('Name', 'name'), h('Memo / description', 'memo'), h('Account', 'account'), h('Category / split', 'category'), h('Amount', 'amount', { numeric: true }),
    includeReason ? '<th>Reason</th>' : '', '<th></th>'].join('');
  const body = sorted.map((row) => {
    const vendorLink = row.name
      ? `<a href="${escapeHtml(pageHref('vendor-spend', result, view, { vendor: row.name, vendor_id: row.nameId || '', account: '', q: '', type: '', sort: '', dir: '' }))}">${escapeHtml(row.name)}</a>` : '—';
    return `<tr><td>${escapeHtml(row.date || '—')}</td><td>${escapeHtml(row.type || '—')}</td><td>${escapeHtml(row.docNum || '—')}</td><td>${vendorLink}</td><td>${row.memo ? escapeHtml(row.memo) : '<span class="muted">—</span>'}${transactionDetails(row)}</td><td>${escapeHtml(row.account || '—')}</td><td>${escapeHtml(row.split === '-Split-' ? 'Multiple (split)' : row.split || '—')}</td>${amountCell(row)}${includeReason ? `<td>${escapeHtml(row.reasons.join('; '))}</td>` : ''}<td>${transactionLink(row)}</td></tr>`;
  }).join('');
  return table(head, body, emptyMessage);
}

function renderSummaryTable(pageId, result, view, summary, { label, key, linkParam, countLabel = 'Transactions' }) {
  const sorts = { [key]: (row) => row[key], count: (row) => row.transactionCount, amount: (row) => row.amountCents };
  const sorted = sortRows(summary, sorts, view.sort || 'amount', view.dir || (view.sort === key ? 'asc' : 'desc'));
  const h = (text, sortKey, options) => sortHeader(text, sortKey, pageId, result, view, { defaultKey: 'amount', ...options });
  const head = h(label, key) + h(countLabel, 'count', { numeric: true }) + h('Spend', 'amount', { numeric: true });
  const body = sorted.map((row) => `<tr><td><a href="${escapeHtml(pageHref(pageId, result, view, { [linkParam]: row[key], q: '', sort: '', dir: '' }))}">${escapeHtml(row[key])}</a></td><td class="num">${row.transactionCount}</td><td class="num">${money(row.amountCents)}</td></tr>`).join('');
  const total = sorted.reduce((sum, row) => sum + row.amountCents, 0);
  const footer = sorted.length ? `<tr><td><strong>Total</strong></td><td class="num"><strong>${sorted.reduce((sum, row) => sum + row.transactionCount, 0)}</strong></td><td class="num"><strong>${money(total)}</strong></td></tr>` : '';
  return table(head, body + footer, 'Nothing matches for this range.');
}

function filterSummary(summary, key, query) {
  const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  return words.length ? summary.filter((row) => words.every((word) => row[key].toLowerCase().includes(word))) : summary;
}

const SPENDING_NOTE = 'Spending counts bills, expenses, and checks (less vendor and card credits) when they are entered. Bill payments are left out because they pay a bill already counted.';

function renderTransactionPage(pageId, result, searchParams) {
  const headings = {
    transactions: ['Transactions', 'QuickBooks transaction detail'],
    'expense-drilldown': ['Expense drill-down', 'Spending by expense account'],
    'vendor-spend': ['Vendor spend', 'Spending by vendor'],
    exceptions: ['Exceptions', 'Incomplete transaction details'],
  };
  const [heading, description] = headings[pageId];
  const view = readView(searchParams);
  if (!result?.ok) return `<section class="report" aria-label="${escapeHtml(heading)}">
    ${renderSectionHeading({ eyebrow: 'QuickBooks', heading, badge: 'Live read' })}
    <p>${escapeHtml(description)}. Finance reads this directly from QuickBooks and does not change transactions.</p>
    ${renderFilterForm(pageId, result, view)}<p class="status status-error">${escapeHtml(result?.error || 'Transactions are unavailable.')}</p></section>`;
  const all = result.transactions || [];
  const kpis = (shown, extra = []) => renderKpiCards([
    { label: 'Transactions loaded', value: String(all.length) },
    ...(shown == null ? [] : [{ label: 'Shown', value: String(shown) }]),
    ...extra,
    { label: 'Loaded at', value: escapeHtml(result.syncedAt.slice(0, 16).replace('T', ' ')), hint: 'UTC' },
  ]);
  const intro = `<p>${escapeHtml(description)} for ${escapeHtml(result.startDate)} through ${escapeHtml(result.endDate)}. This is read-only; use the QuickBooks link to edit a source transaction.</p>`;
  let body;

  const drill = pageId === 'expense-drilldown' ? { param: 'account', value: view.account, noun: 'account' }
    : pageId === 'vendor-spend' ? { param: 'vendor', value: view.vendor, noun: 'vendor' } : null;
  // Expense drill-down prefers Profit and Loss Detail, one row per expense line, so a split bill
  // counts toward each account it was charged to. Without it, whole transactions are grouped.
  const byLine = pageId === 'expense-drilldown' && Array.isArray(result.expenseLines);
  const lineNote = byLine
    ? 'Lines come from QuickBooks Profit and Loss Detail, so a bill split across accounts counts toward each one, and totals match the Profit and Loss. Credits and refunds reduce an account.'
    : `${SPENDING_NOTE} A bill or expense spread across several accounts appears once, under “Multiple accounts”.`;
  const lineWarning = pageId === 'expense-drilldown' && result.expenseLinesError
    ? `<p class="status status-error">${escapeHtml(result.expenseLinesError)} Showing whole transactions instead.</p>` : '';
  if (drill && drill.value) {
    // One account or vendor: the spending rows behind its total, searchable and sortable.
    // A vendor lists every transaction with that payee -- bill payments included, so a payee
    // reached from a bill payment is never empty -- while Spend still counts only spending rows.
    const detail = byLine
      ? result.expenseLines.filter((line) => line.account === drill.value)
      : drill.param === 'vendor'
        ? transactionsForName(all, { name: drill.value, nameId: view.vendor_id })
        : all.filter((row) => isSpending(row) && expenseAccountOf(row) === drill.value);
    const shown = searchTransactions(detail, view.q);
    const total = shown.reduce((sum, row) => sum + (byLine ? row.amountCents : isSpending(row) ? spendingCents(row) : 0), 0);
    const payments = drill.param === 'vendor' ? shown.filter((row) => !isSpending(row)) : [];
    const paidCents = payments.reduce((sum, row) => sum + Math.abs(row.amountCents || 0), 0);
    const back = pageHref(pageId, result, view, { [drill.param]: '', vendor_id: '', q: '', sort: '', dir: '' });
    const yearStart = `${String(result.endDate).slice(0, 4)}-01-01`;
    const widen = drill.param === 'vendor' && result.startDate > yearStart
      ? ` <a href="${escapeHtml(pageHref(pageId, { ...result, startDate: yearStart }, view, {}))}">Show this year to date</a>` : '';
    const other = drill.param === 'account'
      ? [...new Set(shown.map((row) => row.name).filter(Boolean))].length
      : [...new Set(shown.map(expenseAccountOf).filter(Boolean))].length;
    body = `<p><a href="${escapeHtml(back)}">← All ${drill.noun === 'account' ? 'accounts' : 'vendors'}</a></p>
      <h3>${escapeHtml(drill.value)}</h3>${lineWarning}
      ${renderFilterForm(pageId, result, view, { searchPlaceholder: 'Name, memo, number, amount…' })}
      ${kpis(shown.length, [{ label: 'Spend', value: money(total) }, ...(payments.length ? [{ label: 'Payments and other', value: money(paidCents), hint: `${payments.length} not counted as spend` }] : []), { label: drill.param === 'account' ? 'Vendors' : 'Accounts', value: String(other) }])}
      ${renderTransactionTable(pageId, result, view, shown, { emptyMessage: drill.param === 'vendor' ? `No transactions with ${drill.value} in this date range.` : `No spending for this ${drill.noun} matches.` })}
      <p class="muted">${escapeHtml(drill.param === 'account' ? lineNote : `${SPENDING_NOTE} They are listed here so every transaction with this payee is visible.`)}${widen}</p>`;
  } else if (drill) {
    const summary = drill.param === 'vendor' ? summarizeVendorSpend(all)
      : byLine ? summarizeExpenseLines(result.expenseLines) : summarizeExpenseAccounts(all);
    const key = drill.param === 'account' ? 'account' : 'name';
    const shown = filterSummary(summary, key, view.q);
    body = `${renderFilterForm(pageId, result, view, { searchLabel: `Find ${drill.noun}`, searchPlaceholder: drill.param === 'account' ? 'Account name or number' : 'Vendor name' })}
      ${kpis(null, [{ label: drill.param === 'account' ? 'Accounts' : 'Vendors', value: String(shown.length) }])}
      <p>Select ${drill.param === 'account' ? 'an account' : 'a vendor'} to see the transactions behind its total.</p>
      ${lineWarning}${renderSummaryTable(pageId, result, view, shown, { label: drill.param === 'account' ? 'Expense account' : 'Vendor', key, linkParam: drill.param, countLabel: byLine ? 'Lines' : 'Transactions' })}
      <p class="muted">${escapeHtml(drill.param === 'account' ? lineNote : SPENDING_NOTE)}</p>`;
  } else {
    const base = pageId === 'exceptions' ? findTransactionExceptions(all) : all;
    const types = [...new Set(base.map((row) => row.type).filter(Boolean))].sort();
    const shown = searchTransactions(base, view.q).filter((row) => !view.type || row.type === view.type);
    body = `${renderFilterForm(pageId, result, view, { types, searchPlaceholder: 'Name, memo, account, number, amount…' })}
      ${kpis(shown.length)}
      ${renderTransactionTable(pageId, result, view, shown, { includeReason: pageId === 'exceptions', emptyMessage: pageId === 'exceptions' ? 'No incomplete transactions match.' : 'No transactions match.' })}`;
  }
  return `<section class="report" aria-label="${escapeHtml(heading)}">
    ${renderSectionHeading({ eyebrow: 'QuickBooks', heading, badge: 'Live from QuickBooks' })}
    ${intro}${body}</section>`;
}

function renderImportHistory(result) {
  if (!result?.ok) return `<section class="report" aria-label="Import history">
    ${renderSectionHeading({ eyebrow: 'QuickBooks', heading: 'Import history', badge: 'Unavailable' })}
    <p class="status status-error">${escapeHtml(result?.error || 'Import history is unavailable.')}</p></section>`;
  const rows = result.rows || [];
  return `<section class="report" aria-label="Import history">
    ${renderSectionHeading({ eyebrow: 'Accounts & data', heading: 'Import history', badge: 'Live' })}
    <p>Completed Finance imports, newest first. The first entry for an older importer may be the latest pre-history status retained when tracking began.</p>
    ${renderKpiCards([{ label: 'Events shown', value: String(rows.length) }])}
    ${renderTable({ head: ['Completed', 'Importer', 'Coverage / note'], rows: rows.map((row) => `<tr><td>${escapeHtml(String(row.importedAt || '').replace('T', ' ').replace('Z', ' UTC'))}</td><td>${escapeHtml(row.importerLabel)}</td><td>${escapeHtml(row.note || '—')}</td></tr>`).join('') })}
  </section>`;
}

export function renderQuickbooksPage(pageId, {
  dataStatus, accountsReport, quickbooksOwn = null, quickbooksBackups = null, quickbooksTransactions = null, importHistory = null,
  canManageQuickbooks = false, searchParams = null, boardLayout = null, canManageBoardCategories = false, mappingEntryMessage = null,
}) {
  if (['transactions', 'expense-drilldown', 'vendor-spend', 'exceptions'].includes(pageId)) {
    return renderTransactionPage(pageId, quickbooksTransactions, searchParams);
  }
  if (pageId === 'import-history') return renderImportHistory(importHistory);
  // 'sync-status' (default) -- same underlying contract/status as Data & Imports. Finance's own
  // connection card (once enabled) must not depend on that status feed, so a status that cannot be
  // built only drops its own panel.
  const connection = quickbooksOwn && !quickbooksOwn.syntheticUnavailable
    ? renderQuickbooksConnection(quickbooksOwn, { canManage: canManageQuickbooks, backups: quickbooksBackups, params: searchParams })
    : '';
  let statusSection;
  try {
    const isLive = dataStatus.source === 'live';
    const status = buildDataStatusView(dataStatus.row, new Date(), {
      productionConnected: dataStatus.productionConnected,
      writerConnected: dataStatus.writerConnected,
    });
    statusSection = `<section class="report" aria-label="${isLive ? 'QuickBooks sync status' : 'Synthetic QuickBooks sync status'}">
    ${renderSectionHeading({ eyebrow: 'QuickBooks', heading: 'Sync status', badge: isLive ? 'Live from Connect' : 'Synthetic staging' })}
    ${renderKpiCards([
      { label: 'Production connection', value: status.productionConnected ? 'Connected' : 'Disconnected' },
      { label: 'QuickBooks writer', value: status.writerConnected ? 'Connected' : 'Disconnected', hint: isLive ? "Connect's real finance_qb_connection state" : 'No competing staging writer' },
      { label: isLive ? 'Most recent import' : 'Last fixture import', value: escapeHtml(status.lastImportedAt), hint: `${status.freshness} · ${status.ageDays} days old` },
    ])}
    <p>See Data &amp; Imports for the full freshness detail behind this status.</p>
  </section>`;
  } catch (error) {
    if (!connection) throw error;
    statusSection = '';
  }
  return statusSection + connection;
}
