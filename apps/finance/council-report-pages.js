// Giving › Council report: the Giving Report to the Church Council, ported from Connect's Giving
// › Reports board (Dashboard, Narrative and Analysis). Dashboard and Narrative come from Connect's
// giving-board-v1, the same computation Connect's own board page uses, so the two can never
// disagree; Analysis reads the giving distribution and five-year trend through giving-reports-v1
// (both totals only). Aggregate only; no donor is named, so council may read it. Finance pages
// run no script: the lens, period, year and view are GET parameters, and Print is the shell's
// print=1 version of this page (Dashboard and Narrative append a summary of the other
// categories). Email packet posts to /api/v1/giving-board-email.
import { escapeHtml as e } from './render-helpers.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CHURCH = 'Timothy Lutheran Church';
const FALLBACK_LENS = { key: 'all', label: 'All giving', hh_label: 'Giving households', fund_count: 0, given_ytd_cents: 0 };
const MIX_COLORS = { check: '#C4DDE8', ach: '#6B8F71', cash: '#C9973A', other: '#8A8377' };
const SEGMENT_COLORS = ['#C9973A', '#C4DDE8', '#6B8F71', 'rgba(255,255,255,.28)'];

// Whole dollars with a true minus sign, as on Connect's board.
export function boardMoney(cents) {
  const d = Math.round(Math.abs(Number(cents) || 0) / 100);
  return `${cents < 0 ? '−$' : '$'}${d.toLocaleString('en-US')}`;
}

function signed(cents) {
  return `${cents > 0 ? '+' : ''}${boardMoney(cents)}`;
}

export function lensBlock(data, lens) {
  const cats = data?.categories || {};
  return cats[lens] || cats.all || FALLBACK_LENS;
}

export function lensOptions(data) {
  return [...(data?.fund_categories || []), { key: 'all', label: 'All giving' }];
}

// The same period menu as Connect's board: the last 12 months, the last three quarters, and the
// last two full years. Values are what giving-board-v1 accepts.
export function councilPeriods(today) {
  const [y, mo] = String(today).split('-').map(Number);
  const out = [];
  for (let i = 0; i < 12; i += 1) {
    let m = mo - i;
    let yy = y;
    while (m <= 0) { m += 12; yy -= 1; }
    out.push({ value: `${yy}-${String(m).padStart(2, '0')}`, label: `${MONTHS[m - 1]} ${yy}` });
  }
  const curQ = Math.ceil(mo / 3);
  for (let q = 0; q < 3; q += 1) {
    let qq = curQ - q;
    let qy = y;
    while (qq <= 0) { qq += 4; qy -= 1; }
    out.push({ value: `${qy}-Q${qq}`, label: `Q${qq} ${qy}` });
  }
  out.push({ value: String(y - 1), label: `Annual ${y - 1}` }, { value: String(y - 2), label: `Annual ${y - 2}` });
  return out;
}

export function councilParams(params, today) {
  const periods = councilPeriods(today);
  const period = periods.some((p) => p.value === params.get('period')) ? params.get('period') : periods[0].value;
  const mode = ['narrative', 'analysis'].includes(params.get('view')) ? params.get('view') : 'dashboard';
  const lens = /^[a-z_]{2,20}$/.test(params.get('lens') || '') ? params.get('lens') : 'general';
  // Analysis year: this year by default, never before 2000 or after this year.
  const thisYear = Number(String(today).slice(0, 4));
  const y = Number(params.get('year'));
  const year = Number.isInteger(y) && y >= 2000 && y <= thisYear ? y : thisYear;
  return { period, mode, lens, periods, year, thisYear };
}

// The two Connect reads the Analysis view makes, as [report, query] pairs for fetchGivingReport:
// the same calls as Connect's givAnalysisLoad (households, and five years ending at the year).
export function councilAnalysisRequests(year) {
  return [['distribution', { year, scope: 'household' }], ['multiyear', { end: year, years: 5 }]];
}

function href(params) {
  const search = new URLSearchParams({ section: 'giving-analytics', page: 'council' });
  for (const [k, v] of Object.entries(params)) if (v) search.set(k, v);
  return `/?${search.toString().replace(/&/g, '&amp;')}`;
}

// "40085 General Fund" and "40085 Advent" fold into one line under their shared leading code,
// labeled by the larger fund, as on every per-fund view in Connect.
export function groupByFundCode(funds) {
  const groups = new Map();
  (funds || []).forEach((f, i) => {
    const code = (String(f.name || '').match(/^(\d+)\s/) || [])[1];
    const key = code ? `c${code}` : `u${i}`;
    if (!groups.has(key)) groups.set(key, { code, rows: [], total: 0 });
    const g = groups.get(key);
    g.rows.push(f);
    g.total += f.actual_cents || 0;
  });
  return [...groups.values()].map((g) => {
    const rep = [...g.rows].sort((a, b) => (b.actual_cents || 0) - (a.actual_cents || 0))[0];
    const prior = g.rows.reduce((s, f) => s + (f.prior_cents || 0), 0);
    const hasBudget = g.rows.some((f) => f.budget_ytd_cents != null);
    const budget = hasBudget ? g.rows.reduce((s, f) => s + (f.budget_ytd_cents || 0), 0) : null;
    return { label: rep.name, rows: g.rows, actual: g.total, prior, budget, variance: budget == null ? null : g.total - budget };
  });
}

function asOfLabel(data) {
  const ends = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const y = data.year;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const last = data.through_month === 2 && leap ? 29 : ends[data.through_month - 1];
  return `${MONTHS[data.through_month - 1]} ${last}, ${y}`;
}

function projectionNote(g) {
  if (g.projection_method === 'seasonal') return 'Projected on last year’s seasonal pattern';
  if (g.projection_method === 'linear-weekly') return 'Projected from the pace per Sunday so far this year';
  if (g.projection_method === 'linear') return 'Projected straight-line from the pace so far';
  return 'Full year recorded';
}

function kpi(color, label, value, sub, valueTone = '') {
  return `<div class="cr-kpi" style="border-top-color:${color}"><small>${e(label)}</small><strong class="${valueTone}">${value}</strong><span>${sub}</span></div>`;
}

