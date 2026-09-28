// The planner's one piece of state, and how it is loaded and saved.
//
// The saved plan is Connect's finance_salary_planner value, read and written through Finance's
// own relay routes (/api/v1/connect-planner/*), which re-check the viewer's Connect role on every
// call; Connect's contracts check it again. A council member's save becomes their private draft
// on the server, never the shared plan. The plan is held in compensation-projection.js's
// normalized shape so every figure comes from the same model Finance's other Compensation pages use.
import {
  normalizeCompensationPlan, councilRosterView, buildChurchAccountTree, createCompensationModel,
} from '../compensation-projection.js';

export const S = {
  config: null,          // { role, permissions: { compensation }, baseYear, targetYear, preview }
  loaded: false,
  error: '',
  saved: null,           // the plan exactly as read, so fields this page does not edit survive a save
  plan: null,            // normalizeCompensationPlan(saved)
  familySize: 2,         // legacy _finHealthFamilySize
  targetCategory: '',    // legacy _finSalaryTargetCategory, kept only to round-trip
  baseTree: null,        // base-year church ledger tree, or null when it could not be read
  accountLabels: {},     // chart-of-accounts display renames, keyed by account path
  purposeTags: [],
  view: 'plan',
  selected: 0,
  drawerOpen: false,     // the selected worker's editor, open beneath their row in Set pay
  refYear: null,         // year the rates view is editing; null = the target year
  toast: '',
  saveState: '',         // '' | 'saving' | 'saved' | error text
};

export const role = () => S.config.role;
export const isAdmin = () => role() === 'admin' && !S.config.preview;
// Admin and the compensation role edit the shared plan. Council preview (admin viewing as council)
// never edits.
export const canEdit = () => (role() === 'admin' || role() === 'compensation') && !S.config.preview;
export const isCouncil = () => role() === 'council' || !!S.config.preview;
// Council may steer the raise plan (methods, custom/scale percentages, the baseline toggle) when
// their Compensation permission is edit; the server enforces the same, keeping it their own draft.
export const canEditPlanControls = () => canEdit()
  || (role() === 'council' && S.config.permissions && S.config.permissions.compensation === 'edit');
export const canSave = () => canEdit() || canEditPlanControls();

export const baseYear = () => S.config.baseYear;
export const targetYear = () => S.config.targetYear;

// A fresh model over the current plan. Cheap enough to rebuild on every render and after every
// change, which keeps it impossible for a figure to be computed off stale state.
export function model(opts) {
  const plan = opts && opts.council ? councilRosterView(S.plan) : S.plan;
  return createCompensationModel({ plan, targetYear: targetYear(), baseYear: baseYear(), baseTree: S.baseTree });
}

async function call(path, init) {
  const res = await fetch(path, { credentials: 'same-origin', ...(init || {}) });
  let body = {};
  try { body = await res.json(); } catch { body = {}; }
  if (!res.ok) throw new Error((body && body.error) || ('Request failed (' + res.status + ')'));
  return body;
}

// /api/v1/connect-planner/church-year answers in legacy's flat-row shape; the model's tree builder
// reads the contract's account shape.
function accountsFromEntries(entries) {
  return (entries || []).map((e) => ({
    categoryPath: e.category_path, accountName: e.account_name, classification: e.classification,
    depth: e.depth, actualCents: e.own_actual_cents, budgetCents: e.own_budget_cents,
  }));
}

export async function load() {
  const [salary, ledger, layout, tags] = await Promise.all([
    call('/api/v1/connect-planner/salary'),
    call('/api/v1/connect-planner/church-year?year=' + baseYear()).catch(() => null),
    call('/api/v1/connect-planner/board-categories').catch(() => ({})),
    call('/api/v1/connect-planner/purpose-tags').catch(() => ({})),
  ]);
  const saved = (salary && salary.data && typeof salary.data === 'object') ? salary.data : {};
  S.saved = saved;
  S.plan = normalizeCompensationPlan(saved, targetYear());
  // Previewing as council shows exactly the roster a council login would receive.
  if (S.config.preview) S.plan = councilRosterView(S.plan);
  S.familySize = saved.healthFamilySize > 0 ? Math.floor(saved.healthFamilySize) : 2;
  S.targetCategory = saved.targetCategory || '';
  S.baseTree = ledger && Array.isArray(ledger.entries) ? buildChurchAccountTree(accountsFromEntries(ledger.entries)) : null;
  S.accountLabels = (layout && layout.accountLabels) || {};
  S.purposeTags = Array.isArray(tags && tags.tags) ? tags.tags : [];
  S.loaded = true;
}

// The whole plan, as legacy's finSalaryBuildSaveBody sent it, on top of what was read so nothing
// else in the saved plan is lost. The pre-redesign fields are dropped once migrated, as legacy's
// save dropped them; keeping them would re-apply an old rate someone had since cleared.
export function saveBody() {
  const p = S.plan;
  const body = { ...(S.saved || {}) };
  delete body.pensionPct; delete body.disabilityPct; delete body.colaSource; delete body.colaPct;
  return Object.assign(body, {
    roster: p.roster, targetCategory: S.targetCategory, healthPlanOption: p.healthPlanOption,
    compMethod: p.method, compPerWorkerMethod: p.perWorkerMethod, compOverrides: p.overrides,
    compCustomPct: p.customPct, compScalePct: p.scalePct, compBaselineRosterOnly: p.baselineRosterOnly,
    compBaseYearBasis: p.baseYearBasis, compBasePlanOption: p.basePlanOption,
    referenceByYear: p.referenceByYear, healthPlanPremiumOverrides: p.premiumOverrides,
    healthFamilySize: S.familySize,
  });
}

let timer = null;
let onStatus = () => {};
export function onSaveStatus(fn) { onStatus = fn; }

// Legacy's ~800ms debounced autosave: the whole plan is resent on every save.
export function scheduleSave() {
  if (!S.loaded || !canSave()) return;
  clearTimeout(timer);
  timer = setTimeout(saveNow, 800);
}

export async function saveNow() {
  clearTimeout(timer);
  timer = null;
  if (!S.loaded || !canSave()) return;
  S.saveState = 'saving';
  onStatus();
  try {
    const result = await call('/api/v1/connect-planner/salary-save', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(saveBody()),
    });
    S.saveState = result && result.draft ? 'draft' : 'saved';
  } catch (err) {
    S.saveState = (err && err.message) || 'Autosave failed';
  }
  onStatus();
}

export const savePending = () => timer != null;

// Leaving the page with a change still waiting: send it anyway.
export function flushOnExit() {
  if (!savePending()) return;
  clearTimeout(timer);
  timer = null;
  try {
    fetch('/api/v1/connect-planner/salary-save', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(saveBody()),
      credentials: 'same-origin', keepalive: true,
    });
  } catch { /* the page is going away; nothing left to report to */ }
}
