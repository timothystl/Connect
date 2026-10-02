# Secrets & Environment Variables

> **Security reference — not AI startup instructions.** `AGENTS.md` is the sole current
> agent instruction file. Do not preload this document; open it only for a task that needs it,
> and verify dated claims against current code, tests, configuration, and live behavior.


Secrets are stored as Cloudflare Worker secrets (`wrangler secret put <NAME>`).
**Never commit secret values to the repo.** Plain settings (not credentials) live in `wrangler.toml`
`[vars]`; the tables at the end of this file mark which names are which.

The cross-product reference (every Worker, Supabase function, and repository secret, with the pairs
that must match) is
[architecture/17-credentials-and-secrets-inventory.md](https://github.com/timothystl/digital-architecture/blob/main/architecture/17-credentials-and-secrets-inventory.md).
This file covers Connect in detail, plus the Finance names that must match Connect's. Finance's own
secrets and settings are described in the [Finance repository](https://github.com/timothystl/finance). The Cloudflare token audit, reuse plan, and rotation
map across all repositories is [docs/CLOUDFLARE_TOKENS.md](docs/CLOUDFLARE_TOKENS.md).

---

## Required Secrets

### `ADMIN_PASSWORD`
- **Purpose**: Break-glass admin login (username `admin`) when no `app_users` row exists, or as locked-out recovery. **As of P23-A (2026-08-23) this is its only purpose** — it no longer signs session cookies (see `SESSION_SECRET` below).
- **Format**: Any strong random string (≥32 chars recommended).
- **Rotation**: `wrangler secret put ADMIN_PASSWORD`. No longer force-logs-out anyone — only the break-glass login credential changes. Update any scripts/tools that use the break-glass password.
- **Risk if leaked**: Full admin access to the app via the break-glass login (still real — rotate it if it's ever exposed), but no longer the ability to forge a session cookie for any other role. That risk moved to `SESSION_SECRET`.

### `SESSION_SECRET`
- **Purpose**: HMAC-SHA256 signing key for every `vol_auth` session cookie (all roles, `admin` down to `member`). Added by P23-A/SEC15 to separate this from `ADMIN_PASSWORD` — a human-chosen, occasionally-shared login password was also the key that, if recovered, let anyone forge a cookie for any role, including admin.
- **Format**: A high-entropy random string, unrelated to any login credential. Generate one with `openssl rand -hex 32` (or equivalent) — do not reuse a password, and do not reuse `ADMIN_PASSWORD`.
- **⚠ Required — the app fails CLOSED without it.** With no `SESSION_SECRET` set, every login attempt shows "Session signing key is not configured" and every existing cookie stops verifying — this is deliberate (see `src/auth.js`'s comment on `sessionSigningKey()`): it never falls back to signing with an empty-string key, which would be a well-known, trivially-forgeable key.
- **Rotation**: `wrangler secret put SESSION_SECRET` → every active session (every role, admin included) immediately invalidates and must re-login. This is now the ONLY rotation that does that — rotating `ADMIN_PASSWORD` no longer has this side effect. Use this to force a full-app logout (e.g. after a suspected cookie compromise) without also having to change the break-glass admin password.
- **Risk if leaked**: Ability to forge a session cookie for any role, including admin — same severity `ADMIN_PASSWORD` used to carry for this purpose, now isolated to one secret instead of two unrelated concerns sharing one value.
- **⚠ Migration note, 2026-08-23**: this secret is new. Until it is set in Cloudflare, the live app cannot authenticate anyone — a deliberate one-time, whole-app outage rather than a silent security downgrade, shipped on a day nobody was expected to be logged in. Run `wrangler secret put SESSION_SECRET` immediately after this deploy lands.

### `BREEZE_API_KEY`
- **Purpose**: Authenticates calls to the Breeze ChMS REST API (`https://<subdomain>.breezechms.com/api/`). Used for people sync, giving sync, fund import, tag sync.
- **Status (decided 2026-09-29): keep.** The church still gives through Breeze/Tithe.ly, so gifts must keep syncing into Connect. Remove only when that giving path is retired.
- **Format**: API key string from Breeze → Account Settings → API.
- **Rotation**: Generate a new key in Breeze, then `wrangler secret put BREEZE_API_KEY`. No app downtime — next sync uses the new key.
- **Risk if leaked**: Read/write access to all Breeze ChMS data (people, giving, tags).

### `BREEZE_SUBDOMAIN`
- **Purpose**: The subdomain portion of `<subdomain>.breezechms.com`. Used to construct all Breeze API URLs.
- **Format**: Plain string, e.g. `timothylc` (no protocol, no `.breezechms.com`).
- **Rotation**: Only changes if the church switches Breeze accounts. `wrangler secret put BREEZE_SUBDOMAIN`.
- **Risk if leaked**: Low on its own — just the subdomain, not the API key.

### `EMAIL_FROM` (plain variable in `wrangler.toml`, not a secret)
- **Purpose**: The `From:` address on every Resend email the Worker sends — birthday and anniversary greetings, scheduler assignments and reminders, Connect invites, password resets.
- **Format**: RFC 5322 format, e.g. `Timothy Lutheran <noreply@timothystl.org>`. Domain must be verified in Resend.
- **Change**: edit `EMAIL_FROM` under `[vars]` in `wrangler.toml`  and redeploy.
- **Risk if leaked**: Low — it's an email address, not a credential.
- **⚠ This entry used to read `ADMIN_EMAIL`, which was wrong**: nothing has ever sent mail from `ADMIN_EMAIL`. `sendResend()` reads `EMAIL_FROM` and refuses outright without it, so following the old instruction produced a Worker that sent no email at all, with the one variable that mattered undocumented. See "Variables the Worker does not read" below.

### `RESEND_API_KEY`
- **Purpose**: Authenticates calls to the Resend email API. Used for birthday and anniversary emails sent to members.
- **Format**: `re_` prefixed key from resend.com → API Keys.
- **Rotation**: Create a new key in Resend, `wrangler secret put RESEND_API_KEY`, delete old key in Resend dashboard.
- **Risk if leaked**: Ability to send email from the configured `EMAIL_FROM` address via Resend.

### `CHMS_INTAKE_API_KEY`
- **Purpose**: Shared secret for intake API endpoints (`/api/intake/connect-card`, `/api/intake/prayer`) and the Christmas Market cross-app endpoints (`GET /api/signups/christmasmarket/summary`, `POST /api/signups/christmasmarket/toggle`). The website Worker passes this key to authenticate form submissions and the market's Volunteers-tab read/write without a user session.
- **Format**: Any strong random string (≥32 chars).
- **Rotation**: `wrangler secret put CHMS_INTAKE_API_KEY`, then update the same value in the website Worker.
- **Risk if leaked**: Ability to create person records and prayer requests via the intake endpoints.

### `ADMIN_PUSH_API_KEY`
- **Purpose**: Shared secret this Worker sends as `X-Push-Key` when calling `POST https://admin.timothystl.org/api/push/notify` — the website repo's cross-app web-push relay. Lets a new volunteer sign-up or an RSVP response ring admin staff's phones without this repo building its own push infrastructure (the website repo already has one, hand-rolled RFC 8291/8292, in `admin/webpush.js` in the website repository). The reverse direction of `CHMS_INTAKE_API_KEY` above — same pattern, this repo is the caller here.
- **Format**: Any strong random string (≥32 chars); must be the exact same value as `ADMIN_PUSH_API_KEY` on the website Worker (`timothy-website-admin`).
- **Rotation**: `wrangler secret put ADMIN_PUSH_API_KEY`, then update the same value on the website Worker.
- **Risk if leaked**: Ability to push an arbitrary title/body notification to every subscribed admin device — a nuisance/social-engineering vector, not a data-access one (the relay only accepts `{title, body, tag, url}`, no way to read anything back).
- **Fails safe**: if this secret is unset (or the website Worker hasn't set its matching copy), the push call is best-effort and `.catch()`'d — a new sign-up or an RSVP response is never blocked or delayed by a missing/misconfigured key.

### `BREVO_API_KEY`
- **Purpose**: Authenticates calls to the Brevo API. Used for (1) newsletter contact sync, (2) transactional SMS (birthday/anniversary texts), and (3) giving statement/mid-year-update emails (`giving/send-statement`, pinned to Brevo rather than Resend for its higher 300/day free-tier cap).
- **Format**: `xkeysib-` prefixed key from brevo.com → SMTP & API → API Keys.
- **Rotation**: Generate a new key in Brevo, `wrangler secret put BREVO_API_KEY`, delete old key.
- **Risk if leaked**: Ability to send SMS and email campaigns, and read/write Brevo contact lists.

### `BREVO_LIST_ID`
- **Purpose**: The numeric ID of the Brevo contact list used for newsletter sync.
- **Format**: Integer string, e.g. `"3"`. Found in Brevo → Contacts → Lists → list URL.
- **Rotation**: Only changes if the newsletter list is recreated. `wrangler secret put BREVO_LIST_ID`.
- **Risk if leaked**: Low — just a list ID, not a credential.

### `WORKER_SECRET`
- **Purpose**: Shared secret for internal service-to-service calls to the scheduler backend routes. The website Worker (or any authorized service) passes this in the `X-Worker-Secret` header to authenticate without a user session cookie.
- **Format**: Any strong random string (≥32 chars).
- **Rotation**: `wrangler secret put WORKER_SECRET` on this Worker, then update the same value in any calling Workers. Brief window during rotation where calls will be rejected.
- **Risk if leaked**: Ability to call scheduler admin endpoints without a user session.

### `FINANCE_CONTRACT_API_KEY`
- **Purpose**: Shared secret for the server-to-server Finance contract endpoints (`/api/contracts/*` in `connect-worker.js` — `finance-church-report-v1`, `finance-balance-sheet-v1`, `finance-compensation-v1`, `finance-data-status-v1`, `finance-budget-v1`, `staff-role-v1`, `connect-giving-summary-v1`, `giving-quick-entry-v1`, and the rest of the `finance-*-v1` contracts in `src/api-contracts-service.js`). Finance's Worker (`timothy-finance-app`; code in the [Finance repository](https://github.com/timothystl/finance)) sends this as `X-Contract-Key` when calling into `timothy-connect` over the `CONNECT_SERVICE` binding — same shared-secret shape as `CHMS_INTAKE_API_KEY`/`ADMIN_PUSH_API_KEY` above, not a user session. Historical note: on 2026-09-16 this key was not provisioned and Finance's contract readers reported `not_configured`. Current provisioning is not recorded here; verify by name that it exists on both Workers of each pair before relying on it.
- **Must be set, with the identical value, on** `timothy-connect` (validates it as the server) and `timothy-finance-app` (sends it as the client).
- **Format**: Any strong random string (≥32 chars).
- **Rotation**: `wrangler secret put FINANCE_CONTRACT_API_KEY` on `timothy-connect`, then the identical value on `timothy-finance-app`. Brief window during rotation where Finance's live contract reads will fail closed to synthetic/"data unavailable" rather than being rejected insecurely.
- **Risk if leaked**: Ability to call Finance's read contract endpoints on `timothy-connect` (church report, balance sheet, compensation roster, data status, budget, staff role, Giving summary) and to relay a `giving-quick-entry-v1` write, without a user session. No credential or payment data is directly returned by these contracts, but compensation and Giving data are sensitive — see the access notes in the [Finance repository](https://github.com/timothystl/finance).

### `FINANCE_PAYROLL_CONTRACT_KEY`
- **Purpose**: Shared secret for Finance's payroll relay. Finance's `apps/finance/payroll-proxy-client.js` (in the [Finance repository](https://github.com/timothystl/finance), plus the payroll email and ready-notification clients) sends it as `X-Contract-Key` over the `PAYROLL_SERVICE` binding to Website's `timothy-website-admin` Worker, which checks it in `admin/payroll-contract-auth.js` (in the website repository) before relaying to the myMDO payroll RPCs. It is not used by Connect or myMDO. Website's own `PAYROLL_PROXY_SECRET` (Website → myMDO Supabase) is a separate secret and is not affected by this one.
- **Must be set, with the identical value, on** `timothy-finance-app` and `timothy-website-admin`.  If it is missing on Finance, Run payroll reports `Church staff could not be read: not_configured` and MDO as unavailable.
- **Access audience**: Website also verifies the forwarded Access JWT. Its `FINANCE_ACCESS_AUD` in Website's `wrangler.toml` must list the production Finance Access AUD.
- **Check**: `https://finance.timothystl.org/api/v1/payroll-relay-diagnostic` (read-only) returns `ok: true` with a `staffCount` when the relay works.
- **Rotation**: set the new value on both Workers back to back; payroll pages fail closed in between.
- **Risk if leaked**: combined with a valid Access login for an active Website user holding `payroll_manage`, relayed payroll reads/writes. The key alone is not enough.

---

## Optional Secrets

These are not required for the app to function but unlock additional capabilities.

### `GOOGLE_ADDRESS_API_KEY`
- **Purpose**: Google Address Validation API — first choice for address validation (used for both the single-person "Verify Address" button and bulk validation). No meaningful rate limit at church scale. Falls back to the free Census Bureau geocoder if absent (a Census result confirms a street match but not deliverability). USPS and Lob were retired 2026-09-29; this key is now the only paid/keyed address check, so confirm it is set.
- **Provision**: Google Cloud Console → create/select a project → enable billing → enable the "Address Validation API" → Credentials → Create API Key → restrict the key to the Address Validation API only. Free tier: 10,000 calls/month.
- **Set**: `wrangler secret put GOOGLE_ADDRESS_API_KEY`.
- **Risk if leaked**: Free-tier quota abuse; restrict the key server-side (API restriction) to limit blast radius.

### `GOOGLE_MAPS_API_KEY`
- **Purpose**: Google **Maps Static API** — powers the embedded map image on the Person Profile and Household View ("Show Map"). This is a **different Google product** than Address Validation, so it needs its own enablement/restriction. If absent, the code falls back to `GOOGLE_ADDRESS_API_KEY`, but a key restricted to Address Validation (as those provisioning steps instruct) will be **rejected** by the Static Maps API with a 403 — showing "Map unavailable" in the UI.
- **Provision**: Google Cloud Console → same or new project → enable billing → enable **"Maps Static API"** → Credentials → Create API Key → under API restrictions, allow **Maps Static API** (a server-side key; leave application/referrer restrictions off since the Worker calls it server-to-server).
- **Set**: `wrangler secret put GOOGLE_MAPS_API_KEY`.
- **Risk if leaked**: Free-tier/quota abuse; restrict the key to the Maps Static API only.

### USPS and Lob (retired 2026-09-29)
- `USPS_CLIENT_ID`, `USPS_CLIENT_SECRET`, `USPS_USER_ID`, and `LOB_API_KEY` are no longer read.
  USPS Web Tools shut down in January 2026, the USPS OAuth API caps at 60 requests/hour, and Lob was
  an unused fallback. If any are still set on `timothy-connect`, delete them
  (`wrangler secret delete <NAME>`). Address validation is Google, then the Census geocoder.

### `REPLY_TO_EMAIL` (plain variable in `wrangler.toml`, not a secret)
- **Purpose**: Overrides the `office@timothystl.org` default used in Resend `reply_to` for scheduler and ChMS emails.
- **Change**: edit `REPLY_TO_EMAIL` under `[vars]` in `wrangler.toml` and redeploy.

### `ESV_API_KEY`
- **Purpose**: Lets the Scheduler send the **full ESV text** of each reading — either as an attached PDF sheet (the default, and what keeps the email short) or inline in the body. Entirely optional — with no key the readings are still named and linked to esv.org, which needs no setup at all. The mode is chosen per send on the Email Assignments panel. Read server-side only, via `/esv/passage` (`src/api-scheduler.js`); the key never reaches a browser, and it could not be used from one anyway (the embedded scheduler runs under CSP `connect-src 'self'`).
- **Provision**: https://api.esv.org → create an API key. Free for non-commercial personal, church and ministry use.
- **Set**: `wrangler secret put ESV_API_KEY`.
- **Licensing, per Crossway's own API terms** (worth reading before turning this on): the text **may** be redistributed by email; up to 500 verses per query and no more than half a book; 5,000 queries/day, 1,000/hour, 60/minute. Attribution is three separate duties, all of which this app satisfies deliberately — "(ESV)" with each quotation (requested via `include-short-copyright`), the full Crossway notice (printed once per email by `ESV_COPYRIGHT_NOTICE`), and a link to www.esv.org (every reading reference is one). **Nothing is cached**: Crossway does not document a caching allowance, and a church's send volume sits far under the daily limit, so their text is never stored on our side.

### `QB_CLIENT_ID`, `QB_CLIENT_SECRET`, `QB_ENVIRONMENT` (retired from Connect)
- QuickBooks moved to Finance on 2026-09-25 and the cutover was confirmed 2026-09-28; Connect's QuickBooks routes and credentials were then removed. Connect no longer reads these secrets, and Andrew deleted them from `timothy-connect` the same day. Do not add them back.
- Finance's Worker (`timothy-finance-app`) holds the same Intuit app credentials as `FINANCE_QB_CLIENT_ID` / `FINANCE_QB_CLIENT_SECRET`, and its redirect URI is `https://finance.timothystl.org/api/v1/qb/callback`. See `docs/QUICKBOOKS_FINANCE_CUTOVER.md` in the [Finance repository](https://github.com/timothystl/finance/blob/main/docs/QUICKBOOKS_FINANCE_CUTOVER.md).

### `DAYCARE_API_URL` + `DAYCARE_API_KEY`
- **Purpose**: Pulls budget/actual line items from the daycare app's own finance API into the Finance tab (`POST /admin/api/finance/daycare/sync`). Optional — the Finance tab's daycare section works with hand-entered rows regardless of whether this is configured.
- **`DAYCARE_API_URL` is the COMPLETE endpoint URL**, not a base domain — the daycare app's actual implementation is a Supabase Edge Function at its own specific path, e.g. `https://<project-ref>.supabase.co/functions/v1/finance-summary`. `src/daycare.js` fetches this URL directly with no path appended.
- **Live contract** (as actually implemented by the daycare app, 2026-07-16): `GET {DAYCARE_API_URL}`, header `X-Api-Key: <DAYCARE_API_KEY>` (the daycare app calls this same value `FINANCE_API_KEY` on its own side — same secret, different name), returning:
  ```json
  {
    "updated_at": "2026-07-16T14:32:00Z",
    "accounts": [],
    "budget": [
      { "period": "2026-07", "category": "Tuition Income", "type": "actual", "amount_cents": 8850000 },
      { "period": "2026-07", "category": "Tuition Income", "type": "budget", "amount_cents": 9000000 }
    ]
  }
  ```
  `period` is `YYYY-MM`, covering the current month + 12 prior (13 months). `type` is exactly `"actual"` or `"budget"`. All money in integer **cents**, not dollars. Return 401 for a missing/wrong key.
  - `accounts` is always `[]` — the daycare app has no bank/checking balance data; that stays manual-entry only.
  - Categories: Tuition Income, Payroll, Payroll Taxes, Workers Comp, Other Payroll Expenses, Other Expenses. Tuition Income/Payroll actuals are computed live from real billing/payroll data; everything else (all budget figures, and actuals for the last four categories) is an annual figure divided by 12, since the daycare app has no monthly-granular budget.
  - **Known limitation**: Payroll actual can't account for staff who left mid-window (no termination date tracked on the daycare side), so it may run slightly high for months after someone departs.
- **Set**: `wrangler secret put DAYCARE_API_URL` (the full Supabase function URL above) then `wrangler secret put DAYCARE_API_KEY` (same value as the daycare app's `FINANCE_API_KEY`).
- **Risk if leaked**: Read-only access to the daycare app's financial summary endpoint (as scoped by whatever the daycare app itself enforces on that key).
- **Moving to Finance (Andrew, 2026-09-29)**: the myMDO syncs belong to Finance. On `timothy-finance-app` these are named `MYMDO_API_URL` (the `finance-summary` function URL) and `MYMDO_API_KEY` (the same value as myMDO's `FINANCE_API_KEY`), plus `MYMDO_ROOMS_API_URL` if myMDO ever builds the rooms endpoint (the `DAYCARE_*` names are also accepted); Finance then runs both syncs itself (`apps/finance/accounting/write-contracts.js` and `apps/finance/accounting/workspace.js` in the Finance repository check for them) and stops asking Connect. Once a sync has succeeded from Finance, delete the three from `timothy-connect`.

---

## Other names Connect and Finance read (previously undocumented)

### Connect Worker
| Name | Kind | Purpose |
|---|---|---|
| `DAYCARE_ROOMS_API_URL` | secret | Second myMDO endpoint (rooms), used with `DAYCARE_API_KEY`. |
| `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY` | secret / public | Web-push signing keys for member-portal push (the daily cron also uses them). Must be a matching pair. |
| `VAPID_CONTACT` | secret or var | The `sub:` contact on the push signature; defaults to an info@ address. |
| `STAX_SANDBOX_API_KEY`, `STAX_SANDBOX_WEB_PAYMENTS_TOKEN`, `STAX_GIVING_WEBHOOK_SECRET` | secret | Stax giving **sandbox**: server key, browser tokenization token, webhook check. |
| `STAX_LIVE` | var | `"1"` leaves sandbox mode. Leave unset until live giving is approved. Production also sets `STAX_SANDBOX_REFUSED = "1"`, so it ignores sandbox gifts. |
| `CONNECT_ACCESS_TEAM_DOMAIN`, `CONNECT_ACCESS_AUD` | var or secret | Cloudflare Access identity for the shared staff sign-in. Not in `wrangler.toml`; if missing, that route answers 503 and normal login still works. |
| `FINANCE_ACCESS_TEAM_DOMAIN`, `FINANCE_ACCESS_AUD` | var | Verify the Access token Finance forwards on contract calls . |
| `FINANCE_STORAGE_MODE`, `TUITION_STORAGE_MODE` | var | `connect`, `copying`, or `finance`: where Finance-owned and Tuition Aid tables live. Production is `finance`. Staging sets neither, so it runs in `connect` mode. |
| `FINANCE_DB` | D1 binding | `timothy-finance-db` (production only). |

### Finance Worker (`timothy-finance-app`)
| Name | Kind | Purpose |
|---|---|---|
| `FINANCE_DB` | D1 binding | Finance's own database. |
| `FACILITY_FILES` | R2 binding | Private Facilities photos and documents. |
| `CONNECT_SERVICE` | service binding | Calls to `timothy-connect` . |
| `PAYROLL_SERVICE` | service binding | Payroll and gym-income relay to `timothy-website-admin`. |
| `ENVIRONMENT`, `RELEASE_SHA` | var | Environment label and release id (`RELEASE_SHA` is set at deploy). |
| `FINANCE_ACCESS_TEAM_DOMAIN`, `FINANCE_ACCESS_AUD` | var | Verify the Cloudflare Access identity of the signed-in staff member. |
| `FINANCE_QB_ENABLED`, `FINANCE_QB_ENVIRONMENT` | var | QuickBooks on/off and `production`/`sandbox`. |
| `FINANCE_QB_CLIENT_ID`, `FINANCE_QB_CLIENT_SECRET` | secret | Intuit OAuth client (see the retired-QuickBooks note above). |
| `FINANCE_LOCAL_CONTRACT_READS` | var | `"1"`: reports read Finance's database directly instead of through Connect. |
| `COMPENSATION_PLAN_WRITE_ENABLED`, `PROPERTY_LEDGER_WRITES_ENABLED`, `FINANCE_CSV_IMPORT_WRITES_ENABLED`, `FINANCE_XLSX_IMPORT_WRITES_ENABLED` | flag (set in no config file) | Each enables one writer. Default off; turning one on is a deliberate act. |
| `FINANCE_CONTRACT_API_KEY`, `FINANCE_PAYROLL_CONTRACT_KEY` | secret | Described above. `FINANCE_PAYROLL_CONTRACT_KEY` is also used for gym income. |

---

## Variables the Worker does not read

Four names that look like live credentials in an older read of this file, or in a Cloudflare
secret list, and are not. `handleAdminLogin` used to pull all four out of `env` and never
reference them again; they were deleted in v1.196.0 (P22-G/SEC22).

| Name | Reality |
|---|---|
| `FINANCE_PASSWORD` | **Never a login.** No env-var role password has ever existed. |
| `STAFF_PASSWORD` | Same. |
| `MEMBER_PASSWORD` | Same. |
| `ADMIN_EMAIL` | Never the `From:` address, despite what this file said until v1.196.0 — that is `EMAIL_FROM`. |

**⚠ The three `*_PASSWORD` names matter more than the dead code did.** Anyone reading them in a
secret list would reasonably conclude the app has per-role shared passwords, and would treat
rotating them as a security control. It is not one: every real credential lives in `app_users`,
plus `ADMIN_PASSWORD` for break-glass. A shared role password is deliberately not a thing here —
it would be an authentication path with no account behind it, so nothing to deactivate, nothing
to audit, and no way to tell afterwards whose login it was.

If any of these four are set on the live Worker, they can be deleted
(`wrangler secret delete <NAME>`) — nothing reads them. Deleting them is optional; leaving them
is only a documentation hazard, not an access one.

`test/admin-login-credentials.test.js` fails if a role-password env read reappears in the
login path.

---

## Bindings (not secrets — configured in `wrangler.toml`)

| Binding | Type | Resource | Purpose |
|---------|------|----------|---------|
| `DB` | D1 | `timothy-connect-db` | Primary database |
| `KV` | KV | `timothy-connect-kv` (renamed from `RSVP_STORE`) | Rate limiting + dedup store |
| `PHOTOS` | R2 | `timothy-connect-photos` | Member and household photos |
| `FINANCE_DB` | D1 | `timothy-finance-db` | Finance-owned accounting and Tuition Aid records (production only) |

These are wired by resource ID, not by secret — they survive a Worker rename (IN1).

---

## Adding a New Secret

```bash
wrangler secret put SECRET_NAME
# prompts for value — never pass on the command line
```

To list currently set secrets:
```bash
wrangler secret list
```

To delete a rotated/obsolete secret:
```bash
wrangler secret delete OLD_SECRET_NAME
```