function kpis(data, g) {
  const deltaSub = g.given_ytd_prior_cents > 0
    ? `${g.given_ytd_delta_pct >= 0 ? '+' : '−'}${Math.abs(g.given_ytd_delta_pct)}% vs. same point in ${data.prior_year} (${boardMoney(g.given_ytd_prior_cents)})`
    : 'No prior-year data for this point';
  const budget = g.budget_variance_cents == null
    ? kpi('#B85C3A', 'Vs. budget YTD', '—', g.key === 'general' ? 'No Church Report budget uploaded for this account yet' : 'No budget set for the funds in this category', 'tone-muted')
    : kpi('#B85C3A', 'Vs. budget YTD', boardMoney(g.budget_variance_cents),
      `${Math.abs(g.budget_variance_pct)}% ${g.budget_variance_cents < 0 ? 'behind' : 'ahead of'} the ${boardMoney(g.budget_ytd_cents)} plan`,
      g.budget_variance_cents < 0 ? 'tone-bad' : 'tone-good');
  const projSub = g.projection_vs_budget_cents == null ? projectionNote(g)
    : `${boardMoney(Math.abs(g.projection_vs_budget_cents))} ${g.projection_vs_budget_cents < 0 ? 'under' : 'over'} a ${boardMoney(g.annual_budget_cents)} budget`;
  const hhDelta = g.households - g.households_prior;
  const hhSub = `${g.households_prior > 0 ? `${Math.abs(hhDelta)}${hhDelta === 0 ? ' same as ' : hhDelta < 0 ? ' fewer than ' : ' more than '}${data.prior_year} · ` : ''}${boardMoney(g.avg_per_household_cents)} average`;
  return `<div class="cr-kpis">
    ${kpi('#2E7EA6', `${g.label} YTD`, boardMoney(g.given_ytd_cents), e(deltaSub))}
    ${budget}
    ${kpi('#C9973A', 'Year-end projection', boardMoney(g.projection_cents), e(projSub))}
    ${kpi('#6B8F71', g.hh_label || 'Giving households', (g.households || 0).toLocaleString('en-US'), e(hhSub))}
  </div>`;
}

function niceStepK(maxK) {
  if (!(maxK > 0)) return 1;
  const target = maxK / 3;
  const mag = 10 ** Math.floor(Math.log10(target));
  const norm = target / mag;
  return (norm > 5 ? 10 : norm > 2 ? 5 : norm > 1 ? 2 : 1) * mag;
}

// Prior year (every month), this year (through the report month), and the budget (spread by last
// year's pattern) when there is one — the same grouped bars as Connect's board.
export function monthChart(data, g) {
  const cur = g.monthly?.current || data.monthly?.current || new Array(12).fill(0);
  const prior = g.monthly?.prior || data.monthly?.prior || new Array(12).fill(0);
  const tm = data.through_month;
  const annualBudget = g.annual_budget_cents || 0;
  const priorTotal = prior.reduce((s, v) => s + v, 0);
  const budget = prior.map((p) => (g.has_budget ? (priorTotal > 0 ? annualBudget * (p / priorTotal) : annualBudget / 12) : 0));
  let maxCents = 0;
  for (let j = 0; j < 12; j += 1) maxCents = Math.max(maxCents, j < tm ? cur[j] : 0, prior[j], budget[j]);
  const maxK = maxCents / 100000;
  const stepK = niceStepK(maxK);
  const axisMaxK = Math.max(stepK * 2, Math.ceil(maxK / stepK) * stepK);
  const baseline = 120;
  const span = 94;
  const h = (cents) => Math.max(0, (cents / 100000 / axisMaxK) * span);
  let svg = `<svg viewBox="0 0 700 150" class="cr-chart" role="img" aria-label="${e(g.label)} by month, ${data.prior_year} and ${data.year}${g.has_budget ? ', with budget' : ''}, in thousands of dollars">`;
  for (const val of [0, axisMaxK / 2, axisMaxK]) {
    const yy = baseline - (val / axisMaxK) * span;
    const half = stepK / 2;
    let dp = half >= 1 ? 0 : Math.min(3, Math.ceil(-Math.log10(half)));
    if (half >= 1 && Math.abs(val - Math.round(val)) > 0.001) dp = 1;
    svg += `<line x1="26" y1="${yy.toFixed(1)}" x2="700" y2="${yy.toFixed(1)}" stroke="${val === 0 ? '#E3E6EC' : '#EEF0F4'}" stroke-width="1"/>`;
    svg += `<text x="22" y="${(yy + 3).toFixed(1)}" text-anchor="end" fill="#8A93A5" font-size="9">${val.toFixed(dp)}</text>`;
  }
  const x0 = 30;
  const pitch = (700 - x0 - 6) / 12;
  const barW = 13;
  for (let mo = 0; mo < 12; mo += 1) {
    const bars = [{ v: prior[mo], fill: '#C4DDE8' }];
    if (mo < tm) bars.push({ v: cur[mo], fill: '#2E7EA6' });
    if (g.has_budget) bars.push({ v: budget[mo], fill: '#F5E0B0', stroke: '#C9973A' });
    const groupW = bars.length * barW + (bars.length - 1) * 2;
    const gs = x0 + mo * pitch + (pitch - groupW) / 2;
    bars.forEach((b, bi) => {
      const bh = h(b.v);
      svg += `<rect x="${(gs + bi * (barW + 2)).toFixed(1)}" y="${(baseline - bh).toFixed(1)}" width="${barW}" height="${bh.toFixed(1)}" fill="${b.fill}"${b.stroke ? ` stroke="${b.stroke}" stroke-width=".8"` : ''} rx="2"/>`;
    });
    svg += `<text x="${(x0 + mo * pitch + pitch / 2).toFixed(1)}" y="136" text-anchor="middle" fill="${mo < tm ? '#5B6475' : '#8A93A5'}" font-size="10">${MONTHS_SHORT[mo]}</text>`;
  }
  return `${svg}</svg>`;
}

function unitOf(g) {
  return g.key === 'passive' ? 'accounts' : g.key === 'earned' ? 'payers' : 'households';
}

