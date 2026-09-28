import { describe, expect, it } from 'vitest';
import worker from '../apps/finance/shell.js';
import { givingPaceParams } from '../apps/finance/giving-analytics-pages.js';

// Charts › Giving vs. pace: one period of giving for one fund scope, against the same days last
// year and the matching budget spread over the period, from Connect's giving-analytics-v1 period
// read. Fictional figures only.
const FUNDS = { fund_options: [{ key: 'general', label: 'General Fund' }, { key: 'donor', label: 'Donor giving' }, { key: 'revenue', label: 'All revenue except MDO' }, { key: 'all', label: 'All funds' }, { key: '8', label: 'Building Fund' }] };
function periodFor(query) {
  const fund = query.get('fund');
  const base = { from: query.get('from'), to: query.get('to'), days: 20, cents: 1800000, gifts: 140, prior_from: '2025-09-01', prior_to: '2025-09-20', prior_cents: 1500000, prior_gifts: 120 };
  if (fund === '8') return { contract: 'connect.giving-analytics.v1', as_of: '2026-09-20', year: 2026, fund: { key: '8', label: 'Building Fund', fund_count: 1 }, ...FUNDS, period: { ...base, cents: 50000, prior_cents: 0, budget: null, budget_missing_years: [2026] } };
  return {
    contract: 'connect.giving-analytics.v1', as_of: '2026-09-20', year: 2026, fund: { key: 'general', label: 'General Fund', fund_count: 3 }, ...FUNDS,
    period: { ...base, budget: { cents: 2000000, basis: 'general_fund', codes: ['40085'], accounts: ['40085 Sunday Offering'], years: [{ year: 2026, annual_cents: 36500000, days: 20, days_in_year: 365, cents: 2000000 }] }, budget_missing_years: [] },
  };
}

function makeEnv({ role = 'council', giving = 'anon' } = {}) {
  const calls = [];
  const env = {
    ENVIRONMENT: 'staging', RELEASE_SHA: 't', FINANCE_DB: { prepare: (sql) => ({ sql }) }, FINANCE_CONTRACT_API_KEY: 'k',
    CONNECT_SERVICE: {
      async fetch(req) {
        const url = new URL(req.url);
        if (url.pathname.endsWith('/staff-role-v1')) return Response.json({ role, permissions: { finance: 'view', giving } });
        calls.push({ path: url.pathname.split('/').pop(), query: Object.fromEntries(url.searchParams) });
        if (url.pathname.endsWith('/giving-analytics-v1')) return Response.json(periodFor(url.searchParams));
        return new Response('{}', { status: 404 });
      },
    },
  };
  return { env, calls };
}
const get = (env, query = '') => worker.fetch(new Request(`https://finance.test/?section=charts&page=giving-pace${query}`, { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), env);

describe('Charts › Giving vs. pace', () => {
  it('turns each period choice into from/to dates', () => {
    const at = (q, today = '2026-09-28') => givingPaceParams(new URLSearchParams(q), today);
    expect(at('')).toMatchObject({ period: 'ytd', from: '2026-01-01', to: '2026-09-28', fund: 'general', label: '2026 to date', error: '' });
    expect(at('period=this-month')).toMatchObject({ from: '2026-09-01', to: '2026-09-28', label: 'September 2026 to date' });
    expect(at('period=last-month')).toMatchObject({ from: '2026-08-01', to: '2026-08-31', label: 'August 2026' });
    expect(at('period=last-month', '2026-01-15')).toMatchObject({ from: '2025-12-01', to: '2025-12-31', label: 'December 2025' });
    expect(at('period=last-month', '2024-03-02')).toMatchObject({ from: '2024-02-01', to: '2024-02-29' });
    expect(at('period=qtd')).toMatchObject({ from: '2026-07-01', to: '2026-09-28', label: 'Q3 2026 to date' });
    expect(at('period=custom&from=2026-06-30&to=2026-04-01&fund=donor')).toMatchObject({ period: 'custom', from: '2026-04-01', to: '2026-06-30', fund: 'donor', label: 'Apr 1, 2026 – Jun 30, 2026' });
    expect(at('period=custom&from=2026-04-01')).toMatchObject({ period: 'ytd', from: '2026-01-01', error: 'Choose both a From and a To date; showing year to date.' });
    expect(at('period=custom&from=2020-01-01&to=2026-01-01').error).toContain('400 days or fewer');
    expect(at('period=bogus&fund=x;drop')).toMatchObject({ period: 'ytd', fund: 'general' });
  });

  it('compares the period with last year and the prorated budget, asking Connect for totals only', async () => {
    const { env, calls } = makeEnv();
    const html = await (await get(env, '&period=custom&from=2026-09-01&to=2026-09-20')).text();
    expect(calls.filter((c) => c.path === 'giving-analytics-v1')).toEqual([{ path: 'giving-analytics-v1', query: { fund: 'general', from: '2026-09-01', to: '2026-09-20' } }]);
    expect(html).toContain('<h1 class="page-title">Giving vs. pace</h1>');
    expect(html).toContain('<small>Giving, Sep 1, 2026 – Sep 20, 2026</small><strong>$18,000</strong>');
    expect(html).toContain('+20.0% vs. the same days last year');
    expect(html).toContain('<small>Budgeted pace</small><strong>$20,000</strong><span class="tone-warn">90% of pace · behind by $2,000</span>');
    expect(html).toContain('the General Fund’s budget line on the church ledger (40085 Sunday Offering)');
    expect(html).toContain('$365,000 for 2026 × 20 of 365 days = $20,000');
    expect(html).toContain('Sep 1, 2025 through Sep 20, 2025');
    // The fund picker keeps the chosen period.
    expect(html).toContain('href="/?section=charts&amp;page=giving-pace&amp;period=custom&amp;from=2026-09-01&amp;to=2026-09-20&amp;fund=donor"');
    expect(html).toContain('<option value="custom" selected>Custom dates</option>');
    // Never the church report's actual income, never a synthetic figure.
    expect(html).not.toContain('Naive monthly pace');
    expect(html).not.toContain('Synthetic');
  });

  it('says so, and compares only with last year, when no budget line matches the fund', async () => {
    const { env, calls } = makeEnv({ role: 'finance', giving: 'edit' });
    const html = await (await get(env, '&period=this-month&fund=8')).text();
    expect(calls.find((c) => c.path === 'giving-analytics-v1').query).toMatchObject({ fund: '8' });
    expect(html).toContain('No budget line matches this scope');
    expect(html).toContain('<b>No budget comparison.</b> No income budget line matches Building Fund for 2026, so only last year is compared.');
    expect(html).toContain('No gifts in the same days last year to compare');
    expect(html).not.toContain('Budget spread evenly by day');
  });
});
