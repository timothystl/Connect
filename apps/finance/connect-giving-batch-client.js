// Relay for Gift Entry batches (Finance v3). Giving stays authoritative in Connect: these calls
// read and write Connect's own giving_* tables through the giving-batch-*-v1 contracts
// (src/api-giving-batch-contracts.js), carrying the caller's Access assertion so Connect decides
// who may see donor names or enter gifts. Finance stores nothing. Never throws.
const REQUEST_TIMEOUT_MS = 8000;
const BASE = 'https://connect.timothystl.org/api/contracts/';

// Shared by the Giving analytics client (connect-giving-analytics-client.js).
export async function callConnectContract(env, accessJwt, path, { method = 'GET', body, query } = {}) {
  const binding = env.CONNECT_SERVICE;
  const key = env.FINANCE_CONTRACT_API_KEY;
  if (!binding || !key) return { ok: false, reason: 'not_configured' };
  if (!accessJwt) return { ok: false, reason: 'no_access_identity' };
  const url = `${BASE}${path}${query ? `?${new URLSearchParams(query).toString()}` : ''}`;
  let res;
  try {
    res = await binding.fetch(new Request(url, {
      method,
      headers: {
        'X-Contract-Key': key,
        'Cf-Access-Jwt-Assertion': accessJwt,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }));
  } catch (e) {
    return { ok: false, reason: 'network_error', detail: e?.message || String(e) };
  }
  let payload;
  try { payload = await res.json(); } catch { return { ok: false, reason: 'invalid_json' }; }
  if (!res.ok) return { ok: false, reason: 'http_error', status: res.status, message: payload?.error };
  return { ok: true, result: payload };
}

export function fetchGivingBatchWorkspace(env, accessJwt, { batchId, q } = {}) {
  const query = {};
  if (batchId) query.batch_id = String(batchId);
  if (q) query.q = String(q).slice(0, 60);
  return callConnectContract(env, accessJwt, 'giving-batch-workspace-v1', { query });
}

export function fetchGivingBatchLedger(env, accessJwt) {
  return callConnectContract(env, accessJwt, 'giving-batch-ledger-v1');
}

// Transactions page: every filter the page carries, plus entry_id (one gift's detail and history)
// and giver_q (the "move to another giver" search). all=1 returns up to 5,000 rows for the CSV.
const TRANSACTION_QUERY_KEYS = ['from', 'to', 'funds', 'methods', 'min', 'max', 'q', 'status', 'sort', 'offset', 'batch_id', 'entry_id', 'giver_q', 'all'];
export function fetchGivingTransactions(env, accessJwt, params) {
  const query = {};
  for (const key of TRANSACTION_QUERY_KEYS) {
    const value = params.get(key);
    if (value) query[key] = String(value).slice(0, 200);
  }
  return callConnectContract(env, accessJwt, 'giving-transactions-v1', { query });
}

export function fetchOnlineGiving(env, accessJwt) {
  return callConnectContract(env, accessJwt, 'giving-online-v1');
}

// One deposit's lines, gifts and totals, and what could be added to it (Reconciliation to bank).
export function fetchGivingDeposit(env, accessJwt, { id, from, to } = {}) {
  const query = { id: String(id) };
  if (/^\d{4}-\d{2}-\d{2}$/.test(from || '')) query.from = from;
  if (/^\d{4}-\d{2}-\d{2}$/.test(to || '')) query.to = to;
  return callConnectContract(env, accessJwt, 'giving-deposit-v1', { query });
}

export function postGivingBatchWrite(env, accessJwt, body) {
  return callConnectContract(env, accessJwt, 'giving-batch-write-v1', { method: 'POST', body });
}

export function describeGivingBatchFailure(result) {
  switch (result?.reason) {
    case 'not_configured': return 'The connection to Connect is not configured in this environment.';
    case 'no_access_identity': return 'Your sign-in was not recognized. Reload the page and try again.';
    case 'network_error': return 'Connect could not be reached. Try again in a moment.';
    case 'invalid_json': return 'Connect returned an unexpected response.';
    case 'http_error': return result.message ? String(result.message) : `Connect refused the request (${result.status}).`;
    default: return 'The request did not complete.';
  }
}

// Online giving form settings (fee percentage, which funds the public form offers) stay in
// Connect; see src/api-giving-online-contracts.js.
export function fetchGivingOnlineSettings(env, accessJwt) {
  return callConnectContract(env, accessJwt, 'giving-online-settings-v1');
}

export function postGivingOnlineSettingsWrite(env, accessJwt, body) {
  return callConnectContract(env, accessJwt, 'giving-online-settings-write-v1', { method: 'POST', body });
}
