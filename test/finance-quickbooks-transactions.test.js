import { describe, expect, it } from 'vitest';
import {
  findTransactionExceptions, parseTransactionList, resolveTransactionDates, searchTransactions,
  sortRows, spendingRowsFor, summarizeExpenseAccounts, summarizeVendorSpend, TRANSACTION_SORTS,
} from '../apps/finance/quickbooks-transactions-service.js';
import { renderQuickbooksPage } from '../apps/finance/quickbooks-pages.js';

const report = {
  Columns: { Column: [
    { ColTitle: 'Name', ColType: 'vend_name' },
    { ColTitle: 'Amount', ColType: 'subt_nat_amount' },
    { ColTitle: 'Date', ColType: 'tx_date' },
    { ColTitle: 'Transaction Type', ColType: 'txn_type' },
    { ColTitle: 'Account', ColType: 'account_name' },
    { ColTitle: 'Num', ColType: 'doc_num' },
  ] },
  Rows: { Row: [
    { type: 'Data', ColData: [
      { value: 'Acme' }, { value: '$1,200.50' }, { value: '2026-09-03' },
      { value: 'Bill', id: '42' }, { value: 'Facilities:Repairs' }, { value: 'B-4' },
    ] },
    { type: 'Section', Rows: { Row: [{ type: 'Data', ColData: [
      { value: '' }, { value: '(15.25)' }, { value: '2026-09-04' },
      { value: 'Check', id: '43' }, { value: '' }, { value: '1001' },
    ] }] } },
  ] },
};

