// Giving, v3 design: Trends, Year over year, Pledges, Giving what-if and Giving statements, plus
// the household bands and the nudge queue that Giving reports shows on its combined Giving bands
// and Nudges and next steps pages. Every figure comes live from Connect (giving-analytics-v1 for
// totals, giving-analytics-people-v1 for the named pages); Finance keeps no copy. The totals pages
// name nobody, so council may read them. Statements and nudges name households, so Connect only
// returns them for Giving view access, and council preview here shows the same refusal.
import { escapeHtml as e } from './render-helpers.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CONNECT_GIVING = 'https://connect.timothystl.org/';
const LETTER_LABELS = { year_end: 'Year-end statement', midyear: 'Mid-year update', quarterly: 'Quarterly statement' };
export const WHAT_IF_FIELDS = Object.freeze(['households', 'average', 'retention', 'new_households', 'new_ratio', 'gift_change']);

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
function money(cents) {
  return USD.format(Math.round((Number(cents) || 0) / 100));
}

function compact(cents) {
  const dollars = (Number(cents) || 0) / 100;
  if (Math.abs(dollars) >= 1e6) return `$${(dollars / 1e6).toFixed(1)}M`;
  if (Math.abs(dollars) >= 1e3) return `$${(dollars / 1e3).toFixed(Math.abs(dollars) >= 1e4 ? 0 : 1)}k`;
  return `$${Math.round(dollars)}`;
}

function signedMoney(cents) {
  return `${cents < 0 ? '−' : '+'}${money(Math.abs(cents))}`;
}

function pct(value, digits = 0) {
  return `${(value * 100).toFixed(digits)}%`;
}

function change(now, before) {
  return before ? (now - before) / before : null;
}

function shortDate(iso) {
  const [y, m, d] = String(iso || '').slice(0, 10).split('-').map(Number);
  return y ? `${MONTHS[m - 1]} ${d}` : '—';
}

function href(page, params = {}, section = 'giving-analytics') {
  const search = new URLSearchParams({ section, page, ...params });
  if (search.get('fund') === 'general') search.delete('fund');
  return `/?${search.toString().replace(/&/g, '&amp;')}`;
}

// ── Fund scope ────────────────────────────────────────────────────────────────────────────────
// Connect answers every totals page for one slice of giving: the General Fund family, donor
// giving (General Fund plus restricted and designated funds), all revenue except MDO (gifts plus
// earned and passive income), all funds, or one fund. Connect's fund categories decide which
// fund is which. The General Fund is the default (the council's usual question, as on Connect's
// board report); the choice rides on ?fund= so it survives moving between pages.

function fundOf(data) {
  // An older Connect that ignores ?fund= answers for all funds and sends no scope; say so.
  return data?.fund || { key: 'all', label: 'All funds', fund_count: 0 };
}

function fundKey(data) {
  return fundOf(data).key;
}

const SCOPE_TABS = [['general', 'General Fund'], ['donor', 'Donor giving'], ['revenue', 'All revenue (no MDO)']];

function fundCount(n) {
  return `${n} fund${n === 1 ? '' : 's'}`;
}

function scopeSentence(data) {
  const f = fundOf(data);
  if (f.key === 'all') return 'Every gift entered in Connect counts, including loose plate cash.';
  if (f.key === 'general') return `General Fund gifts only (${fundCount(f.fund_count)} Connect counts as the General Fund), including loose plate cash given there.`;
  if (f.key === 'donor') return `Every donor gift: the General Fund plus restricted and designated funds (${fundCount(f.fund_count)}), including loose plate cash. Earned income, passive income and MDO are left out.`;
  if (f.key === 'revenue') return `All revenue entered in Connect except MDO: donor gifts plus earned and passive income (${fundCount(f.fund_count)}). Income booked only in QuickBooks is not here.`;
  return `Gifts to ${f.label} only.`;
}

// "the General Fund", "donor giving", or the fund's name, for use inside a sentence.
function scopePhrase(data) {
  const f = fundOf(data);
  return { general: 'the General Fund', donor: 'donor giving', revenue: 'all revenue except MDO', all: 'all funds' }[f.key] || f.label;
}

// A short "which funds" clause for pages about households, where plate cash never appears.
function scopeShort(data) {
  const f = fundOf(data);
  if (f.key === 'all') return '';
  if (f.key === 'general') return 'General Fund gifts only. ';
  if (f.key === 'donor') return 'Donor gifts to any fund except earned and passive income and MDO. ';
  if (f.key === 'revenue') return 'All revenue in Connect except MDO. ';
  return `Gifts to ${f.label} only. `;
}

// General Fund, donor giving and all revenue except MDO are one click; all funds or a specific
// fund is picked from the list. A plain GET form, because Finance's CSP allows no script.
export function fundPicker(data, { section = 'giving-analytics', page, hidden = {} } = {}) {
  const current = fundKey(data);
  const options = data?.fund_options || [];
  const tabKeys = new Set(SCOPE_TABS.map(([key]) => key));
  const specific = options.filter((o) => !tabKeys.has(o.key));
  const tab = (key, label) => `<a href="${href(page, { ...hidden, fund: key }, section)}"${current === key ? ' class="is-on" aria-current="true"' : ''}>${e(label)}</a>`;
  const isSpecific = !tabKeys.has(current);
  return `<div class="ga-fund" role="group" aria-label="Which giving to show">
      <span class="ga-fund-label">Showing</span>
      <div class="ga-fund-tabs">${SCOPE_TABS.map(([key, label]) => tab(key, label)).join('')}</div>
      ${specific.length ? `<form method="GET" action="/" class="ga-fund-form${isSpecific ? ' is-on' : ''}">
        <input type="hidden" name="section" value="${e(section)}"><input type="hidden" name="page" value="${e(page)}">
        ${Object.entries(hidden).map(([k, v]) => `<input type="hidden" name="${e(k)}" value="${e(v)}">`).join('')}
        <label><span class="sr-only">Specific fund</span><select name="fund">
          <option value=""${isSpecific ? '' : ' selected'} disabled>All funds or one fund…</option>
          ${specific.map((o) => `<option value="${e(o.key)}"${o.key === current ? ' selected' : ''}>${e(o.label)}</option>`).join('')}
        </select></label>
        <button type="submit" class="button-outline">Show</button>
      </form>` : ''}
    </div>`;
}

function kpis(items) {
  return `<div class="grid">${items.map(([label, value, note, tone]) => `<div class="card"><small>${e(label)}</small><strong>${value}</strong>${note ? `<span class="${tone ? `tone-${tone}` : ''}">${note}</span>` : ''}</div>`).join('')}</div>`;
}

function unavailable(what, message) {
  return `<p class="status status-error">${e(what)} could not be read from Connect: ${e(message)} Nothing here is a real $0.</p>`;
}

function asOfLine(data) {
  const [, m, d] = data.as_of.split('-').map(Number);
  return `Calendar ${data.year} through ${MONTH_NAMES[m - 1]} ${d}. ${scopeSentence(data)}`;
}

function changeNote(now, before, label) {
  const c = change(now, before);
  if (c === null) return { text: `No gifts in ${label} to compare`, tone: '' };
  return { text: `${c >= 0 ? '+' : '−'}${Math.abs(c * 100).toFixed(1)}% vs. ${label}`, tone: c >= 0 ? 'good' : 'warn' };
}

// ── Trends ────────────────────────────────────────────────────────────────────────────────────

