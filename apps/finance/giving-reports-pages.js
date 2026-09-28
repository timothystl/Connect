// Giving › Reports: the analysis reports from Connect's Giving › Reports › Analysis, in Finance.
// Every figure comes live from Connect's giving-reports-v1, computed by the same handlers
// Connect's own reports use, so the two cannot disagree. Finance pages run no script: each
// report's choices are GET parameters, and Print is the shell's print version of the page.
//
// Distribution, By fund and method, and Giving and attendance name nobody, so council's
// totals-only Giving access may read them. Top and lapsed givers, Each giver's trend, Plateaus
// and Bands need Giving view (Connect refuses the rest), and council preview shows that refusal.
import { escapeHtml as e } from './render-helpers.js';
import { groupByFundCode } from './council-report-pages.js';

export const GIVING_REPORT_PAGES = Object.freeze([
  { id: 'distribution', label: 'Distribution', named: false },
  { id: 'funds-methods', label: 'By fund and method', named: false },
  { id: 'attendance', label: 'Giving and attendance', named: false },
  { id: 'insights', label: 'Top and lapsed givers', named: true },
  { id: 'giver-trends', label: 'Each giver, year over year', named: true },
  { id: 'plateaus', label: 'Plateaus and nudges', named: true },
  { id: 'bands', label: 'Weekly and monthly bands', named: true },
]);

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const money = (cents) => USD.format(Math.round((Number(cents) || 0) / 100));
const METHOD_LABELS = { cash: 'Cash', check: 'Check', card: 'Card / online', ach: 'ACH / bank', online: 'Online', stock: 'Stock', other: 'Other' };
const methodLabel = (m) => METHOD_LABELS[String(m || '').toLowerCase()] || (m ? String(m) : 'Not recorded');
const plural = (n, one, many = `${one}s`) => `${Number(n).toLocaleString('en-US')} ${n === 1 ? one : many}`;
const isDay = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));

// ── Parameters (validated here; Connect validates again) ─────────────────────────────────────
export function givingReportParams(params, today) {
  const year = Number(today.slice(0, 4));
  const y = Number(params.get('year'));
  const pick = (key, allowed, def) => (allowed.includes(params.get(key)) ? params.get(key) : def);
  const from = isDay(params.get('from')) ? params.get('from') : `${year}-01-01`;
  const to = isDay(params.get('to')) ? params.get('to') : `${year}-12-31`;
  const fund = /^\d{1,9}$/.test(params.get('fund_id') || '') ? params.get('fund_id') : '';
  const lowFreq = Math.min(51, Math.max(1, Number.parseInt(params.get('low_frequency_max'), 10) || 3));
  const freq = pick('freq', ['weekly', 'monthly'], 'weekly');
  const upliftRaw = params.get('uplift');
  const uplift = upliftRaw != null && upliftRaw !== '' && Number.isFinite(Number(upliftRaw)) ? Math.min(1000, Math.max(0, Math.round(Number(upliftRaw)))) : (freq === 'monthly' ? 40 : 10);
  return {
    year: Number.isInteger(y) && y >= 2000 && y <= year + 1 ? y : year, thisYear: year,
    scope: pick('scope', ['household', 'person'], 'household'),
    from: from <= to ? from : to, to: from <= to ? to : from, fund, lowFreq, freq, uplift,
  };
}

// The Connect reads a page needs: [name, query] pairs, in order.
export function givingReportRequests(pageId, p) {
  switch (pageId) {
    case 'funds-methods': return [['summary', { from: p.from, to: p.to }]];
    case 'attendance': return [['vs-attendance', { from: p.from, to: p.to }]];
    case 'insights': return [['insights', { year: p.year }]];
    case 'giver-trends': return [['yoy', { year: p.year }]];
    case 'plateaus': return [['plateaus', { year: p.year, scope: p.scope, fund_id: p.fund, low_frequency_max: p.lowFreq }], ['impact', {}], ['funds', {}]];
    case 'bands': return [['bands', { year: p.year, scope: p.scope, freq: p.freq, uplift_cents: p.uplift * 100, fund_id: p.fund }], ['funds', {}]];
    default: return [['distribution', { year: p.year, scope: p.scope }], ['multiyear', { end: p.year, years: 5 }]];
  }
}

// ── Shared pieces ────────────────────────────────────────────────────────────────────────────
const unavailable = (what, message) => `<p class="status status-error">${e(what)} could not be read from Connect: ${e(message || 'no answer')}. Nothing here is a real $0.</p>`;
const namedRefusal = (what) => `<div class="gr-card"><h2>${e(what)} names givers</h2><p class="muted">It is available to people with Giving view access. Council access to Giving is totals only; Distribution, By fund and method, and Giving and attendance are the council’s reports.</p></div>`;
const card = (label, value, note = '') => `<div class="card"><small>${e(label)}</small><strong>${value}</strong>${note ? `<span>${note}</span>` : ''}</div>`;
const hidden = (name, value) => `<input type="hidden" name="${e(name)}" value="${e(value)}">`;
const yearSelect = (p) => `<label>Year <select name="year">${Array.from({ length: 7 }, (_, i) => p.thisYear - i).map((y) => `<option value="${y}"${y === p.year ? ' selected' : ''}>${y}${y === p.thisYear ? ' (so far)' : ''}</option>`).join('')}</select></label>`;
const scopeSelect = (p) => `<label>Count by <select name="scope"><option value="household"${p.scope === 'household' ? ' selected' : ''}>Household</option><option value="person"${p.scope === 'person' ? ' selected' : ''}>Person</option></select></label>`;
const rangeFields = (p) => `<label>From <input type="date" name="from" value="${e(p.from)}"></label><label>To <input type="date" name="to" value="${e(p.to)}"></label>`;
function fundSelect(p, funds) {
  return `<label>Fund <select name="fund_id"><option value="">All funds</option>${(funds || []).map((f) => `<option value="${e(f.id)}"${String(f.id) === p.fund ? ' selected' : ''}>${e(f.name)}</option>`).join('')}</select></label>`;
}
function controls(page, fields, keep) {
  return `<form method="GET" action="/" class="gr-controls">${hidden('section', 'giving-reports')}${hidden('page', page)}${keep.council ? hidden('council', '1') : ''}${fields}<button type="submit">Show</button></form>`;
}
const bar = (share, cls = '') => `<span class="gr-bar${cls ? ` ${cls}` : ''}"><span style="width:${Math.max(0, Math.min(100, share * 100)).toFixed(1)}%"></span></span>`;
const scopeWord = (scope, n) => (scope === 'person' ? (n === 1 ? 'giver' : 'givers') : (n === 1 ? 'household' : 'households'));