function navyPanel(data, g) {
  const rows = (g.method_mix || data.method_mix || []).map((m) => `<div class="cr-mix">
      <div><span>${e(m.label)}</span><span>${boardMoney(m.cents)} · ${m.pct}%</span></div>
      <i><b style="width:${Math.max(0, Math.min(100, m.pct))}%;background:${MIX_COLORS[m.key] || '#8A8377'}"></b></i></div>`).join('');
  const con = g.concentration || data.concentration || { segments: [], top10_pct: 0, half_households: 0 };
  const unit = unitOf(g);
  const conText = `The ten largest ${unit} account for <strong>${con.top10_pct}%</strong> of ${g.key === 'all' ? 'everything received this year' : `${e(g.label).toLowerCase()} this year`}.${con.half_households > 0 ? ` Half of it comes from ${con.half_households} ${unit}.` : ''}`;
  return `<div class="cr-navy">
    <div class="cr-navy-label">Where the money comes from</div>
    ${rows}
    <div class="cr-navy-con">
      <div class="cr-navy-label">Concentration</div>
      <p>${conText}</p>
      <div class="cr-seg">${(con.segments || []).map((s, i) => `<span style="width:${Math.max(0, s.pct)}%;background:${SEGMENT_COLORS[i] || SEGMENT_COLORS[3]}"></span>`).join('')}</div>
      <div class="cr-seg-labels">${(con.segments || []).map((s) => `<span>${e(s.label)}</span>`).join('')}</div>
    </div>
  </div>`;
}

function varCell(v) {
  if (v == null) return '<td class="num tone-muted">—</td>';
  return `<td class="num ${v < 0 ? 'tone-bad' : v > 0 ? 'tone-good' : 'tone-muted'}">${signed(v)}</td>`;
}

function moneyCell(cents, muted = false) {
  return cents == null ? '<td class="num tone-muted">—</td>' : `<td class="num${muted ? ' tone-muted' : ''}">${boardMoney(cents)}</td>`;
}

function totalRow(g) {
  return `<tr class="cr-total"><td>Total</td>${moneyCell(g.given_ytd_cents)}${moneyCell(g.budget_ytd_cents)}${varCell(g.budget_variance_cents)}${moneyCell(g.given_ytd_prior_cents)}</tr>`;
}

function fundTable(data, g, ctx) {
  const head = (first) => `<thead><tr><th>${first}</th><th class="num">YTD actual</th><th class="num">YTD budget</th><th class="num">Variance</th><th class="num">${data.prior_year}</th></tr></thead>`;
  if (g.key === 'all') {
    const rows = (data.fund_categories || []).map((c) => {
      const cb = data.categories?.[c.key];
      if (!cb) return '';
      return `<tr><td><a href="${href({ ...ctx, lens: c.key })}">${e(c.label)}</a> <span class="tone-muted">(${cb.fund_count} fund${cb.fund_count === 1 ? '' : 's'})</span></td>
        ${moneyCell(cb.given_ytd_cents)}${moneyCell(cb.budget_ytd_cents, true)}${varCell(cb.budget_variance_cents)}${moneyCell(cb.given_ytd_prior_cents, true)}</tr>`;
    }).join('');
    return `<div class="panel panel-spaced"><h2>By category</h2><div class="table-scroll"><table class="pm-table cr-table">${head('Category')}<tbody>${rows}${totalRow(g)}</tbody></table></div></div>`;
  }
  const rows = groupByFundCode(g.funds).map((grp) => {
    const top = `<tr${grp.rows.length > 1 ? ' class="cr-group"' : ''}><td>${e(grp.label)}${grp.rows.length > 1 ? ` <span class="tone-muted">(${grp.rows.length} funds)</span>` : ''}</td>
      ${moneyCell(grp.actual)}${moneyCell(grp.budget, true)}${varCell(grp.variance)}${moneyCell(grp.prior, true)}</tr>`;
    const members = grp.rows.length > 1 ? grp.rows.map((f) => `<tr class="cr-member"><td>${e(f.name)}</td>${moneyCell(f.actual_cents)}${moneyCell(f.budget_ytd_cents, true)}${varCell(f.variance_cents)}${moneyCell(f.prior_cents, true)}</tr>`).join('') : '';
    return top + members;
  }).join('');
  return `<div class="panel panel-spaced"><h2>Funds inside ${e(g.label)}</h2><div class="table-scroll"><table class="pm-table cr-table">${head('Fund')}<tbody>${rows}${totalRow(g)}</tbody></table></div></div>`;
}

function dashboard(data, g, ctx) {
  const scope = g.key === 'all' ? 'all funds' : `${g.label} only`;
  const note = g.has_budget
    ? `Thousands of dollars, ${scope}. The budget bar is the council-approved plan spread across the year by last year’s pattern.`
    : `Thousands of dollars, ${scope}. Budget bars appear once the fund budget is set.`;
  return `${kpis(data, g)}
    <div class="cr-body">
      <div class="panel">
        <div class="cr-chart-head"><h2>${e(g.label)} — month by month vs. prior year</h2>
          <span class="cr-legend"><i style="background:#C4DDE8"></i>${data.prior_year} <i style="background:#2E7EA6"></i>${data.year}${g.has_budget ? ' <i style="background:#F5E0B0;border:1px solid #C9973A"></i>Budget' : ''}</span></div>
        <p class="muted-line">${e(note)}</p>
        ${monthChart(data, g)}
      </div>
      ${navyPanel(data, g)}
    </div>
    ${fundTable(data, g, ctx)}`;
}