export function renderTrendsPage({ result, keep = {}, mdoBooks = null }) {
  if (!result.ok) return unavailable('Giving trends', result.message);
  const a = result.data;
  const t = a.totals;
  const monthLabel = MONTH_NAMES[Number(a.as_of.slice(5, 7)) - 1];
  const ytd = changeNote(t.ytd_cents, t.prior_ytd_cents, `${a.year - 1} to date`);
  const mtd = changeNote(t.mtd_cents, t.prior_mtd_cents, `${monthLabel} ${a.year - 1}`);
  const share = t.ytd_cents ? t.ytd_online_cents / t.ytd_cents : 0;
  const priorShare = t.prior_ytd_cents ? t.prior_ytd_online_cents / t.prior_ytd_cents : null;
  const isRevenue = fundKey(a) === 'revenue';
  const top = kpis([
    [isRevenue ? 'Revenue year to date' : 'Giving year to date', money(t.ytd_cents), ytd.text, ytd.tone],
    [`${monthLabel} so far`, money(t.mtd_cents), mtd.text, mtd.tone],
    [isRevenue ? 'Giving and paying households' : 'Giving households', String(a.households.ytd_households), `${t.first_time_givers} first-time giver${t.first_time_givers === 1 ? '' : 's'} this year`],
    ['Online share', pct(share), priorShare === null ? 'Online, card and bank transfer' : `${share >= priorShare ? 'Up' : 'Down'} from ${pct(priorShare)} last year`, priorShare !== null && share >= priorShare ? 'good' : ''],
  ]);
  const max = Math.max(1, ...a.weeks.map((w) => w.cents));
  const avg = a.weeks.reduce((s, w) => s + w.cents, 0) / (a.weeks.length || 1);
  const weekBars = `<div class="ga-weeks" aria-label="Giving by week, last 13 weeks">
      <div class="ga-avg" style="bottom:${(avg / max * 100).toFixed(1)}%"></div>
      ${a.weeks.map((w) => `<div class="ga-week${w.cents >= avg ? ' is-high' : ''}" style="height:${Math.max(1, w.cents / max * 100).toFixed(1)}%" title="Week ending ${e(shortDate(w.week_ending))}: ${money(w.cents)}"><span class="sr-only">Week ending ${e(shortDate(w.week_ending))}: ${money(w.cents)}</span></div>`).join('')}
    </div>
    <div class="ga-axis"><span>${e(shortDate(a.weeks[0]?.week_ending))}</span><span>Line: 13-week average, ${money(avg)} a week</span><span>${e(shortDate(a.weeks.at(-1)?.week_ending))}</span></div>`;
  const fundMax = Math.max(1, ...a.funds.map((f) => f.cents));
  const current = fundKey(a);
  const fundName = (f) => (f.fund_id === undefined ? e(f.fund_name)
    : `<a href="${href('trends', { ...keep, fund: String(f.fund_id) })}"${String(f.fund_id) === current ? ' aria-current="true" class="is-on"' : ''}>${e(f.fund_name)}</a>`);
  const funds = a.funds.length
    ? `<ul class="ga-meters">${a.funds.slice(0, 8).map((f) => `<li><span>${fundName(f)}</span><span class="ga-meter"><span style="width:${Math.max(1, f.cents / fundMax * 100).toFixed(1)}%"></span></span><b>${compact(f.cents)}</b></li>`).join('')}</ul>`
    : '<div class="empty-note">No gifts recorded this year.</div>';
  return `${fundPicker(a, { page: 'trends', hidden: keep })}
    <p class="lede">${e(asOfLine(a))}</p>
    ${top}
    <div class="ga-two">
      <div class="panel"><h2>${e(fundOf(a).label)}, last 13 weeks</h2><p class="muted-line">Each bar is a week ending on Sunday.</p>${weekBars}</div>
      <div class="panel"><h2>By fund, year to date</h2><p class="muted-line">Every fund, whichever is shown above. Choose a fund to see it alone.</p>${funds}</div>
    </div>
    ${revenueMix(a, keep, mdoBooks)}`;
}

// Where the church's money comes from this year, in the four revenue categories, with donations
// split into unrestricted (General Fund) and restricted. Each fund's category is set in Connect
// under Giving → Settings → Fund categories. MDO tuition is not entered in Connect: it comes from
// the Daycare report (the church books' Tuition Income, a whole-year figure with no same-days
// comparison). Pass-through funds are money received for another organization; they are shown
// on their own line and left out of every total. Hidden when Connect sends no categories.
const MIX_GROUPS = [
  { title: 'Donations', keys: ['general', 'restricted'], names: { general: 'Unrestricted (General Fund)', restricted: 'Restricted & designated' } },
  { title: 'Earned income', keys: ['earned'], names: { earned: 'Rentals, fees, fundraisers' } },
  { title: 'Passive income', keys: ['passive'], names: { passive: 'Interest, dividends, property income' } },
  { title: 'MDO income', keys: ['mdo'], names: { mdo: 'MDO tuition and fees' } },
];

function revenueMix(a, keep, mdoBooks = null) {
  const raw = new Map((a.categories || []).map((c) => [c.key, c]));
  if (!raw.size) return '';
  const passthrough = raw.get('passthrough');
  const fromBooks = Boolean(mdoBooks?.ok);
  const cats = new Map([...raw].filter(([key]) => key !== 'passthrough'));
  if (fromBooks) cats.set('mdo', { key: 'mdo', fund_count: 0, ...raw.get('mdo'), cents: mdoBooks.cents, prior_cents: 0, fromBooks: true });
  const total = [...cats.values()].reduce((s, c) => s + c.cents, 0);
  const max = Math.max(1, ...[...cats.values()].map((c) => c.cents));
  const delta = (c) => {
    if (c.fromBooks) return '<span class="tone-muted">Whole-year figure</span>';
    const note = changeNote(c.cents, c.prior_cents, 'last year');
    return c.prior_cents ? `<span class="tone-${note.tone}">${note.text}</span>` : '<span class="tone-muted">—</span>';
  };
  const row = (c, name) => `<tr class="ga-mix-sub"><td>${e(name)}<small>${c.fund_count ? fundCount(c.fund_count) : 'No gifts this year'}</small></td>
      <td><span class="ga-meter"><span style="width:${Math.max(0, c.cents / max * 100).toFixed(1)}%"></span></span></td>
      <td>${money(c.cents)}</td><td>${total ? pct(c.cents / total) : '—'}</td><td>${delta(c)}</td></tr>`;
  const body = MIX_GROUPS.map((g) => {
    const members = g.keys.map((k) => cats.get(k)).filter(Boolean);
    if (!members.length) return '';
    const sum = { cents: members.reduce((s, c) => s + c.cents, 0), prior_cents: members.reduce((s, c) => s + c.prior_cents, 0), fromBooks: members.some((c) => c.fromBooks) };
    const source = g.keys.includes('mdo')
      ? `<small>${fromBooks ? `Tuition income from the Daycare report, ${e(String(mdoBooks.year))}` : 'Only what is entered in Connect; the Daycare report could not be read'}</small>` : '';
    const head = `<tr class="ga-mix-group"><th scope="rowgroup">${e(g.title)}${source}</th><td></td><td>${money(sum.cents)}</td><td>${total ? pct(sum.cents / total) : '—'}</td><td>${delta(sum)}</td></tr>`;
    return head + (members.length > 1 ? members.map((c) => row(c, g.names[c.key])).join('') : '');
  }).join('');
  // The total's change compares like with like: the MDO books figure has no same-days number, so
  // the change is worked out without it.
  const comparable = [...cats.values()].filter((c) => !c.fromBooks);
  const totalDelta = delta({ cents: comparable.reduce((s, c) => s + c.cents, 0), prior_cents: comparable.reduce((s, c) => s + c.prior_cents, 0) });
  const passRow = passthrough && (passthrough.cents || passthrough.prior_cents)
    ? `<tr class="ga-mix-pass"><td>Passed through to other organizations<small>${fundCount(passthrough.fund_count || 0)} · not church income, not in the total</small></td><td></td><td>${money(passthrough.cents)}</td><td>—</td><td>${delta(passthrough)}</td></tr>` : '';
  const donations = (cats.get('general')?.cents || 0) + (cats.get('restricted')?.cents || 0);
  const noMdo = total - (cats.get('mdo')?.cents || 0);
  const tabs = [['general', cats.get('general')?.cents || 0], ['donor', donations], ['revenue', noMdo]];
  const current = fundKey(a);
  return `<div class="panel panel-spaced list-panel"><div class="panel-head"><h2>Where the money comes from, year to date</h2><span class="muted">Church revenue, whichever view is shown above</span></div>
      <div class="table-scroll"><table class="pm-table ga-num ga-mix"><thead><tr><th>Category</th><th><span class="sr-only">Share bar</span></th><th>${a.year} to date</th><th>Share</th><th>vs. same days ${a.year - 1}</th></tr></thead>
      <tbody>${body}<tr class="total-row"><td>Total church revenue${fromBooks ? '<small>The change leaves out MDO, which has no same-days figure</small>' : ''}</td><td></td><td>${money(total)}</td><td>100%</td><td>${totalDelta}</td></tr>${passRow}</tbody></table></div>
      <p class="muted-line">The three views above: ${tabs.map(([key, cents]) => `<a href="${href('trends', { ...keep, fund: key })}"${key === current ? ' aria-current="true"' : ''}>${e(SCOPE_TABS.find(([k]) => k === key)[1])}</a> ${money(cents)}`).join(' · ')}. None of them include pass-through funds. Each fund’s category is set in Connect under Giving settings, Fund categories; choose “Pass-through” for money the church receives for another organization.</p></div>`;
}

