// ── Giving deposits: the bank-deposit side of gift entry, shared by Connect's Giving tab and the
// contracts Finance's Reconciliation to bank page uses (Andrew, Sept 28 2026: deposit tools in
// Finance). A deposit is one bank slip. It holds batches (giving_deposit_lines, a batch can be
// split across slips) or, the older per-gift way still used for online gifts, the gifts
// themselves (giving_entries.deposit_id). "Given" is the line total when there are lines, else
// the gifts' total -- never both, so a deposit built both ways never counts itself twice.
import { computeDepositTotals } from './api-utils.js';

// The four work-queue counts above Connect's Offerings list, derived live from batches and
// deposits so they can never claim work that is already done.
export async function readOfferingsSummary(db, awaitingDays = 90, now = new Date()) {
  const yearStart = now.toISOString().slice(0, 4) + '-01-01';
  // "Awaiting deposit" is scoped to a recent window. Batch-to-deposit links only start existing
  // from this feature onward, so every historical batch is technically undeposited — counting
  // them would have the card announce years of money still in the safe on the day it ships.
  const awaitingSince = new Date(now.getTime() - awaitingDays * 86400000).toISOString().slice(0, 10);
  const [openRes, awaitingRes, unrecRes, feeRes] = await Promise.all([
    // Counted but not posted — batches still open.
    db.prepare(
      `SELECT COUNT(*) AS n, COALESCE(SUM(t.cents),0) AS cents FROM (
         SELECT gb.id, COALESCE(bt.total_cents,0) AS cents
           FROM giving_batches gb LEFT JOIN giving_batch_totals bt ON bt.batch_id=gb.id
          WHERE gb.closed=0) t`
    ).first(),
    // Counted, but not all of it has reached a deposit yet (no line at all, or lines that don't
    // cover the batch total — a partial bank run leaves the remainder here too).
    db.prepare(
      `SELECT COUNT(*) AS n, COALESCE(SUM(t.gap),0) AS cents FROM (
         SELECT gb.id, COALESCE(bt.total_cents,0) - COALESCE(dc.linked_cents,0) AS gap
           FROM giving_batches gb
           LEFT JOIN giving_batch_totals bt ON bt.batch_id=gb.id
           LEFT JOIN (
             SELECT batch_id, SUM(amount_cents) AS linked_cents
               FROM giving_deposit_lines GROUP BY batch_id
           ) dc ON dc.batch_id=gb.id
          WHERE gb.batch_date >= ?) t
        WHERE t.gap > 50`
    ).bind(awaitingSince).first(),
    // At the bank, but nobody has entered what the bank actually received. Windowed like
    // awaiting_deposit above: an old deposit left unreconciled under the earlier per-gift flow
    // would otherwise pin this card open forever and hold `earliest` at its date.
    db.prepare(
      `SELECT COUNT(*) AS n, MIN(deposit_date) AS earliest FROM giving_deposits
        WHERE bank_cents IS NULL AND deposit_date >= ?`
    ).bind(awaitingSince).first(),
    // Given - deposited across every deposit with a bank figure this year. Two rules matter:
    // a deposit with no bank figure is skipped entirely rather than counted as $0 fees (which
    // would read as a windfall), and "given" follows the same lines-else-gifts rule as the
    // deposit list — a deposit built the old per-gift way has no batch lines, and subtracting
    // its bank amount from zero would report a large negative fee. A deposit that holds NOTHING
    // is skipped outright for the same reason — there is no giving behind it to derive a fee
    // from, only a bank figure, and "given − bank" would be that figure negated.
    db.prepare(
      `SELECT COALESCE(SUM(
                CASE WHEN (SELECT COUNT(*) FROM giving_deposit_lines dl WHERE dl.deposit_id=d.id) > 0
                     THEN (SELECT COALESCE(SUM(dl.amount_cents),0) FROM giving_deposit_lines dl WHERE dl.deposit_id=d.id)
                     ELSE (SELECT COALESCE(SUM(ge.amount),0) FROM giving_entries ge WHERE ge.deposit_id=d.id)
                END - d.bank_cents),0) AS cents
         FROM giving_deposits d
        WHERE d.bank_cents IS NOT NULL AND d.deposit_date >= ?
          AND ((SELECT COUNT(*) FROM giving_deposit_lines dl WHERE dl.deposit_id=d.id) > 0
            OR (SELECT COUNT(*) FROM giving_entries ge WHERE ge.deposit_id=d.id) > 0)`
    ).bind(yearStart).first(),
  ]);
  return {
    open_batches:          { count: openRes?.n || 0, cents: openRes?.cents || 0 },
    awaiting_deposit:      { count: awaitingRes?.n || 0, cents: awaitingRes?.cents || 0, days: awaitingDays },
    unreconciled_deposits: { count: unrecRes?.n || 0, earliest_date: unrecRes?.earliest || '' },
    fees_ytd:              { cents: feeRes?.cents || 0 },
  };
}

