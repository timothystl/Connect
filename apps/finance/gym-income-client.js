// Gym rental income, read from Website's gym invoices (website/admin/gym-income-report.js).
// Bookings and invoices stay in Website; Finance only reports on them. Uses the same service
// binding, contract key, and forwarded Access identity as the payroll relay, and Website
// checks the person's gym_manage permission. Never throws.
const REQUEST_TIMEOUT_MS = 8000;

export async function fetchGymIncome(env, accessJwt, { year } = {}) {
  const binding = env.PAYROLL_SERVICE;
  const key = env.FINANCE_PAYROLL_CONTRACT_KEY;
  if (!binding || !key) return { ok: false, reason: 'not_configured' };
  if (!accessJwt) return { ok: false, reason: 'no_access_identity' };
  const query = /^\d{4}$/.test(String(year || '')) ? `?year=${year}` : '';
  let res;
  try {
    res = await binding.fetch(new Request(`https://admin.timothystl.org/api/contracts/gym-income-v1${query}`, {
      headers: { 'X-Contract-Key': key, 'Cf-Access-Jwt-Assertion': accessJwt, Accept: 'application/json' },
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

export function describeGymIncomeFailure(result) {
  switch (result?.reason) {
    case 'not_configured': return 'The connection to Website Admin is not configured in this environment.';
    case 'no_access_identity': return 'Your sign-in was not recognized. Reload the page and try again.';
    case 'network_error': return 'Website Admin could not be reached. Try again in a moment.';
    case 'invalid_json': return 'Website Admin returned an unexpected response.';
    case 'http_error':
      if (result.status === 401) return 'Website Admin did not recognize your sign-in. Your Finance email needs an active Website Admin account.';
      return result.message ? String(result.message) : `Website Admin refused the request (${result.status}).`;
    default: return 'The request did not complete.';
  }
}
