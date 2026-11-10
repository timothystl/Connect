CREATE TABLE IF NOT EXISTS giving_stax_reversal_events (
 event_id TEXT PRIMARY KEY,
 parent_id TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('refund','void')),
 amount_cents INTEGER NOT NULL CHECK(amount_cents>0)
);
