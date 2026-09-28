// Gift Entry › Transactions and Online giving. Every gift is read live from Connect
// (giving-transactions-v1, giving-online-v1); corrections, voids, refunds, online-gift matching
// and recurring changes post to /api/v1/gift-batch-write, which relays them to Connect. Finance
// keeps no copy of any gift. Finance pages run no script, so every filter is a GET form.
import { escapeHtml as e } from './render-helpers.js';
import { csvNum, csvText } from './payroll-report-render.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const METHOD_LABELS = { check: 'Check', cash: 'Cash', online: 'Online', card: 'Card', ach: 'ACH / bank', stock: 'Stock', other: 'Other' };
const VOID_KINDS = [['error', 'Recorded in error'], ['returned', 'Returned check (NSF)'], ['refund', 'Refunded to the giver']];
const INTERVALS = [['weekly', 'Weekly'], ['biweekly', 'Every two weeks'], ['twice_monthly', 'Twice a month'], ['monthly', 'Monthly']];
const SORTS = [['date_desc', 'Newest first'], ['date_asc', 'Oldest first'], ['amount_desc', 'Largest first'], ['amount_asc', 'Smallest first'], ['name', 'Name']];
const STATUSES = [['all', 'All gifts'], ['active', 'Not voided or refunded'], ['voided', 'Voided'], ['refunded', 'Refunded'], ['changed', 'Corrected']];
// The filter parameters a Transactions URL carries (and the form posts return to).
export const TRANSACTION_PARAMS = ['from', 'to', 'funds', 'methods', 'min', 'max', 'q', 'status', 'sort', 'view', 'offset', 'batch_id'];

const EXACT_USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
function money(cents) {
  return EXACT_USD.format((Number(cents) || 0) / 100);
}

function day(iso) {
  const [y, m, d] = String(iso || '').slice(0, 10).split('-').map(Number);
  return y ? `${MONTHS[m - 1]} ${d}, ${y}` : '—';
}

function shortDay(iso) {
  const [y, m, d] = String(iso || '').slice(0, 10).split('-').map(Number);
  return y ? `${m}/${d}/${String(y).slice(2)}` : '—';
}

function methodLabel(method) {
  return METHOD_LABELS[method] || method || '—';
}

function statusBanner(status) {
  return status ? `<p class="status${status.ok ? '' : ' status-error'}">${e(status.message)}</p>` : '';
}

function unavailable(what, message) {
  return `<p class="status status-error">${e(what)} could not be read from Connect: ${e(message)} Nothing here is a real $0.</p>`;
}

// Keep the current filters, overriding some. Values are escaped for an href.
export function transactionsHref(params, overrides = {}) {
  const search = new URLSearchParams({ section: 'giving', page: 'transactions' });
  for (const key of TRANSACTION_PARAMS) {
    const value = key in overrides ? overrides[key] : params.get(key);
    if (value !== null && value !== undefined && value !== '') search.set(key, String(value));
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (!TRANSACTION_PARAMS.includes(key) && value !== null && value !== undefined && value !== '') search.set(key, String(value));
  }
  return `/?${search.toString().replace(/&/g, '&amp;')}`;
}

function backQuery(params, extra = {}) {
  const search = new URLSearchParams();
  for (const key of TRANSACTION_PARAMS) if (params.get(key)) search.set(key, params.get(key));
  for (const [key, value] of Object.entries(extra)) if (value) search.set(key, String(value));
  return e(search.toString());
}

function giftState(row) {
  if (row.voided_at) return `<span class="tx-badge is-void" title="${e(row.void_reason || 'Voided')}">Voided</span>`;
  if (row.refunded_cents > 0 && row.amount <= 0) return '<span class="tx-badge is-void">Refunded</span>';
  if (row.refunded_cents > 0) return `<span class="tx-badge">${money(row.refunded_cents)} refunded</span>`;
  if (row.change_count > 0) return '<span class="tx-badge is-changed">Corrected</span>';
  return '';
}

function overviewTable(title, rows) {
  if (!rows.length) return `<div class="panel"><h2>${e(title)}</h2><p class="muted-line">No gifts match.</p></div>`;
  return `<div class="panel"><h2>${e(title)}</h2><table class="pm-table tx-overview"><tbody>${rows.map(([label, count, cents]) => `<tr><td>${e(label)} <span class="tone-muted">(${count})</span></td><td class="num">${money(cents)}</td></tr>`).join('')}</tbody></table></div>`;
}

