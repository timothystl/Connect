# Operations

Updated October 1, 2026. [AGENTS.md](../AGENTS.md) defines routine delivery authorization.
Finance operations (its Worker, database, staging, QuickBooks, recovery, and release) are documented
in [timothystl/finance](https://github.com/timothystl/finance).

## Environments

| Environment | Worker | Data/storage | Release |
|---|---|---|---|
| Connect production | `timothy-connect` | `timothy-connect-db`, `KV`, `timothy-connect-photos`; daily cron | `deploy.yml`, manual dispatch |

Main merges do not automatically deploy. Dispatch `deploy.yml` with the tested full main SHA and an
accurate release reason; it repeats `npm test` and the built-script check. Verify completion. A
requested routine release needs no additional signoff. Finance releases are dispatched from the
Finance repository. There is no Connect staging copy (retired October 2026): verify with tests and a
`wrangler deploy --dry-run`, then release.

Connect's `FINANCE_DB` binding points at Finance's production database, so Connect releases and
Finance releases share that data; coordinate any schema change to Finance-owned tables with the
Finance repository.

## Data and rollback

Inspect target configuration and live schema before migrations. Connect's current production
source is `timothy-connect-db`, not retained `tlc-volunteer-db`. Finance schema migrations
are run from the Finance repository, separately from Connect's; never load fixtures into production.
A data move needs a usable backup and reconciliation, with deliberate reader/writer cutover.
Do not enable unfinished feature flags merely because their code has deployed.

Rollback uses a known-good Cloudflare deployment or tested source redeployment, followed by
relevant smoke checks. Worker rollback does not undo D1/KV/R2 changes.

## Recovery and monitoring

The recorded Connect backup policy includes encrypted source/D1/R2/configuration inventory,
weekly and month-end retention, and disposable restore exercises. Sole-operator continuity
was accepted; do not restart it as an approval gate. A historical drill or policy does not prove
today's backup freshness. Verify the actual backup when a data move depends on it.

Monitor Worker/D1 logs, query attribution, scheduled jobs, import state, and error references.
Keep personal, financial, and credential values out of logs/issues. Use the relevant Wrangler
config for dry runs and releases; do not deploy against historical resource names.
