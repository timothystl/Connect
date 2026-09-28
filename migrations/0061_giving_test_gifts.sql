-- Stax test-mode gifts are kept apart from the real ledger (Andrew, 2026-09-28: test on the live
-- system, never count test gifts, and a button to remove them). The Stax giving mockup records
-- here, not in giving_entries, while Connect only has sandbox keys, so no total, report,
-- statement or rollup can include a test gift. Finance → Online giving → Test gifts lists them
-- and removes them. Recurring schedules created in test mode carry test=1.
CREATE TABLE IF NOT EXISTS giving_test_gifts (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  external_txn_id   TEXT    NOT NULL,
  contribution_date TEXT    NOT NULL DEFAULT '',
  fund_id           INTEGER NOT NULL,
  amount_cents      INTEGER NOT NULL DEFAULT 0,
  fee_cents         INTEGER NOT NULL DEFAULT 0,
  method            TEXT    NOT NULL DEFAULT 'card',
  note              TEXT    NOT NULL DEFAULT '',
  person_id         INTEGER,
  payer_name        TEXT    NOT NULL DEFAULT '',
  payer_email       TEXT    NOT NULL DEFAULT '',
  card_brand        TEXT    NOT NULL DEFAULT '',
  card_last4        TEXT    NOT NULL DEFAULT '',
  stax_customer_id  TEXT    NOT NULL DEFAULT '',
  created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_giving_test_gifts_txn ON giving_test_gifts(external_txn_id);
ALTER TABLE giving_stax_recurring_schedules ADD COLUMN test INTEGER NOT NULL DEFAULT 0;
