import {
  buildBalanceSheetView, buildLiveBalanceSheetView, buildBalanceTree, filterZeroBalanceTree, flattenBalanceTree,
  buildPriorBalanceLookup, presentNetAssets, buildLayPosition, MORTGAGE_HISTORY_FROM_YEAR,
} from './balance-sheet-service.js';
import { escapeHtml, formatCents, renderKpiCards, renderSectionHeading, renderTable } from './render-helpers.js';
import { csvText } from './payroll-report-render.js';

// Admin-only Balance Sheet / Statement of Financial Position .xlsx import -- relayed live to
// Connect's real finance_church_balances table (see finance-church-balances-xlsx-import-v1 in
// src/api-contracts-service.js), never stored in Finance's own database. Same shape as
// church-pages.js's renderChurchBudgetXlsxImportForm: a real `<input type="file">` upload
// (multipart/form-data), followed by a no-write preview and separate selective-commit relay.
// Both the fiscal year AND the as-of date are read from the workbook
// itself, so there is no form field for either.
function renderBalanceXlsxImportForm(entryStatus, entryMessage) {
  return `<section aria-label="Import Balance Sheet from Excel">
    ${renderSectionHeading({ eyebrow: 'Balance Sheet', heading: 'Import Statement of Financial Position (.xlsx)', badge: 'Relayed live to Connect' })}
    ${entryStatus === 'ok' ? '<p class="status">Imported into Connect.</p>' : ''}
    ${entryStatus === 'error' ? `<p class="status status-error">Not imported: ${escapeHtml(entryMessage || 'unknown error')}</p>` : ''}
    <form method="POST" action="/api/v1/connect-church-balances-xlsx-preview" enctype="multipart/form-data">
      <div class="field"><label for="bbx-file">QuickBooks "Statement of Financial Position" export (.xlsx, max 15 MB)</label><input id="bbx-file" type="file" name="file" accept=".xlsx" required></div>
      <button type="submit">Review file</button>
    </form>
    <p><small>First parses the workbook without changing data. After reviewing and selecting rows, the confirmed rows write directly into Connect's own <code>finance_church_balances</code> table, tagged <code>source='import'</code> -- the same table and source the legacy in-Connect Excel import writes, superseding prior imported rows for that fiscal year. Only Connect's own admin role may import; Connect independently re-verifies identity and role for both steps.</small></p>
  </section>`;
}

// "Statement of Financial Position" multi-year .xlsx import -- relayed live to Connect's real
// finance_church_balances table (source='import', same as the single-snapshot import above),
// never stored in Finance's own database. Shown only on Multi-year position, the page whose
// underlying data (every fiscal year on file) this import directly feeds -- see
// importChurchBalancesMultiYearXlsx's header comment in src/api-finance.js. Unlike
// renderBalanceXlsxImportForm above, this form is NOT admin-only: the legacy finance/church/
// balances/multi-year-import(-preview) route carries no isAdmin check of its own, only the same
// blanket "finance edit" ACCESS_GATE every finance/church/* route not explicitly listed in
// financeSegItems falls through to (verified directly against src/api-chms.js's source) --
// Connect's own contract handler re-derives that real permission-matrix check independently of
// what this form shows or hides (UI hiding is never authorization).
function renderBalanceMultiYearXlsxImportForm(entryStatus, entryMessage) {
  return `<section aria-label="Import multi-year Statement of Financial Position from Excel">
    ${renderSectionHeading({ eyebrow: 'Balance Sheet', heading: 'Import Statement of Financial Position, multi-year (.xlsx)', badge: 'Relayed live to Connect' })}
    ${entryStatus === 'ok' ? '<p class="status">Imported into Connect.</p>' : ''}
    ${entryStatus === 'error' ? `<p class="status status-error">Not imported: ${escapeHtml(entryMessage || 'unknown error')}</p>` : ''}
    <form method="POST" action="/api/v1/connect-church-balances-multi-year-xlsx-preview" enctype="multipart/form-data">
      <div class="field"><label for="bbmy-file">QuickBooks "Statement of Financial Position" multi-year export (.xlsx, max 15 MB)</label><input id="bbmy-file" type="file" name="file" accept=".xlsx" required></div>
      <button type="submit">Review file</button>
    </form>
    <p><small>Parses without changing data, then lets you select the fiscal-year balance rows to commit through Connect's existing permission-checked importer.</small></p>
  </section>`;
}

export function renderBalanceRows(rows) {
  return rows.map((row) => `<tr><td>${escapeHtml(row.classification)}</td><td>${escapeHtml(row.account_name)}</td><td>${formatCents(row.own_balance_cents)}</td></tr>`).join('');
}

// Live rows carry the contract's own camelCase shape (see balance-sheet-service.js's
// buildLiveBalanceSheetView) -- ownBalanceCents is never null (confirmed 2026-09-14: unlike
// Church Report's budgetCents, this contract has no nullable dollar field at all), so unlike
// renderLiveChurchRows there is no '--' case to handle here.
export function renderLiveBalanceRows(rows) {
  return rows.map((row) => `<tr><td>${escapeHtml(row.classification)}</td><td>${escapeHtml(row.accountName)}</td><td>${formatCents(row.ownBalanceCents)}</td></tr>`).join('');
}

export function renderBalanceTrendRows(rows) {
  return rows.map((row) => `<tr><td>${row.fiscal_year}</td><td>${escapeHtml(row.as_of_date)}</td><td>${formatCents(row.assets_cents)}</td><td>${formatCents(row.liabilities_cents)}</td><td>${formatCents(row.net_assets_cents)}</td></tr>`).join('');
}

// ── Shared pieces for the parity sections ───────────────────────────────────────────────────────
// Everything below renders figures Connect's legacy Balance Sheet & Financial Position tab
// (finRenderBalanceSheetTab, src/frontend/js-finance.js) shows, from the same contract figures.
// Finance's page policy allows no script, so the tab's buttons become GET forms and links, and its
// charts become plain CSS columns; tooltips are `title` attributes and every chart has a table
// with the same figures beneath it.

const exactMoney = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
function formatExactCents(cents) {
  return exactMoney.format(Math.abs(Number(cents || 0)) / 100);
}

function balanceHref(page, params = {}) {
  const query = new URLSearchParams({ section: 'balance', page });
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') query.set(key, String(value));
  }
  return `/?${query.toString()}`;
}

function panelHeading(title, note = '') {
  return `<h3 class="bs-h">${escapeHtml(title)}</h3>${note ? `<p class="bs-note">${note}</p>` : ''}`;
}

function toneClass(delta) {
  return delta > 0 ? 'bs-up' : delta < 0 ? 'bs-down' : 'bs-flat';
}

function signedChange(delta) {
  if (delta > 0) return `+${formatCents(delta)}`;
  if (delta < 0) return `−${formatCents(-delta)}`;
  return formatCents(0);
}

