// One-time load of the Dec 2025 – Aug 2026 AHRA monthly reports into Finance's property books
// (bank reconciliations, tenant receivables and security deposits held; there is no April 2026
// report on hand). Production only, recorded once in finance_seed_log, and never overwrites what an
// admin has entered: a month's bank rec is skipped when that month already exists, and a month's
// receivables are skipped when any line for that month already exists. Removing a month later
// does not bring it back, because the seed does not run again.
//
// Residents are listed by apartment, not by name; businesses by the name on the report.
import { ensureFinanceOwnedSchema } from './finance-owned-schema.js';
import { PROPERTY_KEY } from './property-books-service.js';

export const PROPERTY_BOOKS_SEED_KEY = 'property_books_ahra_2025_12_to_2026_08';

const APT_2 = ['2nd-floor apartment', '3275'];
const APT_1 = ['1st-floor apartment', '3277'];
const FRONT = ['Magnatone', '3283 front'];
const REAR = ['Breakout Fitness', '3283 rear'];

// [statement_month, bank statement balance, deposits in transit, outstanding checks, cash per the manager's report, note]
export const PROPERTY_BANK_REC_SEED = [
  ['2025-12', 240053, 0, 0, 240053, 'December 2025 report (old system): cleared balance, no reconciling items.'],
  ['2026-01', 471915, 0, 0, 471915, 'January 2026 report.'],
  ['2026-02', 825832, 42088, 37794, 830126, 'In transit: 3/18 rent payment $420.88. Outstanding: #5158 Collector of Revenue $377.94.'],
  ['2026-03', 986959, 0, 154609, 832350, 'Outstanding: #5164 Jim Taylor, Inc. $611.79; #5166 AHRA $934.30.'],
  ['2026-05', 1554069, 0, 548807, 1005262, 'Outstanding: #5174 distribution to the church $4,000.00; #5175 $125.00; #5176 Ameren $371.97; #5177 AHRA $991.10.'],
  ['2026-06', 1169180, 0, 66737, 1102443, 'Outstanding: #5184 Ameren $667.37.'],
  ['2026-07', 1556892, 0, 0, 1556892, 'July 2026 report.'],
  ['2026-08', 1806683, 0, 853335, 953348, 'Outstanding: #5194 distribution to the church $6,584.44; #5196 CD Strong $504.00; #5197 AHRA $1,444.91.'],
];

// report_month → [[tenant, unit], 0–30, 31–60, 61–90, over 90, deposit held, note]
export const PROPERTY_RECEIVABLES_SEED = {
  '2025-12': [
    [FRONT, 52482, 0, 0, 0, 160000, 'Utility reimbursements billed 12/21'],
    [REAR, 21239, 0, 0, 0, 230000, 'Listed as RJBJ Company, LLC (Gym); utility reimbursements billed 12/21'],
    [APT_2, 0, 0, 0, 0, 155000, ''],
    [APT_1, 0, 0, 0, 0, 107500, ''],
  ],
  '2026-01': [
    [FRONT, 112011, 0, 0, 0, 160000, ''],
    [REAR, 36421, 0, 0, 0, 230000, ''],
    [APT_2, 0, 0, 0, 0, 155000, ''],
    [APT_1, 0, 0, 0, 0, 0, 'No deposit on the new ledger; December showed $1,075.00'],
  ],
  '2026-02': [
    [FRONT, 0, 0, 0, 0, 160000, ''],
    [REAR, 0, 0, 0, 0, 230000, ''],
    [APT_2, 0, 0, 0, 0, 155000, ''],
    [APT_1, 0, 0, 0, 0, 0, ''],
  ],
  '2026-03': [
    [FRONT, 167261, 0, 0, 0, 160000, ''],
    [REAR, 287236, 0, 0, 0, 230000, ''],
    [APT_2, 5000, 0, 0, 0, 155000, ''],
    [APT_1, 0, 0, 0, 0, 0, ''],
  ],
  '2026-05': [
    [FRONT, 126972, 0, 0, 0, 160000, ''],
    [REAR, 37949, 0, 0, 0, 230000, ''],
    [APT_1, 0, 0, 0, 0, 0, ''],
  ],
  '2026-06': [
    [FRONT, 155357, 0, 0, 0, 160000, ''],
    [REAR, -51261, 0, 0, 0, 230000, 'Credit'],
    [APT_2, 0, 0, 0, 0, 102500, 'New tenant; deposit received in June'],
    [APT_1, 0, 0, 0, 0, 0, ''],
  ],
  '2026-07': [
    [FRONT, 116358, 0, 0, 0, 160000, ''],
    [REAR, 41418, -47555, 0, 0, 230000, 'Older credit offsets current charges'],
    [APT_2, 0, 0, 0, 0, 102500, ''],
    [APT_1, 0, 0, 0, 0, 0, ''],
  ],
  '2026-08': [
    [FRONT, 32965, 0, 0, 0, 160000, ''],
    [REAR, 8884, 0, -44233, 0, 230000, 'Older credit offsets current charges'],
    [APT_2, 0, 0, 0, 0, 102500, ''],
    [APT_1, -500, 0, 0, 0, 0, 'Prepaid rent'],
  ],
};

