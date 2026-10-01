# Open work

Unfinished Connect work carried forward from the retired `PLAN.md` and `NOTES.md` plan and diary files
(`PLAN.md` and `MOBILE_SCOPE.md` are removed from the active tree; `NOTES.md` stays, marked retired, until a person confirms nothing in it is still needed). Updated October 1, 2026.

Rules for this file:

- Each item names its source. "PLAN.md" means the file as of commit `c79214f`
  (`git show c79214f:PLAN.md`). Codes such as `P28-B` or `SEC9` were the old plan's item codes; the
  original evidence for CR10-era codes was in the former `CLAUDE.md`, recoverable from Git history.
- "Checked" means confirmed against the code on October 1, 2026. "Not re-verified" means the item is
  carried over as written and may already be done or obsolete; confirm before starting.
- This is a short list, not a tracker. Move an item to a GitHub issue when someone commits to it, and
  delete it here when it ships.

## Security and sign-in

| Item | Source | Status |
|---|---|---|
| Multi-factor sign-in for `admin` and `finance`: authenticator setup, verification at login, recovery codes, and which roles must use it. | PLAN.md `P23-B` (SEC9) | Open. Checked: no authenticator code in Connect. CAPTCHA (SEC10) was closed as deferred. |
| Invite member accounts at scale. The invite flow exists but nobody had been invited, so the member directory had an audience of one. Organizational, not technical; it makes the member-tier security work matter. | PLAN.md `P28-N` (TLY1) | Not re-verified. |
| Hide the controls the read-only `volunteer` role cannot use, instead of letting them 403 on click. Only if the role becomes permanent. | NOTES.md v1.198.0 | Not re-verified. |

## Load speed

| Item | Source | Status |
|---|---|---|
| The app shell is about 194 KB of tab markup served `no-store`. Shrinking it means fetching each heavier tab's markup lazily, which changes how `showTab()` assumes every panel exists at boot. Needs its own session and an audit of the `getElementById` calls. The `defer` and closing-tag parts shipped. | PLAN.md `P25-F` (LOAD3, CR1b, CR9a) | Not re-verified. |
| Phone-first layouts beyond Dashboard and People (Attendance entry, Giving quick entry, Prayer/follow-ups) and a real-device check of the earlier phone fixes. Depends on who actually uses Connect on phones. | MOBILE_SCOPE.md Phase C (file removed; `git show c79214f:MOBILE_SCOPE.md`) | Not re-verified. Its Phase A and B (input font size, table overflow, breakpoints, service worker) shipped as MOB1 to MOB4. |

## Observability

| Item | Source | Status |
|---|---|---|
| Per-request query budgets exist only for the Giving yearly rebuild. Measure real query counts for the heavier legacy Finance report routes and Import bulk writes before adding budgets there. | NOTES.md v1.242.0 | Not re-verified. |
| The slow-request and query-count log thresholds (500 ms, 15 queries, and the daily-job values) were first guesses. Revisit once real Cloudflare Logs data exists. | NOTES.md v1.241.0 | Not re-verified. |

## Design system

The church-app design system adopted for Connect is in [ADR 0001](adr/0001-open-sky-design-system.md).

| Item | Source | Status |
|---|---|---|
| Cross-app design system work: surface inventory, pattern audit, shared tokens, church and childcare visual systems, canonical components, reference screens, anti-drift checks for agent edits, staged adoption (DS1 to DS9). Largely overtaken by Open Sky for Connect; childcare has its own design system in the myMDO repository. | PLAN.md "Cross-app design-system workstream" | Open for anything outside Connect. |
| Old-look areas after Open Sky: Attendance, Volunteers, Scheduler embed internals, legacy Finance screens, printed letters and certificates. | PLAN.md `OS4` | Not re-verified. |
| Finish moving hard-coded colors, legacy color names, the five overlapping palettes, and about 3,900 layout-only inline styles onto the Open Sky tokens. | PLAN.md `P26-B`, `P26-C`, `P26-D`, `P26-E` | Not re-verified. |
| Accessibility pass: about 128 click handlers on non-interactive elements, few `tabindex` and `role` attributes, few `aria-label`s, images without `alt`. The counts are from August 2026. | PLAN.md `P26-F` (DSN7, MO5) | Not re-verified. |

## Features and integrations

| Item | Source | Status |
|---|---|---|
| Gift entry workflow improvements. Needs a scoping session. | PLAN.md `P28-A` (G3) | Open. |
| Person merge: move giving, tags, and household membership to one record, then delete the duplicate, with a confirmation screen showing the differences. | PLAN.md `P28-B` (PM1) | Not re-verified. Checked: no person-merge handler in `src/api-people.js`. |
| Mobile "My Schedule" for volunteers. Blocked: there is no per-volunteer login, so nothing can answer "which person is me". Needs an identity decision first. | PLAN.md `P28-F` (SC4) | Open (blocked). |
| Native Scheduler rewrite, remaining surfaces (Focus Week, generate/auto-fill, reminders and calendar files, Breeze import). Each is its own decision. | PLAN.md `P28-G` (SC6) | Open. |
| Weekly digest to ministry leaders. The setting `notify_weekly_digest` saves, but nothing sends it; ministry-leader contacts do not exist. | PLAN.md `P28-H` (VUX-DEFER1) | Checked: setting stored, no sender. |
| Automated reminder before a volunteer's first Sunday. `sms_reminder_opt_in` is stored and shown, but nothing sends. | PLAN.md `P28-I` (VUX-DEFER2) | Checked: field stored, no sender in this repository. |
| Confirm the live myMDO endpoint feeds the Finance daycare sync. The syncs are moving to Finance (see `SECRETS.md`, `DAYCARE_API_URL`). | PLAN.md `P28-K` (FIN3) | Not re-verified; now Finance-side. |
| Set `CHMS_INTAKE_API_KEY` on the website admin Worker with the same value as Connect, so the Christmas Market summary stops answering 401. Verify by name on both Workers. | PLAN.md `P28-L` (G24); `SECRETS.md` | Not re-verified. |
| Point the `/volunteer` short-link redirect at `serve.timothystl.org`. This is data in the website repository. | PLAN.md `P28-M` (BRND3) | Not re-verified; belongs to website. |
| Match QuickBooks bank deposits to `giving_deposits` to fill the bank amount and fee line. QuickBooks now belongs to Finance, so this is a Finance decision with a Connect contract. | PLAN.md `P28-J` (QB1) | Moved to Finance; Connect has no QuickBooks code. |
| Pledge-versus-actual view across the congregation (the person-level pledge card shipped). Needs a decision on which year and population. | PLAN.md `P28-C` note | Not re-verified. |
| Record which Tithe.ly link-open mode the successful session-persistence test used. Matters only if it regresses. | PLAN.md `P28-O` (TLY2) | Not re-verified. |

## Housekeeping

| Item | Source | Status |
|---|---|---|
| `npm audit` was clean on 2026-08-23 and drifts back; run it periodically. | PLAN.md `P27-C` | Recurring. |
| `wrangler.toml` still sets `migrations_dir = "apps/finance/migrations"` for the `FINANCE_DB` binding and code comments mention `apps/finance/`; those paths left with the Finance split. Configuration was out of scope for the documentation cleanup. | This cleanup | Checked. Decide whether the binding should keep a migrations directory. |
