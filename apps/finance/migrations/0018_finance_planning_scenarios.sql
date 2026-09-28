-- Named planning scenarios (Andrew, September 28, 2026). A fiscal year may hold any number of
-- named scenarios instead of the two fixed slots of 0013. Each keeps the five group percentages
-- and may add a percentage for one board category (Chart of Accounts: 'revenue:donor',
-- 'expense:salaries', ...) or a dollar amount for one plan line (its category path). When a line
-- is adjusted, a line amount wins over a category percentage, which wins over the group
-- percentage. "Budget plan" is still the saved plan itself and is never stored here.
--
-- The 0013 tables are left in place, unchanged. Their rows are copied into these tables once,
-- the first time this runs (finance_planning_migrations records it), so a scenario deleted later
-- is never copied back. A council basis chosen on a slot that was never saved used the built-in
-- values, so that slot is created with those values.

CREATE TABLE IF NOT EXISTS finance_planning_migrations (
  name TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS finance_planning_scenario_sets (
  id TEXT PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 40),
  fiscal_year INTEGER NOT NULL CHECK (fiscal_year BETWEEN 2000 AND 2100),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  note TEXT NOT NULL DEFAULT '',
  giving_pct REAL NOT NULL DEFAULT 0 CHECK (giving_pct BETWEEN -50 AND 50),
  earned_pct REAL NOT NULL DEFAULT 0 CHECK (earned_pct BETWEEN -50 AND 50),
  passive_pct REAL NOT NULL DEFAULT 0 CHECK (passive_pct BETWEEN -50 AND 50),
  staff_pct REAL NOT NULL DEFAULT 0 CHECK (staff_pct BETWEEN -50 AND 50),
  other_pct REAL NOT NULL DEFAULT 0 CHECK (other_pct BETWEEN -50 AND 50),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS finance_planning_scenario_sets_year
  ON finance_planning_scenario_sets (fiscal_year);

CREATE TABLE IF NOT EXISTS finance_planning_scenario_overrides (
  scenario_id TEXT NOT NULL REFERENCES finance_planning_scenario_sets(id),
  kind TEXT NOT NULL CHECK (kind IN ('category', 'line')),
  target TEXT NOT NULL CHECK (length(target) BETWEEN 1 AND 200),
  pct REAL CHECK (pct IS NULL OR pct BETWEEN -100 AND 100),
  amount_cents INTEGER,
  CHECK ((kind = 'category' AND pct IS NOT NULL AND amount_cents IS NULL)
      OR (kind = 'line' AND amount_cents IS NOT NULL AND pct IS NULL)),
  PRIMARY KEY (scenario_id, kind, target)
);

CREATE TABLE IF NOT EXISTS finance_planning_basis_choice (
  fiscal_year INTEGER PRIMARY KEY CHECK (fiscal_year BETWEEN 2000 AND 2100),
  scenario_id TEXT NOT NULL CHECK (length(scenario_id) BETWEEN 1 AND 40),
  chosen_at TEXT NOT NULL DEFAULT (datetime('now')),
  chosen_by TEXT NOT NULL DEFAULT ''
);

INSERT OR IGNORE INTO finance_planning_scenario_sets
  (id, fiscal_year, name, note, giving_pct, earned_pct, passive_pct, staff_pct, other_pct, created_at, updated_at, updated_by)
  SELECT 'fy' || fiscal_year || '-' || slot, fiscal_year, name, note, giving_pct, earned_pct, passive_pct, staff_pct, other_pct,
         updated_at, updated_at, updated_by
    FROM finance_planning_scenarios
   WHERE NOT EXISTS (SELECT 1 FROM finance_planning_migrations WHERE name = '0018_finance_planning_scenarios');

INSERT OR IGNORE INTO finance_planning_scenario_sets
  (id, fiscal_year, name, note, giving_pct, earned_pct, passive_pct, staff_pct, other_pct, updated_by)
  SELECT 'fy' || fiscal_year || '-conservative', fiscal_year, 'Conservative', 'Plan for a soft year', -3, -2, -10, 0, 0, chosen_by
    FROM finance_planning_basis
   WHERE slot = 'conservative'
     AND NOT EXISTS (SELECT 1 FROM finance_planning_migrations WHERE name = '0018_finance_planning_scenarios');

INSERT OR IGNORE INTO finance_planning_scenario_sets
  (id, fiscal_year, name, note, giving_pct, earned_pct, passive_pct, staff_pct, other_pct, updated_by)
  SELECT 'fy' || fiscal_year || '-hopeful', fiscal_year, 'Hopeful', 'Giving grows beyond the plan', 2, 0, 0, 0, 0, chosen_by
    FROM finance_planning_basis
   WHERE slot = 'hopeful'
     AND NOT EXISTS (SELECT 1 FROM finance_planning_migrations WHERE name = '0018_finance_planning_scenarios');

INSERT OR IGNORE INTO finance_planning_basis_choice (fiscal_year, scenario_id, chosen_at, chosen_by)
  SELECT fiscal_year, CASE WHEN slot = 'plan' THEN 'plan' ELSE 'fy' || fiscal_year || '-' || slot END, chosen_at, chosen_by
    FROM finance_planning_basis
   WHERE NOT EXISTS (SELECT 1 FROM finance_planning_migrations WHERE name = '0018_finance_planning_scenarios');

INSERT OR IGNORE INTO finance_planning_migrations (name) VALUES ('0018_finance_planning_scenarios');