// ── Year over year ────────────────────────────────────────────────────────────────────────────

export function renderYearOverYearPage({ result, keep = {} }) {
  if (!result.ok) return unavailable('Year-over-year giving', result.message);
  const a = result.data;
  const t = a.totals;
  const h = a.households;
  const byMonth = new Map(a.months.map((m) => [m.month, m.cents]));
  const throughMonth = Number(a.as_of.slice(5, 7));
  const rows = [];
  for (let m = 1; m <= throughMonth; m += 1) {
    const key = String(m).padStart(2, '0');
    rows.push({ label: MONTHS[m - 1], now: byMonth.get(`${a.year}-${key}`) || 0, before: byMonth.get(`${a.year - 1}-${key}`) || 0, partial: m === throughMonth });
  }
  const complete = rows.filter((r) => !r.partial);
  const best = complete.reduce((b, r) => (r.now > (b?.now ?? -1) ? r : b), null);
  const max = Math.max(1, ...rows.map((r) => Math.max(r.now, r.before)));
  const ytd = changeNote(t.ytd_cents, t.prior_ytd_cents, String(a.year - 1));
  const retention = h.last_year_households ? h.both_years_households / h.last_year_households : null;
  const top = kpis([
    [`${a.year} to date`, money(t.ytd_cents), ytd.text, ytd.tone],
    [`Same period ${a.year - 1}`, money(t.prior_ytd_cents), `Through ${shortDate(`${a.year - 1}${a.as_of.slice(4)}`)}, ${a.year - 1}`],
    ['Households giving both years', String(h.both_years_households), retention === null ? 'No gifts last year to compare' : `${pct(retention)} of ${h.last_year_households} households from ${a.year - 1} have given again`],
  ]);
  const chart = `<div class="ga-months">${rows.map((r) => `<div class="ga-month"><div class="ga-pair">
      <div class="ga-bar is-prior" style="height:${Math.max(1, r.before / max * 100).toFixed(1)}%" title="${r.label} ${a.year - 1}: ${money(r.before)}"></div>
      <div class="ga-bar${best && r === best ? ' is-best' : ''}${r.partial ? ' is-partial' : ''}" style="height:${Math.max(1, r.now / max * 100).toFixed(1)}%" title="${r.label} ${a.year}: ${money(r.now)}"></div>
    </div><span>${r.label}</span><small>${compact(r.now)}</small></div>`).join('')}</div>
    <p class="ga-legend"><span class="key is-prior"></span>${a.year - 1} <span class="key"></span>${a.year} <span class="key is-best"></span>Best full month${rows.at(-1)?.partial ? ` · ${rows.at(-1).label} is month to date` : ''}</p>`;
  const full = rows.filter((r) => !r.partial);
  const sumNow = full.reduce((s, r) => s + r.now, 0);
  const sumBefore = full.reduce((s, r) => s + r.before, 0);
  const line = (label, now, before, { total = false, partial = false } = {}) => {
    const diff = now - before;
    const c = change(now, before);
    const tone = diff >= 0 ? 'tone-good' : 'tone-bad';
    if (partial) return `<tr class="is-partial"><td>${label}</td><td>${money(before)}</td><td>${money(now)}</td><td class="tone-muted">—</td><td class="tone-muted">—</td></tr>`;
    return `<tr${total ? ' class="total-row"' : ''}><td>${label}</td><td>${money(before)}</td><td>${money(now)}</td><td class="${tone}">${signedMoney(diff)}</td><td class="${tone}">${c === null ? '—' : `${c >= 0 ? '+' : '−'}${Math.abs(c * 100).toFixed(1)}%`}</td></tr>`;
  };
  const partialRow = rows.find((r) => r.partial);
  const scopeTitle = fundKey(a) === 'all' ? 'Giving' : `${fundOf(a).label} giving`;
  return `${fundPicker(a, { page: 'year-over-year', hidden: keep })}
    <p class="lede">${e(asOfLine(a))}</p>
    ${top}
    <div class="panel panel-spaced"><h2>${e(scopeTitle)} by month, ${a.year - 1} and ${a.year}</h2>${chart}</div>
    <div class="panel panel-spaced list-panel"><h2>Month by month${fundKey(a) === 'all' ? '' : ` · ${e(fundOf(a).label)}`}</h2><div class="table-scroll"><table class="pm-table ga-num"><thead><tr><th>Month</th><th>${a.year - 1}</th><th>${a.year}</th><th>Change</th><th>%</th></tr></thead>
      <tbody>${full.map((r) => line(r.label, r.now, r.before)).join('')}${full.length ? line(full.length === 1 ? full[0].label : `${full[0].label}–${full.at(-1).label}`, sumNow, sumBefore, { total: true }) : ''}${partialRow ? line(`${partialRow.label} (${a.year} to date; all of ${a.year - 1})`, partialRow.now, partialRow.before, { partial: true }) : ''}</tbody></table></div>
      <p class="muted-line">Whole months are compared; the current month is left out of the total because it is not over. The cards above compare the same days of each year.</p></div>`;
}

// ── Household bands ───────────────────────────────────────────────────────────────────────────
// The Annual view of Giving reports › Giving bands; `at` is where the fund picker points.

export function renderHouseholdBandsPage({ result, keep = {}, at = { section: 'giving-reports', page: 'bands', hidden: { view: 'annual' } } }) {
  if (!result.ok) return unavailable('Household bands', result.message);
  const a = result.data;
  const h = a.households;
  const total = h.t12_cents || 0;
  const rows = h.bands.map((b) => `<tr><td>${e(b.label)}</td><td>${b.households}</td><td>${h.t12_households ? pct(b.households / h.t12_households) : '—'}</td><td>${money(b.cents)}</td><td>${total ? pct(b.cents / total) : '—'}</td></tr>`).join('');
  const top = h.bands.filter((b) => b.cents > 0);
  const topTwo = [...h.bands].reverse().slice(0, 2);
  const topShare = total ? topTwo.reduce((s, b) => s + b.cents, 0) / total : 0;
  const topHouseholds = topTwo.reduce((s, b) => s + b.households, 0);
  return `${fundPicker(a, { section: at.section, page: at.page, hidden: { ...at.hidden, ...keep } })}
    <p class="lede">Households grouped by what they gave in the last 12 months. ${e(scopeShort(a))}No names are shown on this page. Gifts from organizations and anonymous plate cash are not part of any household.</p>
    ${kpis([
      ['Giving households', String(h.t12_households), 'Gave at least once in the last 12 months'],
      ['Household giving', money(total), h.t12_households ? `${money(total / h.t12_households)} average per household` : ''],
      ['From $5,000-and-up households', total ? pct(topShare) : '—', `${topHouseholds} household${topHouseholds === 1 ? '' : 's'}`],
    ])}
    <div class="panel panel-spaced list-panel"><h2>Household giving bands</h2>${top.length ? `<div class="table-scroll"><table class="pm-table ga-num"><thead><tr><th>Band</th><th>Households</th><th>Share</th><th>Giving</th><th>Share of giving</th></tr></thead>
      <tbody>${rows}<tr class="total-row"><td>All households</td><td>${h.t12_households}</td><td>100%</td><td>${money(total)}</td><td>100%</td></tr></tbody></table></div>` : '<div class="empty-note">No household gifts in the last 12 months.</div>'}</div>`;
}

// ── Giving concentration (Charts) ─────────────────────────────────────────────────────────────

