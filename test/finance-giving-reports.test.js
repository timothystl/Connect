import { describe, expect, it } from 'vitest';
import worker from '../apps/finance/shell.js';
import { givingReportParams, givingReportRequests, impactStatementsFromForm, pearson } from '../apps/finance/giving-reports-pages.js';
import { roleCanAccessSection } from '../apps/finance/connect-role-client.js';
import { FINANCE_PARITY_SECTIONS } from '../apps/finance/parity-manifest.js';

// Finance › Giving reports: Connect's Giving › Reports › Analysis, read live through
// giving-reports-v1. Fictional figures only.
const REPORTS = {
  distribution: { year: 2026, scope: 'household', givers: 3, total_cents: 900000, mean_cents: 300000, median_cents: 250000, top10_givers: 1, top10_share_pct: 44.4,
    tiers: [{ low_cents: 100000, high_cents: 250000, label: '$1,000–$2,499', givers: 1, total_cents: 150000, givers_pct: 33.3, total_pct: 16.7 }, { low_cents: 250000, high_cents: 500000, label: '$2,500–$4,999', givers: 2, total_cents: 750000, givers_pct: 66.7, total_pct: 83.3 }] },
  multiyear: { base_year: 2026, years: [{ year: 2025, givers: 3, total_cents: 800000, avg_giver_cents: 266667, adjusted_cents: 820000, cpi_estimated: true }, { year: 2026, givers: 3, total_cents: 900000, avg_giver_cents: 300000, adjusted_cents: 900000, cpi_estimated: true }] },
  summary: { from: '2026-01-01', to: '2026-12-31', grand_total_cents: 900000, total_givers: 3, total_transactions: 9,
    rows: [{ fund_name: '40085 General Fund', contributions: 6, total_cents: 700000 }, { fund_name: '40085 Advent', contributions: 1, total_cents: 50000 }, { fund_name: '50010 Missions', contributions: 2, total_cents: 150000 }],
    by_method: [{ method: 'check', contributions: 6, total_cents: 600000 }, { method: 'ach', contributions: 3, total_cents: 300000 }],
    by_age_group: [{ key: 'a45_64', label: '45–64', givers: 2, contributions: 7, total_cents: 700000 }, { key: 'unknown', label: 'Unknown (no DOB)', givers: 0, contributions: 0, total_cents: 0 }] },
  'vs-attendance': { from: '2026-03-01', to: '2026-03-31', weeks: [
    { week_start: '2026-03-01', attendance: 120, giving_cents: 150000 }, { week_start: '2026-03-08', attendance: 110, giving_cents: 140000 },
    { week_start: '2026-03-15', attendance: 90, giving_cents: 100000 }, { week_start: '2026-03-22', attendance: 130, giving_cents: 170000 }] },
  insights: { year: 2026, top_givers: [{ id: 1, first_name: 'Ada', last_name: 'Sample', member_type: 'member', gifts: 12, total_cents: 400000 }],
    lapsed: [{ id: 3, first_name: 'Cara', last_name: 'Example', member_type: '', prior_total_cents: 90000, prior_gifts: 3, last_gift_date: '2025-11-02' }],
    frequency: [{ label: '1 gift', n: 1 }, { label: '2–5 gifts', n: 2 }], trend: [{ year: 2026, givers: 3, gifts: 9, total_cents: 900000, avg_gift_cents: 100000, avg_giver_cents: 300000 }] },
  yoy: { base_year: 2026, years: ['2024', '2025', '2026'], people: [
    { id: 1, first_name: 'Ada', last_name: 'Sample', member_type: 'member', by_year: { 2025: { total_cents: 300000 }, 2026: { total_cents: 400000 } }, curr_total: 400000, prior_total: 300000, change_cents: 100000, change_pct: 33.3 },
    { id: 3, first_name: 'Cara', last_name: 'Example', member_type: '', by_year: { 2025: { total_cents: 90000 } }, curr_total: 0, prior_total: 90000, change_cents: -90000, change_pct: -100 }] },
  plateaus: { year: 2026, scope: 'household', partial: true, low_frequency_max: 3, excluded_organizations: { count: 1, total_cents: 50000 },
    summary: { total_givers: 2, low_frequency_givers: 1, total_upside_modest_annual_cents: 104000, total_upside_generous_annual_cents: 312000 },
    tiers: [{ target_cents: 5000, num_people: 1, plateau_min_cents: 4000, plateau_max_cents: 4000, avg_weekly_increase_cents: 1000, upside_modest_annual_cents: 52000, upside_generous_annual_cents: 156000,
      people: [{ id: 'h:1', name: 'Sample Household', weekly_cents: 4000, total_cents: 160000, gifts: 40, cadence_label: 'weekly', low_frequency: false,
        options: [{ label: 'Modest', target_cents: 5000, delta_cents: 1000, annual_delta_cents: 52000, impact_text: 'a month of Sunday school supplies' }, { label: 'Standard', target_cents: 6000, delta_cents: 2000, annual_delta_cents: 104000 }, { label: 'Generous', target_cents: 7500, delta_cents: 3500, annual_delta_cents: 182000 }] }] }],
    distribution: [{ plateau_dollars: 40, n: 1 }, { plateau_dollars: 45, n: 0 }],
    low_frequency_givers_list: [{ id: 'p:3', name: 'Cara Example', total_cents: 30000, gifts: 2, avg_gift_cents: 15000, all_manual_methods: true }] },
  bands: { year: 2026, scope: 'household', freq: 'weekly', partial: false, periods_elapsed: 52, periods_per_year: 52, uplift_cents: 1000,
    summary: { givers: 2, total_cents: 300000, current_annualized_cents: 300000, uplift_annual_cents: 104000 },
    bands: [{ low_cents: 0, high_cents: 2500, n: 1, total_cents: 100000, avg_per_period_cents: 1923, uplift_annual_cents: 52000 }, { low_cents: 50000, high_cents: null, n: 0, total_cents: 0, avg_per_period_cents: 0, uplift_annual_cents: 0 }] },
  funds: { funds: [{ id: 4, name: '40085 General Fund' }] },
  impact: { statements: [{ monthly_cents: 5000, label: 'a month of Sunday school supplies' }], can_edit: true },
};

