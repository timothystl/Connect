// Views 2–5 (Check fairness, Health plan, This year's rates, Council summary), ported from legacy
// js-finance.js finCompRenderFairness, finCompRenderHealth, finCompBreakevenHtml,
// finCompRenderRates, finCompRenderBenefitBreakdown and finCompRenderCouncil.
import { S, baseYear, targetYear, canEdit } from './state.js';
import { esc, money, moneyCents, moneySigned, pct, dollars, pctInput, vsScaleText, vsMedianText } from './format.js';
import { act, onInput, onChange, readOnly, option } from './ui.js';
import { TONE, isPartTime, methodSummary, planTotal, healthTierLabel } from './view-plan.js';
import { FIN_COMP_PLAN_KEYS, FIN_CONCORDIA_RANGE_KEYS } from '../compensation-projection.js';
import {
  HEALTH_PLAN_QUOTE_2027, FIN_HEALTH_TIERS, LCMS_MO_BASE_SALARY_BY_YEAR, LCMS_EMPLOYER_FICA_RATE, SSA_COLA_REFERENCE_PCT,
  finLcmsHistoricalAvgGrowthPct, finConcordiaPensionRateFor, finConcordiaDisabilityRateFor,
  finHealthPlanResolvedOption, finHealthPlanEffectiveLoneClaimantTermsCents, finComputeFamilyOOPCents,
  finComputeHealthPlanFamilyBreakevenCents, finComputeHealthPlanSingleClaimantDeltaCents,
} from '../compensation-calc.js';

const PLAN_TAGS = {
  renewal: 'Same plan design as today, new rates',
  option1: 'Richest plan &middot; not embedded',
  option2: 'Middle plan &middot; not embedded',
  option3: 'Leanest plan &middot; embedded individual limits',
};
const overrides = () => S.plan.premiumOverrides;

// Div-based range bars on one shared dollar scale per worker, so every bar and marker line up.
function barScale(values, padFraction) {
  const lo = Math.min(...values), hi = Math.max(...values);
  const pad = (hi - lo) * (padFraction || 0.08) || 1;
  const min = lo - pad, max = hi + pad;
  return (v) => ((v - min) / (max - min) * 100).toFixed(2) + '%';
}

// Verdict chips, in priority order (legacy finCompVerdict), on top of the model's verdict kind.
function verdictChip(m, w, salaryCents) {
  const v = m.verdict(w, salaryCents);
  const chip = (text, bg, color) => ({ text, bg, color, matchLabel: 'Set to LCMS midpoint (' + money(v.midCents) + ')' });
  if (v.kind === 'none') return { text: 'No published range', bg: 'var(--linen)', color: 'var(--warm-meta)', matchLabel: '' };
  if (v.kind === 'below-all') return chip('Below every published range', 'var(--chip-negative-bg)', 'var(--danger)');
  if (v.kind === 'below-lcms') return chip('Below the LCMS range', 'var(--chip-negative-bg)', 'var(--danger)');
  if (v.kind === 'at-mid') return chip('At the LCMS midpoint', 'var(--pale-sage)', 'var(--sage-text)');
  if (v.kind === 'above-mid') return chip(moneySigned(v.vsMidCents) + ' above the LCMS midpoint', 'var(--pale-sage)', 'var(--sage-text)');
  return chip(moneySigned(v.vsMidCents) + ' vs the LCMS midpoint', 'var(--warm-surface-header)', 'var(--deep-amber)');
}

// ── View 2 — Check fairness ──────────────────────────────────────────────────────────────────
export function renderFairness(m, computed) {
  const roster = S.plan.roster;
  const withReports = roster.filter((w) => m.usableRanges(w).length).length;
  const dates = [...new Set(roster.map((w) => (w.concordia || {}).asOfDate).filter(Boolean))];
  const blocks = roster.map((w, i) => {
    const c = computed[i];
    const usable = m.usableRanges(w);
    const verdict = verdictChip(m, w, c.salaryCents);
    const delta = c.salaryCents - c.currentCents;
    let bars;
    if (usable.length) {
      const vals = [c.salaryCents, c.currentCents];
      usable.forEach((r) => vals.push(r.lowCents, r.highCents));
      const at = barScale(vals, 0.08);
      bars = '<div class="fin-comp-ranges">' + usable.map((r) => '<div class="fin-comp-rangerow">'
        + '<span class="fin-comp-rangelbl">' + esc(r.label) + '</span>'
        + '<div class="fin-comp-track">'
        + '<div class="fin-comp-fill" style="left:' + at(r.lowCents) + ';right:' + (100 - parseFloat(at(r.highCents))).toFixed(2) + '%;"></div>'
        + (r.midCents ? '<div class="fin-comp-tick mid" style="left:' + at(r.midCents) + ';"></div>' : '')
        + '<div class="fin-comp-tick salary" style="left:' + at(c.salaryCents) + ';"></div>'
        + '</div>'
        + '<span class="fin-comp-rangenum">' + money(r.lowCents) + ' &ndash; ' + money(r.highCents) + (r.midCents ? ' &middot; mid ' + money(r.midCents) : '') + '</span>'
        + '</div>').join('') + '</div>';
    } else {
      bars = '<div class="fin-comp-noreport">No Concordia Plans report on file for this position &mdash; compared against the District Compensation Worksheet figure ('
        + (c.worksheetCents == null ? 'not available' : money(c.worksheetCents)) + ') only. '
        + '<span class="fin-comp-link"' + act('view', { v: 'rates' }) + '>Add the ranges</span></div>';
    }
    return '<div class="fin-comp-fairblock">'
      + '<div class="fin-comp-fairhd">'
      + '<div><div style="font-size:1rem;font-weight:700;color:var(--color-navy);">' + esc(w.name || '(unnamed)')
      + ((w.concordia || {}).position ? ' <span style="font-weight:400;font-size:.78rem;color:var(--warm-gray);">' + esc(w.concordia.position) + '</span>' : '') + '</div>'
      + '<div style="font-size:.76rem;color:var(--warm-gray);">FY' + baseYear() + ' ' + money(c.currentCents) + ' &rarr; FY' + targetYear() + ' <b style="color:var(--charcoal);">' + money(c.salaryCents) + '</b> &middot; '
      + (delta === 0 ? 'no change' : moneySigned(delta) + (c.currentCents ? ' (' + (delta / c.currentCents * 100).toFixed(1) + '%)' : '')) + '</div></div>'
      + '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
      + '<span class="fin-comp-verdict" style="background:' + verdict.bg + ';color:' + verdict.color + ';">' + verdict.text + '</span>'
      + (verdict.matchLabel && canEdit() ? '<span class="fin-comp-link"' + act('matchMidpoint', { i }) + '>' + verdict.matchLabel + '</span>' : '')
      + '</div></div>'
      + bars + '</div>';
  }).join('');
  return '<div class="fin-card">'
    + '<div class="fin-comp-cardhd">'
    + '<div class="fin-card-title" style="margin:0;">Is it fair?</div>'
    + '<div style="font-size:.78rem;color:var(--warm-gray);">Concordia Plans Decision Support reports'
    + (dates.length === 1 ? ', run ' + esc(dates[0]) : '') + ' &middot; ' + withReports + ' of ' + roster.length + ' workers have a report on file</div>'
    + '</div>'
    + '<div class="fin-comp-legend">'
    + '<span><span class="fin-comp-swatch fill"></span> published range (lower&ndash;higher)</span>'
    + '<span><span class="fin-comp-swatch mid"></span> midpoint</span>'
    + '<span><span class="fin-comp-swatch salary"></span> your FY' + targetYear() + ' figure</span>'
    + '</div>'
    + blocks
    + '<div class="fin-comp-cardfoot" style="border-top:1px solid var(--warm-row-divider);padding-top:14px;">'
    + '<button type="button" class="btn-secondary"' + act('view', { v: 'plan' }) + '>&larr; Back to pay</button>'
    + '<button type="button" class="btn-primary"' + act('view', { v: 'health' }) + '>Next: health plan &rarr;</button>'
    + '</div></div>';
}

