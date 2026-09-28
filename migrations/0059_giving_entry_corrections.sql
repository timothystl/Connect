-- Gift corrections, voids and refunds (Finance's Transactions page). A voided or refunded gift
-- keeps what was first recorded in original_amount_cents, and `amount` becomes what the church
-- actually kept, so every total, rollup trigger, deposit coverage figure, and giving statement
-- counts the net gift without a separate filter in each query. voided_at/refunded_cents (0056)
-- still record what happened. giving_entry_changes is the per-gift history: who changed which
-- field, from what, to what, and why.
ALTER TABLE giving_entries ADD COLUMN original_amount_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE giving_entries ADD COLUMN void_reason TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS giving_entry_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL,
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  changed_by TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL DEFAULT '',
  field TEXT NOT NULL DEFAULT '',
  old_value TEXT NOT NULL DEFAULT '',
  new_value TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_giving_entry_changes_entry ON giving_entry_changes(entry_id, changed_at);

-- Gifts already voided or refunded before this change (Stax's in-app refund button) still carry
-- their full amount; net them now. original_amount_cents>0 afterwards makes this a no-op on rerun.
UPDATE giving_entries
   SET original_amount_cents = amount,
       amount = CASE WHEN voided_at != '' THEN 0 ELSE MAX(amount - refunded_cents, 0) END
 WHERE original_amount_cents = 0 AND (voided_at != '' OR refunded_cents > 0);