const isDay = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));
const SOURCES = ['check', 'cash', 'online', 'mixed'];

function toCents(value) {
  const n = Math.round(parseFloat(String(value ?? '').replace(/[$,\s]/g, '')) * 100);
  return Number.isFinite(n) ? n : NaN;
}

async function audit(db, action, entityId, email) {
  await db.prepare(
    `INSERT INTO audit_log(action,entity_type,entity_id,person_name,field,old_value,new_value)
     VALUES(?, 'giving_deposits', ?, '', 'entered_by', '', ?)`
  ).bind(action, entityId ?? null, email || '').run().catch(() => {});
}

// Closed batches with money not yet on any deposit (or not on this one), newest first.
async function batchesToDeposit(db, excludeDepositId = null) {
  return (await db.prepare(
    `SELECT gb.id, gb.batch_date, gb.description, COALESCE(bt.total_cents,0) AS total_cents,
            COALESCE((SELECT SUM(dl.amount_cents) FROM giving_deposit_lines dl WHERE dl.batch_id=gb.id),0) AS linked_cents
       FROM giving_batches gb LEFT JOIN giving_batch_totals bt ON bt.batch_id=gb.id
      WHERE gb.closed=1 AND COALESCE(bt.total_cents,0) > 0
        AND COALESCE((SELECT SUM(dl.amount_cents) FROM giving_deposit_lines dl WHERE dl.batch_id=gb.id),0) < COALESCE(bt.total_cents,0)
        AND NOT EXISTS (SELECT 1 FROM giving_deposit_lines dl WHERE dl.batch_id=gb.id AND dl.deposit_id=?)
      ORDER BY gb.batch_date DESC, gb.id DESC LIMIT 40`
  ).bind(excludeDepositId ?? 0).all()).results || [];
}

// One deposit: its batch lines, its gifts, the totals the bank should show, and what could be added
// to it (closed batches with money left, and gifts on no deposit in a date window).
export async function readDepositDetail(db, depositId, { from = '', to = '' } = {}) {
  const dep = await db.prepare('SELECT * FROM giving_deposits WHERE id=?').bind(depositId).first();
  if (!dep) return null;
  const [gifts, lines, batches] = await Promise.all([
    db.prepare(
      `SELECT ge.id, ge.amount, ge.fee_cents, ge.method, ge.source, ge.processor, ge.reconcile_status, ge.check_number,
              COALESCE(NULLIF(ge.contribution_date,''), gb.batch_date) AS gift_date, f.name AS fund_name,
              COALESCE(p.first_name||' '||p.last_name,'(anonymous)') AS person_name
         FROM giving_entries ge JOIN funds f ON ge.fund_id=f.id JOIN giving_batches gb ON ge.batch_id=gb.id
         LEFT JOIN people p ON ge.person_id=p.id
        WHERE ge.deposit_id=? ORDER BY gift_date, ge.id`
    ).bind(depositId).all().then((r) => r.results || []),
    db.prepare(
      `SELECT dl.batch_id, dl.amount_cents, gb.batch_date, gb.description, COALESCE(bt.total_cents,0) AS batch_total_cents,
              COALESCE((SELECT SUM(x.amount_cents) FROM giving_deposit_lines x WHERE x.batch_id=dl.batch_id),0) AS batch_linked_cents
         FROM giving_deposit_lines dl JOIN giving_batches gb ON gb.id=dl.batch_id LEFT JOIN giving_batch_totals bt ON bt.batch_id=gb.id
        WHERE dl.deposit_id=? ORDER BY gb.batch_date, gb.id`
    ).bind(depositId).all().then((r) => r.results || []),
    dep.status === 'reconciled' ? [] : batchesToDeposit(db, depositId),
  ]);
  const lineCents = lines.reduce((s, l) => s + (l.amount_cents || 0), 0);
  const totals = computeDepositTotals(gifts, dep.bank_cents);
  const given = lines.length ? lineCents : totals.gross_cents;
  // Fees: what processors reported on this deposit's gifts, and what the bank figure implies.
  const bankGap = dep.bank_cents == null ? null : given - dep.bank_cents;
  let unassigned = [];
  const toDay = isDay(to) ? to : new Date().toISOString().slice(0, 10);
  const fromDay = isDay(from) ? from : new Date(Date.parse(`${toDay}T00:00:00Z`) - 60 * 864e5).toISOString().slice(0, 10);
  if (dep.status !== 'reconciled') {
    unassigned = (await db.prepare(
      `SELECT ge.id, ge.amount, ge.fee_cents, ge.method, ge.source, ge.check_number, ge.batch_id,
              COALESCE(NULLIF(ge.contribution_date,''), gb.batch_date) AS gift_date, f.name AS fund_name,
              COALESCE(p.first_name||' '||p.last_name,'(anonymous)') AS person_name
         FROM giving_entries ge JOIN funds f ON ge.fund_id=f.id JOIN giving_batches gb ON ge.batch_id=gb.id
         LEFT JOIN people p ON ge.person_id=p.id
        WHERE ge.deposit_id IS NULL AND ge.amount > 0
          AND NOT EXISTS (SELECT 1 FROM giving_deposit_lines dl WHERE dl.batch_id=ge.batch_id)
          AND COALESCE(NULLIF(ge.contribution_date,''), gb.batch_date) BETWEEN ? AND ?
        ORDER BY gift_date DESC, ge.id DESC LIMIT 200`
    ).bind(fromDay, toDay).all()).results || [];
  }
  return {
    deposit: { ...dep, given_cents: given, line_cents: lineCents, gift_count: gifts.length, batch_count: lines.length },
    lines, gifts, totals, bank_gap_cents: bankGap, batches_to_add: batches,
    unassigned, unassigned_from: fromDay, unassigned_to: toDay,
  };
}

