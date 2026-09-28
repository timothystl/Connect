// Giving › Donor letters: statements and letters, thank-you receipts, nudge letters, and one
// statement at a time, sent from Finance (Andrew, Sept 28 2026). Script-free: choices are GET
// parameters; a table of recipients is one form whose buttons email the next batch, open the print
// sheet, or mark letters sent. Email goes out through Connect's sender and each send is recorded
// in the shared ledger, so a run can stop and resume without writing to anyone twice.
import { LETTER_TYPES, escapeHtml as e, fmtDate, fmtMoney, letterTypeOf, renderStatementLetter } from './donor-letters.js';
import { EMAIL_BATCH, PRINT_LIMIT } from './donor-letters-service.js';

export const DONOR_LETTER_PAGES = ['letters', 'receipts', 'nudge-letters', 'statement', 'settings'];
const KIND_OF_PAGE = { letters: 'letters', receipts: 'receipts', 'nudge-letters': 'nudges' };
export const PAGE_OF_KIND = { letters: 'letters', receipts: 'receipts', nudges: 'nudge-letters' };

const hidden = (name, value) => (value === '' || value == null ? '' : `<input type="hidden" name="${e(name)}" value="${e(value)}">`);
const namedRefusal = `<div class="dl-card"><h2>Donor letters name each giver</h2><p class="muted">They are available to people with Giving view access. Council access to Giving is totals only.</p></div>`;
const unavailable = (message) => `<p class="status status-error">Connect could not answer: ${e(message || 'no answer')}. Nothing here is a real empty list.</p>`;
const statusBanner = (status) => (status ? `<p class="status${status.ok ? '' : ' status-error'}">${e(status.message)}</p>` : '');

function keepFields(kind, p) {
  if (kind === 'receipts') return hidden('from', p.from) + hidden('to', p.to) + hidden('threshold', p.threshold) + hidden('first_gift', p.firstGift ? '1' : '0') + hidden('channel', p.channel);
  if (kind === 'nudges') return hidden('year', p.year) + hidden('scope', p.nudgeScope) + hidden('fund_id', p.fund) + hidden('option', p.option) + hidden('channel', p.channel);
  return hidden('type', p.type) + hidden('year', p.year) + hidden('scope', p.scope) + hidden('channel', p.channel) + hidden('through', p.through);
}

function channelToggle(page, p, extra) {
  const link = (ch, label) => `<a class="dl-pill${p.channel === ch ? ' is-on' : ''}" href="/?${new URLSearchParams({ section: 'giving-letters', page, ...extra, channel: ch }).toString().replace(/&/g, '&amp;')}">${label}</a>`;
  return `<div class="dl-pills" aria-label="Channel">${link('email', 'Email')}${link('print', 'Print')}</div>`;
}

function counts(c) {
  if (!c) return '';
  return `<div class="grid">${[['Recipients', c.total], ['Already done', c.sent], ['Pending', c.unsent], ['No email address', c.no_email]].map(([l, v]) => `<div class="card"><small>${l}</small><strong>${Number(v || 0)}</strong></div>`).join('')}</div>`;
}

// The recipient table as one form. Pending rows start checked (email: only those with an address).
function recipientForm(kind, p, rows, { canEdit, columns, cells }) {
  const email = p.channel === 'email';
  const selectable = (r) => (email ? r.has_email : true);
  const body = rows.map((r) => `<tr class="${r.sent ? 'is-done' : ''}"><td>${selectable(r) && canEdit ? `<input type="checkbox" name="key" value="${e(r.recipient_key)}"${!r.sent ? ' checked' : ''} aria-label="Select ${e(r.name)}">` : ''}</td>${cells(r)}<td>${r.sent ? `<span class="dl-done">✓ ${email ? 'sent' : 'printed'}</span>` : email && !r.has_email ? '<span class="muted">no email</span>' : '<span class="dl-pending">pending</span>'}</td></tr>`).join('');
  const pendingEmail = rows.filter((r) => !r.sent && selectable(r)).length;
  const buttons = canEdit ? `<div class="dl-actions">
      ${email ? `<button type="submit" name="action" value="email" class="dl-primary">Email the checked letters</button><span class="muted">Up to ${EMAIL_BATCH} at a time; send again for the rest. ${pendingEmail} pending with an address.</span>`
        : `<button type="submit" formmethod="get" formaction="/giving-letters/print" formtarget="_blank" class="dl-primary">Open the print sheet</button><span class="muted">Up to ${PRINT_LIMIT} letters; mark them printed from the sheet.</span>`}
      <button type="submit" name="action" value="mark" class="dl-secondary">Mark checked as ${email ? 'sent' : 'printed'}</button>
      <button type="submit" name="action" value="unmark" class="dl-secondary">Undo checked</button></div>` : '';
  return `<form method="POST" action="/api/v1/giving-letters" class="dl-form">${hidden('kind', kind)}${keepFields(kind, p)}
    ${buttons}<div class="table-wrap"><table class="dl-table"><thead><tr><th></th>${columns}<th>Status</th></tr></thead><tbody>${body || `<tr><td colspan="9" class="muted">No recipients.</td></tr>`}</tbody></table></div></form>`;
}

