import { describe, expect, it } from 'vitest';
import {
  axisMoney, renderColumnChart, renderLedgerByYearChart, renderLineChart, renderOperatingCharts, renderWaterfallChart, shortPeriod,
} from '../apps/finance/property-charts.js';
import { renderBankRecPage } from '../apps/finance/property-books-pages.js';
import { renderPropertyPage } from '../apps/finance/property-pages.js';

const rec = (m, bal, out, book) => ({ statement_month: m, statement_balance_cents: bal, deposits_in_transit_cents: 0, outstanding_checks_cents: out, book_balance_cents: book, note: '' });

describe('Commercial Property charts', () => {
  it('formats periods and axis amounts', () => {
    expect(shortPeriod('2026-08')).toBe('Aug ’26');
    expect(shortPeriod('2026')).toBe('2026');
    expect(axisMoney(250000)).toBe('$2.5k');
    expect(axisMoney(-800000)).toBe('−$8k');
    expect(axisMoney(12000000000)).toBe('$120M');
  });

  it('draws one mark per recorded value and leaves a null amount out', () => {
    const svg = renderColumnChart({
      title: 'Revenue and expenses',
      series: [{ label: 'Revenue', color: '#000' }, { label: 'Expenses', color: '#111' }],
      rows: [{ label: 'Jul', values: [100000, 40000] }, { label: 'Aug', values: [120000, null] }],
    });
    expect(svg.match(/<title>/g)).toHaveLength(3);
    expect(svg).toContain('Expenses not recorded');
    expect(svg).toContain('class="pc-legend"');
  });

  it('renders nothing without data', () => {
    expect(renderColumnChart({ title: 'x', series: [{ label: 'a', color: '#000' }], rows: [] })).toBe('');
    expect(renderLineChart({ title: 'x', series: [{ label: 'a', color: '#000' }], rows: [{ label: 'one', values: [1] }] })).toBe('');
    expect(renderLedgerByYearChart([{ entry_date: '', amount_cents: 5 }], 'x')).toBe('');
  });

  it('keeps net income on its own chart and marks losses', () => {
    const html = renderOperatingCharts([
      { period: '2026-07', total_revenue_cents: 900000, total_expenses_cents: 1000000, net_income_cents: -100000 },
      { period: '2026-08', total_revenue_cents: 976276, total_expenses_cents: 636769, net_income_cents: 339507 },
    ]);
    expect(html.match(/<svg/g)).toHaveLength(2);
    expect(html).toContain('Jul ’26 · Net income: −$1,000.00');
    expect(html).toContain('Aug ’26 · Net income: $3,395.07');
  });

  it('walks the property position down to the available amount', () => {
    const svg = renderWaterfallChart({ title: 'Where the cash goes', totalLabel: 'Available', steps: [{ label: 'Cash', cents: 953348 }, { label: 'Deposits', cents: -492500 }] });
    expect(svg).toContain('Available: $4,608.48');
  });

  it('adds the charts to Position & bank rec and Operating results', () => {
    const page = renderBankRecPage({
      books: { bankRecs: [rec('2026-08', 1806683, 853335, 953348), rec('2026-07', 1556892, 0, 1556892)], receivables: [] },
      reserveAfterCents: 807500, reserveMonth: '2026-09', baseMinimumCents: 450000, canEdit: false, params: new URLSearchParams(),
    });
    expect(page).toContain('Where the cash goes');
    expect(page).toContain('Cash in the property account, month by month');
    expect(page).toContain('Balanced');

    const ops = renderPropertyPage('operating-results', {
      propertyReportLive: { source: 'live', rows: [{ period: '2026-08', occupancy_pct: 100, total_revenue_cents: 976276, total_expenses_cents: null, net_income_cents: 339507 }] },
      canManagePropertyMonthly: false,
    });
    expect(ops).toContain('Revenue and expenses by month');
    expect(ops).toContain('Expenses not recorded');
  });
});