// Same arithmetic as Connect's finGrowthCellsHtml: change against the prior figure, percentage of
// the prior figure's absolute value, and a dash when the prior figure is zero.
function growthCells(cur, prior) {
  const delta = cur - prior;
  const pct = prior !== 0 ? delta / Math.abs(prior) * 100 : null;
  const tone = toneClass(delta);
  return `<td class="num">${formatCents(cur)}</td><td class="num ${tone}">${signedChange(delta)}</td>`
    + `<td class="num ${tone}">${pct === null ? '—' : `${delta >= 0 ? '+' : ''}${pct.toFixed(1)}%`}</td>`;
}

function renderPlainTable(head, rows, className = '') {
  return `<div class="table-wrap"><table class="bs-table${className ? ` ${className}` : ''}"><thead><tr>${head.map((cell) => {
    const [label, numeric] = Array.isArray(cell) ? cell : [cell, false];
    return `<th${numeric ? ' class="num"' : ''}>${escapeHtml(label)}</th>`;
  }).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

// The Assets = Liabilities + Net assets check, worded as the subtraction a lay reader follows.
export function renderBalanceCheck(balancedCents) {
  return Math.abs(balancedCents) < 1
    ? '<p class="bs-check is-ok">✓ Adds up: what we own − what we owe = net assets</p>'
    : `<p class="bs-check is-off">⚠ Off by ${formatExactCents(balancedCents)} — check the import for a missing or misclassified account.</p>`;
}

function renderYearControls(page, selection, fiscalYear, { extraHidden = '' } = {}) {
  return `<form method="GET" action="/" class="bs-controls no-print" aria-label="Choose the balance sheet year">
      <input type="hidden" name="section" value="balance"><input type="hidden" name="page" value="${escapeHtml(page)}">${extraHidden}
      <label>Balance sheet for <input type="number" name="fiscal_year" min="2000" max="2100" value="${fiscalYear}"></label>
      <button type="submit">Show year</button>
      <a href="${escapeHtml(balanceHref(page, { fiscal_year: fiscalYear - 1, zero: selection?.hideZero === false ? 'show' : '' }))}">← ${fiscalYear - 1}</a>
      <a href="${escapeHtml(balanceHref(page, { fiscal_year: fiscalYear + 1, zero: selection?.hideZero === false ? 'show' : '' }))}">${fiscalYear + 1} →</a>
    </form>${selection?.yearError ? `<p class="status status-error">${escapeHtml(selection.yearError)} Showing ${fiscalYear}.</p>` : ''}`;
}

// ── Lay position (own − owe = net assets; usable money vs. property) ───────────────────────────
// See buildLayPosition in balance-sheet-service.js for how each figure is drawn from the account
// tree.
function layRows(lines) {
  return lines.filter(Boolean).map(([label, cents, opts = {}]) => `<tr${opts.total ? ' class="bs-group-row"' : ''}><td${opts.indent ? ' style="padding-left:30px"' : ''}>${label}</td><td class="num">${cents === null ? '—' : formatCents(cents)}</td></tr>`).join('');
}
function layTable(lines) {
  return `<div class="table-wrap"><table class="bs-table bs-lay"><tbody>${layRows(lines)}</tbody></table></div>`;
}
// The LCEF loan began in spring 2013, before the books tracked it. No 2013 note is on hand, so this
// is an estimate (Andrew, September 27, 2026): the 2018 payments fit a 20-year loan at 4.5% with a
// $3,827.38 payment and exactly 180 payments left in March 2018, which amortizes back to $604,977
// in spring 2013 (and reproduces the Dec 2019 balance to within 3 cents). A lump-sum payoff from
// the house sold out of the same loan would make the real figure higher. Replace with the amount
// on the LCEF note or deed of trust when it is found; set to null to hide the line.
export const ORIGINAL_PROPERTY_LOAN = { cents: 60500000, label: '2013, estimated' };

function renderLayProperty(lay, valuation, history) {
  const p = lay.property;
  const original = ORIGINAL_PROPERTY_LOAN && ORIGINAL_PROPERTY_LOAN.cents > 0 ? ORIGINAL_PROPERTY_LOAN : null;
  const startCents = original ? original.cents : p.bookCents;
  const paidCents = startCents - p.mortgageCents;
  const paidPct = startCents ? paidCents / startCents * 100 : 0;
  const hasValue = valuation && valuation.capitalizedValueCents > 0;
  const valueNote = hasValue
    ? `<p class="bs-note">Current valuation is estimated from the rent roll and operating costs at a ${(valuation.capRate * 100).toFixed(1)}% cap rate${valuation.asOfDate ? `, as of ${escapeHtml(valuation.asOfDate)}` : ''} (Commercial Property → Valuation).</p>`
    : '';
  const rows = [
    original ? [`Original loan <small>(${escapeHtml(original.label)})</small>`, original.cents] : null,
    ['Loan amount on the books <small>(recorded March 2018)</small>', p.bookCents],
    ['Mortgage left', p.mortgageCents],
    ['<b>Owned free of debt, on the books</b>', p.equityCents, { total: true }],
    hasValue ? ['Current valuation <small>(income method)</small>', valuation.capitalizedValueCents] : null,
    hasValue ? ['<b>Owned free of debt, at current valuation</b>', valuation.capitalizedValueCents - p.mortgageCents, { total: true }] : null,
  ];
  const meter = startCents > 0
    ? `<ul class="bs-meters"><li><span>Loan paid down${original ? ` <small>(from the original loan, ${escapeHtml(original.label)})</small>` : ''}</span><span class="bs-meter" aria-hidden="true"><i style="width:${Math.max(0, Math.min(100, paidPct)).toFixed(1)}%"></i></span><span class="num">${formatCents(paidCents)} of ${formatCents(startCents)} · ${paidPct.toFixed(0)}%</span></li></ul>`
    : '';
  return `<div class="bs-panel" aria-label="Property">
      ${panelHeading('Property (not spendable)', 'The commercial property. The books carry it at the loan amount, not its market value.')}
      ${layTable(rows)}
      ${valueNote}
      ${meter}
      ${renderMortgageHistory(p.bookCents, history, original)}
    </div>`;
}

// Year-end mortgage left for each year with a balance sheet on file, measured against the loan
// amount on the books, so the council can see the progress year by year. The recording year's
// paydown is measured from the amount recorded; any other first year has no prior to compare.
// A year whose sheet is not a December 31 close is marked "so far".
// "Paid down" is measured from the original loan when one is set, else from the amount recorded.
export function renderMortgageHistory(bookCents, history, original = null) {
  if (!history || !history.length) return '';
  const startCents = original ? original.cents : bookCents;
  let prior = history[0].fiscalYear === MORTGAGE_HISTORY_FROM_YEAR ? bookCents : null;
  const rows = history.map((h) => {
    const partial = h.asOfDate && !/dec(ember)?\.?\s*31|-12-31/i.test(h.asOfDate);
    const paidThisYear = prior === null ? null : prior - h.mortgageCents;
    prior = h.mortgageCents;
    const paid = startCents - h.mortgageCents;
    const pct = startCents ? paid / startCents * 100 : 0;
    return `<tr><td>${h.fiscalYear}${partial ? ' <small>(so far)</small>' : ''}</td><td class="num">${formatCents(h.mortgageCents)}</td><td class="num">${paidThisYear === null ? '—' : formatCents(paidThisYear)}</td><td class="num">${formatCents(paid)} · ${pct.toFixed(0)}%</td></tr>`;
  }).join('');
  return `<h4 class="bs-h">Mortgage progress by year</h4>
    <p class="bs-note">Mortgage left at each year’s balance sheet. Years without an imported balance sheet are not shown; import the multi-year Statement of Financial Position to fill them in.</p>
    ${renderPlainTable(['Year', ['Mortgage left', true], ['Paid that year', true], [original ? 'Paid down from original loan' : 'Paid down since recorded', true]], rows)}`;
}

// ── Council view (Andrew, September 27, 2026) ─────────────────────────────────────────────────
// The council reads finances the way a household does: what money do we have, what do we owe,
// how much of it is already promised, and are we ahead or behind since last year. So Position
// shows those questions in plain words with a "last year-end" column beside each, and leaves the
// bookkeeping vocabulary (net assets, equity, the balancing check) to Account detail and the
// bookkeeper's own reports. Designated funds are shown one by one, like envelopes in one wallet,
// with how many times over the church's money covers them.

// Known reasons behind an investment change, by the year being viewed. The balance sheet alone
// cannot tell a withdrawal from a market move, so a recorded withdrawal is shown beside the change.
export const INVESTMENT_YEAR_NOTES = {
  2026: { withdrawnCents: 3000000, reason: 'to cover expenses' },
};

function findMatch(list, item) {
  if (!list) return null;
  return (item.code && list.find((x) => x.code === item.code)) || list.find((x) => x.label.toLowerCase() === item.label.toLowerCase()) || null;
}
// Green means good news: more money, or less owed. A debt row inverts the color; a set-aside
// subtraction is neither good nor bad news on its own, so it stays neutral.
function changeCell(now, before, tone) {
  if (before === null || before === undefined) return '<td class="num">—</td>';
  const delta = now - before;
  const cls = tone === 'neutral' ? 'bs-flat' : toneClass(tone === 'debt' ? -delta : delta);
  return `<td class="num ${cls}">${signedChange(delta)}</td>`;
}
function compareRow(label, now, before, { total = false, indent = false, tone = 'asset' } = {}) {
  return `<tr${total ? ' class="bs-group-row"' : ''}><td${indent ? ' style="padding-left:30px"' : ''}>${label}</td><td class="num">${formatCents(now)}</td><td class="num">${before === null || before === undefined ? '—' : formatCents(before)}</td>${changeCell(now, before, tone)}</tr>`;
}
function compareTable(priorLabel, rows) {
  return renderPlainTable(['', ['Now', true], [priorLabel, true], ['Change', true]], rows.filter(Boolean).join(''));
}
function upDown(delta) { return `${delta < 0 ? 'down' : 'up'} ${formatCents(Math.abs(delta))}`; }

function renderCouncilPosition({ lay, prior, priorLabel, fiscalYear, valuation, history, equityReclass }) {
  const p = prior;
  const money = lay.money.cashAndInvestmentsCents;
  const priorMoney = p ? p.money.cashAndInvestmentsCents : null;
  const groupsOf = (l) => (l.investmentGroups.length ? l.investmentGroups : [{ label: 'Investments', code: null, cents: l.own.investmentsCents }]);
  const groups = groupsOf(lay);
  const priorGroups = p ? groupsOf(p) : null;
  const value = valuation && valuation.capitalizedValueCents > 0 ? valuation.capitalizedValueCents : null;

  const have = compareTable(priorLabel, [
    compareRow('Cash in checking', lay.own.cashCents, p ? p.own.cashCents : null),
    ...groups.map((g) => compareRow(`Investments: ${escapeHtml(g.label.toLowerCase())}`, g.cents, priorGroups ? (findMatch(priorGroups, g)?.cents ?? 0) : null)),
    compareRow('<b>Total money</b>', money, priorMoney, { total: true }),
  ]) + `<p class="bs-note">Also owned: the commercial property${value ? `, worth about ${formatCents(value)}` : ''} (see Property below)${lay.own.otherAssetsCents ? `, and ${formatCents(lay.own.otherAssetsCents)} of prepaid bills and tax holding that is not spendable` : ''}.</p>`;

  const mortgageDelta = p ? p.owe.longTermCents - lay.owe.longTermCents : null;
  const owe = compareTable(priorLabel, [
    compareRow('Bills and payroll due now', lay.owe.shortTermCents, p ? p.owe.shortTermCents : null, { tone: 'debt' }),
    compareRow(`Mortgage on the commercial property${mortgageDelta > 0 ? ` <small>(${formatCents(mortgageDelta)} paid down)</small>` : ''}`, lay.owe.longTermCents, p ? p.owe.longTermCents : null, { tone: 'debt' }),
  ]);

  const setAside = compareTable(priorLabel, [
    compareRow('Total money', money, priorMoney),
    compareRow('− Bills due now', -lay.owe.shortTermCents, p ? -p.owe.shortTermCents : null, { indent: true, tone: 'neutral' }),
    compareRow('− Designated funds <small>(listed below)</small>', -lay.money.designatedCents, p ? -p.money.designatedCents : null, { indent: true, tone: 'neutral' }),
    compareRow('− Endowment principal <small>(can never be spent)</small>', -lay.money.endowmentCents, p ? -p.money.endowmentCents : null, { indent: true, tone: 'neutral' }),
    compareRow('<b>= Free for the council to direct</b>', lay.money.freeCents, p ? p.money.freeCents : null, { total: true }),
  ]);

  // Every fund with a balance now or at last year-end; a fund closed since then reads $0 now.
  const funds = [...lay.designatedFunds];
  if (p) for (const f of p.designatedFunds) if (!findMatch(funds, f) && f.cents !== 0) funds.push({ ...f, cents: 0 });
  const priorFund = (f) => (p ? (findMatch(p.designatedFunds, f)?.cents ?? 0) : null);
  const fundRows = funds.filter((f) => f.cents !== 0 || (priorFund(f) || 0) !== 0)
    .sort((a, b) => b.cents - a.cents)
    .map((f) => compareRow(escapeHtml(f.label), f.cents, priorFund(f), { tone: 'neutral' }));
  const coverage = lay.money.designatedCents > 0 ? money / lay.money.designatedCents : null;
  const coverageNote = coverage === null ? ''
    : coverage >= 1
      ? ` Checking and investments hold ${formatCents(money)}, enough to cover every fund ${coverage >= 2 ? `${coverage.toFixed(1)} times over` : 'in full'}.`
      : ` Checking and investments hold ${formatCents(money)}, less than the funds’ total.`;

  const bullets = [];
  if (p) {
    const invDelta = lay.own.investmentsCents - p.own.investmentsCents;
    const note = INVESTMENT_YEAR_NOTES[fiscalYear];
    const market = note ? invDelta + note.withdrawnCents : null;
    const invText = note
      ? `investments are ${upDown(invDelta)}, including ${formatCents(note.withdrawnCents)} taken out ${escapeHtml(note.reason)}${market ? `; the market is ${upDown(market)}` : ''}`
      : `investments are ${upDown(invDelta)}`;
    bullets.push(`<li><b>Money:</b> ${upDown(money - priorMoney)} since ${escapeHtml(priorLabel.toLowerCase())}. Checking is ${upDown(lay.own.cashCents - p.own.cashCents)}; ${invText}.</li>`);
    const paidOff = ORIGINAL_PROPERTY_LOAN && ORIGINAL_PROPERTY_LOAN.cents > 0
      ? ` ${((ORIGINAL_PROPERTY_LOAN.cents - lay.owe.longTermCents) / ORIGINAL_PROPERTY_LOAN.cents * 100).toFixed(0)}% paid off since the loan began.` : '';
    bullets.push(`<li><b>Mortgage:</b> ${mortgageDelta >= 0 ? `${formatCents(mortgageDelta)} paid down` : `up ${formatCents(-mortgageDelta)}`} since ${escapeHtml(priorLabel.toLowerCase())}.${paidOff}</li>`);
    const freeDelta = lay.money.freeCents - p.money.freeCents;
    bullets.push(`<li><b>Free to direct:</b> ${Math.abs(freeDelta) < 500000 ? `about the same (${signedChange(freeDelta)})` : upDown(freeDelta)}.</li>`);
  }

  return `${renderKpiCards([
      { label: 'Total money', value: formatCents(money), hint: 'Checking and investments' },
      { label: 'Free for the council to direct', value: formatCents(lay.money.freeCents), hint: 'After bills, designated funds and endowment principal' },
      { label: 'Mortgage left', value: formatCents(lay.owe.longTermCents), hint: 'Commercial property' },
    ])}
    <div class="bs-panel" aria-label="What we have">${panelHeading('What we have')}${have}</div>
    <div class="bs-panel" aria-label="What we owe">${panelHeading('What we owe')}${owe}</div>
    <div class="bs-panel" aria-label="How the money is set aside">${panelHeading('How the money is set aside')}${setAside}</div>
    ${fundRows.length ? `<div class="bs-panel" aria-label="Designated funds">${panelHeading('Designated funds', `Each fund is tracked to the penny, like envelopes in one wallet. The money is kept together in the church’s checking and investment accounts.${coverageNote}`)}${compareTable(priorLabel, [...fundRows, compareRow('<b>Total</b>', lay.money.designatedCents, p ? p.money.designatedCents : null, { total: true, tone: 'neutral' })])}</div>` : ''}
    ${bullets.length ? `<div class="bs-panel" aria-label="Are we ahead or behind">${panelHeading('Are we ahead or behind?')}<ul class="bs-plain">${bullets.join('')}</ul></div>` : ''}
    ${renderLayProperty(lay, valuation, history)}
    ${renderUnclassifiedWarning(equityReclass)}`;
}

function renderUnclassifiedWarning(equityReclass) {
  if (!equityReclass || !equityReclass.unclassified.length) return '';
  return `<div class="bs-warn">
      <p><b>⚠ ${equityReclass.unclassified.length} account(s) need a Donor-Restricted classification decision.</b> New or renamed accounts near the existing restricted-fund groups are not counted as promised until they are reviewed and added to the classification table.</p>
      ${renderPlainTable(['Account', ['Balance', true]], equityReclass.unclassified.map((u) => `<tr><td>${escapeHtml(u.accountName)}</td><td class="num">${formatCents(u.ownBalanceCents)}</td></tr>`).join(''))}
    </div>`;
}

// Connect's finRenderBalanceYoyCard: every account on this year's sheet (its structure is the
// reading), compared with the same account's prior-year rolled-up total (by path, else by account
// number or name -- see buildPriorBalanceLookup); an account with no prior entry reads "new this
// year" rather than a misleading $0.
function renderYearOverYear(accounts, fiscalYear, prior) {
  const priorYear = fiscalYear - 1;
  const heading = panelHeading(`${fiscalYear} vs. ${priorYear}`);
  if (!prior || !prior.ok || !prior.accounts.length) {
    const why = prior && !prior.ok && prior.reason !== 'not_configured'
      ? `The ${priorYear} balance sheet could not be read just now (${escapeHtml(prior.reason)}).`
      : `No ${priorYear} balance sheet on file yet &mdash; import one to see a year-over-year comparison here.`;
    return `<div class="bs-panel" aria-label="Year over year">${heading}<p class="bs-note">${why}</p></div>`;
  }
  const current = presentNetAssets(accounts).accounts;
  const priorOf = buildPriorBalanceLookup(presentNetAssets(prior.accounts).accounts, current);
  const rows = flattenBalanceTree(buildBalanceTree(current)).map((node) => {
    const group = node.children.length > 0;
    const indent = `style="padding-left:${14 + node.depth * 16}px"`;
    const cls = group ? ' class="bs-group-row"' : '';
    const priorCents = priorOf(node);
    if (priorCents === undefined) {
      return `<tr${cls}><td ${indent}>${escapeHtml(node.label)}</td><td class="num">${formatCents(node.totalBalanceCents)}</td><td class="num">—</td><td class="num bs-flat">new this year</td><td class="num">—</td></tr>`;
    }
    const delta = node.totalBalanceCents - priorCents;
    const pct = priorCents !== 0 ? delta / Math.abs(priorCents) * 100 : null;
    const tone = toneClass(delta);
    return `<tr${cls}><td ${indent}>${escapeHtml(node.label)}</td><td class="num">${formatCents(node.totalBalanceCents)}</td><td class="num">${formatCents(priorCents)}</td>`
      + `<td class="num ${tone}">${signedChange(delta)}</td><td class="num ${tone}">${pct === null ? '—' : `${delta >= 0 ? '+' : ''}${pct.toFixed(1)}%`}</td></tr>`;
  }).join('');
  return `<div class="bs-panel" aria-label="Year over year">${heading}
      <p class="bs-note">Every account on the ${fiscalYear} balance sheet, compared line by line with the same account’s ${priorYear} total.</p>
      ${renderPlainTable(['Account', [String(fiscalYear), true], [String(priorYear), true], ['Change', true], ['%', true]], rows, 'bs-tree')}
    </div>`;
}

// ── Account detail ─────────────────────────────────────────────────────────────────────────────
// Connect's "Full account detail": the indented tree with rolled-up subtotals, zero-balance lines
// hidden by default. Returns the table plus how many zero lines were left out.
export function renderBalanceDetailTree(accounts, { hideZero = true } = {}) {
  const full = buildBalanceTree(presentNetAssets(accounts).accounts);
  const shown = filterZeroBalanceTree(full, { hideZero });
  const shownCount = flattenBalanceTree(shown).length;
  const hiddenCount = flattenBalanceTree(full).length - shownCount;
  const rows = flattenBalanceTree(shown).map((node) => `<tr${node.children.length ? ' class="bs-group-row"' : ''}><td style="padding-left:${14 + node.depth * 16}px">${escapeHtml(node.label)}</td><td class="num">${formatCents(node.totalBalanceCents)}</td></tr>`).join('');
  return { html: renderPlainTable(['Account', ['Balance', true]], rows, 'bs-tree'), hiddenCount };
}

// Account detail still accounts for every QuickBooks equity line the lay presentation combined.
function renderFoldedEquityNote(accounts) {
  const { folded } = presentNetAssets(accounts);
  if (!folded.length) return '';
  const into = { prior: 'Built up in prior years', current: 'This year so far' };
  return `<details class="bs-note"><summary>Which QuickBooks lines make up “Built up in prior years” and “This year so far”</summary>
      <p>QuickBooks keeps business-style equity accounts. They are combined here so the sheet reads as what we own minus what we owe; the total is unchanged.</p>
      ${renderPlainTable(['QuickBooks line', 'Shown as', ['Balance', true]], folded.map((f) => `<tr><td>${escapeHtml(f.accountName)}</td><td>${into[f.into]}</td><td class="num">${formatCents(f.ownBalanceCents)}</td></tr>`).join(''))}
    </details>`;
}

function renderZeroToggle(selection, fiscalYear, hiddenCount) {
  const showing = selection?.hideZero === false;
  return `<p class="bs-note no-print">${showing
    ? `Showing zero-balance lines. <a href="${escapeHtml(balanceHref('account-detail', { fiscal_year: fiscalYear }))}">Hide zero-balance lines</a>`
    : `${hiddenCount ? `${hiddenCount} zero-balance line${hiddenCount === 1 ? '' : 's'} hidden. ` : 'Zero-balance lines are hidden. '}<a href="${escapeHtml(balanceHref('account-detail', { fiscal_year: fiscalYear, zero: 'show' }))}">Show zero-balance lines</a>`}</p>`;
}

// ── Multi-year charts and tables ───────────────────────────────────────────────────────────────
const TREND_SERIES = {
  current: { label: 'Current assets', cls: 's-current' },
  fixed: { label: 'Fixed assets', cls: 's-fixed' },
  other: { label: 'Other assets', cls: 's-other' },
  liabilities: { label: 'Liabilities', cls: 's-liabilities' },
  equity: { label: 'Net assets', cls: 's-equity' },
  operating: { label: 'Operating checking', cls: 's-operating' },
  allCash: { label: 'All cash & bank accounts', cls: 's-allcash' },
};

function compactDollars(cents) {
  return `$${Math.round(cents / 100 / 1000).toLocaleString('en-US')}k`;
}

// A grouped column chart in CSS: one group per year, one column per entry in `columns`, each
// column a stack of segments drawn bottom-up. Heights share one scale (the tallest column);
// negative figures draw as empty, the same caveat as Connect's own bar charts.
function renderColumnChart({ label, years, columns, legendKeys }) {
  const positive = (cents) => Math.max(0, cents || 0);
  const columnTotal = (year, column) => column.segments.reduce((total, seg) => total + positive(seg.cents(year)), 0);
  const max = Math.max(1, ...years.flatMap((year) => columns.map((column) => columnTotal(year, column))));
  const groups = years.map((year) => {
    const cols = columns.map((column) => {
      const total = columnTotal(year, column);
      const segs = column.segments.map((seg) => {
        const cents = seg.cents(year);
        const share = total ? positive(cents) / total * 100 : 0;
        return `<span class="bs-seg ${TREND_SERIES[seg.key].cls}" style="height:${share.toFixed(2)}%" title="${escapeHtml(seg.title(year, cents))}"></span>`;
      }).join('');
      return `<div class="bs-col" style="height:${Math.max(total ? 1 : 0, total / max * 100).toFixed(2)}%">${segs}</div>`;
    }).join('');
    return `<div class="bs-year"><div class="bs-cols">${cols}</div><span>${year.fiscalYear}</span></div>`;
  }).join('');
  const legend = legendKeys.map((key) => `<span class="key ${TREND_SERIES[key].cls}"></span>${escapeHtml(TREND_SERIES[key].label)}`).join(' ');
  return `<div class="bs-chart" role="img" aria-label="${escapeHtml(label)}">${groups}</div><p class="bs-legend">${legend}</p>`;
}

// Connect's finRenderBalanceMultiYearChart: the Assets column stacked into current/fixed/other
// (other only offered when some year has any), beside plain Liabilities and Net assets columns.
function renderTrendChart(years) {
  if (!years.some((y) => y.assetsCents || y.liabilitiesCents || y.equityCents)) return '';
  const anyOther = years.some((y) => (y.otherAssetsCents || 0) !== 0);
  const assetTitle = (key) => (y, cents) => `${TREND_SERIES[key].label} ${y.fiscalYear}: ${formatExactCents(cents)}${cents < 0 ? ' (negative)' : ''} (total assets ${formatExactCents(y.assetsCents)})`;
  const plainTitle = (key) => (y, cents) => `${TREND_SERIES[key].label} ${y.fiscalYear}: ${cents < 0 ? '−' : ''}${formatExactCents(cents)}`;
  const assetSegments = [
    { key: 'current', cents: (y) => y.currentAssetsCents, title: assetTitle('current') },
    { key: 'fixed', cents: (y) => y.fixedAssetsCents, title: assetTitle('fixed') },
    ...(anyOther ? [{ key: 'other', cents: (y) => y.otherAssetsCents, title: assetTitle('other') }] : []),
  ];
  const chart = renderColumnChart({
    label: 'Assets, liabilities, and net assets by year',
    years,
    columns: [
      { segments: assetSegments },
      { segments: [{ key: 'liabilities', cents: (y) => y.liabilitiesCents, title: plainTitle('liabilities') }] },
      { segments: [{ key: 'equity', cents: (y) => y.equityCents, title: plainTitle('equity') }] },
    ],
    legendKeys: ['current', 'fixed', ...(anyOther ? ['other'] : []), 'liabilities', 'equity'],
  });
  const rows = years.map((y) => `<tr><td>${y.fiscalYear}</td><td class="num">${formatCents(y.currentAssetsCents)}</td><td class="num">${formatCents(y.fixedAssetsCents)}</td>${anyOther ? `<td class="num">${formatCents(y.otherAssetsCents)}</td>` : ''}<td class="num">${formatCents(y.assetsCents)}</td><td class="num">${formatCents(y.liabilitiesCents)}</td><td class="num">${formatCents(y.equityCents)}</td></tr>`).join('');
  return `<div class="bs-panel" aria-label="Multi-year trend">
      ${panelHeading('Multi-year trend', 'The Assets column is stacked into its balance-sheet groups. Fixed assets are property at book value and do not move with the market, so current assets are where growth or drawdown actually shows.')}
      ${chart}
      ${renderPlainTable(['Year', ['Current assets', true], ['Fixed assets', true], ...(anyOther ? [['Other assets', true]] : []), ['Total assets', true], ['Liabilities', true], ['Net assets', true]], rows)}
    </div>`;
}

// Connect's finRenderCashTrendChart: the pinned operating account (the same
// operatingCashFromBalanceSheet figure the cash-runway card reads) and every cash/bank account.
function renderCashTrend(years, cashAccountCode) {
  if (!years.some((y) => y.cash && (y.cash.operatingCents || y.cash.allCashCents))) return '';
  const hasOperating = years.some((y) => y.cash && y.cash.operatingCents !== null);
  const title = (key) => (y, cents) => `${TREND_SERIES[key].label} ${y.fiscalYear}: ${cents < 0 ? '−' : ''}${formatExactCents(cents)}`;
  const chart = renderColumnChart({
    label: 'Cash and bank accounts by year',
    years,
    columns: [
      ...(hasOperating ? [{ segments: [{ key: 'operating', cents: (y) => y.cash?.operatingCents || 0, title: title('operating') }] }] : []),
      { segments: [{ key: 'allCash', cents: (y) => y.cash?.allCashCents || 0, title: title('allCash') }] },
    ],
    legendKeys: [...(hasOperating ? ['operating'] : []), 'allCash'],
  });
  const cell = (cents) => `<td class="num">${cents === null || cents === undefined ? '—' : formatCents(cents)}</td>`;
  const rows = years.map((y) => `<tr><td>${y.fiscalYear}</td>${hasOperating ? cell(y.cash ? y.cash.operatingCents : null) : ''}${cell(y.cash ? y.cash.allCashCents : null)}</tr>`).join('');
  const latest = years.at(-1);
  const accountNote = latest?.cash?.allCashAccounts?.length
    ? `<p class="bs-note">${latest.fiscalYear}: ${latest.cash.allCashAccounts.map(escapeHtml).join(', ')}</p>` : '';
  const operatingNote = hasOperating
    ? `<p class="bs-note">Operating checking is ${cashAccountCode ? `account ${escapeHtml(cashAccountCode)}` : 'every account named “checking”'}, the same figure the cash-runway card uses.</p>` : '';
  return `<div class="bs-panel" aria-label="Cash and bank accounts over time">
      ${panelHeading('Cash & bank accounts over time')}
      ${chart}
      ${renderPlainTable(['Year', ...(hasOperating ? [['Operating checking', true]] : []), ['All cash & bank accounts', true]], rows)}
      ${accountNote}${operatingNote}
    </div>`;
}

function renderNetWorthGrowth(years) {
  if (years.length < 2) return '';
  const rows = years.slice(1).map((y, i) => `<tr><td>${years[i].fiscalYear} → ${y.fiscalYear}</td>${growthCells(y.equityCents, years[i].equityCents)}</tr>`).join('');
  return `<div class="bs-panel" aria-label="Net worth growth by year">
      ${panelHeading('Net worth growth by year', 'Change in total net assets (assets minus liabilities) year over year &mdash; the plainest single measure of whether the church grew or lost ground.')}
      ${renderPlainTable(['Period', ['Net assets', true], ['Change', true], ['%', true]], rows)}
    </div>`;
}

function renderAssetGrowth(years) {
  if (years.length < 2) return '';
  const rows = years.slice(1).map((y, i) => `<tr><td>${years[i].fiscalYear} → ${y.fiscalYear}</td>${growthCells(y.assetsCents, years[i].assetsCents)}${growthCells(y.currentAssetsCents, years[i].currentAssetsCents)}</tr>`).join('');
  return `<div class="bs-panel" aria-label="Asset growth by year">
      ${panelHeading('Asset growth by year', 'What the church actually holds, year over year. Total assets include property at book value, which does not move with the market &mdash; current assets are cash, receivables, and investments, and are where growth or drawdown really shows.')}
      ${renderPlainTable(['Period', ['Total assets', true], ['Change', true], ['%', true], ['Current assets', true], ['Change', true], ['%', true]], rows)}
    </div>`;
}

// Connect's finRenderBalanceReconciliation, worded as a difference to explain, never a failure.
function tieOutStatus(row) {
  if (row.status === 'ok') return '<span class="bs-up">✓ Matches</span>';
  if (row.status === 'off') return `<span class="bs-warn-text">Difference of ${formatExactCents(row.differenceCents)}</span>`;
  if (row.status === 'no_prior_balance') return `<span class="bs-flat">No ${row.priorYear} balance sheet — import it to check this year</span>`;
  return `<span class="bs-flat">No income statement on file for ${row.year}</span>`;
}

function renderTieOut(pnlTieOut) {
  if (!pnlTieOut.rows.length) return '';
  const money = (cents) => (cents === null ? '—' : `${cents < 0 ? '−' : ''}${formatCents(Math.abs(cents))}`);
  const summary = pnlTieOut.checked
    ? `${pnlTieOut.matched} of ${pnlTieOut.checked} year${pnlTieOut.checked === 1 ? '' : 's'} tie out exactly.`
    : 'No year can be checked yet — a year needs both its own balance sheet and the one before it.';
  const rows = pnlTieOut.rows.map((r) => `<tr><td>${r.year}</td><td class="num">${money(r.priorEquityCents)}</td><td class="num">${money(r.equityCents)}</td><td class="num">${money(r.changeCents)}</td><td class="num">${money(r.netIncomeCents)}</td><td>${tieOutStatus(r)}</td></tr>`).join('');
  return `<div class="bs-panel" aria-label="Balance sheet vs. income statement">
      ${panelHeading('Balance sheet vs. income statement', `The year’s change in total net assets should equal that year’s net income. ${escapeHtml(summary)} A difference is not automatically an error &mdash; a cash-basis balance sheet next to an accrual income statement, or an adjustment booked straight to net assets, will show up here legitimately.`)}
      ${renderPlainTable(['Year', ['Opening net assets', true], ['Closing net assets', true], ['Change', true], ['Net income (P&L)', true], 'Check'], rows)}
    </div>`;
}

function renderNetAssetsByYear(years) {
  const withSplit = years.filter((y) => y.equityReclass);
  if (!withSplit.length) return '';
  const rows = withSplit.map((y) => `<tr><td>${y.fiscalYear}</td><td class="num">${formatCents(y.equityReclass.donorRestrictedCents)}</td><td class="num">${formatCents(y.equityReclass.unrestrictedCents)}</td><td class="num">${formatCents(y.equityReclass.totalEquityCents)}</td><td>${y.equityReclass.unclassifiedCount ? `<span class="bs-warn-text">⚠ ${y.equityReclass.unclassifiedCount} unclassified</span>` : ''}</td></tr>`).join('');
  return `<div class="bs-panel" aria-label="Net assets by year">
      ${panelHeading('Net assets by year')}
      ${renderPlainTable(['Year', ['Donor-restricted', true], ['Without restrictions', true], ['Total net assets', true], ''], rows)}
    </div>`;
}

function renderRangeControls(selection, years) {
  const from = selection?.fromYear ?? years[0]?.fiscalYear ?? '';
  const to = selection?.toYear ?? years.at(-1)?.fiscalYear ?? '';
  const csvHref = balanceHref('multi-year', { format: 'csv', from_year: selection?.fromYear, to_year: selection?.toYear });
  return `<form method="GET" action="/" class="bs-controls no-print" aria-label="Choose the trend years">
      <input type="hidden" name="section" value="balance"><input type="hidden" name="page" value="multi-year">
      <label>Trend from <input type="number" name="from_year" min="2000" max="2100" value="${escapeHtml(from)}"></label>
      <label>to <input type="number" name="to_year" min="2000" max="2100" value="${escapeHtml(to)}"></label>
      <button type="submit">Load range</button>
      ${selection?.fromYear ? `<a href="${escapeHtml(balanceHref('multi-year'))}">Every year on file</a>` : ''}
      <a href="${escapeHtml(csvHref)}">Export CSV</a>
    </form>${selection?.rangeError ? `<p class="status status-error">${escapeHtml(selection.rangeError)} Showing every year on file.</p>` : ''}`;
}

// ── CSV export ─────────────────────────────────────────────────────────────────────────────────
// Connect's finExportBalanceCsv, server-built: the multi-year series with the cash columns, in
// dollars. Figures the source does not carry (the synthetic fixture has no asset groups or cash)
// are left blank rather than written as zero.
export function buildBalanceTrendCsv(balanceTrends) {
  const header = ['Year', 'Assets', 'Current Assets', 'Fixed Assets', 'Other Assets', 'Liabilities', 'Equity', 'Operating Checking', 'All Cash & Bank Accounts'];
  const dollars = (cents) => (cents === null || cents === undefined ? '' : String(cents / 100));
  const years = balanceTrends.detail
    ? balanceTrends.detail.years
    : balanceTrends.rows.map((row) => ({
      fiscalYear: row.fiscal_year, assetsCents: row.assets_cents, liabilitiesCents: row.liabilities_cents, equityCents: row.equity_cents,
    }));
  const lines = [header.map(csvText).join(',')];
  for (const y of years) {
    lines.push([
      String(y.fiscalYear), dollars(y.assetsCents), dollars(y.currentAssetsCents), dollars(y.fixedAssetsCents), dollars(y.otherAssetsCents),
      dollars(y.liabilitiesCents), dollars(y.equityCents), dollars(y.cash?.operatingCents), dollars(y.cash?.allCashCents),
    ].join(','));
  }
  return `${lines.join('\n')}\n`;
}

// ── Styles (screen and print) ──────────────────────────────────────────────────────────────────
// Series colors are Connect's own (finRenderBalanceMultiYearChart / finRenderCashTrendChart).
export const BALANCE_STYLES = `
    .bs-controls { display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin:14px 0 4px; }
    .bs-controls input[type=number] { width:6.5rem; }
    .bs-controls button { margin-top:0; }
    .bs-h { margin:22px 0 4px; font-size:17px; }
    .bs-note { margin:4px 0 8px; font-size:13px; }
    .bs-panel { margin-top:18px; }
    .bs-plain { margin:6px 0 0; padding-left:20px; line-height:1.6; }
    .bs-check { margin:12px 0 4px; font-size:14px; font-weight:600; }
    .bs-check.is-ok, .bs-up { color:#2F7D5B; }
    .bs-check.is-off, .bs-down { color:#B4412F; }
    .bs-flat { color:#5B6475; }
    .bs-warn-text { color:#8A611C; }
    .bs-warn { margin-top:12px; padding:10px 14px; border:1px solid #EAD9B5; border-radius:8px; background:#FBF6EA; }
    .bs-warn p { margin:0 0 6px; color:#8A611C; font-size:13px; }
    .bs-table td.num, .bs-table th.num { text-align:right; white-space:nowrap; }
    .bs-table th:nth-child(n+3):not(.num), .bs-table td:nth-child(n+3):not(.num) { text-align:left; }
    .bs-tree tr.bs-group-row td { font-weight:600; }
    .bs-meters { list-style:none; margin:10px 0 0; padding:0; }
    .bs-meters li { display:grid; grid-template-columns:minmax(0,1.3fr) minmax(60px,1fr) auto; gap:12px; align-items:center; padding:8px 0; border-bottom:1px solid #EEF0F4; font-size:14px; }
    .bs-meter { height:8px; border-radius:4px; background:#EEF0F4; overflow:hidden; }
    .bs-meter i { display:block; height:100%; background:#2E7EA6; border-radius:4px; }
    .bs-chart { display:flex; align-items:flex-end; gap:10px; height:220px; margin-top:16px; padding:0 4px; border-bottom:1px solid #D5DAE3; }
    .bs-year { flex:1; min-width:0; display:flex; flex-direction:column; align-items:center; height:100%; }
    .bs-year > span { font-size:12px; color:#4B5563; margin-top:6px; }
    .bs-cols { flex:1; width:100%; display:flex; align-items:flex-end; justify-content:center; gap:3px; }
    .bs-col { width:min(22px,30%); display:flex; flex-direction:column-reverse; border-radius:3px 3px 0 0; overflow:hidden; }
    .bs-seg { display:block; width:100%; flex:none; }
    .bs-chart + .bs-legend { margin-top:28px; }
    .bs-legend { font-size:12px; color:#6B7280; display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
    .bs-legend .key { display:inline-block; width:10px; height:10px; border-radius:2px; margin-left:8px; }
    .bs-legend .key:first-child { margin-left:0; }
    .s-current { background:#2E7EA6; } .s-fixed { background:#8FBBD1; } .s-other { background:#C5DAE5; }
    .s-liabilities { background:#C9973A; } .s-equity { background:#5A9E6F; }
    .s-operating { background:#5A9E6F; } .s-allcash { background:#2E7EA6; }
    .bs-chart, .bs-legend, .bs-meter { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
`;

// `balanceSheet` here is resolveBalanceSheet()'s result -- { source: 'live', fiscalYear,
// asOfDate, accounts, totals, equityReclass } or { source: 'synthetic-fallback', fallbackReason,
// rows } -- never the raw synthetic row array balance-pages.js used to receive directly.
// `balanceTrends` is resolveBalanceSheetTrend()'s result, { source, rows, detail } /
// { source, fallbackReason, rows }: `rows` is always the normalized snake_case trend table, and
// `detail` (live producers with the parity extension only) carries the per-year figures behind
// the charts and tables. `balancePriorYear` is resolveBalanceSheetPriorYear()'s result for the
// Position page's year-over-year table, `selection` is parseBalanceSelection()'s GET controls,
// and `printMode` adds the filtered account detail to the Position print, matching Connect's
// print sheet.
export function renderBalancePage(pageId, {
  balanceSheet, balanceTrends, balancePriorYear = null, selection = null, printMode = false,
  balancePropertyValue = null, balanceMortgageHistory = null,
  canManageBalanceImport, balanceXlsxImportStatus, balanceXlsxImportMessage,
  canImportBalanceMultiYear, balanceMultiYearXlsxImportStatus, balanceMultiYearXlsxImportMessage,
}) {
  if (pageId === 'multi-year') {
    const isLiveTrend = balanceTrends.source === 'live';
    const trendBadge = isLiveTrend ? 'Live from Connect' : 'Synthetic staging';
    const trendFallbackNote = isLiveTrend ? '' : `<p><small>The committed synthetic fixture (the live endpoint is not configured or did not answer${balanceTrends.fallbackReason ? `: ${escapeHtml(balanceTrends.fallbackReason)}` : ''}).</small></p>`;
    const detail = isLiveTrend ? balanceTrends.detail : null;
    const detailYears = detail ? detail.years : [];
    const controlYears = detail ? detailYears : balanceTrends.rows.map((row) => ({ fiscalYear: row.fiscal_year }));
    const sections = detail
      ? [
        renderTrendChart(detailYears),
        renderCashTrend(detailYears, detail.cashAccountCode),
        renderNetWorthGrowth(detailYears),
        renderAssetGrowth(detailYears),
        renderTieOut(detail.pnlTieOut),
        renderNetAssetsByYear(detailYears),
      ].join('')
      : '';
    return `<section class="report" aria-label="Balance Sheet multi-year position">
      ${renderSectionHeading({ eyebrow: 'Balance Sheet', heading: 'Multi-year financial position', badge: trendBadge })}
      ${renderRangeControls(isLiveTrend ? selection : null, controlYears)}
      ${sections}
      ${panelHeading('Position by year')}
      ${renderTable({ head: ['Fiscal year', 'As of', 'Assets', 'Liabilities', 'Net assets'], rows: renderBalanceTrendRows(balanceTrends.rows) })}
      ${trendFallbackNote}
    </section>${canImportBalanceMultiYear ? renderBalanceMultiYearXlsxImportForm(balanceMultiYearXlsxImportStatus, balanceMultiYearXlsxImportMessage) : ''}`;
  }

  const isLive = balanceSheet.source === 'live';
  const report = isLive
    ? buildLiveBalanceSheetView(balanceSheet.accounts, balanceSheet.fiscalYear, balanceSheet.asOfDate, balanceSheet.totals, balanceSheet.equityReclass)
    : buildBalanceSheetView(balanceSheet.rows);
  const badge = isLive ? 'Live from Connect' : 'Synthetic staging';
  const fallbackNote = isLive ? '' : `<p><small>The committed synthetic fixture (the live endpoint is not configured or did not answer${balanceSheet.fallbackReason ? `: ${escapeHtml(balanceSheet.fallbackReason)}` : ''}).</small></p>`;
  const fiscalYear = report.fiscalYear;
  // The year picker only means something against live data; the synthetic fixture has one year.
  const hideZero = selection?.hideZero !== false;
  const emptyYear = isLive && balanceSheet.accounts.length === 0;
  const asOfLabel = report.asOfDate || `FY${fiscalYear}`;
  const emptyNote = `<p class="status status-pending">No balance sheet imported yet for ${fiscalYear}. Import one (Balance Sheet, or Financial Position for a file covering several years), or pick another year above.</p>`;

  if (pageId === 'account-detail') {
    if (!isLive) {
      const rows = renderBalanceRows([...report.assets, ...report.liabilities, ...report.equity]);
      return `<section class="report" aria-label="Balance Sheet account detail">
      ${renderSectionHeading({ eyebrow: 'Balance Sheet', heading: `Account detail as of ${escapeHtml(report.asOfDate)}`, badge })}
      ${renderTable({ head: ['Classification', 'Account', 'Balance'], rows })}
      ${fallbackNote}
    </section>`;
    }
    const zeroHidden = hideZero ? '' : '<input type="hidden" name="zero" value="show">';
    const detail = emptyYear ? null : renderBalanceDetailTree(balanceSheet.accounts, { hideZero });
    return `<section class="report" aria-label="Balance Sheet account detail">
      ${renderSectionHeading({ eyebrow: 'Balance Sheet', heading: `Account detail as of ${escapeHtml(asOfLabel)}`, badge })}
      ${renderYearControls('account-detail', selection, fiscalYear, { extraHidden: zeroHidden })}
      ${emptyYear ? emptyNote : `${renderBalanceCheck(report.totals.equationDifferenceCents)}
      ${renderZeroToggle(selection, fiscalYear, detail.hiddenCount)}
      ${detail.html}
      ${renderFoldedEquityNote(balanceSheet.accounts)}
      ${renderYearOverYear(balanceSheet.accounts, fiscalYear, balancePriorYear)}`}
    </section>`;
  }

  // 'position' (default)
  const lay = isLive && !emptyYear ? buildLayPosition(balanceSheet.accounts, balanceSheet.equityReclass) : null;
  const priorLay = lay && balancePriorYear?.ok && balancePriorYear.accounts.length
    ? buildLayPosition(balancePriorYear.accounts, balancePriorYear.equityReclass) : null;
  const positionBody = emptyYear ? emptyNote : `${lay
    ? `${Math.abs(report.totals.equationDifferenceCents) >= 1 ? renderBalanceCheck(report.totals.equationDifferenceCents) : ''}
    ${renderCouncilPosition({ lay, prior: priorLay, priorLabel: `End of ${fiscalYear - 1}`, fiscalYear, valuation: balancePropertyValue, history: balanceMortgageHistory, equityReclass: report.equityReclass })}`
    : `${renderKpiCards([
      { label: 'What we own', value: formatCents(report.totals.assetsCents) },
      { label: 'What we owe', value: formatCents(report.totals.liabilitiesCents) },
      { label: 'Net assets', value: formatCents(report.totals.equityCents), hint: 'What we own minus what we owe' },
    ])}
    ${renderBalanceCheck(report.totals.equationDifferenceCents)}`}
    ${isLive && printMode ? `${panelHeading('Full account detail', hideZero ? 'Zero-balance lines are hidden.' : '')}${renderBalanceDetailTree(balanceSheet.accounts, { hideZero }).html}` : ''}
    <p class="no-print">See <a href="${escapeHtml(balanceHref('account-detail', isLive ? { fiscal_year: fiscalYear } : {}))}">Account detail</a> and <a href="${escapeHtml(balanceHref('multi-year'))}">Multi-year position</a> for the full breakdown behind these totals.</p>`;
  return `<section class="report" aria-label="Balance Sheet position">
    ${renderSectionHeading({ eyebrow: 'Balance Sheet', heading: `Financial position as of ${escapeHtml(isLive ? asOfLabel : report.asOfDate)}`, badge })}
    ${isLive ? renderYearControls('position', selection, fiscalYear) : ''}
    ${positionBody}
    ${fallbackNote}
  </section>${canManageBalanceImport ? renderBalanceXlsxImportForm(balanceXlsxImportStatus, balanceXlsxImportMessage) : ''}`;
}