// ── Statements and letters ───────────────────────────────────────────────────────────────────
export function renderLettersPage({ result, params: p, canEdit, status }) {
  const t = letterTypeOf(p.type);
  const pills = LETTER_TYPES.map((x) => `<a class="dl-pill${x.key === t.key ? ' is-on' : ''}" href="/?${new URLSearchParams({ section: 'giving-letters', page: 'letters', type: x.key, year: String(p.year), channel: p.channel }).toString().replace(/&/g, '&amp;')}">${e(x.label)}</a>`).join('');
  const scope = p.scope || t.scope;
  const controls = `<form method="GET" action="/" class="dl-controls">${hidden('section', 'giving-letters')}${hidden('page', 'letters')}${hidden('type', t.key)}${hidden('channel', p.channel)}
    <label>Year <input type="number" name="year" min="2000" max="${p.thisYear + 1}" value="${p.year}"></label>
    <label>Recipients <select name="scope"><option value="givers"${scope === 'givers' ? ' selected' : ''}>People who gave</option><option value="member_households"${scope === 'member_households' ? ' selected' : ''}>Member households</option><option value="both"${scope === 'both' ? ' selected' : ''}>Both (one letter per household)</option></select></label>
    ${t.through ? `<label>Gifts through <input type="date" name="through" value="${e(p.through || (p.year === p.thisYear ? p.today : `${p.year}-12-31`))}"></label>` : ''}
    <button type="submit">Show</button></form>`;
  const head = `${statusBanner(status)}<div class="dl-pills">${pills}</div><p class="muted dl-desc">${e(t.desc)} ${t.key === 'memorial' ? '' : 'Letters use the church’s templates from Giving settings.'}</p>`;
  if (t.key === 'memorial') return `${head}<p><a href="/?section=giving-letters&amp;page=statement">Open One statement</a> to write a memorial letter for one person or household.</p>`;
  if (!result.ok) return head + controls + unavailable(result.message);
  const d = result.data;
  const table = recipientForm('letters', { ...p, scope }, d.recipients || [], {
    canEdit, columns: '<th>Recipient</th><th>Sent to</th><th class="num">Given this year</th><th></th>',
    cells: (r) => `<td>${e(r.name)}${r.kind === 'household' ? ' <span class="dl-tag">household</span>' : ''}</td><td>${e(r.kind === 'household' ? `${r.recipient_name || ''}${r.email ? ` · ${r.email}` : ''}` : r.email || '—')}</td><td class="num">${fmtMoney(r.total_cents)}</td><td><a href="/?section=giving-letters&amp;page=statement&amp;key=${e(r.recipient_key)}&amp;year=${p.year}&amp;type=${e(t.key)}">View</a></td>`,
  });
  return `${head}${controls}${channelToggle('letters', p, { type: t.key, year: String(p.year), ...(p.scope ? { scope: p.scope } : {}), ...(p.through ? { through: p.through } : {}) })}${counts(d.counts)}${table}`;
}

