// ── Fail-closed parser for connect.attendance-summary.v1 ─────────────────────────────────────────
// Anonymous worship attendance: counts only. Closed key sets everywhere (an unknown field, such as a
// name or a note, fails closed), no I/O, and a validate/accept pair so the producer
// (src/api-attendance-summary-contract.js) and Finance's client cannot drift apart.
const CONTRACT = 'connect.attendance-summary.v1';
const ROOT_KEYS = [
  'contract', 'dataClassification', 'sourceProduct', 'consumerProduct', 'generatedAt', 'fiscalYear',
  'fiscalYearStart', 'fiscalYearEnd', 'countBasis', 'services', 'weekends', 'monthly', 'history', 'reconciliation',
];
const COUNT_BASIS_KEYS = ['method', 'registrationData', 'note'];
const SERVICE_KEYS = ['date', 'serviceTime', 'serviceLabel', 'kind', 'occasion', 'attendance', 'countsTowardAverages'];
const WEEKEND_KEYS = ['weekendDate', 'total', 'occasion', 'countsTowardAverages', 'priorYearWeekendDate', 'priorYearTotal'];
const MONTH_KEYS = [
  'month', 'weekendCount', 'countedWeekendCount', 'total', 'averagePerWeekend', 'averageIncludingFlagged',
  'priorYearAveragePerWeekend', 'byService',
];
const BY_SERVICE_KEYS = ['serviceTime', 'total', 'average'];
const HISTORY_KEYS = ['fiscalYear', 'averagePerWeekendByMonth'];
const RECONCILIATION_KEYS = ['serviceRowCount', 'weekendCount', 'regularAttendanceTotal', 'totalsMatch'];
const KINDS = ['regular', 'midweek', 'special'];
const OCCASIONS = ['none', 'christmas', 'easter', 'funeral', 'other'];

const isRecord = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
function hasExactKeys(value, expected) {
  if (!isRecord(value)) return false;
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  return actual.length === required.length && actual.every((k, i) => k === required[i]);
}
const isDateTime = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(v) && !Number.isNaN(Date.parse(v));
const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const isYear = (v) => Number.isInteger(v) && v >= 2000 && v <= 2100;
const isCount = (v) => Number.isInteger(v) && v >= 0;
const isAvg = (v) => v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0);