async function openDeposit(db, depositId) {
  const dep = await db.prepare('SELECT id, status FROM giving_deposits WHERE id=?').bind(depositId).first();
  if (!dep) return { error: 'That deposit no longer exists.', status: 404 };
  if (dep.status === 'reconciled') return { error: 'That deposit is matched to the bank. Reopen it to change what it holds.', status: 409 };
  return { dep };
}

async function batchRoom(db, batchId, depositId) {
  const row = await db.prepare(
    `SELECT gb.id, gb.closed, COALESCE(bt.total_cents,0) AS total_cents,
            COALESCE((SELECT SUM(dl.amount_cents) FROM giving_deposit_lines dl WHERE dl.batch_id=gb.id AND dl.deposit_id != ?),0) AS elsewhere_cents
       FROM giving_batches gb LEFT JOIN giving_batch_totals bt ON bt.batch_id=gb.id WHERE gb.id=?`
  ).bind(depositId ?? 0, batchId).first();
  if (!row) return { error: 'That batch no longer exists.', status: 404 };
  if (!row.closed) return { error: 'Close the batch before depositing it.', status: 409 };
  return { room: row.total_cents - row.elsewhere_cents };
}

async function deleteIfEmpty(db, depositId) {
  const left = await db.prepare(
    `SELECT (SELECT COUNT(*) FROM giving_deposit_lines WHERE deposit_id=?) AS lines, (SELECT COUNT(*) FROM giving_entries WHERE deposit_id=?) AS gifts`
  ).bind(depositId, depositId).first();
  if ((left?.lines || 0) === 0 && (left?.gifts || 0) === 0) {
    await db.prepare('DELETE FROM giving_deposits WHERE id=?').bind(depositId).run();
    return true;
  }
  return false;
}

export const DEPOSIT_WRITE_OPS = ['create_deposit', 'set_deposit_line', 'remove_deposit_line', 'assign_gifts', 'unassign_gifts', 'update_deposit', 'delete_deposit'];

