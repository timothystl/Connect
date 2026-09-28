// ── Online giving actions shared by Connect's Giving tab and Finance's Online giving page ──────
// Linking an unmatched online gift to a person, dismissing one, and editing or cancelling a
// recurring schedule. Each returns { ok, ... } or { error, status }; the callers turn that into
// their own response. Stax is still the sandbox processor (src/stax-giving-mockup.js).
import { staxRequest, staxMockupConfigured, buildScheduleRule, cents, amountStr, todayIso } from './stax-giving-mockup.js';

const INTERVALS = ['weekly', 'biweekly', 'twice_monthly', 'monthly'];

// Put an unmatched online gift on a person's record. The payer's Stax customer is remembered for
// that person too (when neither side is already linked), so their next gift matches on its own.
export async function linkOnlineGift(db, queueId, personId, by) {
  if (!Number.isInteger(personId)) return { error: 'Choose who gave this gift.', status: 400 };
  const row = await db.prepare(
    `SELECT id, giving_entry_id, status, stax_customer_id FROM giving_stax_unmatched WHERE id=?`
  ).bind(queueId).first();
  if (!row) return { error: 'That online gift is no longer waiting to be matched.', status: 404 };
  if (row.status !== 'open') return { error: 'This gift has already been reviewed.', status: 409 };
  const person = await db.prepare(`SELECT id FROM people WHERE id=? AND status='active'`).bind(personId).first();
  if (!person) return { error: 'That person could not be found.', status: 404 };
  const stmts = [
    db.prepare(`UPDATE giving_entries SET person_id=? WHERE id=?`).bind(personId, row.giving_entry_id),
    db.prepare(
      `UPDATE giving_stax_unmatched SET status='linked', linked_person_id=?, linked_by=?, linked_at=datetime('now') WHERE id=?`
    ).bind(personId, by || '', queueId),
  ];
  if (row.stax_customer_id) {
    stmts.push(db.prepare(
      `INSERT OR IGNORE INTO giving_stax_customers (person_id, stax_customer_id) VALUES (?,?)`
    ).bind(personId, row.stax_customer_id));
  }
  await db.batch(stmts);
  return { ok: true, entry_id: row.giving_entry_id };
}

export async function ignoreOnlineGift(db, queueId, by) {
  const row = await db.prepare(`SELECT id, status FROM giving_stax_unmatched WHERE id=?`).bind(queueId).first();
  if (!row) return { error: 'That online gift is no longer waiting to be matched.', status: 404 };
  if (row.status !== 'open') return { error: 'This gift has already been reviewed.', status: 409 };
  await db.prepare(
    `UPDATE giving_stax_unmatched SET status='ignored', linked_by=?, linked_at=datetime('now') WHERE id=?`
  ).bind(by || '', queueId).run();
  return { ok: true };
}

// Cancel best-effort calls Stax to stop future billing; the local row is cancelled either way and
// stax_cancelled says whether Stax confirmed.
export async function cancelRecurringSchedule(db, env, scheduleId) {
  const row = await db.prepare(`SELECT id, status, stax_schedule_id FROM giving_stax_recurring_schedules WHERE id=?`).bind(scheduleId).first();
  if (!row) return { error: 'That recurring gift no longer exists.', status: 404 };
  if (row.status === 'cancelled') return { ok: true, already_cancelled: true };
  let staxCancelled = false;
  if (row.stax_schedule_id && staxMockupConfigured(env)) {
    try {
      const del = await staxRequest(env.STAX_SANDBOX_API_KEY, `/invoice/schedule/${encodeURIComponent(row.stax_schedule_id)}`, { method: 'DELETE' });
      staxCancelled = del.ok;
    } catch { /* stays false — reported to staff, local row still gets cancelled */ }
  }
  await db.prepare(`UPDATE giving_stax_recurring_schedules SET status='cancelled' WHERE id=?`).bind(scheduleId).run();
  return { ok: true, stax_cancelled: staxCancelled, had_stax_schedule: !!row.stax_schedule_id };
}