const YOY_FULL = REPORTS.yoy;

function env(role = 'finance', permissions = { finance: 'edit', giving: 'edit' }) {
  const calls = [];
  return { ENVIRONMENT: 'production', FINANCE_CONTRACT_API_KEY: 'key', RELEASE_SHA: 'test', calls,
    FINANCE_DB: { prepare: (sql) => ({ sql, bind() { return this; }, async first() { return null; }, async all() { return { results: [] }; }, async run() { return {}; } }) },
    CONNECT_SERVICE: { async fetch(req) {
      const u = new URL(req.url);
      if (u.pathname.endsWith('staff-role-v1')) return Response.json({ role, permissions, username: 'tester' });
      calls.push({ path: u.pathname, query: Object.fromEntries(u.searchParams), method: req.method, body: req.method === 'POST' ? await req.json() : null });
      if (u.pathname.endsWith('giving-impact-write-v1')) return Response.json({ ok: true, statements: calls.at(-1).body.statements });
      const name = u.searchParams.get('report');
      return REPORTS[name] ? Response.json({ contract: 'connect.giving-reports.v1', report: name, ...REPORTS[name] }) : Response.json({ error: 'Unknown giving report' }, { status: 404 });
    } } };
}
const call = (e, path, init = {}) => worker.fetch(new Request('https://finance.test' + path, { ...init, headers: { 'Cf-Access-Jwt-Assertion': 'jwt', ...(init.headers || {}) } }), e);
const page = async (e, p, q = '') => (await call(e, `/?section=giving-reports&page=${p}${q}`)).text();