// The deposit writes Finance relays, each the same change Connect's own Giving tab makes.
export async function applyDepositWrite(db, body, email) {
  const op = String(body.op || '');
  const depositId = Number.parseInt(body.deposit_id, 10);
  if (op === 'create_deposit') {
    if (!isDay(body.deposit_date)) return { error: 'Choose the deposit date.', status: 400 };
    const source = SOURCES.includes(body.source) ? body.source : 'mixed';
    const r = await db.prepare('INSERT INTO giving_deposits (deposit_date, source, processor, external_ref, notes) VALUES (?,?,?,?,?)')
      .bind(body.deposit_date, source, '', String(body.external_ref || '').trim().slice(0, 80), String(body.notes || '').trim().slice(0, 500)).run();
    await audit(db, 'giving_deposit_created_via_finance', r.meta?.last_row_id, email);
    return { ok: true, deposit_id: r.meta?.last_row_id };
  }
  const found = await openDeposit(db, depositId);
  if (op === 'delete_deposit') {
    if (found.error) return found;
    // Gifts go back to unassigned, batches back to "needs deposit"; nothing else is deleted.
    await db.batch([
      db.prepare("UPDATE giving_entries SET deposit_id=NULL, reconcile_status='recorded' WHERE deposit_id=?").bind(depositId),
      db.prepare('DELETE FROM giving_deposit_lines WHERE deposit_id=?').bind(depositId),
      db.prepare('DELETE FROM giving_deposits WHERE id=?').bind(depositId),
    ]);
    await audit(db, 'giving_deposit_deleted_via_finance', depositId, email);
    return { ok: true, deposit_deleted: true };
  }
  if (op === 'update_deposit') {
    if (found.error && found.status === 404) return found;
    if (!isDay(body.deposit_date)) return { error: 'Choose the deposit date.', status: 400 };
    const source = SOURCES.includes(body.source) ? body.source : 'mixed';
    await db.prepare('UPDATE giving_deposits SET deposit_date=?, source=?, external_ref=?, notes=? WHERE id=?')
      .bind(body.deposit_date, source, String(body.external_ref || '').trim().slice(0, 80), String(body.notes || '').trim().slice(0, 500), depositId).run();
    return { ok: true, deposit_id: depositId };
  }
  if (found.error) return found;
  if (op === 'set_deposit_line') {
    const batchId = Number.parseInt(body.batch_id, 10);
    const room = await batchRoom(db, batchId, depositId);
    if (room.error) return room;
    const cents = body.amount === undefined || body.amount === '' ? room.room : toCents(body.amount);
    if (!Number.isInteger(cents) || cents <= 0) return { error: 'Enter how much of the batch is on this deposit.', status: 400 };
    if (cents > room.room) return { error: `Only ${(room.room / 100).toFixed(2)} of that batch is not already on another deposit.`, status: 400 };
    await db.prepare(
      `INSERT INTO giving_deposit_lines (deposit_id, batch_id, amount_cents) VALUES (?,?,?)
       ON CONFLICT(deposit_id, batch_id) DO UPDATE SET amount_cents=excluded.amount_cents`
    ).bind(depositId, batchId, cents).run();
    await audit(db, 'giving_deposit_line_via_finance', depositId, email);
    return { ok: true, deposit_id: depositId };
  }
  if (op === 'remove_deposit_line') {
    const batchId = Number.parseInt(body.batch_id, 10);
    await db.prepare('DELETE FROM giving_deposit_lines WHERE deposit_id=? AND batch_id=?').bind(depositId, batchId).run();
    const deleted = await deleteIfEmpty(db, depositId);
    await audit(db, 'giving_deposit_line_removed_via_finance', depositId, email);
    return { ok: true, deposit_id: deleted ? null : depositId, deposit_deleted: deleted };
  }
  if (op === 'assign_gifts' || op === 'unassign_gifts') {
    const ids = [...new Set((Array.isArray(body.entry_ids) ? body.entry_ids : []).map((x) => Number.parseInt(x, 10)).filter(Number.isInteger))].slice(0, 500);
    if (!ids.length) return { error: 'Check at least one gift.', status: 400 };
    const stmts = [];
    for (let i = 0; i < ids.length; i += 90) {
      const chunk = ids.slice(i, i + 90);
      const ph = chunk.map(() => '?').join(',');
      stmts.push(op === 'unassign_gifts'
        ? db.prepare(`UPDATE giving_entries SET deposit_id=NULL, reconcile_status='recorded' WHERE deposit_id=? AND id IN (${ph})`).bind(depositId, ...chunk)
        : db.prepare(`UPDATE giving_entries SET deposit_id=?, reconcile_status='deposited' WHERE deposit_id IS NULL AND id IN (${ph})`).bind(depositId, ...chunk));
    }
    await db.batch(stmts);
    let deleted = false;
    if (op === 'unassign_gifts') deleted = await deleteIfEmpty(db, depositId);
    await audit(db, op === 'assign_gifts' ? 'giving_deposit_gifts_via_finance' : 'giving_deposit_gifts_removed_via_finance', depositId, email);
    return { ok: true, count: ids.length, deposit_id: deleted ? null : depositId, deposit_deleted: deleted };
  }
  return { error: 'Unknown operation.', status: 400 };
}
