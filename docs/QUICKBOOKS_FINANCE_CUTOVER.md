# QuickBooks: moving the connection from Connect to Finance

Decision (Andrew, September 25, 2026): Finance owns the QuickBooks connection.

Status: complete. Both switches were released on September 25, 2026; Andrew connected and synced QuickBooks from Finance and confirmed on September 28 that Church Report totals match QuickBooks. Connect's QuickBooks code was then removed (see Later cleanup).

## Design

- Finance's handlers are in `apps/finance/quickbooks-oauth-routes.js`, and its sync writes Finance's database only:
  - `finance_qb_connection`, `finance_qb_snapshot` and `finance_qb_oauth_state` (migration `0008`, applied September 23);
  - `finance_settings` and `finance_church_entries`, which the storage cutover already moved.
- Finance's sync reproduces Connect's `finance/qb/sync` and `finance/qb/sync-years`, including the Church Report rows (source `qbo_sync`). The row-building helpers are copied into `apps/finance/quickbooks-church-sync.js`, and a test checks them against Connect's originals.
- **One refresh-token writer at every moment.** Intuit rotates the refresh token each time it is used, so two services holding one connection would break each other.
  - The cutover never copies Connect's token. Connect is disconnected first, then Finance gets its own token through a fresh consent.
- Two switches, both off by default:

  | Switch | Where | When `"1"` |
  |---|---|---|
  | `FINANCE_QB_ENABLED` | `wrangler.finance.jsonc` | Finance's QuickBooks page gets its controls, and the `/api/v1/qb/*` routes work (admin only). |
  | `QBO_MANAGED_BY_FINANCE` | `wrangler.toml` (Connect) | Every Connect `finance/qb/*` route answers 409 ("managed in Finance"), and Connect's token refresh refuses. Connect's reads of `finance_qb_connection` and `finance_qb_snapshot` go to Finance's database, so legacy screens and the data-status contract show Finance's connection. |

## Steps

1. **Deploy this code with both switches off.** Nothing changes for staff.
2. **Andrew, Intuit developer portal.** In the existing app (the one Connect uses), open Keys & credentials → Production. Add the redirect URI `https://finance.timothystl.org/api/v1/qb/callback`, keeping Connect's URI until step 6.
3. **Andrew, Cloudflare.** Set Finance's Worker secrets. Use the same client ID and secret the Intuit app already has, which are Connect's `QB_CLIENT_ID` / `QB_CLIENT_SECRET`:
   ```
   npx wrangler secret put FINANCE_QB_CLIENT_ID --config wrangler.finance.jsonc
   npx wrangler secret put FINANCE_QB_CLIENT_SECRET --config wrangler.finance.jsonc
   ```
4. **Disconnect Connect.** In legacy Connect, open Finance → Data & Imports → QuickBooks and choose Disconnect. This revokes Connect's token; from this point nothing holds a token.
5. **Flip both switches and release.** Merge the change that sets `QBO_MANAGED_BY_FINANCE = "1"` and `FINANCE_QB_ENABLED: "1"`. Deploy Connect first, then Finance.
6. **Connect Finance.** An admin opens Finance → QuickBooks → Sync status and does the following:
   1. Choose **Connect QuickBooks** and approve the Timothy Lutheran company.
   2. Choose **Sync now**.

   Once this works, Connect's old redirect URI can be removed from the Intuit app.
7. **Verify.** Compare a few Church Report totals with QuickBooks for the current year, one prior year and one recent month.
   - The first Finance sync also corrects a column-offset bug in the old Connect sync, which had placed each prior year's and each month's figures on the following year or month. So figures from an earlier Connect sync may change; the new ones should match QuickBooks.

## What a sync imports (decision: Andrew, September 27, 2026)

- **Actuals only.** Sync brings in:
  - yearly Profit & Loss for this year and the four before it (this year is year to date);
  - monthly Profit & Loss for this year and last year;
  - the chart of accounts (active accounts, up to 1,000).
- **No budgets from QuickBooks.** Intuit does not list `BudgetVsActuals` among its supported API reports, and the old Budget-vs-Actual figures were not trustworthy. Budgets stay in Finance: imported files, the budget import, or a committed plan.
- **Budgets still show beside the actuals.** Church Report shows one source per year. When that source is the QuickBooks sync and it carries no budget, the budget comes from the next source in priority, line by line (`resolveChurchYearPrecedence` in `src/api-finance.js`).
- **Transactions are not stored.** The Transactions pages read QuickBooks live, one date range at a time.
- **A backup comes first.** Before every sync, Finance copies the rows it can replace:
  - Church Report rows tagged `qbo_sync`;
  - the `finance_qb_snapshot` cache.

  They go to `finance_qb_sync_backup_*` (migration `0017`, which Finance creates on first use). If the backup fails, the sync does not run. Finance keeps the 10 most recent backups.
- **Restoring.** Sync status lists the backups, each with a **Restore** button. A restore saves the current figures first, so it can be undone. Imports, plans and hand-typed corrections are never changed by a sync or a restore.
- **Whole-database safety net.** Cloudflare D1 Time Travel can return all of `timothy-finance-db` to any minute in the last 30 days (`npx wrangler d1 time-travel restore timothy-finance-db --timestamp=<ISO time> --config wrangler.finance.jsonc`). It rolls back every Finance table, so use it only if the per-sync restore is not enough.

## Rollback

1. Disconnect in Finance, which revokes Finance's token.
2. Set both switches back to `"0"` and deploy Connect.
3. Reconnect QuickBooks from legacy Connect.

Never run both connections at once.

## Later cleanup

Done September 28, 2026, after the step 7 check:
- Connect's QuickBooks routes, OAuth client (`src/quickbooks.js`), token refresh, `qb_oauth_state:*` use of KV and legacy buttons are removed. Any old `finance/qb/*` link answers 409 and points to Finance; the legacy Data & Imports tab links there too.
- `QBO_MANAGED_BY_FINANCE` is gone: in `finance` storage mode Connect always reads `finance_qb_connection` and `finance_qb_snapshot` from Finance's database.

Still to do by hand:
- Delete Connect's Worker secrets `QB_CLIENT_ID`, `QB_CLIENT_SECRET` (and `QB_ENVIRONMENT` if set) from `timothy-connect`.
- Remove Connect's old redirect URI from the Intuit app, if not already done.
- Connect's own copies of `finance_qb_connection` and `finance_qb_snapshot` in `timothy-connect-db` are no longer read. They hold a revoked token and an old report cache. Dropping them is left for a deliberate decision, since it deletes data.

The rollback section above no longer applies as written: going back would mean restoring the removed Connect code.