// ── Distribution ─────────────────────────────────────────────────────────────────────────────
function multiyearChart(rows) {
  if (!rows?.length) return '';
  const max = Math.max(...rows.map((r) => Math.max(r.total_cents || 0, r.adjusted_cents || 0)), 1);
  const cols = rows.map((r) => `<div class="gr-col"><div class="gr-pair"><span class="gr-colbar" style="height:${((r.total_cents || 0) / max * 100).toFixed(1)}%" title="${e(r.year)}: ${money(r.total_cents)}"></span><span class="gr-colbar is-real" style="height:${((r.adjusted_cents || 0) / max * 100).toFixed(1)}%" title="${e(r.year)} in today’s dollars: ${money(r.adjusted_cents)}"></span></div><small>${e(r.year)}</small></div>`).join('');
  return `<div class="gr-cols">${cols}</div><div class="gr-legend"><i class="gr-key"></i>Given <i class="gr-key is-real"></i>In today’s dollars</div>`;
}

export function renderDistributionPage({ results, params: p, keep }) {
  const [dist, multi] = results;
  const form = controls('distribution', yearSelect(p) + scopeSelect(p), keep);
  if (!dist.ok) return form + unavailable('The giving distribution', dist.message);
  const d = dist.data;
  const who = d.scope === 'person' ? 'Givers' : 'Giving households';
  const tiers = (d.tiers || []).filter((t) => t.givers > 0);
  const maxShare = Math.max(...tiers.map((t) => t.total_pct || 0), 1);
  const table = tiers.length ? `<div class="table-wrap"><table class="gr-num"><thead><tr><th>Annual giving</th><th>${e(who)}</th><th>Share of ${e(who.toLowerCase())}</th><th>Given</th><th>Share of giving</th></tr></thead>
    <tbody>${tiers.map((t) => `<tr><td>${e(t.label)}</td><td>${t.givers}</td><td>${t.givers_pct}%</td><td>${money(t.total_cents)}</td><td class="gr-barcell">${bar((t.total_pct || 0) / maxShare)} ${t.total_pct}%</td></tr>`).join('')}</tbody></table></div>`
    : `<p class="muted">No giving recorded for ${e(d.year)}.</p>`;
  let trend = '';
  if (multi?.ok && multi.data?.years?.length) {
    const m = multi.data;
    const estimated = m.years.some((r) => r.cpi_estimated);
    trend = `<section class="gr-card"><h2>Five years of giving</h2><p class="muted">Each year also shown in ${e(m.base_year)} dollars (consumer prices), so growth is not just inflation.${estimated ? ' Recent years use an estimated price index.' : ''}</p>${multiyearChart(m.years)}
      <div class="table-wrap"><table class="gr-num"><thead><tr><th>Year</th><th>Givers</th><th>Given</th><th>Average per giver</th><th>In ${e(m.base_year)} dollars</th></tr></thead>
      <tbody>${m.years.map((r) => `<tr><td>${e(r.year)}</td><td>${r.givers}</td><td>${money(r.total_cents)}</td><td>${money(r.avg_giver_cents)}</td><td>${money(r.adjusted_cents)}</td></tr>`).join('')}</tbody></table></div></section>`;
  } else if (multi && !multi.ok) trend = unavailable('The five-year trend', multi.message);
  return `${form}<div class="grid">${card(who, String(d.givers))}${card('Given', money(d.total_cents), `${e(d.year)}`)}${card('Average a year', money(d.mean_cents), 'Pulled up by the largest gifts')}${card('Median a year', money(d.median_cents), d.scope === 'person' ? 'The typical giver' : 'The typical household')}${card('Top 10% give', `${d.top10_share_pct}%`, `${plural(d.top10_givers, scopeWord(d.scope, 1), scopeWord(d.scope, 2))} of all giving`)}</div>
    <section class="gr-card"><h2>Giving distribution, ${e(d.year)}</h2><p class="muted">The median is the honest “typical” gift: half give more, half give less. Anonymous gifts and organizations are left out.</p>${table}</section>${trend}`;
}

// ── By fund and method ───────────────────────────────────────────────────────────────────────
const METHOD_COLORS = { cash: '#5A9E6F', check: '#2E7EA6', card: '#C9973A', ach: '#6E5A9E', online: '#C9973A', other: '#8A7968' };
function donut(items) {
  const total = items.reduce((s, x) => s + x.value, 0);
  if (!(total > 0)) return '';
  let angle = -Math.PI / 2;
  const R = 80; const r = 48; const C = 100;
  const p = (rad, radius) => `${(C + radius * Math.cos(rad)).toFixed(2)},${(C + radius * Math.sin(rad)).toFixed(2)}`;
  const arcs = items.filter((x) => x.value > 0).map((x) => {
    const a = Math.min((x.value / total) * Math.PI * 2, Math.PI * 2 - 0.0001);
    const end = angle + a; const large = a > Math.PI ? 1 : 0;
    const d = `M${p(angle, R)} A${R},${R} 0 ${large} 1 ${p(end, R)} L${p(end, r)} A${r},${r} 0 ${large} 0 ${p(angle, r)} Z`;
    angle = end;
    return `<path d="${d}" fill="${x.color}"><title>${e(x.label)}: ${money(x.value)}</title></path>`;
  }).join('');
  return `<div class="gr-donut"><svg viewBox="0 0 200 200" role="img" aria-label="Share by method">${arcs}</svg><ul>${items.map((x) => `<li><i class="gr-key" style="background:${x.color}"></i>${e(x.label)}<b>${Math.round(x.value / total * 100)}%</b></li>`).join('')}</ul></div>`;
}

