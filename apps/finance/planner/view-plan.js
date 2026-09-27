// Header strip, tabs, and view 1 · Set pay (the method table, the base-year comparison note and
// the selected-worker panel), ported from legacy js-finance.js finCompHeaderHtml,
// finCompRenderPlan, finCompRender*BaselineNote and finCompRenderDrawer. Same figures, same words.
import { S, model, baseYear, targetYear, isAdmin, canEdit, canEditPlanControls, isCouncil } from './state.js';
import { esc, money, moneySigned, pct, dollars, vsScaleText } from './format.js';
import { act, onInput, onChange, readOnly, readOnlyUnless, option } from './ui.js';
import {
  COMP_METHOD_KEYS, healthTierLabel,
} from '../compensation-projection.js';
import {
  HEALTH_PLAN_QUOTE_2027, FIN_HEALTH_TIERS, FIN_SALARY_PAY_PERIODS, LCMS_COMMISSIONED_TRACKS, LCMS_OTHER_WORKER_TRACKS,
  LCMS_ATTENDANCE_BONUS_BANDS, LCMS_RESPONSIBILITY_STIPENDS, LCMS_PASTOR_MULTIPLIERS, finLcmsMultiplierFor,
  finComputeHealthPlanTotalCents,
} from '../compensation-calc.js';

export const VIEWS = [
  { key: 'plan', label: '1 &middot; Set pay' },
  { key: 'fairness', label: '2 &middot; Check fairness' },
  { key: 'health', label: '3 &middot; Health plan' },
  { key: 'rates', label: 'This year&#39;s rates' },
  { key: 'council', label: 'Council summary' },
];
const EDUCATION = [
  { key: 'none', label: 'Not recorded' }, { key: 'hs', label: 'High school' },
  { key: 'associates', label: 'Associate&#39;s' }, { key: 'bachelors', label: 'Bachelor&#39;s' },
  { key: 'masters', label: 'Master&#39;s' }, { key: 'mdiv', label: 'M.Div.' }, { key: 'doctorate', label: 'Doctorate' },
];
export const TONE = { good: 'var(--sage-text)', warn: 'var(--deep-amber)', bad: 'var(--danger)', muted: 'var(--warm-gray)', none: 'var(--warm-gray)' };

export const isPartTime = (m, w) => m.ftePct(w) < 100;
export function educationLabel(w) {
  const e = EDUCATION.filter((x) => x.key === (w.education || 'none'))[0];
  return e && e.key !== 'none' ? e.label : '';
}
// The worksheet multiplier shown in the panel's "base × multiplier" line (legacy finCompMultiplier).
function multiplier(w) {
  let track;
  if (w.role === 'pastor') track = { multipliers: LCMS_PASTOR_MULTIPLIERS, growBeyond: 0.02 };
  else if (w.role === 'commissioned') track = LCMS_COMMISSIONED_TRACKS[w.trackKey];
  else track = LCMS_OTHER_WORKER_TRACKS[w.trackKey];
  const scale = track ? finLcmsMultiplierFor(track, w.yearsExperience) : 0;
  return Math.round((scale + (Number(w.responsibilityStipend) || 0) + (Number(w.attendanceBonus) || 0)) * 1000) / 1000;
}
export const planTotal = (key, counts) => finComputeHealthPlanTotalCents(key, S.plan.premiumOverrides, counts);

export function methodSummary(m) {
  const base = m.baseSalary(targetYear());
  const plan = planTotal(S.plan.healthPlanOption);
  const n = m.countedEntries().length;
  const ext = m.externallyFundedWorkers().length;
  return 'Salaries by ' + m.methodLongLabel(S.plan.method)
    + ' &middot; district base $' + dollars(base.dollars)
    + ' &middot; pension ' + pct(m.pensionRate(targetYear()).rate)
    + ' &middot; ' + esc(plan ? plan.label : 'no plan selected')
    + ' &middot; ' + n + ' worker' + (n === 1 ? '' : 's')
    + (ext ? ' &middot; ' + ext + ' paid from another budget' : '');
}

function saveStatus() {
  const s = S.saveState;
  if (!s) return '';
  if (s === 'saving') return '<span class="fin-comp-save">Saving…</span>';
  if (s === 'saved') return '<span class="fin-comp-save">Saved automatically.</span>';
  if (s === 'draft') return '<span class="fin-comp-save">Saved to your council draft.</span>';
  return '<span class="fin-comp-save err">' + esc(s) + '</span>';
}