const SEED_LOG_SQL = `CREATE TABLE IF NOT EXISTS finance_seed_log (seed_key TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))`;

export function propertyBooksSeedStatements(db) {
  const statements = PROPERTY_BANK_REC_SEED.map(([month, bank, transit, checks, book, note]) => db.prepare(
    `INSERT INTO finance_property_bank_recs (property_key, statement_month, statement_balance_cents, deposits_in_transit_cents, outstanding_checks_cents, book_balance_cents, note, updated_by)
     VALUES ('${PROPERTY_KEY}', ?, ?, ?, ?, ?, ?, 'AHRA report import')
     ON CONFLICT(property_key, statement_month) DO NOTHING`
  ).bind(month, bank, transit, checks, book, note));
  // One statement per month, so a month is either loaded whole or skipped whole.
  for (const [month, rows] of Object.entries(PROPERTY_RECEIVABLES_SEED)) {
    const values = rows.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const binds = rows.flatMap(([[tenant, unit], current, d60, d90, over90, deposit, note]) => [tenant, unit, current, d60, d90, over90, deposit, note]);
    statements.push(db.prepare(
      `INSERT INTO finance_property_receivables (property_key, report_month, tenant, unit, current_cents, days_31_60_cents, days_61_90_cents, over_90_cents, deposit_held_cents, note, created_by)
       SELECT '${PROPERTY_KEY}', ?, column1, column2, column3, column4, column5, column6, column7, column8, 'AHRA report import'
       FROM (VALUES ${values})
       WHERE NOT EXISTS (SELECT 1 FROM finance_property_receivables WHERE property_key='${PROPERTY_KEY}' AND report_month = ?)`
    ).bind(month, ...binds, month));
  }
  statements.push(db.prepare(`INSERT INTO finance_seed_log (seed_key) VALUES (?) ON CONFLICT(seed_key) DO NOTHING`).bind(PROPERTY_BOOKS_SEED_KEY));
  return statements;
}

let seeded = false;

// Never throws: a failed seed leaves the pages reading whatever is there, and the next request tries again.
export async function seedPropertyBooksFromReports(env) {
  if (seeded || env?.ENVIRONMENT !== 'production' || !env.FINANCE_DB) return false;
  const db = env.FINANCE_DB;
  try {
    if (!(await ensureFinanceOwnedSchema(db, 'propertyBooks'))) return false;
    await db.prepare(SEED_LOG_SQL).run();
    const done = await db.prepare('SELECT 1 AS done FROM finance_seed_log WHERE seed_key = ?').bind(PROPERTY_BOOKS_SEED_KEY).first();
    if (!done) await db.batch(propertyBooksSeedStatements(db));
    seeded = true;
    return !done;
  } catch {
    return false;
  }
}

export function resetPropertyBooksSeedForTests() {
  seeded = false;
}
