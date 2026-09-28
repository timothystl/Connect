import { describe, expect, it } from 'vitest';
import worker from '../apps/finance/shell.js';

// Facilities → Gym rental income: read live from Website Admin's gym-income-v1 over the
// PAYROLL_SERVICE binding with the caller's Access identity. Finance stores nothing.
const REPORT = {
  contract: 'website.gym-income.v1', year: 2026, today: '2026-09-28', years: [2026, 2025], due_days: 14,
  totals: { invoiced_cents: 25050, paid_cents: 10000, unpaid_cents: 15050, overdue_cents: 10050, invoice_count: 3, hours: 10 },
  months: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, invoiced_cents: i === 0 ? 10000 : 0, paid_cents: i === 0 ? 10000 : 0, invoice_count: i === 0 ? 1 : 0 })),
  groups: [{ group_name: 'Lions Basketball', invoiced_cents: 20050, paid_cents: 10000, unpaid_cents: 10050, invoice_count: 2, hours: 8 }],
  open_invoices: [{ id: 2, group_name: 'Lions Basketball', invoice_date: '2026-02-02', period_start: '2026-02-01', period_end: '2026-02-28', amount_cents: 10050, due_date: '2026-02-16', overdue: true }],
  open_limited: false,
};

function makeEnv({ status = 200, body = REPORT, configured = true } = {}) {
  const calls = [];
  const env = {
    ENVIRONMENT: 'staging', RELEASE_SHA: 't', FINANCE_DB: { prepare: (sql) => ({ sql }) }, FINANCE_CONTRACT_API_KEY: 'k',
    ...(configured ? { FINANCE_PAYROLL_CONTRACT_KEY: 'pk' } : {}),
    CONNECT_SERVICE: {
      async fetch(req) {
        if (new URL(req.url).pathname.endsWith('/staff-role-v1')) return new Response(JSON.stringify({ role: 'finance', permissions: { finance: 'edit' } }));
        return new Response('{}', { status: 404 });
      },
    },
    PAYROLL_SERVICE: {
      async fetch(req) {
        const url = new URL(req.url);
        calls.push({ path: url.pathname, year: url.searchParams.get('year'), key: req.headers.get('X-Contract-Key'), jwt: req.headers.get('Cf-Access-Jwt-Assertion') });
        return new Response(JSON.stringify(body), { status });
      },
    },
  };
  return { env, calls };
}
const get = (env, query = '') => worker.fetch(new Request(`https://finance.test/?section=facilities&page=gym-rentals${query}`, { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), env);

describe('Gym rental income (Finance Facilities)', () => {
  it('reads Website Admin live and shows totals, groups, and open invoices', async () => {
    const { env, calls } = makeEnv();
    const html = await (await get(env, '&year=2026')).text();
    expect(calls).toEqual([{ path: '/api/contracts/gym-income-v1', year: '2026', key: 'pk', jwt: 'jwt' }]);
    expect(html).toContain('<h1 class="page-title">Gym rental income</h1>');
    expect(html).toContain('$250.50');
    expect(html).toContain('$100.50');
    expect(html).toContain('Lions Basketball');
    expect(html).toContain('Overdue');
    expect(html).toContain('href="/?section=facilities&amp;page=gym-rentals&amp;year=2025"');
  });

  it('says why when Website Admin refuses, instead of showing $0', async () => {
    const { env } = makeEnv({ status: 403, body: { error: 'Gym rental income requires the Gym permission in Website Admin.' } });
    const html = await (await get(env)).text();
    expect(html).toContain('requires the Gym permission in Website Admin');
    expect(html).toContain('Nothing here is a real $0.');
  });

  it('reports a missing connection without calling Website Admin', async () => {
    const { env, calls } = makeEnv({ configured: false });
    const html = await (await get(env)).text();
    expect(html).toContain('not configured');
    expect(calls).toHaveLength(0);
  });
});