export function headerHtml(m, totals) {
  const change = totals.baselineCents ? (totals.deltaCents / totals.baselineCents * 100) : null;
  const pills = VIEWS.map((v) => '<span class="fin-comp-pill' + (S.view === v.key ? ' active' : '') + '"' + act('view', { v: v.key }) + '>' + v.label + '</span>').join('');
  const councilNote = isCouncil()
    ? '<div class="fin-comp-note" style="margin-bottom:8px;">'
      + (S.config.preview
        ? 'Council preview: this is what a council member sees. Nothing here can be changed while previewing.'
        : canEditPlanControls()
          ? 'You can choose a raise method and adjust the custom/scale percentages below &mdash; saved to your own council plan, never the church&#39;s actual roster or another council member&#39;s plan. Names, positions, current pay and every other figure here are read-only.'
          : 'This view is read-only for your account. Every figure here reflects the church&#39;s actual compensation plan.')
      + '</div>'
    : '';
  return '<div class="fin-comp-shell">'
    + councilNote
    + '<div class="fin-comp-titlebar">'
    + '<div><div class="fin-comp-title">Compensation Planner &mdash; FY' + targetYear() + '</div>'
    + '<div class="fin-comp-subtitle">' + methodSummary(m) + '</div></div>'
    + '<div class="fin-comp-actions">' + saveStatus()
    + '<a class="btn-secondary" href="/?section=compensation&amp;page=council&amp;print=1" target="_blank" rel="noopener"' + act('printCouncil') + '>Print for Council</a>'
    + (isAdmin() ? '<button type="button" class="btn-primary"' + act('sendToBudget') + '>Send to FY' + targetYear() + ' budget</button>' : '')
    + '</div></div>'
    + '<div class="fin-comp-strip">'
    + '<div><div class="fin-comp-strip-lbl">Cash salaries</div><div class="fin-comp-strip-val">' + money(totals.salaryCents) + '</div></div>'
    + '<div><div class="fin-comp-strip-lbl">Benefits &amp; taxes</div><div class="fin-comp-strip-val">' + money(totals.benefitsCents) + '</div></div>'
    + '<div><div class="fin-comp-strip-lbl">FY' + targetYear() + ' total</div><div class="fin-comp-strip-val">' + money(totals.totalCents) + '</div></div>'
    + '<div class="fin-comp-strip-delta"><div class="fin-comp-strip-lbl">vs FY' + baseYear() + ' ' + money(totals.baselineCents)
    + (totals.baseline && totals.baseline.anyAnnualized ? ' (annualized)' : '') + '</div>'
    + '<div class="fin-comp-strip-val gold">' + (totals.baselineCents ? moneySigned(totals.deltaCents) + ' (' + (change >= 0 ? '+' : '') + change.toFixed(1) + '%)' : '&mdash;') + '</div></div>'
    + '</div>'
    + '<div class="fin-comp-pills">' + pills + '</div>'
    + (S.toast ? '<div class="fin-comp-toast"><span>' + esc(S.toast) + '</span><span class="fin-comp-toast-x"' + act('dismissToast') + ' aria-label="Dismiss">&times;</span></div>' : '')
    + '</div>';
}

export function emptyRosterHtml(m) {
  return headerHtml(m, m.totals([]))
    + '<div class="fin-card" style="margin-top:14px;"><div class="fin-card-title">No staff on the roster yet</div>'
    + '<p class="fin-card-sub">Add the church&#39;s called and employed workers to start planning FY' + targetYear() + ' compensation.</p>'
    + (canEdit() ? '<button type="button" class="btn-primary"' + act('addWorker') + '>+ Add a staff member</button>' : '')
    + '</div>';
}

