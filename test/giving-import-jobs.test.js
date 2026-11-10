import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { prepareImport, applyImport, matchImportedDonor } from '../src/giving-import-jobs.js';
import { giftsFromCsv, normalizeGift } from '../src/giving-import-format.js';

function database() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(`CREATE TABLE people(id INTEGER PRIMARY KEY,breeze_id TEXT,first_name TEXT,last_name TEXT);
    CREATE TABLE funds(id INTEGER PRIMARY KEY,name TEXT,breeze_id TEXT,active INTEGER,sort_order INTEGER);
    CREATE TABLE giving_batches(id INTEGER PRIMARY KEY,batch_date TEXT,description TEXT,closed INTEGER);
    CREATE TABLE giving_entries(id INTEGER PRIMARY KEY,batch_id INTEGER,person_id INTEGER,fund_id INTEGER,amount INTEGER,method TEXT,check_number TEXT,notes TEXT,breeze_id TEXT,contribution_date TEXT,voided_at TEXT DEFAULT '',refunded_cents INTEGER DEFAULT 0,deposit_id INTEGER,reconcile_status TEXT DEFAULT '',fee_cents INTEGER DEFAULT 0,external_txn_id TEXT DEFAULT '');
    CREATE TABLE giving_deposit_lines(batch_id INTEGER);
    CREATE TABLE giving_entry_changes(entry_id INTEGER,changed_by TEXT,action TEXT,field TEXT,old_value TEXT,new_value TEXT,reason TEXT);`);
  const statement = (query, args = []) => ({
    bind: (...a) => statement(query, a),
    async first() { return sql.prepare(query).get(...args); },
    async all() { return { results: sql.prepare(query).all(...args) }; },
    async run() { const r = sql.prepare(query).run(...args); return { meta: { changes: r.changes, last_row_id: Number(r.lastInsertRowid) } }; },
  });
  return { sql, prepare: q => statement(q), async batch(ss) { sql.exec('BEGIN'); try { const out = []; for (const s of ss) out.push(await s.run()); sql.exec('COMMIT'); return out; } catch (e) { sql.exec('ROLLBACK'); throw e; } } };
}
const csv = (amount = '100', funds = '1 General') => `Payment ID,Date,Amount,Fund(s),Person ID,Note\n101,2026-01-04,${amount},"${funds}",9,"A note, with a comma"`;
const preview = (db, text = csv()) => prepareImport(db, {}, 'admin@example.test', { source: 'csv', csv: text });

describe('official giving imports', () => {
  it('parses quoted CSV, rejects malformed amounts and inconsistent splits before writing', () => {
    expect(giftsFromCsv(csv())[0]).toMatchObject({ cents: 10000, note: 'A note, with a comma' });
    expect(() => giftsFromCsv(csv('12oops'))).toThrow(/amount/);
    expect(() => giftsFromCsv(csv('100', '1 General (60.00), 2 Music (30.00)'))).toThrow(/sum exactly/);
    expect(() => normalizeGift({ id: 1, date: '2026-02-30', amount: 1, funds: [{ id: 1 }] })).toThrow(/date/);
  });
  it('previews without changing gifts, resumes idempotently, and replaces exact same-total fund splits', async () => {
    const db = database();
    const job = await preview(db);
    expect(db.sql.prepare('SELECT COUNT(*) AS n FROM giving_entries').get().n).toBe(0);
    await applyImport(db, job.id, 'admin@example.test', 0);
    await applyImport(db, job.id, 'admin@example.test', 0);
    expect(db.sql.prepare('SELECT SUM(amount) AS n FROM giving_entries').get().n).toBe(10000);
    const next = await preview(db, csv('100', '1 General (60.00), 2 Music (40.00)'));
    await applyImport(db, next.id, 'admin@example.test', 0);
    expect(db.sql.prepare('SELECT amount FROM giving_entries ORDER BY fund_id').all().map(r => r.amount)).toEqual([6000, 4000]);
    expect(db.sql.prepare('SELECT COUNT(*) AS n FROM giving_import_history').get().n).toBe(2);
  });
  it('rolls back gifts, funds, audit and progress if a later split fails', async () => {
    const db = database();
    const job = await preview(db, csv('100', '1 General (60.00), 2 Music (40.00)'));
    db.sql.exec("CREATE TRIGGER reject_split BEFORE INSERT ON giving_entries WHEN NEW.amount=4000 BEGIN SELECT RAISE(ABORT,'injected failure'); END");
    await expect(applyImport(db, job.id, 'admin@example.test', 0)).rejects.toThrow();
    for (const table of ['giving_entries', 'funds', 'giving_batches', 'giving_import_history']) expect(db.sql.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n).toBe(0);
    expect(db.sql.prepare('SELECT cursor FROM giving_import_jobs WHERE id=?').get(job.id).cursor).toBe(0);
  });
  it('rejects a malformed Breeze response before changing existing gifts', async () => {
    const db = database(); const original = await preview(db); await applyImport(db, original.id, 'admin@example.test', 0);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => Response.json([{ id: 101, date: '2026-01-04', amount: '100', funds: [{ id: 1, amount: '90' }] }]);
    try {
      await expect(prepareImport(db, { BREEZE_SUBDOMAIN: 'example', BREEZE_API_KEY: 'test-only' }, 'admin@example.test', { source: 'breeze', start: '2026-01-01', end: '2026-01-31' })).rejects.toThrow(/sum exactly/);
      expect(db.sql.prepare('SELECT SUM(amount) AS n FROM giving_entries').get().n).toBe(10000);
    } finally { globalThis.fetch = originalFetch; }
  });

  it('rejects a concurrent correction and rolls back the whole chunk and its cursor', async () => {
    const db = database(); const initial = await preview(db); await applyImport(db, initial.id, 'admin@example.test', 0);
    const next = await preview(db, csv('120'));
    db.sql.exec('UPDATE giving_entries SET amount=9900');
    await expect(applyImport(db, next.id, 'admin@example.test', 0)).rejects.toThrow();
    expect(db.sql.prepare('SELECT amount FROM giving_entries').get().amount).toBe(9900);
    expect(db.sql.prepare('SELECT cursor FROM giving_import_jobs WHERE id=?').get(next.id).cursor).toBe(0);
  });
  it('keeps deposited gifts unchanged and backfills only unattributed gifts after a person is linked', async () => {
    const db = database(); const initial = await preview(db); await applyImport(db, initial.id, 'admin@example.test', 0);
    db.sql.exec("INSERT INTO people VALUES(3,'9','Test','Donor')");
    expect(await matchImportedDonor(db, '9', 3, 'admin@example.test')).toEqual({ matched: 1 });
    expect(db.sql.prepare('SELECT person_id FROM giving_entries').get().person_id).toBe(3);
    db.sql.exec('INSERT INTO giving_deposit_lines SELECT batch_id FROM giving_entries');
    const next = await preview(db, csv('120'));
    expect(next.protected).toBe(1);
    await applyImport(db, next.id, 'admin@example.test', 0);
    expect(db.sql.prepare('SELECT amount FROM giving_entries').get().amount).toBe(10000);
    await expect(applyImport(db, next.id, 'someone@example.test', 0)).rejects.toThrow(/Only the person/);
  });
  it('rejects repeated CSV fund rows rather than double-counting', () => {
    const text = csv();
    expect(() => giftsFromCsv(text + '\n' + text.split('\n')[1])).toThrow(/repeated/);
  });
});