export function renderConcentrationPage({ result, keep = {} }) {
  if (!result.ok) return unavailable('Giving concentration', result.message);
  const c = result.data.households.concentration;
  const picker = fundPicker(result.data, { section: 'charts', page: 'concentration', hidden: keep });
  const scope = fundKey(result.data) === 'all' ? '' : ` Showing ${scopePhrase(result.data)} only.`;
  if (!c || c.households < 10) {
    return `${picker}<p class="lede">How much of the church’s giving depends on a few households. Totals only.${e(scope)}</p>
      <div class="panel"><h2>Not enough households yet</h2><p class="muted-line">Concentration needs at least ten giving households in the last 12 months.</p></div>`;
  }
  const lastYear = result.data.year - 1;
  const change = c.top_ten_share_last_year === null ? null : c.top_ten_share - c.top_ten_share_last_year;
  const top = c.deciles[0];
  const max = Math.max(...c.deciles.map((d) => d.share), 0.0001);
  const labels = ['Top 10%', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  const bars = `<div class="ga-deciles">${c.deciles.map((d, i) => `<div class="ga-decile"><span class="ga-decile-value">${pct(d.share)}</span><div class="ga-decile-bar${i === 0 ? ' is-top' : ''}" style="height:${Math.max(1, d.share / max * 100).toFixed(1)}%" title="${labels[i]} of households (${d.households}): ${pct(d.share, 1)} of giving"></div><span class="ga-decile-label">${labels[i]}</span></div>`).join('')}</div>`;
  const cumulative = c.deciles.reduce((acc, d) => { acc.push((acc.at(-1) || 0) + d.share); return acc; }, []);
  return `${picker}<p class="lede">How much of the church’s giving depends on a few households, over the last 12 months.${e(scope)} Totals only: no household is named, and gifts from organizations and anonymous plate cash are left out.</p>
    ${kpis([
      ['Top 10 households', `${pct(c.top_ten_share)} of giving`, change === null ? `No ${lastYear} gifts to compare` : `${change <= 0 ? 'Down' : 'Up'} from ${pct(c.top_ten_share_last_year)} in ${lastYear}`, change === null ? '' : change <= 0 ? 'good' : 'warn'],
      ['Households giving $1,000+', String(c.households_1000_plus), `${pct(c.households_1000_plus / c.households)} of ${c.households} giving households`],
      ['Median household gift', money(c.median_cents), 'Last 12 months'],
    ])}
    <div class="panel panel-spaced"><div class="panel-head"><h2>Share of giving by household tenth</h2><span class="muted">Largest givers first · the top ${top.households} households give ${pct(top.share)}</span></div>${bars}</div>
    <div class="panel panel-spaced list-panel"><h2>Cumulative share</h2><div class="table-scroll"><table class="pm-table ga-num"><thead><tr><th>Households, largest first</th><th>Households</th><th>Share of giving</th></tr></thead><tbody>
      ${[0, 1, 4].map((i) => `<tr><td>Top ${(i + 1) * 10}%</td><td>${c.deciles.slice(0, i + 1).reduce((s, d) => s + d.households, 0)}</td><td>${pct(cumulative[i])}</td></tr>`).join('')}
      <tr><td>Bottom half</td><td>${c.deciles.slice(5).reduce((s, d) => s + d.households, 0)}</td><td>${pct(1 - cumulative[4])}</td></tr>
    </tbody></table></div></div>`;
}

// ── Giving vs. pace (Charts) ──────────────────────────────────────────────────────────────────
// One period of giving for one fund scope, against the same days last year and against the
// matching income budget spread over the period (Connect's giving-analytics-v1 period read).
// Totals only. The period is picked here and sent to Connect as plain from/to dates.

const PACE_PERIODS = [['this-month', 'This month'], ['last-month', 'Last month'], ['qtd', 'Quarter to date'], ['ytd', 'Year to date'], ['custom', 'Custom dates']];
const PACE_MAX_DAYS = 400; // Connect's own limit (PERIOD_MAX_DAYS)

function isoDay(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ? value : null;
}

function lastDayOf(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function longDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

// ?period= and, for Custom, ?from=&to=; ?fund= as on the other Giving pages (General Fund unless
// told otherwise). Anything unusable falls back to year to date and says why.
export function givingPaceParams(params, today) {
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7));
  const pad = (n) => String(n).padStart(2, '0');
  const requested = params.get('period');
  let period = PACE_PERIODS.some(([key]) => key === requested) ? requested : 'ytd';
  let from; let to; let error = '';
  if (period === 'custom') {
    const a = isoDay(params.get('from'));
    const b = isoDay(params.get('to'));
    const days = a && b ? Math.abs(Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5 + 1 : 0;
    if (a && b && days <= PACE_MAX_DAYS) [from, to] = a <= b ? [a, b] : [b, a];
    else {
      error = a && b ? `Choose a range of ${PACE_MAX_DAYS} days or fewer; showing year to date.` : 'Choose both a From and a To date; showing year to date.';
      period = 'ytd';
    }
  }
  if (period === 'this-month') { from = `${y}-${pad(m)}-01`; to = today; }
  if (period === 'last-month') {
    const [ly, lm] = m === 1 ? [y - 1, 12] : [y, m - 1];
    from = `${ly}-${pad(lm)}-01`; to = `${ly}-${pad(lm)}-${pad(lastDayOf(ly, lm))}`;
  }
  if (period === 'qtd') { from = `${y}-${pad(Math.floor((m - 1) / 3) * 3 + 1)}-01`; to = today; }
  if (period === 'ytd') { from = `${y}-01-01`; to = today; }
  const fund = /^[a-z0-9]{1,20}$/.test(params.get('fund') || '') ? params.get('fund') : 'general';
  const label = {
    'this-month': `${MONTH_NAMES[m - 1]} ${y} to date`,
    'last-month': `${MONTH_NAMES[Number(from.slice(5, 7)) - 1]} ${from.slice(0, 4)}`,
    qtd: `Q${Math.floor((m - 1) / 3) + 1} ${y} to date`,
    ytd: `${y} to date`,
    custom: `${longDate(from)} – ${longDate(to)}`,
  }[period];
  return { period, from, to, fund, label, error };
}

function paceMeter(label, cents, max, note, cls = '') {
  return `<li><span>${e(label)}</span><span class="ga-meter${cls ? ` ${cls}` : ''}"><span style="width:${Math.max(0, Math.min(100, max ? cents / max * 100 : 0)).toFixed(1)}%"></span></span><b>${money(cents)}</b><small>${note}</small></li>`;
}

export function renderGivingPacePage({ result, pace, keep = {} }) {
  const hiddenKeep = Object.entries(keep).map(([k, v]) => `<input type="hidden" name="${e(k)}" value="${e(v)}">`).join('');
  const form = `<form method="GET" action="/" class="panel ga-pace-form">
      <input type="hidden" name="section" value="charts"><input type="hidden" name="page" value="giving-pace">${pace.fund === 'general' ? '' : `<input type="hidden" name="fund" value="${e(pace.fund)}">`}${hiddenKeep}
      <label class="field"><span>Period</span><select name="period">${PACE_PERIODS.map(([key, label]) => `<option value="${key}"${key === pace.period ? ' selected' : ''}>${label}</option>`).join('')}</select></label>
      <label class="field"><span>From <small>(custom)</small></span><input type="date" name="from" value="${e(pace.from)}"></label>
      <label class="field"><span>To <small>(custom)</small></span><input type="date" name="to" value="${e(pace.to)}"></label>
      <div class="form-actions"><button type="submit">Show</button></div>
      <p class="muted-line">The dates are used when the period is Custom dates; the other periods set them for you.</p>
    </form>`;
  const errorNote = pace.error ? `<p class="status status-error">${e(pace.error)}</p>` : '';
  if (!result.ok) return `${errorNote}${form}${unavailable('Giving vs. pace', result.message)}`;
  const a = result.data;
  const p = a.period;
  if (!p) return `${errorNote}${form}${unavailable('Giving vs. pace', 'Connect did not answer for a period (it may need updating).')}`;
  const hidden = { ...keep, ...(pace.period === 'ytd' ? {} : { period: pace.period }), ...(pace.period === 'custom' ? { from: pace.from, to: pace.to } : {}) };
  const scope = fundKey(a) === 'all' ? 'all funds' : scopePhrase(a);
  const b = p.budget;
  const vsLast = changeNote(p.cents, p.prior_cents, 'the same days last year');
  const paceShare = b && b.cents ? p.cents / b.cents : null;
  const paceDiff = b ? p.cents - b.cents : null;
  const cards = kpis([
    [`Giving, ${pace.label}`, money(p.cents), `${p.gifts.toLocaleString('en-US')} gift${p.gifts === 1 ? '' : 's'} · ${e(shortDate(p.from))} – ${e(shortDate(p.to))}`],
    ['Same days last year', money(p.prior_cents), vsLast.text, vsLast.tone],
    b ? ['Budgeted pace', money(b.cents), `${paceShare === null ? '—' : pct(paceShare)} of pace · ${paceDiff >= 0 ? 'ahead by' : 'behind by'} ${money(Math.abs(paceDiff))}`, paceDiff >= 0 ? 'good' : 'warn']
      : ['Budgeted pace', '—', 'No budget line matches this scope', ''],
  ]);
  const max = Math.max(p.cents, p.prior_cents, b?.cents || 0, 1);
  const bars = `<ul class="ga-meters ga-pace">
      ${paceMeter(`${pace.label}`, p.cents, max, `${e(shortDate(p.from))} – ${e(shortDate(p.to))}, ${p.to.slice(0, 4)}`)}
      ${paceMeter('Same days last year', p.prior_cents, max, `${e(shortDate(p.prior_from))} – ${e(shortDate(p.prior_to))}, ${p.prior_to.slice(0, 4)}`, 'is-prior')}
      ${b ? paceMeter('Budgeted pace', b.cents, max, 'Budget spread evenly by day', 'is-budget') : ''}
    </ul>`;
  const budgetWhat = !b ? '' : b.basis === 'church_income'
    ? 'the church’s whole Income budget (the Church Report’s total, which also includes income Giving does not record, such as rentals and interest)'
    : b.basis === 'general_fund'
      ? `the General Fund’s budget line${b.accounts.length === 1 ? '' : 's'} on the church ledger (${e(b.accounts.join(', ') || `accounts starting ${b.codes.join(', ')}`)})`
      : `the Income budget line${b.accounts.length === 1 ? '' : 's'} sharing an account code with these funds (${e(b.accounts.join(', '))})`;
  const yearsText = b ? b.years.map((y) => `${money(y.annual_cents)} for ${y.year} × ${y.days} of ${y.days_in_year} days = ${money(y.cents)}`).join('; ') : '';
  const noBudget = !b
    ? `<p class="muted-line"><b>No budget comparison.</b> ${(p.budget_missing_years || []).length ? `No income budget line matches ${e(scope)} for ${e(p.budget_missing_years.join(' and '))}` : `No income budget line matches ${e(scope)}`}, so only last year is compared. A fund’s budget is found by the account code at the start of its name (for example 50010) on the church ledger’s Income lines.</p>`
    : '';
  return `${fundPicker(a, { section: 'charts', page: 'giving-pace', hidden })}
    ${errorNote}${form}
    <p class="lede">Giving to ${e(scope)} for ${e(pace.label)}, against the same days last year${b ? ' and the budget' : ''}. Totals only.</p>
    ${cards}
    <div class="panel panel-spaced"><h2>${e(pace.label)}</h2>${bars}${noBudget}</div>
    <div class="panel panel-spaced ga-method"><h2>How this is figured</h2><ul>
      <li><div><b>This period</b><p>Every gift to ${e(scope)} dated ${e(longDate(p.from))} through ${e(longDate(p.to))} (${p.days} day${p.days === 1 ? '' : 's'}), after voids and refunds. ${e(scopeShort(a).trim()) || 'Every fund counts.'}</p></div></li>
      <li><div><b>Same days last year</b><p>The same calendar dates a year earlier, ${e(longDate(p.prior_from))} through ${e(longDate(p.prior_to))}. Holidays that move (Easter) can land in one year’s period and not the other’s.</p></div></li>
      ${b ? `<li><div><b>Budgeted pace</b><p>The annual budget is ${budgetWhat}, spread evenly across the year by day: ${e(yearsText)}. Giving is seasonal (Christmas and Easter run high), so a straight-line pace runs behind early in a quarter or year and catches up later.</p></div></li>` : ''}
    </ul></div>`;
}

// ── Pledges ───────────────────────────────────────────────────────────────────────────────────

export function renderPledgesPage({ result, keep = {} }) {
  if (!result.ok) return unavailable('Pledges', result.message);
  const a = result.data;
  const p = a.pledges;
  const picker = fundPicker(a, { page: 'pledges', hidden: keep });
  if (!p.pledgers) {
    return `${picker}<p class="lede">Pledges are one annual amount per person per year.</p>
      <div class="panel"><h2>No ${a.year} pledges yet</h2><p class="muted-line">When pledges for ${a.year} are entered on the <a href="/?section=giving-analytics&amp;page=pledge-list&amp;year=${a.year}">Pledge list</a>, progress against them appears here.</p></div>`;
  }
  const share = p.pledged_cents ? p.received_cents / p.pledged_cents : 0;
  const onTrack = share >= a.year_elapsed * 0.9;
  const rows = [
    ['Fulfilled', p.fulfilled, 'Given the full pledge already', 'good'],
    ['On pace', p.on_pace, 'Within 10% of where the calendar says they would be', 'good'],
    ['Behind', p.behind, 'Giving, but more than 10% behind pace', 'warn'],
    ['Not started', p.not_started, `No gift yet in ${a.year}`, 'warn'],
  ];
  const receivedFrom = fundKey(a) === 'all' ? `${a.year} gifts to any fund` : `${a.year} gifts to ${scopePhrase(a)} only`;
  return `${picker}<p class="lede">Pledges are one annual amount per person, not by fund; add or change them on the <a href="/?section=giving-analytics&amp;page=pledge-list&amp;year=${a.year}">Pledge list</a>. Received counts each pledger’s ${e(receivedFrom)}, up to their pledge.</p>
    ${kpis([
      [`${a.year} pledges`, money(p.pledged_cents), `${p.pledgers} pledger${p.pledgers === 1 ? '' : 's'}`],
      ['Received toward pledges', money(p.received_cents), `${pct(share)} · ${pct(a.year_elapsed)} of the year gone`, onTrack ? 'good' : 'warn'],
      ['Given by pledgers', money(p.given_cents), p.given_cents > p.received_cents ? `${money(p.given_cents - p.received_cents)} beyond their pledges` : 'All of it counts toward pledges'],
    ])}
    <div class="panel panel-spaced"><h2>Pledge progress</h2>
      <div class="ga-progress"><span style="width:${Math.min(100, share * 100).toFixed(1)}%"></span><i style="left:${(a.year_elapsed * 100).toFixed(1)}%" title="Share of the year gone"></i></div>
      <p class="muted-line">The marker shows how much of the year has gone by.</p>
      <div class="table-scroll"><table class="pm-table ga-num"><thead><tr><th>Status</th><th>Pledgers</th><th>What it means</th></tr></thead>
        <tbody>${rows.map(([label, n, note, tone]) => `<tr><td class="${n ? `tone-${tone}` : ''}">${label}</td><td>${n}</td><td class="ga-note">${e(note)}</td></tr>`).join('')}</tbody></table></div>
      <p class="muted-line">Individual pledges are on the <a href="/?section=giving-analytics&amp;page=pledge-list&amp;year=${a.year}">Pledge list</a>, and who is behind on the <a href="${href('plateaus', { kind: 'pledge_behind' }, 'giving-reports')}">Nudges and next steps</a> page, for people with Giving view access.</p></div>`;
}

// ── Giving what-if ────────────────────────────────────────────────────────────────────────────

// The starting values, each from Connect's household totals. Retention and the new-household
// ratio fall back to fixed guesses (90%, 45%) only when there is no earlier year to measure;
// `retentionMeasured`/`newRatioMeasured` say which happened, so the page can say so too.
export function whatIfBaseline(h) {
  const households = h.t12_households || 0;
  const retentionMeasured = !!h.two_years_ago_households;
  const newRatioMeasured = !!h.last_year_avg_cents;
  return {
    households,
    average: households ? Math.round(h.t12_cents / households / 100) : 0,
    retention: retentionMeasured ? Math.round(h.retained_households / h.two_years_ago_households * 100) : 90,
    new_households: h.new_last_year_households || 0,
    newRatio: newRatioMeasured ? Math.min(1.5, h.new_last_year_avg_cents / h.last_year_avg_cents) : 0.45,
    retentionMeasured,
    newRatioMeasured,
  };
}

function readAssumption(params, key, fallback, { min, max, digits = 0 }) {
  const raw = params?.get(key);
  if (raw === null || raw === undefined || raw === '') return fallback;
  const n = Number(String(raw).replace(/[$,%\s]/g, ''));
  const scale = 10 ** digits;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n * scale) / scale)) : fallback;
}

