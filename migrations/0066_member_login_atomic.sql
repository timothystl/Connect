-- Atomic login authority; legacy KV challenges deliberately expire at release.
CREATE TABLE IF NOT EXISTS member_login_challenges (
  email_hash TEXT PRIMARY KEY,
  digest TEXT NOT NULL,
  tries INTEGER NOT NULL DEFAULT 0,
  consumed INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS member_login_limits (
  key TEXT PRIMARY KEY,
  used INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS member_sso_consumed (
  nonce TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_member_login_challenges_expiry ON member_login_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_member_login_limits_expiry ON member_login_limits(expires_at);
CREATE INDEX IF NOT EXISTS idx_member_sso_consumed_expiry ON member_sso_consumed(expires_at);
