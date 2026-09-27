// Server-rendered SVG charts for the Commercial Property pages. No client script: each mark carries
// a <title> so hovering shows its value, and every chart sits above the table that holds the same
// figures. Colors come from the shell palette, stepped to pass the dataviz validator (teal/gold as
// a two-series pair); a missing amount (null) is left out rather than drawn as $0.
import { escapeHtml as e } from './render-helpers.js';

export const CHART_COLORS = Object.freeze({ primary: '#1A78B5', secondary: '#B8862A', grid: '#E3E6EC', ink: '#16213A', muted: '#5B6475' });

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 'YYYY-MM' → 'Aug ’26'; anything else passes through (years, labels).
export function shortPeriod(period) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(period || ''));
  return m ? `${MONTHS[Number(m[2]) - 1]} ’${m[1].slice(2)}` : String(period ?? '');
}

const fullMoney = (c) => `${c < 0 ? '−' : ''}$${(Math.abs(c) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Axis labels: $0 · $2.5k · $10k · $1.2M.
export function axisMoney(c) {
  const d = Math.abs(c) / 100;
  const sign = c < 0 ? '−' : '';
  if (d >= 1e6) return `${sign}$${+(d / 1e6).toFixed(1)}M`;
  if (d >= 1e3) return `${sign}$${+(d / 1e3).toFixed(1)}k`;
  return `${sign}$${Math.round(d)}`;
}

// Round tick step (1/2/2.5/5 × 10^n) giving about four intervals over [min, max].
function niceScale(min, max) {
  const lo = Math.min(0, min);
  const hi = Math.max(0, max);
  const span = hi - lo || 1;
  const raw = span / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => s >= raw);
  const top = Math.ceil(hi / step) * step;
  const bottom = Math.floor(lo / step) * step;
  const ticks = [];
  for (let t = bottom; t <= top + step / 2; t += step) ticks.push(Math.round(t));
  return { top, bottom, ticks };
}

function legend(series) {
  if (series.length < 2) return '';
  return `<ul class="pc-legend">${series.map((s) => `<li><span class="pc-swatch" style="background:${s.color}"></span>${e(s.label)}</li>`).join('')}</ul>`;
}

const W = 640;
const PAD = { left: 56, right: 12, top: 14, bottom: 30 };

function frame({ height, scale, labels, bandW, x0 }) {
  const plotH = height - PAD.top - PAD.bottom;
  const y = (v) => PAD.top + (scale.top - v) / (scale.top - scale.bottom || 1) * plotH;
  const grid = scale.ticks.map((t) => `<line x1="${PAD.left}" x2="${W - PAD.right}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}" stroke="${t === 0 ? '#C9CED8' : CHART_COLORS.grid}" stroke-width="1"></line>
      <text x="${PAD.left - 8}" y="${(y(t) + 3.5).toFixed(1)}" text-anchor="end">${axisMoney(t)}</text>`).join('');
  // Thin the category labels so they never collide (about 52px each).
  const every = Math.max(1, Math.ceil(labels.length / Math.floor((W - PAD.left - PAD.right) / 52)));
  const xLabels = labels.map((l, i) => ((labels.length - 1 - i) % every === 0
    ? `<text x="${(x0(i) + bandW / 2).toFixed(1)}" y="${height - 10}" text-anchor="middle">${e(l)}</text>` : '')).join('');
  return { y, axes: `<g class="pc-axis">${grid}${xLabels}</g>` };
}

// A column rising (or falling) from the zero line with a 4px rounded data end, square at the base.
function column(x, w, yZero, yVal, color, tip) {
  const h = Math.abs(yZero - yVal);
  if (h < 0.5) return `<rect x="${x.toFixed(1)}" y="${(yZero - 0.5).toFixed(1)}" width="${w.toFixed(1)}" height="1" fill="${color}"><title>${e(tip)}</title></rect>`;
  const r = Math.min(4, w / 2, h);
  const up = yVal < yZero;
  const top = up ? yVal : yZero;
  const bot = up ? yZero : yVal;
  const d = up
    ? `M${x},${bot} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${bot} Z`
    : `M${x},${top} V${bot - r} Q${x},${bot} ${x + r},${bot} H${x + w - r} Q${x + w},${bot} ${x + w},${bot - r} V${top} Z`;
  return `<path d="${d.replace(/(\d+\.\d{2})\d+/g, '$1')}" fill="${color}"><title>${e(tip)}</title></path>`;
}

// Grouped columns. rows: [{ label, values: [cents|null per series] }]. `colorFor(value, seriesIndex)`
// can override a single-series chart's color for negative values (net income below zero).
export function renderColumnChart({ title, caption = '', series, rows, height = 220, colorFor = null }) {
  const values = rows.flatMap((r) => r.values).filter((v) => typeof v === 'number');
  if (!rows.length || !values.length) return '';
  const scale = niceScale(Math.min(...values), Math.max(...values));
  const plotW = W - PAD.left - PAD.right;
  const bandW = plotW / rows.length;
  const x0 = (i) => PAD.left + i * bandW;
  const { y, axes } = frame({ height, scale, labels: rows.map((r) => r.label), bandW, x0 });
  const n = series.length;
  const barW = Math.min(24, (bandW * 0.7 - (n - 1) * 2) / n);
  const groupW = n * barW + (n - 1) * 2;
  const marks = rows.map((r, i) => r.values.map((v, s) => {
    if (typeof v !== 'number') return '';
    const x = x0(i) + (bandW - groupW) / 2 + s * (barW + 2);
    const color = colorFor ? colorFor(v, s) : series[s].color;
    return column(x, barW, y(0), y(v), color, `${r.label} · ${series[s].label}: ${fullMoney(v)}`);
  }).join('')).join('');
  const aria = `${title}. ${rows.map((r) => `${r.label}: ${r.values.map((v, s) => `${series[s].label} ${typeof v === 'number' ? fullMoney(v) : 'not recorded'}`).join(', ')}`).join('; ')}`;
  return `<figure class="pc-chart"><figcaption><b>${e(title)}</b>${caption ? `<span>${caption}</span>` : ''}</figcaption>${legend(series)}
    <svg viewBox="0 0 ${W} ${height}" width="100%" role="img" aria-label="${e(aria)}">${axes}${marks}</svg></figure>`;
}

// Lines over the same money axis. rows: [{ label, values: [cents|null per series] }]; a series can
// set `dashed: true` (a target) and `area: true` (a 10% wash under the line).
export function renderLineChart({ title, caption = '', series, rows, height = 220 }) {
  const values = rows.flatMap((r) => r.values).filter((v) => typeof v === 'number');
  if (rows.length < 2 || !values.length) return '';
  const scale = niceScale(Math.min(...values), Math.max(...values));
  const plotW = W - PAD.left - PAD.right;
  const bandW = plotW / rows.length;
  const x0 = (i) => PAD.left + i * bandW;
  const cx = (i) => x0(i) + bandW / 2;
  const { y, axes } = frame({ height, scale, labels: rows.map((r) => r.label), bandW, x0 });
  const lines = series.map((s, si) => {
    const pts = rows.map((r, i) => (typeof r.values[si] === 'number' ? [cx(i), y(r.values[si]), r] : null)).filter(Boolean);
    if (!pts.length) return '';
    const path = pts.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
    const area = s.area && pts.length > 1 ? `<polygon points="${path} ${pts.at(-1)[0].toFixed(1)},${y(0).toFixed(1)} ${pts[0][0].toFixed(1)},${y(0).toFixed(1)}" fill="${s.color}" fill-opacity="0.1"></polygon>` : '';
    const last = pts.at(-1);
    const dots = pts.map(([px, py, r]) => `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="9" fill="transparent"><title>${e(`${r.label} · ${s.label}: ${fullMoney(r.values[si])}`)}</title></circle>`).join('');
    return `${area}<polyline points="${path}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"${s.dashed ? ' stroke-dasharray="6 5"' : ''}></polyline>
      ${s.dashed ? '' : `<circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="4" fill="${s.color}" stroke="#FFFFFF" stroke-width="2"></circle>`}${dots}`;
  }).join('');
  const aria = `${title}. ${rows.map((r) => `${r.label}: ${r.values.map((v, s) => `${series[s].label} ${typeof v === 'number' ? fullMoney(v) : 'not recorded'}`).join(', ')}`).join('; ')}`;
  return `<figure class="pc-chart"><figcaption><b>${e(title)}</b>${caption ? `<span>${caption}</span>` : ''}</figcaption>${legend(series)}
    <svg viewBox="0 0 ${W} ${height}" width="100%" role="img" aria-label="${e(aria)}">${axes}${lines}</svg></figure>`;
}

// A walk from a starting amount through additions and subtractions to a result: steps are
// [{ label, cents }], the first is the starting total and the result is drawn as a total bar.
export function renderWaterfallChart({ title, caption = '', steps, totalLabel, height = 240 }) {
  if (!steps.length) return '';
  const bars = [];
  let run = 0;
  steps.forEach((s, i) => {
    const from = i === 0 ? 0 : run;
    run = i === 0 ? s.cents : run + s.cents;
    bars.push({ label: s.label, from, to: run, cents: s.cents, total: i === 0 });
  });
  bars.push({ label: totalLabel, from: 0, to: run, cents: run, total: true });
  const all = bars.flatMap((b) => [b.from, b.to]);
  const scale = niceScale(Math.min(...all), Math.max(...all));
  const plotW = W - PAD.left - PAD.right;
  const bandW = plotW / bars.length;
  const x0 = (i) => PAD.left + i * bandW;
  const { y, axes } = frame({ height, scale, labels: bars.map((b) => b.label), bandW, x0 });
  const barW = Math.min(40, bandW * 0.6);
  const marks = bars.map((b, i) => {
    const x = x0(i) + (bandW - barW) / 2;
    const top = Math.min(y(b.from), y(b.to));
    const h = Math.max(1, Math.abs(y(b.from) - y(b.to)));
    const color = b.total ? CHART_COLORS.primary : (b.cents < 0 ? CHART_COLORS.secondary : CHART_COLORS.primary);
    const opacity = b.total ? '' : ' fill-opacity="0.55"';
    const tip = `${b.label}: ${b.total ? fullMoney(b.to) : `${b.cents < 0 ? '' : '+'}${fullMoney(b.cents)}`}`;
    const value = `<text class="pc-value" x="${(x + barW / 2).toFixed(1)}" y="${(b.to >= b.from ? top - 5 : top + h + 12).toFixed(1)}" text-anchor="middle">${axisMoney(b.total ? b.to : b.cents)}</text>`;
    const joiner = i < bars.length - 1 ? `<line x1="${(x + barW).toFixed(1)}" x2="${(x0(i + 1) + (bandW - barW) / 2).toFixed(1)}" y1="${y(b.to).toFixed(1)}" y2="${y(b.to).toFixed(1)}" stroke="#9AA3B2" stroke-width="1"></line>` : '';
    return `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${color}"${opacity}><title>${e(tip)}</title></rect>${value}${joiner}`;
  }).join('');
  const aria = `${title}. ${bars.map((b) => `${b.label} ${b.total ? fullMoney(b.to) : fullMoney(b.cents)}`).join('; ')}`;
  return `<figure class="pc-chart"><figcaption><b>${e(title)}</b>${caption ? `<span>${caption}</span>` : ''}</figcaption>
    <svg viewBox="0 0 ${W} ${height}" width="100%" role="img" aria-label="${e(aria)}">${axes}${marks}</svg></figure>`;
}

