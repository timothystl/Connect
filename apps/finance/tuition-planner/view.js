// The planner's pages, drawn in Finance's own style (cards, tables and gauges from the Finance
// shell). Every figure comes from model.js. Controls carry data-act (click), data-input (typing)
// or data-change (committed change) and are handled in main.js; the page runs no inline script.
import { CONFIG_FIELDS, GRADE_SEQ, displayFamPct, schoolYearLabel } from './model.js';
import { S, canEdit } from './state.js';

export function esc(v) {
  return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
const dollars = (n) => `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`;
const money = (d) => `${d < 0 ? '−' : ''}$${(Math.abs(Math.round(d * 100)) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;
const btn = (act, label, data = {}, cls = 'tp-btn') => `<button type="button" class="${cls}" data-act="${act}"${Object.entries(data).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('')}>${label}</button>`;
const disabled = () => (canEdit() ? '' : ' disabled');

// ── Shared pieces ────────────────────────────────────────────────────────
function gauge({ fill, over, text, caption, note }) {
  return `<div class="tp-gauge"><div class="tp-gauge-track"><div class="tp-gauge-fill${over ? ' is-over' : ''}" style="width:${Math.max(0, Math.min(100, fill)).toFixed(1)}%"></div></div>
    <div class="tp-gauge-label"><b class="${over ? 'tp-over' : ''}">${esc(text)}</b><span>${esc(caption)}</span></div>
    ${note ? `<div class="tp-note">${esc(note)}</div>` : ''}</div>`;
}
const pipelineNote = (total, count) => (count ? `+ ${money(total)} planned for ${plural(count, 'pipeline student')} not yet enrolled (not counted above)` : '');

function sortHead(table, col, label, sort, align = '') {
  const mark = sort.col === col ? (sort.dir === 1 ? ' ▲' : ' ▼') : '';
  return `<th class="${align}"><button type="button" class="tp-sort" data-act="sort" data-table="${table}" data-col="${col}">${label}${mark}</button></th>`;
}
function sortRows(rows, sort, keyFn) {
  const cmp = (a, b) => ((typeof a === 'string' || typeof b === 'string') ? String(a).toLowerCase().localeCompare(String(b).toLowerCase()) : (a || 0) - (b || 0));
  return rows.map((r) => ({ r, k: keyFn(r, sort.col) })).sort((a, b) => cmp(a.k, b.k) * sort.dir).map((x) => x.r);
}

function statusLine() {
  if (S.saveError) return `<p class="status status-error" role="alert">${esc(S.saveError)} The planner was reloaded to show what is stored.</p>`;
  return '';
}

export function saveIndicator() {
  if (S.saveError) return '<span class="tp-save is-error">Not saved</span>';
  if (S.saving || S.saveMessage === 'Saving…') return '<span class="tp-save">Saving…</span>';
  return S.saveMessage ? `<span class="tp-save is-ok">${esc(S.saveMessage)}</span>` : '';
}

// ── Overview ─────────────────────────────────────────────────────────────
function barLine(labels, bars, line, { sameScale, barLabel, lineLabel, money: isMoney, lineSuffix = '' }) {
  const W = 560; const H = 220; const PAD = 34;
  const maxBar = Math.max(...bars, 1);
  const maxLine = Math.max(...line, 1);
  const maxAll = Math.max(...bars, ...line, 1);
  const n = labels.length || 1; const stepX = (W - PAD * 2) / n; const barW = stepX * 0.5;
  let svg = '';
  bars.forEach((v, i) => {
    const h = (v / (sameScale ? maxAll : maxBar)) * (H - PAD * 2);
    const over = sameScale && line[i] != null && v > line[i];
    svg += `<rect x="${(PAD + i * stepX + (stepX - barW) / 2).toFixed(1)}" y="${(H - PAD - h).toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="2" class="${over ? 'tp-bar-over' : 'tp-bar'}"><title>${esc(labels[i])}: ${dollars(v)}</title></rect>`;
  });
  const pts = line.map((v, i) => ({ x: PAD + i * stepX + stepX / 2, y: H - PAD - (v / (sameScale ? maxAll : maxLine)) * (H - PAD * 2), v }));
  svg += `<polyline points="${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}" class="tp-line${sameScale ? ' is-dashed' : ''}"/>`;
  svg += pts.map((p, i) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" class="tp-dot"><title>${esc(labels[i])}: ${isMoney ? dollars(p.v) : `${p.v.toFixed(1)}${lineSuffix}`}</title></circle>`).join('');
  svg += labels.map((l, i) => `<text x="${(PAD + i * stepX + stepX / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" class="tp-axis">${esc(l)}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="tp-chart" role="img" aria-label="${esc(barLabel)} and ${esc(lineLabel)}">${svg}</svg>
    <div class="tp-legend"><span><i class="tp-key tp-key-bar"></i>${esc(barLabel)}</span><span><i class="tp-key tp-key-line"></i>${esc(lineLabel)}</span></div>`;
}

function donut(items) {
  const total = items.reduce((s, x) => s + x.value, 0);
  if (!(total > 0)) return '<p class="muted">No data.</p>';
  let angle = -Math.PI / 2;
  const R = 80; const r = 48; const C = 100;
  const arcs = items.filter((x) => x.value > 0).map((x) => {
    const a = (x.value / total) * Math.PI * 2;
    const large = a > Math.PI ? 1 : 0;
    const p = (rad, radius) => `${(C + radius * Math.cos(rad)).toFixed(2)},${(C + radius * Math.sin(rad)).toFixed(2)}`;
    const end = angle + Math.min(a, Math.PI * 2 - 0.0001);
    const d = `M${p(angle, R)} A${R},${R} 0 ${large} 1 ${p(end, R)} L${p(end, r)} A${r},${r} 0 ${large} 0 ${p(angle, r)} Z`;
    angle = end;
    return `<path d="${d}" class="${x.cls}"><title>${esc(x.label)}: ${dollars(x.value)}</title></path>`;
  }).join('');
  return `<div class="tp-donut"><svg viewBox="0 0 200 200" role="img" aria-label="Aid composition">${arcs}</svg>
    <ul>${items.map((x) => `<li><i class="tp-key ${x.cls}"></i>${esc(x.label)}<b>${dollars(x.value)}</b><small>${Math.round((x.value / total) * 100)}%</small></li>`).join('')}</ul></div>`;
}

function enrollChart(rows) {
  const W = 560; const H = 220; const PAD = 34;
  const max = Math.max(...rows.map((r) => r.k8Count + r.lhsCount), 1);
  const stepX = (W - PAD * 2) / rows.length; const barW = stepX * 0.5;
  const svg = rows.map((r, i) => {
    const x = PAD + i * stepX + (stepX - barW) / 2;
    const h1 = (r.k8Count / max) * (H - PAD * 2); const h2 = (r.lhsCount / max) * (H - PAD * 2);
    const y1 = H - PAD - h1;
    return `<rect x="${x.toFixed(1)}" y="${y1.toFixed(1)}" width="${barW.toFixed(1)}" height="${h1.toFixed(1)}" class="tp-seg-k8"><title>${esc(r.label)} Timothy K-8: ${r.k8Count}</title></rect>`
      + `<rect x="${x.toFixed(1)}" y="${(y1 - h2).toFixed(1)}" width="${barW.toFixed(1)}" height="${h2.toFixed(1)}" class="tp-seg-lhs"><title>${esc(r.label)} LHS: ${r.lhsCount}</title></rect>`
      + `<text x="${(x + barW / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" class="tp-axis">${esc(r.label)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="tp-chart" role="img" aria-label="Enrollment by year">${svg}</svg>
    <div class="tp-legend"><span><i class="tp-key tp-seg-k8"></i>Timothy K-8</span><span><i class="tp-key tp-seg-lhs"></i>Lutheran High South</span></div>`;
}

export function renderOverview(M) {
  const k = M.kpis();
  const cards = [
    ['Students supported', String(k.k8Count + k.lhsCount), 'K-8 and LHS combined'],
    ['K-8 tuition billed', dollars(k.k8Count * k.tuition0), `${plural(k.k8Count, 'student')} · ${dollars(k.tuition0)} each`],
    ['Timothy (WOL) award', dollars(k.totalTimothy), 'Partnership and Access grants'],
    ['Family portion', dollars(k.totalFamily), 'What parents owe'],
    ['LHSA aid', dollars(k.totalLhs), plural(k.lhsCount, 'student')],
    ['WOL budget remaining', dollars(k.k8Budget - k.totalTimothy), `${dollars(k.k8Budget)} annual budget`],
  ];
  const p = M.pathway();
  const flags = [];
  if (p.grads.length) flags.push(['→ LHS', `${plural(p.grads.length, 'eighth-grader')} graduate Timothy and enter LHS 9th grade next year`, p.grads.map((x) => x.s.child).join(', ')]);
  if (p.pk4.length) flags.push(['New', `${plural(p.pk4.length, 'PK4 student')} enter Kindergarten (aid begins) next year`, p.pk4.map((x) => x.s.child).join(', ')]);
  if (p.soonPipeline.length) flags.push(['Future', `${plural(p.soonPipeline.length, 'known future entrant')} expected within 2 years`, p.soonPipeline.map((s) => `${s.child} (b. ${s.birthYear})`).join(', ')]);
  const proj = M.projection();
  const detail = M.enrolledActiveForYear(0).filter((x) => x.bucket === 'K8' && x.grade !== 'PK 3' && x.grade !== 'PK 4');
  return `<div class="grid tp-kpis">${cards.map(([label, value, note], i) => `<div class="card${i === 0 ? ' tp-accent' : ''}"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(note)}</span></div>`).join('')}</div>
    <p class="tp-caption">Headline figures are for the current school year, ${esc(M.yearLabel(0))}.${M.moved ? ` Records are kept in Finance’s database${M.moved.movedAt ? `, moved from Connect on ${esc(M.moved.movedAt)} and checked row for row` : ''}.` : ''}</p>
    <section class="tp-card">
      <h2>The pathway, where this year’s students stand</h2>
      <p class="muted">PK4 → Kindergarten (aid begins) → grades 1–8 at Timothy → Lutheran High School South, grades 9–12</p>
      <ol class="tp-path">${p.stages.map((s) => `<li class="${s.hot ? 'is-hot' : ''}"><b>${s.count}</b><span>${esc(s.label)}</span></li>`).join('')}</ol>
      <div class="tp-flags">${flags.length ? flags.map(([k2, text, names]) => `<span class="tp-flag" title="${esc(names)}"><b>${esc(k2)}:</b> ${esc(text)}</span>`).join('') : '<span class="muted">No transitions flagged.</span>'}</div>
    </section>
    <div class="tp-grid2">
      <section class="tp-card"><h2>Tuition rate and family share by year</h2>${M.history.length ? barLine(M.history.map((h) => h.school_year), M.history.map((h) => h.tuition_cents / 100), M.history.map((h) => h.family_pct), { barLabel: 'Tuition per student', lineLabel: '% the family pays', lineSuffix: '%' }) : '<p class="muted">No history data.</p>'}</section>
      <section class="tp-card"><h2>Aid composition, current year</h2>${donut([
        { label: 'Timothy award (WOL)', value: k.totalTimothy, cls: 'tp-c1' },
        { label: 'Outside aid (scholarships, etc.)', value: k.totalOutside, cls: 'tp-c2' },
        { label: 'Family portion', value: k.totalFamily, cls: 'tp-c3' },
      ])}</section>
      <section class="tp-card"><h2>Budget projection</h2>${barLine(proj.map((x) => x.label), proj.map((x) => x.need), proj.map((x) => x.budget), { sameScale: true, money: true, barLabel: 'Projected aid need (baseline)', lineLabel: 'Budget available' })}
        <p class="tp-caption">Baseline: each family’s original share and this year’s outside aid, with pipeline children counted in the year they reach school. A red bar is a year the need exceeds the budget.</p></section>
      <section class="tp-card"><h2>Enrollment mix by year</h2>${enrollChart(proj)}</section>
    </div>
    <div class="section-heading"><div><p class="eyebrow">Current year</p><h2>K-8 family detail</h2></div></div>
    <div class="table-wrap"><table class="tp-table"><thead><tr><th>Family</th><th>Child</th><th>Grade</th><th class="num">Outside aid</th><th class="num">Timothy award</th><th class="num">Family owes</th><th>Linked person</th></tr></thead>
    <tbody>${detail.length ? detail.map((x) => {
      const sp = M.splitFor(x.s, 0);
      return `<tr><td>${esc(x.s.family)}</td><td>${esc(x.s.child)}</td><td>${esc(x.grade)}</td><td class="num">${money(x.s.outsideAid)}</td><td class="num">${money(sp.timothyAward)}</td><td class="num">${money(sp.familyOwed)}</td><td>${x.s.personId ? '<span class="tp-ok">✓ linked</span>' : '<span class="muted">not linked</span>'}</td></tr>`;
    }).join('') : '<tr><td colspan="7" class="muted">No K-8 students.</td></tr>'}</tbody></table></div>`;
}

// ── Planner (current and future years) ───────────────────────────────────
function yearSelect(name, offsets, selected, M) {
  return `<label class="tp-inline">School year <select id="tp-${name}" data-change="${name}">${offsets.map((o) => `<option value="${o}"${o === selected ? ' selected' : ''}>${esc(M.yearLabel(o))}${o === 0 ? ' (current)' : o < 0 ? ' (past)' : ''}</option>`).join('')}</select></label>`;
}

function yearRateBox(M, year) {
  const label = M.yearLabel(year);
  const onFile = M.yearRates[label] != null;
  return `<div class="tp-inline"><label for="tp-year-rate">Tuition for ${esc(label)}</label> $<input id="tp-year-rate" type="number" min="0" step="1" value="${Math.round(M.tuitionForYear(year))}"${disabled()}>
    ${canEdit() ? btn('saveYearRate', 'Save', {}, 'tp-btn') : ''}
    <small class="muted">${onFile ? 'Actual figure on file.' : `Projected from ${M.cfgNum('tuition_growth_pct', 6)}%/yr growth; not yet finalized.`}</small></div>`;
}

function pipelineBox(M) {
  const pipe = M.roster.filter((s) => s.isPipeline);
  const base = M.baseYear();
  const chips = pipe.length ? pipe.map((s) => {
    const grade0 = M.gradeAt(s, 0);
    const caption = s.baseGrade ? `grade ${s.baseGrade} now` : `K expected ${schoolYearLabel(s.birthYear + 5)}`;
    return `<li><span>${esc(s.family)} ${esc(s.child)} <small>(b. ${esc(s.birthYear)}, ${esc(caption)})</small></span>
      ${canEdit() && grade0 !== null && grade0 !== 'Graduated' ? btn('enroll', '✓ Enroll', { id: s.id }, 'tp-link') : ''}
      ${canEdit() ? btn('remove', 'Remove', { id: s.id }, 'tp-link tp-danger') : ''}</li>`;
  }).join('') : '<li class="muted">No future entrants added yet.</li>';
  const form = canEdit() ? `<div class="tp-form-row">
      <input id="tp-pipe-family" type="text" placeholder="Family name" aria-label="Family name">
      <input id="tp-pipe-child" type="text" placeholder="Child’s name" aria-label="Child’s name">
      <input id="tp-pipe-birth" type="number" placeholder="Birth year" min="${base - 6}" max="${base + 1}" aria-label="Birth year">
      <select id="tp-pipe-grade" aria-label="Grade" title="Only needed when the birth year alone would guess wrong"><option value="">Grade (by birth year)</option>${['PK 3', 'PK 4', 'K', '1', '2', '3', '4', '5', '6', '7', '8'].map((g) => `<option value="${g}">${g}</option>`).join('')}</select>
      ${btn('addPipeline', 'Add to pipeline')}</div>` : '';
  return `<div class="tp-pipeline"><h3>Kids in the pipeline <small>not yet enrolled, tracked by birth year</small></h3><ul>${chips}</ul>${form}</div>`;
}

function k8Table(M, year, rows, over) {
  const tuition = M.tuitionForYear(year);
  const keyFn = (row, col) => {
    if (col === 'family') return row.s.family;
    if (col === 'child') return row.s.child;
    if (col === 'grade') return GRADE_SEQ.indexOf(row.grade);
    if (col === 'outside') return row.outsideAidVal;
    if (col === 'pct') return displayFamPct(row.famPctVal, row.sp, tuition);
    if (col === 'timothy') return row.sp.timothyAward;
    if (col === 'family_owes') return row.sp.familyOwed;
    return '';
  };
  const sorted = sortRows(rows, S.k8Sort, keyFn);
  const body = sorted.map((row) => {
    const { s } = row;
    const id = s.id;
    const pct = displayFamPct(row.famPctVal, row.sp, tuition);
    const grade0 = row.preview ? M.gradeAt(s, 0) : null;
    const actions = [
      row.preview && canEdit() && grade0 !== null && grade0 !== 'Graduated' ? btn('enroll', 'Enroll', { id }, 'tp-link') : '',
      btn('history', 'History', { id }, 'tp-link'),
      !s.personId && canEdit() ? btn('openLink', 'Link', { id }, 'tp-link') : '',
      canEdit() ? btn('remove', 'Remove', { id }, 'tp-link tp-danger') : '',
    ].join(' ');
    return `<tr${row.preview ? ' class="tp-preview"' : ''}>
      <td>${esc(s.family)}</td><td>${esc(s.child)}</td>
      <td>${esc(row.grade)}${row.preview ? ' <span class="tp-pill" title="Projected from the birth year or an entered grade; not yet enrolled">pipeline</span>' : ''}</td>
      <td class="num">${money(tuition)}</td>
      <td class="num"><input id="tp-oa-${id}" class="tp-num" type="number" min="0" step="1" value="${Math.round(row.outsideAidVal)}" data-change="outsideAid" data-id="${id}" aria-label="Outside aid for ${esc(s.child)}"${disabled()}></td>
      <td class="tp-pct-cell"><span class="tp-nowrap"><input id="tp-pct-${id}" class="tp-num tp-pct${over ? ' is-over' : ''}" type="number" min="0" max="100" step="1" value="${pct}" data-input="famPct" data-id="${id}" aria-label="Family share for ${esc(s.child)}"${disabled()}> %</span></td>
      <td class="num"><input id="tp-aw-${id}" class="tp-num" type="number" min="0" step="1" value="${Math.round(row.sp.timothyAward)}" data-change="timothyAward" data-id="${id}" aria-label="Timothy award for ${esc(s.child)}"${disabled()}>${row.isOverridden && canEdit() ? ` ${btn('clearOverride', '↺ auto', { id }, 'tp-link')}` : ''}</td>
      <td class="num">${money(row.sp.familyOwed)}${!row.preview && row.grade === '8' ? `<label class="tp-check"><input type="checkbox" data-change="attendsLhs" data-id="${id}"${s.attendsLHS ? ' checked' : ''}${disabled()}> Plans to attend LHS</label>` : ''}</td>
      <td class="tp-actions">${actions}</td></tr>`;
  }).join('');
  return `<div class="table-wrap"><table class="tp-table"><thead><tr>
    ${sortHead('k8', 'family', 'Family', S.k8Sort)}${sortHead('k8', 'child', 'Child', S.k8Sort)}${sortHead('k8', 'grade', 'Grade', S.k8Sort)}
    <th class="num">Tuition</th>${sortHead('k8', 'outside', 'Outside aid', S.k8Sort, 'num')}${sortHead('k8', 'pct', 'Family share of the bill', S.k8Sort)}
    ${sortHead('k8', 'timothy', 'Timothy award', S.k8Sort, 'num')}${sortHead('k8', 'family_owes', 'Family owes', S.k8Sort, 'num')}<th></th></tr></thead>
    <tbody>${body || '<tr><td colspan="9" class="muted">No K-8 students this year.</td></tr>'}</tbody></table></div>`;
}

function lhsTable(M, year, rows, over) {
  const maxAward = M.cfgNum('lhs_max_award_cents', 250000) / 100;
  const keyFn = (row, col) => (col === 'family' ? row.s.family : col === 'child' ? row.s.child : col === 'grade' ? GRADE_SEQ.indexOf(row.grade) : col === 'award' ? row.lhsVal : '');
  const body = sortRows(rows, S.lhsSort, keyFn).map((row) => {
    const { s } = row;
    const id = s.id;
    const grade0 = row.preview ? M.gradeAt(s, 0) : null;
    const actions = [
      row.preview && canEdit() && grade0 !== null && grade0 !== 'Graduated' ? btn('enroll', 'Enroll', { id }, 'tp-link') : '',
      btn('history', 'History', { id }, 'tp-link'),
      !s.personId && canEdit() ? btn('openLink', 'Link', { id }, 'tp-link') : '',
      canEdit() ? btn('remove', 'Remove', { id }, 'tp-link tp-danger') : '',
    ].join(' ');
    return `<tr${row.preview ? ' class="tp-preview"' : ''}><td>${esc(s.family)}</td><td>${esc(s.child)}</td>
      <td>${esc(row.grade)}${row.preview ? ' <span class="tp-pill">pipeline</span>' : ''}${!row.preview && row.justGraduated ? ' <span class="tp-pill is-new">new to LHS</span>' : ''}</td>
      <td><div class="tp-range"><input id="tp-lr-${id}" type="range" class="${over ? 'is-over' : ''}" min="0" max="${maxAward}" step="25" value="${row.lhsVal}" data-input="lhsAward" data-id="${id}" aria-label="LHS award for ${esc(s.child)}"${disabled()}>
        <input id="tp-ln-${id}" class="tp-num" type="number" min="0" max="${maxAward}" step="25" value="${row.lhsVal}" data-input="lhsAward" data-id="${id}" aria-label="LHS award for ${esc(s.child)} in dollars"${disabled()}></div></td>
      <td class="num">${money(row.lhsVal)}</td><td class="tp-actions">${actions}</td></tr>`;
  }).join('');
  return `<div class="table-wrap"><table class="tp-table"><thead><tr>${sortHead('lhs', 'family', 'Family', S.lhsSort)}${sortHead('lhs', 'child', 'Child', S.lhsSort)}${sortHead('lhs', 'grade', 'Grade', S.lhsSort)}
    <th>LHSA award</th>${sortHead('lhs', 'award', 'Award', S.lhsSort, 'num')}<th></th></tr></thead>
    <tbody>${body || '<tr><td colspan="6" class="muted">No LHS students this year.</td></tr>'}</tbody></table></div>`;
}

export function renderPlanner(M) {
  const year = S.year;
  const g = M.gauges(year);
  const rows = M.plannerRows(year);
  const combined = g.k8Total + g.lhsTotal;
  const totalGauge = g.hasTotalBudget
    ? gauge({ fill: g.totalBudget ? (combined / g.totalBudget) * 100 : 0, over: combined > g.totalBudget,
      text: combined > g.totalBudget ? `${money(combined)} (over by ${money(combined - g.totalBudget)})` : `${money(combined)} of ${money(g.totalBudget)}`,
      caption: `LHS ${money(g.lhsTotal)} comes off first, leaving ${money(g.k8Budget)} for K-8 (using ${money(g.k8Total)})`,
      note: pipelineNote(g.k8PipelineTotal + g.lhsPipelineTotal, g.k8PipelineCount + g.lhsPipelineCount) })
    : gauge({ fill: 0, over: false, text: money(combined), caption: 'Set a Total Timothy Aid budget below to track against it', note: pipelineNote(g.k8PipelineTotal + g.lhsPipelineTotal, g.k8PipelineCount + g.lhsPipelineCount) });
  const k8Over = g.k8Total > g.k8Budget;
  const k8Gauge = gauge({ fill: g.k8Budget ? (g.k8Total / g.k8Budget) * 100 : 0, over: k8Over,
    text: k8Over ? `${money(g.k8Total)} (over by ${money(g.k8Total - g.k8Budget)})` : `${money(g.k8Total)} of ${money(g.k8Budget)}`,
    caption: g.hasTotalBudget ? `Budget ${money(g.k8Budget)} (Total Timothy Aid ${money(g.totalBudget)} − LHS ${money(g.lhsTotal)} first)` : `Budget ${money(g.k8Budget)}`,
    note: pipelineNote(g.k8PipelineTotal, g.k8PipelineCount) });
  const lhsOver = g.lhsTotal > g.lhsReference;
  const lhsGauge = gauge({ fill: g.lhsReference > 0 ? (g.lhsTotal / g.lhsReference) * 100 : (g.lhsTotal > 0 ? 100 : 0), over: lhsOver,
    text: lhsOver ? `${money(g.lhsTotal)} (${money(g.lhsTotal - g.lhsReference)} above the standard rate)` : `${money(g.lhsTotal)} for ${plural(g.lhsCount, 'student')} at the standard rate`,
    caption: `Standard rate: ${g.lhsCount} × ${money(g.lhsRate)} = ${money(g.lhsReference)}`, note: pipelineNote(g.lhsPipelineTotal, g.lhsPipelineCount) });
  const cap = M.cfgNum('family_share_cap_pct', 50);
  const floor = M.cfgNum('timothy_min_award_cents', 200000) / 100;
  const std = M.cfgNum('lhs_standard_rate_cents', 120000) / 100;
  const totalValue = M.config.timothy_total_budget_cents != null ? Math.round(M.cfgNum('timothy_total_budget_cents', 0) / 100) : '';
  return `${statusLine()}<div class="tp-toolbar">${yearSelect('year', [0, 1, 2, 3, 4, 5], year, M)}${yearRateBox(M, year)}</div>
    <p class="tp-caption">${year === 0 ? 'Changes here update each student’s record for the current year.' : `Planning ${esc(M.yearLabel(year))}: grades advance, 8th graders move to LHS and 12th graders age out. Changes here are kept for ${esc(M.yearLabel(year))} only and leave every other year as it is.`}</p>
    <section class="tp-card"><h2>Total Timothy Aid: K-8 (WOL) and LHS combined</h2>
      <p class="muted">One shared pool: LHS awards come off the top first, and what is left becomes the K-8 budget below.</p>
      ${totalGauge}
      <div class="tp-inline"><label for="tp-total-budget">Total Timothy Aid budget</label> $<input id="tp-total-budget" type="number" min="0" step="1" value="${totalValue}"${disabled()}>${canEdit() ? btn('saveTotalBudget', 'Save') : ''}</div></section>
    <section class="tp-card"><h2>K-8 aid: keep Timothy’s award under budget</h2>
      <p class="muted">Each family’s share is a percentage of the tuition bill; outside scholarships apply against that share first, and Timothy commits at least ${dollars(floor)} per student.</p>
      ${pipelineBox(M)}
      ${canEdit() ? `<div class="tp-actionsbar">${btn('applyPolicy', 'Apply aid policy', {}, 'tp-btn tp-primary')}${btn('autoBalance', 'Auto-balance to fit budget')}${btn('resetAwards', 'Reset to current awards')}${btn('openAdd', 'Add student')}</div>
      <p class="tp-caption"><b>Apply aid policy:</b> no family pays more than ${cap}% of the bill, Timothy commits at least ${dollars(floor)} per student, and any budget room left is given in proportion to what families still owe. <b>Auto-balance</b> raises family shares evenly until the awards fit the budget.</p>` : ''}
      ${k8Gauge}${k8Table(M, year, rows.k8, k8Over)}</section>
    <section class="tp-card"><h2>LHS aid: scales with enrollment</h2>
      <p class="muted">Not a fixed pool: it follows how many Timothy graduates attend LHS that year. The bar compares against the standard ${dollars(std)} per student, not a hard cap.</p>
      ${lhsGauge}${lhsTable(M, year, rows.lhs, lhsOver)}</section>`;
}

// ── Past years ───────────────────────────────────────────────────────────
export function pastYearOffsets(M) {
  const base = M.baseYear();
  const set = new Set([-5, -4, -3, -2, -1]);
  M.studentYears.forEach((r) => { const y = parseInt(r.school_year, 10) - base; if (y < 0 && y >= -30) set.add(y); });
  return [...set].sort((a, b) => b - a);
}

function importSection() {
  const st = S.importState;
  let preview = '';
  if (st && st.records) {
    const anyRich = st.records.some((rec) => rec.entries.some((e) => e.lhs_award_cents != null || e.outside_aid_cents != null));
    const key = (f, c) => `${f.trim().toLowerCase()}|${c.trim().toLowerCase()}`;
    const collision = new Set((st.collisions || []).map((w) => key(w.family, w.child)));
    const mismatch = new Set((st.reconcile || []).map((w) => `${key(w.family, w.child)}|${w.school_year}`));
    const rows = st.records.flatMap((rec, r) => rec.entries.map((e, i) => {
      const isLhs = e.lhs_award_cents != null;
      const isCollision = collision.has(key(rec.family, rec.child));
      const isMismatch = !isCollision && mismatch.has(`${key(rec.family, rec.child)}|${e.school_year}`);
      const cents = (v) => (v != null ? money(v / 100) : '—');
      return `<tr class="${isCollision ? 'tp-warn-row' : isMismatch ? 'tp-soft-row' : ''}"><td><input type="checkbox" data-change="importPick" data-key="${r}-${i}"${st.selected[`${r}-${i}`] ? ' checked' : ''} aria-label="Import ${esc(rec.child)} ${esc(e.school_year)}"></td>
        <td>${esc(rec.family)}${isCollision ? ' (possible duplicate)' : ''}</td><td>${esc(rec.child)}</td><td>${esc(e.school_year)}${isMismatch ? ' ≈' : ''}</td>
        ${anyRich ? `<td>${esc(e.grade || '')}</td><td class="num">${isLhs ? '—' : cents(e.outside_aid_cents || 0)}</td><td class="num">${isLhs ? '—' : cents(e.timothy_award_cents || 0)}</td>` : ''}
        <td class="num">${isLhs ? '—' : cents(e.family_owed_cents)}</td>${anyRich ? `<td class="num">${isLhs ? cents(e.lhs_award_cents) : '—'}</td>` : ''}</tr>`;
    })).join('');
    const warn = (title, items) => (items.length ? `<div class="notice"><div><b>${title}</b><ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul></div></div>` : '');
    preview = `<div class="table-wrap tp-scroll"><table class="tp-table"><thead><tr><th></th><th>Family</th><th>Child</th><th>Year</th>${anyRich ? '<th>Grade</th><th class="num">Outside aid</th><th class="num">Timothy award</th>' : ''}<th class="num">Family owed</th>${anyRich ? '<th class="num">LHS award</th>' : ''}</tr></thead><tbody>${rows}</tbody></table></div>
      <p class="tp-caption">Uncheck any row you don’t want imported. A family and child not already on the roster get a history-only record, which does not appear in the current planner.</p>
      ${warn(`${plural((st.collisions || []).length, 'name')} matched both a K-8 record and an LHS award in the same year. Two students probably share this name, so those rows start unchecked:`, (st.collisions || []).map((w) => `${esc(w.family)} / ${esc(w.child)}`))}
      ${warn(`≈ ${plural((st.reconcile || []).length, 'entry', 'entries')} don’t add up (tuition − outside aid − Timothy award ≠ family owed). Still checked; worth a look:`, (st.reconcile || []).map((w) => `${esc(w.family)} / ${esc(w.child)} (${esc(w.school_year)}): ${money(w.tuition)} − ${money(w.outside)} − ${money(w.timothy)} = ${money(w.computed)}, but family owed shows ${money(w.familyOwed)}`))}
      ${warn(`${plural((st.unresolved || []).length, 'LHS award row')} not imported, because no single student matched:`, (st.unresolved || []).map((u) => `${esc(u.rawName)} (grade ${esc(u.grade)}, ${esc(u.school_year)}): ${u.status === 'ambiguous' ? `matches ${u.candidates.map(esc).join(', ')}` : 'no matching student on the roster'}`))}
      ${st.records.length ? btn('confirmImport', 'Import selected', {}, 'tp-btn tp-primary') : ''}`;
  }
  return `<section class="tp-card"><h2>Import history from Excel</h2>
    <p class="muted">Reads the school’s tuition workbook (.xlsx) in your browser: a “Student Tuition History” sheet, or the yearly award sheets. The current year is never imported. Nothing is saved until you review the rows and choose Import.</p>
    <input id="tp-import-file" type="file" accept=".xlsx" data-change="importFile" aria-label="Excel workbook">
    ${st && st.message ? `<p class="${st.error ? 'status status-error' : 'tp-caption'}">${esc(st.message)}</p>` : ''}${preview}</section>`;
}

export function renderPast(M) {
  const year = S.pastYear;
  const label = M.yearLabel(year);
  const rows = M.studentYears.filter((r) => r.school_year === label);
  const cell = (r, field) => `<input id="tp-past-${field}-${r.student_id}" class="tp-num" type="number" min="0" step="1" value="${r[field] != null ? Math.round(r[field] / 100) : (field === 'outside_aid_cents' ? 0 : '')}" placeholder="—" data-change="pastField" data-id="${r.student_id}" data-field="${field}" aria-label="${field.replace(/_cents$/, '').replace(/_/g, ' ')} for ${esc(r.child)}"${disabled()}>`;
  const table = rows.length ? `<div class="table-wrap"><table class="tp-table"><thead><tr><th>Family</th><th>Child</th><th>Grade</th><th class="num">Outside aid</th><th class="num">Timothy award</th><th class="num">Family owed</th><th class="num">LHS award</th><th></th></tr></thead>
    <tbody>${rows.map((r) => `<tr><td>${esc(r.family)}</td><td>${esc(r.child)}</td><td>${esc(r.grade || '—')}</td><td class="num">${cell(r, 'outside_aid_cents')}</td><td class="num">${cell(r, 'timothy_award_cents')}</td><td class="num">${cell(r, 'family_owed_cents')}</td><td class="num">${cell(r, 'lhs_award_cents')}</td><td>${btn('history', 'History', { id: r.student_id }, 'tp-link')}</td></tr>`).join('')}</tbody></table></div>`
    : `<p class="muted">No family records saved for ${esc(label)} yet. Add what you know below, or import the school’s workbook.</p>`;
  const add = canEdit() ? `<section class="tp-card"><h2>Add a family record for ${esc(label)}</h2>
    <p class="muted">Creates a history-only record; it does not appear in the current planner.</p>
    ${personPicker('past')}
    <div class="tp-form-grid">
      <label>Family name<input id="tp-past-family" type="text"></label><label>Child’s first name<input id="tp-past-child" type="text"></label>
      <label>Grade that year<input id="tp-past-grade" type="text"></label><label>Outside aid $<input id="tp-past-outside" type="number" min="0" step="1"></label>
      <label>Timothy award $<input id="tp-past-timothy" type="number" min="0" step="1"></label><label>Family owed $<input id="tp-past-owed" type="number" min="0" step="1"></label>
      <label>LHS award $<input id="tp-past-lhs" type="number" min="0" step="1"></label></div>
    ${btn('addPast', 'Add record', {}, 'tp-btn tp-primary')}</section>` : '';
  return `${statusLine()}<div class="tp-toolbar">${yearSelect('pastYear', pastYearOffsets(M), year, M)}</div>
    <section class="tp-card"><h2>${esc(label)} record</h2><p class="muted">Past years show what was recorded for each family; nothing here is recalculated.</p>${table}</section>
    ${add}${canEdit() ? importSection() : ''}`;
}

// ── Settings ─────────────────────────────────────────────────────────────
export function renderSettings(M) {
  const fields = [...CONFIG_FIELDS.slice(0, -1),
    { key: 'k8_budget_cents', kind: 'cents', def: 7500000, label: 'K-8 budget (without a Total Timothy Aid budget)', unit: '$' },
    CONFIG_FIELDS[CONFIG_FIELDS.length - 1]];
  const value = (f) => { const n = M.cfgNum(f.key, f.def); return f.kind === 'cents' ? Math.round(n / 100) : n; };
  return `${statusLine()}<section class="tp-card"><h2>Planner settings</h2>
    <p class="muted">These change how every projection in Tuition Aid is figured. Each saves on its own.</p>
    <div class="tp-settings">${fields.map((f) => `<div class="tp-setting"><label for="tp-cfg-${f.key}">${esc(f.label)}</label>
      <div class="tp-inline">${f.unit === '$' ? '$' : ''}<input id="tp-cfg-${f.key}" type="number" min="${f.kind === 'year' ? 2000 : 0}" ${f.max ? `max="${f.max}"` : f.kind === 'year' ? 'max="2100"' : ''} step="${f.step || 1}" value="${value(f)}"${disabled()}>${f.unit && f.unit !== '$' ? esc(f.unit) : ''}
      ${canEdit() ? btn('saveConfig', 'Save', { key: f.key, kind: f.kind }) : ''}</div>
      ${f.key === 'base_school_year' ? `<small class="muted">The current school year is ${esc(M.yearLabel(0))}. Advance this once a year, at rollover; plans saved for the new year become that year’s records.</small>` : ''}</div>`).join('')}</div></section>`;
}

// ── Panels: history, link a person, add a student ────────────────────────
function personPicker(prefix) {
  const picked = S.panel && S.panel.person;
  return `<div class="tp-person"><label>${prefix === 'link' ? 'Person' : 'Linked person (optional)'}<input id="tp-${prefix}-search" type="search" placeholder="Search Connect for a person" data-input="personSearch" autocomplete="off"></label>
    ${picked ? `<p class="tp-ok">✓ ${esc(picked.first_name)} ${esc(picked.last_name)} selected ${btn('clearPerson', 'clear', {}, 'tp-link')}</p>` : ''}
    ${S.people.length ? `<ul class="tp-results">${S.people.map((p) => `<li>${btn('pickPerson', `${p.best ? '★ ' : ''}${esc(p.first_name)} ${esc(p.last_name)}${p.household_name ? ` <small>(${esc(p.household_name)})</small>` : ''}`, { id: p.id }, 'tp-link')}</li>`).join('')}</ul>` : ''}</div>`;
}

export function renderPanel(M) {
  const P = S.panel;
  if (!P) return '';
  const close = btn('closePanel', 'Close', {}, 'tp-link');
  if (P.kind === 'history') {
    const rows = M.studentYears.filter((r) => r.student_id === P.id).slice().sort((a, b) => (a.school_year < b.school_year ? -1 : 1));
    const s = M.byId(P.id);
    const title = rows.length ? `${rows[0].family ? `${rows[0].family} — ` : ''}${rows[0].child}` : s ? `${s.family ? `${s.family} — ` : ''}${s.child}` : '';
    const cents = (v) => (v != null ? money(v / 100) : '—');
    let live = '';
    if (s) {
      const b0 = M.bucketFor(s, M.gradeAt(s, 0));
      if (b0 === 'K8') { const sp = M.splitFor(s, 0); live = `<tr class="tp-live"><td>${esc(M.yearLabel(0))} (current)</td><td class="num">${money(s.outsideAid)}</td><td class="num">${money(sp.timothyAward)}</td><td class="num">${money(sp.familyOwed)}</td><td class="num">—</td><td></td></tr>`; }
      if (b0 === 'LHS') live = `<tr class="tp-live"><td>${esc(M.yearLabel(0))} (current)</td><td class="num">—</td><td class="num">—</td><td class="num">—</td><td class="num">${money(s.lhsAward)}</td><td></td></tr>`;
    }
    const base = M.baseYear();
    const body = rows.length || live ? `<div class="table-wrap"><table class="tp-table"><thead><tr><th>School year</th><th class="num">Outside aid</th><th class="num">Timothy award</th><th class="num">Family owed</th><th class="num">LHS award</th><th></th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${esc(r.school_year)}</td><td class="num">${cents(r.outside_aid_cents)}</td><td class="num">${cents(r.timothy_award_cents)}</td><td class="num">${cents(r.family_owed_cents)}</td><td class="num">${cents(r.lhs_award_cents)}</td><td>${btn('jump', 'Open year', { offset: parseInt(r.school_year, 10) - base }, 'tp-link')}</td></tr>`).join('')}</tbody>${live ? `<tfoot>${live}</tfoot>` : ''}</table></div>`
      : '<p class="muted">No history recorded for this student yet.</p>';
    return `<section class="tp-panel" aria-label="History"><div class="tp-panel-head"><h2>History: ${esc(title)}</h2>${close}</div>${body}</section>`;
  }
  if (P.kind === 'link') {
    const s = M.byId(P.id);
    return `<section class="tp-panel" aria-label="Link a person"><div class="tp-panel-head"><h2>Link ${esc(s ? `${s.child} ${s.family}` : 'student')} to a person in Connect</h2>${close}</div>
      <p class="muted">Linking uses the person’s first and last name for this student’s record.</p>${personPicker('link')}
      ${btn('saveLink', 'Link', {}, 'tp-btn tp-primary')}</section>`;
  }
  if (P.kind === 'add') {
    return `<section class="tp-panel" aria-label="Add a student"><div class="tp-panel-head"><h2>Add a student</h2>${close}</div>${personPicker('add')}
      <div class="tp-form-grid"><label>Family name<input id="tp-add-family" type="text"></label><label>Child’s first name<input id="tp-add-child" type="text"></label>
      <label class="tp-check"><input id="tp-add-pipeline" type="checkbox" data-change="addMode"${P.pipeline ? ' checked' : ''}> Not yet enrolled (pipeline, tracked by birth year)</label>
      ${P.pipeline ? '<label>Birth year<input id="tp-add-birth" type="number" min="2010" max="2032"></label>'
        : `<label>Current grade<select id="tp-add-grade">${['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((g) => `<option value="${g}">${g === 'K' ? 'Kindergarten' : `Grade ${g}`}</option>`).join('')}</select></label>`}</div>
      ${btn('saveAdd', 'Add student', {}, 'tp-btn tp-primary')}</section>`;
  }
  return '';
}

export function renderPage(M) {
  const page = S.config.page;
  const head = `<div class="tp-head">${canEdit() ? '' : '<span class="badge">View only</span>'}<span id="tp-save-slot">${saveIndicator()}</span></div>`;
  const panel = renderPanel(M);
  if (page === 'past-years') return head + panel + renderPast(M);
  if (page === 'settings') return head + renderSettings(M);
  if (page === 'overview') return head + panel + renderOverview(M);
  return head + panel + renderPlanner(M);
}
