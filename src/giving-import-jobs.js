import { makeBreezeClient } from './breeze.js';
import { normalizeGift, giftsFromCsv, day } from './giving-import-format.js';

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS giving_import_jobs (id TEXT PRIMARY KEY, actor TEXT NOT NULL, source TEXT NOT NULL, payload TEXT NOT NULL, cursor INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS giving_import_history (job_id TEXT NOT NULL, payment_id TEXT NOT NULL, before_json TEXT NOT NULL, after_json TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(job_id,payment_id))`,
  `CREATE TABLE IF NOT EXISTS giving_import_people (payment_id TEXT PRIMARY KEY, person_ref TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS giving_import_guards (id TEXT PRIMARY KEY, ok INTEGER NOT NULL CHECK(ok=1))`,
];
export async function ensureImportSchema(db) { for (const sql of SCHEMA) await db.prepare(sql).run(); }
const rows = async (db, sql, ...args) => (await db.prepare(sql).bind(...args).all()).results || [];
const match = '(ge.breeze_id=? OR ge.breeze_id GLOB ?)';
const argsFor = id => [id, `${id}-[0-9]*`];
async function currentPayments(db, ids) {
  const found = new Map();
  for (let i = 0; i < ids.length; i += 40) {
    const chunk = ids.slice(i, i + 40), marks = chunk.map(() => '?').join(',');
    const records = await rows(db, `SELECT ge.*, (SELECT COUNT(*) FROM giving_entry_changes c WHERE c.entry_id=ge.id) AS changes,
      (SELECT COUNT(*) FROM giving_deposit_lines dl WHERE dl.batch_id=ge.batch_id) AS deposit_links
      FROM giving_entries ge WHERE ge.breeze_id IN (${marks}) OR substr(ge.breeze_id,1,instr(ge.breeze_id,'-')-1) IN (${marks}) ORDER BY ge.id`, ...chunk, ...chunk);
    for (const r of records) {
      const id = String(r.breeze_id).split('-')[0];
      if (!found.has(id)) found.set(id, []);
      found.get(id).push(r);
    }
  }
  return found;
}
function protectedGift(old) { return old.some(r => r.voided_at || r.refunded_cents > 0 || r.changes > 0 || r.deposit_id || r.deposit_links || r.external_txn_id || r.reconcile_status === 'reconciled'); }

export async function prepareImport(db, env, actor, input) {
  let gifts;
  if (input.source === 'csv') gifts = giftsFromCsv(String(input.csv || ''));
  else if (input.source === 'breeze') {
    const start = day(input.start), end = day(input.end);
    if (start > end || (Date.parse(end) - Date.parse(start)) / 86400000 > 31) throw new Error('Choose a date range of at most 32 days.');
    const client = makeBreezeClient(env);
    if (!client) throw new Error('The official Breeze connection is not configured.');
    const res = await client.givingList({ start, end, details: 1, limit: 10000 });
    if (!res.ok) throw new Error(`Breeze could not be read (${res.status}). No gifts changed.`);
    const raw = await res.json();
    if (!Array.isArray(raw) || raw.length >= 10000) throw new Error('Breeze returned an incomplete or capped response. Choose a smaller date range.');
    gifts = raw.map(normalizeGift);
    if (gifts.some(g => g.date < start || g.date > end) || new Set(gifts.map(g => g.id)).size !== gifts.length) throw new Error('Breeze returned inconsistent dates or repeated payments. No gifts changed.');
  } else throw new Error('Choose Breeze or CSV.');
  await ensureImportSchema(db);
  const prepared = [];
  const existing = await currentPayments(db, gifts.map(g => g.id));
  for (const gift of gifts) {
    const before = existing.get(gift.id) || [];
    prepared.push({ gift, before, protected: protectedGift(before) });
  }
  const payload = JSON.stringify(prepared);
  if (new TextEncoder().encode(payload).length > 1500000) throw new Error('This preview is too large. Choose a smaller date range or file.');
  const id = crypto.randomUUID();
  await db.prepare('INSERT INTO giving_import_jobs(id,actor,source,payload) VALUES(?,?,?,?)').bind(id, actor, input.source, payload).run();
  return readImport(db, id);
}

export async function readImport(db, id, includeGifts = true) {
  await ensureImportSchema(db);
  const job = await db.prepare('SELECT * FROM giving_import_jobs WHERE id=?').bind(id).first();
  if (!job) throw new Error('Import not found.');
  const items = JSON.parse(job.payload);
  const people = new Map((await rows(db, 'SELECT id,breeze_id FROM people WHERE breeze_id != ?', '')).map(p => [String(p.breeze_id), p.id]));
  return { id: job.id, source: job.source, cursor: job.cursor, total: items.length, complete: job.cursor === items.length, cents: items.reduce((s, i) => s + i.gift.cents, 0), protected: items.filter(i => i.protected).length,
    unmatched: [...new Set(items.filter(i => i.gift.personRef && !people.has(i.gift.personRef)).map(i => i.gift.personRef))],
    gifts: includeGifts ? items.map(i => ({ paymentId: i.gift.id, date: i.gift.date, cents: i.gift.cents, funds: i.gift.funds.map(f => `${f.name || f.ref}: ${(f.cents / 100).toFixed(2)}`).join('; '), action: i.protected ? 'Kept: local correction or deposit' : i.before.length ? 'Refresh imported gift' : 'Add gift' })) : [] };
}

// A chunk is one D1 transaction, including its audit trail and progress cursor. Retries cannot
// double-apply a chunk. Snapshot guards reject concurrent edits rather than overwriting them.
export async function applyImport(db, id, actor, expectedCursor) {
  await ensureImportSchema(db);
  const job = await db.prepare('SELECT * FROM giving_import_jobs WHERE id=?').bind(id).first();
  if (!job) throw new Error('Import not found.');
  if (job.actor !== actor) throw new Error('Only the person who previewed this import can apply it.');
  const items = JSON.parse(job.payload);
  if (job.cursor !== expectedCursor) return readImport(db, id, false);
  if (job.cursor === items.length) return readImport(db, id, false);
  const stop = Math.min(job.cursor + 10, items.length);
  const statements = [];
  const guard = (sql, args) => {
    const key = crypto.randomUUID();
    statements.push(db.prepare(`INSERT INTO giving_import_guards(id,ok) VALUES(?,(${sql}))`).bind(key, ...args));
    statements.push(db.prepare('DELETE FROM giving_import_guards WHERE id=?').bind(key));
  };
  guard('SELECT CASE WHEN cursor=? THEN 1 ELSE 0 END FROM giving_import_jobs WHERE id=?', [job.cursor, id]);
  for (const item of items.slice(job.cursor, stop)) {
    const { gift: g, before } = item;
    if (item.protected) {
      statements.push(db.prepare('INSERT INTO giving_import_people(payment_id,person_ref) VALUES(?,?) ON CONFLICT(payment_id) DO NOTHING').bind(g.id, g.personRef));
      continue;
    }
    guard(`SELECT CASE WHEN COUNT(*)=? THEN 1 ELSE 0 END FROM giving_entries ge WHERE ${match}`, [before.length, ...argsFor(g.id)]);
    for (const r of before) {
      guard(`SELECT CASE WHEN COUNT(*)=1 THEN 1 ELSE 0 END FROM giving_entries ge WHERE id=? AND amount=? AND fund_id=? AND person_id IS ? AND contribution_date IS ? AND method IS ? AND batch_id=? AND COALESCE(voided_at,'')='' AND COALESCE(refunded_cents,0)=0 AND COALESCE(deposit_id,0)=0 AND NOT EXISTS(SELECT 1 FROM giving_entry_changes c WHERE c.entry_id=ge.id) AND NOT EXISTS(SELECT 1 FROM giving_deposit_lines dl WHERE dl.batch_id=ge.batch_id)`, [r.id, r.amount, r.fund_id, r.person_id, r.contribution_date, r.method, r.batch_id]);
    }
    const batchDescription = `Breeze ${g.date}${g.batch ? ` #${g.batch}` : ''}`;
    const batchId = before[0]?.batch_id;
    if (!batchId) statements.push(db.prepare('INSERT INTO giving_batches(batch_date,description,closed) SELECT ?,?,1 WHERE NOT EXISTS(SELECT 1 FROM giving_batches WHERE description=?)').bind(g.date, batchDescription, batchDescription));
    // Retain before/after provenance even when replacing split rows. Protected/reconciled gifts
    // stay unchanged; Finance's existing correction workflow handles those deliberately.
    statements.push(db.prepare('INSERT INTO giving_import_history(job_id,payment_id,before_json,after_json,actor) VALUES(?,?,?,?,?)').bind(id, g.id, JSON.stringify(before), JSON.stringify(g), actor));
    for (const [fundIndex, f] of g.funds.entries()) {
      const fee = fundIndex === 0 ? (g.feeCents ?? before.reduce((sum, row) => sum + (row.fee_cents || 0), 0)) : 0;
      statements.push(db.prepare(`UPDATE funds SET breeze_id=? WHERE id=(SELECT MIN(id) FROM funds WHERE LOWER(TRIM(name))=LOWER(TRIM(?)) AND COALESCE(breeze_id,'')='' HAVING COUNT(*)=1) AND NOT EXISTS(SELECT 1 FROM funds WHERE breeze_id=?)`).bind(f.ref, f.name, f.ref));
      statements.push(db.prepare(`INSERT INTO funds(name,breeze_id,active,sort_order) SELECT ?,?,1,99 WHERE NOT EXISTS(SELECT 1 FROM funds WHERE breeze_id=?)`).bind(f.name || `Breeze Fund ${f.ref}`, f.ref, f.ref));
      if (before[fundIndex]) {
        statements.push(db.prepare(`UPDATE giving_entries SET person_id=(SELECT id FROM people WHERE breeze_id=? LIMIT 1), fund_id=(SELECT id FROM funds WHERE breeze_id=? ORDER BY id LIMIT 1), amount=?,method=?,check_number=?,notes=?,breeze_id=?,contribution_date=?,fee_cents=? WHERE id=?`).bind(g.personRef, f.ref, f.cents, g.method, g.check, g.note, g.id, g.date, fee, before[fundIndex].id));
      } else statements.push(db.prepare(`INSERT INTO giving_entries(batch_id,person_id,fund_id,amount,method,check_number,notes,breeze_id,contribution_date,fee_cents)
        VALUES(COALESCE(?,(SELECT id FROM giving_batches WHERE description=? ORDER BY id LIMIT 1)),(SELECT id FROM people WHERE breeze_id=? LIMIT 1),(SELECT id FROM funds WHERE breeze_id=? ORDER BY id LIMIT 1),?,?,?,?,?,?,?)`).bind(batchId || null, batchDescription, g.personRef, f.ref, f.cents, g.method, g.check, g.note, g.id, g.date, fee));
    }
    for (const surplus of before.slice(g.funds.length)) statements.push(db.prepare('DELETE FROM giving_entries WHERE id=?').bind(surplus.id));
    statements.push(db.prepare('INSERT INTO giving_import_people(payment_id,person_ref) VALUES(?,?) ON CONFLICT(payment_id) DO UPDATE SET person_ref=excluded.person_ref').bind(g.id, g.personRef));
  }
  statements.push(db.prepare('UPDATE giving_import_jobs SET cursor=? WHERE id=?').bind(stop, id));
  await db.batch(statements);
  return readImport(db, id, false);
}

// Identity stays in Connect. This fills only unattributed imported gifts; it never creates a
// person or overwrites an existing donor assignment. A correction record accompanies each row.
export async function matchImportedDonor(db, personRef, personId, actor) {
  await ensureImportSchema(db);
  const person = await db.prepare('SELECT id,breeze_id FROM people WHERE id=?').bind(personId).first();
  if (!person || String(person.breeze_id) !== String(personRef)) throw new Error('Choose the existing Connect person linked to this Breeze number.');
  const gifts = await rows(db, `SELECT ge.id FROM giving_entries ge JOIN giving_import_people p ON ge.breeze_id=p.payment_id WHERE p.person_ref=? AND ge.person_id IS NULL`, String(personRef));
  const statements = gifts.flatMap(g => [
    db.prepare(`INSERT INTO giving_entry_changes(entry_id,changed_by,action,field,old_value,new_value,reason) SELECT ?,?,'match','person_id','',?,'Matched imported Breeze donor' WHERE EXISTS(SELECT 1 FROM giving_entries WHERE id=? AND person_id IS NULL)`).bind(g.id, actor, String(personId), g.id),
    db.prepare('UPDATE giving_entries SET person_id=? WHERE id=? AND person_id IS NULL').bind(personId, g.id),
  ]);
  if (!statements.length) return { matched: 0 };
  const key = crypto.randomUUID();
  statements.unshift(db.prepare('INSERT INTO giving_import_guards(id,ok) VALUES(?,(SELECT CASE WHEN COUNT(*)=1 THEN 1 ELSE 0 END FROM people WHERE id=? AND breeze_id=?))').bind(key, personId, personRef));
  statements.push(db.prepare('DELETE FROM giving_import_guards WHERE id=?').bind(key));
  const results = await db.batch(statements);
  return { matched: results.filter((_, i) => i > 0 && i < results.length - 1 && i % 2 === 0).reduce((n, r) => n + (r.meta?.changes || 0), 0) };
}
