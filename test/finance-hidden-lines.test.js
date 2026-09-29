import { describe, expect, it } from 'vitest';
import worker from '../apps/finance/shell.js';
import { buildBoardLayoutWrites, normalizeBoardLayout } from '../apps/finance/board-layout.js';
import { buildPlannerModel, plannerParams, plannerRows } from '../apps/finance/planning-builder-pages.js';
import { buildBudgetActualBoard, renderChurchPage } from '../apps/finance/church-pages.js';
import { renderLayoutEditor } from '../apps/finance/accounts-pages.js';

// Fabricated QuickBooks-style account labels; no real figures.
const layout = normalizeBoardLayout({
  boardCategories: {
    revenue: { 'Income:40 Giving:40100 Plate': 'donor' }, expense: {}, revenueLabels: { donor: 'General Offerings' }, expenseLabels: {}, donorWrapperLabel: '',
    accountLabels: { 'Expenses:70 Youth:70100 Youth Gathering': 'Youth gathering' },
    hiddenAccounts: { 'Expenses:80 Events:80100 Egg Hunt': true, 'Expenses:80 Events:80200 VBS': true, 'Expenses:x': false },
  },
  purposeTags: { tags: [], categories: {} },
});

describe('hidden old lines', () => {
  it('reads only true flags from the layout contract', () => {
    expect(layout.hidden).toEqual({ 'Expenses:80 Events:80100 Egg Hunt': true, 'Expenses:80 Events:80200 VBS': true });
    expect(normalizeBoardLayout(null).hidden).toEqual({});
  });

  it('sends only changed Hide boxes from the layout editor', () => {
    const f = new URLSearchParams({
      path_0: 'Expenses:A', side_0: 'expense', orig_cat_0: '', cat_0: '', name_0: '', orig_name_0: '', tag_0: '', orig_tag_0: '', hide_0: '1', orig_hide_0: '',
      path_1: 'Expenses:B', side_1: 'expense', orig_cat_1: '', cat_1: '', name_1: '', orig_name_1: '', tag_1: '', orig_tag_1: '', orig_hide_1: '1',
      path_2: 'Expenses:C', side_2: 'expense', orig_cat_2: '', cat_2: '', name_2: '', orig_name_2: '', tag_2: '', orig_tag_2: '', hide_2: '1', orig_hide_2: '1',
    });
    expect(buildBoardLayoutWrites(f, 'accounts')).toEqual({ boardBody: { hiddenAccounts: { 'Expenses:A': true, 'Expenses:B': false } }, tagsBody: null });
  });

  it('shows a Hide box per account in the layout editor, ticked for hidden lines', () => {
    const rows = [
      { classification: 'Expenses', category_path: 'Expenses:80 Events:80100 Egg Hunt', account_name: '80100 Egg Hunt', depth: 2, has_children: 0 },
      { classification: 'Expenses', category_path: 'Expenses:70 Youth:70100 Youth Gathering', account_name: '70100 Youth Gathering', depth: 2, has_children: 0 },
    ];
    const html = renderLayoutEditor(rows, layout, null, null);
    expect(html).toContain('<th>Hide</th>');
    expect(html).toMatch(/name="hide_\d" value="1" checked aria-label="Hide 80100 Egg Hunt"/);
    expect(html).toMatch(/name="hide_\d" value="1" aria-label="Hide 70100 Youth Gathering"/);
  });

  it('drops a hidden line from the Budget planner only while it carries no money', () => {
    const line = (category, name, cents, plan = null) => ({
      category, classification: 'Expenses', name, priorActualCents: 0, baseBudgetCents: cents, baseActualCents: cents, projectedCents: cents, projectedOverridden: false,
      plan: plan == null ? null : { plannedAmountCents: plan, basis: 'manual', growthPct: null, baseAmountCents: null, notes: '' },
    });
    const builder = {
      targetYear: 2027, baseYear: 2026, lines: [
        line('Expenses:80 Events:80100 Egg Hunt', '80100 Egg Hunt', null),
        line('Expenses:80 Events:80200 VBS', '80200 VBS', 5000),
        line('Expenses:70 Youth:70100 Youth Gathering', '70100 Youth Gathering', 10000, 12000),
      ],
    };
    const names = (m) => plannerRows(m).filter((r) => r.kind === 'leaf').map((r) => r.line.name);
    const model = buildPlannerModel(builder, { layout, params: plannerParams(new URLSearchParams('target=2027&base=2026')) });
    expect(model.hiddenCount).toBe(1);
    expect(names(model)).toEqual(['70100 Youth Gathering', '80200 VBS']);
    expect(model.expense.act).toBe(15000);
    const all = buildPlannerModel(builder, { layout, params: plannerParams(new URLSearchParams('target=2027&base=2026&hidden=1')) });
    expect(names(all)).toContain('80100 Egg Hunt');
    expect(all.expense.act).toBe(15000);
  });
});

