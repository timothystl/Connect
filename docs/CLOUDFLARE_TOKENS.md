# Cloudflare tokens: audit, reuse plan, and rotation map

Audited October 1, 2026 from the workflows and secret references in all six repositories
(`connect`, `finance`, `website`, `myMDO`, `app-launcher`, `ministry-study`). Names only; no values.
Reference, not startup instructions. Verify against current workflows before relying on it.

## Facts that shape everything

- The GitHub account is personal (`timothystl`), not an organization, so **organization-level shared
  secrets are not available**. A Cloudflare token reused across repositories is pasted into each
  repository separately. Rotating it means updating every repository that holds it.
- Cloudflare shows a token's value **once**, at creation. GitHub never shows a stored secret. If the
  value was not saved, it cannot be read back; the only options are to **roll** the token (new value,
  old one dies everywhere) or create a new token.
- `CLOUDFLARE_ACCOUNT_ID` is an identifier, not a credential. It never needs rotating; copy it freely.
- Worker runtime secrets (QuickBooks, payroll, session keys, and so on) live inside Cloudflare and are
  unaffected by rotating GitHub deploy tokens. They are listed in each app's own secrets reference.
- Releases of Connect, Finance, website, and myMDO use `CLOUDFLARE_API_TOKEN`. Database and storage
  tokens are used only by migration and recovery workflows; a stale one breaks those, not releases.

## Where each GitHub secret is read

| Secret | Connect | Finance | website | myMDO | app-launcher |
| --- | --- | --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` (Workers deploy) | deploy, staging deploy | deploy, staging deploy | deploy | deploy (auto-merge) | deploy |
| `CLOUDFLARE_D1_API_TOKEN` (D1 export/import) | D1 migrations (prod and staging), QuickBooks table drop, sandbox purge, recovery check | recovery check | D1 migration, recovery check | | |
| `CLOUDFLARE_R2_API_TOKEN` (R2 buckets) | | | image migration, recovery check | | |
| `CLOUDFLARE_KV_API_TOKEN` (KV) | RSVP store migration (one-time) | | | | |
| `CLOUDFLARE_ACCOUNT_ID` (not secret) | several | recovery check | several | deploy | |
| R2 S3-style keys (`R2_*`) | `R2_MIGRATION_ACCESS_KEY_ID` + `_SECRET_ACCESS_KEY` (photo migration, one-time) | | `R2_RECOVERY_ACCESS_KEY_ID` + `_SECRET_ACCESS_KEY` | `R2_ACCESS_KEY_ID` + `_SECRET_ACCESS_KEY` + `R2_ACCOUNT_ID` (Supabase backups to R2) | |

`ministry-study` uses no Cloudflare secrets. Finance, Connect, website, and app-launcher keep
theirs in a GitHub environment named `production` (Finance and Connect workflows declare it);
check each repository's workflow for repository-level versus environment-level placement before
pasting.

## Cloudflare tokens that existed on October 1, 2026 (from the dashboard)

| Token name | Visible scope | Probable use (inferred from name; confirm) |
| --- | --- | --- |
| `timothy-workers-builds` | broad (24+ permissions) | likely a deploy token, possibly Workers Builds |
| `timothy-d1-data` | D1, Account Settings | likely `CLOUDFLARE_D1_API_TOKEN` |
| `CLOUDFLARE_KV_API_TOKEN` | Workers KV | Connect's one-time RSVP migration |
| `CLOUDFLARE_R2_API_TOKEN` | Workers R2 | website image migration/recovery |
| `R2_RECOVERY_TOKEN` | none shown | website R2 recovery keys (S3-style) |
| `Child-care portal` | R2, KV, +2 | myMDO |
| `Github CLOUDFLARE_API_TOKEN website repo` | Agents configuration, Containers, +11 | website deploy |
| `Cloudflare Agent Token - 2026-09-30` | broad | **creator unknown**; check the Cloudflare Audit Log |

Which GitHub secret holds which Cloudflare token cannot be read from GitHub. Do not guess; the
mapping above is a lead, not a fact.

## Reuse plan (target: three purpose-named tokens)

1. **`deploy`**: Workers Scripts Edit, Zone Workers Routes Edit (the church domain), D1 Edit, Workers
   R2 Storage Edit (the Finance release creates a bucket when missing). One value serves
   `CLOUDFLARE_API_TOKEN` in Connect, Finance, website, myMDO, and app-launcher (five repositories).
2. **`d1-data`**: D1 Edit and Account Settings Read. One value serves `CLOUDFLARE_D1_API_TOKEN` in
   Connect, Finance, and website (three repositories).
3. **`r2-data`**: Workers R2 Storage Edit. One value serves `CLOUDFLARE_R2_API_TOKEN` in website. The
   KV token can be retired once the RSVP migration is confirmed done.

S3-style R2 access keys (the `R2_*` pairs) are a different credential type, created under R2, Manage
API Tokens. Keep them separate; rotate each pair together.

Adopt `deploy` and `d1-data` first (they cover the Finance release), paste into each repository as
that repository is touched, then retire the old tokens one at a time after the repository that held
it has been switched and a release or recovery run succeeded.

## Rotation map

| If this is rotated | Update it here |
| --- | --- |
| `deploy` | `CLOUDFLARE_API_TOKEN`: connect, finance, website, myMDO, app-launcher |
| `d1-data` | `CLOUDFLARE_D1_API_TOKEN`: connect, finance, website |
| `r2-data` | `CLOUDFLARE_R2_API_TOKEN`: website |
| R2 access key pair (website recovery) | `R2_RECOVERY_ACCESS_KEY_ID` and `_SECRET_ACCESS_KEY`: website |
| R2 access key pair (myMDO backups) | `R2_ACCESS_KEY_ID` and `_SECRET_ACCESS_KEY`: myMDO |
| R2 access key pair (Connect photo migration) | `R2_MIGRATION_*`: connect (retire after the migration) |

After each rotation: run one release or recovery workflow in every affected repository, then delete
the old token in Cloudflare (My Profile, API Tokens).

## Not covered here

Other apps outside these six repositories, Cloudflare Access settings, tokens stored on personal
machines, and Worker runtime secrets (see each app's secrets reference and
`digital-architecture/architecture/17-credentials-and-secrets-inventory.md`).