// Returning households give the average gift, changed by `gift_change` percent (0 unless the
// reader sets it: no growth or inflation is assumed). A new household gives `new_ratio` percent
// of that same average in its first year.
export function projectWhatIf(base, params) {
  const inputs = {
    households: readAssumption(params, 'households', base.households, { min: 0, max: 100000 }),
    average: readAssumption(params, 'average', base.average, { min: 0, max: 10000000 }),
    retention: readAssumption(params, 'retention', base.retention, { min: 0, max: 100 }),
    new_households: readAssumption(params, 'new_households', base.new_households, { min: 0, max: 100000 }),
    new_ratio: readAssumption(params, 'new_ratio', Math.round(base.newRatio * 100), { min: 0, max: 150 }),
    gift_change: readAssumption(params, 'gift_change', 0, { min: -100, max: 200, digits: 1 }),
  };
  const averageCents = Math.round(inputs.average * (1 + inputs.gift_change / 100) * 100);
  const returning = Math.round(inputs.households * inputs.retention / 100);
  const returningCents = returning * averageCents;
  const newCents = Math.round(inputs.new_households * averageCents * inputs.new_ratio / 100);
  return { inputs, averageCents, returning, returningCents, newCents, totalCents: returningCents + newCents };
}

// "How this is figured": every assumption in plain language, with the value Connect's records
// gave for it, so a reader can see where each starting number came from.
function whatIfMethod(a, base) {
  const h = a.households;
  const y1 = a.year - 1;
  const y2 = a.year - 2;
  const [, m, d] = a.as_of.split('-').map(Number);
  const item = (title, text, value) => `<li><div><b>${e(title)}</b><p>${text}</p></div>${value ? `<span class="ga-method-value">${value}</span>` : ''}</li>`;
  const fundText = fundKey(a) === 'all' ? 'Gifts to every fund count.' : e(scopeShort(a).trim());
  return `<div class="panel panel-spaced ga-method"><h2>How this is figured</h2>
    <p class="muted-line">Every starting value comes from Connect’s giving records; nothing on this page is saved or changes the budget.</p>
    <ul>
      ${item('Who counts', `A household is a Connect household, or one person with no household. Gifts from organizations (such as donor-advised funds) and anonymous gifts, like loose plate cash, are left out. ${fundText}`, '')}
      ${item('Starting point', `The 12 months ending ${e(MONTH_NAMES[m - 1])} ${d}, ${a.year}: every household that gave at least once, and their average total for those 12 months.`, `${h.t12_households} households · ${money(base.average * 100)} average`)}
      ${item('Households who keep giving', base.retentionMeasured
    ? `Households that gave in both ${y2} and ${y1}, divided by households that gave in ${y2} (${h.retained_households} of ${h.two_years_ago_households}). Whole calendar years, so this year’s unfinished months do not skew it.`
    : `There was no ${y2} giving to measure against, so 90% is assumed.`, `${base.retention}%`)}
      ${item('New households', `Households that gave in ${y1} but not in ${y2}, used as the expected number of new households next year.`, String(base.new_households))}
      ${item('New household’s first-year gift', base.newRatioMeasured
    ? `The average ${y1} total of those new households (${money(h.new_last_year_avg_cents)}) divided by the average ${y1} total of every giving household (${money(h.last_year_avg_cents)}), capped at 150%.`
    : `There was no ${y1} giving to measure, so 45% of the average gift is assumed.`, pct(base.newRatio))}
      ${item('No growth built in', 'Returning households are assumed to give the same average as the last 12 months: no raise, no inflation. Use “Average gift change” to try one; it applies to new households’ gifts too.', '0% unless changed')}
      ${item('The projection', `For calendar ${a.year + 1}: giving households × households who keep giving × average gift, plus new households × average gift × the new household’s share.`, '')}
    </ul></div>`;
}