function filterForm(data, params) {
  const f = data.filters;
  const chosenFunds = new Set((params.get('funds') || '').split(',').filter(Boolean));
  const chosenMethods = new Set((params.get('methods') || '').split(',').filter(Boolean));
  const fundsLabel = chosenFunds.size ? `${chosenFunds.size} fund${chosenFunds.size === 1 ? '' : 's'}` : 'All funds';
  const methodsLabel = chosenMethods.size ? [...chosenMethods].map(methodLabel).join(', ') : 'All methods';
  return `<form method="GET" action="/" class="tx-filters panel">
    <input type="hidden" name="section" value="giving"><input type="hidden" name="page" value="transactions">
    ${params.get('view') ? `<input type="hidden" name="view" value="${e(params.get('view'))}">` : ''}
    <label class="field"><span>From</span><input type="date" name="from" value="${e(f.from)}"></label>
    <label class="field"><span>To</span><input type="date" name="to" value="${e(f.to)}"></label>
    <label class="field tx-search"><span>Name, envelope #, check #, or memo</span><input name="q" value="${e(f.q || '')}" placeholder="Current or past envelope # works too"></label>
    <details class="field tx-pick"><summary>${e(fundsLabel)}</summary><div class="tx-pick-list">
      ${data.funds.map((fund) => `<label><input type="checkbox" name="fund" value="${fund.id}"${chosenFunds.has(String(fund.id)) ? ' checked' : ''}> ${e(fund.name)}${fund.active ? '' : ' <small>(inactive)</small>'}</label>`).join('')}
    </div></details>
    <details class="field tx-pick"><summary>${e(methodsLabel)}</summary><div class="tx-pick-list">
      ${data.methods.map((m) => `<label><input type="checkbox" name="method" value="${e(m)}"${chosenMethods.has(m) ? ' checked' : ''}> ${e(methodLabel(m))}</label>`).join('')}
    </div></details>
    <label class="field tx-amt"><span>Amount from ($)</span><input name="min" inputmode="decimal" value="${e(params.get('min') || '')}" placeholder="0.00"></label>
    <label class="field tx-amt"><span>to ($)</span><input name="max" inputmode="decimal" value="${e(params.get('max') || '')}" placeholder="any"></label>
    <label class="field"><span>Show</span><select name="status">${STATUSES.map(([k, v]) => `<option value="${k}"${f.status === k ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
    <label class="field"><span>Sort</span><select name="sort">${SORTS.map(([k, v]) => `<option value="${k}"${f.sort === k ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
    <div class="form-actions"><button type="submit">Run report</button> <a class="button-outline" href="/?section=giving&amp;page=transactions">Clear</a></div>
  </form>`;
}

function viewTabs(params) {
  const view = params.get('view') || 'list';
  const tab = (id, label) => (view === id ? `<span class="chip is-on">${label}</span>` : `<a class="chip" href="${transactionsHref(params, { view: id === 'list' ? '' : id, offset: '' })}">${label}</a>`);
  const csv = new URLSearchParams({ section: 'giving', page: 'transactions', format: 'csv' });
  for (const key of TRANSACTION_PARAMS) if (params.get(key) && key !== 'offset' && key !== 'view') csv.set(key, params.get(key));
  return `<div class="tx-toolbar"><div class="chip-row">${tab('list', 'Gifts')}${tab('givers', 'By giver')}${tab('months', 'By month')}</div>
    <a class="button-outline" href="/?${csv.toString().replace(/&/g, '&amp;')}">Download CSV</a></div>`;
}

function listView(data, params) {
  if (!data.rows.length) return '<div class="panel panel-spaced"><div class="empty-note">No gifts match these filters.</div></div>';
  const rows = data.rows.map((r) => `<tr class="${r.voided_at ? 'is-void' : ''}">
      <td class="nowrap">${e(shortDay(r.gift_date))}</td>
      <td><a href="/?section=giving&amp;page=batch&amp;batch_id=${r.batch_id}">${r.batch_id}</a></td>
      <td class="nowrap">${r.person_id ? e(r.person_name) : '<span class="tone-muted">Anonymous</span>'}</td>
      <td>${e(r.envelope_number || '')}</td>
      <td>${e(r.fund_name)}</td>
      <td>${e(methodLabel(r.method))}</td>
      <td>${e(r.check_number || '')}</td>
      <td class="tx-note">${e(r.notes || '')}</td>
      <td class="num">${money(r.amount)}${r.original_amount_cents && r.original_amount_cents !== r.amount ? `<small>of ${money(r.original_amount_cents)}</small>` : ''}</td>
      <td>${giftState(r)}</td>
      <td class="actions"><a href="${transactionsHref(params, { entry_id: r.id })}#gift">Open</a></td>
    </tr>`).join('');
  const { offset, limit, total } = data.page;
  const pager = total > limit ? `<div class="tx-pager">
      ${offset > 0 ? `<a class="button-outline" href="${transactionsHref(params, { offset: Math.max(0, offset - limit) || '' })}">Previous</a>` : ''}
      <span class="muted">${offset + 1}–${offset + data.rows.length} of ${total}</span>
      ${offset + limit < total ? `<a class="button-outline" href="${transactionsHref(params, { offset: offset + limit })}">Next</a>` : ''}
    </div>` : '';
  return `<div class="panel panel-spaced list-panel"><div class="table-scroll"><table class="pm-table tx-table">
      <thead><tr><th>Date</th><th>Batch</th><th>Name</th><th>Envelope</th><th>Fund</th><th>Method</th><th>Check #</th><th>Note</th><th class="num">Amount</th><th></th><th></th></tr></thead>
      <tbody>${rows}</tbody></table></div>${pager}</div>`;
}

function giversView(data, params) {
  if (!data.by_giver.length) return '<div class="panel panel-spaced"><div class="empty-note">No gifts match these filters.</div></div>';
  const rows = data.by_giver.map((g) => `<tr><td>${g.person_id ? `<a href="${transactionsHref(params, { q: g.envelope_number || g.person_name, view: '' })}">${e(g.person_name)}</a>` : '<span class="tone-muted">Anonymous</span>'}</td>
      <td>${e(g.envelope_number || '')}</td><td class="num">${g.gift_count}</td><td>${e(day(g.last_gift_date))}</td><td class="num">${money(g.total_cents)}</td></tr>`).join('');
  return `<div class="panel panel-spaced list-panel"><div class="table-scroll"><table class="pm-table">
      <thead><tr><th>Giver</th><th>Envelope</th><th class="num">Gifts</th><th>Last gift</th><th class="num">Total</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

function monthsView(data) {
  if (!data.by_month.length) return '<div class="panel panel-spaced"><div class="empty-note">No gifts match these filters.</div></div>';
  const top = Math.max(...data.by_month.map((m) => m.total_cents), 1);
  return `<div class="panel panel-spaced"><ul class="tx-bars">${data.by_month.map((m) => {
    const [y, mo] = m.month.split('-').map(Number);
    return `<li><span>${MONTHS[mo - 1]} ${y}</span><span class="tx-bar"><i style="width:${Math.max(1, Math.round(m.total_cents / top * 100))}%"></i></span><b>${money(m.total_cents)}</b><small>${m.gift_count} gifts</small></li>`;
  }).join('')}</ul></div>`;
}

function giftPanel(data, params) {
  const { gift, history } = data.detail;
  const back = backQuery(params, { entry_id: gift.id });
  const online = gift.processor === 'stax' && gift.external_txn_id;
  const fundOptions = data.funds.map((f) => `<option value="${f.id}"${f.id === gift.fund_id ? ' selected' : ''}>${e(f.name)}${f.active ? '' : ' (inactive)'}</option>`).join('');
  const methodOptions = Object.entries(METHOD_LABELS).map(([k, v]) => `<option value="${k}"${k === gift.method ? ' selected' : ''}>${v}</option>`).join('');
  const hidden = `<input type="hidden" name="entry_id" value="${gift.id}"><input type="hidden" name="return" value="transactions"><input type="hidden" name="back" value="${back}">`;
  const reduced = gift.voided_at || gift.refunded_cents > 0;
  const giverResults = params.get('giver_q')
    ? (data.givers.length ? `<ul class="giver-results">${data.givers.map((p) => `<li><span>${e(p.first_name)} ${e(p.last_name)}${p.envelope_number ? ` <small>Env. #${e(p.envelope_number)}</small>` : ''}</span>
        <form method="POST" action="/api/v1/gift-batch-write" class="inline-form">${hidden}<input type="hidden" name="op" value="correct_gift"><input type="hidden" name="person_id" value="${p.id}">
        <input name="reason" required maxlength="300" placeholder="Why?" aria-label="Why move this gift"><button type="submit" class="button-outline">Move here</button></form></li>`).join('')}</ul>`
      : '<p class="muted-line">No one matches that name or envelope.</p>')
    : '';
  const historyRows = history.map((h) => `<tr><td>${e(String(h.changed_at).slice(0, 16))}</td><td>${e(h.changed_by)}</td><td>${e(h.action)}</td><td>${e(h.field)}</td><td>${e(h.old_value)} → ${e(h.new_value)}</td><td>${e(h.reason)}</td></tr>`).join('');
  return `<div class="panel panel-spaced tx-gift" id="gift">
    <div class="panel-head"><h2>Gift #${gift.id} · ${money(gift.amount)}${gift.original_amount_cents && gift.original_amount_cents !== gift.amount ? ` <small>of ${money(gift.original_amount_cents)} first recorded</small>` : ''}</h2>
      <a href="${transactionsHref(params, { entry_id: '' })}">Close</a></div>
    <p class="muted-line">${gift.person_id ? `<b>${e(gift.person_name)}</b>${gift.envelope_number ? ` · Env. #${e(gift.envelope_number)}` : ''}` : '<b>Anonymous</b>'} · ${e(day(gift.gift_date))} · ${e(gift.fund_name)} · ${e(methodLabel(gift.method))}${gift.check_number ? ` · Check #${e(gift.check_number)}` : ''}
      · <a href="/?section=giving&amp;page=batch&amp;batch_id=${gift.batch_id}">Batch #${gift.batch_id}</a> (${gift.batch_closed ? 'closed' : 'open'}${gift.deposit_id ? ', on a deposit' : ''})${gift.voided_at ? ` · <b class="tone-bad">Voided</b> ${e(gift.void_reason)}` : ''}${gift.refunded_cents > 0 ? ` · ${money(gift.refunded_cents)} refunded` : ''}</p>
    <div class="panel-grid tx-gift-grid">
      <div>
        <h3>Correct this gift</h3>
        <form method="POST" action="/api/v1/gift-batch-write" class="form-grid facility-form">${hidden}<input type="hidden" name="op" value="correct_gift">
          <label class="field"><span>Fund</span><select name="fund_id">${fundOptions}</select></label>
          <label class="field"><span>Amount ($)</span><input name="amount" inputmode="decimal" value="${(gift.amount / 100).toFixed(2)}"${reduced ? ' readonly title="Voided or refunded — restore it to change the amount"' : ''}></label>
          <label class="field"><span>Method</span><select name="method">${methodOptions}</select></label>
          <label class="field"><span>Gift date</span><input type="date" name="gift_date" value="${e(gift.gift_date)}"></label>
          <label class="field"><span>Check #</span><input name="check_number" maxlength="40" value="${e(gift.check_number || '')}"></label>
          <label class="field"><span>Memo</span><input name="notes" maxlength="300" value="${e(gift.notes || '')}"></label>
          <label class="field field-wide"><span>Why is it being corrected?</span><input name="reason" required maxlength="300" placeholder="e.g. Keyed $100, check was $1,000"></label>
          <div class="form-actions"><button type="submit">Save correction</button></div>
        </form>
        <h3>Giver</h3>
        <form method="GET" action="/" class="giver-search">
          ${Object.entries({ section: 'giving', page: 'transactions', entry_id: gift.id }).map(([k, v]) => `<input type="hidden" name="${k}" value="${e(v)}">`).join('')}
          ${TRANSACTION_PARAMS.filter((k) => params.get(k)).map((k) => `<input type="hidden" name="${k}" value="${e(params.get(k))}">`).join('')}
          <label class="field"><span>Move to another giver</span><span class="giver-row"><input name="giver_q" value="${e(params.get('giver_q') || '')}" placeholder="Name or envelope #"><button type="submit" class="button-outline">Find</button></span></label>
        </form>
        ${giverResults}
        ${gift.person_id ? `<form method="POST" action="/api/v1/gift-batch-write" class="inline-form tx-anon">${hidden}<input type="hidden" name="op" value="correct_gift"><input type="hidden" name="person_id" value="anonymous">
          <input name="reason" required maxlength="300" placeholder="Why?" aria-label="Why make this gift anonymous"><button type="submit" class="link-button">Make anonymous</button></form>` : ''}
      </div>
      <div>
        ${gift.voided_at ? `<h3>Undo the void</h3>
          ${online ? '<p class="muted-line">An online void cannot be undone here.</p>' : `<form method="POST" action="/api/v1/gift-batch-write" class="form-grid facility-form">${hidden}<input type="hidden" name="op" value="restore_gift">
            <label class="field field-wide"><span>Why?</span><input name="reason" required maxlength="300" placeholder="e.g. Voided the wrong gift"></label>
            <div class="form-actions"><button type="submit" class="button-outline">Restore ${money(gift.original_amount_cents - gift.refunded_cents)}</button></div></form>`}`
    : online ? `<h3>Refund</h3><p class="muted-line">This gift was charged online. Refund it through the online giving processor so the card or bank account is credited; the refund then shows here.</p>`
      : gift.amount > 0 ? `<h3>Void or refund</h3>
          <form method="POST" action="/api/v1/gift-batch-write" class="form-grid facility-form">${hidden}<input type="hidden" name="op" value="void_gift">
            <label class="field field-wide"><span>What happened?</span><select name="kind">${VOID_KINDS.map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
            <label class="field"><span>Refund amount ($)</span><input name="refund_amount" inputmode="decimal" placeholder="${(gift.amount / 100).toFixed(2)}"></label>
            <label class="field"><span>Note</span><input name="reason" maxlength="240" placeholder="Optional"></label>
            <div class="form-actions"><button type="submit" class="button-danger">Record it</button></div>
          </form>
          <p class="muted-line">A void takes the whole gift out of every total and the giver’s statement. A refund takes out only the amount given back (leave it blank for all of it). The gift and its history are kept.</p>` : ''}
        <h3>History</h3>
        ${historyRows ? `<div class="table-scroll"><table class="pm-table tx-history"><thead><tr><th>When</th><th>Who</th><th>What</th><th>Field</th><th>Change</th><th>Why</th></tr></thead><tbody>${historyRows}</tbody></table></div>` : '<p class="muted-line">No corrections yet.</p>'}
      </div>
    </div>
  </div>`;
}

// The filter form sends one `fund`/`method` value per ticked box; the contract and every link on
// the page carry them as comma lists (`funds`, `methods`).
export function normalizeTransactionParams(searchParams) {
  const params = new URLSearchParams(searchParams);
  for (const [single, list] of [['fund', 'funds'], ['method', 'methods']]) {
    const picked = params.getAll(single).filter(Boolean);
    params.delete(single);
    if (picked.length) params.set(list, picked.join(','));
  }
  return params;
}

export function renderTransactionsPage({ result, params, status }) {
  if (!result.ok) return `${statusBanner(status)}${unavailable('Gifts', result.message)}`;
  const data = result.data;
  const t = data.totals;
  const view = params.get('view') || 'list';
  const notes = [t.anonymous_count ? `${t.anonymous_count} anonymous` : '', t.voided_count ? `${t.voided_count} voided` : '', t.refunded_cents ? `${money(t.refunded_cents)} refunded` : ''].filter(Boolean).join(' · ');
  return `${statusBanner(status)}
    <p class="lede">Every recorded gift. Search by name, current or past envelope number, check number, or memo; open a gift to correct it, move it to another giver, or void or refund it.</p>
    ${filterForm(data, params)}
    ${data.detail ? giftPanel(data, params) : params.get('entry_id') ? '<p class="status status-error">That gift could not be found.</p>' : ''}
    <div class="grid">
      <div class="card"><small>Total givers</small><strong>${t.giver_count}</strong>${notes ? `<span>${e(notes)}</span>` : ''}</div>
      <div class="card"><small>Giving transactions</small><strong>${t.gift_count.toLocaleString('en-US')}</strong><span>${e(day(data.filters.from))} – ${e(day(data.filters.to))}</span></div>
      <div class="card"><small>Total amount</small><strong>${money(t.total_cents)}</strong><span>After voids and refunds</span></div>
    </div>
    <div class="panel-grid tx-overviews">
      ${overviewTable('Funds overview', data.by_fund.map((f) => [f.fund_name, f.gift_count, f.total_cents]))}
      ${overviewTable('Method overview', data.by_method.map((m) => [methodLabel(m.method), m.gift_count, m.total_cents]))}
    </div>
    ${viewTabs(params)}
    ${view === 'givers' ? giversView(data, params) : view === 'months' ? monthsView(data) : listView(data, params)}`;
}

// Every gift matching the page's filters (up to 5,000) for "Download CSV": the page's own
// parameters without its paging, asking Connect for all rows.
export function transactionsCsvParams(searchParams) {
  const params = normalizeTransactionParams(searchParams);
  params.set('all', '1');
  params.set('offset', '0');
  return params;
}

export function transactionsCsvFilename(filters = {}) {
  const clean = (d) => String(d || '').split('').filter((c) => /[0-9-]/.test(c)).join('');
  return `gifts-${clean(filters.from)}-to-${clean(filters.to)}.csv`;
}

// Quoting and the spreadsheet-formula guard come from the payroll CSV's shared Finance helpers.
export function buildTransactionsCsv(data) {
  const head = ['Date', 'Batch', 'Name', 'Envelope', 'Fund', 'Method', 'Check #', 'Note', 'Amount', 'First recorded', 'Refunded', 'Voided', 'Void reason', 'Processor fee'];
  const dollars = (cents) => csvNum(((Number(cents) || 0) / 100).toFixed(2));
  const lines = data.rows.map((r) => [
    csvText(r.gift_date), csvNum(r.batch_id), csvText(r.person_id ? r.person_name : 'Anonymous'), csvText(r.envelope_number), csvText(r.fund_name),
    csvText(methodLabel(r.method)), csvText(r.check_number), csvText(r.notes), dollars(r.amount), dollars(r.original_amount_cents || r.amount),
    dollars(r.refunded_cents), csvText(r.voided_at ? String(r.voided_at).slice(0, 10) : ''), csvText(r.void_reason), dollars(r.fee_cents),
  ].join(','));
  return `${head.map(csvText).join(',')}\r\n${lines.join('\r\n')}\r\n`;
}

// ── Online giving ─────────────────────────────────────────────────────────────────────────────

function onlineHref(view, extra = {}) {
  const search = new URLSearchParams({ section: 'giving', page: 'online', ...(view && view !== 'payments' ? { view } : {}), ...extra });
  return `/?${search.toString().replace(/&/g, '&amp;')}`;
}

function payerName(row) {
  return row.person_id ? e(row.person_name) : row.payer_name ? `${e(row.payer_name)} <small class="tone-bad">not matched</small>` : '<span class="tone-muted">Anonymous</span>';
}

function paymentsView(data) {
  if (!data.payments.length) return '<div class="panel panel-spaced"><div class="empty-note">No online gifts yet.</div></div>';
  const rows = data.payments.map((p) => {
    const gross = p.amount; // what the church kept after any void or refund
    return `<tr><td>${e(day(p.gift_date))}</td><td>${payerName(p)}</td><td>${e(methodLabel(p.method))}${p.processor ? ` <small>${e(p.processor)}</small>` : ''}</td>
      <td><a href="/?section=giving&amp;page=batch&amp;batch_id=${p.batch_id}">${p.batch_id}</a></td><td>${e(p.fund_name)}</td>
      <td class="num">${money(gross)}</td><td class="num">${p.fee_cents ? money(p.fee_cents) : '—'}</td><td class="num">${money(gross - p.fee_cents)}</td>
      <td>${p.voided_at ? '<span class="tx-badge is-void">Voided</span>' : p.refunded_cents ? '<span class="tx-badge">Refunded</span>' : ''}</td>
      <td class="actions"><a href="/?section=giving&amp;page=transactions&amp;entry_id=${p.id}&amp;from=${e(String(p.gift_date).slice(0, 10))}&amp;to=${e(String(p.gift_date).slice(0, 10))}#gift">Open</a></td></tr>`;
  }).join('');
  return `<div class="panel panel-spaced list-panel"><div class="table-scroll"><table class="pm-table">
    <thead><tr><th>Date</th><th>Name</th><th>Type</th><th>Batch</th><th>Fund</th><th class="num">Gross</th><th class="num">Fee</th><th class="num">Net</th><th></th><th></th></tr></thead>
    <tbody>${rows}</tbody></table></div></div>
    <p class="muted-line">The 60 most recent online gifts. Use Transactions with Method set to Card or ACH for any date range.</p>`;
}

function recurringView(data) {
  if (!data.recurring.length) return '<div class="panel panel-spaced"><div class="empty-note">No recurring gifts have been set up through online giving yet.</div></div>';
  const fundOptions = (id) => data.funds.map((f) => `<option value="${f.id}"${f.id === id ? ' selected' : ''}>${e(f.name)}</option>`).join('');
  const rows = data.recurring.map((s) => {
    const active = s.status !== 'cancelled';
    const hidden = `<input type="hidden" name="schedule_id" value="${s.id}"><input type="hidden" name="return" value="online"><input type="hidden" name="back" value="view=recurring">`;
    return `<tr class="${active ? '' : 'is-void'}"><td>${s.person_id ? e(s.person_name) : `${e(s.payer_name || 'Unknown')} <small class="tone-bad">not matched</small>`}</td>
      <td>${e(s.fund_name)}</td><td class="num">${money(s.amount_cents)}</td><td>${e((INTERVALS.find(([k]) => k === s.interval) || [0, s.interval])[1])}</td>
      <td>${active ? (s.has_stax_schedule ? 'Active' : `<span class="tone-bad" title="${e(s.stax_error || '')}">Needs setup</span>`) : 'Cancelled'}</td><td>${e(day(s.created_at))}</td>
      <td class="actions">${active ? `<details class="tx-edit"><summary>Change</summary>
        <form method="POST" action="/api/v1/gift-batch-write" class="form-grid facility-form">${hidden}<input type="hidden" name="op" value="update_recurring">
          <label class="field"><span>Fund</span><select name="fund_id">${fundOptions(s.fund_id)}</select></label>
          <label class="field"><span>Amount ($)</span><input name="amount" inputmode="decimal" value="${(s.amount_cents / 100).toFixed(2)}" required></label>
          <label class="field"><span>How often</span><select name="interval">${INTERVALS.map(([k, v]) => `<option value="${k}"${k === s.interval ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
          <div class="form-actions"><button type="submit">Save</button></div></form>
        <form method="POST" action="/api/v1/gift-batch-write" class="inline-form">${hidden}<input type="hidden" name="op" value="cancel_recurring"><button type="submit" class="link-button tone-bad">Cancel this recurring gift</button></form>
      </details>` : ''}</td></tr>`;
  }).join('');
  return `<div class="panel panel-spaced list-panel"><div class="table-scroll"><table class="pm-table">
    <thead><tr><th>Giver</th><th>Fund</th><th class="num">Amount</th><th>How often</th><th>Status</th><th>Started</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <p class="muted-line">Recurring gifts set up through Timothy’s online giving form. Recurring gifts from Breeze/Tithe.ly are managed there until that service is retired.</p>`;
}

function associationsView(data, params, people) {
  const queueId = params.get('queue');
  const unmatched = data.unmatched.map((u) => {
    const searching = String(u.queue_id) === queueId;
    const hidden = `<input type="hidden" name="queue_id" value="${u.queue_id}"><input type="hidden" name="return" value="online"><input type="hidden" name="back" value="view=associations">`;
    const results = searching && params.get('q')
      ? (people.length ? `<ul class="giver-results">${people.map((p) => `<li><span>${e(p.first_name)} ${e(p.last_name)}${p.envelope_number ? ` <small>Env. #${e(p.envelope_number)}</small>` : ''}</span>
          <form method="POST" action="/api/v1/gift-batch-write" class="inline-form">${hidden}<input type="hidden" name="op" value="link_online_gift"><input type="hidden" name="person_id" value="${p.id}"><button type="submit" class="button-outline">This is them</button></form></li>`).join('')}</ul>`
        : '<p class="muted-line">No one matches.</p>')
      : '';
    return `<li class="tx-unmatched"><div><b>${e(u.payer_name || 'No name given')}</b><small>${e([u.payer_email, u.card_brand && u.card_last4 ? `${u.card_brand} ····${u.card_last4}` : ''].filter(Boolean).join(' · '))}</small>
        <small>${money(u.amount)} to ${e(u.fund_name)} on ${e(day(u.gift_date))}</small></div>
      <div class="right">
        <form method="GET" action="/" class="giver-search"><input type="hidden" name="section" value="giving"><input type="hidden" name="page" value="online"><input type="hidden" name="view" value="associations"><input type="hidden" name="queue" value="${u.queue_id}">
          <span class="giver-row"><input name="q" value="${searching ? e(params.get('q') || '') : e((u.payer_name || '').split(' ').at(-1))}" placeholder="Name or envelope #" aria-label="Find the giver"><button type="submit" class="button-outline">Find</button></span></form>
        ${results}
        <form method="POST" action="/api/v1/gift-batch-write" class="inline-form">${hidden}<input type="hidden" name="op" value="ignore_online_gift"><button type="submit" class="link-button">Leave anonymous</button></form>
      </div></li>`;
  }).join('');
  const connections = data.connections.map((c) => `<tr><td><a href="/?section=giving&amp;page=transactions&amp;q=${encodeURIComponent(c.envelope_number || c.person_name)}&amp;methods=card,ach,online">${e(c.person_name)}</a></td>
      <td>${e(c.envelope_number || '')}</td><td>${c.processor_accounts ? 'Linked' : '—'}</td><td>${c.active_recurring || '—'}</td>
      <td>${e(String(c.methods || '').split(',').filter(Boolean).map(methodLabel).join(', ') || '—')}</td><td>${e(day(c.last_online_gift))}</td><td class="num">${money(c.year_cents)}</td></tr>`).join('');
  return `<div class="panel panel-spaced"><div class="panel-head"><h2>Waiting to be matched</h2><span class="muted">${data.unmatched.length} online gift${data.unmatched.length === 1 ? '' : 's'}</span></div>
      ${unmatched ? `<ul class="row-list">${unmatched}</ul>` : '<p class="muted-line">Every online gift is on a giver’s record.</p>'}
      <p class="muted-line">Matching a gift also remembers the payer’s online account for that person, so their next gift matches on its own.</p></div>
    <div class="panel panel-spaced list-panel"><div class="panel-head"><h2>Who gives online</h2><span class="muted">This year, plus anyone with a linked online account</span></div>
      ${connections ? `<div class="table-scroll"><table class="pm-table"><thead><tr><th>Giver</th><th>Envelope</th><th>Online account</th><th>Recurring</th><th>Methods this year</th><th>Last online gift</th><th class="num">Online this year</th></tr></thead><tbody>${connections}</tbody></table></div>` : '<div class="empty-note">No online givers yet this year.</div>'}</div>`;
}

export function renderOnlineGivingPage({ result, params, status, people = [] }) {
  if (!result.ok) return `${statusBanner(status)}${unavailable('Online giving', result.message)}`;
  const data = result.data;
  const t = data.totals;
  const view = ['recurring', 'associations'].includes(params.get('view')) ? params.get('view') : 'payments';
  const activeRecurring = data.recurring.filter((s) => s.status !== 'cancelled');
  const tab = (id, label) => (view === id ? `<span class="chip is-on">${label}</span>` : `<a class="chip" href="${onlineHref(id)}">${label}</a>`);
  return `${statusBanner(status)}
    <div class="grid">
      <div class="card"><small>Online this month</small><strong>${money(t.month_cents)}</strong><span>${t.month_count} gifts</span></div>
      <div class="card"><small>Online this year</small><strong>${money(t.year_cents)}</strong><span>${t.year_count} gifts · ${t.year_givers} givers</span></div>
      <div class="card"><small>Processor fees this year</small><strong>${money(t.year_fee_cents)}</strong><span>Where the processor reports them</span></div>
      <div class="card"><small>Recurring gifts</small><strong>${activeRecurring.length}</strong><span>${data.unmatched.length ? `<span class="tone-warn">${data.unmatched.length} online gift${data.unmatched.length === 1 ? '' : 's'} to match</span>` : 'All online gifts matched'}</span></div>
    </div>
    <div class="chip-row">${tab('payments', 'Payments')}${tab('recurring', 'Recurring')}${tab('associations', `Givers &amp; matching${data.unmatched.length ? ` (${data.unmatched.length})` : ''}`)}</div>
    ${view === 'recurring' ? recurringView(data) : view === 'associations' ? associationsView(data, params, people) : paymentsView(data)}`;
}

export const GIFT_TRANSACTIONS_STYLES = `
    .tx-filters { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px 14px; align-items:end; margin-top:14px; }
    .tx-filters .tx-search { grid-column:span 2; }
    .tx-filters .form-actions { display:flex; gap:8px; align-items:center; }
    .tx-filters .form-actions button, .tx-filters .form-actions a { margin:0; }
    .tx-pick summary { cursor:pointer; padding:7px 10px; border:1px solid var(--line); border-radius:6px; background:#fff; font-size:14px; }
    .tx-pick-list { position:absolute; z-index:5; max-height:260px; overflow:auto; margin-top:4px; padding:8px 12px; background:#fff; border:1px solid var(--line); border-radius:8px; box-shadow:0 6px 20px rgba(0,0,0,.08); }
    .tx-pick { position:relative; }
    .tx-pick-list label { display:block; font-size:14px; padding:3px 0; white-space:nowrap; }
    .tx-overviews { grid-template-columns:1fr 1fr; margin-top:14px; }
    @media(max-width:800px){ .tx-overviews, .tx-gift-grid { grid-template-columns:1fr !important; } .tx-filters .tx-search { grid-column:auto; } }
    .tx-overview td.num, .tx-table td.num, .pm-table td.num, .pm-table th.num { text-align:right; white-space:nowrap; }
    .tx-toolbar { display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; margin-top:16px; }
    .tx-table td.nowrap, .tx-table .actions { white-space:nowrap; }
    .tx-table .actions { padding-right:12px; }
    .tx-history td:first-child { white-space:nowrap; }
    .tx-table td small { display:block; color:var(--muted); font-size:12px; }
    .tx-table .tx-note { max-width:16rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px; color:var(--muted); }
    tr.is-void td { color:var(--muted); }
    tr.is-void td.num { text-decoration:line-through; }
    .tx-badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:12px; background:#FFF4DC; color:#7A5A00; white-space:nowrap; }
    .tx-badge.is-void { background:#FBEFEC; color:var(--red); }
    .tx-badge.is-changed { background:#EEF3FA; color:var(--navy); }
    .tx-pager { display:flex; justify-content:center; align-items:center; gap:14px; padding:12px; }
    .tx-bars { list-style:none; margin:0; padding:0; }
    .tx-bars li { display:grid; grid-template-columns:6rem 1fr 7rem 5rem; gap:10px; align-items:center; padding:5px 0; font-size:14px; }
    .tx-bars b { text-align:right; }
    .tx-bars small { color:var(--muted); }
    .tx-bar { height:12px; background:var(--line-soft); border-radius:6px; overflow:hidden; }
    .tx-bar i { display:block; height:100%; background:var(--navy); }
    .tx-gift { border-left:4px solid var(--gold); }
    .tx-gift h3 { margin:16px 0 6px; font-size:15px; }
    .tx-gift-grid { grid-template-columns:1fr 1fr; }
    .tx-gift .field-wide { grid-column:1 / -1; }
    .tx-anon { margin-top:8px; gap:6px; }
    .tx-history td { font-size:12.5px; }
    .tx-unmatched { align-items:flex-start; }
    .tx-unmatched small { display:block; color:var(--muted); }
    .tx-unmatched .right { max-width:24rem; }
    .tx-edit summary { cursor:pointer; color:var(--gold-ink); text-decoration:underline; }
    .button-danger { background:var(--red); border-color:var(--red); }
    @media print { .tx-filters, .tx-toolbar, .tx-gift, .actions { display:none !important; } }
`;
