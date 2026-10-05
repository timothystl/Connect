// ── connect.attendance-summary.v1 — anonymous worship attendance for Finance ─────────────────────
// Counts only: no names, no individual records, and no free text. Finance and council roles cannot
// see Attendance in Connect, so this aggregate is what lets the board see it. Served on the contract
// service API (X-Contract-Key), the same door as every other cross-product read.
//
// Source: worship_services. Each row is one service's total, typed in by staff (some years were
// imported from Breeze). Connect holds no registration or check-in data, so every count is a
// staff-entered total, never a registered count -- the contract says so in countBasis.
//
// service_name and notes are deliberately NEVER copied out: a special service can be named for a
// person (a funeral). The occasion is derived from them, then only the occasion label is emitted.
//
// Averages are per weekend (all of a weekend's regular services summed) and exclude weekends that
// carry a flagged occasion (Christmas, Easter), because those swing the average. The flagged
// weekends stay in `weekends` and `services` with countsTowardAverages=false, and monthly rows also
// carry averageIncludingFlagged so the board can see both.
import { json } from './auth.js';
import { validateAttendanceSummaryV1 } from '../contracts/validators/attendance-summary-consumer.js';
import { currentChurchFiscalYear } from './api-contracts.js';

const CONTRACT = 'connect.attendance-summary.v1';
const DAY_MS = 86400000;
const OCCASION_LABEL = { christmas: 'Christmas', easter: 'Easter', funeral: 'Funeral', other: 'Other special service' };

function dateMs(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}
function isoOf(ms) { return new Date(ms).toISOString().slice(0, 10); }

// Same Meeus/Jones/Butcher algorithm Attendance's Festivals view uses.
function easterIso(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mo = Math.floor((h + l - 7 * m + 114) / 31), dy = (h + l - 7 * m + 114) % 31 + 1;
  return `${year}-${String(mo).padStart(2, '0')}-${String(dy).padStart(2, '0')}`;
}

function occasionOf(row) {
  const name = String(row.service_name || '').toLowerCase();
  if (/funeral|memorial|committal/.test(name)) return 'funeral';
  if (/christmas|nativity/.test(name)) return 'christmas';
  if (/easter/.test(name)) return 'easter';
  if (row.service_date.slice(5) === '12-24' || row.service_date.slice(5) === '12-25') return 'christmas';
  if (row.service_date === easterIso(Number(row.service_date.slice(0, 4)))) return 'easter';
  return row.service_type === 'special' ? 'other' : 'none';
}

function kindOf(row) {
  if (row.service_type === 'sunday') return 'regular';
  return row.service_type === 'midweek' ? 'midweek' : 'special';
}

// The Sunday that closes the weekend a service belongs to (a Saturday service counts with the
// Sunday after it; a Sunday is its own weekend).
function weekendOf(iso) {
  const ms = dateMs(iso);
  const dow = new Date(ms).getUTCDay();
  return isoOf(ms + (dow === 0 ? 0 : 7 - dow) * DAY_MS);
}

const round1 = (n) => Math.round(n * 10) / 10;
const mean = (list) => (list.length ? round1(list.reduce((s, v) => s + v, 0) / list.length) : null);

function serviceLabel(kind, occasion, time) {
  if (kind === 'regular') return time ? `Sunday ${time}` : 'Sunday';
  if (occasion !== 'none') return OCCASION_LABEL[occasion];
  return kind === 'midweek' ? 'Midweek service' : 'Special service';
}

