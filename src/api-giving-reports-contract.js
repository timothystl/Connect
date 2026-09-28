// ── giving-reports-v1: Connect's Giving analysis reports, read by Finance ──────────────────────
// Finance › Giving reports (apps/finance/giving-reports-pages.js) shows the reports that were
// Connect's Giving › Reports › Analysis: distribution, by fund and by method, giving and
// attendance, insights (top and lapsed givers), each giver's year over year, plateaus with
// impact statements, and weekly/monthly bands. Every figure is computed by the same handlers
// Connect's own reports use (api-reports.js), so the two can never disagree.
//
// Access follows Connect's rules for each report: distribution, fund/method, the multi-year trend
// and giving-vs-attendance are totals only, readable with any Giving access (council's anonymous
// level too); the named reports (insights, year over year, plateaus) and bands need Giving view.
// Only each report's own query parameters are passed through. Impact statements are read with the
// plateau report and changed only by an admin (giving-impact-write-v1), as in Connect.
import { json } from './auth.js';
import { handleReportsApi } from './api-reports.js';
import { authorizeGivingAnalyticsContract } from './api-giving-analytics-contracts.js';
import { readImpactStatements, writeImpactStatements } from './giving-impact.js';

export const GIVING_REPORTS = Object.freeze({
  distribution: { seg: 'reports/giving-distribution', level: 'aggregate', params: ['year', 'scope'] },
  multiyear: { seg: 'reports/giving-multiyear', level: 'aggregate', params: ['end', 'years'] },
  summary: { seg: 'reports/giving-summary', level: 'aggregate', params: ['from', 'to'] },
  'by-method': { seg: 'reports/giving-by-method', level: 'aggregate', params: ['from', 'to'] },
  'vs-attendance': { seg: 'reports/giving-vs-attendance', level: 'aggregate', params: ['from', 'to'] },
  insights: { seg: 'reports/giving-insights', level: 'people', params: ['year', 'top'] },
  yoy: { seg: 'reports/giving-yoy', level: 'people', params: ['year', 'as_of'] },
  plateaus: { seg: 'reports/giving-plateaus', level: 'people', params: ['year', 'scope', 'fund_id', 'low_frequency_max'] },
  bands: { seg: 'reports/giving-bands', level: 'people', params: ['year', 'scope', 'freq', 'uplift_cents', 'fund_id'] },
  funds: { level: 'aggregate' },
  impact: { level: 'people' },
});

export async function handleGivingReportsContracts(req, env, path) {
  if (path === '/api/contracts/giving-reports-v1' && req.method === 'GET') {
    const url = new URL(req.url);
    const name = url.searchParams.get('report') || '';
    const report = Object.prototype.hasOwnProperty.call(GIVING_REPORTS, name) ? GIVING_REPORTS[name] : null;
    if (!report) return json({ error: 'Unknown giving report' }, 404);
    const auth = await authorizeGivingAnalyticsContract(req, env, { level: report.level });
    if (auth.response) return auth.response;
    if (name === 'funds') {
      const funds = (await env.DB.prepare('SELECT id, name FROM funds WHERE active=1 ORDER BY sort_order, name').all()).results || [];
      return json({ contract: 'connect.giving-reports.v1', report: name, funds });
    }
    if (name === 'impact') {
      return json({ contract: 'connect.giving-reports.v1', report: name, statements: await readImpactStatements(env.DB), can_edit: auth.user.role === 'admin' });
    }
    const target = new URL('https://connect.internal/admin/api/' + report.seg);
    for (const key of report.params) {
      const value = url.searchParams.get(key);
      if (value != null && value !== '') target.searchParams.set(key, String(value).slice(0, 20));
    }
    const isAdmin = auth.user.role === 'admin';
    // "May see an individual's giving" is exactly the people level this report was authorized at.
    const named = report.level === 'people';
    const result = await handleReportsApi(new Request(target), env, target, 'GET', report.seg, env.DB, isAdmin, named, false, false, !named && !isAdmin);
    if (!result) return json({ error: 'Unknown giving report' }, 404);
    if (!result.ok) return result;
    return json({ contract: 'connect.giving-reports.v1', report: name, ...(await result.json()) });
  }
  // Changing the impact statements is admin-only, as it is in Connect (config/giving-impact).
  if (path === '/api/contracts/giving-impact-write-v1' && req.method === 'POST') {
    const auth = await authorizeGivingAnalyticsContract(req, env, { level: 'write' });
    if (auth.response) return auth.response;
    if (auth.user.role !== 'admin') return json({ error: 'Only an admin can change the impact statements' }, 403);
    let body = {};
    try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    return json({ ok: true, statements: await writeImpactStatements(env.DB, body.statements) });
  }
  return null;
}
