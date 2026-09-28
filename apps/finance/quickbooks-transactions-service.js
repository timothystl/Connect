import { makeQboClient, refreshTokens } from './quickbooks-oauth-client.js';
import { ensureFreshAccessToken } from './quickbooks-token-service.js';
import { getConnection } from './quickbooks-oauth-routes.js';
import { normalizeChurchClassification } from './quickbooks-church-sync.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366;
// Spending is counted once, when it is incurred: bills, expenses, and checks, less vendor and
// credit card credits. Bill payments only settle a bill already counted, so they are left out of
// the spending views (they still appear on the Transactions page).
const EXPENSE_TRANSACTION_TYPES = new Set(['bill', 'expense', 'check', 'cash expense', 'credit card expense', 'credit card credit', 'vendor credit']);
const CREDIT_TRANSACTION_TYPES = new Set(['credit card credit', 'vendor credit']);
export const SPLIT_PLACEHOLDER = '-Split-';
export const MULTIPLE_ACCOUNTS_LABEL = 'Multiple accounts (split transaction)';

const COLUMN_ALIASES = {
  date: { types: ['tx_date'], titles: ['date'] },
  type: { types: ['txn_type'], titles: ['transaction type'] },
  docNum: { types: ['doc_num'], titles: ['num'] },
  name: { types: ['name', 'cust_name', 'vend_name', 'emp_name'], titles: ['name'] },
  memo: { types: ['memo'], titles: ['memo/description', 'memo'] },
  account: { types: ['account_name'], titles: ['account'] },
  split: { types: ['other_account', 'split_acc'], titles: ['split'] },
  amount: { types: ['subt_nat_amount', 'amount'], titles: ['amount'] },
  dueDate: { types: ['due_date'], titles: ['due date'] },
  cleared: { types: ['is_cleared'], titles: ['clr', 'cleared'] },
  paymentMethod: { types: ['pmt_mthd'], titles: ['payment method'] },
  className: { types: ['klass_name'], titles: ['class'] },
  location: { types: ['dept_name'], titles: ['location', 'department'] },
  createdBy: { types: ['create_by'], titles: ['created by'] },
  lastModifiedBy: { types: ['last_mod_by'], titles: ['last modified by'] },
};

// The TransactionList columns Finance asks for. QuickBooks' default set omits who entered a
// transaction, its payment method and cleared status; memo is requested explicitly so a company
// whose default layout drops it still sends the note. A company that rejects a column (class or
// location tracking off) is retried with QuickBooks' default columns.
export const TRANSACTION_LIST_COLUMNS = [
  'tx_date', 'txn_type', 'doc_num', 'name', 'memo', 'account_name', 'other_account', 'subt_nat_amount',
  'due_date', 'is_cleared', 'pmt_mthd', 'create_by', 'last_mod_by',
].join(',');

const QBO_TRANSACTION_SLUGS = {
  invoice: 'invoice', estimate: 'estimate', 'sales receipt': 'salesreceipt',
  'refund receipt': 'refundreceipt', 'credit memo': 'creditmemo', payment: 'recvpayment',
  bill: 'bill', expense: 'expense', check: 'check', 'credit card credit': 'creditcardcredit',
  'vendor credit': 'vendorcredit', 'purchase order': 'purchaseorder',
  // QuickBooks Online opens every bill payment, check or credit card, at /app/billpayment;
  // /app/billpaymentcheck returns its "can't find the page" screen (reported 2026-09-28).
  'bill payment': 'billpayment', 'bill payment (check)': 'billpayment',
  'bill payment (credit card)': 'billpayment', 'journal entry': 'journal',
  deposit: 'deposit', transfer: 'transfer',
};

function transactionUrl(type, id) {
  const slug = QBO_TRANSACTION_SLUGS[String(type || '').trim().toLowerCase()];
  return slug && id ? `https://qbo.intuit.com/app/${slug}?txnId=${encodeURIComponent(String(id))}` : null;
}

