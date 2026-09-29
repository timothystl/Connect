import { describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import worker from '../apps/finance/shell.js';

// The older accounting screens now read and save Finance's own records in Finance (Andrew,
// 2026-09-29). Connect is asked who is acting, and answers only the reads that mix in Giving.
function financeDb() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(`CREATE TABLE finance_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '')`);
  const statement = (sql, args = []) => ({
    bind: (...next) => statement(sql, next),
    async run() { const r = sqlite.prepare(sql).run(...args); return { success: true, meta: { changes: r.changes } }; },
    async first() { return sqlite.prepare(sql).get(...args) ?? null; },
    async all() { return { results: sqlite.prepare(sql).all(...args) }; },
  });
  return { prepare: (sql) => statement(sql), sqlite };
}
function env(role = 'admin', permissions = {}) {
  const calls = [];
  const db = financeDb();
  return {
    ENVIRONMENT: 'production', FINANCE_CONTRACT_API_KEY: 'key', RELEASE_SHA: 'test', FINANCE_LOCAL_CONTRACT_READS: '1', FINANCE_DB: db, calls, db,
    CONNECT_SERVICE: { async fetch(req) {
      const path = new URL(req.url).pathname;
      if (path.endsWith('staff-role-v1')) return Response.json({ role, permissions, username: 'tester', identity: 'tester@timothystl.org' });
      calls.push(new URL(req.url).pathname + new URL(req.url).search);
      return Response.json({ fromConnect: true });
    } },
  };
}
const call = (e, path, init = {}) => worker.fetch(new Request('https://finance.test' + path, { ...init, headers: { 'Cf-Access-Jwt-Assertion': 'jwt', 'Sec-Fetch-Site': 'same-origin', ...(init.headers || {}) } }), e);

describe('Accounting workspace saves in Finance', () => {
  it('saves and reads a Chart of Accounts change in Finance’s own database', async () => {
    const e = env();
    const put = await call(e, '/api/v1/accounting-workspace?path=planning%2Fboard-categories', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountLabels: { 'Income:A': 'Plate offering' } }),
    });
    expect(put.status).toBe(200);
    const get = await (await call(e, '/api/v1/accounting-workspace?path=planning%2Fboard-categories')).json();
    expect(get.accountLabels).toEqual({ 'Income:A': 'Plate offering' });
    expect(e.calls).toEqual([]);
  });

  it('applies the same view and edit rules Connect did', async () => {
    const viewOnly = env('finance', { finance: 'view', budget: 'view' });
    const refused = await call(viewOnly, '/api/v1/accounting-workspace?path=cash-policy', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    expect(refused.status).toBe(403);
    const comp = env('compensation');
    expect((await call(comp, '/api/v1/accounting-workspace?path=cash-policy')).status).toBe(403);
    expect(viewOnly.db.sqlite.prepare('SELECT COUNT(*) n FROM finance_settings').get().n).toBe(0);
  });

  it('still asks Connect for the reads that mix in Giving, and the myMDO sync', async () => {
    const e = env();
    expect(await (await call(e, '/api/v1/accounting-workspace?path=church%2Fthis-year%3Fyear%3D2026')).json()).toEqual({ fromConnect: true });
    await call(e, '/api/v1/accounting-workspace?path=daycare%2Fsync', { method: 'POST' });
    expect(e.calls).toEqual([
      '/api/contracts/finance-workspace-v1?path=church%2Fthis-year%3Fyear%3D2026',
      '/api/contracts/finance-workspace-v1?path=daycare%2Fsync',
    ]);
  });
});
