import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { withLocalContractReads, localContractReadsEnabled } from '../apps/finance/local-contract-reads.js';
import { fetchLiveFinanceChurchReport } from '../apps/finance/finance-church-report-client.js';

// Column-for-column the finance_church_entries table Connect's Church Report contract reads.
function makeFinanceDb() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(`CREATE TABLE finance_church_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT, fiscal_year INTEGER NOT NULL, period_month INTEGER NOT NULL DEFAULT 0,
    classification TEXT NOT NULL, category_path TEXT NOT NULL, account_name TEXT NOT NULL,
    depth INTEGER NOT NULL DEFAULT 0, has_children INTEGER NOT NULL DEFAULT 0,
    own_actual_cents INTEGER NOT NULL DEFAULT 0, own_budget_cents INTEGER, account_qbo_id TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'qbo_sync', notes TEXT NOT NULL DEFAULT '', synced_at TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(fiscal_year, period_month, category_path, source))`);
  sqlite.prepare(`INSERT INTO finance_church_entries (fiscal_year, classification, category_path, account_name, own_actual_cents, own_budget_cents)
    VALUES (2026, 'Income', 'Offerings', 'Offerings', 5000000, 4800000), (2026, 'Expenses', 'Utilities', 'Utilities', 1200000, 1300000)`).run();
  const statement = (sql, args = []) => ({
    bind: (...next) => statement(sql, next),
    async run() { sqlite.prepare(sql).run(...args); return { success: true }; },
    async first() { return sqlite.prepare(sql).get(...args) ?? null; },
    async all() { return { results: sqlite.prepare(sql).all(...args) }; },
  });
  return { prepare: (sql) => statement(sql) };
}

function connectSpy(response = () => new Response('{}', { status: 503 })) {
  const calls = [];
  return { calls, binding: { async fetch(request) { calls.push(new URL(request.url).pathname); return response(request); } } };
}

describe('Finance report reads from its own database', () => {
  it('answers the Church Report from FINANCE_DB without calling Connect', async () => {
    const connect = connectSpy();
    const env = withLocalContractReads({
      FINANCE_LOCAL_CONTRACT_READS: '1', FINANCE_DB: makeFinanceDb(),
      CONNECT_SERVICE: connect.binding, FINANCE_CONTRACT_API_KEY: 'key',
    });
    const result = await fetchLiveFinanceChurchReport(env, 2026);
    expect(result.ok).toBe(true);
    expect(result.report.totals.incomeActualCents).toBe(5000000);
    expect(result.report.totals.expenseActualCents).toBe(1200000);
    expect(connect.calls).toEqual([]);
  });

  it('still sends roles, Giving and writes to Connect', async () => {
    const connect = connectSpy(() => new Response('{}', { status: 200 }));
    const env = withLocalContractReads({
      FINANCE_LOCAL_CONTRACT_READS: '1', FINANCE_DB: makeFinanceDb(), CONNECT_SERVICE: connect.binding,
    });
    await env.CONNECT_SERVICE.fetch(new Request('https://connect.timothystl.org/api/contracts/staff-role-v1'));
    await env.CONNECT_SERVICE.fetch(new Request('https://connect.timothystl.org/api/contracts/connect-giving-summary-v1'));
    await env.CONNECT_SERVICE.fetch(new Request('https://connect.timothystl.org/api/contracts/finance-church-report-v1?fiscal_year=2026', { method: 'POST', body: '{}' }));
    expect(connect.calls).toEqual([
      '/api/contracts/staff-role-v1', '/api/contracts/connect-giving-summary-v1', '/api/contracts/finance-church-report-v1',
    ]);
  });

  it('falls back to Connect when a local read fails', async () => {
    const connect = connectSpy(() => new Response('{"ok":true}', { status: 200 }));
    const brokenDb = { prepare() { throw new Error('no such table'); } };
    const env = withLocalContractReads({ FINANCE_LOCAL_CONTRACT_READS: '1', FINANCE_DB: brokenDb, CONNECT_SERVICE: connect.binding });
    const res = await env.CONNECT_SERVICE.fetch(new Request('https://connect.timothystl.org/api/contracts/finance-balance-sheet-trend-v1'));
    expect(res.status).toBe(200);
    expect(connect.calls).toEqual(['/api/contracts/finance-balance-sheet-trend-v1']);
  });

  it('is off unless the Worker opts in', () => {
    const env = { FINANCE_DB: makeFinanceDb(), CONNECT_SERVICE: connectSpy().binding };
    expect(localContractReadsEnabled(env)).toBe(false);
    expect(withLocalContractReads(env)).toBe(env);
  });
});

