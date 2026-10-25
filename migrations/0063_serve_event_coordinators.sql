-- Event coordinators: a Connect account an administrator has put in charge of one
-- Serve event (the Christmas Market, say). On that event alone the coordinator can
-- edit the event and its shifts, update sign-up statuses, and email the people who
-- signed up -- without staff access to the rest of Connect.
--
-- Keyed by username, lowercased, the same identity the signed session carries.
-- Assignment is admin-only; the account itself is created in Settings -> Users.
CREATE TABLE IF NOT EXISTS serve_event_coordinators (
  event_id   INTEGER NOT NULL,
  username   TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (event_id, username)
);