// Live reports carry the column key in MetaData (ColKey) and a generic ColType ("String", "Money");
// fixtures and older shapes put the key in ColType. Keys match first, then titles.
function columnIndexes(columns) {
  const result = {};
  const described = (columns || []).map((column) => ({
    keys: [column.ColType, ...(column.MetaData || []).filter((meta) => meta?.Name === 'ColKey').map((meta) => meta.Value)]
      .map((value) => String(value || '').toLowerCase()),
    title: String(column.ColTitle || '').toLowerCase(),
  }));
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    let index = described.findIndex((column) => column.keys.some((key) => aliases.types.includes(key)));
    if (index < 0) index = described.findIndex((column) => aliases.titles.includes(column.title));
    if (index >= 0) result[field] = index;
  }
  return result;
}

function flattenRows(rows, output) {
  for (const row of rows || []) {
    if (row.type === 'Data' && Array.isArray(row.ColData)) output.push(row.ColData);
    if (row.Rows?.Row) flattenRows(row.Rows.Row, output);
  }
}

function parseAmount(value) {
  const normalized = String(value || '').replace(/[$,]/g, '').trim();
  if (!normalized) return null;
  const number = Number(normalized.replace(/^\((.*)\)$/, '-$1'));
  return Number.isFinite(number) ? Math.round(number * 100) : null;
}

function rowFromCells(cells, indexes) {
  const cell = (field) => indexes[field] == null ? null : cells[indexes[field]];
  const type = cell('type')?.value || '';
  const id = cell('type')?.id || cells.find((entry) => entry?.id)?.id || null;
  const amount = cell('amount')?.value || '';
  const text = (field) => String(cell(field)?.value || '').trim();
  return {
    date: text('date'), type, docNum: text('docNum'),
    name: text('name'), nameId: cell('name')?.id || null, memo: text('memo'),
    account: text('account'), split: text('split'), amount, amountCents: parseAmount(amount),
    dueDate: text('dueDate'), cleared: text('cleared'), paymentMethod: text('paymentMethod'),
    className: text('className'), location: text('location'),
    createdBy: text('createdBy'), lastModifiedBy: text('lastModifiedBy'),
    transactionId: id, viewUrl: transactionUrl(type, id),
  };
}

const EXPENSE_CLASSIFICATIONS = new Set(['Expenses', 'Cost of Goods Sold', 'Other Expenses']);
const EXPENSE_GROUPS = new Set(['expenses', 'cogs', 'otherexpenses']);

function walkProfitAndLossDetail(rows, path, isExpense, indexes, output) {
  for (const row of rows || []) {
    if (row.type === 'Section' || row.Header) {
      const label = String(row.Header?.ColData?.[0]?.value || '').trim();
      // The top-level section is the classification (this company labels it "Expenditures");
      // everything under it is the account path, parent:child like the Church Report.
      const topLevel = isExpense == null;
      const expense = topLevel
        ? EXPENSE_GROUPS.has(String(row.group || '').toLowerCase()) || EXPENSE_CLASSIFICATIONS.has(normalizeChurchClassification(label))
        : isExpense;
      walkProfitAndLossDetail(row.Rows?.Row, topLevel || !label ? path : [...path, label], expense, indexes, output);
    } else if (isExpense && row.type === 'Data' && Array.isArray(row.ColData) && path.length) {
      const line = rowFromCells(row.ColData, indexes);
      if (line.amountCents == null || line.amountCents === 0) continue;
      output.push({ ...line, account: path.join(':') });
    }
  }
}

// Profit and Loss Detail lists every expense line under the account it was charged to, so a bill
// split across several accounts appears once per line with that line's own amount. Amounts are
// signed as the P&L shows them: a credit or refund reduces the account's spending.
export function parseProfitAndLossDetail(report) {
  const indexes = columnIndexes(report?.Columns?.Column);
  delete indexes.account;
  const lines = [];
  walkProfitAndLossDetail(report?.Rows?.Row, [], null, indexes, lines);
  return lines;
}