// Edit fund, amount, or interval. The fund is local only; amount/interval must be accepted by
// Stax first when a live schedule exists, so the local row never claims what Stax doesn't have.
export async function updateRecurringSchedule(db, env, scheduleId, b) {
  const row = await db.prepare(
    `SELECT id, fund_id, amount_cents, interval, stax_schedule_id, status FROM giving_stax_recurring_schedules WHERE id=?`
  ).bind(scheduleId).first();
  if (!row) return { error: 'That recurring gift no longer exists.', status: 404 };
  if (row.status === 'cancelled') return { error: 'Cannot edit a cancelled schedule.', status: 409 };
  const fundId = parseInt(b.fund_id);
  if (!Number.isInteger(fundId)) return { error: 'Choose a fund.', status: 400 };
  const fund = await db.prepare('SELECT id FROM funds WHERE id=? AND active=1').bind(fundId).first();
  if (!fund) return { error: 'That fund is not available.', status: 400 };
  const interval = INTERVALS.includes(b.interval) ? b.interval : row.interval;
  const amountCents = cents(b.amount);
  if (amountCents === null) return { error: 'Enter a valid amount.', status: 400 };
  if (row.stax_schedule_id) {
    if (!staxMockupConfigured(env)) return { error: 'Stax is not configured in this environment.', status: 502 };
    let res;
    try {
      res = await staxRequest(env.STAX_SANDBOX_API_KEY, `/invoice/schedule/${encodeURIComponent(row.stax_schedule_id)}`, {
        method: 'PUT',
        body: JSON.stringify({ total: amountStr(amountCents), rule: buildScheduleRule(interval, todayIso()) }),
      });
    } catch (e) {
      return { error: 'Could not reach Stax: ' + String(e?.message || e), status: 502 };
    }
    if (!res.ok) return { error: res.data?.message || res.data?.error || `Stax returned HTTP ${res.status}.`, status: 502 };
  }
  await db.prepare(
    `UPDATE giving_stax_recurring_schedules SET fund_id=?, amount_cents=?, interval=? WHERE id=?`
  ).bind(fundId, amountCents, interval, scheduleId).run();
  return { ok: true };
}