// ── Thank-you receipts ───────────────────────────────────────────────────────────────────────
export function renderReceiptsPage({ result, params: p, canEdit, status }) {
  const controls = `<form method="GET" action="/" class="dl-controls">${hidden('section', 'giving-letters')}${hidden('page', 'receipts')}${hidden('channel', p.channel)}
    <label>From <input type="date" name="from" value="${e(p.from)}"></label><label>To <input type="date" name="to" value="${e(p.to)}"></label>
    <label>Gifts of at least $<input type="number" name="threshold" min="0" step="25" value="${p.threshold}" class="dl-small"></label>
    <label class="dl-check"><input type="checkbox" name="first_gift" value="1"${p.firstGift ? ' checked' : ''}> and every first gift</label>
    ${hidden('first_gift', '0')}<button type="submit">Show</button></form>`;
  const head = `${statusBanner(status)}<p class="muted dl-desc">Thank each larger gift, and every first gift, soon after it arrives. The letter suggests a recurring gift of about a quarter of the gift each month.</p>`;
  if (!result.ok) return head + controls + unavailable(result.message);
  const d = result.data;
  const table = recipientForm('receipts', p, d.receipts || [], {
    canEdit, columns: '<th>Donor</th><th class="num">Gift</th><th>Date</th><th>Fund</th><th class="num">Suggest a month</th>',
    cells: (r) => `<td>${e(r.name)}${(r.reasons || []).includes('first_gift') ? ' <span class="dl-tag">first gift</span>' : ''}<small class="dl-sub">${e(r.email || 'no email')}</small></td><td class="num">${fmtMoney(r.amount_cents)}</td><td>${e(fmtDate(r.gift_date))}</td><td>${e(r.funds || '')}</td><td class="num">${fmtMoney(r.suggested_monthly_cents)}</td>`,
  });
  return `${head}${controls}${channelToggle('receipts', p, { from: p.from, to: p.to, threshold: String(p.threshold), first_gift: p.firstGift ? '1' : '0' })}${counts(d.counts)}${table}`;
}

// ── Nudge letters ────────────────────────────────────────────────────────────────────────────
export function renderNudgeLettersPage({ result, funds, params: p, canEdit, status }) {
  const fundOptions = (funds || []).map((f) => `<option value="${e(f.id)}"${String(f.id) === p.fund ? ' selected' : ''}>${e(f.name)}</option>`).join('');
  const controls = `<form method="GET" action="/" class="dl-controls">${hidden('section', 'giving-letters')}${hidden('page', 'nudge-letters')}${hidden('channel', p.channel)}
    <label>Year <input type="number" name="year" min="2000" max="${p.thisYear + 1}" value="${p.year}"></label>
    <label>Fund <select name="fund_id"><option value="">All funds</option>${fundOptions}</select></label>
    <label>Write to <select name="scope"><option value="household"${p.nudgeScope === 'household' ? ' selected' : ''}>Households</option><option value="person"${p.nudgeScope === 'person' ? ' selected' : ''}>People</option></select></label>
    <label>Ask <select name="option">${['modest', 'standard', 'generous'].map((o) => `<option value="${o}"${p.option === o ? ' selected' : ''}>${o[0].toUpperCase() + o.slice(1)}</option>`).join('')}</select></label>
    <button type="submit">Show</button></form>`;
  const head = `${statusBanner(status)}<p class="muted dl-desc">A thank-you with a gentle invitation to the next step, from the Plateaus report. Each letter names the church’s impact statement for that step when there is one.</p>`;
  if (!result.ok) return head + controls + unavailable(result.message);
  const d = result.data;
  const partial = d.partial ? `<p class="notice">${e(d.year)} is not over yet, so each giver’s weekly amount is their giving so far this year.</p>` : '';
  const table = recipientForm('nudges', p, d.recipients || [], {
    canEdit, columns: '<th>Giver</th><th class="num">Gives now</th><th class="num">Invited to</th><th class="num">If yes, a year</th>',
    cells: (r) => `<td>${e(r.name)}<small class="dl-sub">${e(r.email || 'no email')}</small></td><td class="num">${fmtMoney(r.cadence_amount_cents)} ${e(r.cadence_adverb || '')}</td><td class="num">${fmtMoney(r.option?.cadence_target_cents)} ${e(r.cadence_adverb || '')}</td><td class="num">+${fmtMoney(r.option?.cadence_annual_delta_cents)}</td>`,
  });
  return `${head}${controls}${partial}${channelToggle('nudge-letters', p, { year: String(p.year), scope: p.nudgeScope, option: p.option, ...(p.fund ? { fund_id: p.fund } : {}) })}${counts(d.counts)}${table}`;
}