export function summarizeExpenseLines(lines) {
  const totals = new Map();
  for (const line of lines || []) {
    const current = totals.get(line.account) || { account: line.account, transactionCount: 0, amountCents: 0 };
    current.transactionCount += 1;
    current.amountCents += line.amountCents;
    totals.set(line.account, current);
  }
  return [...totals.values()].sort((a, b) => b.amountCents - a.amountCents || a.account.localeCompare(b.account));
}

export function parseTransactionList(report) {
  const indexes = columnIndexes(report?.Columns?.Column);
  const rows = [];
  flattenRows(report?.Rows?.Row, rows);
  return rows.map((cells) => rowFromCells(cells, indexes));
}

function defaultDates(now) {
  const date = new Date(now);
  return {
    startDate: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10),
    endDate: date.toISOString().slice(0, 10),
  };
}

export function resolveTransactionDates(searchParams, now = Date.now()) {
  const defaults = defaultDates(now);
  const startDate = searchParams?.get('start_date') || defaults.startDate;
  const endDate = searchParams?.get('end_date') || defaults.endDate;
  if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) return { ok: false, error: 'Dates must use YYYY-MM-DD.' };
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  if (start > end) return { ok: false, error: 'The start date must not be after the end date.' };
  if ((end - start) / 86400000 > MAX_RANGE_DAYS) return { ok: false, error: 'Choose a date range of one year or less.' };
  return { ok: true, startDate, endDate };
}

export async function loadQuickbooksTransactions(env, searchParams, { now = Date.now(), fetchImpl = fetch, includeExpenseLines = false } = {}) {
  const dates = resolveTransactionDates(searchParams, now);
  if (!dates.ok) return dates;
  const connection = await getConnection(env.FINANCE_DB);
  if (!connection?.realm_id) return { ok: false, ...dates, error: 'QuickBooks is not connected yet.' };
  let fresh;
  try {
    fresh = await ensureFreshAccessToken(env, env.FINANCE_DB, connection, {
      now: () => now,
      refreshTokensFn: (targetEnv, token) => refreshTokens(targetEnv, token, fetchImpl),
    });
  } catch {
    return { ok: false, ...dates, error: 'QuickBooks needs to be reconnected before transactions can be loaded.' };
  }
  const client = makeQboClient(env, fresh, fetchImpl);
  const range = { start_date: dates.startDate, end_date: dates.endDate };
  const listParams = { ...range, sort_by: 'tx_date', sort_order: 'descend' };
  const [first, detail] = await Promise.all([
    client.transactionList({ ...listParams, columns: TRANSACTION_LIST_COLUMNS }),
    includeExpenseLines ? loadExpenseLines(client, range) : null,
  ]);
  const response = first.ok || first.status !== 400 ? first : await client.transactionList(listParams);
  if (!response.ok) return { ok: false, ...dates, error: `QuickBooks could not load the transaction report (HTTP ${response.status}).` };
  const transactions = parseTransactionList(await response.json());
  return { ok: true, ...dates, transactions, ...(detail || {}), syncedAt: new Date(now).toISOString() };
}

// A failed Profit and Loss Detail read only drops the per-line view; the drill-down then falls
// back to grouping whole transactions and says so.
async function loadExpenseLines(client, range) {
  try {
    const response = await client.profitAndLossDetail(range);
    if (!response.ok) return { expenseLinesError: `QuickBooks could not load Profit and Loss Detail (HTTP ${response.status}).` };
    return { expenseLines: parseProfitAndLossDetail(await response.json()) };
  } catch {
    return { expenseLinesError: 'QuickBooks could not load Profit and Loss Detail.' };
  }
}

export function isSpending(row) {
  return EXPENSE_TRANSACTION_TYPES.has(String(row.type || '').toLowerCase()) && row.amountCents != null && row.amountCents !== 0;
}

export function spendingCents(row) {
  const amount = Math.abs(row.amountCents);
  return CREDIT_TRANSACTION_TYPES.has(String(row.type || '').toLowerCase()) ? -amount : amount;
}