export function renderFundsMethodsPage({ results, params: p, keep }) {
  const [summary] = results;
  const form = controls('funds-methods', rangeFields(p), keep);
  if (!summary.ok) return form + unavailable('Giving by fund and method', summary.data?.error || summary.message);
  const d = summary.data;
  const methods = d.by_method || [];
  const methodTotal = methods.reduce((s, m) => s + (m.total_cents || 0), 0);
  const methodTable = methods.length ? `${donut(methods.map((m) => ({ label: methodLabel(m.method), value: m.total_cents || 0, color: METHOD_COLORS[String(m.method || '').toLowerCase()] || '#8A7968' })))}
    <div class="table-wrap"><table class="gr-num"><thead><tr><th>Method</th><th>Gifts</th><th>Given</th><th>Share</th></tr></thead><tbody>${methods.map((m) => `<tr><td>${e(methodLabel(m.method))}</td><td>${m.contributions}</td><td>${money(m.total_cents)}</td><td>${methodTotal ? Math.round(m.total_cents / methodTotal * 100) : 0}%</td></tr>`).join('')}
    <tr class="total-row"><td>Total</td><td>${methods.reduce((s, m) => s + (m.contributions || 0), 0)}</td><td>${money(methodTotal)}</td><td></td></tr></tbody></table></div>` : '<p class="muted">No gifts in this range.</p>';
  const ages = (d.by_age_group || []).filter((a) => a.givers > 0);
  const ageTotal = ages.reduce((s, a) => s + (a.total_cents || 0), 0);
  const ageTable = ages.length ? `<section class="gr-card"><h2>By age group</h2><p class="muted">Age today, from Connect’s birth dates.</p><div class="table-wrap"><table class="gr-num"><thead><tr><th>Age group</th><th>Givers</th><th>Gifts</th><th>Given</th><th>Average per giver</th><th>Share</th></tr></thead>
    <tbody>${ages.map((a) => `<tr><td>${e(a.label)}</td><td>${a.givers}</td><td>${a.contributions}</td><td>${money(a.total_cents)}</td><td>${money(a.givers ? a.total_cents / a.givers : 0)}</td><td>${ageTotal ? Math.round(a.total_cents / ageTotal * 100) : 0}%</td></tr>`).join('')}</tbody></table></div></section>` : '';
  const groups = groupByFundCode((d.rows || []).map((r) => ({ name: r.fund_name, total_cents: r.total_cents, contributions: r.contributions })));
  const fundRows = groups.map((g) => {
    const total = g.rows.reduce((s, r) => s + (r.total_cents || 0), 0);
    const gifts = g.rows.reduce((s, r) => s + (r.contributions || 0), 0);
    if (g.rows.length === 1) return `<tr${total ? '' : ' class="is-quiet"'}><td>${e(g.rows[0].name)}</td><td>${gifts}</td><td>${money(total)}</td></tr>`;
    return `<tr class="gr-group"><td>${e(g.rows.slice().sort((a, b) => (b.total_cents || 0) - (a.total_cents || 0))[0].name)} <small>(${g.rows.length} funds)</small></td><td>${gifts}</td><td>${money(total)}</td></tr>`
      + g.rows.map((r) => `<tr class="gr-sub"><td>${e(r.name)}</td><td>${r.contributions}</td><td>${money(r.total_cents)}</td></tr>`).join('');
  }).join('');
  const avgGift = d.total_transactions ? d.grand_total_cents / d.total_transactions : 0;
  return `${form}<div class="grid">${card('Givers', String(d.total_givers))}${card('Gifts', String(d.total_transactions))}${card('Given to active funds', money(d.grand_total_cents))}${card('Average gift', money(avgGift))}${card('Average per giver', money(d.total_givers ? d.grand_total_cents / d.total_givers : 0))}</div>
    <p class="gr-caption">${e(d.from)} through ${e(d.to)}. Voided and refunded gifts count at what was kept.</p>
    <div class="gr-two"><section class="gr-card"><h2>By method</h2>${methodTable}</section>
    <section class="gr-card"><h2>By fund</h2><p class="muted">Active funds; funds that share an account code are grouped.</p><div class="table-wrap"><table class="gr-num"><thead><tr><th>Fund</th><th>Gifts</th><th>Given</th></tr></thead><tbody>${fundRows}<tr class="total-row"><td>Total</td><td></td><td>${money(d.grand_total_cents)}</td></tr></tbody></table></div></section></div>${ageTable}`;
}

// ── Giving and attendance ────────────────────────────────────────────────────────────────────
export function pearson(pairs) {
  const pts = pairs.filter(([a, b]) => a > 0 && b > 0);
  if (pts.length < 3) return null;
  const n = pts.length;
  const mx = pts.reduce((s, [a]) => s + a, 0) / n; const my = pts.reduce((s, [, b]) => s + b, 0) / n;
  let sxy = 0; let sxx = 0; let syy = 0;
  pts.forEach(([a, b]) => { sxy += (a - mx) * (b - my); sxx += (a - mx) ** 2; syy += (b - my) ** 2; });
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}
function correlationLabel(r) {
  if (r == null) return 'Not enough weeks';
  const a = Math.abs(r); const dir = r > 0 ? 'positive' : 'negative';
  return a >= 0.7 ? `Strong ${dir}` : a >= 0.4 ? `Moderate ${dir}` : a >= 0.1 ? `Weak ${dir}` : 'None';
}

