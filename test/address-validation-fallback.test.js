import { describe, it, expect, afterEach, vi } from 'vitest';
import { handleUtilsApi } from '../src/api-utils.js';

// A Google key that Google refuses ("The caller does not have permission" — API not enabled,
// key restricted, billing off) used to surface as the button's only answer. It is a
// configuration problem, not a verdict on the address, so validation falls back to Census.

const CENSUS_MATCH = { result: { addressMatches: [{
  matchedAddress: '15 S SEMINARY TER, SAINT LOUIS, MO, 63105',
  addressComponents: { city: 'SAINT LOUIS', state: 'MO', zip: '63105' },
}] } };

function respond(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

async function validate(googleStatus, googleBody) {
  const calls = [];
  vi.stubGlobal('fetch', async (url) => {
    calls.push(String(url));
    if (String(url).includes('googleapis.com')) return respond(googleStatus, googleBody);
    return respond(200, CENSUS_MATCH);
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const url = new URL('https://connect.timothystl.org/admin/api/utils/validate-address');
  const req = new Request(url, { method: 'POST', body: JSON.stringify({ address1: '15 S. Seminary Terr.', city: 'St. Louis', state: 'MO', zip: '63105' }) });
  const res = await handleUtilsApi(req, { GOOGLE_ADDRESS_API_KEY: 'test-key' }, url, 'POST', 'utils/validate-address', null, true, true);
  return { status: res.status, body: await res.json(), calls };
}

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('address validation when Google refuses the key', () => {
  it('falls back to the Census check on a permission error', async () => {
    const r = await validate(403, { error: { message: 'The caller does not have permission' } });
    expect(r.status).toBe(200);
    expect(r.body.source).toBe('census');
    expect(r.body.zip).toBe('63105');
    expect(r.calls.some(u => u.includes('census.gov'))).toBe(true);
  });

  it('keeps Google\'s answer when Google rejects the address itself', async () => {
    const r = await validate(400, { error: { message: 'Address is invalid' } });
    expect(r.status).toBe(422);
    expect(r.body.error).toBe('Address is invalid');
    expect(r.calls.some(u => u.includes('census.gov'))).toBe(false);
  });
});