// ── View 3 — Health plan ─────────────────────────────────────────────────────────────────────
function embeddedBadge(key) {
  const opt = HEALTH_PLAN_QUOTE_2027.options[key];
  if (!opt) return '';
  return opt.embedded
    ? '<span class="fin-comp-embed-badge emb" title="Each family member has their own limit inside the family limit. Once a member meets their own deductible they start paying coinsurance, even if the family deductible has not been met.">Embedded</span>'
    : '<span class="fin-comp-embed-badge agg" title="One true family deductible — no individual limits. Family members pool expenses and one person can pay the full amount on behalf of the family. The single figures below apply to self-only coverage, not as a per-person cap within family coverage.">Non-embedded</span>';
}

// Only offered when it can change a figure: the member count matters only when the family
// deductible is more than twice the single one.
const familySizeMatters = (opt) => !!(opt && opt.embedded && opt.deductibleFamilyCents > 2 * opt.deductibleIndividualCents);

export function renderHealth(m, computed, totals) {
  const selected = S.plan.healthPlanOption;
  const counts = m.enrollmentCounts();
  const cards = FIN_COMP_PLAN_KEYS.map((key) => {
    const calc = planTotal(key, counts);
    if (!calc) return '';
    const active = key === selected;
    const perHousehold = m.perHouseholdDiffCents('renewal', key);
    const note = key === 'renewal' ? 'Church covers this in full'
      : perHousehold > 0 ? 'Worker pays ' + money(perHousehold) + '/yr more'
        : 'Worker saves ' + money(Math.abs(perHousehold)) + '/yr';
    const noteColor = key === 'renewal' || perHousehold <= 0 ? 'var(--sage-text)' : 'var(--danger)';
    return '<div class="fin-comp-plancard' + (active ? ' active' : '') + (canEdit() ? '' : ' static') + '"' + act('pickPlan', { k: key }) + '>'
      + '<div style="display:flex;align-items:center;gap:8px;"><span class="fin-comp-radio' + (active ? ' active' : '') + '"></span>'
      + '<span style="font-size:.82rem;font-weight:700;color:var(--color-navy);">' + esc(calc.label) + '</span></div>'
      + '<div class="fin-comp-planval">' + money(calc.totalCents) + '</div>'
      + '<div style="font-size:.72rem;color:var(--warm-gray);">Deductible ' + money(m.planQuoteField(key, 'deductibleIndividualCents')) + ' single / ' + money(m.planQuoteField(key, 'deductibleFamilyCents')) + ' family'
      + '<br>Out-of-pocket max ' + money(m.planQuoteField(key, 'oopMaxIndividualCents')) + ' single / ' + money(m.planQuoteField(key, 'oopMaxFamilyCents')) + ' family</div>'
      + '<div style="font-size:.74rem;font-weight:700;color:' + noteColor + ';">' + note + '</div>'
      + '<div style="font-size:.7rem;color:var(--warm-meta);">' + PLAN_TAGS[key] + '</div>'
      + '</div>';
  }).join('');
  const enrolledN = Math.max(1, m.enrolledCount());
  const rows = S.plan.roster.map((w, i) => {
    const tier = m.healthTier(w), b = computed[i].benefits;
    const who = '<td class="fin-comp-td"><div style="font-weight:700;">' + esc(w.name || '(unnamed)') + '</div><div style="font-size:.72rem;color:var(--warm-gray);">' + esc(w.position || '') + '</div></td>';
    if (m.isCashOnly(w)) {
      return '<tr style="opacity:.7;">' + who
        + '<td class="fin-comp-td"><span style="font-size:.78rem;color:var(--warm-gray);">Not eligible</span></td>'
        + '<td class="fin-comp-td num" style="font-weight:700;"><span style="color:var(--warm-gray);font-weight:400;">&mdash;</span></td>'
        + '<td class="fin-comp-td" style="font-size:.76rem;color:var(--warm-gray);">Cash salary only at ' + m.ftePct(w) + '% time &mdash; below the hours floor for the group plan.</td></tr>';
    }
    let costCell, basis;
    if (tier !== 'optout') {
      const tierRate = m.tierMonthlyCents(selected, tier) || 0;
      if (w.employeeOnlyPremiumCents != null) {
        costCell = readOnly('<span class="fin-comp-dollarbox"><span>$</span><input type="text" inputmode="decimal" id="cp-eo-' + i + '" value="' + (w.employeeOnlyPremiumCents / 100) + '" placeholder="0.00"' + onInput('employeeOnly', { i }, 'decimal') + '></span>');
        basis = 'Hand-entered premium, overriding the ' + esc(healthTierLabel(tier)) + ' rate.' + (canEdit() ? ' <span class="fin-comp-link"' + act('clearEmployeeOnly', { i }) + '>use the quote</span>' : '');
      } else {
        costCell = money(b.healthCents);
        basis = esc(healthTierLabel(tier)) + ' rate ' + moneyCents(tierRate) + '/mo &times; 12, plus dental and vision shared across ' + enrolledN + ' enrolled';
      }
    } else {
      costCell = readOnly('<span class="fin-comp-dollarbox"><span>$</span><input type="text" inputmode="decimal" id="cp-optout-' + i + '" value="' + (w.healthOptOutOverrideCents != null ? (w.healthOptOutOverrideCents / 100) : '') + '" placeholder="' + (m.optOutCents() / 100).toFixed(2) + '"' + onInput('optOut', { i }, 'decimal') + '></span>');
      basis = 'Opt-out cash &mdash; default ' + money(m.optOutCents()) + ' from this year&#39;s rates';
    }
    return '<tr>' + who
      + '<td class="fin-comp-td">' + readOnly('<select' + onChange('healthTier', { i }) + '>'
        + FIN_HEALTH_TIERS.map((t) => option(t.key, esc(t.label), tier === t.key)).join('')
        + option('optout', 'Opts out (cash)', tier === 'optout') + '</select>') + '</td>'
      + '<td class="fin-comp-td num" style="font-weight:700;">' + costCell + '</td>'
      + '<td class="fin-comp-td" style="font-size:.76rem;color:var(--warm-gray);">' + basis + '</td></tr>';
  }).join('');
  const breakdown = FIN_HEALTH_TIERS.filter((t) => counts[t.key] > 0).map((t) => counts[t.key] + ' ' + t.label).join(', ') || 'nobody';
  const enrolledTotal = m.enrolledCount();
  const table = '<div class="fin-comp-scroll"><table class="fin-comp-table" style="min-width:700px;">'
    + '<thead><tr><th class="fin-comp-th">Worker</th><th class="fin-comp-th">Coverage</th><th class="fin-comp-th num">Church cost</th><th class="fin-comp-th">Where the figure comes from</th></tr></thead>'
    + '<tbody>' + rows
    + '<tr class="fin-comp-total-row"><td class="fin-comp-td" colspan="2">Total health cost</td>'
    + '<td class="fin-comp-td num">' + money(totals.healthCents) + '</td>'
    + '<td class="fin-comp-td" style="font-size:.74rem;font-weight:400;color:var(--warm-gray);">Group quote at this enrollment ('
    + esc(breakdown) + ') is ' + money(planTotal(selected, counts).totalCents)
    + ' across ' + enrolledTotal + ' contract' + (enrolledTotal === 1 ? '' : 's') + '; opt-out cash and any hand-entered premium are on top.</td></tr>'
    + '</tbody></table></div>';
  return '<div class="fin-card">'
    + '<div class="fin-comp-cardhd">'
    + '<div class="fin-card-title" style="margin:0;">Group health plan</div>'
    + '<div style="font-size:.78rem;color:var(--warm-gray);">Premiums are entered in <span class="fin-comp-link"' + act('view', { v: 'rates' }) + '>this year&#39;s rates</span>; here you choose the plan and who sits on which tier.</div>'
    + '</div>'
    + '<div class="fin-comp-plangrid">' + cards + '</div>'
    + table
    + breakeven(m)
    + '<div class="fin-comp-cardfoot">'
    + '<button type="button" class="btn-secondary"' + act('view', { v: 'fairness' }) + '>&larr; Back to fairness</button>'
    + '<button type="button" class="btn-primary"' + act('view', { v: 'council' }) + '>Next: Council summary &rarr;</button>'
    + '</div></div>';
}