export function renderAttendancePage({ results, params: p, keep }) {
  const [res] = results;
  const form = controls('attendance', rangeFields(p), keep);
  if (!res.ok) return form + unavailable('Giving and attendance', res.data?.error || res.message);
  const weeks = res.data.weeks || [];
  if (!weeks.length) return `${form}<p class="muted">No attendance or giving in the selected range.</p>`;
  const W = 820; const H = 280; const L = 50; const R = 60; const T = 16; const B = 48;
  const maxAtt = Math.max(...weeks.map((w) => w.attendance), 1) * 1.1;
  const maxGive = Math.max(...weeks.map((w) => w.giving_cents), 1) * 1.1;
  const step = (W - L - R) / weeks.length;
  const y = (v, max) => T + (H - T - B) * (1 - v / max);
  const bars = weeks.map((w, i) => `<rect x="${(L + i * step + step * 0.15).toFixed(1)}" y="${y(w.attendance, maxAtt).toFixed(1)}" width="${(step * 0.7).toFixed(1)}" height="${(H - B - y(w.attendance, maxAtt)).toFixed(1)}" class="gr-att"><title>Week of ${e(w.week_start)}: ${w.attendance} attending</title></rect>`).join('');
  const pts = weeks.map((w, i) => [L + i * step + step / 2, y(w.giving_cents, maxGive), w]);
  const line = `<polyline points="${pts.map(([x, yy]) => `${x.toFixed(1)},${yy.toFixed(1)}`).join(' ')}" class="gr-give"/>` + pts.map(([x, yy, w]) => `<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="3" class="gr-give-dot"><title>Week of ${e(w.week_start)}: ${money(w.giving_cents)}</title></circle>`).join('');
  const every = Math.max(1, Math.ceil(weeks.length / 16));
  const labels = weeks.map((w, i) => (i % every ? '' : `<text x="${(L + i * step + step / 2).toFixed(1)}" y="${H - B + 16}" text-anchor="end" transform="rotate(-35 ${(L + i * step + step / 2).toFixed(1)} ${H - B + 16})" class="gr-axis">${Number(w.week_start.slice(5, 7))}/${Number(w.week_start.slice(8, 10))}</text>`)).join('');
  const grid = [0.25, 0.5, 0.75, 1].map((f) => `<line x1="${L}" x2="${W - R}" y1="${(T + (H - T - B) * (1 - f)).toFixed(1)}" y2="${(T + (H - T - B) * (1 - f)).toFixed(1)}" class="gr-grid"/><text x="${L - 6}" y="${(T + (H - T - B) * (1 - f) + 4).toFixed(1)}" text-anchor="end" class="gr-axis">${Math.round(maxAtt * f)}</text><text x="${W - R + 6}" y="${(T + (H - T - B) * (1 - f) + 4).toFixed(1)}" class="gr-axis">${money(maxGive * f)}</text>`).join('');
  const totalAtt = weeks.reduce((s, w) => s + w.attendance, 0);
  const totalGive = weeks.reduce((s, w) => s + w.giving_cents, 0);
  const r = pearson(weeks.map((w) => [w.attendance, w.giving_cents]));
  return `${form}<div class="grid">${card('Weeks', String(weeks.length))}${card('Attendance', totalAtt.toLocaleString('en-US'))}${card('Given', money(totalGive))}${card('Given per attender', money(totalAtt ? totalGive / totalAtt : 0))}${card('Correlation', correlationLabel(r), r == null ? 'Needs three weeks with both' : `r = ${r.toFixed(2)}`)}</div>
    <section class="gr-card"><h2>Giving and attendance by week</h2><p class="muted">Weeks run Sunday to Saturday and are labeled by their Sunday. Attendance counts every service that week; giving counts every fund.</p>
    <svg viewBox="0 0 ${W} ${H}" class="gr-chart" role="img" aria-label="Weekly attendance and giving">${grid}${bars}${line}${labels}</svg>
    <div class="gr-legend"><i class="gr-key is-att"></i>Attendance (left) <i class="gr-key is-give"></i>Giving (right)</div></section>`;
}

// ── Top and lapsed givers ────────────────────────────────────────────────────────────────────
const nameOf = (x) => `${x.first_name || ''} ${x.last_name || ''}`.trim() || 'Unnamed';
const typeOf = (x) => (x.member_type ? String(x.member_type) : '');

export function renderInsightsPage({ results, params: p, keep, namedHidden }) {
  if (namedHidden) return namedRefusal('Top and lapsed givers');
  const [res] = results;
  const form = controls('insights', yearSelect(p), keep);
  if (!res.ok) return form + unavailable('Top and lapsed givers', res.data?.error || res.message);
  const d = res.data;
  const top = d.top_givers || []; const lapsed = d.lapsed || []; const freq = d.frequency || []; const trend = d.trend || [];
  const freqTotal = freq.reduce((s, f) => s + f.n, 0);
  return `${form}<div class="gr-two">
    <section class="gr-card"><h2>Top ${top.length} givers, ${e(d.year)}</h2>${top.length ? `<div class="table-wrap"><table class="gr-num"><thead><tr><th>#</th><th>Name</th><th>Type</th><th>Gifts</th><th>Given</th></tr></thead><tbody>${top.map((x, i) => `<tr><td>${i + 1}</td><td>${e(nameOf(x))}</td><td>${e(typeOf(x))}</td><td>${x.gifts}</td><td>${money(x.total_cents)}</td></tr>`).join('')}</tbody></table></div>
      <p class="gr-caption">Together: ${money(top.reduce((s, x) => s + x.total_cents, 0))}.</p>` : '<p class="muted">No gifts recorded.</p>'}</section>
    <section class="gr-card"><h2>Lapsed: gave in ${e(d.year - 1)}, nothing in ${e(d.year)}</h2>${lapsed.length ? `<div class="table-wrap gr-scroll"><table class="gr-num"><thead><tr><th>Name</th><th>Type</th><th>${e(d.year - 1)} gifts</th><th>${e(d.year - 1)} given</th><th>Last gift</th></tr></thead><tbody>${lapsed.map((x) => `<tr><td>${e(nameOf(x))}</td><td>${e(typeOf(x))}</td><td>${x.prior_gifts}</td><td>${money(x.prior_total_cents)}</td><td>${e(x.last_gift_date || '—')}</td></tr>`).join('')}</tbody></table></div>
      <p class="gr-caption">${plural(lapsed.length, 'lapsed giver')}, who gave ${money(lapsed.reduce((s, x) => s + x.prior_total_cents, 0))} in ${e(d.year - 1)}.</p>` : `<p class="muted">No lapsed givers: everyone who gave in ${e(d.year - 1)} has given in ${e(d.year)}.</p>`}</section></div>
    <div class="gr-two"><section class="gr-card"><h2>How often people gave, ${e(d.year)}</h2><p class="muted">${plural(freqTotal, 'giver')}.</p><ul class="gr-meters">${freq.map((f) => `<li><span>${e(f.label)}</span>${bar(freqTotal ? f.n / freqTotal : 0)}<b>${f.n} (${freqTotal ? Math.round(f.n * 100 / freqTotal) : 0}%)</b></li>`).join('')}</ul></section>
    <section class="gr-card"><h2>Average gift, last five years</h2><div class="table-wrap"><table class="gr-num"><thead><tr><th>Year</th><th>Givers</th><th>Gifts</th><th>Given</th><th>Average gift</th><th>Average per giver</th></tr></thead><tbody>${trend.map((t) => `<tr><td>${e(t.year)}</td><td>${t.givers}</td><td>${t.gifts}</td><td>${money(t.total_cents)}</td><td>${money(t.avg_gift_cents)}</td><td>${money(t.avg_giver_cents)}</td></tr>`).join('')}</tbody></table></div></section></div>`;
}