// The narrative paragraphs, shared by the page and the email packet. Returns plain HTML strings
// (only <strong> for emphasis) so the email can wrap them in its own inline styles.
export function narrativeParts(data, g, lens) {
  const con = g.concentration || data.concentration || { top10_pct: 0, half_households: 0 };
  const asOf = asOfLabel(data);
  const deltaPrior = g.given_ytd_cents - g.given_ytd_prior_cents;
  let lede = `Through ${asOf}, the congregation has given <strong>${boardMoney(g.given_ytd_cents)}</strong> ${g.key === 'all' ? 'across every fund' : `to ${e(g.label.toLowerCase())}`}`;
  if (g.given_ytd_prior_cents > 0) lede += ` — about ${boardMoney(Math.abs(deltaPrior))} ${deltaPrior >= 0 ? 'more' : 'less'} than at this point last year`;
  if (g.budget_variance_cents != null) lede += `, and about ${boardMoney(Math.abs(g.budget_variance_cents))} ${g.budget_variance_cents < 0 ? 'less than' : 'more than'} the budget assumed`;
  lede += '.';

  const done = g.sundays_elapsed || 0;
  const total = g.sundays_in_year || 0;
  const left = g.sundays_remaining || 0;
  const basis = done && total ? ` Counted through <strong>${done} of ${total} Sundays</strong>, with ${left} still to come` : '';
  const basisText = g.projection_method === 'seasonal'
    ? `The projection carries last year’s remaining ${left || 'remaining'} Sundays forward at the pace giving is actually running this year, so a year behind stays behind rather than catching up by December.${basis}${basis ? `, against last year through its own first ${done}.` : ''}`
    : `With no comparable prior year, the projection carries this year’s own average Sunday across the ones left.${basis}${basis ? '.' : ''}`;
  const pace = g.projection_vs_budget_cents != null
    ? `On the current pattern the year finishes near <strong>${boardMoney(g.projection_cents)}</strong> against a budget of ${boardMoney(g.annual_budget_cents)}. That is a gap of roughly <strong>${boardMoney(Math.abs(g.projection_vs_budget_cents))}</strong>${g.annual_budget_cents > 0 ? `, or about ${Math.abs(Math.round((g.projection_vs_budget_cents / g.annual_budget_cents) * 100))} percent` : ''}. ${basisText}`
    : `On the current pattern the year finishes near <strong>${boardMoney(g.projection_cents)}</strong>. ${basisText} Set fund budgets to compare this against plan.`;

  const hhDelta = g.households - g.households_prior;
  const who = `${g.households} households have given so far${g.households_prior > 0 ? `, ${Math.abs(hhDelta)}${hhDelta === 0 ? ' the same as' : hhDelta < 0 ? ' fewer than' : ' more than'} last year` : ''}, at an average of ${boardMoney(g.avg_per_household_cents)} each. The ten largest giving households account for <strong>${con.top10_pct}%</strong> of all money received${con.half_households > 0 ? `, and half of all giving comes from ${con.half_households} households` : ''}. That concentration is the single largest financial risk the council carries: the loss or relocation of a few families would matter more than any line item in the budget.`;

  const mix = Object.fromEntries((g.method_mix || data.method_mix || []).map((m) => [m.key, m.pct || 0]));
  const arrive = `Checks are ${mix.check || 0}% of giving. Automatic giving — ACH and online — is ${mix.ach || 0}%. Loose-plate cash is ${mix.cash || 0}%; it is also the only giving the church cannot acknowledge or attribute.`;

  const others = (data.fund_categories || []).filter((c) => c.key !== lens && data.categories?.[c.key]);
  const elsewhere = others.length
    ? `Beyond the figures above, the year to date also brought ${others.map((c) => `${e(data.categories[c.key].label.toLowerCase())} ${boardMoney(data.categories[c.key].given_ytd_cents)}`).join(', ')}. Those totals are reported here for completeness; each has its own page in the full packet.`
    : '';
  const footnote = `Figures are drawn from recorded contributions as of ${asOf} and exclude tuition, daycare fees, and grant income. No individual donor is identified in this report; household-level detail is available to the finance committee on request.`;
  return { asOf, lede, sections: [['Are we on pace?', pace], ['Who is giving', who], ['How gifts arrive', arrive], ...(elsewhere ? [['Everything else', elsewhere]] : [])], footnote };
}

function narrative(data, g, lens) {
  const n = narrativeParts(data, g, lens);
  const rows = groupByFundCode(g.funds || data.funds).map((grp) => `<tr><td>${e(grp.label)}</td>${moneyCell(grp.actual)}${moneyCell(grp.budget)}${varCell(grp.variance)}${moneyCell(grp.prior, true)}</tr>`).join('');
  return `<article class="cr-narrative">
    <header><div><h2>Giving Report to the Church Council</h2><p>${CHURCH}</p></div><div class="cr-prepared">Prepared ${e(n.asOf)}<br>Aggregate figures only</div></header>
    <p class="cr-lede">${n.lede}</p>
    ${n.sections.map(([eyebrow, body]) => `<section><div class="cr-eyebrow">${e(eyebrow)}</div><p>${body}</p></section>`).join('')}
    <table class="cr-table cr-nv-table"><thead><tr><th>Fund</th><th class="num">YTD</th><th class="num">Budget</th><th class="num">Variance</th><th class="num">${data.prior_year}</th></tr></thead>
      <tbody>${rows}${totalRow(g)}</tbody></table>
    <p class="cr-footnote">${n.footnote}</p>
  </article>`;
}

// Print adds one page listing the other categories fund by fund, so a packet written about one
// lens still accounts for the rest of the money.
function otherCategoriesSummary(data, lens) {
  const others = (data.fund_categories || []).filter((c) => c.key !== lens && data.categories?.[c.key]);
  if (!others.length) return '';
  return `<div class="panel panel-spaced cr-print-summary"><h2>Everything else — the other categories</h2>
    ${others.map((c) => {
    const cb = data.categories[c.key];
    const rows = groupByFundCode(cb.funds).map((g) => `<tr><td>${e(g.label)}</td>${moneyCell(g.actual)}${moneyCell(g.prior, true)}</tr>`).join('')
      || '<tr><td colspan="3" class="tone-muted">No funds in this category.</td></tr>';
    return `<h3>${e(cb.label)} — ${boardMoney(cb.given_ytd_cents)} YTD</h3><table class="pm-table cr-table"><thead><tr><th>Fund</th><th class="num">YTD</th><th class="num">${data.prior_year}</th></tr></thead><tbody>${rows}</tbody></table>`;
  }).join('')}</div>`;
}

// ── Analysis ─────────────────────────────────────────────────────────────────────────────────
// Connect's Giving Analysis: households grouped by full-year giving, and five years of giving
// beside the same totals restated in the last year's dollars (CPI-U). Both reports are totals
// only; no household is named or counted below its tier.