export function renderWhatIfPage({ result, params, keep = {} }) {
  if (!result.ok) return unavailable('Giving what-if baselines', result.message);
  const a = result.data;
  const base = whatIfBaseline(a.households);
  const p = projectWhatIf(base, params);
  const nextYear = a.year + 1;
  const vsLast = p.totalCents - a.households.t12_cents;
  const fund = fundKey(a);
  const scope = fund === 'all' ? '' : ` for ${scopePhrase(a)}`;
  const field = (key, label, note, suffix = '', { min = 0, max, step = 1 } = {}) => `<label class="ga-assume"><span><b>${label}</b><small>${note}</small></span>
      <span class="ga-input">${suffix === '$' ? '<i>$</i>' : ''}<input type="number" name="${key}" value="${p.inputs[key]}" min="${min}"${max !== undefined ? ` max="${max}"` : ''} step="${step}" inputmode="${step === 1 && min >= 0 ? 'numeric' : 'decimal'}">${suffix === '%' ? '<i>%</i>' : ''}</span></label>`;
  return `${fundPicker(a, { page: 'what-if', hidden: keep })}
    <p class="lede">Change the assumptions to see what ${nextYear} household giving${e(scope)} could look like. Nothing here changes the budget; the starting values come from Connect’s giving records. Organizations and anonymous plate cash are left out. How each one is figured is below.</p>
    <div class="ga-two">
      <form method="GET" action="/" class="panel ga-assumptions">
        <input type="hidden" name="section" value="giving-analytics"><input type="hidden" name="page" value="what-if">${fund === 'general' ? '' : `<input type="hidden" name="fund" value="${e(fund)}">`}${keep.council ? '<input type="hidden" name="council" value="1">' : ''}
        <h2>Assumptions for ${nextYear}</h2>
        ${field('households', 'Giving households', `${base.households} gave in the last 12 months`)}
        ${field('average', 'Average annual gift', `${money(base.average * 100)} per household in the last 12 months`, '$')}
        ${field('gift_change', 'Average gift change', 'Raise or lower every household’s gift; 0% assumes no growth or inflation', '%', { min: -100, max: 200, step: 0.1 })}
        ${field('retention', 'Households who keep giving', base.retentionMeasured ? `${base.retention}% of ${a.year - 2}’s households gave again in ${a.year - 1}` : `No ${a.year - 2} giving to measure; 90% assumed`, '%', { max: 100 })}
        ${field('new_households', 'New giving households', `${base.new_households} in ${a.year - 1}`)}
        ${field('new_ratio', 'New household’s first-year gift', `As a share of the average gift; ${base.newRatioMeasured ? `${pct(base.newRatio)} in ${a.year - 1}` : '45% assumed'}`, '%', { max: 150 })}
        <div class="form-actions"><button type="submit">Recalculate</button><a class="ga-link-button is-outline" href="${href('what-if', { ...keep, fund })}">Reset to actual</a></div>
      </form>
      <div class="ga-projection">
        <small>Projected ${nextYear} household giving${e(scope)}</small>
        <strong>${money(p.totalCents)}</strong>
        <p>${signedMoney(vsLast)} vs. the last 12 months (${money(a.households.t12_cents)})</p>
        <dl>
          <div><dt>Returning households</dt><dd>${p.returning}</dd></div>
          <div><dt>Average gift used</dt><dd>${money(p.averageCents)}</dd></div>
          <div><dt>Giving from returning households</dt><dd>${money(p.returningCents)}</dd></div>
          <div><dt>Giving from new households</dt><dd>${money(p.newCents)}</dd></div>
          <div><dt>Change vs. last 12 months</dt><dd>${a.households.t12_cents ? `${vsLast >= 0 ? '+' : '−'}${Math.abs(vsLast / a.households.t12_cents * 100).toFixed(1)}%` : '—'}</dd></div>
        </dl>
      </div>
    </div>
    ${whatIfMethod(a, base)}`;
}

