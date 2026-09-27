-- QuickBooks sync backups. Before every sync (and before every restore), Finance copies everything
-- a sync can replace -- the Church Report rows tagged source='qbo_sync' and the finance_qb_snapshot
-- cache -- into these tables, so an admin can put the previous figures back if a sync brings in
-- bad data. Imports, committed plans and hand-typed corrections are never changed by a sync, so
-- they are not copied here. Finance keeps the most recent backups only (see
-- quickbooks-sync-backup.js).

CREATE TABLE IF NOT EXISTS finance_qb_sync_backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  church_rows INTEGER NOT NULL DEFAULT 0,
  snapshot_rows INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS finance_qb_sync_backup_entries (
  backup_id INTEGER NOT NULL REFERENCES finance_qb_sync_backups(id),
  fiscal_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL DEFAULT 0,
  classification TEXT NOT NULL,
  category_path TEXT NOT NULL,
  account_name TEXT NOT NULL,
  depth INTEGER NOT NULL DEFAULT 0,
  has_children INTEGER NOT NULL DEFAULT 0,
  own_actual_cents INTEGER NOT NULL DEFAULT 0,
  own_budget_cents INTEGER,
  account_qbo_id TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  synced_at TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS finance_qb_sync_backup_entries_backup
  ON finance_qb_sync_backup_entries (backup_id);

CREATE TABLE IF NOT EXISTS finance_qb_sync_backup_snapshots (
  backup_id INTEGER NOT NULL REFERENCES finance_qb_sync_backups(id),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  synced_at TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS finance_qb_sync_backup_snapshots_backup
  ON finance_qb_sync_backup_snapshots (backup_id);