describe('Finance QuickBooks transaction reporting', () => {
  it('reads reordered report columns and nested rows by metadata', () => {
    const rows = parseTransactionList(report);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ date: '2026-09-03', type: 'Bill', name: 'Acme', account: 'Facilities:Repairs', amountCents: 120050, transactionId: '42' });
    expect(rows[0].viewUrl).toBe('https://qbo.intuit.com/app/bill?txnId=42');
    expect(rows[1].amountCents).toBe(-1525);
  });

  it('bounds and validates the live report range', () => {
    expect(resolveTransactionDates(new URLSearchParams('start_date=2026-09-01&end_date=2026-09-30')).ok).toBe(true);
    expect(resolveTransactionDates(new URLSearchParams('start_date=2026-10-01&end_date=2026-09-30')).ok).toBe(false);
    expect(resolveTransactionDates(new URLSearchParams('start_date=2024-01-01&end_date=2026-09-30')).error).toContain('one year');
  });

  it('builds vendor, account, and transparent data-quality views', () => {
    const rows = parseTransactionList(report);
    expect(summarizeVendorSpend(rows)).toEqual([{ name: 'Acme', transactionCount: 1, amountCents: 120050 }]);
    expect(summarizeExpenseAccounts(rows)).toEqual([{ account: 'Facilities:Repairs', transactionCount: 1, amountCents: 120050 }]);
    expect(findTransactionExceptions(rows)).toMatchObject([{ name: '', account: '', reasons: ['Missing account', 'Missing name'] }]);
  });

  // The live TransactionList shape: generic ColType, real key in MetaData.ColKey, and an
  // Account column that is the bank/payable side while Split carries the expense account.
  const liveReport = {
    Columns: { Column: [
      ['Date', 'Date', 'tx_date'], ['Transaction Type', 'String', 'txn_type'], ['Num', 'String', 'doc_num'],
      ['Name', 'String', 'name'], ['Memo/Description', 'String', 'memo'], ['Account', 'String', 'account_name'],
      ['Split', 'String', 'other_account'], ['Amount', 'Money', 'subt_nat_amount'],
    ].map(([ColTitle, ColType, key]) => ({ ColTitle, ColType, MetaData: [{ Name: 'ColKey', Value: key }] })) },
    Rows: { Row: [
      ['2026-09-26', 'Bill Payment (Check)', '3091', 'Extension Fund', '', 'Checking', 'Accounts Payable', '-10000.00', '21065'],
      ['2026-09-20', 'Bill', '', 'Extension Fund', 'Loan', 'Accounts Payable', 'Mortgage Interest', '10000.00', '21001'],
      ['2026-09-18', 'Check', '3090', 'Ace Plumbing', 'Boiler repair', 'Checking', 'Repairs', '-450.00', '21002'],
      ['2026-09-17', 'Expense', '', 'Ace Plumbing', 'Parts', 'Checking', '-Split-', '-120.00', '21003'],
      ['2026-09-16', 'Vendor Credit', '', 'Ace Plumbing', 'Refund', 'Accounts Payable', 'Repairs', '50.00', '21004'],
      ['2026-09-15', 'Deposit', '', 'Square', '', 'Checking', 'Offerings', '70.29', '21005'],
    ].map(([date, type, num, name, memo, account, split, amount, id]) => ({ type: 'Data', ColData: [
      { value: date }, { value: type, id }, { value: num }, { value: name }, { value: memo },
      { value: account }, { value: split }, { value: amount },
    ] })) },
  };

  it('reads ColKey metadata, keeps Split separate from Account, and links bill payments to /app/billpayment', () => {
    const rows = parseTransactionList(liveReport);
    expect(rows[0]).toMatchObject({ account: 'Checking', split: 'Accounts Payable', docNum: '3091', amountCents: -1000000 });
    expect(rows[0].viewUrl).toBe('https://qbo.intuit.com/app/billpayment?txnId=21065');
  });

  it('groups spending by expense account and vendor without double-counting bill payments', () => {
    const rows = parseTransactionList(liveReport);
    expect(summarizeExpenseAccounts(rows)).toEqual([
      { account: 'Mortgage Interest', transactionCount: 1, amountCents: 1000000 },
      { account: 'Repairs', transactionCount: 2, amountCents: 40000 },
      { account: 'Multiple accounts (split transaction)', transactionCount: 1, amountCents: 12000 },
    ]);
    expect(summarizeVendorSpend(rows)).toEqual([
      { name: 'Extension Fund', transactionCount: 1, amountCents: 1000000 },
      { name: 'Ace Plumbing', transactionCount: 3, amountCents: 52000 },
    ]);
    expect(spendingRowsFor(rows, { account: 'Repairs' }).map((row) => row.transactionId)).toEqual(['21002', '21004']);
    expect(spendingRowsFor(rows, { vendor: 'Ace Plumbing' })).toHaveLength(3);
  });

  it('searches every field word-by-word and sorts by any column', () => {
    const rows = parseTransactionList(liveReport);
    expect(searchTransactions(rows, 'ace boiler').map((row) => row.docNum)).toEqual(['3090']);
    expect(searchTransactions(rows, '$10,000').map((row) => row.type)).toEqual(['Bill Payment (Check)', 'Bill']);
    expect(searchTransactions(rows, '')).toHaveLength(6);
    expect(sortRows(rows, TRANSACTION_SORTS, 'amount', 'asc')[0].amountCents).toBe(-1000000);
    expect(sortRows(rows, TRANSACTION_SORTS, 'name', 'asc').map((row) => row.name)[0]).toBe('Ace Plumbing');
    expect(sortRows(rows, TRANSACTION_SORTS, 'number', 'desc').map((row) => row.docNum).slice(0, 2)).toEqual(['3091', '3090']);
  });

  it('renders searchable, sortable pages whose summary rows drill through to transactions', () => {
    const result = { ok: true, startDate: '2026-09-01', endDate: '2026-09-28', syncedAt: '2026-09-28T01:31:00Z', transactions: parseTransactionList(liveReport) };
    const render = (pageId, query) => renderQuickbooksPage(pageId, { quickbooksTransactions: result, searchParams: new URLSearchParams(query) });

    const list = render('transactions', 'q=ace&sort=amount&dir=asc');
    expect(list).toContain('name="q" value="ace"');
    expect(list).toContain('aria-sort="ascending"');
    expect(list).not.toContain('Extension Fund</a>');
    expect(list).toContain('page=vendor-spend&amp;start_date=2026-09-01&amp;end_date=2026-09-28&amp;vendor=Ace+Plumbing');

    const accounts = render('expense-drilldown', '');
    expect(accounts).toContain('page=expense-drilldown&amp;start_date=2026-09-01&amp;end_date=2026-09-28&amp;account=Repairs');
    expect(accounts).not.toContain('>Checking<');

    const repairs = render('expense-drilldown', 'account=Repairs');
    expect(repairs).toContain('<h3>Repairs</h3>');
    expect(repairs).toContain('name="account" value="Repairs"');
    expect(repairs).toContain('txnId=21002');
    expect(repairs).not.toContain('txnId=21003');
    expect(repairs).toContain('$400.00');

    const vendors = render('vendor-spend', 'q=ace');
    expect(vendors).toContain('vendor=Ace+Plumbing');
    expect(vendors).not.toContain('vendor=Extension+Fund');
  });
});