// ── Giving statements ─────────────────────────────────────────────────────────────────────────

function namedRefusal(what) {
  return `<div class="panel"><h2>${e(what)} name each household</h2><p class="muted-line">They are available to people with Giving view access. Council access to Giving is totals only, so the Trends, Year over year, Pledges and What-if pages, and the annual Giving bands, are the council’s view of giving.</p></div>`;
}

export function renderStatementsPage({ result, councilPreview }) {
  if (councilPreview) return namedRefusal('Giving statements');
  if (!result.ok) return unavailable('Giving statements', result.message);
  const { statements, year } = result.data;
  const rows = statements.runs.map((r) => `<tr><td>${e(shortDate(r.last_sent))}, ${e(String(r.last_sent).slice(0, 4))}</td><td>${e(LETTER_LABELS[r.letter_type] || r.letter_type)} · ${r.year}</td><td>${r.email + r.print}</td><td>Email ${r.email} · print ${r.print}</td></tr>`).join('');
  return `<p class="lede">Statements list each household’s gifts by fund for the period, with the IRS acknowledgement language. They are prepared, emailed and printed here in Finance under Donor letters, which keeps track of who has received one.</p>
    ${kpis([
      [`Households giving in ${year}`, String(statements.giving_households_ytd), 'Each will receive a year-end statement'],
      ['Last statement run', statements.runs[0] ? e(shortDate(statements.runs[0].last_sent)) : '—', statements.runs[0] ? e(`${LETTER_LABELS[statements.runs[0].letter_type] || ''} · ${statements.runs[0].year}`) : 'None recorded yet'],
    ])}
    <div class="panel panel-spaced ga-cta"><div><h2>Prepare statements</h2><p class="muted-line">Choose the year, email the households with an address, and print the rest. Emailing a statement sends a real message.</p></div>
      <a class="ga-link-button" href="/?section=giving-letters&amp;page=letters&amp;type=year_end&amp;year=${e(String(year))}">Open donor letters</a></div>
    <div class="panel panel-spaced list-panel"><h2>Recent runs</h2>${rows ? `<div class="table-scroll"><table class="pm-table"><thead><tr><th>Last sent</th><th>Statement</th><th>Households</th><th>Delivery</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty-note">No statements have been recorded as sent yet.</div>'}</div>`;
}

// ── Giving nudges ─────────────────────────────────────────────────────────────────────────────

const NUDGE_HINTS = {
  first_time: 'Thank within two weeks of a first gift',
  stopped: 'Gave in four or more months of the prior year; nothing in the last 90 days',
  giving_down: 'The last six months are under half of the six before',
  pledge_behind: 'Received is under three-quarters of where the pledge would be by now',
  stepped_up: 'The last six months are at least half again the six before',
};

// The follow-up queue: one tab per kind of nudge, each household with assign and mark-done forms
// for Giving edit (Connect re-checks that on every write). Giving reports › Nudges and next steps
// shows it above the plateau ladder; `kindHref(kind)` keeps that page's own choices in each tab.
// The caller refuses first for totals-only access, since every row names a household.
export function renderNudgeQueue({ result, totals, params, canEdit, kindHref }) {
  if (!result.ok) return unavailable('Giving nudges', result.message);
  const { nudges, staff } = result.data;
  const kinds = nudges.kinds;
  const requested = params?.get('kind');
  const current = kinds.find((k) => k.key === requested) || kinds.find((k) => k.open_count) || kinds[0];
  const openTotal = kinds.reduce((s, k) => s + k.open_count, 0);
  const firstTime = totals?.ok ? totals.data.totals.first_time_givers : null;
  const staffOptions = (selected) => `<option value="">Unassigned</option>${staff.map((s) => `<option value="${e(s.username)}"${s.username === selected ? ' selected' : ''}>${e(s.name)}</option>`).join('')}`;
  const hidden = (n) => `<input type="hidden" name="kind" value="${e(current.key)}"><input type="hidden" name="subject_key" value="${e(n.subject_key)}"><input type="hidden" name="episode" value="${e(n.episode)}">`;
  const items = current.items.map((n) => {
    const assigned = staff.find((s) => s.username === n.assigned_to)?.name || n.assigned_to;
    const actions = canEdit
      ? `<form method="POST" action="/api/v1/giving-followup-write" class="inline-form">${hidden(n)}<input type="hidden" name="op" value="assign"><select name="assigned_to" aria-label="Who will follow up">${staffOptions(n.assigned_to)}</select><button type="submit" class="button-outline">Assign</button></form>
         <form method="POST" action="/api/v1/giving-followup-write" class="inline-form">${hidden(n)}<input type="hidden" name="op" value="done"><button type="submit" class="button-outline">Mark done</button></form>`
      : (assigned ? `<span class="muted">With ${e(assigned)}</span>` : '');
    const thank = current.key === 'first_time' ? `<a class="ga-link-button" href="/?section=giving-letters&amp;page=receipts">Send thank-you letters</a>` : '';
    return `<li><div><b>${e(n.name)}</b><small>${e(n.detail)}</small></div><div class="ga-amount">${money(n.cents)}</div><div class="right ga-actions">${thank}${actions}</div></li>`;
  }).join('');
  return `${kpis([
      ['Open nudges', String(openTotal), `Across ${kinds.filter((k) => k.open_count).length} kind${kinds.filter((k) => k.open_count).length === 1 ? '' : 's'}`],
      ['Done this month', String(nudges.done_this_month), 'Thank-yous, calls and notes', nudges.done_this_month ? 'good' : ''],
      [`First-time givers, ${result.data.year}`, firstTime === null ? '—' : String(firstTime), 'Every one thanked within two weeks is the goal'],
    ])}
    <div class="ga-tabs" role="navigation" aria-label="Kinds of nudge">${kinds.map((k) => `<a href="${kindHref(k.key)}"${k.key === current.key ? ' class="is-on" aria-current="page"' : ''}><b>${e(k.label)}</b><small>${k.open_count} open</small></a>`).join('')}</div>
    <div class="panel panel-spaced"><div class="panel-head"><div><h2>${e(current.label)}</h2><span class="muted">${e(NUDGE_HINTS[current.key] || '')}</span></div><span class="muted">${current.items.length < current.open_count ? `${current.items.length} of ${current.open_count} open` : `${current.open_count} open`}</span></div>
      ${items ? `<ul class="row-list ga-nudges">${items}</ul>` : '<div class="empty-note">Nothing open here.</div>'}
      ${current.key === 'first_time' ? '<p class="muted-line">A thank-you sent from Connect’s receipt queue marks the gift done here too.</p>' : ''}</div>`;
}