// "Is it worth it for the worker?" — the breakeven analysis behind a disclosure, same math.
function breakeven(m) {
  const sel = S.plan.healthPlanOption;
  if (sel === 'renewal') return '';
  if (!planTotal(sel) || !planTotal('renewal')) return '';
  const ov = overrides();
  const diff = m.perHouseholdDiffCents('renewal', sel);
  const renewalOpt = finHealthPlanResolvedOption('renewal', ov), selOpt = finHealthPlanResolvedOption(sel, ov);
  const rate = HEALTH_PLAN_QUOTE_2027.coinsuranceRate;
  const renewalLone = finHealthPlanEffectiveLoneClaimantTermsCents('renewal', ov), selLone = finHealthPlanEffectiveLoneClaimantTermsCents(sel, ov);
  const members = S.familySize;
  const row = (label, a, b) => '<tr><td>' + label + '</td><td class="n">' + money(a) + '</td><td class="n">' + money(b) + '</td></tr>';
  let body = '', tableRows = '';
  if (diff > 0) {
    const breakevenCents = finComputeHealthPlanFamilyBreakevenCents('renewal', sel, diff, ov, members);
    const single = finComputeHealthPlanSingleClaimantDeltaCents('renewal', sel, 100000000, ov);
    if (breakevenCents != null) {
      tableRows += row('At the breakeven (' + money(breakevenCents) + ' total cost of care, spread across ' + members + ' family members)',
        finComputeFamilyOOPCents(renewalOpt, rate, breakevenCents, members), finComputeFamilyOOPCents(selOpt, rate, breakevenCents, members));
    }
    tableRows += row('Worst case, costs spread across the family', renewalOpt.oopMaxFamilyCents, selOpt.oopMaxFamilyCents);
    tableRows += row('Worst case, one family member alone', renewalLone.oopMaxCents, selLone.oopMaxCents);
    body = 'The church fully covers Renewal; choosing this option means the worker personally pays the ' + money(diff) + '/yr extra premium. '
      + (breakevenCents != null
        ? 'If their household&#39;s costs are spread across 2+ family members, that extra premium pays them back once the household&#39;s <i>total cost of care for the year</i> (what providers bill &mdash; not what the family pays out of pocket, which stays capped well below this) reaches about <b>' + money(breakevenCents) + '</b>.'
        : 'It never fully pays the worker back in reduced out-of-pocket costs at any level of care, even spread across the whole family.')
      + (single != null ? ' If one family member alone accounts for all the costs, this option ' + (single > 0 ? 'never breaks even &mdash; it costs them up to ' + money(single) + ' more even in a worst-case year' : (single < 0 ? 'still comes out ahead by up to ' + money(Math.abs(single)) + ' in a worst-case year' : 'comes out exactly even in a worst-case year')) + '.' : '');
  } else if (diff < 0) {
    const worst = finComputeFamilyOOPCents(selOpt, rate, 100000000, members) - finComputeFamilyOOPCents(renewalOpt, rate, 100000000, members);
    tableRows += row('Worst case, costs spread across the family', renewalOpt.oopMaxFamilyCents, selOpt.oopMaxFamilyCents);
    tableRows += row('Worst case, one family member alone', renewalLone.oopMaxCents, selLone.oopMaxCents);
    body = 'The church fully covers Renewal; this cheaper option would save the worker ' + money(Math.abs(diff)) + '/yr in premium &mdash; guaranteed, claim or no claim. '
      + 'The tradeoff is a higher deductible/out-of-pocket max: in a worst-case year with costs spread across the family it could cost up to <b>' + money(Math.abs(worst)) + (worst > 0 ? ' more' : ' less') + '</b> out of pocket than Renewal'
      + (Math.abs(worst) < Math.abs(diff)
        ? ', which is smaller than the guaranteed premium saving &mdash; so even in a bad year this option comes out ahead for the worker.'
        : ', which is larger than the guaranteed premium saving &mdash; so a genuinely bad year could cost the worker more overall.');
  } else {
    return '';
  }
  const sizePicker = (familySizeMatters(renewalOpt) || familySizeMatters(selOpt))
    ? '<div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">'
      + '<label style="font-size:.72rem;">Family members assumed ' + readOnly('<select' + onChange('familySize', {}) + '>'
        + [1, 2, 3, 4, 5, 6].map((n) => option(n, String(n), n === members)).join('') + '</select>') + '</label>'
      + '<span style="font-size:.7rem;color:var(--warm-meta);max-width:520px;">On an <b>embedded</b> plan each member has their own limit inside the family one and starts paying coinsurance once they personally meet it, so how many people share the costs changes the total.</span></div>'
    : '<div style="margin-top:8px;font-size:.7rem;color:var(--warm-meta);max-width:560px;">The spread-across-the-family row assumes costs are shared rather than falling on one person. How many people share them makes no difference on these plans: every option sets the family deductible at exactly twice the single one, so two or more people always reach the pooled family limit at the same point. The two rows below therefore bracket the real range &mdash; costs shared, versus one member alone.</div>';
  return '<details class="fin-comp-details"><summary>Is it worth it for the worker?</summary>'
    + '<div style="padding:8px 2px 2px;font-size:.75rem;color:var(--warm-gray);">' + body + sizePicker
    + '<table class="fin-comp-mini wide"><thead><tr><th>What the family would actually pay</th><th>Renewal</th><th>' + esc(selOpt.label) + '</th></tr></thead>'
    + '<tbody>' + tableRows + '</tbody></table></div></details>';
}