// ── One statement ────────────────────────────────────────────────────────────────────────────
export function renderStatementPage({ search, statement, config, params: p, key, q, canEdit, status }) {
  const t = letterTypeOf(p.type);
  const find = `<form method="GET" action="/" class="dl-controls">${hidden('section', 'giving-letters')}${hidden('page', 'statement')}
    <label>Find a giver or household <input type="search" name="q" value="${e(q || '')}" placeholder="Name" minlength="2"></label>
    <label>Year <input type="number" name="year" min="2000" max="${p.thisYear + 1}" value="${p.year}"></label><button type="submit">Find</button></form>`;
  let found = '';
  if (q && search) {
    if (!search.ok) found = unavailable(search.message);
    else {
      const needle = q.toLowerCase();
      const hits = (search.data.recipients || []).filter((r) => `${r.name} ${r.recipient_name || ''}`.toLowerCase().includes(needle)).slice(0, 25);
      found = hits.length ? `<ul class="dl-hits">${hits.map((r) => `<li><a href="/?section=giving-letters&amp;page=statement&amp;key=${e(r.recipient_key)}&amp;year=${p.year}">${e(r.name)}</a>${r.kind === 'household' ? ' <span class="dl-tag">household</span>' : ''} <span class="muted">${fmtMoney(r.total_cents)} in ${p.year}</span></li>`).join('')}</ul>`
        : `<p class="muted">No giver or member household named “${e(q)}” for ${p.year}.</p>`;
    }
  }
  if (!key) return `${statusBanner(status)}<p class="muted dl-desc">A statement or letter for one person or household: view it, download the gifts, print it, or email it.</p>${find}${found}`;
  if (!statement?.ok) return statusBanner(status) + find + unavailable(statement?.message);
  if (!config?.ok) return statusBanner(status) + find + unavailable(config?.message);
  const s = statement.data.statements?.[0];
  if (!s) return `${statusBanner(status)}${find}<p class="muted">No such giver or household.</p>`;
  const name = s.kind === 'household' ? s.household?.name : `${s.person?.first_name || ''} ${s.person?.last_name || ''}`.trim();
  const rows = (s.entries || []).map((x) => `<tr><td>${e(fmtDate(x.gift_date))}</td>${s.kind === 'household' ? `<td>${e(`${x.first_name || ''} ${x.last_name || ''}`.trim())}</td>` : ''}<td>${e(x.fund_name)}</td><td class="num">${fmtMoney(x.amount)}</td>${s.kind === 'household' ? '' : `<td>${e(x.method || '')}</td>`}</tr>`).join('');
  const types = LETTER_TYPES.filter((x) => x.key !== 'appeal').map((x) => `<a class="dl-pill${x.key === t.key ? ' is-on' : ''}" href="/?section=giving-letters&amp;page=statement&amp;key=${e(key)}&amp;year=${p.year}&amp;type=${x.key}">${e(x.label)}</a>`).join('');
  const letter = renderStatementLetter(s, t.key, config.data, p.today);
  const email = s.kind === 'person' ? s.person?.email : '';
  const sendForm = canEdit ? `<form method="POST" action="/api/v1/giving-letters" class="dl-actions">${hidden('kind', 'single')}${hidden('key', key)}${hidden('year', p.year)}${hidden('type', t.key)}${hidden('through', p.through)}
      <a class="dl-secondary" href="/giving-letters/print?kind=single&amp;key=${e(key)}&amp;year=${p.year}&amp;type=${e(t.key)}${p.through ? `&amp;through=${e(p.through)}` : ''}" target="_blank">Print this letter</a>
      ${email ? `<button type="submit" name="action" value="email" class="dl-primary">Email to ${e(email)}</button>` : '<span class="muted">No email address on file for this statement; print it instead.</span>'}</form>` : '';
  return `${statusBanner(status)}${find}
    <section class="dl-card"><div class="dl-cardhead"><h2>${e(name)}, ${e(s.year)}</h2><a href="/api/v1/giving-statement.csv?key=${e(key)}&amp;year=${p.year}">Download the gifts (CSV)</a></div>
      <p class="muted">${s.entries?.length || 0} gifts through ${e(fmtDate(s.through))}, ${fmtMoney(s.total_cents)} in all. Voided gifts are left out; refunds count at what was kept.</p>
      <div class="table-wrap"><table class="dl-table"><thead><tr><th>Date</th>${s.kind === 'household' ? '<th>Person</th>' : ''}<th>Fund</th><th class="num">Amount</th>${s.kind === 'household' ? '' : '<th>Method</th>'}</tr></thead><tbody>${rows || '<tr><td colspan="5" class="muted">No gifts recorded.</td></tr>'}</tbody><tfoot><tr><td colspan="${s.kind === 'household' ? 3 : 2}">Total</td><td class="num">${fmtMoney(s.total_cents)}</td>${s.kind === 'household' ? '' : '<td></td>'}</tr></tfoot></table></div></section>
    <section class="dl-card"><h2>Letter</h2><div class="dl-pills">${types}</div>${t.through ? `<form method="GET" action="/" class="dl-controls">${hidden('section', 'giving-letters')}${hidden('page', 'statement')}${hidden('key', key)}${hidden('year', p.year)}${hidden('type', t.key)}<label>Gifts through <input type="date" name="through" value="${e(p.through || s.through)}"></label><button type="submit">Update</button></form>` : ''}
      <div class="dl-letter">${letter}</div>${sendForm}</section>`;
}

