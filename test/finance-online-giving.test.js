import { describe, expect, it } from 'vitest';
import worker from '../apps/finance/shell.js';

// Giving Entry → Online giving form: reads and writes Connect's giving-online-settings contracts.
const SETTINGS = {
  fee_percent: 2.9, default_fee_percent: 2, max_fee_percent: 10,
  funds: [{ id: 1, name: 'General Fund', public_giving: 1 }, { id: 2, name: 'Missions', public_giving: 0 }],
};

function makeEnv({ giving = 'edit', refuse } = {}) {
  const calls = [];
  const env = {
    ENVIRONMENT: 'staging', RELEASE_SHA: 't', FINANCE_DB: { prepare: (sql) => ({ sql }) }, FINANCE_CONTRACT_API_KEY: 'k',
    CONNECT_SERVICE: {
      async fetch(req) {
        const url = new URL(req.url);
        const body = req.method === 'POST' ? await req.json() : null;
        calls.push({ path: url.pathname, body, jwt: req.headers.get('Cf-Access-Jwt-Assertion') });
        if (url.pathname.endsWith('/staff-role-v1')) return new Response(JSON.stringify({ role: 'finance', permissions: { finance: 'edit', giving } }));
        if (refuse) return new Response(JSON.stringify({ error: 'Changing these settings requires Giving edit access' }), { status: 403 });
        if (url.pathname.endsWith('/giving-online-settings-v1')) return new Response(JSON.stringify(SETTINGS));
        if (url.pathname.endsWith('/giving-online-settings-write-v1')) {
          return new Response(JSON.stringify(body.op === 'fee' ? { ok: true, fee_percent: Number(body.fee_percent) } : { ok: true, public_count: body.public_fund_ids.length }));
        }
        return new Response('{}', { status: 404 });
      },
    },
  };
  return { env, calls };
}
const get = (env, query = '') => worker.fetch(new Request(`https://finance.test/?section=giving&page=online-form${query}`, { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), env);
const post = (env, body, headers = {}) => worker.fetch(new Request('https://finance.test/api/v1/giving-online-settings-write', {
  method: 'POST', headers: { 'Cf-Access-Jwt-Assertion': 'jwt', 'Sec-Fetch-Site': 'same-origin', ...headers }, body,
}), env);

describe('Online giving form settings (Finance Giving Entry)', () => {
  it('shows the live fee percentage and public funds from Connect', async () => {
    const { env, calls } = makeEnv();
    const html = await (await get(env)).text();
    expect(html).toContain('<h1 class="page-title">Online form settings</h1>');
    expect(calls.find((c) => c.path.endsWith('/giving-online-settings-v1'))).toMatchObject({ jwt: 'jwt' });
    expect(html).toContain('<strong>2.9%</strong>');
    expect(html).toContain('name="fee_percent"');
    expect(html).toContain('value="1" checked> General Fund');
    expect(html).toContain('value="2"> Missions');
    expect(html).toContain('Save percentage');
  });

  it('shows the settings read-only without Giving edit access', async () => {
    const { env } = makeEnv({ giving: 'view' });
    const html = await (await get(env)).text();
    expect(html).toContain('Changing them requires Giving edit access');
    expect(html).not.toContain('Save percentage');
    expect(html).toContain('disabled');
  });

  it('relays a new fee percentage to Connect and returns with a confirmation', async () => {
    const { env, calls } = makeEnv();
    const res = await post(env, new URLSearchParams({ op: 'fee', fee_percent: '3' }));
    expect(res.status).toBe(303);
    expect(calls.find((c) => c.path.endsWith('/giving-online-settings-write-v1'))).toMatchObject({ body: { op: 'fee', fee_percent: '3' }, jwt: 'jwt' });
    const location = new URL(res.headers.get('Location'), 'https://finance.test');
    expect(Object.fromEntries(location.searchParams)).toMatchObject({ section: 'giving', page: 'online-form', status: 'ok', msg: 'Fee percentage saved: 3%.' });
  });

  it('relays every checked fund, and an empty list when all are unchecked', async () => {
    const { env, calls } = makeEnv();
    const form = new URLSearchParams([['op', 'funds'], ['fund', '1'], ['fund', '2']]);
    expect((await post(env, form)).status).toBe(303);
    await post(env, new URLSearchParams({ op: 'funds' }));
    const writes = calls.filter((c) => c.path.endsWith('/giving-online-settings-write-v1')).map((c) => c.body);
    expect(writes).toEqual([{ op: 'funds', public_fund_ids: ['1', '2'] }, { op: 'funds', public_fund_ids: [] }]);
  });

  it('reports Connect’s refusal and rejects cross-site posts', async () => {
    const { env } = makeEnv({ refuse: true });
    const refused = await post(env, new URLSearchParams({ op: 'fee', fee_percent: '3' }));
    expect(new URL(refused.headers.get('Location'), 'https://x').searchParams.get('message')).toContain('Giving edit access');
    const { env: env2, calls } = makeEnv();
    const cross = await post(env2, new URLSearchParams({ op: 'fee', fee_percent: '3' }), { 'Sec-Fetch-Site': 'cross-site' });
    expect(new URL(cross.headers.get('Location'), 'https://x').searchParams.get('status')).toBe('error');
    expect(calls.some((c) => c.path.endsWith('/giving-online-settings-write-v1'))).toBe(false);
  });
});

describe('Online giving tabs (Finance Giving Entry)', () => {
  it('shows Form settings as a tab of Online giving, not a separate sidebar item', async () => {
    const { env } = makeEnv();
    const html = await (await get(env)).text();
    expect(html).toContain('<div class="chip-row" role="navigation" aria-label="Online giving">');
    expect(html).toContain('<a class="chip" href="/?section=giving&amp;page=online">Payments</a>');
    expect(html).toContain('<a class="chip" href="/?section=giving&amp;page=online&amp;view=recurring">Recurring</a>');
    expect(html).toContain('<a class="chip" href="/?section=giving&amp;page=online&amp;view=associations">Givers &amp; matching</a>');
    expect(html).toContain('<span class="chip is-on" aria-current="page">Form settings</span>');
    const nav = html.slice(html.indexOf('<div class="nav-pages">'), html.indexOf('</div>', html.indexOf('<div class="nav-pages">')));
    expect(nav).toContain('<a href="/?section=giving&amp;page=online" aria-current="page">Online giving</a>');
    expect(nav).not.toContain('Online form settings');
  });
});