// Revenue vs expenses, then net income on its own axis (never a second y-scale on one chart).
export function renderOperatingCharts(rows, { limit = 12 } = {}) {
  const recent = [...rows].sort((a, b) => (a.period < b.period ? -1 : 1)).slice(-limit);
  if (!recent.length) return '';
  const span = recent.length > 1 ? `${shortPeriod(recent[0].period)} – ${shortPeriod(recent.at(-1).period)}` : shortPeriod(recent[0].period);
  const money = renderColumnChart({
    title: 'Revenue and expenses by month',
    caption: span,
    series: [{ label: 'Revenue', color: CHART_COLORS.primary }, { label: 'Expenses', color: CHART_COLORS.secondary }],
    rows: recent.map((r) => ({ label: shortPeriod(r.period), values: [r.total_revenue_cents ?? null, r.total_expenses_cents ?? null] })),
  });
  const net = renderColumnChart({
    title: 'Net income by month',
    caption: 'Below the line is a month that cost more than it brought in',
    series: [{ label: 'Net income', color: CHART_COLORS.primary }],
    rows: recent.map((r) => ({ label: shortPeriod(r.period), values: [r.net_income_cents ?? null] })),
    colorFor: (v) => (v < 0 ? CHART_COLORS.secondary : CHART_COLORS.primary),
    height: 180,
  });
  return `<div class="pc-grid">${money}${net}</div>`;
}

