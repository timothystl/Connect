-- Donor letters (Finance, Sept 2026): one recorded send per recipient, year, letter type and
-- channel. The original UNIQUE(person_id, year, letter_type) from 0027 made a printed copy of a
-- letter already emailed to the same person (and every second household recorded without a
-- recipient, person_id 0) fail to record. Rebuild the table without it, keeping every row; the
-- legacy per-person identity survives as a partial unique index for rows with no recipient_key.
CREATE TABLE IF NOT EXISTS giving_letter_sends_v2 (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id     INTEGER NOT NULL,
  year          INTEGER NOT NULL,
  letter_type   TEXT    NOT NULL,
  sent_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  household_id  INTEGER,
  channel       TEXT    NOT NULL DEFAULT 'email',
  recipient_key TEXT
);
INSERT INTO giving_letter_sends_v2 (id, person_id, year, letter_type, sent_at, household_id, channel, recipient_key)
  SELECT id, person_id, year, letter_type, sent_at, household_id, channel, recipient_key FROM giving_letter_sends;
DROP TABLE giving_letter_sends;
ALTER TABLE giving_letter_sends_v2 RENAME TO giving_letter_sends;
CREATE UNIQUE INDEX IF NOT EXISTS idx_gls_recipient
  ON giving_letter_sends(recipient_key, year, letter_type, channel)
  WHERE recipient_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_gls_legacy
  ON giving_letter_sends(person_id, year, letter_type)
  WHERE recipient_key IS NULL;
