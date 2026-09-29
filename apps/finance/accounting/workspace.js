// ── The accounting workspace's operations, answered by Finance ───────────────────────────────
// The older accounting screens inside Finance (/accounting) call /api/v1/accounting-workspace with
// one of the operations contracts/accounting-workspace.js allows. Finance now runs them itself
// against FINANCE_DB with finance-api.js (its own copy of Connect's accounting handlers), using the
// same permission rules Connect's handleChmsApi applied to finance/* (forked 2026-09-29).
//
// Three reads still go to Connect, because they mix in Giving, which Connect owns: the Church
// Report "this year" payload (its giving pace and designated-fund balances) and the board packet.
// The myMDO daycare syncs, and the status card that says whether they are available, also go to
// Connect until Finance has the myMDO connection settings.
import { json } from './http.js';
import { daycareConfigured } from './daycare-client.js';
import { handleFinanceApi } from './finance-api.js';

const GIVING_MIXED = new Set(['church/this-year', 'board-packet']);
const DAYCARE_SYNC = new Set(['status', 'daycare/sync', 'daycare/rooms/sync']);

// Whether Finance answers this operation itself (false: send it to Connect as before).
export function answersLocally(path, env) {
  const base = String(path || '').split('?')[0];
  if (GIVING_MIXED.has(base)) return false;
  if (DAYCARE_SYNC.has(base) && !daycareConfigured(env)) return false;
  return true;
}

// Which of the three Finance permissions (finance / budget / compensation) can open a segment;
// Connect's financeSegItems (src/api-chms.js), unchanged.
function financeSegItems(seg) {
  if (seg === 'finance/status' || seg === 'finance/overview' || seg === 'finance/daycare'
      || seg === 'finance/planning/church' || seg === 'finance/church/this-year'
      || seg === 'finance/planning/base-projection' || seg === 'finance/planning/board-categories'
      || seg === 'finance/planning/purpose-tags') {
    return ['finance', 'budget', 'compensation'];
  }
  if (seg === 'finance/planning/salary') return ['compensation'];
  if (seg.startsWith('finance/planning/') || seg === 'finance/property/ivanhoe') return ['finance', 'budget'];
  return ['finance'];
}

// The compensation role reaches only what the Compensation screens load (Connect's allowlist).
const COMPENSATION_GETS = new Set([
  'finance/status', 'finance/overview', 'finance/daycare', 'finance/planning/church', 'finance/church/this-year',
  'finance/planning/base-projection', 'finance/planning/board-categories', 'finance/planning/purpose-tags',
  'finance/planning/salary', 'finance/property/ivanhoe',
]);

// null when allowed, else the refusal. `actor` is resolveActor's verified person.
export function workspaceRefusal(actor, seg, method) {
  const role = actor.user.role;
  if (role === 'admin') return null;
  if (role === 'compensation') {
    const ok = (method === 'GET' && COMPENSATION_GETS.has(seg)) || (seg === 'finance/planning/salary' && method === 'PUT');
    return ok ? null : json({ error: 'Access denied' }, 403);
  }
  if (!['finance', 'staff', 'council'].includes(role)) return json({ error: 'Access denied' }, 403);
  const level = (item) => actor.permissions?.[item] || 'none';
  const candidates = financeSegItems(seg);
  if (!candidates.some((item) => level(item) !== 'none')) return json({ error: 'Access denied' }, 403);
  if (method !== 'GET' && !candidates.some((item) => level(item) === 'edit')) {
    return json({ error: 'Access denied: view-only permission for this area' }, 403);
  }
  return null;
}

// Runs one allowed operation. `target` is accountingWorkspaceTarget's URL
// (https://connect.timothystl.org/admin/api/finance/<path>); only its path and query are used.
export async function runWorkspaceOperation(request, env, target, actor) {
  const seg = target.pathname.slice('/admin/api/'.length);
  const refusal = workspaceRefusal(actor, seg, request.method);
  if (refusal) return refusal;
  const headers = new Headers();
  if (request.headers.has('Content-Type')) headers.set('Content-Type', request.headers.get('Content-Type'));
  const forwarded = new Request(target, {
    method: request.method, headers,
    ...(!['GET', 'HEAD'].includes(request.method) ? { body: request.body, duplex: 'half' } : {}),
  });
  const role = actor.user.role;
  const result = await handleFinanceApi(forwarded, env, target, request.method, seg, env.FINANCE_DB, role === 'admin', true, role, actor.user);
  return result || json({ error: 'Not found' }, 404);
}
