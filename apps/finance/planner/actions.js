// Every change the planner can make, ported from legacy js-finance.js's finComp* handlers with the
// same effects and the same confirmation messages. Markup names an action with data-act (click),
// data-input (typing) or data-change (selects and checkboxes); main.js looks it up here.
//
// `who` gates each action: 'plan' is the raise plan council may steer with edit permission,
// 'edit' is everything else about the roster and rates (admin/compensation only), 'view' changes
// nothing that is saved. The server enforces the same split; this only keeps controls honest.
import { S, model, baseYear, targetYear } from './state.js';
import { money } from './format.js';
import { FIN_COMP_PLAN_KEYS } from '../compensation-projection.js';
import { finDefaultSelfEmployedFica, LCMS_RESPONSIBILITY_STIPENDS, finRoundSalaryCents } from '../compensation-calc.js';

const say = (msg) => { S.toast = msg; };
const plan = () => S.plan;
const worker = (ds) => plan().roster[Number(ds.i)];
const idx = (ds) => Number(ds.i);
const PCT_REF_FIELDS = { pensionPct: 1, ficaPct: 1, disabilityDepsPct: 1, disabilityNoDepsPct: 1, ssaColaPct: 1 };
const centsOrNull = (value) => {
  const cents = value === '' ? null : Math.round(parseFloat(value) * 100);
  return cents == null || !Number.isFinite(cents) ? null : cents;
};

// Shifts per-worker maps (keyed by roster index) down past a removed worker, so nobody inherits
// their neighbor's method or hand-set figure.
function reindexAfterRemoval(map, removed) {
  const out = {};
  Object.keys(map || {}).forEach((k) => {
    const n = Number(k);
    if (n < removed) out[n] = map[k];
    else if (n > removed) out[n - 1] = map[k];
  });
  return out;
}

