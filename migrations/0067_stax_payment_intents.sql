CREATE TABLE IF NOT EXISTS giving_stax_intents (
 id TEXT PRIMARY KEY,
 fingerprint TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('pending','complete')),
 response TEXT,
 status INTEGER,
 created_at INTEGER NOT NULL
);