// ── Each giver, year over year ───────────────────────────────────────────────────────────────
const signed = (cents) => `${cents > 0 ? '+' : cents < 0 ? '−' : ''}${money(Math.abs(cents))}`;
const signedPct = (value) => (value == null ? '—' : `${value > 0 ? '+' : ''}${value}%`);
const tone = (cents) => (cents > 0 ? 'gr-up' : cents < 0 ? 'gr-down' : '');
const longDay = (iso) => {
  const [y, m, d] = String(iso || '').split('-').map(Number);
  return y ? `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1]} ${d}` : '';
};

// The year is not over: compare this year so far with last year to the same day, so September
// is not "gave less" for everyone, and project each giver's year-end from that comparison.
function renderPartialGiverTrends(form, d) {
  const base = d.base_year; const prior = base - 1;
  const through = longDay(d.as_of);
  const people = (d.people || []).filter((x) => (x.curr_ytd || 0) > 0 || (x.prior_ytd || 0) > 0 || (x.prior_total || 0) > 0);
  const byChange = (list) => list.slice().sort((a, b) => Math.abs(b.ytd_change_cents) - Math.abs(a.ytd_change_cents));
  const groups = [
    ['Gave more', `so far in ${base} than by ${through}, ${prior}`, byChange(people.filter((x) => x.prior_total > 0 && x.curr_ytd > x.prior_ytd))],
    ['Gave less', `so far in ${base} than by ${through}, ${prior}`, byChange(people.filter((x) => x.curr_ytd > 0 && x.curr_ytd < x.prior_ytd))],
    ['New this year', `gave in ${base}, nothing in ${prior}`, byChange(people.filter((x) => x.prior_total === 0 && x.curr_ytd > 0))],
    ['Stopped', `gave by ${through}, ${prior}; nothing yet in ${base}`, byChange(people.filter((x) => x.prior_ytd > 0 && x.curr_ytd === 0))],
  ];
  const head = `<th>Name</th><th>Type</th><th>${e(prior)} full year</th><th>${e(prior)} to ${e(through)}</th><th>${e(base)} to ${e(through)}</th><th>Change</th><th>%</th><th>Projected ${e(base)}</th><th>vs. ${e(prior)}</th>`;
  const row = (x) => `<tr><td>${e(nameOf(x))}</td><td>${e(typeOf(x))}</td><td>${money(x.prior_total)}</td><td>${money(x.prior_ytd)}</td><td>${money(x.curr_ytd)}</td>`
    + `<td class="${tone(x.ytd_change_cents)}">${signed(x.ytd_change_cents)}</td><td>${signedPct(x.ytd_change_pct)}</td><td>${money(x.projected_cents)}</td><td class="${tone(x.projected_change_cents)}">${signed(x.projected_change_cents)}</td></tr>`;
  const block = ([title, sub, list]) => (list.length ? `<section class="gr-card"><h2>${e(title)} <small>${e(sub)} · ${list.length}</small></h2><div class="table-wrap gr-scroll"><table class="gr-num"><thead><tr>${head}</tr></thead>
    <tbody>${list.map(row).join('')}</tbody></table></div></section>` : '');
  const shown = groups.map(block).join('');
  const sum = (list, key) => list.reduce((s, x) => s + (x[key] || 0), 0);
  const note = `<p class="gr-caption gr-method"><b>How this is figured.</b> ${e(base)} is not over, so each person’s giving from January 1 through ${e(through)} is compared with their giving from January 1 through ${e(through)}, ${e(prior)} (the same days of the year), and the groups follow that comparison. The projected ${e(base)} total is their whole ${e(prior)} total scaled by how this year compares so far (this year to date ÷ last year to the same day); for someone who had not given by this point last year, it is this year’s giving so far spread over the whole year (${Math.round((d.year_elapsed || 0) * 100)}% of the year has gone by). People who gave in ${e(prior)} only after ${e(through)} and have not given yet this year are on the same schedule, so they are in no group. Counted per person; voided and refunded gifts count at what was kept.</p>`;
  return `${form}<div class="grid">${groups.map(([t, , list]) => card(t, String(list.length), `${signed(sum(list, 'ytd_change_cents'))} vs. ${e(prior)} to date`)).join('')}</div>
    ${note}${shown || `<p class="muted">No giving found for ${e(base)} or ${e(prior)}.</p>`}`;
}

export function renderGiverTrendsPage({ results, params: p, keep, namedHidden }) {
  if (namedHidden) return namedRefusal('Each giver, year over year');
  const [res] = results;
  const form = controls('giver-trends', yearSelect(p), keep);
  if (!res.ok) return form + unavailable('Each giver’s year over year', res.data?.error || res.message);
  const d = res.data;
  if (d.partial && d.as_of) return renderPartialGiverTrends(form, d);
  const years = d.years || [];
  const base = d.base_year; const prior = base - 1;
  const people = d.people || [];
  const groups = [
    ['Gave more', `${prior} → ${base}`, people.filter((x) => x.prior_total > 0 && x.change_cents > 0)],
    ['Gave less', `${prior} → ${base}`, people.filter((x) => x.prior_total > 0 && x.change_cents < 0)],
    ['New this year', `gave in ${base}, not in ${prior}`, people.filter((x) => x.prior_total === 0 && x.curr_total > 0)],
    ['Stopped', `gave in ${prior}, not in ${base}`, people.filter((x) => x.curr_total === 0 && x.prior_total > 0)],
  ];
  const cell = (x, y) => (x.by_year?.[y] ? money(x.by_year[y].total_cents) : '—');
  const block = ([title, sub, list]) => (list.length ? `<section class="gr-card"><h2>${e(title)} <small>${e(sub)} · ${list.length}</small></h2><div class="table-wrap gr-scroll"><table class="gr-num"><thead><tr><th>Name</th><th>Type</th>${years.map((y) => `<th>${e(y)}</th>`).join('')}<th>Change</th><th>%</th></tr></thead>
    <tbody>${list.map((x) => `<tr><td>${e(nameOf(x))}</td><td>${e(typeOf(x))}</td>${years.map((y) => `<td>${cell(x, y)}</td>`).join('')}<td class="${x.change_cents > 0 ? 'gr-up' : x.change_cents < 0 ? 'gr-down' : ''}">${x.change_cents > 0 ? '+' : x.change_cents < 0 ? '−' : ''}${money(Math.abs(x.change_cents))}</td><td>${x.change_pct == null ? '—' : `${x.change_pct > 0 ? '+' : ''}${x.change_pct}%`}</td></tr>`).join('')}</tbody></table></div></section>` : '');
  const shown = groups.map(block).join('');
  return `${form}<div class="grid">${groups.map(([t, , list]) => card(t, String(list.length), `${money(list.reduce((s, x) => s + x.change_cents, 0))} change`)).join('')}</div>
    <p class="gr-caption">Each active person’s giving for ${e(years.join(', '))}, largest changes first. Counted per person; voided and refunded gifts count at what was kept.</p>${shown || `<p class="muted">No giving found for ${e(base)} or ${e(prior)}.</p>`}`;
}