export function validateAttendanceSummaryV1(value) {
  const errors = [];
  if (!hasExactKeys(value, ROOT_KEYS)) return { ok: false, errors: ['root must contain exactly the connect.attendance-summary.v1 fields'] };
  if (value.contract !== CONTRACT) errors.push(`contract must be ${CONTRACT}`);
  if (value.dataClassification !== 'aggregate') errors.push('dataClassification must be aggregate');
  if (value.sourceProduct !== 'connect') errors.push('sourceProduct must be connect');
  if (value.consumerProduct !== 'finance') errors.push('consumerProduct must be finance');
  if (!isDateTime(value.generatedAt)) errors.push('generatedAt must be an RFC 3339 UTC timestamp');
  if (!isYear(value.fiscalYear)) errors.push('fiscalYear must be a 4-digit integer year');
  if (value.fiscalYearStart !== `${value.fiscalYear}-01-01`) errors.push('fiscalYearStart must be January 1 of fiscalYear');
  if (value.fiscalYearEnd !== `${value.fiscalYear}-12-31`) errors.push('fiscalYearEnd must be December 31 of fiscalYear');

  const cb = value.countBasis;
  if (!hasExactKeys(cb, COUNT_BASIS_KEYS)) errors.push('countBasis must contain exactly the count basis fields');
  else {
    if (cb.method !== 'staff_entered_total') errors.push('countBasis.method must be staff_entered_total');
    if (cb.registrationData !== false) errors.push('countBasis.registrationData must be false');
    if (typeof cb.note !== 'string') errors.push('countBasis.note must be a string');
  }

  let regularTotal = 0;
  if (!Array.isArray(value.services)) errors.push('services must be an array');
  else value.services.forEach((s, i) => {
    const l = `services[${i}]`;
    if (!hasExactKeys(s, SERVICE_KEYS)) { errors.push(`${l} must contain exactly the service fields`); return; }
    if (!isDate(s.date) || s.date < value.fiscalYearStart || s.date > value.fiscalYearEnd) errors.push(`${l}.date must be a date inside the fiscal year`);
    if (typeof s.serviceTime !== 'string' || !/^(\d{2}:\d{2})?$/.test(s.serviceTime)) errors.push(`${l}.serviceTime must be HH:MM or empty`);
    if (typeof s.serviceLabel !== 'string' || !s.serviceLabel) errors.push(`${l}.serviceLabel must be a non-empty string`);
    if (!KINDS.includes(s.kind)) errors.push(`${l}.kind is not recognized`);
    if (!OCCASIONS.includes(s.occasion)) errors.push(`${l}.occasion is not recognized`);
    if (!isCount(s.attendance)) errors.push(`${l}.attendance must be a nonnegative integer`);
    if (typeof s.countsTowardAverages !== 'boolean') errors.push(`${l}.countsTowardAverages must be boolean`);
    if (s.kind === 'regular' && isCount(s.attendance)) regularTotal += s.attendance;
  });

  if (!Array.isArray(value.weekends)) errors.push('weekends must be an array');
  else value.weekends.forEach((w, i) => {
    const l = `weekends[${i}]`;
    if (!hasExactKeys(w, WEEKEND_KEYS)) { errors.push(`${l} must contain exactly the weekend fields`); return; }
    if (!isDate(w.weekendDate)) errors.push(`${l}.weekendDate must be a date`);
    if (!isCount(w.total)) errors.push(`${l}.total must be a nonnegative integer`);
    if (!OCCASIONS.includes(w.occasion)) errors.push(`${l}.occasion is not recognized`);
    if (w.countsTowardAverages !== (w.occasion === 'none')) errors.push(`${l}.countsTowardAverages must be true exactly when occasion is none`);
    if ((w.priorYearWeekendDate === null) !== (w.priorYearTotal === null)) errors.push(`${l} prior-year date and total must both be present or both null`);
    if (w.priorYearWeekendDate !== null && !isDate(w.priorYearWeekendDate)) errors.push(`${l}.priorYearWeekendDate must be a date or null`);
    if (w.priorYearTotal !== null && !isCount(w.priorYearTotal)) errors.push(`${l}.priorYearTotal must be a nonnegative integer or null`);
    if (i > 0 && isRecord(value.weekends[i - 1]) && value.weekends[i - 1].weekendDate >= w.weekendDate) errors.push('weekends must be ordered by ascending weekendDate');
  });

  if (!Array.isArray(value.monthly) || value.monthly.length !== 12) errors.push('monthly must be an array of 12 months');
  else value.monthly.forEach((m, i) => {
    const l = `monthly[${i}]`;
    if (!hasExactKeys(m, MONTH_KEYS)) { errors.push(`${l} must contain exactly the month fields`); return; }
    if (m.month !== i + 1) errors.push(`${l}.month must be ${i + 1}`);
    for (const k of ['weekendCount', 'countedWeekendCount', 'total']) if (!isCount(m[k])) errors.push(`${l}.${k} must be a nonnegative integer`);
    if (isCount(m.weekendCount) && isCount(m.countedWeekendCount) && m.countedWeekendCount > m.weekendCount) errors.push(`${l}.countedWeekendCount cannot exceed weekendCount`);
    for (const k of ['averagePerWeekend', 'averageIncludingFlagged', 'priorYearAveragePerWeekend']) if (!isAvg(m[k])) errors.push(`${l}.${k} must be a nonnegative number or null`);
    if (!Array.isArray(m.byService)) errors.push(`${l}.byService must be an array`);
    else m.byService.forEach((b, j) => {
      if (!hasExactKeys(b, BY_SERVICE_KEYS) || typeof b.serviceTime !== 'string' || !isCount(b.total) || !isAvg(b.average)) errors.push(`${l}.byService[${j}] must contain exactly serviceTime, total and average`);
    });
    if (Array.isArray(value.weekends)) {
      const sum = value.weekends.filter((w) => isRecord(w) && Number(String(w.weekendDate).slice(5, 7)) === m.month).reduce((s, w) => s + (isCount(w.total) ? w.total : 0), 0);
      if (m.total !== sum) errors.push(`${l}.total must equal the sum of that month's weekend totals`);
    }
  });

  if (!Array.isArray(value.history)) errors.push('history must be an array');
  else value.history.forEach((h, i) => {
    const l = `history[${i}]`;
    if (!hasExactKeys(h, HISTORY_KEYS)) { errors.push(`${l} must contain exactly the history fields`); return; }
    if (!isYear(h.fiscalYear)) errors.push(`${l}.fiscalYear must be a 4-digit integer year`);
    if (!Array.isArray(h.averagePerWeekendByMonth) || h.averagePerWeekendByMonth.length !== 12 || !h.averagePerWeekendByMonth.every(isAvg)) errors.push(`${l}.averagePerWeekendByMonth must be 12 nonnegative numbers or nulls`);
    if (i > 0 && isRecord(value.history[i - 1]) && value.history[i - 1].fiscalYear >= h.fiscalYear) errors.push('history must be ordered by ascending fiscalYear');
  });

  const r = value.reconciliation;
  if (!hasExactKeys(r, RECONCILIATION_KEYS)) errors.push('reconciliation must contain exactly the attendance reconciliation fields');
  else {
    if (Array.isArray(value.services) && r.serviceRowCount !== value.services.length) errors.push('reconciliation.serviceRowCount must equal services.length');
    if (Array.isArray(value.weekends) && r.weekendCount !== value.weekends.length) errors.push('reconciliation.weekendCount must equal weekends.length');
    if (r.regularAttendanceTotal !== regularTotal) errors.push('reconciliation.regularAttendanceTotal must equal the sum of regular service attendance');
    if (Array.isArray(value.weekends) && r.regularAttendanceTotal !== value.weekends.reduce((s, w) => s + (isRecord(w) && isCount(w.total) ? w.total : 0), 0)) errors.push('weekend totals must add up to regularAttendanceTotal');
    if (r.totalsMatch !== true) errors.push('reconciliation.totalsMatch must be true');
  }
  return { ok: errors.length === 0, errors };
}

export function acceptAttendanceSummaryV1(value) {
  const validation = validateAttendanceSummaryV1(value);
  if (!validation.ok) throw new TypeError(`Rejected ${CONTRACT}: ${validation.errors.join('; ')}`);
  return JSON.parse(JSON.stringify(value));
}
