// ── giving-transactions-v1: Finance's Transactions page ─────────────────────────────────────
// Every recorded gift, searchable the way Breeze's Giving › Reports list is: a date range, funds,
// methods, an amount range, and a name / envelope # (current or past) / check # / memo search,
// with the Totals, Funds and Methods overviews for exactly the filtered set. Donor-level, so the
// caller needs Giving view (authorizeGivingBatchContract). `entry_id` adds one gift's detail and
// correction history; `giver_q` searches people for the "move to another giver" picker.
import { json } from './auth.js';
import { giftHistory } from './giving-gift-corrections.js';

const MAX_ROWS = 5000;
const PAGE_ROWS = 200;
const SORTS = {
  date_desc: 'gift_date DESC, ge.id DESC',
  date_asc: 'gift_date ASC, ge.id ASC',
  amount_desc: 'ge.amount DESC, ge.id DESC',
  amount_asc: 'ge.amount ASC, ge.id ASC',
  name: "person_sort ASC, gift_date DESC, ge.id DESC",
};

function isDay(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function intList(value) {
  return String(value || '').split(',').map((v) => parseInt(v, 10)).filter(Number.isInteger).slice(0, 100);
}

function textList(value) {
  return String(value || '').split(',').map((v) => v.trim()).filter((v) => /^[\w .()/-]{1,40}$/.test(v)).slice(0, 30);
}

function dollarsToCents(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const n = Math.round(parseFloat(String(value).replace(/[$,\s]/g, '')) * 100);
  return Number.isFinite(n) ? n : null;
}

export function parseTransactionFilters(params, today = new Date().toISOString().slice(0, 10)) {
  const from = isDay(params.get('from')) ? params.get('from') : `${today.slice(0, 4)}-01-01`;
  const to = isDay(params.get('to')) ? params.get('to') : today;
  const status = ['all', 'active', 'voided', 'refunded', 'changed'].includes(params.get('status')) ? params.get('status') : 'all';
  const sort = SORTS[params.get('sort')] ? params.get('sort') : 'date_desc';
  const batchId = parseInt(params.get('batch_id') || '', 10);
  return {
    from: from <= to ? from : to,
    to: from <= to ? to : from,
    funds: intList(params.get('funds')),
    methods: textList(params.get('methods')),
    min_cents: dollarsToCents(params.get('min')),
    max_cents: dollarsToCents(params.get('max')),
    q: String(params.get('q') || '').trim().slice(0, 60),
    batch_id: Number.isInteger(batchId) ? batchId : null,
    status,
    sort,
    offset: Math.max(0, Math.min(1e6, parseInt(params.get('offset') || '0', 10) || 0)),
    limit: params.get('all') === '1' ? MAX_ROWS : PAGE_ROWS,
  };
}

function buildWhere(f) {
  const where = [`COALESCE(NULLIF(ge.contribution_date,''), gb.batch_date) BETWEEN ? AND ?`];
  const binds = [f.from, f.to];
  if (f.funds.length) { where.push(`ge.fund_id IN (${f.funds.map(() => '?').join(',')})`); binds.push(...f.funds); }
  if (f.methods.length) { where.push(`ge.method IN (${f.methods.map(() => '?').join(',')})`); binds.push(...f.methods); }
  if (f.min_cents !== null) { where.push('ge.amount >= ?'); binds.push(f.min_cents); }
  if (f.max_cents !== null) { where.push('ge.amount <= ?'); binds.push(f.max_cents); }
  if (f.batch_id) { where.push('ge.batch_id = ?'); binds.push(f.batch_id); }
  if (f.status === 'active') where.push("ge.voided_at = '' AND ge.refunded_cents = 0");
  if (f.status === 'voided') where.push("ge.voided_at != ''");
  if (f.status === 'refunded') where.push('ge.refunded_cents > 0');
  if (f.status === 'changed') where.push('EXISTS (SELECT 1 FROM giving_entry_changes c WHERE c.entry_id=ge.id)');
  if (f.q) {
    const like = `%${f.q.replace(/[%_]/g, '')}%`;
    // Envelope: the current number, or any number the giver used before (envelope_history is a
    // JSON array of strings, so the quoted number appears verbatim in it).
    where.push(`(TRIM(COALESCE(p.first_name,'')||' '||COALESCE(p.last_name,'')) LIKE ? OR p.last_name LIKE ?
       OR COALESCE(p.preferred_name,'') LIKE ? OR p.envelope_number = ? OR COALESCE(p.envelope_history,'') LIKE ?
       OR ge.check_number = ? OR ge.notes LIKE ? OR ge.external_txn_id = ?)`);
    binds.push(like, like, like, f.q, `%"${f.q.replace(/["%_]/g, '')}"%`, f.q, like, f.q);
  }
  return { sql: where.join(' AND '), binds };
}

const FROM = `FROM giving_entries ge
  JOIN giving_batches gb ON gb.id = ge.batch_id
  JOIN funds f ON f.id = ge.fund_id
  LEFT JOIN people p ON p.id = ge.person_id`;

export async function respondWithGivingTransactionsV1(url, db) {
  const f = parseTransactionFilters(url.searchParams);
  const { sql, binds } = buildWhere(f);
  const rows = (await db.prepare(
    `SELECT ge.id, COALESCE(NULLIF(ge.contribution_date,''), gb.batch_date) AS gift_date,
            ge.batch_id, gb.batch_date, gb.description AS batch_description, gb.closed AS batch_closed,
            ge.person_id, TRIM(COALESCE(p.first_name,'')||' '||COALESCE(p.last_name,'')) AS person_name,
            COALESCE(p.last_name,'')||' '||COALESCE(p.first_name,'') AS person_sort,
            COALESCE(p.envelope_number,'') AS envelope_number,
            ge.fund_id, f.name AS fund_name, ge.method, ge.check_number, ge.notes, ge.amount,
            ge.original_amount_cents, ge.refunded_cents, ge.voided_at, ge.void_reason,
            COALESCE(ge.processor,'') AS processor, COALESCE(ge.external_txn_id,'') AS external_txn_id,
            COALESCE(ge.fee_cents,0) AS fee_cents, COALESCE(ge.deposit_id, 0) AS deposit_id,
            (SELECT COUNT(*) FROM giving_entry_changes c WHERE c.entry_id=ge.id) AS change_count
       ${FROM} WHERE ${sql} ORDER BY ${SORTS[f.sort]} LIMIT ? OFFSET ?`
  ).bind(...binds, f.limit, f.offset).all()).results || [];

  const totals = await db.prepare(
    `SELECT COUNT(*) AS gift_count, COALESCE(SUM(ge.amount),0) AS total_cents,
            COUNT(DISTINCT ge.person_id) AS giver_count,
            SUM(CASE WHEN ge.person_id IS NULL THEN 1 ELSE 0 END) AS anonymous_count,
            SUM(CASE WHEN ge.voided_at != '' THEN 1 ELSE 0 END) AS voided_count,
            COALESCE(SUM(ge.refunded_cents),0) AS refunded_cents
       ${FROM} WHERE ${sql}`
  ).bind(...binds).first();
  const byFund = (await db.prepare(
    `SELECT ge.fund_id, f.name AS fund_name, COUNT(*) AS gift_count, COALESCE(SUM(ge.amount),0) AS total_cents
       ${FROM} WHERE ${sql} GROUP BY ge.fund_id ORDER BY total_cents DESC`
  ).bind(...binds).all()).results || [];
  const byMethod = (await db.prepare(
    `SELECT ge.method, COUNT(*) AS gift_count, COALESCE(SUM(ge.amount),0) AS total_cents
       ${FROM} WHERE ${sql} GROUP BY ge.method ORDER BY total_cents DESC`
  ).bind(...binds).all()).results || [];
  const byGiver = (await db.prepare(
    `SELECT ge.person_id, TRIM(COALESCE(p.first_name,'')||' '||COALESCE(p.last_name,'')) AS person_name,
            COALESCE(p.envelope_number,'') AS envelope_number, COUNT(*) AS gift_count,
            COALESCE(SUM(ge.amount),0) AS total_cents, MAX(COALESCE(NULLIF(ge.contribution_date,''), gb.batch_date)) AS last_gift_date
       ${FROM} WHERE ${sql} GROUP BY ge.person_id ORDER BY total_cents DESC LIMIT 500`
  ).bind(...binds).all()).results || [];
  const byMonth = (await db.prepare(
    `SELECT substr(COALESCE(NULLIF(ge.contribution_date,''), gb.batch_date),1,7) AS month,
            COUNT(*) AS gift_count, COALESCE(SUM(ge.amount),0) AS total_cents
       ${FROM} WHERE ${sql} GROUP BY month ORDER BY month`
  ).bind(...binds).all()).results || [];

  const funds = (await db.prepare('SELECT id, name, active FROM funds ORDER BY active DESC, sort_order, name').all()).results || [];
  const methods = ((await db.prepare(`SELECT DISTINCT method FROM giving_entries WHERE method != '' ORDER BY method`).all()).results || []).map((r) => r.method);

  let detail = null;
  const entryId = parseInt(url.searchParams.get('entry_id') || '', 10);
  if (Number.isInteger(entryId)) {
    const gift = await db.prepare(
      `SELECT ge.id, COALESCE(NULLIF(ge.contribution_date,''), gb.batch_date) AS gift_date,
              ge.batch_id, gb.batch_date, gb.description AS batch_description, gb.closed AS batch_closed,
              ge.person_id, TRIM(COALESCE(p.first_name,'')||' '||COALESCE(p.last_name,'')) AS person_name,
              COALESCE(p.envelope_number,'') AS envelope_number,
              ge.fund_id, f.name AS fund_name, ge.method, ge.check_number, ge.notes, ge.amount,
              ge.original_amount_cents, ge.refunded_cents, ge.voided_at, ge.void_reason,
              COALESCE(ge.processor,'') AS processor, COALESCE(ge.external_txn_id,'') AS external_txn_id,
              COALESCE(ge.fee_cents,0) AS fee_cents, COALESCE(ge.deposit_id,0) AS deposit_id,
              COALESCE(ge.reconcile_status,'') AS reconcile_status
         ${FROM} WHERE ge.id=?`
    ).bind(entryId).first();
    if (gift) detail = { gift, history: await giftHistory(db, entryId) };
  }

  const giverQ = String(url.searchParams.get('giver_q') || '').trim().slice(0, 60);
  let givers = [];
  if (giverQ) {
    const like = `%${giverQ.replace(/[%_]/g, '')}%`;
    givers = (await db.prepare(
      `SELECT id, first_name, last_name, envelope_number FROM people
        WHERE (envelope_number=? OR COALESCE(envelope_history,'') LIKE ? OR (first_name||' '||last_name) LIKE ? OR last_name LIKE ?)
        ORDER BY (envelope_number=?) DESC, last_name, first_name LIMIT 20`
    ).bind(giverQ, `%"${giverQ.replace(/["%_]/g, '')}"%`, like, like, giverQ).all()).results || [];
  }

  return json({
    contract: 'connect.giving-transactions.v1',
    filters: { ...f, limit: undefined },
    page: { offset: f.offset, limit: f.limit, returned: rows.length, total: totals?.gift_count || 0 },
    totals: totals || { gift_count: 0, total_cents: 0, giver_count: 0, anonymous_count: 0, voided_count: 0, refunded_cents: 0 },
    by_fund: byFund,
    by_method: byMethod,
    by_giver: byGiver,
    by_month: byMonth,
    rows: rows.map(({ person_sort, ...row }) => row),
    funds,
    methods,
    detail,
    givers,
  });
}
