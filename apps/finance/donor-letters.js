// Donor letters, rendered by Finance. A port of Connect's letter code (js-reports.js
// renderLetterHTML/buildGiftTable/letterheadImgHtml and js-giving.js's subjects, template choice,
// thank-you receipt and nudge letter), so a letter reads exactly as it did from Connect. The
// church's templates, name, EIN, logo and giving link come from Connect (giving-letters-v1
// op=config); the gifts from its statements (op=statements).

export const LETTER_TYPES = Object.freeze([
  { key: 'year_end', label: 'Year-end statement', desc: 'The annual charitable-contribution statement for tax purposes.', scope: 'givers' },
  { key: 'midyear', label: 'Mid-year update', desc: 'A mid-year thank-you with giving to date and a word about recurring giving.', scope: 'givers', through: true },
  { key: 'quarterly', label: 'Quarterly statement', desc: 'A giving statement through the end of a quarter, for review.', scope: 'givers', through: true },
  { key: 'thank_you', label: 'Thank-you letter', desc: 'A warm thank-you to everyone who gave this year.', scope: 'givers' },
  { key: 'appeal', label: 'Giving appeal', desc: 'Sent to every member household, whether or not they have given yet.', scope: 'member_households' },
  { key: 'memorial', label: 'Memorial letter', desc: 'Written one at a time: open One statement and choose the person or household.', scope: 'none' },
]);

export const letterTypeOf = (key) => LETTER_TYPES.find((t) => t.key === key) || LETTER_TYPES[0];

export function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const esc = escapeHtml;

export function fmtMoney(cents) {
  const n = (Number(cents) || 0) / 100;
  return `${n < 0 ? '-' : ''}$${Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}
export const fmtWholeDollars = (cents) => `$${Math.round((Number(cents) || 0) / 100).toLocaleString('en-US')}`;

export function fmtDate(iso) {
  if (!iso) return '';
  const p = String(iso).split('-');
  if (p.length < 3) return String(iso);
  if (p[1] === '00' && p[2].slice(0, 2) === '00') return p[0];
  if (p[0] === '0001') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[Number.parseInt(p[1], 10) - 1] || p[1]} ${Number.parseInt(p[2], 10)}`;
  }
  return `${Number.parseInt(p[1], 10)}/${Number.parseInt(p[2], 10)}/${p[0]}`;
}

