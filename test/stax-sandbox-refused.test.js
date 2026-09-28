import { describe, it, expect } from 'vitest';
import { handleStaxGivingMockupPublicApi, handleStaxGivingWebhook, STAX_SANDBOX_REFUSED_MESSAGE } from '../src/stax-giving-mockup.js';

// Production Connect sets STAX_SANDBOX_REFUSED=1 (wrangler.toml) so the Stax mockup's sandbox test
// gifts never reach the real giving ledger. Any database access here would throw.
const db = { prepare() { throw new Error('production must not touch the database for sandbox gifts'); } };
const env = { STAX_SANDBOX_REFUSED: '1', DB: db, STAX_SANDBOX_API_KEY: 'sk_test', STAX_SANDBOX_WEB_PAYMENTS_TOKEN: 'wpt', STAX_GIVING_WEBHOOK_SECRET: 's' };
const origin = { Origin: 'https://give.timothystl.org' };

describe('production refuses Stax sandbox gifts', () => {
  it.each([
    ['GET', 'funds'], ['GET', 'webpayments-token'], ['POST', 'stax-customer'], ['POST', 'checkout'], ['POST', 'recurring'],
  ])('%s %s is refused with a clear message', async (method, path) => {
    const req = new Request(`https://connect.timothystl.org/api/mockup/stax-giving/${path}`, {
      method, headers: { ...origin, 'Content-Type': 'application/json' }, body: method === 'POST' ? '{}' : undefined,
    });
    const res = await handleStaxGivingMockupPublicApi(req, env, new URL(req.url), method, path);
    expect(res.status).toBe(410);
    expect(await res.json()).toEqual({ error: STAX_SANDBOX_REFUSED_MESSAGE, sandbox_refused: true });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://give.timothystl.org');
  });

  it('still answers the browser preflight', async () => {
    const req = new Request('https://connect.timothystl.org/api/mockup/stax-giving/checkout', { method: 'OPTIONS', headers: origin });
    expect((await handleStaxGivingMockupPublicApi(req, env, new URL(req.url), 'OPTIONS', 'checkout')).status).toBe(204);
  });

  it('acknowledges a sandbox webhook without recording anything', async () => {
    const req = new Request('https://connect.timothystl.org/api/mockup/stax-giving/webhook?secret=s', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'txn_1' }),
    });
    const res = await handleStaxGivingWebhook(req, env, new URL(req.url));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, ignored: 'sandbox' });
  });

  it('is on in production and off on staging', async () => {
    const { readFileSync } = await import('node:fs');
    expect(readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8')).toMatch(/^STAX_SANDBOX_REFUSED = "1"$/m);
    expect(readFileSync(new URL('../wrangler.staging.toml', import.meta.url), 'utf8')).not.toMatch(/STAX_SANDBOX_REFUSED/);
  });
});