// ── Plateaus and nudges ──────────────────────────────────────────────────────────────────────
const wk = (cents) => `${money(cents)}/wk`;
function optionCell(o) {
  if (!o) return '—';
  return `<b>${wk(o.target_cents)}</b><small>+${wk(o.delta_cents)} → +${money(o.annual_delta_cents)}/yr</small>${o.impact_text ? `<em>${e(o.impact_text)}</em>` : ''}`;
}

function impactPanel(impact, keep) {
  if (!impact?.ok) return '';
  const list = impact.data.statements || [];
  const rows = list.map((s) => `<li>${money(s.monthly_cents)} more a month could provide ${e(s.label)}</li>`).join('');
  const edit = impact.data.can_edit && !keep.council ? `<details class="gr-edit"><summary>Edit impact statements</summary>
    <form method="POST" action="/api/v1/giving-impact" class="gr-impact-form">${Array.from({ length: Math.max(list.length + 3, 5) }, (_, i) => {
      const s = list[i] || {};
      return `<div class="gr-impact-row"><label>$ more a month <input type="number" name="monthly_${i}" min="0" step="1" value="${s.monthly_cents ? Math.round(s.monthly_cents / 100) : ''}"></label><label>could provide… <input type="text" name="label_${i}" maxlength="200" value="${e(s.label || '')}" placeholder="e.g. one more week of Tuition Aid support"></label></div>`;
    }).join('')}<p class="gr-caption">Leave a row blank to remove it. Up to 50 statements; each shows beside the suggested increases it would pay for, here and in the nudge letters.</p><button type="submit">Save statements</button></form></details>` : '';
  return `<section class="gr-card"><h2>Impact statements</h2><p class="muted">What a suggested increase would make possible, written by the church. The report names the largest one each increase covers.</p>${rows ? `<ul class="gr-impacts">${rows}</ul>` : '<p class="muted">None yet.</p>'}${edit}</section>`;
}