// ── View 1 — Set pay ─────────────────────────────────────────────────────────────────────────
export function renderPlan(m, computed, totals) {
  const p = S.plan;
  const roster = p.roster;
  const overrideCount = Object.keys(p.overrides).filter((k) => p.overrides[k] != null && p.overrides[k] !== '').length;
  const chips = COMP_METHOD_KEYS.map((k) => '<span class="fin-comp-chip' + (p.method === k ? ' active' : '') + '"' + act('methodAll', { k }) + '>' + esc(m.methodLabel(k)) + '</span>').join('');
  const heads = COMP_METHOD_KEYS.map((k) => '<th class="fin-comp-th num' + (p.method === k ? ' active' : '') + '"' + act('methodAll', { k }) + ' title="Apply to everyone">' + esc(m.methodLabel(k)) + '</th>').join('');
  const rows = roster.map((w, i) => {
    const c = computed[i];
    const cells = COMP_METHOD_KEYS.map((k) => {
      const v = m.methodSalaryCents(w, k);
      const isActive = !c.overridden && c.methodKey === k;
      const isEdited = c.overridden && c.methodKey === k;
      return '<td class="fin-comp-td num' + (isActive ? ' active' : '') + (isEdited ? ' edited' : '') + '"' + act('methodOne', { i, k }) + '>'
        + (v == null ? '&mdash;' : (isEdited ? money(c.salaryCents) + ' &#9998;' : money(v))) + '</td>';
    }).join('');
    const vs = vsScaleText(c.salaryCents, c.worksheetCents);
    const selected = i === S.selected && S.drawerOpen;
    const part = isPartTime(m, w);
    return '<tr class="fin-comp-row' + (selected ? ' selected' : '') + '">'
      + '<td class="fin-comp-td fin-comp-who"' + act('select', { i }) + '>'
      + '<div style="font-weight:700;color:var(--color-navy);">' + esc(w.name || '(unnamed)') + '</div>'
      + '<div style="font-size:.72rem;color:var(--warm-gray);">' + esc(w.position || 'Role not set') + ' &middot; acct ' + (w.accountCode ? esc(w.accountCode) : '&mdash;')
      + (part ? ' &middot; <span style="color:var(--deep-amber);font-weight:700;">' + m.ftePct(w) + '% time</span>' : '')
      + (m.isCashOnly(w) ? ' &middot; <span style="color:var(--warm-meta);">cash only</span>' : '')
      + (m.isExternallyFunded(w) ? ' &middot; <span style="color:var(--deep-amber);font-weight:700;">paid from another budget</span>' : '') + '</div></td>'
      + cells
      + '<td class="fin-comp-td" style="font-size:.76rem;font-weight:600;color:' + TONE[vs.tone] + ';" title="District scale ' + (c.worksheetCents ? money(c.worksheetCents) : 'not available') + (part ? ' (pro-rated to ' + m.ftePct(w) + '% time)' : '') + '">' + vs.text + (part ? '<br><span style="font-weight:400;color:var(--warm-gray);">at ' + m.ftePct(w) + '% time</span>' : '') + '</td>'
      + '<td class="fin-comp-td num" style="font-weight:700;">' + money(c.churchCostCents) + '</td>'
      + '</tr>';
  }).join('');
  const methodTotals = COMP_METHOD_KEYS.map((k) => {
    const t = m.countedEntries().reduce((s, e) => s + (m.methodSalaryCents(e.w, k) || 0), 0);
    return '<td class="fin-comp-td num' + (p.method === k ? ' active' : '') + '">' + money(t) + '</td>';
  }).join('');
  const scaleTotal = vsScaleText(totals.salaryCents, totals.worksheetCents);
  const base = m.baseSalary(targetYear());
  const table = '<div class="fin-comp-scroll"><table class="fin-comp-table" style="min-width:760px;">'
    + '<thead><tr><th class="fin-comp-th">Worker</th>' + heads
    + '<th class="fin-comp-th">Vs. district scale</th><th class="fin-comp-th num">Total comp.</th></tr></thead>'
    + '<tbody>' + rows
    + (canEdit() ? '<tr><td colspan="' + (COMP_METHOD_KEYS.length + 3) + '" style="padding:9px 6px;"><span class="fin-comp-add"' + act('addWorker') + '><span class="fin-comp-add-plus">+</span> Add a staff member</span></td></tr>' : '')
    + '<tr class="fin-comp-total-row"><td class="fin-comp-td">Total</td>' + methodTotals
    + '<td class="fin-comp-td" style="font-size:.76rem;font-weight:600;color:' + TONE[scaleTotal.tone] + ';" title="District scale ' + money(totals.worksheetCents) + '">' + scaleTotal.text + '</td>'
    + '<td class="fin-comp-td num">' + money(totals.totalCents) + '</td></tr>'
    + '</tbody></table></div>';
  // Negative values are allowed in the custom box: a pay cut.
  const customBox = '<label class="fin-comp-inline">custom '
    + '<input type="text" inputmode="decimal" id="cp-custom-pct" value="' + (Number(p.customPct) || 0) + '"' + onInput('customPct', {}, 'decimal') + ' style="width:52px;text-align:right;">%</label>'
    + '<label class="fin-comp-inline">of scale '
    + '<input type="text" inputmode="decimal" id="cp-scale-pct" value="' + (Number(p.scalePct) || 0) + '"' + onInput('scalePct', {}, 'decimal') + ' style="width:52px;text-align:right;">%</label>';
  return '<div class="fin-comp-plan-grid' + (S.drawerOpen ? '' : ' closed') + '">'
    + '<div class="fin-card" style="min-width:0;">'
    + '<div class="fin-comp-chiprow">'
    + '<span class="fin-comp-chiprow-lbl">Applied to everyone</span>'
    + '<span style="display:flex;gap:6px;flex-wrap:wrap;">' + chips + '</span>'
    + readOnlyUnless(customBox, canEditPlanControls())
    + '<span style="font-size:.74rem;color:var(--warm-gray);">Click a column for everyone, a cell for one person, or type an exact figure in the panel. A negative custom % is a pay cut.</span>'
    + (overrideCount ? '<span class="fin-comp-link"' + act('clearOverrides') + '>&#8634; clear ' + overrideCount + ' hand-set figure(s)</span>' : '')
    + '</div>'
    + table
    + baselineNote(m, totals)
    + '<div class="fin-comp-cardfoot">'
    + '<span style="font-size:.74rem;color:var(--warm-gray);">District Scale = the District Compensation Worksheet &mdash; base $' + dollars(base.dollars) + ' &times; each worker&#39;s role/experience multiplier. <span class="fin-comp-link"' + act('view', { v: 'rates' }) + '>Rates for this year</span></span>'
    + '<button type="button" class="btn-primary"' + act('view', { v: 'fairness' }) + '>Next: check fairness &rarr;</button>'
    + '</div></div>'
    + (S.drawerOpen && roster[S.selected] ? drawer(m, computed) : '')
    + '</div>';
}

function basisPicker() {
  const pill = (key, label) => {
    const active = S.plan.baseYearBasis === key;
    return '<span class="fin-comp-pill' + (active ? ' active' : '') + '"' + (active ? '' : act('basis', { k: key })) + '>' + label + '</span>';
  };
  return '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:8px;">'
    + '<span style="font-size:.74rem;color:var(--warm-gray);">Compare FY' + targetYear() + ' against:</span>'
    + pill('roster', 'the same roster at FY' + baseYear() + ' rates')
    + pill('ledger', 'FY' + baseYear() + ' ledger accounts')
    + '</div>';
}