export const ACTIONS = {
  // ── Navigation (nothing saved) ──
  view: { who: 'view', run(ds) { S.view = ds.v; } },
  dismissToast: { who: 'view', run() { S.toast = ''; } },
  select: { who: 'view', run(ds) { S.selected = idx(ds); S.drawerOpen = true; } },
  closeDrawer: { who: 'view', run() { S.drawerOpen = false; } },
  ratesYear: { who: 'view', run(ds, value) { S.refYear = Number(value); } },

  // ── Raise plan (council may steer these) ──
  methodAll: { who: 'plan', save: true, run(ds) {
    const p = plan();
    p.method = ds.k; p.perWorkerMethod = {}; p.overrides = {};
    const n = model().countedEntries().length;
    say(model().methodLabel(ds.k) + ' applied to all ' + n + ' worker' + (n === 1 ? '' : 's') + '.');
  } },
  methodOne: { who: 'plan', save: true, run(ds) {
    const i = idx(ds), p = plan();
    p.perWorkerMethod[i] = ds.k;
    delete p.overrides[i];
    S.selected = i;
    const w = p.roster[i], m = model();
    say((w.name || 'Worker ' + (i + 1)) + ' → ' + m.methodLabel(ds.k) + ' (' + money(m.methodSalaryCents(w, ds.k)) + ').');
  } },
  customPct: { who: 'plan', save: true, run(ds, value) { plan().customPct = parseFloat(value) || 0; plan().method = 'custom'; } },
  scalePct: { who: 'plan', save: true, run(ds, value) { plan().scalePct = parseFloat(value) || 0; plan().method = 'scalepct'; } },
  basis: { who: 'plan', save: true, run(ds) {
    plan().baseYearBasis = ds.k === 'ledger' ? 'ledger' : 'roster';
    say(plan().baseYearBasis === 'roster'
      ? 'Comparing against the same roster costed at FY' + baseYear() + ' rates.'
      : 'Comparing against the FY' + baseYear() + ' ledger accounts.');
  } },
  rosterOnly: { who: 'plan', save: true, run() {
    plan().baselineRosterOnly = !plan().baselineRosterOnly;
    say(plan().baselineRosterOnly
      ? 'FY' + baseYear() + ' now counts only the accounts this roster is paid from.'
      : 'FY' + baseYear() + ' now counts every compensation account.');
  } },

  // ── Roster and hand-set figures (admin/compensation) ──
  clearOverrides: { who: 'edit', save: true, run() { plan().overrides = {}; say('Hand-set figures cleared.'); } },
  override: { who: 'edit', save: true, run(ds, value) { plan().overrides[idx(ds)] = value; } },
  clearOverride: { who: 'edit', save: true, run(ds) { delete plan().overrides[idx(ds)]; } },
  matchMidpoint: { who: 'edit', save: true, run(ds) {
    const i = idx(ds), w = plan().roster[i];
    const lcms = model().lcmsRange(w);
    if (!lcms || !lcms.midCents) return;
    const target = finRoundSalaryCents(lcms.midCents);
    plan().overrides[i] = String(Math.round(target / 100));
    say((w.name || 'Worker') + ' set to the LCMS midpoint — ' + money(target) + '.');
  } },
  addWorker: { who: 'edit', save: true, run() {
    plan().roster.push({
      name: 'New staff member', position: 'Role not set', role: 'other', trackKey: 'secretary',
      yearsExperience: 0, responsibilityStipend: 0, responsibilityStipendKey: 'none', attendanceBonus: 0,
      education: 'none', selfEmployedFica: false, hasDependents: false, healthMode: 'optout',
      healthEnrolled: false, accountCode: '', ftePct: 100, cashOnly: false, concordia: {},
    });
    S.selected = plan().roster.length - 1;
    S.drawerOpen = true;
    S.view = 'plan';
    say('Row added — set the role and years of service in the panel.');
  } },
  removeWorker: { who: 'edit', save: true, confirm: (ds) => 'Remove ' + ((worker(ds) || {}).name || 'this worker') + ' from the roster?', run(ds) {
    const i = idx(ds), p = plan();
    const name = p.roster[i] && p.roster[i].name;
    p.roster.splice(i, 1);
    p.perWorkerMethod = reindexAfterRemoval(p.perWorkerMethod, i);
    p.overrides = reindexAfterRemoval(p.overrides, i);
    if (S.selected >= p.roster.length) S.selected = Math.max(0, p.roster.length - 1);
    say((name || 'Worker') + ' removed.');
  } },
  field: { who: 'edit', save: true, run(ds, value) { worker(ds)[ds.f] = value; } },
  years: { who: 'edit', save: true, run(ds, value) { worker(ds).yearsExperience = Math.max(0, parseInt(value, 10) || 0); } },
  // A new role resets the track to that role's default, zeroes a non-pastor's attendance bonus,
  // and resets SECA to the role's usual IRS treatment (still overridable).
  role: { who: 'edit', save: true, run(ds, value) {
    const w = worker(ds);
    w.role = value;
    w.trackKey = value === 'commissioned' ? 'ma' : value === 'other' ? 'secretary' : '';
    if (value !== 'pastor') w.attendanceBonus = 0;
    w.selfEmployedFica = finDefaultSelfEmployedFica(value);
  } },
  stipend: { who: 'edit', save: true, run(ds, value) {
    const s = LCMS_RESPONSIBILITY_STIPENDS.filter((x) => x.key === value)[0];
    worker(ds).responsibilityStipendKey = value;
    worker(ds).responsibilityStipend = s ? (s.range[0] + s.range[1]) / 2 : 0;
  } },
  stipendPct: { who: 'edit', save: true, run(ds, value) { worker(ds).responsibilityStipend = (parseFloat(value) || 0) / 100; } },
  attendance: { who: 'edit', save: true, run(ds, value) { worker(ds).attendanceBonus = parseFloat(value) || 0; } },
  fte: { who: 'edit', save: true, run(ds, value) {
    const n = parseFloat(value);
    worker(ds).ftePct = (Number.isFinite(n) && n > 0) ? Math.min(100, n) : 100;
  } },
  // A typed current pay beats the budget-line lookup for this worker only (for someone paid from a
  // line shared with other staff).
  currentPay: { who: 'edit', save: true, run(ds, value) {
    const w = worker(ds);
    const n = parseFloat(String(value == null ? '' : value).replace(/[^0-9.]/g, ''));
    if (String(value || '').trim() === '' || !Number.isFinite(n)) delete w.actualSalaryCents;
    else w.actualSalaryCents = Math.round(n * 100);
  } },
  clearCurrentPay: { who: 'edit', save: true, run(ds) { delete worker(ds).actualSalaryCents; } },
  toggle: { who: 'edit', save: true, run(ds, value) {
    const w = worker(ds);
    w[ds.f] = !!value;
    if (ds.f === 'externallyFunded') {
      say(value ? (w.name || 'That worker') + ' is now left out of every church figure.'
        : (w.name || 'That worker') + ' is counted in the church figures again.');
    }
    if (ds.f === 'hideFromCouncil') {
      say((w.name || 'That worker') + (value ? ' is now hidden from the council view entirely.' : ' is visible to council again.'));
    }
  } },
  // One of the four Concordia tiers or 'optout'; the older two-way flags are kept in step.
  healthTier: { who: 'edit', save: true, run(ds, value) {
    const w = worker(ds);
    w.healthTier = value;
    w.healthMode = value === 'optout' ? 'optout' : value === 'family' ? 'family' : 'employee';
    w.healthEnrolled = value !== 'optout';
  } },
  employeeOnly: { who: 'edit', save: true, run(ds, value) { worker(ds).employeeOnlyPremiumCents = centsOrNull(value); } },
  optOut: { who: 'edit', save: true, run(ds, value) { worker(ds).healthOptOutOverrideCents = centsOrNull(value); } },
  clearEmployeeOnly: { who: 'edit', save: true, run(ds) { worker(ds).employeeOnlyPremiumCents = null; } },
  pickPlan: { who: 'edit', save: true, run(ds, value) {
    const key = ds.k || value;
    if (FIN_COMP_PLAN_KEYS.includes(key)) plan().healthPlanOption = key;
  } },
  familySize: { who: 'edit', save: true, run(ds, value) { S.familySize = Math.max(1, Math.floor(parseFloat(value) || 1)); } },

  // ── This year's rates (admin/compensation). Percent fields store a fraction, money cents. ──
  ref: { who: 'edit', save: true, run(ds, value) {
    const refs = plan().referenceByYear;
    const year = Number(ds.y);
    if (!refs[year]) refs[year] = {};
    const row = refs[year];
    if (value === '' || !Number.isFinite(parseFloat(value))) { delete row[ds.f]; return; }
    row[ds.f] = PCT_REF_FIELDS[ds.f] ? parseFloat(value) / 100 : Math.round(parseFloat(value) * 100);
  } },
  // Provenance text and Concordia ranges feed nothing on this view, so typing into them saves
  // without re-rendering (no fight with the caret).
  refText: { who: 'edit', save: true, quiet: true, run(ds, value) {
    const refs = plan().referenceByYear;
    const year = Number(ds.y);
    if (!refs[year]) refs[year] = {};
    if (value === '') delete refs[year][ds.f];
    else refs[year][ds.f] = value;
  } },
  quote: { who: 'edit', save: true, run(ds, value) {
    const ov = plan().premiumOverrides;
    if (!ov[ds.k]) ov[ds.k] = {};
    const cents = centsOrNull(value);
    if (cents == null) delete ov[ds.k][ds.f];
    else ov[ds.k][ds.f] = cents;
  } },
  // Typing a tier rate also clears any older flat annual medical override for that option, or the
  // old figure would keep winning and the typed rate would appear to do nothing.
  tierRate: { who: 'edit', save: true, run(ds, value) {
    const ov = plan().premiumOverrides;
    if (!ov[ds.k]) ov[ds.k] = {};
    const row = ov[ds.k];
    if (!row.tiersMonthlyCents) row.tiersMonthlyCents = {};
    const cents = centsOrNull(value);
    if (cents == null) delete row.tiersMonthlyCents[ds.t];
    else row.tiersMonthlyCents[ds.t] = cents;
    delete row.medicalCents;
  } },
  range: { who: 'edit', save: true, quiet: true, run(ds, value) {
    const w = worker(ds);
    if (!w.concordia) w.concordia = {};
    w.concordia[ds.f] = value;
  } },

  // ── Header buttons ──
  // Handled in main.js (it opens the printable Council report once pending changes are saved).
  printCouncil: { who: 'view', run() {} },
  sendToBudget: { who: 'view', run() {
    say('In Finance, enter ' + money(model().totals(model().computeAll()).totalCents) + ' on Planning → Budget builder for FY' + targetYear() + '.');
  } },
};
