import { describe, expect, it } from 'vitest';
import worker from '../apps/finance/shell.js';
import { projectWhatIf, whatIfBaseline } from '../apps/finance/giving-analytics-pages.js';

const TOTALS = {
  contract: 'connect.giving-analytics.v1', as_of: '2026-09-20', year: 2026, year_elapsed: 0.72,
  totals: { ytd_cents: 61230000, prior_ytd_cents: 58810000, mtd_cents: 4360000, prior_mtd_cents: 4190000, ytd_online_cents: 28170000, prior_ytd_online_cents: 22940000, ytd_gifts: 5200, first_time_givers: 31 },
  months: [
    { month: '2025-01', cents: 7010000 }, { month: '2025-02', cents: 6840000 }, { month: '2025-03', cents: 8290000 }, { month: '2025-09', cents: 7200000 },
    { month: '2026-01', cents: 7280000 }, { month: '2026-02', cents: 6990000 }, { month: '2026-03', cents: 8610000 }, { month: '2026-09', cents: 4360000 },
  ],
  funds: [{ fund_name: 'General Fund', cents: 51200000 }, { fund_name: 'Building Fund', cents: 5800000 }],
  weeks: Array.from({ length: 13 }, (_, i) => ({ week_ending: `2026-${i < 1 ? '06-21' : '09-20'}`, cents: 1600000 + i * 10000, gifts: 90 })),
  households: {
    ytd_households: 398, prior_ytd_households: 390, last_year_households: 399, both_years_households: 347,
    bands: [
      { label: 'Under $500', households: 142, cents: 2840000 }, { label: '$500 – $999', households: 58, cents: 4180000 },
      { label: '$1,000 – $2,499', households: 96, cents: 15830000 }, { label: '$2,500 – $4,999', households: 61, cents: 21460000 },
      { label: '$5,000 – $9,999', households: 31, cents: 20620000 }, { label: '$10,000 and up', households: 10, cents: 26910000 },
    ],
    concentration: { households: 398, deciles: [0.48, 0.17, 0.11, 0.08, 0.06, 0.04, 0.03, 0.01, 0.01, 0.01].map((share) => ({ households: 40, share })), top_ten_share: 0.24, top_ten_share_last_year: 0.27, median_cents: 112000, households_1000_plus: 198 },
    t12_households: 398, t12_cents: 91840000, retained_households: 376, two_years_ago_households: 400,
    new_last_year_households: 24, new_last_year_avg_cents: 104000, last_year_avg_cents: 231000,
  },
  pledges: { pledgers: 212, pledged_cents: 68400000, received_cents: 48630000, given_cents: 50100000, fulfilled: 20, on_pace: 120, behind: 50, not_started: 22 },
};
const PEOPLE = {
  contract: 'connect.giving-analytics-people.v1', as_of: '2026-09-20', year: 2026,
  nudges: {
    done_this_month: 9,
    kinds: [
      { key: 'first_time', label: 'First-time givers', open_count: 1, items: [{ subject_key: 'ge7:2026-09-13', episode: '2026-09-13', name: 'Jordan Ellis', detail: 'First gift 2026-09-13 · General Fund', cents: 15000, assigned_to: 'pastor', done: false }] },
      { key: 'stopped', label: 'Stopped giving', open_count: 1, items: [{ subject_key: 'p:3', episode: '2026-05-03', name: 'Anna Schreiber', detail: 'Last gift 2026-05-03 · gave in 11 of the prior 12 months', cents: 110000, assigned_to: '', done: false }] },
      { key: 'giving_down', label: 'Giving down', open_count: 0, items: [] },
      { key: 'pledge_behind', label: 'Pledge behind', open_count: 0, items: [] },
      { key: 'stepped_up', label: 'Stepped up', open_count: 0, items: [] },
    ],
  },
  statements: { giving_households_ytd: 391, runs: [{ year: 2025, letter_type: 'year_end', email: 309, print: 103, last_sent: '2026-01-21 09:00:00' }] },
  staff: [{ username: 'pastor', name: 'Pastor Dinger' }, { username: 'sarah', name: 'Sarah' }],
};