// ── View 4 — This year's rates ───────────────────────────────────────────────────────────────
const ratesYear = () => (S.refYear == null ? targetYear() : Number(S.refYear));
const refRow = (year) => S.plan.referenceByYear[year] || {};

function rateInput(field, year, suffix, width) {
  const raw = refRow(year)[field];
  const shown = raw == null ? '' : (suffix === '%' ? pctInput(raw) : raw / 100);
  return '<span style="display:inline-flex;align-items:center;gap:3px;">'
    + (suffix === '$' ? '<span style="color:var(--warm-gray);font-weight:400;">$</span>' : '')
    + '<input type="text" inputmode="decimal" id="cp-ref-' + field + '-' + year + '" value="' + shown + '"' + onInput('ref', { y: year, f: field }, 'decimal') + ' style="width:' + (width || 110) + 'px;font-weight:700;">'
    + (suffix === '%' ? '<span style="color:var(--warm-gray);font-weight:400;">%</span>' : '') + '</span>';
}

export function renderRates(m) {
  const year = ratesYear();
  const row = refRow(year);
  const baseInfo = m.baseSalary(year);
  const prevBase = m.baseSalary(year - 1);
  const entered = row.baseSalaryCents != null;
  const historyYears = Object.keys(LCMS_MO_BASE_SALARY_BY_YEAR).map(Number)
    .concat(Object.keys(S.plan.referenceByYear).map(Number))
    .filter((y, i, a) => a.indexOf(y) === i && Number.isFinite(y)).sort((a, b) => a - b);
  const chips = historyYears.map((y) => {
    const v = m.baseSalary(y);
    return '<span class="fin-comp-histchip' + (y === year ? ' active' : '') + '">' + y + ' &middot; ' + (v.dollars ? '$' + dollars(v.dollars) : 'not set') + '</span>';
  }).join('');
  const cagr = finLcmsHistoricalAvgGrowthPct();
  const yearOptions = [baseYear(), targetYear(), targetYear() + 1].filter((y, i, a) => a.indexOf(y) === i)
    .map((y) => option(y, 'FY' + y + (m.baseSalary(y).exact ? '' : ' (not yet published)'), y === year)).join('');
  const changeFmt = (entered || baseInfo.exact) && prevBase.dollars
    ? moneySigned(Math.round((baseInfo.dollars - prevBase.dollars) * 100)) + ' (' + ((baseInfo.dollars - prevBase.dollars) / prevBase.dollars * 100).toFixed(2) + '%)'
    : '&mdash;';
  const sourceInput = (field, width) => '<input type="text" id="cp-ref-' + field + '-' + year + '" value="' + esc(row[field] || '') + '" placeholder="' + esc(m.sourceDoc(field)) + '"' + onInput('refText', { y: year, f: field }) + ' style="width:' + width + ';font-weight:400;">';
  const districtCard = '<div class="fin-card">'
    + '<div class="fin-card-title" style="font-size:20px;">District guidelines</div>'
    + '<div class="fin-card-sub">LCMS Missouri District, FY' + year + '. Only the base salary changes each year &mdash; the role, education and experience multiplier tables stay fixed.</div>'
    + '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;">'
    + '<label class="fin-comp-reflabel">Base salary, FY' + year + rateInput('baseSalaryCents', year, '$', 130) + '</label>'
    + '<div class="fin-comp-reflabel">Change from last year<span style="font-size:.92rem;font-weight:700;color:var(--charcoal);padding:7px 0;font-variant-numeric:tabular-nums;text-transform:none;letter-spacing:0;">' + changeFmt + '</span></div>'
    + '</div>'
    // Never silently substitute: an entered figure says nothing, a published figure on file gets a
    // neutral note, and only a carry-forward from an earlier year gets the warning.
    + (entered ? ''
      : baseInfo.exact
        ? '<div class="fin-comp-note" style="margin-top:10px;">Nothing entered for FY' + year + ' &mdash; using the published district figure already on file, $' + dollars(baseInfo.dollars) + '. Type this year&#39;s paper in above to override it.</div>'
        : '<div class="fin-comp-warn">No figure entered for FY' + year + ' yet &mdash; the planner is carrying $' + dollars(baseInfo.dollars) + ' forward from FY' + baseInfo.sourceYear + '. Enter the real number as soon as the district paper arrives.</div>')
    + '<div style="margin-top:12px;"><div class="fin-comp-reflabel-hd">Base salary history</div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">' + chips + '</div>'
    + '<div style="font-size:.74rem;color:var(--warm-gray);margin-top:6px;">Averages ' + (cagr * 100).toFixed(2) + '%/yr since ' + historyYears[0] + '.</div></div>'
    + '<label class="fin-comp-reflabel" style="margin-top:12px;">Source document' + sourceInput('districtSource', '100%') + '</label></div>';
  const concordiaCard = '<div class="fin-card">'
    + '<div class="fin-card-title" style="font-size:20px;">Concordia Plans rates</div>'
    + '<div class="fin-card-sub">Percentages of salary, the same for every worker. From the church&#39;s own participation overview.</div>'
    + '<div class="fin-comp-rategrid">'
    + '<label class="fin-comp-reflabel">Pension (Traditional)' + rateInput('pensionPct', year, '%', 100) + '</label>'
    + '<label class="fin-comp-reflabel">Employer FICA' + rateInput('ficaPct', year, '%', 100) + '</label>'
    + '<label class="fin-comp-reflabel">Disability &mdash; with dependents' + rateInput('disabilityDepsPct', year, '%', 100) + '</label>'
    + '<label class="fin-comp-reflabel">Disability &mdash; without' + rateInput('disabilityNoDepsPct', year, '%', 100) + '</label>'
    + '<label class="fin-comp-reflabel">Social Security COLA' + rateInput('ssaColaPct', year, '%', 100) + '</label>'
    + '<label class="fin-comp-reflabel">Health opt-out cash' + rateInput('healthOptOutCents', year, '$', 100) + '</label>'
    + '</div>'
    + '<div style="font-size:.76rem;color:var(--warm-gray);margin-top:10px;">Announced each autumn for the following year &mdash; the Social Security COLA in October, the Concordia Plans rates with the renewal packet. Blank uses '
    + 'pension ' + pct(finConcordiaPensionRateFor(year).rate) + ', FICA ' + pct(LCMS_EMPLOYER_FICA_RATE) + ', disability ' + pct(finConcordiaDisabilityRateFor(year, true).rate) + '/' + pct(finConcordiaDisabilityRateFor(year, false).rate) + ', COLA ' + pct(SSA_COLA_REFERENCE_PCT) + '.</div>'
    + '<label class="fin-comp-reflabel" style="margin-top:12px;">Source document' + sourceInput('concordiaSource', '100%') + '</label></div>';
  // One MONTHLY rate per coverage tier, per option, as Concordia publishes it; enrollment is
  // counted from the roster, never typed.
  const counts = m.enrollmentCounts();
  const quoteRows = FIN_COMP_PLAN_KEYS.map((key) => {
    const calc = planTotal(key, counts);
    const ov = overrides()[key] || {};
    const box = (field, width) => '<input type="text" inputmode="decimal" id="cp-quote-' + key + '-' + field + '" value="' + (ov[field] != null ? ov[field] / 100 : '') + '" placeholder="' + (HEALTH_PLAN_QUOTE_2027.options[key][field] / 100).toFixed(2) + '"' + onInput('quote', { k: key, f: field }, 'decimal') + ' style="width:' + width + 'px;text-align:right;">';
    const tierBoxes = FIN_HEALTH_TIERS.map((t) => {
      const tov = (ov.tiersMonthlyCents || {})[t.key];
      const quoted = (HEALTH_PLAN_QUOTE_2027.options[key].tiersMonthlyCents || {})[t.key];
      return '<td class="fin-comp-td num"><input type="text" inputmode="decimal" id="cp-tier-' + key + '-' + t.key + '" value="' + (tov != null ? tov / 100 : '') + '" placeholder="' + (quoted == null ? '' : (quoted / 100).toFixed(2)) + '"' + onInput('tierRate', { k: key, t: t.key }, 'decimal') + ' style="width:88px;text-align:right;"></td>';
    }).join('');
    return '<tr' + (key === S.plan.healthPlanOption ? ' class="fin-comp-quote-active"' : '') + '>'
      + '<td class="fin-comp-td"><div style="font-weight:700;color:var(--color-navy);">' + esc(calc.label) + '</div><div style="font-size:.72rem;color:var(--warm-gray);">' + PLAN_TAGS[key] + '</div><div style="margin-top:3px;">' + embeddedBadge(key) + '</div></td>'
      + tierBoxes
      + '<td class="fin-comp-td num">' + box('dentalCents', 86) + '</td>'
      + '<td class="fin-comp-td num">' + box('visionCents', 86) + '</td>'
      + '<td class="fin-comp-td num">' + box('deductibleIndividualCents', 82) + '</td>'
      + '<td class="fin-comp-td num">' + box('deductibleFamilyCents', 82) + '</td>'
      + '<td class="fin-comp-td num">' + box('oopMaxIndividualCents', 82) + '</td>'
      + '<td class="fin-comp-td num">' + box('oopMaxFamilyCents', 82) + '</td>'
      + '<td class="fin-comp-td num" style="font-weight:700;">' + moneyCents(calc.monthlyCents) + '</td>'
      + '<td class="fin-comp-td num" style="font-weight:700;">' + money(calc.totalCents) + '</td></tr>';
  }).join('');
  const enrolCells = FIN_HEALTH_TIERS.map((t) => '<td class="fin-comp-td num" style="font-weight:700;color:var(--color-navy);">' + counts[t.key] + '</td>').join('');
  const enrolled = m.enrolledCount();
  const quoteCard = '<div class="fin-card">'
    + '<div class="fin-comp-cardhd">'
    + '<div><div class="fin-card-title" style="font-size:20px;margin:0;">Health plan quote, FY' + year + '</div>'
    + '<div class="fin-card-sub" style="margin:0;">Type the renewal packet&#39;s Enrollment and Rates block straight in &mdash; one <b>monthly</b> rate per coverage tier, per option. Dental and vision are not tier-priced in the packet, so they stay annual figures for the whole group and are shared evenly across whoever is enrolled. Total monthly is the packet&#39;s own Total Monthly Cost (medical only, at the enrollment below); total annual adds dental and vision. Who sits on which tier is set per worker in step 1.</div></div>'
    + '<div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">'
    + '<label class="fin-comp-reflabel">Quote reference' + sourceInput('quoteSource', '260px') + '</label>'
    + '</div></div>'
    + '<div class="fin-comp-scroll"><table class="fin-comp-table" style="min-width:1320px;">'
    + '<thead><tr><th class="fin-comp-th">Plan option</th>'
    + FIN_HEALTH_TIERS.map((t) => '<th class="fin-comp-th num">' + esc(t.label) + ' / mo</th>').join('')
    + '<th class="fin-comp-th num">Dental / yr<br><span style="font-weight:400;text-transform:none;">per worker</span></th><th class="fin-comp-th num">Vision / yr<br><span style="font-weight:400;text-transform:none;">per worker</span></th>'
    + '<th class="fin-comp-th num">Deductible &mdash; single</th><th class="fin-comp-th num">Deductible &mdash; family</th>'
    + '<th class="fin-comp-th num">Out-of-pocket max &mdash; single</th><th class="fin-comp-th num">Out-of-pocket max &mdash; family</th>'
    + '<th class="fin-comp-th num">Total monthly</th><th class="fin-comp-th num">Total annual</th></tr></thead>'
    + '<tbody>' + quoteRows
    + '<tr class="fin-comp-total-row"><td class="fin-comp-td">Enrolled now</td>' + enrolCells
    + '<td class="fin-comp-td" colspan="7" style="font-size:.74rem;font-weight:400;color:var(--warm-gray);">Counted from the roster &mdash; change a worker&#39;s tier in step 1. Cash-only workers are below the hours floor and are not contracts.</td>'
    + '<td class="fin-comp-td num">' + enrolled + ' contract' + (enrolled === 1 ? '' : 's') + '</td></tr>'
    + '</tbody></table></div>'
    + '<div style="font-size:.72rem;color:var(--warm-gray);margin-top:6px;max-width:940px;"><b>Embedded</b> &mdash; each family member has their own limit inside the family limit; no one member contributes more than the single figure toward the family deductible, and once they meet it they start paying coinsurance even if the family deductible has not been met. <b>Non-embedded</b> &mdash; one true family deductible with no individual limits: members pool expenses and one person can pay the full family amount alone. On a non-embedded option the single figures below apply to a <i>self-only contract</i>, not as a per-person cap inside family coverage.</div>'
    + '<div class="fin-comp-bar mist"><span style="font-weight:700;color:var(--color-navy);">Plan the church covers in full:</span>'
    + '<span style="display:inline-flex;align-items:center;gap:10px;flex-wrap:wrap;"><select' + onChange('pickPlan', {}) + '>'
    + FIN_COMP_PLAN_KEYS.map((k) => { const c = planTotal(k); return option(k, esc(c.label) + ' &middot; ' + money(c.totalCents), k === S.plan.healthPlanOption); }).join('')
    + '</select><span style="font-size:.78rem;color:var(--warm-gray);">Anyone choosing another option pays the difference themselves.</span></span></div>'
    + '</div>';
  const marketCard = '<div class="fin-card">'
    + '<div class="fin-comp-cardhd">'
    + '<div><div class="fin-card-title" style="font-size:20px;margin:0;">Market comparison data</div>'
    + '<div class="fin-card-sub" style="margin:0;">Run Concordia Plans&#39; Compensation Decision Support Tool once a year per worker and type the four ranges in here &mdash; there is no feed for it. These are what step 2 charts against. The District pair only prints on a pastor report; leave it blank otherwise.</div></div>'
    + '<a href="https://tc.cbiz.com/CompToolCPS/Login" target="_blank" rel="noopener" style="font-size:.78rem;font-weight:700;">Open the Compensation Decision Support Tool &rarr;</a></div>'
    + S.plan.roster.map((w, i) => {
      const c = w.concordia || {};
      const onFile = m.usableRanges(w).length;
      const rangeRows = FIN_CONCORDIA_RANGE_KEYS.map((r) => {
        const box = (part) => '<input type="text" id="cp-range-' + i + '-' + r.key + part + '" value="' + esc(c[r.key + part] == null ? '' : c[r.key + part]) + '" placeholder="&mdash;"' + onInput('range', { i, f: r.key + part }) + ' style="width:100px;text-align:right;">';
        return '<tr' + (/LCMS/i.test(r.label) ? ' class="fin-comp-lcms-row"' : '') + '>'
          + '<td class="fin-comp-td" style="color:var(--warm-ink-label);font-weight:600;">' + esc(r.label) + '</td>'
          + '<td class="fin-comp-td num">' + box('Low') + '</td>'
          + '<td class="fin-comp-td num">' + box('Mid') + '</td>'
          + '<td class="fin-comp-td num">' + box('High') + '</td></tr>';
      }).join('');
      return '<div class="fin-comp-fairblock">'
        + '<div style="display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap;">'
        + '<span style="font-size:.95rem;font-weight:700;color:var(--color-navy);min-width:150px;">' + esc(w.name || '(unnamed)') + '</span>'
        + '<label class="fin-comp-reflabel">Position on the report<input type="text" id="cp-cpos-' + i + '" value="' + esc(c.position || '') + '"' + onInput('range', { i, f: 'position' }) + ' style="width:300px;font-weight:400;"></label>'
        + '<label class="fin-comp-reflabel">Report date<input type="text" id="cp-cdate-' + i + '" value="' + esc(c.asOfDate || '') + '" placeholder="mm/dd/yyyy"' + onInput('range', { i, f: 'asOfDate' }) + ' style="width:110px;font-weight:400;"></label>'
        + '<span style="font-size:.74rem;font-weight:600;padding-bottom:6px;color:' + (onFile ? 'var(--sage-text)' : 'var(--deep-amber)') + ';">'
        + (onFile ? onFile + ' of 4 ranges on file' : 'No report on file &mdash; compared to the District Compensation Worksheet only') + '</span>'
        + '</div>'
        + '<div class="fin-comp-scroll"><table class="fin-comp-table" style="min-width:560px;">'
        + '<thead><tr><th class="fin-comp-th">Range</th><th class="fin-comp-th num">Lower pay</th><th class="fin-comp-th num">Midpoint pay</th><th class="fin-comp-th num">Higher pay</th></tr></thead>'
        + '<tbody>' + rangeRows + '</tbody></table></div></div>';
    }).join('')
    + '<div style="font-size:.74rem;color:var(--warm-gray);margin-top:10px;">The LCMS row (shaded) is the one the fairness verdicts are measured against &mdash; it is the LCMS-only comparison, so it is the fairest single yardstick for a called worker.</div>'
    + '</div>';
  return '<div style="display:flex;flex-direction:column;gap:16px;">'
    + '<div class="fin-comp-ratesbanner">'
    + '<div><div style="font-size:.9rem;font-weight:700;color:var(--warm-ink-label);">Everything that changes once a year lives here.</div>'
    + '<div style="font-size:.78rem;color:var(--warm-meta);">Enter each new paper as it arrives; every figure on the other tabs recomputes. Nothing here is per-worker.</div></div>'
    + '<div style="display:flex;align-items:center;gap:8px;"><span class="fin-comp-reflabel-hd">Rates for</span>'
    + '<select class="fin-comp-yearsel"' + onChange('ratesYear', {}) + '>' + yearOptions + '</select></div>'
    + '</div>'
    + readOnly('<div class="fin-comp-ratesgrid">' + districtCard + concordiaCard + '</div>' + quoteCard + marketCard)
    + '</div>';
}