// The roster basis prints its own working and keeps the ledger figure visible underneath, so
// switching basis never hides a number that was there a moment ago.
function rosterBaselineNote(m, totals) {
  const r = totals.baseline;
  const ledger = m.ledgerBaselineDetail();
  const n = m.countedEntries().length;
  const planLabel = (HEALTH_PLAN_QUOTE_2027.options[r.planOption] || {}).label || r.planOption;
  const salDelta = totals.salaryCents - r.salaryCents;
  const benDelta = totals.benefitsCents - r.benefitCents;
  const row = (label, base, plan) => {
    const d = plan - base;
    return '<tr><td style="padding:2px 8px 2px 0;">' + label + '</td>'
      + '<td style="padding:2px 8px;text-align:right;">' + money(base) + '</td>'
      + '<td style="padding:2px 8px;text-align:right;">' + money(plan) + '</td>'
      + '<td style="padding:2px 0 2px 8px;text-align:right;font-weight:700;color:' + (d === 0 ? 'var(--warm-gray)' : 'var(--charcoal)') + ';">' + (d === 0 ? 'no change' : moneySigned(d)) + '</td></tr>';
  };
  return '<div class="fin-comp-basis">'
    + basisPicker()
    + '<b>FY' + baseYear() + ' is the same ' + n + ' worker(s), costed at FY' + baseYear() + ' rates.</b> '
    + 'Same model as FY' + targetYear() + ' &mdash; each worker&rsquo;s current pay, pension at '
    + pct(m.pensionRate(baseYear()).rate) + ', disability, employer FICA, and the health plan in force then ('
    + esc(planLabel) + '). So &ldquo;No raise&rdquo; lands at nothing changed, and anything left is a real rate or premium move.'
    + '<table class="fin-comp-mini"><thead><tr><th></th><th>FY' + baseYear() + '</th><th>FY' + targetYear() + '</th><th>Change</th></tr></thead><tbody>'
    + row('Cash salaries', r.salaryCents, totals.salaryCents)
    + row('Benefits &amp; taxes', r.benefitCents, totals.benefitsCents)
    + '</tbody></table>'
    + '<div style="font-size:.72rem;color:var(--warm-gray);">'
    + (salDelta === 0 ? 'Salaries are unchanged, as expected under this method. ' : '')
    + (benDelta !== 0 ? 'Benefits move ' + moneySigned(benDelta) + ' on rates alone &mdash; pension ' + pct(m.pensionRate(baseYear()).rate) + ' &rarr; ' + pct(m.pensionRate(targetYear()).rate) + ', plus the premium renewal.' : '')
    + '</div>'
    + '<div style="font-size:.72rem;color:var(--warm-gray);margin-top:8px;border-top:1px solid var(--warm-row-divider);padding-top:6px;">'
    + (m.hasBaseLedger
      ? 'For reference, the FY' + baseYear() + ' <b>ledger</b> spent ' + money(ledger.cents)
        + ' across every account named like payroll or health &mdash; ' + money(Math.abs(ledger.cents - r.cents))
        + (ledger.cents > r.cents ? ' more' : ' less') + ' than these ' + n + ' worker(s) cost. '
        + 'That is a different population (daycare and MDO staff, supply preachers, nursery wages sit in the same accounts), which is why it is not what the plan is measured against. '
        + '<span class="fin-comp-link"' + act('basis', { k: 'ledger' }) + '>Compare against the ledger instead</span>'
      : 'The FY' + baseYear() + ' church ledger could not be read just now, so the ledger comparison is unavailable.')
    + '</div></div>';
}

