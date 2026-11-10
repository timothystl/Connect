-- Official giving imports: previews, atomic progress and durable provenance.
CREATE TABLE IF NOT EXISTS giving_import_jobs (id TEXT PRIMARY KEY, actor TEXT NOT NULL, source TEXT NOT NULL, payload TEXT NOT NULL, cursor INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS giving_import_history (job_id TEXT NOT NULL, payment_id TEXT NOT NULL, before_json TEXT NOT NULL, after_json TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(job_id,payment_id));
CREATE TABLE IF NOT EXISTS giving_import_people (payment_id TEXT PRIMARY KEY, person_ref TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS giving_import_guards (id TEXT PRIMARY KEY, ok INTEGER NOT NULL CHECK(ok=1));
