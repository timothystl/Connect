# ADR 0002: Fail-closed security defaults in Connect

Status: accepted. Dates: 2026-08-19 to 2026-08-23. Source: former `PLAN.md` items `P22-A`, `P22-E`,
`P22-G`, `P23-A` (`git show c79214f:PLAN.md`); operational detail is in [SECRETS.md](../../SECRETS.md).

## Decisions

- **Session signing is separate from the break-glass password.** Session cookies are signed with
  `SESSION_SECRET`. `ADMIN_PASSWORD` is only the break-glass login. Without `SESSION_SECRET`, login and
  cookie verification fail closed; the code never signs with an empty key. This was a deliberate hard
  cutover (all sessions invalidated once) rather than a dual-key transition.
- **No shared role passwords.** Environment-variable passwords per role (such as a finance or staff
  password) are not a login path and must not return: they would have no account to deactivate or
  audit. Real credentials live in `app_users`, plus the break-glass password. A test fails if such a
  read reappears in the login path.
- **Safety stores fail closed.** If the KV store is unavailable, login and public intake rate limiting
  refuse rather than run unlimited. (The QuickBooks OAuth state rule was removed with QuickBooks.)
- **The member directory honors "Include in directory".** An opted-out person is hidden everywhere the
  directory renders, including the first-name disambiguation on household labels.

## Consequences

Rotating `SESSION_SECRET` is the one action that logs everyone out; rotating `ADMIN_PASSWORD` is not.
A missing KV binding shows as login unavailable instead of silently unprotected.