export const GIVING_ANALYTICS_STYLES = `
    .ga-two { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:16px; margin-top:16px; align-items:start; }
    .ga-weeks { position:relative; display:flex; align-items:flex-end; gap:6px; height:170px; margin-top:14px; border-bottom:1px solid #D5DAE3; }
    .ga-week { flex:1; background:#8FA3C2; border-radius:3px 3px 0 0; min-height:2px; }
    .ga-week.is-high { background:var(--navy); }
    .ga-avg { position:absolute; left:0; right:0; border-top:1px dashed #C9962E; pointer-events:none; }
    .ga-axis { display:flex; justify-content:space-between; gap:8px; margin-top:8px; font-size:12px; color:#6B7280; }
    .ga-meters { list-style:none; margin:10px 0 0; padding:0; }
    .ga-meters li { display:grid; grid-template-columns:minmax(0,1.3fr) minmax(60px,1fr) auto; gap:12px; align-items:center; padding:9px 0; border-bottom:1px solid #EEF0F4; font-size:14px; }
    .ga-meter { height:7px; border-radius:4px; background:#EEF0F4; overflow:hidden; }
    .ga-meter span { display:block; height:100%; background:#2E7AA0; border-radius:4px; }
    .ga-months { display:flex; align-items:flex-end; gap:10px; height:220px; margin-top:16px; border-bottom:1px solid #D5DAE3; }
    .ga-month { flex:1; display:flex; flex-direction:column; align-items:center; height:100%; }
    .ga-month > span { font-size:12px; color:#4B5563; margin-top:6px; }
    .ga-month > small { font-size:11px; color:#6B7280; }
    .ga-pair { flex:1; width:100%; display:flex; align-items:flex-end; justify-content:center; gap:3px; }
    .ga-bar { width:min(22px,42%); background:var(--navy); border-radius:3px 3px 0 0; min-height:2px; }
    .ga-bar.is-prior { background:#C3CDDD; }
    .ga-bar.is-best { background:#C9962E; }
    .ga-bar.is-partial { opacity:.55; }
    .ga-months + .ga-legend { margin-top:44px; }
    .ga-legend { font-size:12px; color:#6B7280; display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
    .ga-legend .key { display:inline-block; width:10px; height:10px; border-radius:2px; background:var(--navy); margin-left:8px; }
    .ga-legend .key.is-prior { background:#C3CDDD; margin-left:0; }
    .ga-legend .key.is-best { background:#C9962E; }
    .ga-num td, .ga-num th:not(:first-child) { text-align:right; }
    .ga-num td:first-child, .ga-num td.ga-note { text-align:left; }
    .total-row td { font-weight:700; border-top:2px solid var(--navy); }
    tr.is-partial td { color:#6B7280; }
    .ga-progress { position:relative; height:12px; border-radius:6px; background:#EEF0F4; margin:14px 0 6px; }
    .ga-progress span { display:block; height:100%; border-radius:6px; background:#2E7AA0; }
    .ga-progress i { position:absolute; top:-4px; width:2px; height:20px; background:#C9962E; }
    .ga-assumptions h2 { margin-bottom:6px; }
    .ga-assume { display:flex; justify-content:space-between; align-items:center; gap:16px; padding:12px 0; border-bottom:1px solid #EEF0F4; }
    .ga-assume small { display:block; color:#6B7280; font-size:12px; font-weight:400; }
    .ga-input { display:flex; align-items:center; gap:4px; }
    .ga-input input { width:110px; text-align:right; }
    .ga-input i { font-style:normal; color:#6B7280; }
    .ga-assumptions .form-actions { display:flex; gap:10px; margin-top:14px; }
    .ga-projection { background:var(--navy); color:#fff; border-radius:10px; padding:22px 24px; }
    .ga-projection small { color:#C9D2E2; font-size:13px; }
    .ga-projection strong { display:block; font-size:40px; margin:6px 0; font-family:Outfit, sans-serif; }
    .ga-projection p { color:#C9D2E2; margin:0 0 14px; }
    .ga-projection dl { margin:0; border-top:1px solid rgba(255,255,255,.18); }
    .ga-projection dl div { display:flex; justify-content:space-between; padding:8px 0; }
    .ga-projection dt { color:#DCE3EE; }
    .ga-projection dd { margin:0; font-weight:600; }
    .ga-method ul { list-style:none; margin:10px 0 0; padding:0; }
    .ga-method li { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; padding:10px 0; border-bottom:1px solid #EEF0F4; }
    .ga-method li p { margin:2px 0 0; color:#4B5563; font-size:13.5px; }
    .ga-method-value { flex:none; font-weight:700; color:var(--navy); white-space:nowrap; text-align:right; }
    .ga-pace-form { display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:10px 14px; align-items:end; margin-top:0; }
    .ga-pace-form .muted-line { grid-column:1 / -1; margin:0; }
    .ga-pace-form .form-actions button { margin-top:0; }
    .ga-pace li { grid-template-columns:minmax(0,1.2fr) minmax(80px,2fr) auto; }
    .ga-pace li small { grid-column:1 / -1; color:#6B7280; font-size:12px; margin-top:-6px; }
    .ga-pace .ga-meter { height:12px; }
    .ga-pace .is-prior span { background:#C3CDDD; }
    .ga-pace .is-budget span { background:#C9962E; }
    .ga-link-button { display:inline-block; padding:9px 16px; border-radius:8px; background:var(--navy); color:#fff; font-size:14px; font-weight:600; text-decoration:none; white-space:nowrap; }
    .ga-link-button.is-outline { background:#fff; color:var(--navy); border:1px solid var(--navy); }
    .ga-assumptions .form-actions { align-items:center; }
    .ga-assumptions .form-actions button { margin-top:0; }
    .ga-cta { display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap; flex-direction:row; }
    .ga-tabs { display:flex; flex-wrap:wrap; gap:10px; margin-top:16px; }
    .ga-tabs a { display:flex; flex-direction:column; min-width:150px; padding:10px 14px; border:1px solid #D5DAE3; border-radius:8px; background:#fff; color:var(--navy); text-decoration:none; }
    .ga-tabs a small { color:#6B7280; font-size:12px; }
    .ga-tabs a.is-on { background:var(--navy); color:#fff; border-color:var(--navy); }
    .ga-tabs a.is-on small { color:#C9D2E2; }
    .ga-nudges li { display:grid; grid-template-columns:minmax(0,1.6fr) auto minmax(0,2fr); gap:14px; align-items:center; }
    .ga-amount { font-weight:600; white-space:nowrap; }
    .ga-actions { display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; }
    .ga-deciles { display:flex; align-items:flex-end; gap:12px; height:220px; margin-top:16px; border-bottom:1px solid #D5DAE3; padding-bottom:0; }
    .ga-decile { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; position:relative; }
    .ga-decile-bar { width:min(44px,70%); background:var(--navy); border-radius:3px 3px 0 0; min-height:2px; }
    .ga-decile-bar.is-top { background:#C9962E; }
    .ga-decile-value { font-size:12px; color:#4B5563; margin-bottom:4px; }
    .ga-decile-label { position:absolute; bottom:-22px; font-size:12px; color:#4B5563; white-space:nowrap; }
    .ga-deciles { margin-bottom:30px; }
    .ga-fund { display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin:0 0 14px; }
    .ga-fund-label { font-size:13px; color:#6B7280; }
    .ga-fund-tabs { display:inline-flex; border:1px solid #D5DAE3; border-radius:8px; overflow:hidden; background:#fff; }
    .ga-fund-tabs a { padding:7px 14px; font-size:14px; color:var(--navy); text-decoration:none; }
    .ga-fund-tabs a + a { border-left:1px solid #D5DAE3; }
    .ga-fund-tabs a.is-on { background:var(--navy); color:#fff; }
    .ga-fund-form { display:inline-flex; align-items:center; gap:6px; margin:0; }
    .ga-fund-form select { max-width:260px; }
    .ga-fund-form.is-on select { border-color:var(--navy); font-weight:600; }
    .ga-fund-form button { margin-top:0; }
    @media print { .ga-fund { display:none; } }
    .ga-mix td small { display:block; color:#6B7280; font-size:12px; }
    .ga-mix td:nth-child(2) { width:28%; }
    .ga-mix .ga-meter { display:block; }
    .ga-mix-pass td { color:#6B7280; font-style:italic; border-top:1px dashed #D5DAE3; }
    .ga-mix-pass td:not(:first-child) { text-align:right; }
    .ga-mix-group th small { display:block; font-weight:400; color:#6B7280; font-size:12px; text-transform:none; letter-spacing:0; }
    .ga-mix .ga-mix-group th, .ga-mix .ga-mix-group td { font-weight:700; text-align:left; border-top:1px solid #D5DAE3; }
    .ga-mix .ga-mix-group td:not(:nth-child(2)) { text-align:right; }
    .ga-mix-sub td:first-child { padding-left:18px; }
    .ga-meters a { color:inherit; }
    .ga-meters a.is-on { font-weight:700; color:var(--navy); }
    .sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
    @media (max-width:720px) { .ga-nudges li { grid-template-columns:1fr; } .ga-actions { justify-content:flex-start; } .ga-months { gap:4px; } }
`;
