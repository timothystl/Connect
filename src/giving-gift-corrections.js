// ── Gift corrections, voids and refunds ─────────────────────────────────────────────────────
// One place that changes a recorded gift after the fact. Andrew's rule (Sept 2026): anyone with
// Giving edit access may correct a gift in place, even in a closed or reconciled batch, and every
// change is kept in giving_entry_changes (who, when, which field, old → new, why).
//
// A void or refund never deletes the gift. original_amount_cents keeps what was first recorded and
// `amount` becomes what the church kept (0 when voided), so every SUM(amount) — totals, the rollup
// triggers, giving statements — counts the net gift with no per-query filter. A deposit's own
// lines keep the amount that went to the bank, so a reconciled deposit stays matched.

const METHODS = new Set(['cash', 'check', 'online', 'card', 'ach', 'stock', 'other']);
export const VOID_KINDS = Object.freeze({
  error: 'Recorded in error',
  returned: 'Returned check (NSF)',
  refund: 'Refunded to the giver',
});

function toCents(value) {
  const n = Math.round(parseFloat(String(value ?? '').replace(/[$,\s]/g, '')) * 100);
  return Number.isFinite(n) ? n : NaN;
}

function isDay(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function clean(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

async function loadEntry(db, entryId) {
  return db.prepare(
    `SELECT ge.id, ge.batch_id, ge.person_id, ge.fund_id, ge.amount, ge.method, ge.check_number, ge.notes,
            COALESCE(NULLIF(ge.contribution_date,''), gb.batch_date) AS gift_date, ge.contribution_date,
            ge.processor, ge.external_txn_id, ge.refunded_cents, ge.voided_at, ge.original_amount_cents
       FROM giving_entries ge JOIN giving_batches gb ON gb.id=ge.batch_id WHERE ge.id=?`
  ).bind(entryId).first();
}

async function logChanges(db, entryId, email, action, changes, reason) {
  for (const [field, oldValue, newValue] of changes) {
    await db.prepare(
      `INSERT INTO giving_entry_changes (entry_id, changed_by, action, field, old_value, new_value, reason)
       VALUES (?,?,?,?,?,?,?)`
    ).bind(entryId, email || '', action, field, String(oldValue ?? ''), String(newValue ?? ''), reason || '').run();
  }
}

// History reads as a person would say it: dollars, fund and giver names, not ids or cents.
async function describeChanges(db, changes) {
  const fundName = async (id) => (id ? (await db.prepare('SELECT name FROM funds WHERE id=?').bind(id).first())?.name || `Fund #${id}` : '');
  const personName = async (id) => (id ? (await db.prepare(`SELECT TRIM(first_name||' '||last_name) AS n FROM people WHERE id=?`).bind(id).first())?.n || `Person #${id}` : 'Anonymous');
  const out = [];
  for (const [field, oldValue, newValue] of changes) {
    if (field === 'amount') out.push(['amount', dollars(oldValue), dollars(newValue)]);
    else if (field === 'fund_id') out.push(['fund', await fundName(oldValue), await fundName(newValue)]);
    else if (field === 'person_id') out.push(['giver', await personName(oldValue), await personName(newValue)]);
    else if (field === 'contribution_date') out.push(['gift date', oldValue, newValue]);
    else out.push([field.replace('_', ' '), oldValue, newValue]);
  }
  return out;
}

function dollars(cents) {
  return `$${((Number(cents) || 0) / 100).toFixed(2)}`;
}

// Correct any field of a recorded gift. Only the fields present in `body` are considered.
export async function correctGift(db, body, email) {
  const entryId = parseInt(body.entry_id, 10);
  const entry = Number.isInteger(entryId) ? await loadEntry(db, entryId) : null;
  if (!entry) return { error: 'That gift no longer exists.', status: 404 };
  const reason = clean(body.reason, 300);
  if (!reason) return { error: 'Say why the gift is being corrected.', status: 400 };

  const next = {};
  if (body.fund_id !== undefined && body.fund_id !== '') {
    const fundId = parseInt(body.fund_id, 10);
    const fund = Number.isInteger(fundId) ? await db.prepare('SELECT id FROM funds WHERE id=?').bind(fundId).first() : null;
    if (!fund) return { error: 'Choose a fund that exists.', status: 400 };
    next.fund_id = fundId;
  }
  if (body.amount !== undefined && body.amount !== '') {
    const cents = toCents(body.amount);
    if (!Number.isInteger(cents) || cents <= 0) return { error: 'The amount must be more than $0.', status: 400 };
    if (cents !== entry.amount && (entry.voided_at || entry.refunded_cents > 0)) {
      return { error: 'This gift was voided or refunded. Restore it before changing the amount.', status: 409 };
    }
    next.amount = cents;
  }
  if (body.method !== undefined && body.method !== '') {
    if (!METHODS.has(body.method)) return { error: 'Choose a giving method.', status: 400 };
    next.method = body.method;
  }
  if (body.check_number !== undefined) next.check_number = clean(body.check_number, 40);
  if (body.notes !== undefined) next.notes = clean(body.notes, 300);
  if (body.gift_date !== undefined && body.gift_date !== '') {
    if (!isDay(body.gift_date)) return { error: 'Choose the gift date.', status: 400 };
    next.contribution_date = body.gift_date;
  }
  if (body.person_id !== undefined) {
    if (body.person_id === '' || body.person_id === null || body.person_id === 'anonymous') {
      next.person_id = null;
    } else {
      const personId = parseInt(body.person_id, 10);
      const person = Number.isInteger(personId) ? await db.prepare('SELECT id FROM people WHERE id=?').bind(personId).first() : null;
      if (!person) return { error: 'That giver is no longer on record.', status: 400 };
      next.person_id = personId;
    }
  }

  const current = { ...entry, contribution_date: entry.gift_date };
  const changes = Object.entries(next).filter(([field, value]) => (current[field] ?? null) !== (value ?? null))
    .map(([field, value]) => [field, current[field], value]);
  if (!changes.length) return { ok: true, entry_id: entryId, batch_id: entry.batch_id, changed: 0 };
  const sets = changes.map(([field]) => `${field}=?`).join(',');
  await db.prepare(`UPDATE giving_entries SET ${sets} WHERE id=?`).bind(...changes.map(([, , value]) => value), entryId).run();
  await logChanges(db, entryId, email, 'corrected', await describeChanges(db, changes), reason);
  return { ok: true, entry_id: entryId, batch_id: entry.batch_id, changed: changes.length };
}

// Record the outcome of a void or refund on the gift row itself. Used by the manual void below
// and by Connect's Stax void-or-refund route once Stax confirms.
export async function applyGiftReduction(db, entry, { voided, refundCents = 0, reason = '', email = '', action }) {
  const original = entry.original_amount_cents > 0 ? entry.original_amount_cents : entry.amount;
  const refunded = voided ? entry.refunded_cents : Math.min(original, entry.refunded_cents + refundCents);
  const amount = voided ? 0 : original - refunded;
  await db.prepare(
    `UPDATE giving_entries SET original_amount_cents=?, amount=?, refunded_cents=?,
            voided_at=CASE WHEN ? THEN datetime('now') ELSE voided_at END, void_reason=? WHERE id=?`
  ).bind(original, amount, refunded, voided ? 1 : 0, reason, entry.id).run();
  await logChanges(db, entry.id, email, action || (voided ? 'voided' : 'refunded'), [['amount', dollars(entry.amount), dollars(amount)]], reason);
  return { amount, refunded_cents: refunded, original_amount_cents: original };
}

// Void (kind error|returned) or record a refund (kind refund, full or partial) on any gift that
// was not charged through the online processor. Processor gifts refund through the processor.
export async function voidGift(db, body, email) {
  const entryId = parseInt(body.entry_id, 10);
  const entry = Number.isInteger(entryId) ? await loadEntry(db, entryId) : null;
  if (!entry) return { error: 'That gift no longer exists.', status: 404 };
  const kind = VOID_KINDS[body.kind] ? body.kind : '';
  if (!kind) return { error: 'Choose why the gift is being voided or refunded.', status: 400 };
  if (entry.processor === 'stax' && entry.external_txn_id) {
    return { error: 'This gift was charged online. Refund it through the online giving processor so the card or bank account is credited.', status: 409 };
  }
  if (entry.voided_at) return { error: 'This gift was already voided.', status: 409 };
  if (entry.amount <= 0) return { error: 'Nothing is left on this gift to refund.', status: 409 };
  const note = clean(body.reason, 240);
  const reason = note ? `${VOID_KINDS[kind]}: ${note}` : VOID_KINDS[kind];
  if (kind === 'refund') {
    const cents = body.refund_amount === undefined || body.refund_amount === '' ? entry.amount : toCents(body.refund_amount);
    if (!Number.isInteger(cents) || cents <= 0) return { error: 'Enter how much was refunded.', status: 400 };
    if (cents > entry.amount) return { error: 'The refund is more than what is left on the gift.', status: 400 };
    const out = await applyGiftReduction(db, entry, { voided: false, refundCents: cents, reason, email, action: 'refunded' });
    return { ok: true, entry_id: entryId, batch_id: entry.batch_id, ...out };
  }
  const out = await applyGiftReduction(db, entry, { voided: true, reason, email, action: kind === 'returned' ? 'returned' : 'voided' });
  return { ok: true, entry_id: entryId, batch_id: entry.batch_id, ...out };
}

// Undo a manual void (for a gift voided by mistake). Refunds are money that left; they stay.
export async function restoreGift(db, body, email) {
  const entryId = parseInt(body.entry_id, 10);
  const entry = Number.isInteger(entryId) ? await loadEntry(db, entryId) : null;
  if (!entry) return { error: 'That gift no longer exists.', status: 404 };
  if (!entry.voided_at) return { error: 'This gift is not voided.', status: 409 };
  if (entry.processor === 'stax' && entry.external_txn_id) return { error: 'An online void cannot be undone here.', status: 409 };
  const reason = clean(body.reason, 300);
  if (!reason) return { error: 'Say why the void is being undone.', status: 400 };
  const amount = Math.max(0, entry.original_amount_cents - entry.refunded_cents);
  await db.prepare(`UPDATE giving_entries SET amount=?, voided_at='', void_reason='' WHERE id=?`).bind(amount, entryId).run();
  await logChanges(db, entryId, email, 'restored', [['amount', dollars(entry.amount), dollars(amount)]], reason);
  return { ok: true, entry_id: entryId, batch_id: entry.batch_id, amount };
}

export async function giftHistory(db, entryId) {
  return (await db.prepare(
    `SELECT changed_at, changed_by, action, field, old_value, new_value, reason
       FROM giving_entry_changes WHERE entry_id=? ORDER BY changed_at DESC, id DESC LIMIT 50`
  ).bind(entryId).all()).results || [];
}
