// ── QuickBooks sync backups ──────────────────────────────────────────────────────────────────────
// Andrew, 2026-09-27: keep what is there now, and be able to put it back if QuickBooks sends a bad
// sync. A sync can replace exactly two things in Finance's database: Church Report rows tagged
// source='qbo_sync' and the finance_qb_snapshot cache. Every sync therefore copies both into
// finance_qb_sync_backup_* first (migration 0017), and refuses to run if it cannot. Restoring puts
// one backup's copy back in a single D1 batch (all or nothing), after first backing up the current
// state, so a restore can itself be undone. Imports, committed plans and hand-typed corrections are
// never touched by a sync, so they are neither copied nor restored here.

import { ensureFinanceOwnedSchema } from './finance-owned-schema.js';

export const KEEP_BACKUPS = 10;

const ENTRY_COLUMNS = 'fiscal_year, period_month, classification, category_path, account_name, depth, has_children, own_actual_cents, own_budget_cents, account_qbo_id, notes, synced_at';

async function ready(db) {
  if (!db || !(await ensureFinanceOwnedSchema(db, 'qbSyncBackup'))) {
    throw new Error('the QuickBooks backup tables could not be prepared');
  }
}

// Copies the current QuickBooks-sourced rows and cache. Returns { id, churchRows, snapshotRows }.
// Throws when the copy cannot be made; callers must not change anything in that case.
// `protectId` keeps one older backup through pruning (the one a restore is about to read).
export async function createSyncBackup(db, { reason = '', now = Date.now(), protectId = 0 } = {}) {
  await ready(db);
  const createdAt = new Date(now).toISOString();
  const header = await db.prepare('INSERT INTO finance_qb_sync_backups (created_at, reason) VALUES (?, ?) RETURNING id')
    .bind(createdAt, String(reason).slice(0, 200)).first();
  const id = header?.id;
  if (!id) throw new Error('the QuickBooks backup could not be recorded');
  await db.batch([
    db.prepare(`INSERT INTO finance_qb_sync_backup_entries (backup_id, ${ENTRY_COLUMNS}) SELECT ?, ${ENTRY_COLUMNS} FROM finance_church_entries WHERE source='qbo_sync'`).bind(id),
    db.prepare('INSERT INTO finance_qb_sync_backup_snapshots (backup_id, key, value, synced_at) SELECT ?, key, value, synced_at FROM finance_qb_snapshot').bind(id),
    db.prepare(`UPDATE finance_qb_sync_backups SET
        church_rows=(SELECT COUNT(*) FROM finance_qb_sync_backup_entries WHERE backup_id=?),
        snapshot_rows=(SELECT COUNT(*) FROM finance_qb_sync_backup_snapshots WHERE backup_id=?)
      WHERE id=?`).bind(id, id, id),
  ]);
  await pruneSyncBackups(db, protectId);
  const row = await db.prepare('SELECT church_rows, snapshot_rows FROM finance_qb_sync_backups WHERE id=?').bind(id).first();
  return { id, churchRows: row?.church_rows || 0, snapshotRows: row?.snapshot_rows || 0 };
}

async function pruneSyncBackups(db, protectId) {
  const keep = `SELECT id FROM finance_qb_sync_backups ORDER BY id DESC LIMIT ${KEEP_BACKUPS}`;
  const protect = Number.parseInt(protectId, 10) || 0;
  await db.batch([
    db.prepare(`DELETE FROM finance_qb_sync_backup_entries WHERE backup_id NOT IN (${keep}) AND backup_id <> ?`).bind(protect),
    db.prepare(`DELETE FROM finance_qb_sync_backup_snapshots WHERE backup_id NOT IN (${keep}) AND backup_id <> ?`).bind(protect),
    db.prepare(`DELETE FROM finance_qb_sync_backups WHERE id NOT IN (${keep}) AND id <> ?`).bind(protect),
  ]);
}

// Newest first, for the Sync status page. Never throws: a missing table just means no backups yet.
export async function listSyncBackups(db) {
  try {
    await ready(db);
    const rows = (await db.prepare(`SELECT b.id, b.created_at, b.reason, b.church_rows, b.snapshot_rows,
        (SELECT MIN(fiscal_year) FROM finance_qb_sync_backup_entries e WHERE e.backup_id=b.id) AS first_year,
        (SELECT MAX(fiscal_year) FROM finance_qb_sync_backup_entries e WHERE e.backup_id=b.id) AS last_year
      FROM finance_qb_sync_backups b ORDER BY b.id DESC`).all()).results || [];
    return {
      ok: true,
      backups: rows.map((r) => ({
        id: r.id, createdAt: r.created_at, reason: r.reason, churchRows: r.church_rows, snapshotRows: r.snapshot_rows,
        firstYear: r.first_year ?? null, lastYear: r.last_year ?? null,
      })),
    };
  } catch (e) {
    return { ok: false, error: e.message, backups: [] };
  }
}

// Puts one backup's QuickBooks rows and cache back exactly as they were. The current state is
// backed up first. Returns { ok, restoredId, safetyBackupId } or { ok: false, error }.
export async function restoreSyncBackup(db, backupId, { now = Date.now() } = {}) {
  const id = Number.parseInt(backupId, 10);
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: 'Choose a backup to restore.' };
  await ready(db);
  const target = await db.prepare('SELECT id, created_at FROM finance_qb_sync_backups WHERE id=?').bind(id).first();
  if (!target) return { ok: false, error: 'That backup no longer exists.' };
  const safety = await createSyncBackup(db, { reason: `Before restoring the backup from ${String(target.created_at).slice(0, 16).replace('T', ' ')} UTC`, now, protectId: id });
  await db.batch([
    db.prepare("DELETE FROM finance_church_entries WHERE source='qbo_sync'"),
    db.prepare(`INSERT INTO finance_church_entries (${ENTRY_COLUMNS}, source) SELECT ${ENTRY_COLUMNS}, 'qbo_sync' FROM finance_qb_sync_backup_entries WHERE backup_id=?`).bind(id),
    db.prepare('DELETE FROM finance_qb_snapshot'),
    db.prepare('INSERT INTO finance_qb_snapshot (key, value, synced_at) SELECT key, value, synced_at FROM finance_qb_sync_backup_snapshots WHERE backup_id=?').bind(id),
  ]);
  return { ok: true, restoredId: id, safetyBackupId: safety.id };
}
