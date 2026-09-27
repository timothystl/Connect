// ── Compensation Planner data routes, and Connect's bundle for the accounting workspace ──────
// Compensation → Planner is Finance's own page (apps/finance/planner/). Its data calls go to the
// /api/v1/connect-planner/* routes in shell.js, which relay to the same permission-checked Connect
// contracts the rest of Finance uses:
//   - the saved plan: finance-compensation-plan-v1 (read) and finance-compensation-write-v1 (save),
//     so Connect re-verifies the viewer's identity and role on every request;
//   - the base-year ledger: connect.finance-church-report.v1, reshaped into legacy's flat rows
//     (churchYearFromReport below);
//   - board categories and purpose tags: connect.finance-board-layout.v1.
// A council member's changes are saved as their private draft in Finance's own database, the same
// row the Plan page's draft editor writes (compensation-council-overlay.js), because Connect no
// longer accepts council writes to the plan.
//
// Until September 27, 2026 Compensation → Planner framed Connect's own planner code from here.
// Connect's front-end bundle below is still served by the accounting workspace
// (accounting-workspace.js), which runs Connect's Budget Planner and Chart of Accounts in Finance.
import { CHMS_APP_CORE_JS, CHMS_APP_EXT_JS, CHMS_APP_FINANCE_JS, CHMS_APP_CSS } from '../../src/html-chms.js';

export const CONNECT_PLANNER_JS = `${CHMS_APP_CORE_JS}\n${CHMS_APP_EXT_JS}\n${CHMS_APP_FINANCE_JS}\n`;
export const CONNECT_PLANNER_CSS = CHMS_APP_CSS;

// Connect's scripts use inline handlers, so the accounting workspace page runs under this policy.
// It may only be framed by Finance itself and may only call back to Finance.
export const CONNECT_PLANNER_CSP = "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'self'";

// Who may use the planner. Admin and compensation edit the shared plan; council edits a private
// draft when their compensation permission is edit, and otherwise only views.
export function plannerViewer(roleResult) {
  if (!roleResult || !roleResult.ok) return null;
  const role = roleResult.role;
  if (!['admin', 'compensation', 'council'].includes(role)) return null;
  const compensation = roleResult.permissions && roleResult.permissions.compensation;
  if (role === 'council' && !['view', 'edit'].includes(compensation)) return null;
  return { role, permissions: { compensation: compensation === 'edit' ? 'edit' : 'view' } };
}

// connect.finance-church-report.v1 accounts as the flat rows Connect's /finance/church/this-year
// returns, which finBuildTreeFromFlatRows reads (the same mapping compensation-projection.js uses).
export function churchYearFromReport(report) {
  const accounts = Array.isArray(report && report.accounts) ? report.accounts : [];
  return {
    entries: accounts.map((a) => ({
      category_path: a.categoryPath, account_name: a.accountName, classification: a.classification,
      depth: a.depth, own_actual_cents: a.actualCents, own_budget_cents: a.budgetCents,
    })),
  };
}

const COUNCIL_METHODS = ['none', 'worksheet', 'scalepct', 'cola', 'custom'];
// A council member's save from the planner, reduced to the fields their draft may hold.
export function councilDraftFromPlan(body) {
  const b = body && typeof body === 'object' ? body : {};
  const draft = {};
  if (COUNCIL_METHODS.includes(b.compMethod)) draft.compMethod = b.compMethod;
  if (b.compPerWorkerMethod && typeof b.compPerWorkerMethod === 'object') {
    draft.compPerWorkerMethod = Object.fromEntries(Object.entries(b.compPerWorkerMethod)
      .filter(([k, v]) => /^\d+$/.test(k) && COUNCIL_METHODS.includes(v)));
  }
  for (const field of ['compCustomPct', 'compScalePct']) {
    const n = Number(b[field]);
    if (b[field] != null && Number.isFinite(n)) draft[field] = n;
  }
  if (b.compBaselineRosterOnly != null) draft.compBaselineRosterOnly = Boolean(b.compBaselineRosterOnly);
  return draft;
}
