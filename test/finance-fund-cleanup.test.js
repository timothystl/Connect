import { describe, expect, it } from 'vitest';
import worker from '../apps/finance/shell.js';

// Fabricated fund names and fund-level totals only; no donor data.
const CLEANUP = {
  contract: 'connect.giving-fund-cleanup.v1', year: 2026,
  funds: [
    { id: 1, name: 'Building Fund', category: 'restricted', active: true, number: '', gift_count: 3, total_cents: 30000, year_cents: 0, last_month: '2024-05' },
    { id: 2, name: '25004 Building Fund', category: 'restricted', active: true, number: '25004', gift_count: 9, total_cents: 90000, year_cents: 1000, last_month: '2026-08' },
    { id: 3, name: 'Easter Egg Hunt', category: 'restricted', active: true, number: '', gift_count: 0, total_cents: 0, year_cents: 0, last_month: '' },
    { id: 4, name: 'VBS', category: 'restricted', active: false, number: '', gift_count: 1, total_cents: 500, year_cents: 0, last_month: '2019-06' },
  ],
  duplicate_groups: [{ reason: 'Same name, account 25004', suggested_keep_id: 2, fund_ids: [2, 1] }],
};

function makeEnv(role = 'admin') {
  const sent = [];
  const env = {
    ENVIRONMENT: 'staging', RELEASE_SHA: 't', FINANCE_DB: { prepare: (sql) => ({ sql }) }, FINANCE_CONTRACT_API_KEY: 'k',
    CONNECT_SERVICE: {
      async fetch(req) {
        const url = new URL(req.url);
        if (url.pathname.endsWith('/staff-role-v1')) return new Response(JSON.stringify({ role, permissions: { finance: 'edit', giving: 'edit' } }));
        if (url.pathname.endsWith('/giving-fund-cleanup-v1')) return new Response(JSON.stringify(CLEANUP));
        if (url.pathname.endsWith('/giving-fund-cleanup-write-v1')) {
          const body = await req.json();
          sent.push(body);
          return new Response(JSON.stringify(body.op === 'merge' ? { ok: true, moved_gifts: 3, kept: '25004 Building Fund', removed: 1 } : { ok: true, changed: body.fund_ids.length }));
        }
        return new Response('{}', { status: 404 });
      },
    },
  };
  return { env, sent };
}
const page = (env) => worker.fetch(new Request('https://finance.test/?section=giving&page=funds', { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), env);
const post = (env, fields) => worker.fetch(new Request('https://finance.test/api/v1/giving-fund-cleanup', {
  method: 'POST', headers: { 'Cf-Access-Jwt-Assertion': 'jwt', 'Sec-Fetch-Site': 'same-origin' }, body: new URLSearchParams(fields),
}), env);

describe('Gift Entry › Funds › Clean up funds', () => {
  it('shows an admin the duplicate groups and the retire list', async () => {
    const html = await (await page(makeEnv().env)).text();
    expect(html).toContain('Clean up funds');
    expect(html).toContain('Same name, account 25004');
    expect(html).toContain('name="keep" value="2" id="fc-keep-0-2" checked');
    expect(html).toContain('name="remove" value="1" aria-label="Combine Building Fund" checked');
    expect(html).toContain('last gift Never');
    expect(html).toContain('Retired funds (1)');
    expect(html).toContain('<input type="hidden" name="op" value="retire">');
  });

  it('is not offered to anyone but an admin', async () => {
    const html = await (await page(makeEnv('finance').env)).text();
    expect(html).not.toContain('Clean up funds');
  });

  it('relays a confirmed combine and a retire, and refuses an unconfirmed combine', async () => {
    const { env, sent } = makeEnv();
    const unconfirmed = await post(env, [['op', 'merge'], ['keep', '2'], ['remove', '1']]);
    expect(unconfirmed.headers.get('Location')).toContain('status=error');
    expect(sent).toHaveLength(0);
    const merged = await post(env, [['op', 'merge'], ['keep', '2'], ['remove', '1'], ['remove', '2'], ['confirm', '1']]);
    expect(merged.status).toBe(303);
    expect(decodeURIComponent(merged.headers.get('Location').replace(/\+/g, ' '))).toContain('Combined into 25004 Building Fund: 3 gifts moved, 1 fund removed.');
    expect(sent.at(-1)).toEqual({ op: 'merge', keep_id: 2, remove_ids: [1] });
    const retired = await post(env, [['op', 'retire'], ['fund_id', '3']]);
    expect(retired.headers.get('Location')).toContain('status=ok');
    expect(sent.at(-1)).toEqual({ op: 'retire', fund_ids: [3] });
  });
});