const accounts = [
  { classification: 'Income', categoryPath: 'Income:40 Giving:40100 Plate', accountName: '40100 Plate', depth: 2, hasChildren: false, actualCents: 90000, budgetCents: 100000, source: 'qb' },
  { classification: 'Income', categoryPath: 'Income:45 Other:45100 Building Rental', accountName: '45100 Building Rental', depth: 2, hasChildren: false, actualCents: 30000, budgetCents: null, source: 'qb' },
  { classification: 'Expenses', categoryPath: 'Expenses:70 Youth:70100 Youth Gathering', accountName: '70100 Youth Gathering', depth: 2, hasChildren: false, actualCents: 8000, budgetCents: 10000, source: 'qb' },
  { classification: 'Expenses', categoryPath: 'Expenses:80 Events:80100 Egg Hunt', accountName: '80100 Egg Hunt', depth: 2, hasChildren: false, actualCents: 0, budgetCents: null, source: 'qb' },
  { classification: 'Expenses', categoryPath: 'Expenses:80 Events:80200 VBS', accountName: '80200 VBS', depth: 2, hasChildren: false, actualCents: 500, budgetCents: 0, source: 'qb' },
  { classification: 'Expenses', categoryPath: 'Expenses:90 Old:90100 Playground', accountName: '90100 Playground', depth: 2, hasChildren: false, actualCents: 0, budgetCents: 0, source: 'qb' },
];

describe('Budget vs actual in the Budget planner layout', () => {
  it('groups by board category with renames, subtotals and a net row, leaving out empty and hidden lines', () => {
    const board = buildBudgetActualBoard(accounts, layout);
    const leaves = board.rows.filter((r) => r.kind === 'leaf').map((r) => r.label);
    expect(leaves).toEqual(['40100 Plate', '45100 Building Rental', 'Youth gathering', '80200 VBS']);
    expect(board.hiddenCount).toBe(1);
    expect(board.rows.filter((r) => r.kind === 'header').map((r) => r.label)).toEqual(['Donor Income', 'General Offerings', 'Earned Income', 'Youth & Family', 'Programs']);
    const total = (label) => board.rows.find((r) => r.label === label);
    expect(total('Total Revenue')).toMatchObject({ actualCents: 120000, budgetCents: 100000 });
    expect(total('Total Expenses')).toMatchObject({ actualCents: 8500, budgetCents: 10000 });
    expect(total('Net (Revenue − Expenses)')).toMatchObject({ actualCents: 111500, budgetCents: 90000 });
    const shown = buildBudgetActualBoard(accounts, layout, { showHidden: true });
    expect(shown.rows.filter((r) => r.kind === 'leaf').map((r) => r.label)).toContain('80100 Egg Hunt');
    expect(shown.rows.filter((r) => r.kind === 'leaf').map((r) => r.label)).not.toContain('90100 Playground');
  });

  const report = { source: 'live', fiscalYear: 2026, accounts, totals: { incomeActualCents: 120000, expenseActualCents: 8500, netIncomeActualCents: 111500, netIncomeBudgetCents: 90000, hasBudgetData: true } };

  it('renders the board table with a show-hidden link, and the flat table without a layout', () => {
    const html = renderChurchPage('budget-actual', { churchReport: report, churchTrendLive: { source: 'live', years: [] }, boardLayout: layout });
    expect(html).toContain('<table class="bb-table">');
    expect(html).toContain('>Youth gathering</td>');
    expect(html).not.toContain('<small>70100 Youth Gathering</small>');
    expect(html).toContain('<td>Total Youth &amp; Family</td>'.replace('<td>', '<td style="padding-left:10px">'));
    expect(html).toContain('1 old line hidden');
    expect(html).toContain('page=budget-actual&amp;hidden=1');
    const shown = renderChurchPage('budget-actual', { churchReport: report, churchTrendLive: { source: 'live', years: [] }, boardLayout: layout, showHidden: true });
    expect(shown).toContain('Hidden old line');
    expect(shown).toContain('Hide the 1 old line again');
    const flat = renderChurchPage('budget-actual', { churchReport: report, churchTrendLive: { source: 'live', years: [] } });
    expect(flat).not.toContain('bb-table');
    expect(flat).toContain('listed in QuickBooks order');
  });

  it('reads the board layout for the Budget vs actual page', async () => {
    const paths = [];
    const env = {
      ENVIRONMENT: 'staging', RELEASE_SHA: 't', FINANCE_DB: { prepare: (sql) => ({ sql }) }, FINANCE_CONTRACT_API_KEY: 'k',
      CONNECT_SERVICE: {
        async fetch(req) {
          const url = new URL(req.url);
          paths.push(url.pathname);
          if (url.pathname.endsWith('/staff-role-v1')) return new Response(JSON.stringify({ role: 'admin', permissions: { finance: 'edit' } }));
          return new Response('{}', { status: 404 });
        },
      },
    };
    await worker.fetch(new Request('https://finance.test/?section=church&page=budget-actual', { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), env);
    expect(paths.some((p) => p.endsWith('/finance-board-layout-v1'))).toBe(true);
  });
});