// ── View 5 — Council summary ─────────────────────────────────────────────────────────────────
// Always the roster a council audience sees: hideFromCouncil workers are left out, whoever looks.
function benefitBreakdown(m, computed, totals) {
  const bd = m.benefitBreakdown(computed);
  const labels = {
    pension: ['Pension &mdash; Concordia Retirement Plan', (r) => pct(r.rate) + ' of cash salary'],
    health: ['Health plan', () => 'group premium, opt-out cash and hand-entered employee-only premiums combined'],
    disability: ['Disability &amp; survivor', (r) => pct(r.rate) + ' of cash salary, ' + pct(r.rateWithDependents) + ' with dependents'],
    fica: ['Employer FICA', (r) => pct(r.rate) + ' of cash salary; a minister pays their own SECA instead'],
  };
  const rows = bd.rows.map((r) => {
    const share = bd.totalCents ? Math.round(r.cents / bd.totalCents * 100) : 0;
    return '<tr class="fin-comp-row"><td class="fin-comp-td"><div style="font-weight:700;">' + labels[r.key][0] + '</div>'
      + '<div style="font-size:.74rem;color:var(--warm-gray);">' + labels[r.key][1](r) + '</div></td>'
      + '<td class="fin-comp-td num" style="color:var(--warm-gray);">' + r.people + ' of ' + bd.countedCount + '</td>'
      + '<td class="fin-comp-td num" style="font-weight:700;">' + money(r.cents) + '</td>'
      + '<td class="fin-comp-td num" style="color:var(--warm-gray);">' + share + '%</td></tr>';
  }).join('');
  const ex = m.externallyFundedWorkers();
  const excluded = ex.length
    ? '<div style="font-size:.74rem;color:var(--warm-gray);margin-top:6px;">Not counted above: '
      + ex.map((w) => '<b style="color:var(--charcoal);">' + esc(w.name || '(unnamed)') + '</b>' + (w.position ? ' (' + esc(w.position) + ')' : '')).join(', ')
      + ' &mdash; paid from another budget. Their salary and every employer cost on it sit in that section, not this one. The FY' + baseYear()
      + ' comparison figure is still read from the church payroll accounts as they stand, so if any of that pay runs through those accounts it is in the comparison but not in the FY' + targetYear() + ' plan.</div>'
    : '';
  return '<div style="margin-top:22px;">'
    + '<div style="font-weight:700;font-size:1rem;color:var(--color-navy);margin-bottom:2px;">What makes up ' + money(totals.benefitsCents) + ' of benefits &amp; taxes</div>'
    + '<div style="font-size:.74rem;color:var(--warm-gray);margin-bottom:8px;">Every employer cost on top of cash salary, across the ' + bd.countedCount + ' worker' + (bd.countedCount === 1 ? '' : 's') + ' this budget carries. These four lines are the whole of it &mdash; they add to the Benefits &amp; taxes figure above.</div>'
    + '<div class="fin-comp-scroll"><table class="fin-comp-table" style="min-width:620px;font-size:.86rem;">'
    + '<thead><tr><th class="fin-comp-th">Cost</th><th class="fin-comp-th num">Workers</th><th class="fin-comp-th num">FY' + targetYear() + '</th><th class="fin-comp-th num">Share</th></tr></thead>'
    + '<tbody>' + rows
    + '<tr class="fin-comp-total-row"><td class="fin-comp-td">Total benefits &amp; taxes</td><td class="fin-comp-td"></td>'
    + '<td class="fin-comp-td num">' + money(bd.totalCents) + '</td><td class="fin-comp-td num">100%</td></tr>'
    + '</tbody></table></div>'
    + excluded
    + (bd.secaSelfCents ? '<div style="font-size:.74rem;color:var(--warm-gray);margin-top:6px;">Ministers pay the employer half of Social Security themselves &mdash; ' + money(bd.secaSelfCents) + ' at these salaries. That is their cost, not the church&#39;s, and is in no figure above.</div>' : '')
    + '</div>';
}

