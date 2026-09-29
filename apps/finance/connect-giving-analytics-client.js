// Relay for the v3 Giving pages. Connect computes everything from its own giving tables
// (src/api-giving-analytics-contracts.js) and decides, from the caller's Access identity, what
// they may see: totals for any Giving access, named statements and nudges only for Giving view.
// Finance stores nothing. Never throws.
import { callConnectContract } from './connect-giving-batch-client.js';

// fund: 'general', 'donor', 'revenue' (all but MDO), 'all', or a Connect fund id. Connect validates it; anything it does not
// recognize comes back as all funds. Finance's pages ask for 'general' unless told otherwise.
// from/to (YYYY-MM-DD) ask for one period instead: its total, the same days last year, and the
// matching budget spread over it (Charts › Giving vs. pace).
export function fetchGivingAnalytics(env, accessJwt, { asOf, fund, from, to } = {}) {
  const query = {};
  if (asOf) query.as_of = asOf;
  if (fund) query.fund = String(fund).slice(0, 20);
  if (from && to) { query.from = String(from).slice(0, 10); query.to = String(to).slice(0, 10); }
  return callConnectContract(env, accessJwt, 'giving-analytics-v1', Object.keys(query).length ? { query } : {});
}

export function fetchGivingAnalyticsPeople(env, accessJwt, { asOf } = {}) {
  return callConnectContract(env, accessJwt, 'giving-analytics-people-v1', asOf ? { query: { as_of: asOf } } : {});
}

// Marks designated funds pass-through or back to restricted (Giving edit; Connect re-checks).
export function postGivingFundPassThrough(env, accessJwt, body) {
  return callConnectContract(env, accessJwt, 'giving-fund-passthrough-write-v1', { method: 'POST', body });
}

// Fund cleanup (Gift Entry › Funds): every fund with its totals and the likely duplicates, and
// combining or retiring funds. Connect admin only; Connect re-checks.
export function fetchGivingFundCleanup(env, accessJwt) {
  return callConnectContract(env, accessJwt, 'giving-fund-cleanup-v1');
}

export function postGivingFundCleanup(env, accessJwt, body) {
  return callConnectContract(env, accessJwt, 'giving-fund-cleanup-write-v1', { method: 'POST', body });
}

export function postGivingFollowupWrite(env, accessJwt, body) {
  return callConnectContract(env, accessJwt, 'giving-followup-write-v1', { method: 'POST', body });
}

// The Giving Report to the Council (giving-board-v1): every figure for one period, for each fund
// category and for all giving. period is YYYY-MM, YYYY-Qn or YYYY; blank means this month.
export function fetchGivingBoard(env, accessJwt, { period } = {}) {
  return callConnectContract(env, accessJwt, 'giving-board-v1', period ? { query: { period: String(period).slice(0, 10) } } : {});
}

// Email packet: Connect sends the rendered report from the church's address (Giving edit only).
export function postGivingBoardEmail(env, accessJwt, body) {
  return callConnectContract(env, accessJwt, 'giving-board-email-v1', { method: 'POST', body });
}

// Giving › Reports (giving-reports-v1): one of Connect's analysis reports by name, with that
// report's own parameters. Connect decides access per report (totals for any Giving access; the
// named reports and bands need Giving view).
export function fetchGivingReport(env, accessJwt, report, query = {}) {
  const clean = {};
  for (const [key, value] of Object.entries(query)) if (value != null && value !== '') clean[key] = String(value).slice(0, 20);
  return callConnectContract(env, accessJwt, 'giving-reports-v1', { query: { report, ...clean } });
}

// Impact statements (admin only, as in Connect).
export function postGivingImpactWrite(env, accessJwt, statements) {
  return callConnectContract(env, accessJwt, 'giving-impact-write-v1', { method: 'POST', body: { statements } });
}
