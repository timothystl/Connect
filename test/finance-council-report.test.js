import { describe, expect, it } from 'vitest';
import worker from '../apps/finance/shell.js';
import { councilPeriods, groupByFundCode, renderCouncilEmailHtml } from '../apps/finance/council-report-pages.js';

const monthly = (arr) => [...arr, ...new Array(12 - arr.length).fill(0)];
const block = (key, label, o = {}) => ({
  key, label, hh_label: 'Giving households', fund_count: 2,
  funds: [
    { name: '40085 General Fund', category: key, actual_cents: 26000000, budget_ytd_cents: 28000000, variance_cents: -2000000, prior_cents: 29000000 },
    { name: '40085 Advent', category: key, actual_cents: 13000, budget_ytd_cents: null, variance_cents: null, prior_cents: 0 },
  ],
  given_ytd_cents: 28892200, given_ytd_prior_cents: 32380300, given_ytd_delta_pct: -10.8,
  annual_budget_cents: 42500000, budget_ytd_cents: 31694500, budget_variance_cents: -2802300, budget_variance_pct: -8.8,
  has_budget: true, projection_cents: 38559400, projection_method: 'seasonal', sundays_elapsed: 39, sundays_in_year: 52, sundays_remaining: 13,
  projection_vs_budget_cents: -3940600, households: 116, households_prior: 120, avg_per_household_cents: 249100,
  monthly: { current: monthly([2200000, 3500000, 3500000, 3800000, 4100000, 3200000, 3500000, 3500000, 1500000]), prior: monthly([2400000, 5800000, 3900000, 3300000, 3600000, 3500000, 3400000, 3500000, 3000000, 2600000, 4200000, 4000000]) },
  method_mix: [{ key: 'check', label: 'Check', cents: 19106400, pct: 66 }, { key: 'ach', label: 'ACH / online', cents: 8168600, pct: 28 }, { key: 'cash', label: 'Cash / loose plate', cents: 0, pct: 0 }, { key: 'other', label: 'Stock, IRA, other', cents: 1617200, pct: 6 }],
  concentration: { top10_pct: 37, half_households: 16, segments: [{ label: 'Top 10', pct: 37 }, { label: 'Next 20', pct: 30 }, { label: 'Next 40', pct: 25 }, { label: 'Other 46', pct: 8 }] },
  ...o,
});
const BOARD = {
  contract: 'connect.giving-board.v1', year: 2026, prior_year: 2025, through_month: 9, period_label: 'September 2026', through_label: 'Through September 30, 2026',
  monthly: { current: monthly([]), prior: monthly([]) }, method_mix: [], concentration: { segments: [] }, funds: [],
  fund_categories: [{ key: 'general', label: 'General Fund' }, { key: 'restricted', label: 'Restricted & designated' }, { key: 'earned', label: 'Earned income' }],
  categories: {
    general: block('general', 'General Fund'),
    restricted: block('restricted', 'Restricted & designated', { given_ytd_cents: 8660300, funds: [{ name: '50010 Missions', actual_cents: 8660300, prior_cents: 7000000, budget_ytd_cents: null, variance_cents: null }], budget_variance_cents: null, budget_ytd_cents: null, has_budget: false }),
    earned: block('earned', 'Earned income', { given_ytd_cents: 157500, funds: [] }),
    all: block('all', 'All giving', { given_ytd_cents: 39458500 }),
  },
};

const DISTRIBUTION = {
  contract: 'connect.giving-reports.v1', report: 'distribution', year: 2025, scope: 'household', givers: 180, total_cents: 41000000,
  mean_cents: 227778, median_cents: 120000, top10_share_pct: 41, top10_givers: 18,
  tiers: [
    { label: 'Under $500', givers: 60, givers_pct: 33, total_cents: 1200000, total_pct: 3 },
    { label: '$500 – $2,499', givers: 70, givers_pct: 39, total_cents: 9000000, total_pct: 22 },
    { label: '$10,000+', givers: 50, givers_pct: 28, total_cents: 30800000, total_pct: 75 },
    { label: '$50,000+', givers: 0, givers_pct: 0, total_cents: 0, total_pct: 0 },
  ],
};
const MULTIYEAR = {
  contract: 'connect.giving-reports.v1', report: 'multiyear', end_year: 2025, base_year: 2025,
  years: [2021, 2022, 2023, 2024, 2025].map((year, i) => ({
    year, gifts: 3000 + i, givers: 200 - i * 5, total_cents: 38000000 + i * 1000000, avg_gift_cents: 12000, avg_giver_cents: 190000 + i * 10000,
    adjusted_cents: 45000000 - i * 1000000, cpi_estimated: year >= 2025,
  })),
};

