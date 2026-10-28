# Volunteer contact access

The Serve contact endpoints (`GET /admin/api/signups`, `GET /admin/api/export.csv`,
and `GET /admin/api/events/:id/roster`) require an authenticated account.

- Administrators and staff retain access across events, matching existing Serve
  management and duplicate-signup permissions.
- Named Volunteer accounts can read rosters only for events assigned in
  `serve_event_coordinators`. Unassigned event rosters return 403.
- Signup lists and CSV exports automatically restrict Volunteer accounts to assigned
  events, including when filters are omitted. An unassigned coordinator receives an
  empty list or header-only CSV. `ministry` and `event_id` filters narrow that scope.
- Members, finance, council, compensation, unknown roles, and Volunteer sessions
  without an account identity cannot read these contacts (403). Missing authentication
  returns 401. No broader contact grant is inferred from unrelated role permissions.

Legacy signup rows without an event ID can qualify through their shift assignments.
Rows with shifts outside the coordinator's assigned events (or dangling shifts) are
withheld from lists/exports, because stored notes and role labels cannot be safely
split by event. Off-event ministry-interest signups remain admin/staff-only.
Rosters expose only contact fields for people on the requested event's shifts.

Public registration, signed self-service links, member contracts, and other routes
are unchanged. These restrictions do not constitute an audit of every contact-bearing
endpoint in Connect. Tests use synthetic records and signed local test sessions.

## Past volunteers

`/admin/api/events/:id/past-volunteers` (list, `import`, `invite`, delete) uses the same
event-management check as shift editing: admin/staff on every event, a Volunteer account only on
events assigned to it. An import links a row to People only on an unambiguous email or phone match
with an active person, and adds that person to the `<event name> volunteer` tag; it never creates
People records and never matches on name alone. The list response says whether a row is in Connect
but returns no People fields. The how-to for coordinators is public at `/coordinator-guide`
(`src/coordinator-guide.js`).
