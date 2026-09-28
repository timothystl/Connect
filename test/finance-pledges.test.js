import { describe, expect, it } from 'vitest';
import worker from '../apps/finance/shell.js';
import { FINANCE_PARITY_SECTIONS } from '../apps/finance/parity-manifest.js';
import { yearElapsed } from '../apps/finance/pledge-pages.js';

// Finance › Giving › Pledge list, read and written through Connect. Fictional pledgers only.
const PLEDGES = [
  { person_id: 3, fiscal_year: 2026, amount_cents: 50000, note: '', first_name: 'Cara', last_name: 'Example', household_name: null, given_cents: 0 },
  { person_id: 1, fiscal_year: 2026, amount_cents: 120000, note: 'monthly', first_name: 'Ada', last_name: 'Sample', household_name: 'Sample Household', given_cents: 130000 },
];

function env({ role = 'finance', permissions = { finance: 'edit', giving: 'edit' }, writeAnswer } = {}) {
  const calls = [];
  return { ENVIRONMENT: 'production', FINANCE_CONTRACT_API_KEY: 'key', RELEASE_SHA: 'test', calls,
    FINANCE_DB: { prepare: (sql) => ({ sql, bind() { return this; }, async first() { return null; }, async all() { return { results: [] }; }, async run() { return {}; } }) },
    CONNECT_SERVICE: { async fetch(req) {
      const u = new URL(req.url);
      if (u.pathname.endsWith('staff-role-v1')) return Response.json({ role, permissions, username: 'tester' });
      const call = { path: u.pathname.split('/').pop(), query: Object.fromEntries(u.searchParams), body: req.method === 'POST' ? await req.json() : null };
      calls.push(call);
      if (call.path === 'giving-pledges-write-v1') return writeAnswer ? writeAnswer(call.body) : Response.json({ ok: true, op: call.body.op, removed: 1 });
      if (call.path === 'giving-pledges-v1') return Response.json({ year: 2026, pledges: PLEDGES, people: call.query.q ? [{ id: 1, first_name: 'Ada', last_name: 'Sample' }, { id: 2, first_name: 'Ben', last_name: 'Sample', household_name: 'Sample Household' }] : [] });
      return Response.json({ error: 'Unknown' }, { status: 404 });
    } } };
}
const call = (e, path, init = {}) => worker.fetch(new Request(`https://finance.test${path}`, { ...init, headers: { 'Cf-Access-Jwt-Assertion': 'jwt', ...(init.headers || {}) } }), e);
const page = async (e, q = '') => (await call(e, `/?section=giving-analytics&page=pledge-list${q}`)).text();
const post = (e, fields) => call(e, '/api/v1/giving-pledges-write', { method: 'POST', body: new URLSearchParams(fields), headers: { 'Sec-Fetch-Site': 'same-origin', 'Content-Type': 'application/x-www-form-urlencoded' } });
const location = (res) => new URL(res.headers.get('Location'), 'https://finance.test').searchParams;

describe('Finance › Pledge list', () => {
  it('sits after Pledges in the Giving section', () => {
    const pages = FINANCE_PARITY_SECTIONS.find((s) => s.id === 'giving-analytics').pages.map((p) => p.id);
    expect(pages.slice(pages.indexOf('pledges'), pages.indexOf('pledges') + 2)).toEqual(['pledges', 'pledge-list']);
  });

  it('lists pledges with progress and edit forms for Giving edit', async () => {
    const e = env();
    const html = await page(e, '&year=2026&q=samp');
    expect(e.calls.map((c) => c.path)).toEqual(['giving-pledges-v1']);
    expect(e.calls[0].query).toEqual({ year: '2026', q: 'samp' });
    expect(html).toContain('Ada Sample');
    expect(html).toContain('Fulfilled');
    expect(html).toContain('Not started');
    expect(html).toContain('value="1200"');
    expect(html).toContain('Already pledged');
    expect(html).toContain('Add pledge');
  });

  it('is read-only for Giving view and hidden from council', async () => {
    const view = await page(env({ role: 'staff', permissions: { giving: 'view', finance: 'view' } }), '&year=2026');
    expect(view).toContain('Ada Sample');
    expect(view).not.toContain('/api/v1/giving-pledges-write');
    const ce = env({ role: 'council', permissions: { giving: 'anon', finance: 'view' } });
    const council = await page(ce, '&year=2026');
    expect(council).not.toContain('Ada Sample');
    expect(ce.calls).toEqual([]);
  });

  it('relays a pledge in cents and a removal, and refuses Giving view', async () => {
    const e = env();
    const res = await post(e, { op: 'set', person_id: '2', fiscal_year: '2026', amount: '$1,250.50', note: 'first' });
    expect(e.calls[0].body).toEqual({ op: 'set', person_id: 2, fiscal_year: 2026, amount_cents: 125050, note: 'first' });
    expect(location(res).get('msg')).toBe('Pledge saved.');
    expect(location(res).get('year')).toBe('2026');
    await post(e, { op: 'delete', person_id: '3', fiscal_year: '2026' });
    expect(e.calls[1].body).toEqual({ op: 'delete', person_id: 3, fiscal_year: 2026 });
    const bad = await post(e, { op: 'set', person_id: '2', fiscal_year: '2026', amount: 'lots' });
    expect(location(bad).get('status')).toBe('error');
    const ve = env({ role: 'staff', permissions: { giving: 'view' } });
    const refused = await post(ve, { op: 'delete', person_id: '3', fiscal_year: '2026' });
    expect(location(refused).get('message')).toMatch(/Giving edit/);
    expect(ve.calls).toEqual([]);
  });

  it('measures the share of the year gone', () => {
    expect(yearElapsed(2025, '2026-07-02')).toBe(1);
    expect(yearElapsed(2027, '2026-07-02')).toBe(0);
    expect(yearElapsed(2026, '2026-12-31')).toBe(1);
  });
});
