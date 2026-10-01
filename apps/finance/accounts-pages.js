import {
  buildAccountsReportView, buildChartOfAccountsView, buildPurposeTotals, chartLeafRows, isRevenueClassification, layoutFromChartRows,
} from './accounts-report-service.js';
import { escapeHtml, formatSignedCents, renderKpiCards, renderSectionHeading, renderTable } from './render-helpers.js';
import {
  BOARD_EXPENSE_ORDER, BOARD_REVENUE_ORDER, DONOR_WRAPPER_DEFAULT_LABEL, BOARD_EXPENSE_DEFAULT_LABELS,
  BOARD_REVENUE_DEFAULT_LABELS, boardCategoryFor, boardLabelFor, buildBoardSections, defaultBoardCategory, isHiddenAccount,
} from './board-layout.js';

// Mirrors REVENUE_STREAM_DEFAULT_LABELS (src/api-contracts.js) and BOARD_EXPENSE_CATEGORIES
// (src/api-finance.js) -- apps/finance is a separate Worker with no import access to src/, so
// this small, stable, rarely-changed closed set is duplicated here rather than fetched, the same
// reasoning as compensation-calc.js's own mechanical port comment. Only used to render the picker
// -- the real, authoritative allowlist check happens on Connect's side (applyBoardCategoryMerge,
// src/api-finance.js), so a drift here would only ever show a stale label, never let an invalid
// key through.
const REVENUE_CATEGORY_OPTIONS = [
  { key: 'donor', label: 'Donor' }, { key: 'earned', label: 'Earned' },
  { key: 'passive', label: 'Passive' }, { key: 'restricted', label: 'Restricted' },
];
const EXPENSE_CATEGORY_OPTIONS = [
  { key: 'mdo', label: 'MDO' }, { key: 'salaries', label: 'Salaries' }, { key: 'benefits', label: 'Benefits' },
  { key: 'worship', label: 'Worship & Music' }, { key: 'property', label: 'Property & Operations' },
  { key: 'education', label: 'Lutheran Education' }, { key: 'youth_family', label: 'Youth & Family' },
  { key: 'district_synod', label: 'District & Synod Support' }, { key: 'programs', label: 'Programs' },
];

// Admin-only board-category assignment -- relayed live to Connect's real
// finance_planning_board_categories store (see finance-board-categories-write-v1 in
// src/api-contracts-service.js), never stored in Finance's own database. One account (category
// path) at a time, matching Budget/Church's own single-row edit forms; picking the blank option
// clears that one account back to its computed default.
function renderBoardCategoryForm(entryStatus, entryMessage) {
  const optgroup = (label, options) => `<optgroup label="${escapeHtml(label)}">${options.map((o) =>
    `<option value="${escapeHtml(o.key)}">${escapeHtml(o.label)}</option>`).join('')}</optgroup>`;
  return `<section aria-label="Assign a board category">
    ${renderSectionHeading({ eyebrow: 'Chart of Accounts', heading: 'Assign a board category', badge: 'Relayed live to Connect' })}
    ${entryStatus === 'ok' ? '<p class="status">Saved in Connect.</p>' : ''}
    ${entryStatus === 'error' ? `<p class="status status-error">Not saved: ${escapeHtml(entryMessage || 'unknown error')}</p>` : ''}
    <form method="POST" action="/api/v1/connect-board-categories-write">
      <div class="grid form-grid">
        <div class="field"><label for="bcat-path">Ledger path</label><input id="bcat-path" type="text" name="category_path" placeholder="e.g. Expenses:60000 Programs" required></div>
        <div class="field"><label for="bcat-category">Board category</label><select id="bcat-category" name="board_category">
          <option value="">— (clear assignment)</option>
          ${optgroup('Revenue', REVENUE_CATEGORY_OPTIONS)}
          ${optgroup('Expense', EXPENSE_CATEGORY_OPTIONS)}
        </select></div>
      </div>
      <button type="submit">Save assignment</button>
    </form>
    <p><small>This writes directly into Connect's own board-category presentation store -- the same one the legacy in-Connect Chart of Accounts edits. It only relabels how this account is grouped on the Board view; the real ledger path and every QuickBooks sync/import are unchanged. Only Connect's own admin role may save; Connect independently re-verifies your identity and role for every request.</small></p>
  </section>`;
}

