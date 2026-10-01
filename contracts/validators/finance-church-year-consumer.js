// connect.finance-church-year.v1 — the Church Report's this-year detail as finished aggregate
// figures (see src/api-finance-church-year-contract.js): where each expense category sits against
// budget, this year against last year with the year-end projection, the supplies account by month,
// and Giving by fund. Account-group labels and fund names only; no donor, person or household is
// ever named, so council may read it.
const CONTRACT = 'connect.finance-church-year.v1';
const ROOT_KEYS = [
  'contract', 'dataClassification', 'sourceProduct', 'consumerProduct', 'currency', 'fiscalYear',
  'generatedAt', 'hasLedger', 'hasBudgetData', 'asOfDate', 'elapsedFraction', 'totals',
  'expenseCategories', 'yoy', 'supplies', 'givingCents', 'givingByFund',
];
const SERIES_KEYS = ['currentYtdCents', 'priorYtdCents', 'priorFullYearCents', 'projectedFullYearCents', 'method'];
const METHODS = new Set(['prior-year-ratio', 'straight-line', 'straight-line-annual']);

const isRecord = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isInt = (v) => Number.isInteger(v);
const isNonNegInt = (v) => Number.isInteger(v) && v >= 0;
const isText = (v) => typeof v === 'string';

function hasExactKeys(value, expected) {
  if (!isRecord(value)) return false;
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  return actual.length === required.length && actual.every((key, index) => key === required[index]);
}

function isDateTime(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value)
    && !Number.isNaN(Date.parse(value));
}

function checkPair(errors, value, name) {
  if (!hasExactKeys(value, ['actualCents', 'budgetCents']) || !isInt(value.actualCents) || !isNonNegInt(value.budgetCents)) {
    errors.push(`${name} must carry integer actualCents and nonnegative integer budgetCents`);
  }
}

function checkSeries(errors, value, name) {
  if (!hasExactKeys(value, SERIES_KEYS) || !SERIES_KEYS.slice(0, 4).every((k) => isInt(value[k])) || !METHODS.has(value.method)) {
    errors.push(`${name} must be a year-to-date series`);
  }
}

export function validateFinanceChurchYearV1(value) {
  const errors = [];
  if (!hasExactKeys(value, ROOT_KEYS)) return { ok: false, errors: ['root must contain exactly the church-year fields'] };
  if (value.contract !== CONTRACT) errors.push(`contract must be ${CONTRACT}`);
  if (value.dataClassification !== 'aggregate') errors.push('dataClassification must be aggregate');
  if (value.sourceProduct !== 'connect') errors.push('sourceProduct must be connect');
  if (value.consumerProduct !== 'finance') errors.push('consumerProduct must be finance');
  if (value.currency !== 'USD') errors.push('currency must be USD');
  if (!isInt(value.fiscalYear) || value.fiscalYear < 2000 || value.fiscalYear > 2100) errors.push('fiscalYear must be a 4-digit integer year');
  if (!isDateTime(value.generatedAt)) errors.push('generatedAt must be an RFC 3339 UTC timestamp');
  if (typeof value.hasLedger !== 'boolean' || typeof value.hasBudgetData !== 'boolean') errors.push('hasLedger and hasBudgetData must be boolean');
  if (!isText(value.asOfDate) || (value.asOfDate && !/^\d{4}-\d{2}-\d{2}$/.test(value.asOfDate))) errors.push('asOfDate must be empty or YYYY-MM-DD');
  if (typeof value.elapsedFraction !== 'number' || !(value.elapsedFraction >= 0 && value.elapsedFraction <= 1)) errors.push('elapsedFraction must be between 0 and 1');

  if (!hasExactKeys(value.totals, ['income', 'expenses', 'net'])) errors.push('totals must carry income, expenses and net');
  else {
    checkPair(errors, value.totals.income, 'totals.income');
    checkPair(errors, value.totals.expenses, 'totals.expenses');
    if (!hasExactKeys(value.totals.net, ['actualCents', 'budgetCents']) || !isInt(value.totals.net.actualCents) || !isInt(value.totals.net.budgetCents)) errors.push('totals.net must carry integer cents');
  }

  if (!Array.isArray(value.expenseCategories)) errors.push('expenseCategories must be an array');
  else {
    value.expenseCategories.forEach((c, i) => {
      const at = `expenseCategories[${i}]`;
      if (!hasExactKeys(c, ['path', 'label', 'actualCents', 'budgetCents', 'children']) || !isText(c.path) || !isText(c.label) || !isInt(c.actualCents) || !isNonNegInt(c.budgetCents) || !Array.isArray(c.children)) {
        errors.push(`${at} is malformed`); return;
      }
      c.children.forEach((k, j) => {
        if (!hasExactKeys(k, ['label', 'actualCents', 'budgetCents']) || !isText(k.label) || !isInt(k.actualCents) || !isNonNegInt(k.budgetCents)) errors.push(`${at}.children[${j}] is malformed`);
      });
    });
  }

  if (!isRecord(value.yoy) || typeof value.yoy.available !== 'boolean') errors.push('yoy must say whether it is available');
  else if (value.yoy.available) {
    if (!hasExactKeys(value.yoy, ['available', 'seasonal', 'throughMonth', 'income', 'expenses', 'net'])
      || typeof value.yoy.seasonal !== 'boolean' || !isInt(value.yoy.throughMonth) || value.yoy.throughMonth < 1 || value.yoy.throughMonth > 12) errors.push('yoy is malformed');
    else for (const k of ['income', 'expenses', 'net']) checkSeries(errors, value.yoy[k], `yoy.${k}`);
  } else if (!hasExactKeys(value.yoy, ['available'])) errors.push('an unavailable yoy carries only available');

  if (!hasExactKeys(value.supplies, ['monthly', 'currentYtdCents', 'priorYtdCents']) || !isInt(value.supplies.currentYtdCents) || !isInt(value.supplies.priorYtdCents)) errors.push('supplies is malformed');
  else if (!Array.isArray(value.supplies.monthly) || value.supplies.monthly.some((m) => !hasExactKeys(m, ['month', 'currentCents', 'priorCents']) || !isInt(m.month) || m.month < 1 || m.month > 12 || !isInt(m.currentCents) || !isInt(m.priorCents))) errors.push('supplies.monthly is malformed');

  if (!isInt(value.givingCents)) errors.push('givingCents must be integer cents');
  if (!Array.isArray(value.givingByFund) || value.givingByFund.some((f) => !hasExactKeys(f, ['fundName', 'cents']) || !isText(f.fundName) || !isInt(f.cents))) errors.push('givingByFund is malformed');
  return { ok: errors.length === 0, errors };
}

export function acceptFinanceChurchYearV1(value) {
  const validation = validateFinanceChurchYearV1(value);
  if (!validation.ok) throw new Error(`Invalid ${CONTRACT}: ${validation.errors.join('; ')}`);
  return structuredClone(value);
}