function makeEnv({ role = 'finance', giving = 'edit', refuse } = {}) {
  const calls = [];
  const env = {
    ENVIRONMENT: 'staging', RELEASE_SHA: 't', FINANCE_DB: { prepare: (sql) => ({ sql }) }, FINANCE_CONTRACT_API_KEY: 'k',
    CONNECT_SERVICE: {
      async fetch(req) {
        const url = new URL(req.url);
        const body = req.method === 'POST' ? await req.json() : null;
        calls.push({ path: url.pathname, query: url.search, body, jwt: req.headers.get('Cf-Access-Jwt-Assertion') });
        if (url.pathname.endsWith('/staff-role-v1')) return new Response(JSON.stringify({ role, permissions: { finance: 'edit', giving } }));
        if (refuse) return new Response(JSON.stringify({ error: 'Updating a giving follow-up requires Giving edit access' }), { status: 403 });
        if (url.pathname.endsWith('/giving-analytics-v1')) return new Response(JSON.stringify(TOTALS));
        if (url.pathname.endsWith('/giving-analytics-people-v1')) return new Response(JSON.stringify(PEOPLE));
        if (url.pathname.endsWith('/giving-followup-write-v1')) return new Response(JSON.stringify({ ok: true }));
        return new Response('{}', { status: 404 });
      },
    },
  };
  return { env, calls };
}
const get = (env, query) => worker.fetch(new Request(`https://finance.test/?section=giving-analytics${query}`, { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), env);
const post = (env, fields, headers = {}) => worker.fetch(new Request('https://finance.test/api/v1/giving-followup-write', {
  method: 'POST', headers: { 'Cf-Access-Jwt-Assertion': 'jwt', 'Sec-Fetch-Site': 'same-origin', ...headers }, body: new URLSearchParams(fields),
}), env);
const paths = (calls) => calls.map((c) => c.path.split('/').pop());
// Household bands and the nudge queue now live on Giving reports' combined pages.
const reports = (env, query) => worker.fetch(new Request(`https://finance.test/?section=giving-reports${query}`, { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), env);

describe('Giving analytics pages (Finance v3)', () => {
  it('shows Trends from Connect’s totals, naming nobody', async () => {
    const { env, calls } = makeEnv();
    const html = await (await get(env, '&page=trends')).text();
    expect(html).toContain('<h1 class="page-title">Trends</h1>');
    expect(html).toContain('$612,300');
    expect(html).toContain('+4.1% vs. 2025 to date');
    expect(html).toContain('31 first-time givers this year');
    expect(html).toContain('Up from 39% last year');
    expect(html).toContain('General Fund');
    expect(paths(calls)).toContain('giving-analytics-v1');
    expect(paths(calls)).not.toContain('giving-analytics-people-v1');
  });

  it('compares months and the same days of last year on Year over year', async () => {
    const { env } = makeEnv();
    const html = await (await get(env, '&page=year-over-year')).text();
    expect(html).toContain('Same period 2025');
    expect(html).toContain('347');
    expect(html).toContain('87% of 399 households from 2025 have given again');
    expect(html).toContain('<td>$82,900</td><td>$86,100</td><td class="tone-good">+$3,200</td>');
    expect(html).toContain('Sep (2026 to date; all of 2025)');
    expect(html).toContain('<tr class="total-row"><td>Jan–Aug</td>');
    expect(html).toContain('ga-bar is-best');
  });

  it('lets every totals page switch between all funds, the General Fund, and one fund', async () => {
    const scoped = (fund) => ({
      ...TOTALS,
      fund: fund === 'general' ? { key: 'general', label: 'General Fund', fund_count: 3 }
        : fund === 'donor' ? { key: 'donor', label: 'Donor giving', fund_count: 5 }
          : fund === 'revenue' ? { key: 'revenue', label: 'All revenue except MDO', fund_count: 8 }
            : fund && fund !== 'all' ? { key: fund, label: 'Building Fund', fund_count: 1 } : { key: 'all', label: 'All funds', fund_count: 9 },
      fund_options: [{ key: 'general', label: 'General Fund' }, { key: 'donor', label: 'Donor giving' }, { key: 'revenue', label: 'All revenue except MDO' }, { key: 'all', label: 'All funds' }, { key: '8', label: 'Building Fund' }, { key: '7', label: '40085 General Fund' }],
      funds: [{ fund_id: 7, fund_name: '40085 General Fund', category: 'general', cents: 51200000 }, { fund_id: 8, fund_name: 'Building Fund', category: 'restricted', cents: 5800000 }],
      categories: [
        { key: 'general', label: 'General Fund', cents: 51200000, prior_cents: 50000000, fund_count: 3 },
        { key: 'restricted', label: 'Restricted & designated', cents: 5800000, prior_cents: 0, fund_count: 2 },
        { key: 'earned', label: 'Earned income', cents: 2000000, prior_cents: 1000000, fund_count: 2 },
        { key: 'passive', label: 'Passive income', cents: 1000000, prior_cents: 1000000, fund_count: 1 },
        { key: 'mdo', label: 'MDO income', cents: 0, prior_cents: 0, fund_count: 0 },
      ],
    });
    const { env, calls } = makeEnv();
    const inner = env.CONNECT_SERVICE.fetch;
    env.CONNECT_SERVICE.fetch = async (req) => {
      const url = new URL(req.url);
      if (url.pathname.endsWith('/giving-analytics-v1')) {
        calls.push({ path: url.pathname, query: url.search, body: null });
        return new Response(JSON.stringify(scoped(url.searchParams.get('fund'))));
      }
      return inner(req);
    };
    // The General Fund is the default.
    const gf = await (await get(env, '&page=year-over-year')).text();
    expect(calls.at(-1).query).toBe('?fund=general');
    expect(gf).toContain('<a href="/?section=giving-analytics&amp;page=year-over-year" class="is-on" aria-current="true">General Fund</a>');
    expect(gf).toContain('<option value="8">Building Fund</option>');
    expect(gf).toContain('General Fund giving by month, 2025 and 2026');
    expect(gf).toContain('General Fund gifts only (3 funds');
    expect(gf).toContain('href="/?section=giving-analytics&amp;page=trends"');

    // General Fund, donor giving and all revenue except MDO are the three tabs.
    expect(gf).toContain('<a href="/?section=giving-analytics&amp;page=year-over-year&amp;fund=donor">Donor giving</a>');
    expect(gf).toContain('<a href="/?section=giving-analytics&amp;page=year-over-year&amp;fund=revenue">All revenue (no MDO)</a>');
    const donor = await (await get(env, '&page=trends&fund=donor')).text();
    expect(calls.at(-1).query).toBe('?fund=donor');
    expect(donor).toContain('class="is-on" aria-current="true">Donor giving</a>');
    expect(donor).toContain('Every donor gift: the General Fund plus restricted and designated funds (5 funds)');
    expect(donor).toContain('Giving year to date');
    const revenue = await (await get(env, '&page=trends&fund=revenue')).text();
    expect(calls.at(-1).query).toBe('?fund=revenue');
    expect(revenue).toContain('class="is-on" aria-current="true">All revenue (no MDO)</a>');
    expect(revenue).toContain('All revenue entered in Connect except MDO');
    expect(revenue).toContain('Revenue year to date');
    // The revenue mix: donations split unrestricted and restricted, then earned, passive and MDO.
    expect(revenue).toContain('Where the money comes from, year to date');
    for (const text of ['Donations', 'Unrestricted (General Fund)', 'Restricted &amp; designated', 'Earned income', 'Passive income', 'MDO income', '$570,000', '$600,000', '+100.0% vs. last year']) {
      expect(revenue).toContain(text);
    }
    expect(revenue).toContain('<a href="/?section=giving-analytics&amp;page=trends&amp;fund=revenue" aria-current="true">All revenue (no MDO)</a> $600,000');
    const pledges = await (await get(env, '&page=pledges&fund=revenue')).text();
    expect(pledges).toContain('2026 gifts to all revenue except MDO only');

    const all = await (await get(env, '&page=year-over-year&fund=all')).text();
    expect(calls.at(-1).query).toBe('?fund=all');
    expect(all).toContain('<option value="all" selected>All funds</option>');
    expect(all).toContain('Every gift entered in Connect counts');
    // The sidebar keeps a non-default choice while moving between Giving pages.
    expect(all).toContain('href="/?section=giving-analytics&amp;page=trends&amp;fund=all"');

    for (const page of ['trends', 'year-over-year', 'pledges', 'what-if']) {
      const html = await (await get(env, `&page=${page}&fund=8`)).text();
      expect(calls.at(-1).query).toBe('?fund=8');
      expect(html).toContain('<option value="8" selected>Building Fund</option>');
      expect(html).toContain('Building Fund');
    }
    const annual = await (await reports(env, '&page=bands&fund=8')).text();
    expect(calls.filter((c) => c.path.endsWith('/giving-analytics-v1')).at(-1).query).toBe('?fund=8');
    expect(annual).toContain('<option value="8" selected>Building Fund</option>');
    expect(annual).toContain('<input type="hidden" name="view" value="annual">');
    const whatIf = await (await get(env, '&page=what-if&fund=8&council=1')).text();
    expect(whatIf).toContain('<input type="hidden" name="fund" value="8"><input type="hidden" name="council" value="1">');
    expect(whatIf).toContain('Projected 2027 household giving for Building Fund');
    const trends = await (await get(env, '&page=trends')).text();
    expect(trends).toContain('<a href="/?section=giving-analytics&amp;page=trends&amp;fund=8">Building Fund</a>');
    const concentration = await (await worker.fetch(new Request('https://finance.test/?section=charts&page=concentration', { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), env)).text();
    expect(calls.at(-1).query).toBe('?fund=general');
    expect(concentration).toContain('Showing the General Fund only.');
    expect(concentration).toContain('href="/?section=charts&amp;page=concentration" class="is-on"');
  });

  it('lists household bands (now Giving reports › Giving bands, Annual) and pledge progress', async () => {
    const { env } = makeEnv();
    const bands = await (await reports(env, '&page=bands')).text();
    expect(bands).toContain('<h1 class="page-title">Giving bands</h1>');
    expect(bands).toContain('<span class="is-on" aria-current="true">Annual</span>');
    expect(bands).toContain('href="/?section=giving-reports&amp;page=bands&amp;view=weekly');
    expect(bands).toContain('<td>$10,000 and up</td><td>10</td><td>3%</td><td>$269,100</td><td>29%</td>');
    expect(bands).toContain('No names are shown on this page.');
    // The old Household bands link lands on the Annual view, keeping its fund.
    const old = await get(env, '&page=household-bands&fund=donor&evil=1');
    expect(old.status).toBe(303);
    expect(old.headers.get('Location')).toBe('/?section=giving-reports&page=bands&view=annual&fund=donor');
    const pledges = await (await get(env, '&page=pledges')).text();
    expect(pledges).toContain('$684,000');
    expect(pledges).toContain('212 pledgers');
    expect(pledges).toContain('71% · 72% of the year gone');
  });

  it('projects next year from adjustable assumptions without saving anything', async () => {
    const base = whatIfBaseline(TOTALS.households);
    expect(base).toMatchObject({ households: 398, average: 2308, retention: 94, new_households: 24 });
    const p = projectWhatIf(base, new URLSearchParams('households=400&average=2400&retention=95&new_households=30'));
    expect(p.returning).toBe(380);
    expect(p.returningCents).toBe(380 * 2400 * 100);
    const { env, calls } = makeEnv();
    const html = await (await get(env, '&page=what-if&households=400&average=2400&retention=95&new_households=30')).text();
    expect(html).toContain('Assumptions for 2027');
    expect(html).toContain('name="retention" value="95"');
    expect(html).toContain('Reset to actual');
    expect(calls.every((c) => c.body === null)).toBe(true);
  });

  it('lets the new-household ratio and an average gift change be set, and explains every assumption', () => {
    const base = whatIfBaseline(TOTALS.households);
    // 1,040 ÷ 2,310 = 45%; retention 376 of 400 = 94%.
    expect(Math.round(base.newRatio * 100)).toBe(45);
    expect(base).toMatchObject({ retentionMeasured: true, newRatioMeasured: true });
    const plain = projectWhatIf(base, new URLSearchParams('households=400&average=2400&retention=95&new_households=30'));
    expect(plain.inputs).toMatchObject({ new_ratio: 45, gift_change: 0 });
    expect(plain.newCents).toBe(Math.round(30 * 240000 * 0.45));
    const changed = projectWhatIf(base, new URLSearchParams('households=400&average=2400&retention=95&new_households=30&new_ratio=60&gift_change=2.5'));
    expect(changed.averageCents).toBe(246000);
    expect(changed.returningCents).toBe(380 * 246000);
    expect(changed.newCents).toBe(Math.round(30 * 246000 * 0.6));
    expect(changed.totalCents).toBe(changed.returningCents + changed.newCents);
    expect(projectWhatIf(base, new URLSearchParams('gift_change=-500&new_ratio=900')).inputs).toMatchObject({ gift_change: -100, new_ratio: 150 });
    // With no earlier year to measure, the fixed guesses are used and flagged.
    const empty = whatIfBaseline({ t12_households: 0, t12_cents: 0 });
    expect(empty).toMatchObject({ retention: 90, newRatio: 0.45, retentionMeasured: false, newRatioMeasured: false });
  });

  it('shows how the what-if is figured, with the values Connect’s records gave', async () => {
    const { env } = makeEnv();
    const html = await (await get(env, '&page=what-if&new_ratio=60&gift_change=3')).text();
    expect(html).toContain('How this is figured');
    expect(html).toContain('A household is a Connect household, or one person with no household.');
    expect(html).toContain('Gifts to every fund count.');
    expect(html).toContain('The 12 months ending September 20, 2026');
    expect(html).toContain('<span class="ga-method-value">398 households · $2,308 average</span>');
    expect(html).toContain('Households that gave in both 2024 and 2025, divided by households that gave in 2024 (376 of 400).');
    expect(html).toContain('<span class="ga-method-value">94%</span>');
    expect(html).toContain('Households that gave in 2025 but not in 2024');
    expect(html).toContain('($1,040) divided by the average 2025 total of every giving household ($2,310), capped at 150%.');
    expect(html).toContain('<span class="ga-method-value">45%</span>');
    expect(html).toContain('no raise, no inflation');
    expect(html).toContain('For calendar 2027');
    expect(html).toContain('name="new_ratio" value="60"');
    expect(html).toContain('name="gift_change" value="3"');
    expect(html).toContain('<dt>Average gift used</dt><dd>$2,377</dd>');
  });

  it('links statements to Connect, and hides named pages for council', async () => {
    const { env } = makeEnv();
    const html = await (await get(env, '&page=statements')).text();
    expect(html).toContain('Year-end statement · 2025');
    expect(html).toContain('Email 309 · print 103');
    expect(html).toContain('href="https://connect.timothystl.org/?pane=letters#giving"');
    const council = makeEnv({ role: 'council', giving: 'anon' });
    const hidden = await (await reports(council.env, '&page=plateaus')).text();
    expect(hidden).toContain('Nudges and next steps names givers');
    expect(hidden).not.toContain('Anna Schreiber');
    expect(paths(council.calls)).not.toContain('giving-analytics-people-v1');
    const preview = makeEnv();
    const previewed = await (await get(preview.env, '&page=statements&council=1')).text();
    expect(previewed).toContain('Giving statements name each household');
    expect(paths(preview.calls)).not.toContain('giving-analytics-people-v1');
  });

  it('shows nudges with assign and done forms, and relays them to Connect', async () => {
    const { env, calls } = makeEnv();
    // The old Giving nudges link lands on Giving reports › Nudges and next steps.
    const moved = await get(env, '&page=nudges&kind=stopped');
    expect(moved.status).toBe(303);
    expect(moved.headers.get('Location')).toBe('/?section=giving-reports&page=plateaus&kind=stopped');
    const html = await (await reports(env, '&page=plateaus&kind=stopped')).text();
    expect(html).toContain('Follow-up queue');
    expect(html.indexOf('Follow-up queue')).toBeLessThan(html.indexOf('Next steps: the plateau ladder'));
    expect(html).toContain('href="/?section=giving-reports&amp;page=plateaus&amp;year=2026&amp;scope=household&amp;low_frequency_max=3&amp;kind=first_time"');
    expect(html).toContain('Anna Schreiber');
    expect(html).toContain('Done this month');
    expect(html).toContain('<option value="pastor">Pastor Dinger</option>');
    expect(html).toContain('value="done"');
    const res = await post(env, { op: 'assign', kind: 'stopped', subject_key: 'p:3', episode: '2026-05-03', assigned_to: 'pastor' });
    expect(res.status).toBe(303);
    expect(res.headers.get('Location')).toBe('/?section=giving-reports&page=plateaus&kind=stopped&status=ok&msg=Nudge+assigned.');
    expect(calls.find((c) => c.path.endsWith('/giving-followup-write-v1')).body).toEqual({ op: 'assign', kind: 'stopped', subject_key: 'p:3', episode: '2026-05-03', assigned_to: 'pastor' });
    const first = await (await reports(env, '&page=plateaus')).text();
    expect(first).toContain('href="https://connect.timothystl.org/?pane=receipts#giving"');
    const viewOnly = makeEnv({ giving: 'view' });
    expect(await (await reports(viewOnly.env, '&page=plateaus&kind=stopped')).text()).not.toContain('value="done"');
  });

  it('shows Connect’s refusal and refuses cross-site posts and unknown actions itself', async () => {
    const refused = makeEnv({ refuse: true });
    const res = await post(refused.env, { op: 'done', kind: 'stopped', subject_key: 'p:3', episode: '2026-05-03' });
    expect(decodeURIComponent(res.headers.get('Location').replace(/\+/g, ' '))).toContain('requires Giving edit access');
    const { env, calls } = makeEnv();
    expect((await post(env, { op: 'done', kind: 'stopped' }, { 'Sec-Fetch-Site': 'cross-site' })).headers.get('Location')).toContain('status=error');
    expect((await post(env, { op: 'erase', kind: 'stopped' })).headers.get('Location')).toContain('Unknown+action');
    expect(calls.filter((c) => c.path.endsWith('/giving-followup-write-v1'))).toHaveLength(0);
    const page = await (await get(refused.env, '&page=trends')).text();
    expect(page).toContain('Giving trends could not be read from Connect');
  });

  it('shows giving concentration on Charts, from totals only', async () => {
    const { env, calls } = makeEnv({ role: 'council', giving: 'anon' });
    const html = await (await worker.fetch(new Request('https://finance.test/?section=charts&page=concentration', { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), env)).text();
    expect(html).toContain('<h1 class="page-title">Giving concentration</h1>');
    expect(html).toContain('24% of giving');
    expect(html).toContain('Down from 27% in 2025');
    expect(html).toContain('$1,120');
    expect(html).toContain('ga-decile-bar is-top');
    expect(html).toContain('<td>Top 50%</td><td>200</td><td>90%</td>');
    expect(paths(calls)).toContain('giving-analytics-v1');
    expect(paths(calls)).not.toContain('giving-analytics-people-v1');
  });
});