describe('Finance › Giving reports', () => {
  it('is seven pages under the Giving group, open to council for the totals only', () => {
    const section = FINANCE_PARITY_SECTIONS.find((s) => s.id === 'giving-reports');
    expect(section.group).toBe('Giving');
    expect(section.pages.map((p) => p.id)).toEqual(['distribution', 'funds-methods', 'attendance', 'insights', 'giver-trends', 'plateaus', 'bands']);
    expect(roleCanAccessSection('council', section, { giving: 'anon' })).toBe(true);
    expect(roleCanAccessSection('staff', section, { giving: 'none', finance: 'edit' })).toBe(false);
  });

  it('shows distribution, median, top 10% and the five-year trend', async () => {
    const e = env();
    const html = await page(e, 'distribution', '&year=2026');
    expect(html).toContain('$2,500');
    expect(html).toContain('44.4%');
    expect(html).toContain('$2,500–$4,999');
    expect(html).toContain('Five years of giving');
    expect(e.calls.map((c) => c.query)).toEqual([{ report: 'distribution', year: '2026', scope: 'household' }, { report: 'multiyear', end: '2026', years: '5' }]);
  });

  it('shows giving by fund (grouped by account code), by method and by age for a range', async () => {
    const e = env();
    const html = await page(e, 'funds-methods', '&from=2026-01-01&to=2026-06-30');
    expect(e.calls[0].query).toEqual({ report: 'summary', from: '2026-01-01', to: '2026-06-30' });
    expect(html).toContain('(2 funds)');
    expect(html).toContain('ACH / bank');
    expect(html).toContain('45–64');
    expect(html).not.toContain('Unknown (no DOB)');
    expect(html).toContain('$1,000'); // average gift, $9,000 ÷ 9
  });

  it('charts giving against attendance with the correlation', async () => {
    const html = await page(env(), 'attendance', '&from=2026-03-01&to=2026-03-31');
    expect(html).toContain('<svg');
    expect(html).toContain('Strong positive');
    expect(pearson([[1, 2], [2, 4], [3, 6]])).toBeCloseTo(1);
    expect(pearson([[1, 2], [0, 4]])).toBeNull();
  });

  it('lists top, lapsed and each giver’s change for Giving view', async () => {
    const insights = await page(env(), 'insights', '&year=2026');
    expect(insights).toContain('Ada Sample');
    expect(insights).toContain('Lapsed: gave in 2025, nothing in 2026');
    expect(insights).toContain('Cara Example');
    const trends = await page(env(), 'giver-trends', '&year=2026');
    expect(trends).toContain('Gave more');
    expect(trends).toContain('Stopped');
    expect(trends).toContain('+33.3%');
  });

  it('prorates the current year: to date against last year to the same day, with a projected year-end', async () => {
    const e = env();
    const base = { first_name: 'Ada', last_name: 'Sample', member_type: 'member', by_year: {}, curr_total: 0, change_cents: 0, change_pct: null };
    REPORTS.yoy = { base_year: 2026, years: ['2024', '2025', '2026'], partial: true, as_of: '2026-09-28', prior_as_of: '2025-09-28', year_elapsed: 0.742, people: [
      // Behind last year's whole year, but ahead of where they were by September 28 last year.
      { ...base, id: 1, prior_total: 400000, curr_total: 330000, prior_ytd: 300000, curr_ytd: 330000, ytd_change_cents: 30000, ytd_change_pct: 10, projected_cents: 440000, projected_change_cents: 40000, projected_change_pct: 10 },
      { ...base, id: 2, first_name: 'Ben', prior_total: 100000, prior_ytd: 80000, curr_ytd: 40000, ytd_change_cents: -40000, ytd_change_pct: -50, projected_cents: 50000, projected_change_cents: -50000, projected_change_pct: -50 },
      { ...base, id: 3, first_name: 'Cara', last_name: 'Example', prior_total: 0, prior_ytd: 0, curr_ytd: 74200, ytd_change_cents: 74200, ytd_change_pct: null, projected_cents: 100000, projected_change_cents: 100000, projected_change_pct: null },
      { ...base, id: 4, first_name: 'Dana', last_name: 'Example', prior_total: 90000, prior_ytd: 90000, curr_ytd: 0, ytd_change_cents: -90000, ytd_change_pct: -100, projected_cents: 0, projected_change_cents: -90000, projected_change_pct: -100 },
      // Gave only in December last year: on the same schedule, so in no group.
      { ...base, id: 5, first_name: 'Eli', last_name: 'Example', prior_total: 50000, prior_ytd: 0, curr_ytd: 0, ytd_change_cents: 0, ytd_change_pct: null, projected_cents: 0, projected_change_cents: -50000, projected_change_pct: -100 },
    ] };
    try {
      const html = await page(e, 'giver-trends', '&year=2026');
      expect(html).toContain('<th>2025 full year</th><th>2025 to September 28</th><th>2026 to September 28</th><th>Change</th><th>%</th><th>Projected 2026</th><th>vs. 2025</th>');
      const section = (title) => html.slice(html.indexOf(`<h2>${title} `), html.indexOf('</section>', html.indexOf(`<h2>${title} `)));
      expect(section('Gave more')).toContain('Ada Sample');
      expect(section('Gave more')).toContain('<td>$4,000</td><td>$3,000</td><td>$3,300</td><td class="gr-up">+$300</td><td>+10%</td><td>$4,400</td><td class="gr-up">+$400</td>');
      expect(section('Gave less')).toContain('Ben Sample');
      expect(section('New this year')).toContain('Cara Example');
      expect(section('Stopped')).toContain('Dana Example');
      expect(html).not.toContain('Eli Example');
      expect(html).toContain('How this is figured.');
      expect(html).toContain('compared with their giving from January 1 through September 28, 2025');
      expect(html).toContain('74% of the year has gone by');
    } finally {
      REPORTS.yoy = YOY_FULL;
    }
  });

  it('shows plateaus with each step, impact statements, and bands with the uplift', async () => {
    const e = env();
    const plateaus = await page(e, 'plateaus', '&year=2026&fund_id=4&low_frequency_max=2');
    expect(e.calls.filter((c) => c.path.endsWith('giving-reports-v1')).map((c) => c.query.report)).toEqual(['plateaus', 'impact', 'funds']);
    // The follow-up queue is read with it, from Giving's named contract.
    expect(e.calls.map((c) => c.path.split('/').pop())).toContain('giving-analytics-people-v1');
    expect(plateaus).toContain('Follow-up queue');
    expect(plateaus).toContain('Next steps: the plateau ladder');
    expect(e.calls.find((c) => c.query.report === 'plateaus').query).toMatchObject({ fund_id: '4', low_frequency_max: '2', scope: 'household' });
    expect(plateaus).toContain('Sample Household');
    expect(plateaus).toContain('a month of Sunday school supplies');
    expect(plateaus).toContain('action="/api/v1/giving-impact"');
    expect(plateaus).toContain('Check or cash only');
    const e2 = env();
    const bands = await page(e2, 'bands', '&view=weekly&year=2026&uplift=0');
    expect(e2.calls[0].query).toMatchObject({ report: 'bands', freq: 'weekly', uplift_cents: '0' });
    expect(bands).toContain('<span class="is-on" aria-current="true">Weekly</span>');
    expect(bands).toContain('<input type="hidden" name="view" value="weekly">');
    // An older link that only says ?freq= still opens that view.
    const e3 = env();
    expect(await page(e3, 'bands', '&freq=monthly')).toContain('<span class="is-on" aria-current="true">Monthly</span>');
    expect(e3.calls[0].query).toMatchObject({ report: 'bands', freq: 'monthly', uplift_cents: '4000' });
    expect(bands).toContain('$500+/wk');
    expect(bands).toContain('+$1,040');
  });

  it('keeps named reports from council, asking Connect only for totals', async () => {
    const council = env('council', { giving: 'anon', compensation: 'edit' });
    for (const p of ['insights', 'giver-trends', 'plateaus', 'bands&view=weekly', 'bands&view=monthly']) {
      expect(await page(council, p)).toContain('names givers');
    }
    expect(council.calls).toEqual([]);
    // The Annual bands are totals only, so council reads them (from giving-analytics-v1).
    const annual = await page(council, 'bands');
    expect(annual).not.toContain('names givers');
    expect(council.calls.map((c) => c.path.split('/').pop())).toEqual(['giving-analytics-v1']);
    expect(await page(council, 'distribution')).toContain('Giving distribution');
    const preview = env('admin', {});
    expect(await page(preview, 'insights', '&council=1')).toContain('names givers');
    expect(preview.calls).toEqual([]);
  });

  it('saves impact statements through Connect, from Finance’s own form only', async () => {
    const e = env('admin', {});
    const form = new URLSearchParams({ monthly_0: '50', label_0: 'a month of Sunday school supplies', monthly_1: '', label_1: 'no amount', monthly_2: '20', label_2: '' });
    const r = await call(e, '/api/v1/giving-impact', { method: 'POST', body: form, headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: 'https://finance.test' } });
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toContain('page=plateaus');
    expect(r.headers.get('location')).toContain('status=ok');
    expect(e.calls[0].body).toEqual({ statements: [{ monthly_cents: 5000, label: 'a month of Sunday school supplies' }] });
    const cross = await call(env('admin', {}), '/api/v1/giving-impact', { method: 'POST', body: form, headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Sec-Fetch-Site': 'cross-site' } });
    expect(cross.headers.get('location')).toContain('status=error');
    expect(impactStatementsFromForm({ monthly_0: '-5', label_0: 'x' })).toEqual([]);
  });

  it('validates its choices before asking Connect', () => {
    const p = givingReportParams(new URLSearchParams('year=1999&scope=everyone&from=2026-05-01&to=2026-02-01&fund_id=4;drop&freq=monthly&uplift=abc'), '2026-09-28');
    expect(p).toMatchObject({ year: 2026, scope: 'household', from: '2026-02-01', to: '2026-05-01', fund: '', freq: 'monthly', uplift: 40 });
    expect(givingReportRequests('bands', p)[0][1]).toMatchObject({ uplift_cents: 4000, freq: 'monthly' });
  });
});