export function renderPlateausPage({ results, params: p, keep, namedHidden, status }) {
  if (namedHidden) return namedRefusal('Plateaus and nudges');
  const [res, impact, funds] = results;
  const form = controls('plateaus', yearSelect(p) + fundSelect(p, funds?.ok ? funds.data.funds : []) + scopeSelect(p)
    + `<label>Occasional: gifts a year, at most <input type="number" name="low_frequency_max" min="1" max="51" value="${p.lowFreq}" class="gr-small"></label>`, keep);
  const banner = status ? `<p class="status${status.ok ? '' : ' status-error'}">${e(status.message)}</p>` : '';
  if (!res.ok) return banner + form + unavailable('The plateau report', res.data?.error || res.message) + impactPanel(impact, keep);
  const d = res.data;
  const who = scopeWord(d.scope, 2);
  const s = d.summary || {};
  if (!s.total_givers) return `${banner}${form}<p class="muted">No giving found for ${e(d.year)}${p.fund ? ' in this fund' : ''}.</p>${impactPanel(impact, keep)}`;
  const weeks = d.partial ? 'so far this year' : 'the whole year ÷ 52';
  const excl = d.excluded_organizations?.count ? `<p class="gr-caption">${plural(d.excluded_organizations.count, 'organization')} (${money(d.excluded_organizations.total_cents)}) left out, such as donor-advised funds and IRA custodians, which pass along a person’s gift.</p>` : '';
  const tiers = d.tiers || [];
  const tierRows = tiers.map((t) => `<tr><td>${wk(t.target_cents)}</td><td>${t.num_people}</td><td>${money(t.plateau_min_cents)}–${money(t.plateau_max_cents)}/wk</td><td>+${wk(t.avg_weekly_increase_cents)}</td><td>+${money(t.upside_modest_annual_cents)}–${money(t.upside_generous_annual_cents)}</td></tr>`).join('');
  const who1 = scopeWord(d.scope, 1);
  const tierPeople = tiers.map((t) => `<details class="gr-tier"><summary>${plural(t.num_people, who1, who)} nudging to ${wk(t.target_cents)}</summary><div class="table-wrap"><table class="gr-num gr-options"><thead><tr><th>${d.scope === 'person' ? 'Name' : 'Household'}</th><th>Now</th><th>Modest</th><th>Standard</th><th>Generous</th></tr></thead>
    <tbody>${t.people.map((x) => `<tr><td>${e(x.name)}${x.low_frequency ? `<small>gave ${money(x.total_cents)} in ${plural(x.gifts, 'gift')} — about ${wk(x.weekly_cents)}</small>` : ''}</td><td><b>${wk(x.weekly_cents)}</b><small>${plural(x.gifts, 'gift')}${x.cadence_label ? `, ${e(x.cadence_label)}` : ''}</small></td>${[0, 1, 2].map((i) => `<td>${optionCell(x.options?.[i])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${t.people.length < t.num_people ? `<p class="gr-caption">Showing the first ${t.people.length} of ${t.num_people}.</p>` : ''}</details>`).join('');
  const occ = d.low_frequency_givers_list || [];
  const occBlock = occ.length ? `<section class="gr-card"><h2>Occasional givers <small>${plural(s.low_frequency_givers, who1, who)} gave ${p.lowFreq} times or fewer</small></h2><p class="muted">A standing online gift is often the kindest next step for someone who gives now and then.</p><div class="table-wrap gr-scroll"><table class="gr-num"><thead><tr><th>${d.scope === 'person' ? 'Name' : 'Household'}</th><th>Given</th><th>Gifts</th><th>Average gift</th><th>How they give</th></tr></thead>
    <tbody>${occ.map((x) => `<tr><td>${e(x.name)}</td><td>${money(x.total_cents)}</td><td>${x.gifts}</td><td>${money(x.avg_gift_cents)}</td><td>${x.all_manual_methods ? 'Check or cash only' : 'Already gives online'}</td></tr>`).join('')}</tbody></table></div></section>` : '';
  const dist = d.distribution || [];
  const maxN = Math.max(...dist.map((x) => x.n), 1);
  const histogram = dist.length ? `<section class="gr-card"><h2>Weekly-equivalent giving</h2><div class="gr-hist">${dist.map((x) => `<span style="height:${(x.n / maxN * 100).toFixed(1)}%" title="$${x.plateau_dollars}/wk: ${x.n}"></span>`).join('')}</div><div class="gr-axisrow"><span>$${dist[0].plateau_dollars}/wk</span><span>$${dist[dist.length - 1].plateau_dollars}/wk</span></div></section>` : '';
  return `${banner}${form}<div class="grid">${card(`Giving ${who}`, String(s.total_givers), `Weekly amounts are ${weeks}`)}${card('If each took the next step', `+${money(s.total_upside_modest_annual_cents)}–${money(s.total_upside_generous_annual_cents)}`, 'a year, modest to generous')}${card('Occasional givers', String(s.low_frequency_givers), `${p.lowFreq} gifts a year or fewer`)}</div>${excl}
    <section class="gr-card"><h2>Nudge targets <small>standard option</small></h2><p class="muted">Each ${who1} is grouped by the next round weekly amount above what they give now; Modest, Standard and Generous are the next three steps.</p><div class="table-wrap"><table class="gr-num"><thead><tr><th>Nudge to</th><th>${who[0].toUpperCase() + who.slice(1)}</th><th>Now</th><th>Average increase</th><th>Added a year</th></tr></thead><tbody>${tierRows}<tr class="total-row"><td>Total</td><td>${s.total_givers}</td><td></td><td></td><td>+${money(s.total_upside_modest_annual_cents)}–${money(s.total_upside_generous_annual_cents)}</td></tr></tbody></table></div></section>
    <section class="gr-card"><h2>Who is in each step</h2>${tierPeople}</section>${occBlock}${histogram}${impactPanel(impact, keep)}`;
}

// ── Weekly and monthly bands ─────────────────────────────────────────────────────────────────
export function renderBandsPage({ results, params: p, keep, namedHidden }) {
  if (namedHidden) return namedRefusal('Weekly and monthly bands');
  const [res, funds] = results;
  const per = p.freq === 'monthly' ? 'month' : 'week';
  const form = controls('bands', yearSelect(p) + fundSelect(p, funds?.ok ? funds.data.funds : []) + scopeSelect(p)
    + `<label>Per <select name="freq"><option value="weekly"${p.freq === 'weekly' ? ' selected' : ''}>Week</option><option value="monthly"${p.freq === 'monthly' ? ' selected' : ''}>Month</option></select></label>`
    + `<label>If each gives $<input type="number" name="uplift" min="0" max="1000" step="1" value="${p.uplift}" class="gr-small"> more</label>`, keep);
  if (!res.ok) return form + unavailable('Giving bands', res.data?.error || res.message);
  const d = res.data;
  const unit = d.freq === 'monthly' ? 'mo' : 'wk';
  const perWord = d.freq === 'monthly' ? 'month' : 'week';
  const who = scopeWord(d.scope, 2);
  const s = d.summary || {};
  if (!s.givers) return `${form}<p class="muted">No giving recorded for ${e(d.year)}.</p>`;
  const bands = d.bands || [];
  const maxN = Math.max(...bands.map((b) => b.n), 1);
  const upliftDollars = Math.round((d.uplift_cents || 0) / 100);
  const rows = bands.map((b) => `<tr${b.n ? '' : ' class="is-quiet"'}><td>${b.high_cents == null ? `${money(b.low_cents)}+` : `${money(b.low_cents)}–${money(b.high_cents)}`}/${unit}</td><td class="gr-barcell">${bar(b.n / maxN)}</td><td>${b.n}</td><td>${b.n ? `${money(b.avg_per_period_cents)}/${unit}` : '—'}</td><td>${money(b.total_cents)}</td><td>${b.n ? `+${money(b.uplift_annual_cents)}` : '—'}</td></tr>`).join('');
  return `${form}<div class="grid">${card(`${who[0].toUpperCase() + who.slice(1)} who gave`, String(s.givers))}${card('Added a year', `+${money(s.uplift_annual_cents)}`, `if every ${scopeWord(d.scope, 1)} gave $${upliftDollars} more a ${perWord}`)}${card(d.partial ? 'Giving at this pace, a full year' : 'Giving', money(d.partial ? s.current_annualized_cents : s.total_cents), d.partial ? `${money(s.total_cents)} so far` : e(String(d.year)))}</div>
    <section class="gr-card"><h2>${e(who[0].toUpperCase() + who.slice(1))} by giving level ($/${unit})</h2><p class="muted">Each ${scopeWord(d.scope, 1)}’s level is their ${e(d.year)} giving ÷ ${d.periods_elapsed} ${perWord}s${d.partial ? ' so far' : ''}. Anonymous gifts and organizations are left out.</p>
    <div class="table-wrap"><table class="gr-num"><thead><tr><th>Band</th><th></th><th>${e(who[0].toUpperCase() + who.slice(1))}</th><th>Average</th><th>Given ${e(d.year)}</th><th>+$${upliftDollars}/${unit} adds a year</th></tr></thead><tbody>${rows}
    <tr class="total-row"><td>Total</td><td></td><td>${s.givers}</td><td></td><td>${money(s.total_cents)}</td><td>+${money(s.uplift_annual_cents)}</td></tr></tbody></table></div></section>`;
}

export function renderGivingReportPage(pageId, ctx) {
  switch (pageId) {
    case 'funds-methods': return renderFundsMethodsPage(ctx);
    case 'attendance': return renderAttendancePage(ctx);
    case 'insights': return renderInsightsPage(ctx);
    case 'giver-trends': return renderGiverTrendsPage(ctx);
    case 'plateaus': return renderPlateausPage(ctx);
    case 'bands': return renderBandsPage(ctx);
    default: return renderDistributionPage(ctx);
  }
}

// Impact statements form → the list Connect stores (it cleans and caps it again).
export function impactStatementsFromForm(form) {
  const out = [];
  for (let i = 0; i < 60; i += 1) {
    const dollars = Number(form[`monthly_${i}`]);
    const label = String(form[`label_${i}`] || '').trim();
    if (label && Number.isFinite(dollars) && dollars > 0) out.push({ monthly_cents: Math.round(dollars * 100), label: label.slice(0, 200) });
  }
  return out.slice(0, 50);
}

export const GIVING_REPORTS_STYLES = `
    .gr-controls { display:flex; flex-wrap:wrap; align-items:flex-end; gap:10px 16px; margin-top:14px; padding:12px 16px; border:1px solid var(--line); border-radius:10px; background:#fff; }
    .gr-controls label { display:flex; flex-direction:column; gap:4px; }
    .gr-controls button { margin-top:0; }
    .gr-small { width:5rem; }
    .gr-card { margin-top:16px; padding:18px 20px; border:1px solid var(--line); border-radius:10px; background:#fff; }
    .gr-card h2 { margin:0 0 .35rem; font-size:18px; }
    .gr-card h2 small { color:var(--muted); font-family:"Figtree", sans-serif; font-size:13px; font-weight:400; }
    .gr-card > .muted { margin:.2rem 0 .7rem; font-size:13.5px; }
    .gr-caption { margin:.5rem 0 0; color:var(--muted); font-size:12.5px; }
    .gr-two { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr)); gap:0 16px; align-items:start; }
    .gr-num th:nth-child(n+2), .gr-num td:nth-child(n+2) { text-align:right; }
    .gr-num td small, .gr-num td em { display:block; color:var(--muted); font-size:11.5px; font-style:normal; }
    .gr-num td em { color:var(--teal); }
    .gr-options td { vertical-align:top; }
    .gr-barcell { min-width:140px; white-space:nowrap; }
    .gr-bar { display:inline-block; width:110px; height:8px; border-radius:4px; background:var(--line-soft); vertical-align:middle; overflow:hidden; }
    .gr-bar > span { display:block; height:100%; background:var(--teal); border-radius:4px; }
    tr.is-quiet td { color:var(--faint); }
    tr.gr-group td { font-weight:600; }
    tr.gr-sub td:first-child { padding-left:28px; color:var(--muted); }
    .gr-up { color:var(--green); } .gr-down { color:var(--red); }
    .gr-scroll { max-height:520px; overflow:auto; }
    .gr-meters { list-style:none; margin:10px 0 0; padding:0; }
    .gr-meters li { display:grid; grid-template-columns:minmax(0,1fr) 120px auto; gap:12px; align-items:center; padding:8px 0; border-bottom:1px solid var(--line-soft); font-size:14px; }
    .gr-meters .gr-bar { width:120px; }
    .gr-cols { display:flex; align-items:flex-end; gap:14px; height:180px; margin:10px 0 4px; border-bottom:1px solid #D5DAE3; }
    .gr-col { flex:1; display:flex; flex-direction:column; align-items:center; height:100%; }
    .gr-col small { margin-top:6px; color:var(--muted); font-size:12px; }
    .gr-pair { flex:1; width:100%; display:flex; align-items:flex-end; justify-content:center; gap:4px; }
    .gr-colbar { width:min(24px,40%); min-height:2px; border-radius:3px 3px 0 0; background:var(--navy); }
    .gr-colbar.is-real { background:#C3CDDD; }
    .gr-legend { display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin-top:26px; color:var(--muted); font-size:12px; }
    .gr-key { display:inline-block; width:10px; height:10px; margin-left:8px; border-radius:2px; background:var(--navy); }
    .gr-key.is-real { background:#C3CDDD; } .gr-key.is-att { background:#5A9E6F; } .gr-key.is-give { background:#2E7EA6; border-radius:50%; }
    .gr-chart { display:block; width:100%; height:auto; }
    .gr-att { fill:#5A9E6F; opacity:.55; } .gr-give { fill:none; stroke:#2E7EA6; stroke-width:2; } .gr-give-dot { fill:#2E7EA6; }
    .gr-grid { stroke:var(--line-soft); } .gr-axis { fill:var(--muted); font-size:11px; }
    .gr-donut { display:flex; flex-wrap:wrap; align-items:center; gap:18px; margin-bottom:10px; }
    .gr-donut svg { width:170px; height:170px; }
    .gr-donut ul { flex:1; min-width:180px; margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:6px; font-size:13px; }
    .gr-donut li { display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:6px; }
    .gr-donut .gr-key { margin-left:0; }
    .gr-tier { margin-top:8px; border:1px solid var(--line-soft); border-radius:8px; padding:8px 12px; }
    .gr-tier summary { cursor:pointer; font-weight:600; color:var(--navy); }
    .gr-hist { display:flex; align-items:flex-end; gap:2px; height:120px; margin-top:10px; border-bottom:1px solid #D5DAE3; }
    .gr-hist span { flex:1; min-height:1px; background:var(--gold); border-radius:2px 2px 0 0; }
    .gr-axisrow { display:flex; justify-content:space-between; margin-top:6px; color:var(--muted); font-size:12px; }
    .gr-method { max-width:72rem; line-height:1.5; }
    .gr-impacts { margin:.4rem 0 0; padding-left:20px; color:var(--ink); font-size:14px; line-height:1.6; }
    .gr-edit { margin-top:12px; }
    .gr-edit summary { cursor:pointer; font-weight:600; color:var(--navy); }
    .gr-impact-form { margin-top:10px; }
    .gr-impact-row { display:grid; grid-template-columns:minmax(120px,160px) 1fr; gap:10px; margin-top:8px; }
    .gr-impact-row label { display:flex; flex-direction:column; gap:4px; }
    @media print { .gr-controls, .gr-edit { display:none !important; } .gr-scroll { max-height:none; overflow:visible; } .gr-tier { break-inside:avoid; } details.gr-tier > * { display:block; } }
`;
