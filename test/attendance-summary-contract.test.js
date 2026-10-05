import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleContractsServiceApi } from '../src/api-contracts-service.js';
import { buildAttendanceSummaryV1 } from '../src/api-attendance-summary-contract.js';
import { validateAttendanceSummaryV1 } from '../contracts/validators/attendance-summary-consumer.js';

function makeTestDb() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_baseline.sql', import.meta.url), 'utf8'));
  return {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() { sqlite.prepare(sql).run(...args); },
            async first() { return sqlite.prepare(sql).get(...args); },
            async all() { return { results: sqlite.prepare(sql).all(...args) }; },
          };
        },
      };
    },
    _raw: sqlite,
  };
}

function add(db, date, time, att, { type = 'sunday', name = '', notes = '' } = {}) {
  db._raw.prepare('INSERT INTO worship_services (service_date,service_time,service_name,service_type,attendance,notes) VALUES (?,?,?,?,?,?)')
    .run(date, time, name, type, att, notes);
}

const NOW = new Date('2026-10-06T15:00:00Z');

function seed() {
  const db = makeTestDb();
  // 2025: Sundays Oct 5 and Oct 12 (matches 2026-10-04 and 2026-10-11 minus 364 days)
  add(db, '2025-10-05', '08:00', 50); add(db, '2025-10-05', '10:45', 100);
  add(db, '2025-10-12', '08:00', 40); add(db, '2025-10-12', '10:45', 90);
  // 2026: two normal Sundays, Easter Sunday logged as a regular service, a funeral named for a person
  add(db, '2026-04-05', '08:00', 90); add(db, '2026-04-05', '10:45', 180);
  add(db, '2026-10-04', '08:00', 60); add(db, '2026-10-04', '10:45', 107);
  add(db, '2026-10-11', '08:00', 50); add(db, '2026-10-11', '10:45', 100);
  add(db, '2026-06-02', '', 55, { type: 'special', name: 'Funeral for Jane Q. Sample', notes: 'family asked for privacy' });
  add(db, '2026-12-24', '19:00', 200, { type: 'special', name: 'Christmas Eve' });
  add(db, '2026-10-18', '08:00', 0); // zero counts are ignored
  return db;
}

describe('connect.attendance-summary.v1 producer', () => {
  it('builds a valid, anonymous summary', async () => {
    const s = await buildAttendanceSummaryV1(seed(), { fiscalYear: 2026, now: NOW });
    expect(validateAttendanceSummaryV1(s)).toEqual({ ok: true, errors: [] });
    const text = JSON.stringify(s);
    expect(text).not.toMatch(/Jane|Sample|privacy/);
    expect(s.countBasis).toMatchObject({ method: 'staff_entered_total', registrationData: false });
    expect(s.fiscalYearStart).toBe('2026-01-01');
    expect(s.fiscalYearEnd).toBe('2026-12-31');
  });

  it('flags Easter and funerals so they stay out of the averages', async () => {
    const s = await buildAttendanceSummaryV1(seed(), { fiscalYear: 2026, now: NOW });
    const easter = s.weekends.find((w) => w.weekendDate === '2026-04-05');
    expect(easter).toMatchObject({ total: 270, occasion: 'easter', countsTowardAverages: false });
    const funeral = s.services.find((r) => r.date === '2026-06-02');
    expect(funeral).toMatchObject({ kind: 'special', occasion: 'funeral', serviceLabel: 'Funeral', countsTowardAverages: false });
    const apr = s.monthly[3];
    expect(apr.averagePerWeekend).toBeNull();
    expect(apr.averageIncludingFlagged).toBe(270);
    expect(apr.total).toBe(270);
  });

  it('averages per weekend with per-service detail and matches the same weeks last year', async () => {
    const s = await buildAttendanceSummaryV1(seed(), { fiscalYear: 2026, now: NOW });
    const oct = s.monthly[9];
    expect(oct.averagePerWeekend).toBe(158.5); // (167 + 150) / 2
    expect(oct.priorYearAveragePerWeekend).toBe(140); // (150 + 130) / 2
    expect(oct.byService).toEqual([
      { serviceTime: '08:00', total: 110, average: 55 },
      { serviceTime: '10:45', total: 207, average: 103.5 },
    ]);
    const w = s.weekends.find((x) => x.weekendDate === '2026-10-04');
    expect(w).toMatchObject({ total: 167, priorYearWeekendDate: '2025-10-05', priorYearTotal: 150 });
  });

  it('carries a multi-year monthly history', async () => {
    const s = await buildAttendanceSummaryV1(seed(), { fiscalYear: 2026, now: NOW });
    expect(s.history.map((h) => h.fiscalYear)).toEqual([2025, 2026]);
    expect(s.history[0].averagePerWeekendByMonth[9]).toBe(140);
    expect(s.history[1].averagePerWeekendByMonth[0]).toBeNull();
  });

  it('is valid with no data at all', async () => {
    const s = await buildAttendanceSummaryV1(makeTestDb(), { fiscalYear: 2026, now: NOW });
    expect(validateAttendanceSummaryV1(s).ok).toBe(true);
    expect(s.services).toEqual([]);
    expect(s.history).toEqual([]);
  });
});

describe('validateAttendanceSummaryV1', () => {
  it('rejects an unknown field such as a name', async () => {
    const s = await buildAttendanceSummaryV1(seed(), { fiscalYear: 2026, now: NOW });
    s.services[0].name = 'Jane';
    expect(validateAttendanceSummaryV1(s).ok).toBe(false);
  });
  it('rejects totals that do not add up', async () => {
    const s = await buildAttendanceSummaryV1(seed(), { fiscalYear: 2026, now: NOW });
    s.monthly[9].total += 1;
    expect(validateAttendanceSummaryV1(s).ok).toBe(false);
  });
});

describe('GET /api/contracts/attendance-summary-v1', () => {
  const PATH = '/api/contracts/attendance-summary-v1';
  function call(query = '', { key = 'right-secret' } = {}) {
    const req = new Request(`https://connect.example${PATH}${query}`, { headers: key === null ? {} : { 'X-Contract-Key': key } });
    return handleContractsServiceApi(req, { DB: seed(), FINANCE_CONTRACT_API_KEY: 'right-secret' }, PATH);
  }
  it('requires the contract key', async () => {
    expect((await call('', { key: null })).status).toBe(401);
    expect((await call('', { key: 'wrong' })).status).toBe(401);
  });
  it('serves a valid summary for a requested fiscal year', async () => {
    const res = await call('?fiscal_year=2026');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contract).toBe('connect.attendance-summary.v1');
    expect(body.fiscalYear).toBe(2026);
    expect(validateAttendanceSummaryV1(body).ok).toBe(true);
  });
  it('rejects a malformed fiscal_year', async () => {
    expect((await call('?fiscal_year=abc')).status).toBe(400);
  });
});