// Totals by calendar year from a ledger with entry_date 'YYYY[-MM[-DD]]'.
export function renderLedgerByYearChart(entries, title) {
  const byYear = new Map();
  for (const row of entries || []) {
    const year = String(row.entry_date || '').slice(0, 4);
    if (!/^\d{4}$/.test(year) || typeof row.amount_cents !== 'number') continue;
    byYear.set(year, (byYear.get(year) || 0) + row.amount_cents);
  }
  const years = [...byYear.keys()].sort();
  if (!years.length) return '';
  return renderColumnChart({
    title,
    caption: years.length > 1 ? `${years[0]} – ${years.at(-1)}` : years[0],
    series: [{ label: 'Spent', color: CHART_COLORS.primary }],
    rows: years.map((y) => ({ label: y, values: [byYear.get(y)] })),
    height: 180,
  });
}

export const PROPERTY_CHART_STYLES = `
    .pc-grid { display:grid; grid-template-columns:minmax(0,1fr); gap:16px; margin:14px 0 18px; }
    .pc-chart { margin:14px 0 18px; padding:14px 16px 8px; background:var(--card,#fff); border:1px solid var(--line,#E3E6EC); border-radius:12px; min-width:0; overflow-x:auto; }
    .pc-grid .pc-chart { margin:0; }
    .pc-chart figcaption { display:flex; flex-direction:column; gap:2px; margin-bottom:6px; }
    .pc-chart figcaption b { font-size:15px; color:var(--ink,#16213A); }
    .pc-chart figcaption span { font-size:12.5px; color:var(--muted,#5B6475); }
    .pc-chart svg { display:block; overflow:visible; min-width:520px; }
    .pc-axis text, .pc-value { font-size:10.5px; fill:var(--muted,#5B6475); font-variant-numeric:tabular-nums; }
    .pc-value { font-weight:700; fill:var(--ink,#16213A); }
    .pc-legend { list-style:none; display:flex; gap:16px; margin:0 0 4px; padding:0; font-size:12.5px; color:var(--ink,#16213A); }
    .pc-legend li { display:flex; align-items:center; gap:6px; }
    .pc-swatch { width:10px; height:10px; border-radius:2px; display:inline-block; }
`;