function baselineNote(m, totals) {
  if (totals.baseline && totals.baseline.basis === 'roster') return rosterBaselineNote(m, totals);
  const b = totals.baseline || { rows: [], unmatchedRows: [], countedRows: [], prorated: false, weeks: 52 };
  const n = m.countedEntries().length;
  const planParts = 'cash salaries ' + money(totals.salaryCents) + ' + benefits &amp; taxes ' + money(totals.benefitsCents)
    + ' (pension, disability, health, employer FICA)';
  if (!b.rows.length) {
    return '<div class="fin-comp-basis">' + basisPicker() + '<b>vs FY' + baseYear() + ':</b> no compensation accounts were found in the FY' + baseYear()
      + ' church ledger, so there is nothing to compare against. FY' + targetYear() + ' is ' + planParts
      + '. Import or sync that year on the Data pages first.</div>';
  }
  const list = (rows) => '<ul class="fin-comp-basis-list">' + rows.map((r) => '<li>' + esc(r.label) + ' &middot; ' + money(r.cents)
    + ' <span style="color:var(--warm-gray);">(' + r.basis + (r.rosterNames.length ? ' &middot; ' + esc(r.rosterNames.join(', ')) : '') + ')</span></li>').join('') + '</ul>';
  const matchedSalary = b.rows.filter((r) => r.kind === 'salary' && r.rosterNames.length);
  const pooled = b.rows.filter((r) => r.kind === 'benefit');
  // Which side the difference is on, before the account list: a salary gap and a benefits gap have
  // completely different causes.
  const salDelta = totals.salaryCents - b.salaryCents;
  const benDelta = totals.benefitsCents - b.benefitCents;
  const cmpRow = (label, planCents, baseCents, delta) => {
    const color = delta === 0 ? 'var(--warm-gray)' : (delta > 0 ? 'var(--charcoal)' : 'var(--deep-amber)');
    return '<tr><td style="padding:2px 8px 2px 0;">' + label + '</td>'
      + '<td style="padding:2px 8px;text-align:right;">' + money(baseCents) + '</td>'
      + '<td style="padding:2px 8px;text-align:right;">' + money(planCents) + '</td>'
      + '<td style="padding:2px 0 2px 8px;text-align:right;font-weight:700;color:' + color + ';">' + moneySigned(delta) + '</td></tr>';
  };
  let out = '<div class="fin-comp-basis">'
    + basisPicker()
    + '<b>How the FY' + baseYear() + ' comparison is figured.</b> '
    + 'FY' + targetYear() + ' is ' + planParts + ', for the ' + n + ' worker(s) counted above. '
    + 'FY' + baseYear() + ' is the same cost categories from the church ledger.'
    + '<table class="fin-comp-mini"><thead><tr><th>Where the difference is</th><th>FY' + baseYear() + ' ledger</th><th>FY' + targetYear() + ' plan</th><th>Difference</th></tr></thead><tbody>'
    + cmpRow('Salaries', totals.salaryCents, b.salaryCents, salDelta)
    + cmpRow('Benefits &amp; taxes', totals.benefitsCents, b.benefitCents, benDelta)
    + '</tbody></table>'
    + '<div style="font-size:.72rem;color:var(--warm-gray);margin-bottom:6px;">'
    + (Math.abs(benDelta) > Math.abs(salDelta)
      ? 'Most of the gap is on the <b>benefits</b> side: the FY' + baseYear() + ' ledger carries ' + money(Math.abs(benDelta)) + ' ' + (benDelta < 0 ? 'more' : 'less') + ' in pension, health and employer taxes than this plan computes. That usually means the ledger accounts cover people or coverage the roster does not model &mdash; check the pooled accounts listed below against who is actually on the plan in step 3.'
      : 'Most of the gap is on the <b>salary</b> side: the FY' + baseYear() + ' ledger carries ' + money(Math.abs(salDelta)) + ' ' + (salDelta < 0 ? 'more' : 'less') + ' in wages than this plan. That usually means a salary account nobody on this roster is paid from &mdash; see the unmatched accounts below.')
    + '</div>';
  if (matchedSalary.length) out += '<div class="fin-comp-basis-h">Salaries for people on this roster</div>' + list(matchedSalary);
  if (pooled.length) out += '<div class="fin-comp-basis-h">Pooled benefits &amp; taxes (charged for the whole staff on one line, so they cannot be split per person)</div>' + list(pooled);
  if (b.unmatchedRows.length) {
    out += '<div class="fin-comp-basis-h warn">Salaries for people NOT on this roster &mdash; ' + money(b.unmatchedCents)
      + (b.rosterOnly ? ' (not counted)' : ' (counted)') + '</div>'
      + '<div>No worker counted above is paid from ' + (b.unmatchedRows.length === 1 ? 'this account' : 'these accounts')
      + '. That is a departed or vacant post, a worker missing from the roster, or someone excluded as paid from another budget'
      + ' &mdash; and while it is counted, the base year covers more people than the plan does, so the plan reads cheaper than it is.</div>'
      + list(b.unmatchedRows)
      + (canEditPlanControls() && b.canRosterOnly
        ? '<div><span class="fin-comp-link"' + act('rosterOnly') + '>'
          + (b.rosterOnly ? '&#8634; count these accounts again' : 'Leave these out and compare like for like &rarr;') + '</span></div>'
        : '');
  } else {
    out += '<div>Every salary account found is one a worker counted above is paid from, so both sides cover the same people.</div>';
  }
  out += '<div style="margin-top:7px;">'
    + (b.prorated
      ? 'FY' + baseYear() + ' is still in progress (' + b.weeks.toFixed(0) + ' weeks in), so an account with no budget on file is annualized from its actual &mdash; the same 52/weeks the Budget tab uses. Both sides are a full year. '
      : 'FY' + baseYear() + ' is complete, so these are its own full-year figures. ')
    + '<b>What this still cannot see:</b> an account the church names in some other way is not counted at all, '
    + 'and a pooled benefit line covers everyone the church paid that year, including anyone listed above as not on this roster.'
    + '</div></div>';
  return out;
}

// Budget-line choices: every expense leaf of the base-year ledger with a leading account code,
// shown under its chart-of-accounts display name.
function accountOptions(selectedCode) {
  const leaves = [];
  (function walk(nodes) { (nodes || []).forEach((n) => { if (!n.children.length && n.classification !== 'Income') leaves.push(n); walk(n.children); }); })(S.baseTree);
  const seen = {};
  const opts = [{ code: '', label: 'Not linked to a budget line' }];
  leaves.forEach((n) => {
    const mm = String(n.label).match(/^\s*(\d{3,8})/);
    if (!mm || seen[mm[1]]) return;
    seen[mm[1]] = true;
    opts.push({ code: mm[1], label: esc(S.accountLabels[n.path] || n.label) });
  });
  if (selectedCode && !seen[selectedCode]) opts.push({ code: selectedCode, label: esc(selectedCode) + ' (not in this year&#39;s budget)' });
  return opts;
}