function makeEnv({ giving = 'edit' } = {}) {
  const calls = [];
  const env = {
    ENVIRONMENT: 'staging', RELEASE_SHA: 't', FINANCE_DB: { prepare: (sql) => ({ sql }) }, FINANCE_CONTRACT_API_KEY: 'k',
    CONNECT_SERVICE: {
      async fetch(req) {
        const url = new URL(req.url);
        const body = req.method === 'POST' ? await req.json() : null;
        calls.push({ path: url.pathname, query: Object.fromEntries(url.searchParams), body });
        if (url.pathname.endsWith('/staff-role-v1')) return new Response(JSON.stringify({ role: 'finance', permissions: { finance: 'edit', giving } }));
        if (url.pathname.endsWith('/giving-board-v1')) return new Response(JSON.stringify(BOARD));
        if (url.pathname.endsWith('/giving-board-email-v1')) return new Response(JSON.stringify({ ok: true, sent: 2, failed: [] }));
        if (url.pathname.endsWith('/giving-reports-v1') && url.searchParams.get('report') === 'distribution') return new Response(JSON.stringify(DISTRIBUTION));
        if (url.pathname.endsWith('/giving-reports-v1') && url.searchParams.get('report') === 'multiyear') return new Response(JSON.stringify(MULTIYEAR));
        return new Response('{}', { status: 404 });
      },
    },
  };
  return { env, calls };
}
const get = (env, query) => worker.fetch(new Request(`https://finance.test/?section=giving-analytics${query}`, { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), env);

describe('Giving › Council report (Finance)', () => {
  it('is the first Giving page: the dashboard for the General Fund this month', async () => {
    const { env, calls } = makeEnv();
    const html = await (await get(env, '')).text();
    expect(html).toContain('<h1 class="page-title">Council report</h1>');
    expect(calls.find((c) => c.path.endsWith('/giving-board-v1')).query.period).toMatch(/^\d{4}-\d{2}$/);
    expect(html).toContain('General Fund YTD');
    expect(html).toContain('$288,922');
    expect(html).toContain('−$28,023');
    expect(html).toContain('8.8% behind the $316,945 plan');
    expect(html).toContain('$385,594');
    expect(html).toContain('$39,406 under a $425,000 budget');
    expect(html).toContain('4 fewer than 2025 · $2,491 average');
    expect(html).toContain('Where the money comes from');
    expect(html).toContain('The ten largest households account for <strong>37%</strong>');
    expect(html).toContain('<svg viewBox="0 0 700 150"');
    expect(html).toContain('Funds inside General Fund');
    expect(html).toContain('(2 funds)');
    expect(html).toContain('Everything else');
    expect(html).toContain('Restricted &amp; designated <strong>$86,603</strong>');
    expect(html).toContain('Email packet');
  });

  it('writes the narrative for the chosen lens and period', async () => {
    const { env, calls } = makeEnv();
    const html = await (await get(env, '&page=council&view=narrative&period=2026-09&lens=general')).text();
    expect(calls.find((c) => c.path.endsWith('/giving-board-v1')).query.period).toBe('2026-09');
    expect(html).toContain('Giving Report to the Church Council');
    expect(html).toContain('Through September 30, 2026, the congregation has given <strong>$288,922</strong> to general fund — about $34,881 less than at this point last year, and about $28,023 less than the budget assumed.');
    expect(html).toContain('Counted through <strong>39 of 52 Sundays</strong>');
    expect(html).toContain('116 households have given so far, 4 fewer than last year');
    expect(html).toContain('Checks are 66% of giving.');
    expect(html).toContain('restricted &amp; designated $86,603');
  });

  it('lists categories for All giving and prints the other categories', async () => {
    const { env } = makeEnv();
    const all = await (await get(env, '&page=council&lens=all')).text();
    expect(all).toContain('By category');
    expect(all).toContain('href="/?section=giving-analytics&amp;page=council&amp;period=');
    const print = await (await get(env, '&page=council&print=1')).text();
    expect(print).toContain('Everything else — the other categories');
    expect(print).toContain('50010 Missions');
    expect(print).not.toContain('Email packet');
  });

  it('hides Email packet without Giving edit, and sends it through Connect with it', async () => {
    const { env: viewer } = makeEnv({ giving: 'anon' });
    expect(await (await get(viewer, '&page=council')).text()).not.toContain('Email packet');
    const { env, calls } = makeEnv();
    const res = await worker.fetch(new Request('https://finance.test/api/v1/giving-board-email', {
      method: 'POST', headers: { 'Cf-Access-Jwt-Assertion': 'jwt', 'Sec-Fetch-Site': 'same-origin' },
      body: new URLSearchParams({ to: 'a@example.org, b@example.org', subject: 'Council report', note: 'For Tuesday', lens: 'general', period: '2026-09', view: 'narrative' }),
    }), env);
    expect(res.status).toBe(303);
    const loc = new URL(res.headers.get('Location'), 'https://x');
    expect(Object.fromEntries(loc.searchParams)).toMatchObject({ page: 'council', period: '2026-09', lens: 'general', view: 'narrative', status: 'ok', msg: 'Report emailed to 2 addresses.' });
    const sent = calls.find((c) => c.path.endsWith('/giving-board-email-v1')).body;
    expect(sent.to).toBe('a@example.org, b@example.org');
    expect(sent.subject).toBe('Council report');
    expect(sent.html).toContain('For Tuesday');
    expect(sent.html).toContain('$288,922');
    expect(sent.html).not.toContain('<script');
  });

  it('adds Connect’s Analysis view: the distribution and a five-year trend, totals only', async () => {
    const { env, calls } = makeEnv({ giving: 'anon' });
    const html = await (await get(env, '&page=council&view=analysis&year=2025')).text();
    expect(calls.some((c) => c.path.endsWith('/giving-board-v1'))).toBe(false);
    const reads = calls.filter((c) => c.path.endsWith('/giving-reports-v1')).map((c) => c.query);
    expect(reads).toEqual([{ report: 'distribution', year: '2025', scope: 'household' }, { report: 'multiyear', end: '2025', years: '5' }]);
    expect(html).toContain('<span class="chip is-on">Analysis</span>');
    expect(html).toContain('href="/?section=giving-analytics&amp;page=council&amp;period=');
    expect(html).toContain('<option value="2025" selected>2025</option>');
    expect(html).toContain('Giving distribution · 2025');
    expect(html).toContain('$1,200');
    expect(html).toContain('41%');
    expect(html).not.toContain('$50,000+');
    expect(html).toContain('<svg viewBox="0 0 700 200"');
    expect(html).toContain('Five-year trend · through 2025');
    expect(html).toContain('<td class="num tone-muted">$450,000</td>');
    expect(html).toContain('2025 <span class="tone-muted">est.</span>');
    expect(html).toContain('Related giving reports');
    expect(html).toContain('href="/?section=giving-reports&amp;page=distribution&amp;year=2025"');
    const print = await (await get(env, '&page=council&view=analysis&year=2025&print=1')).text();
    expect(print).toContain('Giving distribution · 2025');
    expect(print).toContain('<svg viewBox="0 0 700 200"');
    expect(print).not.toContain('Related giving reports');
    expect(print).not.toContain('<select name="year">');
  });

  it('keeps council preview on the Analysis links and reports a failed read honestly', async () => {
    const { env } = makeEnv();
    env.CONNECT_SERVICE = { ...env.CONNECT_SERVICE, fetch: async (req) => (new URL(req.url).pathname.endsWith('/staff-role-v1')
      ? new Response(JSON.stringify({ role: 'admin', permissions: { finance: 'edit', giving: 'edit' } })) : new Response('{}', { status: 500 })) };
    const html = await (await get(env, '&page=council&view=analysis&council=1')).text();
    expect(html).toContain('The giving distribution could not be read from Connect');
    expect(html).toContain('The five-year trend could not be read from Connect');
    expect(html).toContain('<input type="hidden" name="council" value="1">');
    expect(html).toContain('page=funds-methods&amp;council=1');
  });

  it('groups funds by code and offers the same periods as Connect', () => {
    expect(groupByFundCode(BOARD.categories.general.funds)).toMatchObject([{ label: '40085 General Fund', actual: 26013000, budget: 28000000, prior: 29000000 }]);
    const periods = councilPeriods('2026-09-28').map((p) => p.value);
    expect(periods.slice(0, 2)).toEqual(['2026-09', '2026-08']);
    expect(periods).toContain('2026-Q3');
    expect(periods).toContain('2026-Q1');
    expect(periods.slice(-2)).toEqual(['2025', '2024']);
    expect(renderCouncilEmailHtml(BOARD, 'all', { note: '<b>x</b>' })).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});