// Five years as grouped bars: actual dollars (navy) and inflation-adjusted (gold), in thousands.
export function multiyearChart(m) {
  const years = m.years || [];
  const maxCents = Math.max(0, ...years.map((r) => Math.max(r.total_cents || 0, r.adjusted_cents || 0)));
  const maxK = maxCents / 100000;
  const stepK = niceStepK(maxK);
  const axisMaxK = Math.max(stepK * 2, Math.ceil(maxK / stepK) * stepK);
  const baseline = 170;
  const span = 140;
  const h = (cents) => Math.max(0, ((cents || 0) / 100000 / axisMaxK) * span);
  let svg = `<svg viewBox="0 0 700 200" class="cr-chart" width="100%" role="img" aria-label="Giving by year, ${e(years[0]?.year ?? '')} to ${e(m.base_year ?? '')}, actual and in ${e(m.base_year ?? '')} dollars, in thousands of dollars">`;
  for (const val of [0, axisMaxK / 2, axisMaxK]) {
    const yy = baseline - (val / axisMaxK) * span;
    svg += `<line x1="40" y1="${yy.toFixed(1)}" x2="700" y2="${yy.toFixed(1)}" stroke="${val === 0 ? '#E3E6EC' : '#EEF0F4'}" stroke-width="1"/>`;
    svg += `<text x="34" y="${(yy + 3).toFixed(1)}" text-anchor="end" fill="#8A93A5" font-size="10">${Math.round(val).toLocaleString('en-US')}</text>`;
  }
  const x0 = 44;
  const pitch = (700 - x0 - 6) / Math.max(1, years.length);
  const barW = Math.min(46, pitch / 3);
  years.forEach((r, i) => {
    const gs = x0 + i * pitch + (pitch - (barW * 2 + 4)) / 2;
    [[r.total_cents, '#1B2A4A'], [r.adjusted_cents, '#C9973A']].forEach(([v, fill], bi) => {
      const bh = h(v);
      const x = gs + bi * (barW + 4);
      svg += `<rect x="${x.toFixed(1)}" y="${(baseline - bh).toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" fill="${fill}" rx="2"><title>${e(r.year)}${bi ? ` in ${e(m.base_year)} dollars` : ''}: ${boardMoney(v)}</title></rect>`;
      svg += `<text x="${(x + barW / 2).toFixed(1)}" y="${(baseline - bh - 4).toFixed(1)}" text-anchor="middle" fill="#5B6475" font-size="9">$${Math.round((v || 0) / 100000).toLocaleString('en-US')}k</text>`;
    });
    svg += `<text x="${(x0 + i * pitch + pitch / 2).toFixed(1)}" y="188" text-anchor="middle" fill="#5B6475" font-size="11">${e(r.year)}${r.cpi_estimated ? '*' : ''}</text>`;
  });
  return `${svg}</svg>`;
}

function analysisDistribution(dist) {
  if (!dist.ok) return `<div class="panel panel-spaced"><h2>Giving distribution</h2><p class="status status-error">The giving distribution could not be read from Connect: ${e(dist.message)} Nothing here is a real $0.</p></div>`;
  const d = dist.data || {};
  if (!d.givers) return `<div class="panel panel-spaced"><h2>Giving distribution</h2><div class="empty-note">No giving recorded for ${e(d.year ?? '')}.</div></div>`;
  const tiers = (d.tiers || []).filter((t) => t.givers > 0);
  const maxTotal = Math.max(1, ...tiers.map((t) => t.total_cents || 0));
  const rows = tiers.map((t) => `<tr><td>${e(t.label)}</td><td class="num">${Number(t.givers).toLocaleString('en-US')}</td><td class="num tone-muted">${e(t.givers_pct)}%</td><td class="num">${boardMoney(t.total_cents)}</td>
      <td class="cr-share"><i style="display:block;height:12px;background:#EEF0F4;border-radius:3px;overflow:hidden"><b style="display:block;height:12px;background:#2E7EA6;width:${Math.round(((t.total_cents || 0) / maxTotal) * 100)}%"></b></i><span>${e(t.total_pct)}% of total</span></td></tr>`).join('');
  return `<div class="panel panel-spaced cr-analysis-card"><h2>Giving distribution · ${e(d.year)}</h2>
    <p class="muted-line">Households grouped by their full-year giving. The <strong>median</strong> is the honest “typical” gift; a few large gifts pull the mean up. Anonymous gifts and organizations are left out.</p>
    <div class="cr-kpis">
      ${kpi('#2E7EA6', 'Giving households', Number(d.givers).toLocaleString('en-US'), `${e(d.year)}`)}
      ${kpi('#1B2A4A', 'Total', boardMoney(d.total_cents), 'Given by households')}
      ${kpi('#C9973A', 'Median gift / yr', boardMoney(d.median_cents), `The typical household · mean ${boardMoney(d.mean_cents)}`)}
      ${kpi('#6B8F71', 'Top 10% share', `${e(d.top10_share_pct)}%`, `${Number(d.top10_givers || 0).toLocaleString('en-US')} households`)}
    </div>
    <div class="table-scroll"><table class="pm-table cr-table"><thead><tr><th>Annual giving</th><th class="num">Households</th><th class="num">%</th><th class="num">Total</th><th>Share of total</th></tr></thead>
      <tbody>${rows}</tbody></table></div></div>`;
}

function analysisTrend(multi) {
  if (!multi.ok) return `<div class="panel panel-spaced"><h2>Five-year trend</h2><p class="status status-error">The five-year trend could not be read from Connect: ${e(multi.message)} Nothing here is a real $0.</p></div>`;
  const m = multi.data || {};
  const years = m.years || [];
  if (!years.length) return '<div class="panel panel-spaced"><h2>Five-year trend</h2><div class="empty-note">No giving recorded for these years.</div></div>';
  const estimated = years.some((r) => r.cpi_estimated);
  const rows = years.map((r) => `<tr><td>${e(r.year)}${r.cpi_estimated ? ' <span class="tone-muted">est.</span>' : ''}</td><td class="num">${Number(r.givers || 0).toLocaleString('en-US')}</td><td class="num">${boardMoney(r.total_cents)}</td><td class="num">${boardMoney(r.avg_giver_cents)}</td><td class="num tone-muted">${boardMoney(r.adjusted_cents)}</td></tr>`).join('');
  return `<div class="panel panel-spaced cr-analysis-card">
    <div class="cr-chart-head"><h2>Five-year trend · through ${e(m.base_year)}</h2>
      <span class="cr-legend"><i style="background:#1B2A4A"></i>Actual dollars <i style="background:#C9973A"></i>${e(m.base_year)} dollars (inflation-adjusted)</span></div>
    <p class="muted-line">Actual giving beside the same totals restated in ${e(m.base_year)} dollars (CPI-U). If the gold bars are flat while the navy bars rise, giving is only keeping pace with inflation. Thousands of dollars.</p>
    ${multiyearChart(m)}
    <div class="table-scroll"><table class="pm-table cr-table"><thead><tr><th>Year</th><th class="num">Givers</th><th class="num">Total</th><th class="num">Avg / giver</th><th class="num">In ${e(m.base_year)} $</th></tr></thead>
      <tbody>${rows}</tbody></table></div>
    ${estimated ? '<p class="muted-line">“est.” (and * on the chart) years use an estimated price index until the BLS annual average is published.</p>' : ''}
  </div>`;
}