export function renderCouncil(m, computed, totals) {
  const change = totals.baselineCents ? (totals.deltaCents / totals.baselineCents * 100) : null;
  const scaleTotal = vsScaleText(totals.salaryCents, totals.worksheetCents);
  const med = m.medianTotal(computed);
  const medText = med.medCents
    ? { text: moneySigned(med.diffCents) + ' (' + med.pct + '% of median, ' + med.count + ' with report' + (med.count === 1 ? '' : 's') + ')', tone: med.tone }
    : { text: '&mdash;', tone: 'muted' };
  const salaryDelta = totals.salaryCents - totals.currentCents;
  const rows = m.roster.map((w, i) => {
    const c = computed[i];
    const delta = c.salaryCents - c.currentCents;
    const lcms = m.lcmsRange(w);
    const vs = vsScaleText(c.salaryCents, c.worksheetCents);
    // Concordia's ranges are full-time figures, so a part-timer's median comparison is suppressed.
    const vsMed = isPartTime(m, w) ? { text: 'part-time &mdash; not comparable', tone: 'muted' } : vsMedianText(c.salaryCents, lcms && lcms.midCents);
    if (m.isExternallyFunded(w)) {
      return '<tr class="fin-comp-row" style="color:var(--warm-gray);"><td class="fin-comp-td"><div style="font-weight:700;">' + esc(w.name || '(unnamed)') + '</div>'
        + '<div style="font-size:.74rem;">' + esc(w.position || '') + ' &middot; <span style="color:var(--deep-amber);font-weight:700;">paid from another budget</span></div></td>'
        + '<td class="fin-comp-td num">' + money(c.currentCents) + '</td>'
        + '<td class="fin-comp-td num">' + money(c.salaryCents) + '</td>'
        + '<td class="fin-comp-td num">&mdash;</td>'
        + '<td class="fin-comp-td" colspan="2" style="font-size:.78rem;">Costed in another section &mdash; in no total here</td>'
        + '<td class="fin-comp-td num">&mdash;</td></tr>';
    }
    return '<tr class="fin-comp-row"><td class="fin-comp-td"><div style="font-weight:700;">' + esc(w.name || '(unnamed)') + '</div>'
      + '<div style="font-size:.74rem;color:var(--warm-gray);">' + esc(w.position || '') + (isPartTime(m, w) ? ' &middot; ' + m.ftePct(w) + '% time' : '') + '</div></td>'
      + '<td class="fin-comp-td num" style="color:var(--warm-gray);">' + money(c.currentCents) + '</td>'
      + '<td class="fin-comp-td num" style="font-weight:700;">' + money(c.salaryCents) + '</td>'
      + '<td class="fin-comp-td num">' + (delta === 0 ? 'no change' : moneySigned(delta)) + '</td>'
      + '<td class="fin-comp-td" style="font-size:.78rem;font-weight:600;color:' + TONE[vs.tone] + ';" title="District scale ' + (c.worksheetCents ? money(c.worksheetCents) : 'not available') + '">' + vs.text + '</td>'
      + '<td class="fin-comp-td" style="font-size:.78rem;font-weight:600;color:' + TONE[vsMed.tone] + ';" title="LCMS market median ' + (lcms && lcms.midCents ? money(lcms.midCents) : 'no report') + '">' + vsMed.text + '</td>'
      + '<td class="fin-comp-td num" style="font-weight:700;">' + money(c.churchCostCents) + '</td></tr>';
  }).join('');
  return '<div class="fin-card" style="padding:28px 32px;">'
    + '<div class="fin-comp-cardhd">'
    + '<div><div class="fin-card-title" style="font-size:26px;margin:0;">FY' + targetYear() + ' Compensation &mdash; Council summary</div>'
    + '<div class="fin-card-sub" style="margin:0;">' + methodSummary(m) + '</div></div>'
    + '<a class="btn-secondary" href="/?section=compensation&amp;page=council&amp;print=1" target="_blank" rel="noopener"' + act('printCouncil') + '>Print</a></div>'
    + '<div class="fin-comp-counciltiles">'
    + '<div class="fin-comp-ctile"><span class="fin-comp-tile-lbl">Cash salaries</span><span class="fin-comp-ctile-val">' + money(totals.salaryCents) + '</span></div>'
    + '<div class="fin-comp-ctile"><span class="fin-comp-tile-lbl">Benefits &amp; taxes</span><span class="fin-comp-ctile-val">' + money(totals.benefitsCents) + '</span></div>'
    + '<div class="fin-comp-ctile mist"><span class="fin-comp-tile-lbl teal">FY' + targetYear() + ' total</span><span class="fin-comp-ctile-val">' + money(totals.totalCents) + '</span></div>'
    + '<div class="fin-comp-ctile navy"><span class="fin-comp-tile-lbl">vs FY' + baseYear() + ' ' + money(totals.baselineCents) + '</span>'
    + '<span class="fin-comp-ctile-val gold">' + (totals.baselineCents ? moneySigned(totals.deltaCents) + ' (' + (change >= 0 ? '+' : '') + change.toFixed(1) + '%)' : '&mdash;') + '</span></div>'
    + '</div>'
    + '<div class="fin-comp-scroll"><table class="fin-comp-table" style="min-width:860px;font-size:.86rem;">'
    + '<thead><tr><th class="fin-comp-th">Worker</th><th class="fin-comp-th num">FY' + baseYear() + '</th><th class="fin-comp-th num">FY' + targetYear() + '</th>'
    + '<th class="fin-comp-th num">Change</th><th class="fin-comp-th">Vs. district scale</th><th class="fin-comp-th">Vs. LCMS median</th><th class="fin-comp-th num">Total cost</th></tr></thead>'
    + '<tbody>' + rows
    + '<tr class="fin-comp-total-row"><td class="fin-comp-td">Total</td>'
    + '<td class="fin-comp-td num" style="color:var(--warm-gray);">' + money(totals.currentCents) + '</td>'
    + '<td class="fin-comp-td num">' + money(totals.salaryCents) + '</td>'
    + '<td class="fin-comp-td num">' + (salaryDelta === 0 ? 'no change' : moneySigned(salaryDelta)) + '</td>'
    + '<td class="fin-comp-td" style="font-size:.78rem;font-weight:600;color:' + TONE[scaleTotal.tone] + ';" title="District scale ' + money(totals.worksheetCents) + '">' + scaleTotal.text + '</td>'
    + '<td class="fin-comp-td" style="font-size:.78rem;font-weight:600;color:' + TONE[medText.tone] + ';" title="LCMS market median ' + money(med.medCents) + '">' + medText.text + '</td>'
    + '<td class="fin-comp-td num">' + money(totals.totalCents) + '</td></tr>'
    + '</tbody></table></div>'
    + benefitBreakdown(m, computed, totals)
    + '<div style="font-size:.78rem;color:var(--warm-gray);border-top:1px solid var(--warm-row-divider);padding-top:14px;margin-top:14px;">Built on '
    + esc(m.sourceDoc('districtSource')) + ' &middot; ' + esc(m.sourceDoc('concordiaSource')) + ' &middot; ' + esc(m.sourceDoc('quoteSource')) + '</div>'
    + '</div>';
}