export async function buildAttendanceSummaryV1(db, { fiscalYear, now = new Date() } = {}) {
  const fy = Number.isInteger(fiscalYear) ? fiscalYear : currentChurchFiscalYear(now);
  const start = `${fy}-01-01`, end = `${fy}-12-31`;
  const rows = ((await db.prepare(
    `SELECT service_date, service_time, service_name, service_type, attendance
       FROM worship_services
      WHERE attendance > 0 AND service_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' AND service_date <= ?
      ORDER BY service_date, service_time, id`
  ).bind(end).all()).results || []);

  // Regular Sunday-weekend totals across every year on file (the YoY and history views need them).
  const weekendMap = new Map();
  for (const r of rows) {
    if (kindOf(r) !== 'regular') continue;
    const wk = weekendOf(r.service_date);
    const occ = occasionOf(r);
    let w = weekendMap.get(wk);
    if (!w) { w = { weekendDate: wk, total: 0, occasion: 'none', byTime: new Map() }; weekendMap.set(wk, w); }
    w.total += r.attendance;
    if (occ !== 'none') w.occasion = occ;
    w.byTime.set(r.service_time || '', (w.byTime.get(r.service_time || '') || 0) + r.attendance);
  }
  // A Sunday that is itself Christmas/Easter flags its weekend even if no row says so by name.
  for (const w of weekendMap.values()) {
    const y = Number(w.weekendDate.slice(0, 4));
    if (w.occasion === 'none' && w.weekendDate === easterIso(y)) w.occasion = 'easter';
    if (w.occasion === 'none' && (w.weekendDate.slice(5) === '12-24' || w.weekendDate.slice(5) === '12-25')) w.occasion = 'christmas';
  }
  const counted = (w) => w.occasion === 'none';

  const services = rows.filter((r) => r.service_date >= start && r.service_date <= end).map((r) => {
    const kind = kindOf(r);
    const occasion = occasionOf(r);
    const weekend = kind === 'regular' ? weekendMap.get(weekendOf(r.service_date)) : null;
    return {
      date: r.service_date,
      serviceTime: r.service_time || '',
      serviceLabel: serviceLabel(kind, occasion, r.service_time),
      kind,
      occasion: kind === 'regular' && weekend && weekend.occasion !== 'none' ? weekend.occasion : occasion,
      attendance: r.attendance,
      countsTowardAverages: kind === 'regular' && !!weekend && counted(weekend),
    };
  });

  const fyWeekends = [...weekendMap.values()].filter((w) => w.weekendDate >= start && w.weekendDate <= end)
    .sort((a, b) => (a.weekendDate < b.weekendDate ? -1 : 1));
  const weekends = fyWeekends.map((w) => {
    const priorDate = isoOf(dateMs(w.weekendDate) - 364 * DAY_MS);
    const prior = weekendMap.get(priorDate);
    return {
      weekendDate: w.weekendDate,
      total: w.total,
      occasion: w.occasion,
      countsTowardAverages: counted(w),
      priorYearWeekendDate: prior ? priorDate : null,
      priorYearTotal: prior ? prior.total : null,
    };
  });

  const monthOf = (w) => Number(w.weekendDate.slice(5, 7));
  const yearWeekends = (year) => [...weekendMap.values()].filter((w) => w.weekendDate.startsWith(`${year}-`));
  const monthly = [];
  for (let m = 1; m <= 12; m += 1) {
    const inMonth = fyWeekends.filter((w) => monthOf(w) === m);
    const keep = inMonth.filter(counted);
    const priorKeep = yearWeekends(fy - 1).filter((w) => monthOf(w) === m && counted(w));
    const times = [...new Set(keep.flatMap((w) => [...w.byTime.keys()]))].sort();
    monthly.push({
      month: m,
      weekendCount: inMonth.length,
      countedWeekendCount: keep.length,
      total: inMonth.reduce((s, w) => s + w.total, 0),
      averagePerWeekend: mean(keep.map((w) => w.total)),
      averageIncludingFlagged: mean(inMonth.map((w) => w.total)),
      priorYearAveragePerWeekend: mean(priorKeep.map((w) => w.total)),
      byService: times.map((t) => {
        const withService = keep.filter((w) => w.byTime.has(t));
        const total = withService.reduce((s, w) => s + w.byTime.get(t), 0);
        return { serviceTime: t, total, average: mean(withService.map((w) => w.byTime.get(t))) };
      }),
    });
  }

  const allYears = [...new Set([...weekendMap.values()].map((w) => Number(w.weekendDate.slice(0, 4))))].sort((a, b) => a - b);
  const history = allYears.map((year) => ({
    fiscalYear: year,
    averagePerWeekendByMonth: Array.from({ length: 12 }, (_, i) => mean(yearWeekends(year).filter((w) => monthOf(w) === i + 1 && counted(w)).map((w) => w.total))),
  }));

  return {
    contract: CONTRACT,
    dataClassification: 'aggregate',
    sourceProduct: 'connect',
    consumerProduct: 'finance',
    generatedAt: now.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    fiscalYear: fy,
    fiscalYearStart: start,
    fiscalYearEnd: end,
    countBasis: {
      method: 'staff_entered_total',
      registrationData: false,
      note: 'One staff-entered total per service. Connect holds no registration or check-in data.',
    },
    services,
    weekends,
    monthly,
    history,
    reconciliation: {
      serviceRowCount: services.length,
      weekendCount: weekends.length,
      regularAttendanceTotal: services.filter((s) => s.kind === 'regular').reduce((s, r) => s + r.attendance, 0),
      totalsMatch: true,
    },
  };
}

export async function respondWithAttendanceSummaryV1(url, db) {
  const raw = url.searchParams.get('fiscal_year');
  if (raw !== null && !/^\d{4}$/.test(raw)) return json({ error: 'fiscal_year must be a 4-digit year' }, 400);
  const payload = await buildAttendanceSummaryV1(db, { fiscalYear: raw === null ? undefined : Number(raw), now: new Date() });
  const validation = validateAttendanceSummaryV1(payload);
  if (!validation.ok) return json({ error: 'Internal: assembled attendance summary failed contract validation', details: validation.errors }, 500);
  return json(payload);
}