// ── Letter settings ──────────────────────────────────────────────────────────────────────────
// What every letter uses: the church's name and EIN, the sending address, the online giving link,
// the letterhead logo and the two templates. An administrator changes them (as in Connect's
// Settings); Giving view sees them. Previews use a fictional giver.
const SAMPLE_STATEMENT = {
  mode: 'person', kind: 'person', year: 0, total_cents: 35000, person: { first_name: 'Sample', last_name: 'Giver' },
  entries: [{ gift_date: '', fund_name: '40085 General Fund', amount: 25000, method: 'check' }, { gift_date: '', fund_name: '50010 Missions', amount: 10000, method: 'online' }],
};
const MERGE_FIELDS = [['{{name}}', 'the giver or household'], ['{{year}}', 'the letter’s year'], ['{{total}}', 'total given'], ['{{gift_table}}', 'the table of gifts'],
  ['{{date}}', 'today’s date'], ['{{ein}}', 'the EIN'], ['{{#if_ein}} … {{/if_ein}}', 'the IRS acknowledgement, only when an EIN is set'],
  ['{{giving_url}}', 'the online giving link'], ['{{#if_giving_url}} … {{/if_giving_url}}', 'shown only when the link is set']];

export function renderLetterSettingsPage({ config, canAdmin, params: p, status }) {
  if (!config?.ok) return statusBanner(status) + unavailable(config?.message);
  const c = config.data;
  const sample = { ...SAMPLE_STATEMENT, year: p.year, entries: SAMPLE_STATEMENT.entries.map((x, i) => ({ ...x, gift_date: `${p.year}-0${i + 3}-01` })) };
  const preview = (type) => `<div class="dl-letter">${renderStatementLetter(sample, type, c, p.today)}</div>`;
  const ro = canAdmin ? '' : ' disabled';
  const field = (name, label, value, attrs = '') => `<label>${label}<input name="${name}" value="${e(value || '')}"${attrs}${ro}></label>`;
  const intro = canAdmin
    ? '<p class="muted dl-desc">Every letter and statement uses these. A blank field keeps what is saved. Changes apply to the next letter sent.</p>'
    : '<p class="muted dl-desc">Every letter and statement uses these. An administrator changes them.</p>';
  const form = `<form method="POST" action="/api/v1/giving-letters-settings" enctype="multipart/form-data" class="dl-settings">
    <section class="dl-card"><h2>Church and sender</h2><div class="dl-fields">
      ${field('church_name', 'Church name', c.church_name, ' maxlength="200"')}
      ${field('church_ein', 'EIN (tax ID)', c.church_ein, ' maxlength="20" placeholder="00-0000000"')}
      ${field('church_from_name', 'Sent from (name)', c.from_name, ' maxlength="200"')}
      ${field('church_from_email', 'Sent from (email)', c.from_email, ' type="email" maxlength="254"')}
      ${field('online_giving_url', 'Online giving link', c.online_giving_url, ' type="url" maxlength="500" placeholder="https://"')}
    </div>${c.church_ein ? '' : '<p class="status status-error">No EIN is set, so year-end statements leave out the IRS acknowledgement sentence.</p>'}${c.from_email ? '' : '<p class="status status-error">No sending address is set, so letters cannot be emailed.</p>'}</section>
    <section class="dl-card"><h2>Letterhead logo</h2>
      <p class="muted">Shown beside the church name at the top of every letter, about 44 pixels tall. A small PNG or JPEG under 300 KB shows best in email.</p>
      ${c.logo_url ? `<p><img src="${e(c.logo_url)}" alt="Current letterhead logo" height="44" class="dl-logo"></p>` : '<p class="muted">No logo; letters show the church name alone.</p>'}
      ${canAdmin ? `<div class="dl-fields"><label>Replace with <input type="file" name="logo" accept="image/png,image/jpeg,image/gif,image/webp"></label>${c.logo_url ? '<label class="dl-check"><input type="checkbox" name="remove_logo" value="1"> Remove the logo</label>' : ''}</div>` : ''}</section>
    <section class="dl-card"><h2>Year-end and quarterly template</h2><p class="muted">Used for year-end and quarterly statements and memorial letters. HTML.</p>
      <textarea name="template_year_end" rows="12" class="dl-template"${ro}>${e(c.templates?.year_end || '')}</textarea>
      <details><summary>Preview with a sample giver</summary>${preview('year_end')}</details></section>
    <section class="dl-card"><h2>Mid-year, thank-you and appeal template</h2><p class="muted">Used for mid-year updates, thank-you letters and giving appeals. HTML.</p>
      <textarea name="template_midyear" rows="12" class="dl-template"${ro}>${e(c.templates?.midyear || '')}</textarea>
      <details><summary>Preview with a sample giver</summary>${preview('midyear')}</details></section>
    <section class="dl-card"><h2>Merge fields</h2><table class="dl-table"><tbody>${MERGE_FIELDS.map(([f, d]) => `<tr><td><code>${e(f)}</code></td><td>${e(d)}</td></tr>`).join('')}</tbody></table></section>
    ${canAdmin ? '<div class="dl-actions"><button type="submit" class="dl-primary">Save letter settings</button></div>' : ''}</form>`;
  return statusBanner(status) + intro + form;
}