// GET giving-online-v1 — everything Finance's Online giving page shows.
export async function readOnlineGiving(db, today = new Date().toISOString().slice(0, 10)) {
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const monthStart = `${today.slice(0, 7)}-01`;
  const ONLINE = `(COALESCE(ge.processor,'') != '' OR ge.method IN ('card','ach','online'))`;
  const DAY = `COALESCE(NULLIF(ge.contribution_date,''), gb.batch_date)`;
  const sums = await db.prepare(
    `SELECT SUM(CASE WHEN ${DAY} >= ? THEN ge.amount ELSE 0 END) AS month_cents,
            SUM(CASE WHEN ${DAY} >= ? THEN 1 ELSE 0 END) AS month_count,
            COALESCE(SUM(ge.amount),0) AS year_cents, COUNT(*) AS year_count,
            COALESCE(SUM(ge.fee_cents),0) AS year_fee_cents,
            COUNT(DISTINCT ge.person_id) AS year_givers
       FROM giving_entries ge JOIN giving_batches gb ON gb.id=ge.batch_id
      WHERE ${ONLINE} AND ${DAY} BETWEEN ? AND ?`
  ).bind(monthStart, monthStart, yearStart, today).first();
  const payments = (await db.prepare(
    `SELECT ge.id, ${DAY} AS gift_date, ge.batch_id, ge.person_id,
            TRIM(COALESCE(p.first_name,'')||' '||COALESCE(p.last_name,'')) AS person_name,
            COALESCE(u.payer_name,'') AS payer_name, f.name AS fund_name, ge.method,
            COALESCE(ge.processor,'') AS processor, ge.amount, COALESCE(ge.fee_cents,0) AS fee_cents,
            ge.refunded_cents, ge.voided_at, ge.notes, COALESCE(ge.external_txn_id,'') AS external_txn_id
       FROM giving_entries ge JOIN giving_batches gb ON gb.id=ge.batch_id JOIN funds f ON f.id=ge.fund_id
       LEFT JOIN people p ON p.id=ge.person_id
       LEFT JOIN giving_stax_unmatched u ON u.giving_entry_id=ge.id
      WHERE ${ONLINE} ORDER BY ${DAY} DESC, ge.id DESC LIMIT 60`
  ).all()).results || [];
  const recurring = (await db.prepare(
    `SELECT s.id, s.fund_id, f.name AS fund_name, s.amount_cents, s.interval, s.status,
            s.stax_schedule_id != '' AS has_stax_schedule, s.payer_name, s.person_id,
            TRIM(COALESCE(p.first_name,'')||' '||COALESCE(p.last_name,'')) AS person_name, s.created_at, s.stax_error
       FROM giving_stax_recurring_schedules s JOIN funds f ON f.id=s.fund_id LEFT JOIN people p ON p.id=s.person_id
      ORDER BY CASE s.status WHEN 'cancelled' THEN 1 ELSE 0 END, s.created_at DESC, s.id DESC LIMIT 200`
  ).all()).results || [];
  const unmatched = (await db.prepare(
    `SELECT u.id AS queue_id, u.payer_name, u.payer_email, u.card_brand, u.card_last4,
            ge.id AS entry_id, ge.amount, ${DAY} AS gift_date, f.name AS fund_name
       FROM giving_stax_unmatched u JOIN giving_entries ge ON ge.id=u.giving_entry_id
       JOIN giving_batches gb ON gb.id=ge.batch_id JOIN funds f ON f.id=ge.fund_id
      WHERE u.status='open' ORDER BY ${DAY} DESC, u.id DESC LIMIT 200`
  ).all()).results || [];
  // Who gives online: each person with an online gift this year or a processor account on file.
  const connections = (await db.prepare(
    `SELECT p.id AS person_id, TRIM(COALESCE(p.first_name,'')||' '||COALESCE(p.last_name,'')) AS person_name,
            COALESCE(p.envelope_number,'') AS envelope_number,
            (SELECT COUNT(*) FROM giving_stax_customers c WHERE c.person_id=p.id) AS processor_accounts,
            (SELECT COUNT(*) FROM giving_stax_recurring_schedules s WHERE s.person_id=p.id AND s.status != 'cancelled') AS active_recurring,
            (SELECT GROUP_CONCAT(DISTINCT ge.method) FROM giving_entries ge JOIN giving_batches gb ON gb.id=ge.batch_id
              WHERE ge.person_id=p.id AND ${ONLINE} AND ${DAY} >= ?) AS methods,
            (SELECT COALESCE(SUM(ge.amount),0) FROM giving_entries ge JOIN giving_batches gb ON gb.id=ge.batch_id
              WHERE ge.person_id=p.id AND ${ONLINE} AND ${DAY} >= ?) AS year_cents,
            (SELECT MAX(${DAY}) FROM giving_entries ge JOIN giving_batches gb ON gb.id=ge.batch_id
              WHERE ge.person_id=p.id AND ${ONLINE}) AS last_online_gift
       FROM people p
      WHERE EXISTS (SELECT 1 FROM giving_stax_customers c WHERE c.person_id=p.id)
         OR EXISTS (SELECT 1 FROM giving_entries ge JOIN giving_batches gb ON gb.id=ge.batch_id
                     WHERE ge.person_id=p.id AND ${ONLINE} AND ${DAY} >= ?)
      ORDER BY year_cents DESC, p.last_name LIMIT 500`
  ).bind(yearStart, yearStart, yearStart).all()).results || [];
  const funds = (await db.prepare('SELECT id, name FROM funds WHERE active=1 ORDER BY sort_order, name').all()).results || [];
  return {
    contract: 'connect.giving-online.v1',
    as_of: today,
    totals: {
      month_cents: sums?.month_cents || 0, month_count: sums?.month_count || 0,
      year_cents: sums?.year_cents || 0, year_count: sums?.year_count || 0,
      year_fee_cents: sums?.year_fee_cents || 0, year_givers: sums?.year_givers || 0,
    },
    payments, recurring, unmatched, connections, funds,
  };
}