// The related giving reports, all totals only, so the council may open each of them.
function analysisLinks(ctx) {
  const keep = ctx.council ? { council: '1' } : {};
  const link = (section, page, label, note, extra = {}) => `<li><a href="/?${new URLSearchParams({ section, page, ...extra, ...keep }).toString().replace(/&/g, '&amp;')}">${label}</a><span>${note}</span></li>`;
  return `<div class="panel panel-spaced cr-related"><h2>Related giving reports</h2><ul>
    ${link('giving-reports', 'distribution', 'Distribution', 'Tiers and median, by household or by person', { year: ctx.year })}
    ${link('giving-reports', 'funds-methods', 'By fund and method', 'Where gifts go and how they arrive')}
    ${link('giving-reports', 'attendance', 'Giving and attendance', 'Week by week, side by side')}
    ${link('giving-analytics', 'trends', 'Trends', 'Month by month, this year and last')}
    ${link('giving-analytics', 'year-over-year', 'Year over year', 'Each month against the same month last year')}
    ${link('giving-analytics', 'household-bands', 'Household bands', 'How many households give at each level')}
  </ul></div>`;
}

function analysis(results, ctx) {
  const [dist = { ok: false, message: 'not requested' }, multi = { ok: false, message: 'not requested' }] = results || [];
  return `${analysisDistribution(dist)}${analysisTrend(multi)}`;
}

function controls(data, ctx, periods, thisYear) {
  const tab = (mode, label) => (ctx.mode === mode ? `<span class="chip is-on">${label}</span>` : `<a class="chip" href="${href({ ...ctx, view: mode === 'dashboard' ? '' : mode, year: '' })}">${label}</a>`);
  const tabs = `<div class="chip-row">${tab('dashboard', 'Dashboard')}${tab('narrative', 'Narrative')}${tab('analysis', 'Analysis')}</div>`;
  if (ctx.mode === 'analysis') {
    return `<div class="cr-controls">
    ${tabs}
    <form method="GET" action="/" class="cr-picks">
      <input type="hidden" name="section" value="giving-analytics"><input type="hidden" name="page" value="council"><input type="hidden" name="view" value="analysis">
      ${ctx.council ? '<input type="hidden" name="council" value="1">' : ''}
      <label class="field"><span>Year</span><select name="year">${Array.from({ length: 7 }, (_, i) => thisYear - i).map((y) => `<option value="${y}"${String(y) === ctx.year ? ' selected' : ''}>${y}${y === thisYear ? ' (so far)' : ''}</option>`).join('')}</select></label>
      <button type="submit" class="button-outline">Show</button>
    </form>
  </div>`;
  }
  return `<div class="cr-controls">
    ${tabs}
    <form method="GET" action="/" class="cr-picks">
      <input type="hidden" name="section" value="giving-analytics"><input type="hidden" name="page" value="council">
      ${ctx.mode === 'narrative' ? '<input type="hidden" name="view" value="narrative">' : ''}
      ${ctx.council ? '<input type="hidden" name="council" value="1">' : ''}
      <label class="field"><span>Report on</span><select name="lens">${lensOptions(data).map((o) => `<option value="${e(o.key)}"${o.key === ctx.lens ? ' selected' : ''}>${e(o.label)}</option>`).join('')}</select></label>
      <label class="field"><span>Period</span><select name="period">${periods.map((p) => `<option value="${e(p.value)}"${p.value === ctx.period ? ' selected' : ''}>${e(p.label)}</option>`).join('')}</select></label>
      <button type="submit" class="button-outline">Show</button>
    </form>
  </div>`;
}

function elseStrip(data, ctx) {
  const chips = lensOptions(data).filter((c) => c.key !== ctx.lens && data.categories?.[c.key])
    .map((c) => `<a class="cr-else-chip" href="${href({ ...ctx, lens: c.key })}">${e(c.label)} <strong>${boardMoney(data.categories[c.key].given_ytd_cents)}</strong></a>`).join('');
  return chips ? `<div class="cr-else"><span>Everything else</span>${chips}<small>Choose a category to report on it.</small></div>` : '';
}

function emailForm(data, g, ctx) {
  return `<details class="panel panel-spaced edit-panel cr-email"><summary>Email packet</summary>
    <form method="POST" action="/api/v1/giving-board-email" class="form-grid facility-form">
      <input type="hidden" name="lens" value="${e(ctx.lens)}"><input type="hidden" name="period" value="${e(ctx.period)}"><input type="hidden" name="view" value="${e(ctx.mode)}">
      <label class="field field-wide"><span>Send to (one or more email addresses)</span><textarea name="to" rows="2" required placeholder="council@example.org, treasurer@example.org"></textarea></label>
      <label class="field field-wide"><span>Subject</span><input name="subject" maxlength="200" value="${e(`Giving Report to the Church Council — ${g.label}, ${data.period_label}`)}"></label>
      <label class="field field-wide"><span>Note at the top (optional)</span><textarea name="note" rows="3" maxlength="2000"></textarea></label>
      <div class="form-actions"><button type="submit">Send the report</button></div>
    </form>
    <p class="muted-line">Sends the written report (the Narrative) with the headline figures and fund table, from the church’s own address. Each address gets its own copy. Aggregate figures only; no donor is named.</p>
  </details>`;
}

