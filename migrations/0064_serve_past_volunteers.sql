-- Past volunteers for a Serve event: last year's list, imported by the event's coordinator so
-- they can be invited to sign up again. person_id links a row to People when its email or phone
-- matched an active person (who also gets the "<event> volunteer" tag). Nothing here is a
-- sign-up: these rows never fill a shift.
CREATE TABLE IF NOT EXISTS serve_past_volunteers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id     INTEGER NOT NULL,
  dedupe_key   TEXT NOT NULL,
  name         TEXT NOT NULL DEFAULT '',
  email        TEXT NOT NULL DEFAULT '',
  phone        TEXT NOT NULL DEFAULT '',
  source_label TEXT NOT NULL DEFAULT '',
  person_id    INTEGER,
  match_method TEXT NOT NULL DEFAULT '',
  invited_at   TEXT NOT NULL DEFAULT '',
  invite_count INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (event_id, dedupe_key)
);
