-- Nudge groups (rare, irregular, regular, large annual gift) are worked out from each giver's
-- gifts, and the rule will not suit everyone. This remembers a person's own call: a household
-- moved by hand stays in the group it was put in until it is set back to automatic. One row per
-- household or person ("h12" / "p34", the same key the nudge letters use). Nothing here sends anything.
CREATE TABLE IF NOT EXISTS giving_nudge_group_overrides (
  recipient_key TEXT PRIMARY KEY,
  group_key     TEXT NOT NULL,
  set_by        TEXT NOT NULL DEFAULT '',
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
