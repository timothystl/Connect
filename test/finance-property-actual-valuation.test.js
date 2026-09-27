import { describe, it, expect } from 'vitest';
import vm from 'node:vm';
import { CHMS_APP_EXT_JS, CHMS_APP_FINANCE_JS } from '../src/html-chms.js';

// The Valuation & equity card values the property from the imported AHRA reports (trailing
// twelve months of NOI ÷ the worksheet's cap rate) instead of the hand-saved worksheet figure.
function loadBundle() {
  // esc() lives in the core bundle, which this test does not load.
  const ctx = { console, document: { getElementById: () => null }, esc: (s) => String(s ?? '') };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(CHMS_APP_EXT_JS, ctx);
  vm.runInContext(CHMS_APP_FINANCE_JS, ctx);
  return ctx;
}
const fin = loadBundle();

// Seeded 3277 Ivanhoe reports, Aug 2025 – Jul 2026: [period, net income, AHRA NOI].
const SEEDED = [
  ['2025-08', -314771], ['2025-09', -243556], ['2025-10', 650831], ['2025-11', 738377], ['2025-12', -421788],
  ['2026-01', 509994, 610165], ['2026-02', 637333, 736514], ['2026-03', 282335, 381027],
  ['2026-04', 975000, 1072700], ['2026-05', 448614, 545318], ['2026-06', 530279, 625984], ['2026-07', 738549, 833252],
];
const monthly = (rows) => rows.map(([period, net, noi]) => ({ period, net_income_cents: net, net_operating_income_cents: noi ?? null }));
const meta = (extra = {}) => ({
  valuation: { cap_rate: 0.08, capitalized_value_cents: 80646300 },
  loan: { balance_cents: 27969113, balance_as_of_date: '2026-07-20', interest_rate_pct: 0.06375 },
  ...extra,
});

describe('finComputePropertyActualValuation', () => {
  it('values the trailing twelve reports at the worksheet cap rate', () => {
    const v = fin.finComputePropertyActualValuation({ meta: meta(), monthly: monthly(SEEDED) });
    // Five 2025 months add back the window's average observed interest (NOI − net income).
    const avgInterest = SEEDED.filter((r) => r[2] != null).reduce((s, r) => s + r[2] - r[1], 0) / 7;
    const expected = Math.round(SEEDED.reduce((s, r) => s + (r[2] ?? r[1] + avgInterest), 0));
    expect(v.noiCents).toBe(expected);
    expect(v.valueCents).toBe(Math.round(expected / 0.08));
    expect(v.complete).toBe(true);
    expect(v.fromPeriod).toBe('2025-08');
    expect(v.toPeriod).toBe('2026-07');
    expect(v.estimatedInterestPeriods).toEqual(['2025-08', '2025-09', '2025-10', '2025-11', '2025-12']);
  });

  it('moves when a new report is imported, dropping the month that falls out of the window', () => {
    const before = fin.finComputePropertyActualValuation({ meta: meta(), monthly: monthly(SEEDED) });
    const after = fin.finComputePropertyActualValuation({ meta: meta(), monthly: monthly([['2024-12', -999999], ...SEEDED, ['2026-08', 700000, 800000]]) });
    expect(after.fromPeriod).toBe('2025-09');
    expect(after.toPeriod).toBe('2026-08');
    expect(after.months).toBe(12);
    expect(after.valueCents).not.toBe(before.valueCents);
  });

  it('prefers a month\'s own reported interest over the estimate', () => {
    const rows = monthly(SEEDED);
    rows[0].interest_expense_cents = 120000;
    const v = fin.finComputePropertyActualValuation({ meta: meta(), monthly: rows });
    expect(v.estimatedInterestPeriods).not.toContain('2025-08');
  });

  it('annualizes and flags a window shorter than twelve months', () => {
    const v = fin.finComputePropertyActualValuation({ meta: meta(), monthly: monthly(SEEDED.slice(6)) });
    expect(v.complete).toBe(false);
    expect(v.months).toBe(6);
    const sum = SEEDED.slice(6).reduce((s, r) => s + r[2], 0);
    expect(v.noiCents).toBe(Math.round(sum / 6 * 12));
  });

  it('has no value without a cap rate, and nothing at all without reports', () => {
    expect(fin.finComputePropertyActualValuation({ meta: meta({ valuation: {} }), monthly: monthly(SEEDED) }).valueCents).toBe(null);
    expect(fin.finComputePropertyActualValuation({ meta: meta(), monthly: [] })).toBe(null);
  });
});

describe('finRenderPropertyValuationCard', () => {
  it('shows the report-driven value and names the worksheet figure beside it', () => {
    const d = { meta: meta(), monthly: monthly(SEEDED) };
    const v = fin.finComputePropertyActualValuation(d);
    const html = fin.finRenderPropertyValuationCard(d);
    expect(html).toContain('$' + fin.finFmtMoney(v.valueCents / 100));
    expect(html).toContain('2025-08 through 2026-07');
    expect(html).toContain('$806,463');
    // Equity is computed from the report-driven value, not the worksheet's.
    expect(html).toContain('$' + fin.finFmtMoney((v.valueCents - 27969113) / 100));
  });

  it('falls back to the saved worksheet when no report has NOI', () => {
    const html = fin.finRenderPropertyValuationCard({ meta: meta(), monthly: [] });
    expect(html).toContain('$806,463.00');
    expect(html).toContain('Valuation from the saved worksheet');
  });
});
