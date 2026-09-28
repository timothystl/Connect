// Relay for connect.finance-budget-builder.v1: each line of the target year's budget plan beside
// its prior-year actual, base-year budget and base-year projection. Aggregate lines only; Finance
// keeps no copy. Never throws. The base year defaults to the year before the target and is only
// sent when it differs.
import { callConnectContract } from './connect-giving-batch-client.js';

const REQUEST_TIMEOUT_MS = 6000;

export async function fetchBudgetBuilder(env, targetYear, baseYear = targetYear - 1) {
  const binding = env.CONNECT_SERVICE;
  const key = env.FINANCE_CONTRACT_API_KEY;
  if (!binding || !key) return { ok: false, reason: 'not_configured' };
  const query = `target_year=${encodeURIComponent(targetYear)}${baseYear !== targetYear - 1 ? `&base_year=${encodeURIComponent(baseYear)}` : ''}`;
  let res;
  try {
    res = await binding.fetch(new Request(`https://connect.timothystl.org/api/contracts/finance-budget-builder-v1?${query}`, {
      headers: { 'X-Contract-Key': key, Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }));
  } catch (e) {
    return { ok: false, reason: 'network_error', detail: e?.message || String(e) };
  }
  if (!res.ok) return { ok: false, reason: 'http_error', status: res.status };
  let payload;
  try { payload = await res.json(); } catch { return { ok: false, reason: 'invalid_json' }; }
  if (payload?.contract !== 'connect.finance-budget-builder.v1' || !Array.isArray(payload.lines)) return { ok: false, reason: 'contract_validation_failed' };
  return { ok: true, builder: payload };
}

// A council member's own Budget planner draft. Connect keeps a council member's Plan edits in a
// private per-user key (councilBudgetKey in src/api-finance.js) and merges it over the shared plan
// only when that same, verified person reads planning/church; the accounting workspace contract
// (finance-workspace-v1) carries the caller's Access assertion so Connect decides whose draft it
// is. Returns every plan row as that person sees it. Never throws.
export async function fetchCouncilBudgetDraft(env, accessJwt) {
  const r = await callConnectContract(env, accessJwt, 'finance-workspace-v1', { query: { path: 'planning/church' } });
  if (!r.ok) return { ok: false, reason: r.reason, message: r.message };
  return Array.isArray(r.result?.rows) ? { ok: true, rows: r.result.rows } : { ok: false, reason: 'contract_validation_failed' };
}