export function renderCouncilReportPage({ result, analysisResults = null, params, today, status, canEmail = false, print = false, council = false }) {
  const { period, mode, lens, periods, year, thisYear } = councilParams(params, today);
  const ctx = { period, lens, mode, view: mode === 'dashboard' ? '' : mode, council: council ? '1' : '', year: mode === 'analysis' ? String(year) : '' };
  const banner = status ? `<p class="status${status.ok ? '' : ' status-error'}">${e(status.message)}</p>` : '';
  // Analysis reads its own two reports and not the board, so it is rendered before the board's
  // own failure check.
  if (mode === 'analysis') {
    const head = `<p class="lede">Giving analysis · ${year}${year === thisYear ? ' so far' : ''} · distribution and multi-year trends · no individual donors named</p>`;
    if (print) return `${head}${analysis(analysisResults, ctx)}`;
    return `${banner}${controls(null, ctx, periods, thisYear)}${head}${analysis(analysisResults, ctx)}${analysisLinks(ctx)}
    <p class="muted-line">Print prints the distribution and the five-year trend.</p>`;
  }
  if (!result.ok) return `${banner}<p class="status status-error">The council giving report could not be read from Connect: ${e(result.message)} Nothing here is a real $0.</p>`;
  const data = result.data;
  const g = lensBlock(data, lens);
  const head = `<p class="lede">${e(data.through_label)} · ${e(g.label)} only · no individual donors named</p>`;
  const body = (g.given_ytd_cents || 0) === 0
    ? `<div class="panel panel-spaced"><div class="empty-note">${g.fund_count === 0 ? `No funds are mapped to ${e(g.label)} yet. Give each fund a category in Connect’s Giving settings.` : `No ${e(g.label)} giving recorded for ${e(data.period_label)} yet.`}</div></div>`
    : mode === 'narrative' ? narrative(data, g, lens) : dashboard(data, g, ctx);
  if (print) return `${head}${body}${otherCategoriesSummary(data, lens)}`;
  return `${banner}${controls(data, ctx, periods, thisYear)}${head}${elseStrip(data, ctx)}${body}
    <p class="muted-line">Print prints this view plus a one-page summary of the other categories.</p>
    ${canEmail && (g.given_ytd_cents || 0) > 0 ? emailForm(data, g, ctx) : ''}`;
}