// The account a spending row was charged to. On a bill or expense the Account column is the
// payable/bank side, so the Split column carries the expense account; "-Split-" means several.
export function expenseAccountOf(row) {
  const split = String(row.split || '').trim();
  if (split === SPLIT_PLACEHOLDER) return MULTIPLE_ACCOUNTS_LABEL;
  return split || row.account || '';
}

function summarize(transactions, keyOf, label) {
  const totals = new Map();
  for (const row of transactions || []) {
    const key = isSpending(row) ? keyOf(row) : '';
    if (!key) continue;
    const current = totals.get(key) || { [label]: key, transactionCount: 0, amountCents: 0 };
    current.transactionCount += 1;
    current.amountCents += spendingCents(row);
    totals.set(key, current);
  }
  return [...totals.values()].sort((a, b) => b.amountCents - a.amountCents || a[label].localeCompare(b[label]));
}

export function summarizeVendorSpend(transactions) {
  return summarize(transactions, (row) => row.name, 'name');
}

export function summarizeExpenseAccounts(transactions) {
  return summarize(transactions, expenseAccountOf, 'account');
}

// The spending rows behind one Expense drill-down account or one Vendor spend vendor.
export function spendingRowsFor(transactions, { account = null, vendor = null } = {}) {
  return (transactions || []).filter((row) => isSpending(row)
    && (account == null || expenseAccountOf(row) === account)
    && (vendor == null || row.name === vendor));
}

const SEARCH_FIELDS = ['date', 'type', 'docNum', 'name', 'memo', 'account', 'split', 'amount', 'paymentMethod', 'className', 'location', 'createdBy'];

// Case-insensitive search across every visible field; each word must match somewhere.
export function searchTransactions(transactions, query) {
  const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [...(transactions || [])];
  return (transactions || []).filter((row) => {
    const haystack = SEARCH_FIELDS.map((field) => String(row[field] ?? '')).join(' ').toLowerCase()
      + (row.amountCents == null ? '' : ` ${(Math.abs(row.amountCents) / 100).toFixed(2)}`);
    return words.every((word) => haystack.includes(word.replace(/[$,]/g, '')) || haystack.includes(word));
  });
}

export const TRANSACTION_SORTS = {
  date: (row) => row.date, type: (row) => row.type, number: (row) => row.docNum, name: (row) => row.name,
  account: (row) => row.account, category: (row) => row.split, amount: (row) => row.amountCents,
  memo: (row) => row.memo,
};

// Every transaction with one payee: bills and checks, and also the bill payments, deposits and
// journal entries the spending views leave out, so a payee reached from a bill payment is not
// empty. The QuickBooks entity id matches when both sides carry it; otherwise the name does.
export function transactionsForName(transactions, { name = '', nameId = '' } = {}) {
  return (transactions || []).filter((row) => (nameId && row.nameId ? row.nameId === nameId : row.name === name));
}

export function sortRows(rows, sorts, key, dir) {
  const valueOf = sorts[key];
  if (!valueOf) return [...rows];
  const direction = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const left = valueOf(a);
    const right = valueOf(b);
    const blankLeft = left == null || left === '';
    const blankRight = right == null || right === '';
    if (blankLeft || blankRight) return blankLeft === blankRight ? 0 : blankLeft ? 1 : -1;
    const order = typeof left === 'number' && typeof right === 'number'
      ? left - right : String(left).localeCompare(String(right), 'en-US', { numeric: true, sensitivity: 'base' });
    return order * direction;
  });
}

export function findTransactionExceptions(transactions) {
  const exceptions = [];
  for (const row of transactions || []) {
    const reasons = [];
    if (!row.account) reasons.push('Missing account');
    if (!row.name) reasons.push('Missing name');
    if (row.amountCents == null) reasons.push('Invalid or missing amount');
    if (!row.date) reasons.push('Missing date');
    if (reasons.length) exceptions.push({ ...row, reasons });
  }
  return exceptions;
}