const payRow = (label, value) => '<div class="fin-comp-payrow"><span>' + label + '</span><b>' + value + '</b></div>';

// The worker panel. Rebuilt wholesale on every render so every select and checkbox follows the
// selected worker.
function drawer(m, computed) {
  const i = S.selected;
  const w = S.plan.roster[i];
  const c = computed[i];
  const b = c.benefits;
  const d = { i };
  const acctOptions = accountOptions(w.accountCode).map((a) => option(a.code, a.label, String(a.code) === String(w.accountCode || ''))).join('');
  const trackSet = w.role === 'commissioned' ? LCMS_COMMISSIONED_TRACKS : w.role === 'other' ? LCMS_OTHER_WORKER_TRACKS : null;
  const trackField = trackSet ? '<label class="fin-comp-field">' + (w.role === 'commissioned' ? 'Education track (district scale)' : 'Worker type (district scale)')
    + '<select' + onChange('field', { i, f: 'trackKey' }) + '>'
    + Object.keys(trackSet).map((k) => option(k, esc(trackSet[k].label), k === w.trackKey)).join('')
    + '</select></label>' : '';
  const eduField = '<label class="fin-comp-field">Education<select' + onChange('field', { i, f: 'education' }) + '>'
    + EDUCATION.map((e) => option(e.key, e.label, (w.education || 'none') === e.key)).join('') + '</select></label>';
  const attendanceField = w.role === 'pastor' ? '<label class="fin-comp-field">Attendance band<select' + onChange('attendance', d) + '>'
    + LCMS_ATTENDANCE_BONUS_BANDS.map((band) => {
      const mid = (band.range[0] + band.range[1]) / 2;
      const on = band.key === 'none' ? !Number(w.attendanceBonus) : Math.abs(mid - (Number(w.attendanceBonus) || 0)) < 0.001;
      return option(mid, esc(band.label) + (band.key === 'none' ? '' : ' (+' + (mid * 100).toFixed(1) + '%)'), on);
    }).join('') + '</select></label>' : '';
  const stipendKey = w.responsibilityStipendKey || 'none';
  const stipendField = '<label class="fin-comp-field">Responsibility stipend<select' + onChange('stipend', d) + '>'
    + LCMS_RESPONSIBILITY_STIPENDS.map((s) => option(s.key, esc(s.label)
      + (s.key === 'none' ? '' : ' (+' + (s.range[0] * 100).toFixed(0) + '&ndash;' + (s.range[1] * 100).toFixed(0) + '%)'), s.key === stipendKey)).join('')
    + '</select></label>';
  const stipendPctField = stipendKey !== 'none'
    ? '<label class="fin-comp-field">Stipend used %<input type="text" inputmode="decimal" id="cp-stipend-pct-' + i + '" value="' + (Math.round((Number(w.responsibilityStipend) || 0) * 10000) / 100) + '"' + onInput('stipendPct', d, 'decimal') + '></label>'
    : '';
  const stipendDef = LCMS_RESPONSIBILITY_STIPENDS.filter((s) => s.key === stipendKey)[0];
  const stipendNote = (stipendDef && stipendKey !== 'none')
    ? '<div class="fin-comp-note">Published range +' + (stipendDef.range[0] * 100).toFixed(0) + '% to +' + (stipendDef.range[1] * 100).toFixed(0) + '% &mdash; midpoint used, adjust within the range.</div>' : '';
  const roleNote = w.role === 'pastor'
    ? 'Pastors are scaled by years of service alone; education is recorded for the call documents and Concordia&#39;s tool.'
    : w.role === 'commissioned'
      ? 'The district scales commissioned workers by education track &mdash; that track is what changes the District Compensation Worksheet figure.'
      : 'The district publishes a separate scale per job type. Education is recorded but does not change the figure.';
  const payEntered = w.actualSalaryCents != null;
  const acctPayCents = m.accountBudgetCentsForCode(w.accountCode);
  const overridden = c.overridden;
  const part = isPartTime(m, w);
  const cashOnly = m.isCashOnly(w);
  const salaryBox = '<input type="text" inputmode="decimal" id="cp-salary-' + i + '" value="' + esc(overridden ? S.plan.overrides[i] : Math.round(c.salaryCents / 100)) + '"' + onInput('override', d, 'whole') + ' class="fin-comp-salary' + (overridden ? ' set' : '') + '">';
  // Each part escaped on its own, then joined with separator markup.
  const meta = [w.position, (Number(w.yearsExperience) || 0) + ' yrs', educationLabel(w), trackSet && trackSet[w.trackKey] ? trackSet[w.trackKey].label : '', w.accountCode ? 'budget line ' + w.accountCode : 'no budget line']
    .filter(Boolean).map((part2) => esc(String(part2).replace(/&#39;/g, "'"))).join(' &middot; ');
  const base = m.baseSalary(targetYear());
  const tier = m.healthTier(w);
  const fields = '<div class="fin-comp-fieldgrid">'
    + '<label class="fin-comp-field">Name<input type="text" id="cp-name-' + i + '" value="' + esc(w.name || '') + '"' + onInput('field', { i, f: 'name' }) + '></label>'
    + '<label class="fin-comp-field">Position<input type="text" id="cp-position-' + i + '" value="' + esc(w.position || '') + '"' + onInput('field', { i, f: 'position' }) + '></label>'
    + '<label class="fin-comp-field wide">Budget line<select' + onChange('field', { i, f: 'accountCode' }) + '>' + acctOptions + '</select></label>'
    + (S.purposeTags.length
      ? '<label class="fin-comp-field wide">Purpose tag<select' + onChange('field', { i, f: 'purposeTag' }) + '>'
        + option('', 'No tag', !w.purposeTag)
        + S.purposeTags.map((t) => option(t.id, esc(t.label), t.id === (w.purposeTag || ''))).join('')
        + '</select></label>'
      : '')
    + '<label class="fin-comp-field wide">FY' + baseYear() + ' current pay'
    + '<span style="display:inline-flex;align-items:center;gap:8px;">'
    + '<input type="text" inputmode="decimal" id="cp-curpay-' + i + '" value="' + (payEntered ? Math.round(w.actualSalaryCents / 100) : '') + '" placeholder="' + (acctPayCents != null ? Math.round(acctPayCents / 100) : 'not set') + '"' + onInput('currentPay', d, 'whole') + ' class="fin-comp-curpay' + (payEntered ? ' set' : '') + '">'
    + (payEntered ? '<span class="fin-comp-link"' + act('clearCurrentPay', d) + '>&#8634; use the budget line</span>' : '')
    + '</span></label>'
    + '</div>'
    + '<div class="fin-comp-note" style="color:' + ((payEntered || w.accountCode) ? 'var(--warm-gray)' : 'var(--deep-amber)') + ';">'
    + (payEntered
      ? 'Current pay is entered by hand, so the &ldquo;no raise&rdquo; column and every % growth are computed off ' + money(w.actualSalaryCents) + ' rather than the budget line. Use this when a worker&#39;s wages sit inside a line shared with other staff.'
      : w.accountCode
        ? 'FY' + baseYear() + ' current pay reads the whole Budget figure on ' + esc(w.accountCode) + '. If other staff are paid from that same line, type this worker&#39;s own wage above instead.'
        : 'Not linked and nothing entered &mdash; current pay reads as $0, so &ldquo;no raise&rdquo; and every % growth will too. Link a budget line or type the wage above.')
    + '</div>'
    + '<div class="fin-comp-drawer-h">District Compensation Worksheet inputs</div>'
    + '<div class="fin-comp-fieldgrid">'
    + '<label class="fin-comp-field">Role<select' + onChange('role', d) + '>'
    + option('pastor', 'Pastor', w.role === 'pastor') + option('commissioned', 'Commissioned', w.role === 'commissioned') + option('other', 'Other worker', w.role === 'other')
    + '</select></label>'
    + eduField + trackField
    + '<label class="fin-comp-field">Years of service<input type="text" inputmode="numeric" id="cp-years-' + i + '" value="' + (Number(w.yearsExperience) || 0) + '"' + onInput('years', d, 'whole') + '></label>'
    + attendanceField + stipendField + stipendPctField
    + '<label class="fin-comp-field">Time worked<span style="display:inline-flex;align-items:center;gap:4px;"><input type="text" inputmode="decimal" id="cp-fte-' + i + '" value="' + m.ftePct(w) + '"' + onInput('fte', d, 'decimal') + '><span style="color:var(--warm-gray);white-space:nowrap;">% of full time</span></span></label>'
    + '<label class="fin-comp-field">Health coverage<select' + onChange('healthTier', d) + (cashOnly ? ' disabled' : '') + '>'
    + FIN_HEALTH_TIERS.map((t) => option(t.key, esc(t.label), tier === t.key)).join('')
    + option('optout', 'Opts out (cash)', tier === 'optout')
    + '</select></label>'
    + '</div>'
    + '<label class="fin-comp-inline-check block"><input type="checkbox"' + onChange('toggle', { i, f: 'cashOnly' }) + (cashOnly ? ' checked' : '') + '> Cash salary only &mdash; no pension, disability or health</label>'
    + '<label class="fin-comp-inline-check block"><input type="checkbox"' + onChange('toggle', { i, f: 'externallyFunded' }) + (m.isExternallyFunded(w) ? ' checked' : '') + '> Paid from another budget &mdash; keep on the roster but leave out of every church figure</label>'
    + (m.isExternallyFunded(w) ? '<div style="font-size:.72rem;color:var(--deep-amber);margin-top:4px;">Costed elsewhere: this worker is in no total on this tab or in the Council report. The FY' + baseYear() + ' comparison figure still comes from the church payroll accounts as they stand.</div>' : '')
    + '<label class="fin-comp-inline-check block"><input type="checkbox"' + onChange('toggle', { i, f: 'hideFromCouncil' }) + (w.hideFromCouncil ? ' checked' : '') + '> Hide entirely from the council view &mdash; not shown, not on the Council report, not to a council login</label>'
    + (w.hideFromCouncil ? '<div style="font-size:.72rem;color:var(--deep-amber);margin-top:4px;">Hidden from council: this worker never appears in any Compensation Planner view or report a council member or the Council summary/print shows, and a council-role login never receives this row at all.</div>' : '')
    + (cashOnly
      ? '<div class="fin-comp-note">Concordia&rsquo;s plans have an hours floor, so a very part-time worker draws none of them. Employer FICA still applies &mdash; it is owed on any wage however few the hours.</div>'
      : (part ? '<div class="fin-comp-note">At ' + m.ftePct(w) + '% of full time this worker is still shown as benefits-eligible. Tick the box above if they are not.</div>' : ''))
    + '<div class="fin-comp-note">' + roleNote + '</div>' + stipendNote;
  const notEligible = '<span style="color:var(--warm-gray);font-weight:400;">not eligible</span>';
  return '<div class="fin-card fin-comp-drawer">'
    + '<div class="fin-comp-drawer-hd">'
    + '<div><div class="fin-comp-chiprow-lbl">Selected worker</div>'
    + '<div class="fin-comp-drawer-name">' + esc(w.name || '(unnamed)') + '</div>'
    + '<div class="fin-comp-note">' + meta + '</div></div>'
    + '<span class="fin-comp-close"' + act('closeDrawer') + ' aria-label="Close panel">&times;</span></div>'
    + '<div class="fin-comp-tiles">'
    + '<div class="fin-comp-tile"><span class="fin-comp-tile-lbl">FY' + baseYear() + '</span><span class="fin-comp-tile-val">' + money(c.currentCents) + '</span></div>'
    + '<div class="fin-comp-tile teal"><span class="fin-comp-tile-lbl">FY' + targetYear() + '</span><span class="fin-comp-tile-val">' + money(c.salaryCents) + '</span></div>'
    + '<div class="fin-comp-tile"><span class="fin-comp-tile-lbl">Per paycheck</span><span class="fin-comp-tile-val">' + money(c.salaryCents / FIN_SALARY_PAY_PERIODS) + '</span></div>'
    + '<div class="fin-comp-tile"><span class="fin-comp-tile-lbl">Church cost</span><span class="fin-comp-tile-val">' + money(c.churchCostCents) + '</span></div>'
    + '</div>'
    + readOnly(fields)
    + '<div class="fin-comp-bar cream"><span>District Compensation Worksheet result' + (part ? ' <span style="font-size:.72rem;">at ' + m.ftePct(w) + '% time</span>' : '') + '</span><b>$' + dollars(base.dollars) + ' &times; ' + multiplier(w).toFixed(3) + (part ? ' &times; ' + m.ftePct(w) + '%' : '') + ' = ' + (c.worksheetCents == null ? '&mdash;' : money(c.worksheetCents)) + '</b></div>'
    + '<div class="fin-comp-bar page"><span>FY' + targetYear() + ' salary</span><span style="display:inline-flex;align-items:center;gap:8px;"><span style="color:var(--warm-gray);">$</span>'
    + readOnly(salaryBox)
    + (overridden ? '<span class="fin-comp-link"' + act('clearOverride', d) + ' title="Back to the method figure">&#8634;</span>' : '') + '</span></div>'
    + '<div class="fin-comp-paylist">'
    + '<div class="fin-comp-drawer-h" style="border-top:1px solid var(--warm-row-divider);padding-top:12px;">What the church pays</div>'
    + payRow('Cash salary', money(c.salaryCents))
    + payRow('Pension ' + (b.cashOnly ? '' : pct(m.pensionRate(targetYear()).rate)), b.cashOnly ? notEligible : money(b.pensionCents))
    + payRow('Health', b.cashOnly ? notEligible : money(b.healthCents))
    + payRow('Disability' + (b.cashOnly ? '' : ' <label class="fin-comp-inline-check">' + readOnly('<input type="checkbox"' + onChange('toggle', { i, f: 'hasDependents' }) + (w.hasDependents ? ' checked' : '') + '>') + ' dependents</label>'), b.cashOnly ? notEligible : money(b.disabilityCents))
    + payRow('Employer FICA <label class="fin-comp-inline-check">' + readOnly('<input type="checkbox"' + onChange('toggle', { i, f: 'selfEmployedFica' }) + (w.selfEmployedFica ? ' checked' : '') + '>') + ' minister</label>', money(b.ficaCents))
    + (w.selfEmployedFica ? '<div class="fin-comp-seca"><span>Employer half the worker covers themselves &mdash; ' + pct(m.ficaRate()) + ' of ' + money(c.salaryCents) + '<br><span style="font-size:.7rem;color:var(--warm-meta);">As a minister they pay SECA, so this employer share comes out of their own pay. It is in no total below. The employee half is not shown; everyone pays that.</span></span><b style="color:var(--deep-amber);">&minus;' + money(b.secaSelfCents) + '</b></div>' : '')
    + '<div class="fin-comp-payrow total"><span>Total</span><b>' + money(c.churchCostCents) + '</b></div>'
    + '</div>'
    + (canEdit() ? '<button type="button" class="btn-secondary fin-comp-remove"' + act('removeWorker', d) + '>Remove this worker</button>' : '')
    + '</div>';
}

export { healthTierLabel };