// The emailed packet: the narrative with inline styles (mail clients drop <style>), the four
// headline figures, and the fund table. No script, no images, no donor names.
export function renderCouncilEmailHtml(data, lens, { note = '' } = {}) {
  const g = lensBlock(data, lens);
  const n = narrativeParts(data, g, lens);
  const td = 'padding:6px 8px;border-bottom:1px solid #E3E6EC;';
  const num = `${td}text-align:right;`;
  const figure = (label, value, sub) => `<td style="padding:10px 12px;border:1px solid #E3E6EC;vertical-align:top;width:25%;"><div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#5B6475;">${e(label)}</div><div style="font-size:20px;font-weight:700;color:#1B2A4A;margin:4px 0;">${value}</div><div style="font-size:12px;color:#5B6475;">${sub}</div></td>`;
  const figures = `<table style="width:100%;border-collapse:collapse;margin:18px 0;"><tr>
    ${figure(`${g.label} YTD`, boardMoney(g.given_ytd_cents), g.given_ytd_prior_cents > 0 ? `${boardMoney(g.given_ytd_prior_cents)} at this point in ${data.prior_year}` : '')}
    ${figure('Vs. budget YTD', g.budget_variance_cents == null ? '—' : boardMoney(g.budget_variance_cents), g.budget_ytd_cents == null ? 'No budget set' : `against a ${boardMoney(g.budget_ytd_cents)} plan`)}
    ${figure('Year-end projection', boardMoney(g.projection_cents), g.annual_budget_cents ? `budget ${boardMoney(g.annual_budget_cents)}` : '')}
    ${figure(g.hh_label || 'Giving households', String(g.households || 0), `${boardMoney(g.avg_per_household_cents)} average`)}
  </tr></table>`;
  const cell = (v) => (v == null ? `<td style="${num}color:#8A93A5;">—</td>` : `<td style="${num}">${boardMoney(v)}</td>`);
  const vcell = (v) => (v == null ? `<td style="${num}color:#8A93A5;">—</td>` : `<td style="${num}color:${v < 0 ? '#B4412F' : '#2F7D5B'};">${signed(v)}</td>`);
  const rows = (g.key === 'all'
    ? (data.fund_categories || []).filter((c) => data.categories?.[c.key]).map((c) => {
      const cb = data.categories[c.key];
      return { label: cb.label, actual: cb.given_ytd_cents, budget: cb.budget_ytd_cents, variance: cb.budget_variance_cents, prior: cb.given_ytd_prior_cents };
    })
    : groupByFundCode(g.funds)).map((r) => `<tr><td style="${td}">${e(r.label)}</td>${cell(r.actual)}${cell(r.budget)}${vcell(r.variance)}${cell(r.prior)}</tr>`).join('');
  const th = 'padding:6px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#5B6475;border-bottom:2px solid #1B2A4A;';
  const table = `<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:18px;"><thead><tr><th style="${th}text-align:left;">${g.key === 'all' ? 'Category' : 'Fund'}</th><th style="${th}text-align:right;">YTD</th><th style="${th}text-align:right;">Budget</th><th style="${th}text-align:right;">Variance</th><th style="${th}text-align:right;">${data.prior_year}</th></tr></thead>
    <tbody>${rows}<tr><td style="${td}font-weight:700;">Total</td>${cell(g.given_ytd_cents).replace('">', ';font-weight:700;">')}${cell(g.budget_ytd_cents)}${vcell(g.budget_variance_cents)}${cell(g.given_ytd_prior_cents)}</tr></tbody></table>`;
  const noteHtml = note ? `<div style="background:#F7F4EC;border-left:3px solid #C9973A;padding:10px 14px;margin:0 0 18px;white-space:pre-wrap;">${e(note)}</div>` : '';
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#ffffff;font-family:Georgia,'Times New Roman',serif;color:#16213A;">
  <div style="max-width:680px;margin:0 auto;">
    ${noteHtml}
    <div style="border-bottom:2px solid #1B2A4A;padding-bottom:8px;"><div style="font-size:24px;font-weight:700;color:#1B2A4A;">Giving Report to the Church Council</div>
      <div style="font-size:13px;color:#5B6475;">${CHURCH} · ${e(g.label)} · Prepared ${e(n.asOf)} · Aggregate figures only</div></div>
    <p style="font-size:17px;line-height:1.55;margin:18px 0;">${n.lede}</p>
    ${figures}
    ${n.sections.map(([eyebrow, body]) => `<div style="margin:14px 0;"><div style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8A611C;">${e(eyebrow)}</div><p style="font-size:15px;line-height:1.6;margin:4px 0 0;">${body}</p></div>`).join('')}
    ${table}
    <p style="font-size:11px;color:#5B6475;line-height:1.6;border-top:1px solid #E3E6EC;margin-top:24px;padding-top:10px;">${n.footnote}</p>
  </div></body></html>`;
}

export const COUNCIL_REPORT_STYLES = `
    .cr-controls { display:flex; justify-content:space-between; align-items:flex-end; gap:12px; flex-wrap:wrap; margin-top:12px; }
    .cr-picks { display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap; }
    .cr-picks button { margin:0; }
    .cr-else { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:12px; padding:12px 16px; border:1px solid var(--line); border-radius:10px; background:#fff; }
    .cr-else > span { font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); margin-right:4px; }
    .cr-else-chip { padding:5px 12px; border:1px solid var(--line); border-radius:16px; font-size:13.5px; color:var(--ink); text-decoration:none; }
    .cr-else-chip:hover { border-color:var(--navy); }
    .cr-else small { color:var(--faint); margin-left:auto; }
    .cr-kpis { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-top:14px; }
    @media(max-width:900px){ .cr-kpis { grid-template-columns:1fr 1fr; } }
    @media(max-width:520px){ .cr-kpis { grid-template-columns:1fr; } }
    .cr-kpi { background:#fff; border:1px solid var(--line); border-top:4px solid; border-radius:10px; padding:14px 16px; }
    .cr-kpi small { display:block; font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); }
    .cr-kpi strong { display:block; font-size:28px; font-weight:600; color:var(--ink); margin:6px 0 4px; font-variant-numeric:tabular-nums; }
    .cr-kpi strong.tone-bad { color:#B85C3A; } .cr-kpi strong.tone-good { color:var(--green); } .cr-kpi strong.tone-muted { color:var(--faint); }
    .cr-kpi span { font-size:13px; color:var(--muted); }
    .cr-body { display:grid; grid-template-columns:minmax(0,1.6fr) minmax(0,1fr); gap:14px; margin-top:14px; }
    @media(max-width:900px){ .cr-body { grid-template-columns:1fr; } }
    .cr-chart-head { display:flex; justify-content:space-between; align-items:baseline; gap:10px; flex-wrap:wrap; }
    .cr-chart-head h2 { font-size:15px; letter-spacing:.04em; text-transform:uppercase; }
    .cr-legend { font-size:12px; color:var(--muted); display:flex; align-items:center; gap:5px; }
    .cr-legend i { display:inline-block; width:10px; height:10px; border-radius:2px; margin-left:8px; }
    .cr-chart { width:100%; height:auto; display:block; }
    .cr-navy { background:#233746; color:#fff; border-radius:10px; padding:20px 22px; }
    .cr-navy-label { font-size:12px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#E4B75B; margin-bottom:10px; }
    .cr-mix { margin-bottom:12px; }
    .cr-mix div { display:flex; justify-content:space-between; font-size:14px; font-variant-numeric:tabular-nums; }
    .cr-mix i { display:block; height:6px; margin-top:6px; background:rgba(255,255,255,.14); border-radius:3px; overflow:hidden; }
    .cr-mix b { display:block; height:100%; }
    .cr-navy-con { border-top:1px solid rgba(255,255,255,.16); margin-top:16px; padding-top:14px; }
    .cr-navy-con p { font-size:14px; line-height:1.55; color:rgba(255,255,255,.88); margin:0; }
    .cr-seg { display:flex; height:10px; border-radius:5px; overflow:hidden; margin-top:12px; }
    .cr-seg-labels { display:flex; justify-content:space-between; font-size:11px; color:rgba(255,255,255,.65); margin-top:5px; }
    .cr-table td.num, .cr-table th.num, .pm-table.cr-table td.num, .pm-table.cr-table th.num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
    .cr-table tr.cr-group td { font-weight:600; }
    .cr-table tr.cr-member td { font-size:13px; color:var(--muted); }
    .cr-table tr.cr-member td:first-child { padding-left:24px; }
    .cr-table tr.cr-total td { font-weight:700; border-top:1.5px solid var(--navy); }
    .cr-narrative { background:#fff; border:1px solid var(--line); border-radius:10px; padding:40px 56px; margin-top:14px; max-width:880px; }
    @media(max-width:700px){ .cr-narrative { padding:22px 18px; } }
    .cr-narrative header { display:flex; justify-content:space-between; align-items:flex-end; gap:12px; border-bottom:2px solid var(--navy); padding-bottom:10px; }
    .cr-narrative header h2 { font-size:28px; margin:0; color:var(--navy); }
    .cr-narrative header p { margin:4px 0 0; color:var(--muted); font-size:13px; }
    .cr-prepared { text-align:right; font-size:12px; color:var(--muted); line-height:1.5; }
    .cr-lede { font-size:20px; line-height:1.55; margin:24px 0; }
    .cr-narrative section { margin-top:16px; }
    .cr-eyebrow { font-size:12px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--gold-ink); }
    .cr-narrative section p { font-size:16px; line-height:1.65; margin:6px 0 0; }
    .cr-nv-table { width:100%; border-collapse:collapse; margin-top:24px; font-size:13.5px; }
    .cr-nv-table th { font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); border-bottom:1.5px solid var(--navy); padding:7px 8px; text-align:left; }
    .cr-nv-table td { padding:7px 8px; border-bottom:1px solid var(--line-soft); }
    .cr-footnote { margin-top:26px; padding-top:12px; border-top:1px solid var(--line); font-size:11.5px; color:var(--muted); line-height:1.6; }
    .cr-print-summary h3 { font-size:14px; margin:14px 0 6px; }
    .cr-email textarea { width:100%; }
    .cr-analysis-card .cr-kpis { margin:12px 0 14px; }
    .cr-share { min-width:180px; }
    .cr-share i { display:block; height:12px; background:#EEF0F4; border-radius:3px; overflow:hidden; }
    .cr-share b { display:block; height:100%; background:#2E7EA6; }
    .cr-share span { display:block; font-size:11.5px; color:var(--muted); margin-top:2px; }
    .cr-related ul { list-style:none; margin:8px 0 0; padding:0; display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:10px 18px; }
    .cr-related li a { font-weight:600; }
    .cr-related li span { display:block; font-size:13px; color:var(--muted); }
    @media print { .cr-print-summary { page-break-before:always; } .cr-navy, .cr-chart, .cr-share { -webkit-print-color-adjust:exact; print-color-adjust:exact; } .cr-analysis-card { page-break-inside:avoid; } }
`;