// Finance's own accounting writes (apps/finance/accounting/write-contracts.js): answered from
// FINANCE_DB, with Connect asked only who is acting.
function makeSettingsDb() {
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

function roleConnect(role, { status = 200 } = {}) {
  const calls = [];
  return {
    calls,
    binding: {
      async fetch(request) {
        const path = new URL(request.url).pathname;
        calls.push(path);
        if (path.endsWith('/staff-role-v1')) {
          return status === 200
            ? new Response(JSON.stringify({ role, identity: 'someone@timothystl.org', username: 'someone', permissions: { finance: 'edit', budget: 'edit', compensation: 'view' } }))
            : new Response('{}', { status });
        }
        return new Response('{"relayed":true}', { status: 200 });
      },
    },
  };
}

const post = (env, name, body) => env.CONNECT_SERVICE.fetch(new Request(`https://connect.timothystl.org/api/contracts/${name}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Cf-Access-Jwt-Assertion': 'jwt' }, body: JSON.stringify(body),
}));

describe('Finance accounting writes to its own database', () => {
  it('saves a Chart of Accounts layout change itself, checking the role with Connect', async () => {
    const db = makeSettingsDb();
    const connect = roleConnect('admin');
    const env = withLocalContractReads({ FINANCE_LOCAL_CONTRACT_READS: '1', FINANCE_DB: db, CONNECT_SERVICE: connect.binding, FINANCE_CONTRACT_API_KEY: 'key' });
    const res = await post(env, 'finance-board-categories-write-v1', { hiddenAccounts: { 'Expenses:Old': true } });
    expect(res.status).toBe(200);
    expect((await res.json()).savedBy).toBe('someone');
    const saved = JSON.parse(db.sqlite.prepare("SELECT value FROM finance_settings WHERE key='finance_planning_board_categories'").get().value);
    expect(saved.hiddenAccounts).toEqual({ 'Expenses:Old': true });
    expect(connect.calls).toEqual(['/api/contracts/staff-role-v1']);
  });

  it('applies the same role rules Connect did', async () => {
    const db = makeSettingsDb();
    const env = withLocalContractReads({ FINANCE_LOCAL_CONTRACT_READS: '1', FINANCE_DB: db, CONNECT_SERVICE: roleConnect('finance').binding, FINANCE_CONTRACT_API_KEY: 'key' });
    const res = await post(env, 'finance-board-categories-write-v1', { hiddenAccounts: { 'Expenses:Old': true } });
    expect(res.status).toBe(403);
    expect(db.sqlite.prepare('SELECT COUNT(*) n FROM finance_settings').get().n).toBe(0);
  });

  it('refuses to save when Connect cannot confirm who is acting, and never relays the write', async () => {
    const db = makeSettingsDb();
    const connect = roleConnect('admin', { status: 503 });
    const env = withLocalContractReads({ FINANCE_LOCAL_CONTRACT_READS: '1', FINANCE_DB: db, CONNECT_SERVICE: connect.binding, FINANCE_CONTRACT_API_KEY: 'key' });
    const res = await post(env, 'finance-cash-policy-write-v1', { floor_cents: 100 });
    expect(res.status).toBe(503);
    expect(connect.calls).toEqual(['/api/contracts/staff-role-v1']);
    expect(db.sqlite.prepare('SELECT COUNT(*) n FROM finance_settings').get().n).toBe(0);
    const noIdentity = await env.CONNECT_SERVICE.fetch(new Request('https://connect.timothystl.org/api/contracts/finance-board-categories-write-v1', { method: 'POST', body: '{}' }));
    expect(noIdentity.status).toBe(401);
  });

  it('keeps who saved it in Finance’s own audit log', async () => {
    const db = makeSettingsDb();
    const env = withLocalContractReads({ FINANCE_LOCAL_CONTRACT_READS: '1', FINANCE_DB: db, CONNECT_SERVICE: roleConnect('admin').binding, FINANCE_CONTRACT_API_KEY: 'key' });
    const res = await post(env, 'finance-compensation-write-v1', { roster: [] });
    expect(res.status).toBe(200);
    const plan = await env.CONNECT_SERVICE.fetch(new Request('https://connect.timothystl.org/api/contracts/finance-compensation-plan-v1', { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }));
    expect(plan.status).toBe(200);
    if (res.status === 200) {
      expect(db.sqlite.prepare("SELECT action FROM finance_audit_log").all().map((r) => r.action)).toContain('salary_planner_write_via_finance');
    }
  });

  it('sends the myMDO sync to Connect until Finance has that connection, and Giving always', async () => {
    const connect = roleConnect('admin');
    const env = withLocalContractReads({ FINANCE_LOCAL_CONTRACT_READS: '1', FINANCE_DB: makeSettingsDb(), CONNECT_SERVICE: connect.binding, FINANCE_CONTRACT_API_KEY: 'key' });
    await post(env, 'finance-daycare-sync-v1', {});
    await post(env, 'giving-fund-cleanup-write-v1', { op: 'retire', fund_ids: [1] });
    expect(connect.calls).toEqual(['/api/contracts/finance-daycare-sync-v1', '/api/contracts/giving-fund-cleanup-write-v1']);
  });
});