export function longDate(iso) {
  const [y, m, d] = String(iso || '').slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

// Which saved template a letter type uses, and its email subject (as in Connect).
export const templateTypeOf = (t) => (['midyear', 'appeal', 'thank_you'].includes(t) ? 'midyear' : 'year_end');
export function letterSubject(t, year, church) {
  if (t === 'midyear' || t === 'appeal') return `${year} Mid-Year Giving Update — ${church}`;
  if (t === 'thank_you') return `Thank You for Your Generosity — ${church}`;
  if (t === 'quarterly') return `${year} Giving Statement — ${church}`;
  return `${year} Charitable Contribution Statement — ${church}`;
}

export function giftTable(entries, mode) {
  if (!entries?.length) return 'No contributions recorded for this period.';
  const td = 'style="text-align:left;padding:4px 8px;"';
  const tdR = 'style="text-align:right;padding:4px 8px;"';
  const header = mode === 'household'
    ? `<tr><th ${td}>Date</th><th ${td}>Person</th><th ${td}>Fund</th><th ${tdR}>Amount</th></tr>`
    : `<tr><th ${td}>Date</th><th ${td}>Fund</th><th ${tdR}>Amount</th><th ${td}>Method</th></tr>`;
  const rows = entries.map((e) => (mode === 'household'
    ? `<tr><td ${td}>${esc(fmtDate(e.gift_date))}</td><td ${td}>${esc(`${e.first_name || ''} ${e.last_name || ''}`.trim())}</td><td ${td}>${esc(e.fund_name)}</td><td ${tdR}>${fmtMoney(e.amount)}</td></tr>`
    : `<tr><td ${td}>${esc(fmtDate(e.gift_date))}</td><td ${td}>${esc(e.fund_name)}</td><td ${tdR}>${fmtMoney(e.amount)}</td><td ${td}>${esc(e.method)}</td></tr>`)).join('');
  return `<table style="width:100%;border-collapse:collapse;font-size:.9rem;"><thead style="background:#f5f5f5;">${header}</thead><tbody>${rows}</tbody></table>`;
}

// The church name, with the letterhead logo beside it when one is set. Absolute URL: an email
// client cannot resolve a relative path (Connect serves the logo without sign-in for that reason).
export function letterhead(config) {
  const name = config.church_name || 'Timothy Lutheran Church';
  const nameDiv = `<div style="font-size:16px;font-weight:bold;">${esc(name)}</div>`;
  if (!config.logo_url) return nameDiv;
  const img = `<img src="${esc(config.logo_url)}" alt="${esc(name)}" width="44" height="44" style="max-height:44px;max-width:44px;width:auto;height:auto;display:block;flex-shrink:0;">`;
  return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">${img}${nameDiv}</div>`;
}

export function wrapLetter(config, body) {
  return `<div style="font-family:Georgia,serif;font-size:14px;line-height:1.65;max-width:560px;">${letterhead(config)}<hr style="margin:10px 0;">${body}</div>`;
}

// The church's template with its merge fields filled (Connect's renderLetterHTML).
export function renderTemplateLetter(statement, letterType, config, today) {
  let tpl = templateTypeOf(letterType) === 'midyear' ? config.templates?.midyear : config.templates?.year_end;
  tpl = String(tpl || '').replace(/<span[^>]*data-mce-token="[^"]*"[^>]*>([\s\S]*?)<\/span>/g, '$1');
  const name = statement.mode === 'household'
    ? (statement.household?.name || 'Friend')
    : (`${statement.person?.first_name || ''} ${statement.person?.last_name || ''}`.trim() || 'Friend');
  const ein = config.church_ein || '';
  const einLine = `Our EIN/Tax ID is ${ein}. No goods or services were provided in exchange for these contributions. Please retain this letter for your tax records.`;
  const givingUrl = config.online_giving_url || '';
  const values = {
    name: esc(name), year: String(statement.year || ''), total: fmtMoney(statement.total_cents || 0), ein: esc(ein),
    giving_url: esc(givingUrl), date: longDate(today), gift_table: giftTable(statement.entries || [], statement.mode),
  };
  const letter = tpl
    .replace(/\{\{#if_ein\}\}[\s\S]*?\{\{\/if_ein\}\}/g, ein ? esc(einLine) : '')
    .replace(/\{\{#if_giving_url\}\}([\s\S]*?)\{\{\/if_giving_url\}\}/g, givingUrl ? '$1' : '')
    .replace(/\{\{(name|year|total|ein|giving_url|date|gift_table)\}\}/g, (_, k) => values[k]);
  return letter.replace(/\\n/g, '<br>');
}

export function renderStatementLetter(statement, letterType, config, today) {
  return wrapLetter(config, renderTemplateLetter(statement, letterType, config, today));
}

// The thank-you receipt from the receipts queue (Connect's givReceiptLetterHtml).
export function renderReceiptLetter(r, config) {
  const church = config.church_name || 'Timothy Lutheran Church';
  const givingUrl = config.online_giving_url || '';
  const isFirst = (r.reasons || []).includes('first_gift');
  const body = `<p>Dear ${esc(r.name)},</p>`
    + `<p>Thank you for your generous gift of <strong>${fmtMoney(r.amount_cents)}</strong> on ${esc(fmtDate(r.gift_date))}${r.funds ? ` to ${esc(r.funds)}` : ''}. `
    + `Your generosity directly supports the ministry and mission of ${esc(church)}.</p>`
    + (isFirst ? '<p>We are especially grateful for your first gift &mdash; welcome, and thank you for partnering with us.</p>' : '')
    + `<p>Would you consider making an ongoing impact? A recurring gift of about <strong>${fmtMoney(r.suggested_monthly_cents)} a month</strong> `
    + 'would help sustain our ministries throughout the year and let you give without having to remember each week.'
    + (givingUrl ? ` You can set up automatic monthly giving in about a minute at <a href="${esc(givingUrl)}">${esc(givingUrl)}</a>.` : '')
    + `</p><p>With gratitude,</p><p>${esc(church)}</p>`;
  return wrapLetter(config, body);
}
export const receiptSubject = (config) => `Thank you for your gift — ${config.church_name || 'Timothy Lutheran Church'}`;

// The giving nudge (Connect's givNudgesLetterHtml).
export function renderNudgeLetter(r, config) {
  const church = config.church_name || 'Timothy Lutheran Church';
  const o = r.option || {};
  const adverb = r.cadence_adverb || 'a week';
  const greeting = r.kind === 'household' ? `Dear ${esc(r.name)}` : `Dear ${esc(String(r.recipient_name || r.name || '').split(' ')[0])}`;
  const givingUrl = config.online_giving_url || '';
  const body = `<p>${greeting},</p>`
    + `<p>Thank you for your faithful giving to ${esc(church)}. Your generosity is part of everything this congregation is able to do &mdash; worship, teaching, care for our neighbors, and the daily work of the church.</p>`
    + `<p>Over the past year your giving has averaged about <b>${fmtWholeDollars(r.cadence_amount_cents)} ${esc(adverb)}</b>.`
    + ` As we look ahead, would you prayerfully consider moving to <b>${fmtWholeDollars(o.cadence_target_cents)} ${esc(adverb)}</b>?</p>`
    + `<p>That is a change of ${fmtWholeDollars(o.cadence_delta_cents)} ${esc(adverb)} &mdash; about <b>${fmtWholeDollars(o.cadence_annual_delta_cents)}</b> over a year.`
    + (o.impact_text ? ` ${esc(o.impact_text)}` : '') + '</p>'
    + (givingUrl ? `<p>If it would help to make your giving automatic, you can set that up at <a href="${esc(givingUrl)}">${esc(givingUrl)}</a>.</p>` : '')
    + '<p>Please hear this as an invitation and never an expectation. Whatever you decide, we are grateful for you.</p>'
    + `<p>In Christ,<br>${esc(church)}</p>`;
  return wrapLetter(config, body);
}
export const nudgeSubject = (config) => `A word of thanks — and an invitation — from ${config.church_name || 'Timothy Lutheran Church'}`;