export function renderDonorLettersPage(pageId, ctx) {
  if (ctx.namedHidden) return namedRefusal;
  switch (pageId) {
    case 'receipts': return renderReceiptsPage(ctx);
    case 'nudge-letters': return renderNudgeLettersPage(ctx);
    case 'statement': return renderStatementPage(ctx);
    case 'settings': return renderLetterSettingsPage(ctx);
    default: return renderLettersPage(ctx);
  }
}
export const kindOfPage = (pageId) => KIND_OF_PAGE[pageId] || 'letters';

// The print sheet: every chosen letter on its own page, and (on screen only) a form to record them
// as printed. A standalone document so nothing but the letters prints.
export function renderPrintSheet({ letters, kind, params, keepFields: fields, canEdit, note }) {
  const pages = letters.map((l) => `<section class="sheet">${l.html}</section>`).join('');
  const mark = canEdit && kind !== 'single' ? `<form method="POST" action="/api/v1/giving-letters">${hidden('kind', kind)}${fields}${letters.map((l) => hidden('key', l.recipient_key)).join('')}
      <button type="submit" name="action" value="mark">Mark these ${letters.length} as printed</button></form>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Letters to print · Timothy Finance</title>
<style>body{margin:0;background:#EEF0F4;font-family:Georgia,serif;color:#16213A}.bar{position:sticky;top:0;display:flex;gap:16px;align-items:center;flex-wrap:wrap;padding:12px 20px;background:#fff;border-bottom:1px solid #E3E6EC;font:14px system-ui,sans-serif}.bar form{margin:0}.bar button{padding:8px 14px;border:0;border-radius:8px;background:#1B2A4A;color:#fff;font:600 14px system-ui,sans-serif;cursor:pointer}.sheet{max-width:640px;margin:20px auto;padding:48px 56px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.08)}@media print{body{background:#fff}.bar{display:none}.sheet{margin:0;padding:0 0 0;box-shadow:none;page-break-after:always;break-after:page}.sheet:last-child{page-break-after:auto;break-after:auto}}</style>
</head><body><div class="bar"><b>${letters.length} letter${letters.length === 1 ? '' : 's'} ready to print</b><span>Use your browser’s Print (Ctrl+P or ⌘P); each letter starts a new page.</span>${note ? `<span>${e(note)}</span>` : ''}${mark}</div>${pages || '<p style="padding:20px">No letters to print.</p>'}</body></html>`;
}

