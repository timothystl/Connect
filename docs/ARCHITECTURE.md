# Architecture

## Runtime boundaries

The production Worker `timothy-connect` starts at `connect-worker.js` and serves:

- Connect at `connect.timothystl.org`;
- public Serve routes at `serve.timothystl.org/*`;
- the legacy redirect at `chms.timothystl.org/*`;
- embedded Giving, legacy Finance, and Scheduler modules.

Production binds D1 `timothy-connect-db` as `DB`, KV `timothy-connect-kv` as `KV`, R2
`timothy-connect-photos` as `PHOTOS`, and a daily 14:00 UTC cron. `wrangler.toml` is the source
configuration; live attachment still outranks prose.

There is no staging copy. Connect staging (`timothy-connect-staging`, formerly `breeze-proxy-worker-staging`)
was retired and deleted in October 2026 with its D1 and KV resources.

## Finance and Connect

Finance is its own application in [timothystl/finance](https://github.com/timothystl/finance),
deployed as Worker `timothy-finance-app` over its own D1
database `timothy-finance-db`. It was split out of this repository on October 1, 2026; its
application code, Worker configurations, tests, deploy workflows, and runbooks live there. Its
current scope and cutover status are in that repository's README and docs, not here.

What stays in Connect:

- **Legacy Finance screens.** `src/api-finance.js` and `src/frontend/js-finance.js` still ship in the
  Connect Worker and are routed under `ACCESS_GATE` as `finance`. Accounting tables are reached
  through `src/finance-storage.js`: `FINANCE_STORAGE_MODE` (`connect`, `copying`, or `finance`)
  selects whether they use `DB` or the `FINANCE_DB` binding to `timothy-finance-db`. Production
  sets `finance` (`wrangler.toml`). QuickBooks belongs to
  Finance and Connect has no QuickBooks routes or credentials. The old `tlc-volunteer-db` is a
  retained pre-cutover resource, not the current source.
- **Contract producers.** Connect produces the versioned contracts Finance consumes (see "Cross-product
  contracts"). Giving stays authoritative here.
- **Tuition Aid.** `src/api-tuition-aid.js` and `src/tuition-storage.js`; `TUITION_STORAGE_MODE`
  selects where its records live (production: `finance`).

Check the live configuration before treating any Finance workflow as complete or any data location
as settled; a deployed commit does not establish data cutover, enabled writers, or user acceptance.

## Source layout

**Entry points and shared plumbing:**

| File | Purpose |
|---|---|
| `connect-worker.js` | Production Worker entry point; routes to every module below. |
| `src/api-chms.js` | The main admin API dispatcher for Connect/Giving. Holds `ACCESS_GATE` (see below) and delegates by URL segment to the handler modules listed next. |
| `src/auth.js` | Session cookie signing/verification (`vol_auth`, HMAC-SHA256), login/logout, `app_users` lookups. |
| `src/api-utils.js` | Shared helpers used across every `api-*.js` module: role/permission resolution, anonymous-Giving safety checks, misc formatting. |
| `src/db.js` | Schema initialization (`initDb()`) and `schema_fingerprint` — production schema setup is **not** fully captured by the numbered `migrations/` ledger; see `AGENTS.md`. |
| `src/access-jwt.js` | Verifies the `Cf-Access-Jwt-Assertion` header Cloudflare Access attaches to requests — used by the contract endpoints below, independently of session cookies. |

**Domain handlers** (each dispatched from `api-chms.js` by URL segment):

| File | Owns |
|---|---|
| `src/api-people.js` | People, follow-up, archive, Brevo sync, photos. |
| `src/api-households.js` | Households, organizations, tags, funds. |
| `src/api-giving.js` | Giving entries, batches, quick entry. |
| `src/api-finance.js` | The legacy Finance handlers (church/daycare/property ledgers, budgets, compensation planner) — see "Finance and Connect" above. |
| `src/api-tuition-aid.js` | Tuition Aid Planner (gated the same way as Finance). |
| `src/api-scheduler.js` | Scheduler & volunteer sign-up. |
| `src/api-reports.js` | Reports, engagement, prayer. |
| `src/api-import.js` | Import, config, register/export, Breeze sync. |
| `src/api-admin.js` | General admin API handlers. |
| `src/api-mobile.js` | Backs the phone-optimized mobile admin experience (`src/mobile-admin-html.js`). |
| `src/api-emails.js` | Birthday/anniversary emails via Resend. |
| `src/api-intake.js` | Server-to-server endpoints called **from** the `website` repo's Workers (not a browser). |
| `src/api-contracts.js` + `src/api-contracts-service.js` | Versioned cross-product contracts (see below) — the human-role-gated admin route and the shared-secret server-to-server route, respectively, for the same contracts. |

**Frontend and presentation:**

| File | Purpose |
|---|---|
| `src/html-chms.js` | The Connect/ChMS single-page app shell, service worker, and manifest. |
| `src/frontend/*.js` | Generated-in-page client modules injected into the shell (e.g. `js-finance.js`, the legacy Finance UI). Built-script validation (`.github/scripts/check-built-scripts.js`) must pass after any change here. |
| `src/mobile-admin-html.js` | The separate mobile-optimized admin page. |
| `src/scheduler-html.js` / `src/scheduler-inline.js` | The Scheduler app's full page and its inline-embed variant. |
| `src/html-templates.js` | Login and public-signup page templates. |
| `src/legal-pages.js` | Public Privacy Policy / Terms of Service pages. |

**Integrations:**

| File | Purpose |
|---|---|
| `src/breeze.js` | Breeze ChMS API client (returns `null` when unconfigured, never throws). |
| `src/daycare.js` | Client for myMDO's `finance-summary` function (see `DAYCARE_API_URL` in `SECRETS.md`). |
| `src/push-sender.js` | Web Push (VAPID/RFC 8291) sender, pure Web Crypto, no npm dependency. |
| `src/lectionary.js` | Bundled LCMS lectionary calendar data. |
| `src/giving-rollups.js` | Maintains compact Giving read-models (year/month rollups) so dashboards don't re-aggregate the raw ledger. |

Finance's own source map is in the [finance repository](https://github.com/timothystl/finance).

## Request authorization: `ACCESS_GATE`

Every admin API request in `src/api-chms.js` passes through one array of rules, `ACCESS_GATE`,
matched in order (first match wins):

```js
const ACCESS_GATE = [
  { match: (s) => s.startsWith('giving') || s.startsWith('reports/giving'), item: 'giving' },
  { match: (s) => s.startsWith('contracts/connect-giving-summary'), item: 'giving' },
  { match: (s) => s.startsWith('contracts/finance-data-status'), item: 'finance' },
  { match: (s) => s.startsWith('tuition-aid'), item: 'tuitionaid' },
  { match: (s) => s.startsWith('finance'), item: 'finance' },
  // ... attendance, followups, audit, register, reports
];
```

Each rule maps a URL segment prefix to a permission **item** (`giving`, `finance`, `tuitionaid`,
etc.). The server-side permission matrix (roles: `admin`, `finance`, `staff`, `council`, `member`,
`volunteer`, `compensation`) resolves whether the current role can view/edit that item; a
non-`GET` request additionally requires edit access. **A URL segment matching no rule reaches its
handler with no permission check at all** — when adding a new segment (especially a new
`contracts/*` route), add an `ACCESS_GATE` rule for it explicitly. This was missed once already
for `contracts/finance-data-status-v1` and caught only during review.

UI hiding is never authorization — every check that matters lives here or in the handler itself,
never only in what the frontend chooses to render.

## Cross-product contracts

Finance separation (see the architecture repo's overhaul plan) runs through small, versioned
contracts rather than either app reaching into the other's database. Every contract follows the
same shape — use it as the template for the next one:

1. **Producer** (`src/api-contracts.js`, in this repo, since Connect owns the source data): a pure
   `buildX(db, {...})` function that runs a bounded query and returns the exact contract shape,
   plus a `respondWithX(...)` wrapper that validates its own output against the shared consumer
   validator before ever returning it (fail closed — a producer bug must never reach Finance as a
   malformed contract).
2. **Two entry points to the same producer**: a human-role-gated route inside `api-chms.js` (via
   `ACCESS_GATE`, above) for admin/debugging use, and a shared-secret (`X-Contract-Key` /
   `FINANCE_CONTRACT_API_KEY`) server-to-server route in `src/api-contracts-service.js`, which is
   what Finance's Worker actually calls via a Cloudflare service binding.
3. **Consumer** (`contracts/validators/*-consumer.js`, used by Connect's producers and by Finance's clients): a pure `validateX`/`acceptX` pair with no I/O —
   closed-shape validation (`additionalProperties: false`-style exact key checks), so producer and
   consumer can never silently drift apart.
4. **Client/transport**: lives in the Finance repository (`apps/finance/*-client.js` there). It calls the
   server-to-server route through its `CONNECT_SERVICE` binding and never throws; every failure
   resolves to `{ ok: false, reason }` so the caller can show "data unavailable" rather than break.

The schemas are in `contracts/*.schema.json` with examples in `contracts/examples/`: Giving summary,
the `finance-*-v1` family (church report, balance sheet, budget, compensation, data status, daycare,
property, and so on), `person-reference-v1`, and `message-delivery-v1`/`message-delivery-result-v1`.
Some contracts also accept writes relayed from Finance (for example Giving quick entry);
authorization for each is in `src/api-contracts-service.js`.

## Target direction

The supported target has four staff products: Church Website, Connect, Finance, and myMDO.
Physical separation proceeds through narrow versioned contracts and one authoritative writer per
business fact. A separate deployment does not by itself authorize data copying, dual writing, or a
production route.