// Fallback for the tag-list form when connect.finance-board-layout.v1 (which carries the full
// saved tag list) cannot be read: every distinct purpose tag on the account rows already fetched.
// A tag no account currently wears is missing from this fallback list.
function deriveCurrentPurposeTags(rows) {
  const seen = new Map();
  for (const row of rows) {
    if (row.purpose_tag_id && row.purpose_tag_label && !seen.has(row.purpose_tag_id)) {
      seen.set(row.purpose_tag_id, row.purpose_tag_label);
    }
  }
  return [...seen.entries()].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label));
}

// Admin-only purpose-tag management -- relayed live to Connect's real
// finance_planning_purpose_tags store (see finance-purpose-tags-write-v1 in
// src/api-contracts-service.js), never stored in Finance's own database. Two separate forms
// posting to the same relay route: the first is a FULL REPLACE of the tag list itself (one
// "id,label" pair per line -- leave the id blank to mint a new one; a line taken out of the
// textarea is a tag taken out of the store, matching Connect's own purpose-tags PUT route
// exactly), prefilled with every tag this page currently knows about so renaming/adding/removing
// is a plain text edit rather than risking an accidental loss of an untouched tag. The second
// assigns one already-defined tag to one ledger leaf (category_path), which Connect MERGES into
// whatever is already saved -- the same reasoning as the board-category form above.
function renderPurposeTagsForms(currentTags, entryStatus, entryMessage, { listOnly = false } = {}) {
  const tagLines = currentTags.map((t) => `${t.id},${t.label}`).join('\n');
  const options = currentTags.map((t) => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.label)}</option>`).join('');
  return `<section aria-label="Manage purpose tags">
    ${renderSectionHeading({ eyebrow: 'Chart of Accounts', heading: 'Manage purpose tags', badge: 'Relayed live to Connect' })}
    ${entryStatus === 'ok' ? '<p class="status">Saved in Connect.</p>' : ''}
    ${entryStatus === 'error' ? `<p class="status status-error">Not saved: ${escapeHtml(entryMessage || 'unknown error')}</p>` : ''}
    <form method="POST" action="/api/v1/connect-purpose-tags-write">
      <div class="field"><label for="pt-tags">One tag per line: id,label (leave the id blank to add a new tag; take out a line to remove that tag)</label><textarea id="pt-tags" name="tags" rows="6">${escapeHtml(tagLines)}</textarea></div>
      <button type="submit">Save tag list</button>
    </form>
    ${listOnly ? '<p><small>Assign tags to accounts in the Budget layout above.</small></p>' : `<form method="POST" action="/api/v1/connect-purpose-tags-write">
      <div class="grid form-grid">
        <div class="field"><label for="pt-path">Ledger path</label><input id="pt-path" type="text" name="category_path" placeholder="e.g. Expenses:60000 Programs" required></div>
        <div class="field"><label for="pt-tag">Purpose tag</label><select id="pt-tag" name="purpose_tag_id">
          <option value="">— (clear assignment)</option>
          ${options}
        </select></div>
      </div>
      <button type="submit">Save assignment</button>
    </form>`}
    <p><small>Purpose tags are a second, independent axis over the same accounts the board-category assignment above already classifies -- one line can carry a board category ("Salaries") and a free-form purpose ("Youth") at once. Saving the tag list above sends the whole list as it stands -- every tag you want kept needs its own line, not just the one you're changing. Only Connect's own admin role may save; Connect independently re-verifies your identity and role for every request.</small></p>
  </section>`;
}

function flattenAccountHierarchy(nodes) {
  return nodes.flatMap((node) => [node, ...flattenAccountHierarchy(node.children)]);
}

export function renderAccountHierarchy(nodes) {
  return flattenAccountHierarchy(nodes).map((node) => {
    const presentation = node.account;
    return `<tr><td style="padding-left:${(0.85 + node.depth * 1.1).toFixed(2)}rem">${node.depth === 0 ? '<strong>' : ''}${escapeHtml(node.label)}${node.depth === 0 ? '</strong>' : ''}</td><td>${escapeHtml(node.path)}</td><td>${presentation ? escapeHtml(presentation.name) : '—'}</td><td>${presentation ? escapeHtml(presentation.boardCategoryLabel) : '—'}</td><td>${presentation?.purposeTagLabel ? escapeHtml(presentation.purposeTagLabel) : '—'}</td></tr>`;
  }).join('');
}

// The Chart of Accounts, as it was first designed: one page that says which category each account is
// read under and what each category is called. A Revenue block and an Expenses block; inside each, the
// categories as headings (renameable in place, with their place number) and the accounts under them in
// a grid, each with a dropdown to move it. Tick several accounts and use "Move ticked accounts to" to
// move them together. Names, categories, numbers, purpose tags and Hide save with one button. Display
// only: QuickBooks account numbers, names and groups are never touched. `rows` is every account the
// church has used (not just one year), so an old line can still be moved or hidden.
export function renderLayoutEditor(rows, layout, entryStatus, entryMessage, { editable = true } = {}) {
  const e = escapeHtml;
  const leaves = chartLeafRows(rows);
  const tagOptions = (selected) => `<option value="">No purpose</option>${layout.tags.map((t) => `<option value="${e(t.id)}"${t.id === selected ? ' selected' : ''}>${e(t.label)}</option>`).join('')}`;
  const revenueOrder = layout.revenueOrder || ['donor', 'earned', 'passive'];
  const expenseOrder = layout.expenseOrder || BOARD_EXPENSE_ORDER;
  // Restricted gifts stay with Unrestricted under the Donor Income heading, so they follow 'donor'.
  const revenueCats = revenueOrder.flatMap((k) => (k === 'donor' ? ['donor', 'restricted'] : [k]));
  const catOptions = (isRevenue, row, cats) => {
    const { key, assigned } = boardCategoryFor(layout, row.category_path, row.account_name, isRevenue);
    const fallback = defaultBoardCategory(row.account_name, isRevenue);
    return `<option value=""${assigned ? '' : ' selected'}>Automatic (${e(boardLabelFor(layout, fallback, isRevenue))})</option>${cats.map((k) => `<option value="${k}"${assigned && k === key ? ' selected' : ''}>${e(boardLabelFor(layout, k, isRevenue))}</option>`).join('')}`;
  };
  let index = 0;
  const accountRow = (row, isRevenue, cats) => {
    const customName = layout.accountLabels[row.category_path] || '';
    const shown = customName || row.account_name;
    const hidden = isHiddenAccount(layout, row.category_path);
    if (!editable) return `<div class="coa-row${hidden ? ' coa-hidden' : ''}"><span class="coa-label">${e(shown)}${customName ? ` <small>QuickBooks: ${e(row.account_name)}</small>` : ''}${hidden ? ' <small>hidden</small>' : ''}</span></div>`;
    const i = index++;
    const { key, assigned } = boardCategoryFor(layout, row.category_path, row.account_name, isRevenue);
    const tag = layout.tagCategories[row.category_path] || '';
    return `<div class="coa-row${hidden ? ' coa-hidden' : ''}">
      <input type="hidden" name="path_${i}" value="${e(row.category_path)}"><input type="hidden" name="side_${i}" value="${isRevenue ? 'revenue' : 'expense'}">
      <input type="hidden" name="orig_cat_${i}" value="${assigned ? key : ''}"><input type="hidden" name="orig_name_${i}" value="${e(shown)}"><input type="hidden" name="orig_tag_${i}" value="${e(tag)}"><input type="hidden" name="orig_hide_${i}" value="${hidden ? '1' : ''}">
      <input type="checkbox" name="select_${i}" value="1" aria-label="Select ${e(shown)}">
      <span class="coa-namebox"><input type="text" name="name_${i}" value="${e(shown)}" placeholder="${e(row.account_name)}" class="coa-name" aria-label="Display name for ${e(row.account_name)}" maxlength="120">${customName ? `<small class="coa-qb">QuickBooks: ${e(row.account_name)}</small>` : ''}</span>
      <select name="cat_${i}" class="coa-cat-select" aria-label="Category for ${e(shown)}">${catOptions(isRevenue, row, cats)}</select>
      <span class="coa-extra"><select name="tag_${i}" aria-label="Purpose for ${e(shown)}">${tagOptions(tag)}</select>
        <label><input type="checkbox" name="hide_${i}" value="1"${hidden ? ' checked' : ''}> Hide</label></span>
    </div>`;
  };
  const card = (isRevenue, title, sub, cats, positioned) => {
    const side = isRevenue ? 'revenue' : 'expense';
    const members = (key) => leaves
      .filter((r) => isRevenueClassification(r.classification) === isRevenue && boardCategoryFor(layout, r.category_path, r.account_name, isRevenue).key === key)
      .sort((x, y) => String(x.account_name).localeCompare(String(y.account_name), 'en', { numeric: true }));
    const total = cats.reduce((n, k) => n + members(k).length, 0);
    const groups = cats.map((key) => {
      const list = members(key);
      const label = boardLabelFor(layout, key, isRevenue);
      const place = positioned.indexOf(key) + 1;
      const number = editable && place
        ? `<label class="bp-place" title="Type another number and save to move ${e(label)}"><span>No.</span><input type="number" name="pos_${side}_${key}" value="${place}" min="1" max="${positioned.length}" class="bp-place-input" aria-label="Position of ${e(label)}"><input type="hidden" name="orig_pos_${side}_${key}" value="${place}"></label>`
        : '';
      const heading = editable
        ? `<input type="text" name="hl_${side}_${key}" value="${e(label)}" class="bp-name-input coa-heading-input" aria-label="Name of this category" maxlength="80"><input type="hidden" name="orig_hl_${side}_${key}" value="${e(label)}">`
        : `<b>${e(label)}</b>`;
      return `<div class="coa-group"><div class="coa-group-head">${number}${heading}<span class="coa-count">${list.length} ${list.length === 1 ? 'fund' : 'funds'}</span></div>
        ${list.length ? `<div class="coa-grid">${list.map((r) => accountRow(r, isRevenue, cats)).join('')}</div>` : '<div class="coa-empty">No funds read under this category yet.</div>'}</div>`;
    }).join('');
    const wrapper = isRevenue && editable
      ? `<label class="coa-wrapper-label">Donor Income heading on the budget <input type="text" name="hl_wrapper" value="${e(layout.donorWrapperLabel || DONOR_WRAPPER_DEFAULT_LABEL)}" maxlength="80"><input type="hidden" name="orig_hl_wrapper" value="${e(layout.donorWrapperLabel || DONOR_WRAPPER_DEFAULT_LABEL)}"></label>` : '';
    return `<div class="panel panel-spaced coa-card"><div class="coa-card-head"><h2>${title}</h2><span class="muted">${total} ${total === 1 ? 'fund' : 'funds'} · ${cats.length} categories</span></div>
      <p class="muted-line">${sub}</p>${wrapper}${groups}</div>`;
  };
  const bulkOptions = `<option value="">Choose a category…</option><optgroup label="Revenue">${revenueCats.map((k) => `<option value="revenue:${k}">${e(boardLabelFor(layout, k, true))}</option>`).join('')}<option value="revenue:">Automatic</option></optgroup><optgroup label="Expenses">${expenseOrder.map((k) => `<option value="expense:${k}">${e(boardLabelFor(layout, k, false))}</option>`).join('')}<option value="expense:">Automatic</option></optgroup>`;
  const status = entryStatus === 'ok' ? '<p class="status">Saved in Connect.</p>' : entryStatus === 'error' ? `<p class="status status-error">Not saved: ${e(entryMessage || 'unknown error')}</p>` : '';
  const body = `<div class="coa-page-head"><div><h2>Chart of Accounts</h2><p class="muted-line">Which category each fund is read under, and what each category is called · display only, QuickBooks is never renumbered</p></div>${editable ? '<button type="submit">Save changes</button>' : ''}</div>
    ${status}
    ${editable ? `<div class="coa-bulk"><label>Move ticked accounts to <select name="bulk_category">${bulkOptions}</select></label><span class="muted-line">Tick several accounts, choose a category, then Save changes.</span></div>` : ''}
    ${card(true, 'Revenue', 'Restricted giving reads as the second half of donor income, so both sit inside the Donor Income heading on the budget.', revenueCats, revenueOrder)}
    ${card(false, 'Expenses', 'The categories the board reads spending against.', expenseOrder, expenseOrder)}
    <p class="muted-line">Fund numbers, names and QuickBooks groups are untouched by anything on this page — the next export lands in exactly the same accounts. Only Connect’s reading of them changes, on the Budget planner, the Church Report and Financial Health alike. Hidden funds drop off the Budget planner while they have no money in the year shown.</p>`;
  return editable
    ? `<section id="layout" aria-label="Chart of Accounts"><form method="POST" action="/api/v1/connect-board-categories-write" class="coa-form"><input type="hidden" name="form_kind" value="accounts">${body}</form></section>`
    : `<section id="layout" aria-label="Chart of Accounts">${body}</section>`;
}

// Which fiscal year the chart shows: a plain GET form (the page runs no script), listing every
// year with ledger rows plus the one being shown.
function renderFiscalYearForm(fiscalYear, availableFiscalYears) {
  const years = [...new Set([fiscalYear, ...availableFiscalYears])].sort((a, b) => b - a);
  return `<form method="GET" action="/" class="inline-form" aria-label="Fiscal year">
    <input type="hidden" name="section" value="accounts"><input type="hidden" name="page" value="chart">
    <label for="coa-fiscal-year">Fiscal year</label>
    <select id="coa-fiscal-year" name="fiscal_year">${years.map((y) => `<option value="${y}"${y === fiscalYear ? ' selected' : ''}>FY${y}</option>`).join('')}</select>
    <button type="submit">Show</button>
  </form>`;
}

const money = (cents) => (cents === null || cents === undefined ? '—' : formatSignedCents(cents));

// The main table: legacy's two cards (Revenue, then Expenses), every board category in legacy's
// order with its accounts under it by display name, plus each account's and each category's year
// actual and budget. A category with no accounts still shows, as it does in legacy.
function renderChartTable(view, fiscalYear) {
  const e = escapeHtml;
  const fy = fiscalYear ? `FY${fiscalYear} ` : '';
  const figures = view.hasFigures;
  const amount = (cents, hasBudget = true) => `<td class="num">${figures && hasBudget ? money(cents) : '—'}</td>`;
  const leafRow = (leaf) => `<tr><td style="padding-left:1.95rem">${e(leaf.label)}<br><small>${leaf.label !== leaf.qbName ? `QuickBooks: ${e(leaf.qbName)} · ` : ''}${e(leaf.path)}${leaf.assigned ? '' : ' · automatic category'}</small></td>${amount(leaf.actualCents)}<td class="num">${leaf.budgetCents === null ? '—' : money(leaf.budgetCents)}</td><td>${leaf.purposeTagLabel ? e(leaf.purposeTagLabel) : '—'}</td></tr>`;
  const groupRows = (g) => `<tr><td style="padding-left:.85rem"><strong>${e(g.label)}</strong> <small>${g.items.length} account${g.items.length === 1 ? '' : 's'}</small></td>${amount(g.actualCents)}${amount(g.budgetCents, g.hasBudget)}<td></td></tr>${g.items.length
    ? g.items.map(leafRow).join('')
    : '<tr><td colspan="4" style="padding-left:1.95rem"><small>No accounts read under this category yet.</small></td></tr>'}`;
  const side = (title, totalLabel, s) => `<tr><td colspan="4"><strong>${title}</strong> <small>${s.count} account${s.count === 1 ? '' : 's'} · ${s.groups.length} categories</small></td></tr>${s.groups.map(groupRows).join('')}<tr><td><strong>${totalLabel}</strong></td>${amount(s.actualCents)}${amount(s.budgetCents, s.hasBudget)}<td></td></tr>`;
  return renderTable({
    head: ['Account', `${fy}Actual`, `${fy}Budget`, 'Purpose'],
    rows: side('Revenue', 'Total revenue', view.revenue) + side('Expenses', 'Total expenses', view.expense),
  }).replace(/<th>([^<]*(?:Actual|Budget))<\/th>/g, '<th class="num">$1</th>');
}

// Legacy finRenderPurposeReport: one row per saved purpose tag, with what is tagged under it. The
// payroll column is shown only when the viewer's role can read the Compensation plan.
function renderPurposeReport(purpose, fiscalYear, { payrollNote }) {
  const e = escapeHtml;
  const head = purpose.payrollAvailable
    ? ['Purpose', `Payroll (FY${fiscalYear + 1} plan)`, `Accounts (FY${fiscalYear} actual)`, 'Total', 'Tagged']
    : ['Purpose', `Accounts (FY${fiscalYear} actual)`, 'Tagged'];
  const rows = purpose.rows.map((r) => {
    const detail = [];
    if (r.workers.length) detail.push(`${r.workers.length} ${r.workers.length === 1 ? 'worker' : 'workers'}: ${r.workers.map(e).join(', ')}`);
    if (r.accounts.length) detail.push(`${r.accounts.length} ${r.accounts.length === 1 ? 'account' : 'accounts'}: ${r.accounts.map(e).join(', ')}`);
    const cells = purpose.payrollAvailable
      ? `<td class="num">${money(r.payrollCents)}</td><td class="num">${money(r.accountCents)}</td><td class="num"><strong>${money(r.totalCents)}</strong></td>`
      : `<td class="num">${money(r.accountCents)}</td>`;
    return `<tr><td><strong>${e(r.label)}</strong></td>${cells}<td><small>${detail.length ? detail.join(' · ') : 'Nothing tagged yet.'}</small></td></tr>`;
  }).join('');
  return `<section aria-label="Resources by Purpose">
    ${renderSectionHeading({ eyebrow: 'Chart of Accounts', heading: 'Resources by Purpose', badge: `FY${fiscalYear}` })}
    <p>Compensation workers and accounts tagged with a purpose, rolled up by purpose — a second view of the same dollars, alongside the board categories. An untagged worker or account does not appear here. A tagged account whose number matches a tagged worker's account is counted once, under the worker.</p>
    ${renderTable({ head, rows }).replace(/<th>((?:Payroll|Accounts|Total)[^<]*)<\/th>/g, '<th class="num">$1</th>')}
    ${payrollNote ? `<p><small>${e(payrollNote)}</small></p>` : ''}
  </section>`;
}

// Legacy's Resources by Purpose counts each tagged worker's full church cost from the Compensation
// plan (its raise projection for the year after the chart's year). `compensationProjection` is
// that projection when the viewer's role can read the plan and it could be built; otherwise the
// payroll column is left out and the note says why.
function purposePayroll(compensationProjection, canReadCompensation) {
  if (!canReadCompensation) {
    return { payroll: null, payrollNote: 'Payroll cost from the Compensation plan is shown only to roles that can open Compensation; the totals above are tagged accounts only.' };
  }
  if (!compensationProjection || !compensationProjection.ok) {
    return { payroll: null, payrollNote: 'The Compensation plan could not be read, so payroll cost is left out; the totals above are tagged accounts only.' };
  }
  const { model, computed } = compensationProjection;
  return { payroll: { roster: model.roster, computed, isExternallyFunded: model.isExternallyFunded }, payrollNote: '' };
}

export function renderAccountsPage(pageId, {
  accountsReport, canManageBoardCategories, boardCategoryEntryStatus, boardCategoryEntryMessage,
  canManagePurposeTags, purposeTagsEntryStatus, purposeTagsEntryMessage, boardLayout = null,
  compensationProjection = null, canReadCompensation = false,
}) {
  const isLive = accountsReport.source === 'live';
  const fiscalYear = isLive ? accountsReport.fiscalYear ?? null : null;
  const availableFiscalYears = accountsReport.availableFiscalYears || [];
  // The saved board layout when it could be read; otherwise the assignments, renames and tags the
  // chart rows themselves carry. Either way an account with no saved category shows the category
  // it is actually placed in (legacy's name-based default), marked automatic.
  const layout = boardLayout && isLive ? boardLayout : layoutFromChartRows(accountsReport.rows);
  const rows = accountsReport.rows.map((row) => {
    const isRevenue = isRevenueClassification(row.classification);
    const { key, assigned } = boardCategoryFor(layout, row.category_path, row.account_name, isRevenue);
    const label = boardLabelFor(layout, key, isRevenue);
    return { ...row, board_category_key: key, board_category_label: assigned ? label : `${label} (automatic)` };
  });
  const report = buildAccountsReportView(rows);
  const view = buildChartOfAccountsView(rows, layout);
  const { payroll, payrollNote } = purposePayroll(compensationProjection, canReadCompensation);
  const purpose = buildPurposeTotals(view, layout, payroll);
  const latestYear = availableFiscalYears.length ? Math.max(...availableFiscalYears) : null;
  const emptyYear = fiscalYear !== null && view.leaves.length === 0;
  // One list, the one you edit: every account the church has used, grouped by category. The spending
  // report by purpose follows, then the purpose-tag list.
  const editor = renderLayoutEditor(accountsReport.layoutRows || report.rows, layout, boardCategoryEntryStatus, boardCategoryEntryMessage, { editable: Boolean(canManageBoardCategories && isLive && boardLayout) });
  return `${editor}
  ${fiscalYear !== null && boardLayout && layout.tags.length ? `<section class="report" aria-label="Resources by purpose">${renderFiscalYearForm(fiscalYear, availableFiscalYears)}
    ${emptyYear ? `<p class="status status-pending">No ledger rows are on file for FY${fiscalYear} yet.${latestYear !== null && latestYear !== fiscalYear ? ` <a href="/?section=accounts&amp;page=chart&amp;fiscal_year=${latestYear}">Show FY${latestYear}</a>` : ''}</p>` : ''}</section>${renderPurposeReport(purpose, fiscalYear, { payrollNote })}` : ''}
  ${canManagePurposeTags
    ? renderPurposeTagsForms(boardLayout ? boardLayout.tags.map((t) => ({ id: t.id, label: t.label })) : deriveCurrentPurposeTags(report.rows), purposeTagsEntryStatus, purposeTagsEntryMessage, { listOnly: Boolean(boardLayout && isLive && canManageBoardCategories) })
    : ''}`;
}