export const DONOR_LETTERS_STYLES = `
  .dl-desc { margin:.4rem 0 0; }
  .dl-pills { display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; }
  .dl-pill { padding:6px 12px; border:1px solid var(--line); border-radius:999px; background:#fff; color:var(--ink); font-size:13px; font-weight:600; text-decoration:none; }
  .dl-pill.is-on { border-color:var(--navy); background:var(--navy); color:#fff; }
  .dl-controls { display:flex; flex-wrap:wrap; align-items:flex-end; gap:10px 16px; margin-top:14px; padding:12px 16px; border:1px solid var(--line); border-radius:10px; background:#fff; }
  .dl-controls label { display:flex; flex-direction:column; gap:4px; }
  .dl-controls label.dl-check { flex-direction:row; align-items:center; }
  .dl-controls button { margin-top:0; }
  .dl-small { width:6rem; }
  .dl-actions { display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-top:14px; }
  .dl-actions button { margin-top:0; }
  .dl-primary { background:var(--navy); color:#fff; }
  .dl-secondary { padding:9px 14px; border:1px solid var(--line); border-radius:8px; background:#fff; color:var(--navy); font:inherit; font-size:14px; font-weight:600; text-decoration:none; cursor:pointer; }
  .dl-secondary:hover { background:var(--hover); }
  .dl-table th:nth-child(n+3), .dl-table td:nth-child(n+3) { text-align:left; }
  .dl-table .num { text-align:right; white-space:nowrap; }
  .dl-table tr.is-done td { color:var(--muted); }
  .dl-sub { display:block; color:var(--muted); font-size:12px; }
  .dl-tag { padding:2px 7px; border-radius:999px; background:var(--page); color:var(--muted); font-size:11px; font-weight:600; }
  .dl-done { color:var(--green); font-weight:600; } .dl-pending { color:var(--gold-ink); font-weight:600; }
  .dl-card { margin-top:16px; padding:18px 20px; border:1px solid var(--line); border-radius:10px; background:#fff; }
  .dl-card h2 { margin:0 0 .35rem; font-size:18px; }
  .dl-cardhead { display:flex; justify-content:space-between; align-items:baseline; gap:12px; flex-wrap:wrap; }
  .dl-letter { margin-top:14px; padding:28px 32px; border:1px solid var(--line-soft); border-radius:8px; background:#FDFCF9; color:#16213A; }
  .dl-hits { margin:12px 0 0; padding-left:20px; line-height:1.9; }
  .dl-fields { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px 16px; margin-top:10px; }
  .dl-fields label { display:flex; flex-direction:column; gap:4px; font-weight:600; font-size:13px; }
  .dl-fields label.dl-check { flex-direction:row; align-items:center; font-weight:400; }
  .dl-template { width:100%; box-sizing:border-box; margin-top:8px; font:12px/1.5 ui-monospace,Menlo,monospace; }
  .dl-logo { max-height:44px; width:auto; }
  .dl-settings details { margin-top:10px; }
  .dl-table tfoot td { font-weight:700; border-top:2px solid var(--navy); }
`;
