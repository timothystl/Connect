import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { handleAdminApi } from '../src/api-admin.js';
import { authCookieHeader } from '../src/auth.js';
import { fillReminder, reminderShiftLine } from '../src/api-scheduler.js';

// Event coordinators: a Volunteer-role login an administrator puts in charge of ONE Serve
// event. On that event it can edit the event and its shifts, change sign-up statuses and
// email everyone signed up; on every other event contact reads are denied, and it can never
// create/delete events or assign coordinators.

const SECRET = 'test-signing-secret';

function makeDb() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(`CREATE TABLE app_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL DEFAULT '',
    display_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'staff',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT
  )`);
  sqlite.exec(`CREATE TABLE chms_config (key TEXT PRIMARY KEY, value TEXT)`);
  sqlite.exec(`CREATE TABLE serve_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    event_date TEXT NOT NULL DEFAULT '',
    hidden INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    use_time_slots INTEGER NOT NULL DEFAULT 1,
    slug TEXT
  )`);
  sqlite.exec(`CREATE TABLE serve_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    slots INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    role_date TEXT NOT NULL DEFAULT '',
    start_time TEXT NOT NULL DEFAULT '',
    end_time TEXT NOT NULL DEFAULT '',
    lead TEXT NOT NULL DEFAULT ''
  )`);
  sqlite.exec(`CREATE TABLE signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER, role_id INTEGER, ministry TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL, email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '',
    roles TEXT NOT NULL DEFAULT '[]', service TEXT NOT NULL DEFAULT '', sundays TEXT NOT NULL DEFAULT '[]',
    shirt_wanted INTEGER NOT NULL DEFAULT 0, shirt_size TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')), person_id INTEGER DEFAULT NULL,
    contacted_at TEXT NOT NULL DEFAULT '', contact_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new', sms_reminder_opt_in INTEGER NOT NULL DEFAULT 0
  )`);
  sqlite.exec(`CREATE TABLE serve_event_coordinators (event_id INTEGER NOT NULL, username TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (event_id, username))`);
  sqlite.exec(`CREATE TABLE audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT, object_type TEXT, object_id TEXT, object_json TEXT)`);
  sqlite.exec(`CREATE TABLE signup_slots (id INTEGER PRIMARY KEY AUTOINCREMENT, signup_id INTEGER NOT NULL, role_id INTEGER NOT NULL)`);
  sqlite.exec(`CREATE TABLE ministry_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT, ministry TEXT NOT NULL DEFAULT '', name TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '', commitment TEXT NOT NULL DEFAULT '', training TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  sqlite.exec(`CREATE TABLE volunteer_email_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT '', ministry TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  const db = {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() { const r = sqlite.prepare(sql).run(...args); return { meta: { last_row_id: Number(r.lastInsertRowid) } }; },
            async first() { return sqlite.prepare(sql).get(...args) ?? null; },
            async all() { return { results: sqlite.prepare(sql).all(...args) }; },
          };
        },
        async first() { return sqlite.prepare(sql).get() ?? null; },
        async all() { return { results: sqlite.prepare(sql).all() }; },
        async run() { sqlite.prepare(sql).run(); return { meta: {} }; },
      };
    },
    batch(stmts) { return Promise.all(stmts.map(s => s.run())); },
  };
  return { db, sqlite };
}

let db, sqlite, env, realFetch, sent;
beforeEach(() => {
  ({ db, sqlite } = makeDb());
  env = { DB: db, ADMIN_PASSWORD: SECRET, SESSION_SECRET: SECRET, RESEND_API_KEY: 'k', EMAIL_FROM: 'Connect <noreply@example.org>' };
  sqlite.exec(`INSERT INTO app_users (username, role, email, display_name) VALUES ('marla', 'volunteer', 'marla@example.com', 'Marla'), ('other', 'volunteer', '', 'Other'), ('sam', 'staff', '', 'Sam')`);
  sqlite.exec(`INSERT INTO serve_events (name) VALUES ('Christmas Market'), ('Food Pantry')`);
  sqlite.exec(`INSERT INTO serve_roles (event_id, name, slots, role_date, start_time, end_time) VALUES
    (1, 'Set up tents', 18, '2026-12-04', '9:00 AM', '11:00 AM'),
    (1, 'Move Glasses', 2, '2026-12-04', '11:00 AM', '12:00 PM'),
    (2, 'Sort cans', 4, '', '', '')`);
  sqlite.exec(`INSERT INTO signups (event_id, name, email, ministry) VALUES
    (1, 'Jane Tester', 'jane@example.com', 'events'),
    (1, 'Bob Declined', 'bob@example.com', 'events'),
    (2, 'Pat Pantry', 'pat@example.com', 'events')`);
  sqlite.exec(`UPDATE signups SET status='declined' WHERE name='Bob Declined'`);
  sqlite.exec(`INSERT INTO signup_slots (signup_id, role_id) VALUES (1, 1), (1, 2), (2, 1), (3, 3)`);
  sqlite.exec(`INSERT INTO serve_event_coordinators (event_id, username) VALUES (1, 'marla')`);
  realFetch = globalThis.fetch;
  sent = [];
  globalThis.fetch = vi.fn(async (url, init) => {
    sent.push({ url: String(url), body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ data: [] }), { status: 200 });
  });
});
afterEach(() => { globalThis.fetch = realFetch; });

async function call(role, username, path, method, body) {
  const cookie = role ? (await authCookieHeader(env, role, username)).split(';')[0] : '';
  const url = new URL('https://connect.timothystl.org/admin/api/' + path);
  const req = new Request(url, { method, headers: { cookie, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const res = await handleAdminApi(req, env, url, method);
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: res.status, body: json, text };
}
const marla = (path, method, body) => call('volunteer', 'marla', path, method, body);

describe('a coordinator runs their own event', () => {
  it('sees can_edit on their event only', async () => {
    const r = await marla('events', 'GET');
    expect(r.status).toBe(200);
    const byName = Object.fromEntries(r.body.events.map((e) => [e.name, e.can_edit]));
    expect(byName).toEqual({ 'Christmas Market': true, 'Food Pantry': false });
  });

  it('can add, edit and delete shifts on it', async () => {
    const add = await marla('events/1/roles', 'POST', { name: 'Kitchen', slots: 3 });
    expect(add.status).toBe(200);
    const put = await marla('events/1/roles/1', 'PUT', { name: 'Set up tents', slots: 20 });
    expect(put.status).toBe(200);
    expect(sqlite.prepare('SELECT slots FROM serve_roles WHERE id=1').get().slots).toBe(20);
    expect((await marla(`events/1/roles/${add.body.id}`, 'DELETE')).status).toBe(200);
  });

  it('can edit the event and change a sign-up status', async () => {
    expect((await marla('events/1', 'PUT', { name: 'Christmas Market', hidden: 1 })).status).toBe(200);
    expect(sqlite.prepare('SELECT hidden FROM serve_events WHERE id=1').get().hidden).toBe(1);
    expect((await marla('signups/1/status', 'PUT', { status: 'confirmed' })).status).toBe(200);
  });

  it('is refused on any other event', async () => {
    expect((await marla('events/2/roles', 'POST', { name: 'x' })).status).toBe(403);
    expect((await marla('events/2', 'PUT', { name: 'Hijacked' })).status).toBe(403);
    expect((await marla('signups/3/status', 'PUT', { status: 'confirmed' })).status).toBe(403);
    expect((await marla('events/2/remind', 'POST', { dry_run: true })).status).toBe(403);
    // A shift from another event cannot be reached through their own event's address.
    expect((await marla('events/1/roles/3', 'PUT', { name: 'Hijacked', slots: 1 })).status).toBe(404);
    expect(sqlite.prepare('SELECT name FROM serve_roles WHERE id=3').get().name).toBe('Sort cans');
  });

  it('cannot create or delete events, or assign coordinators', async () => {
    expect((await marla('events', 'POST', { name: 'New' })).status).toBe(403);
    expect((await marla('events/1', 'DELETE')).status).toBe(403);
    expect((await marla('events/1/coordinators', 'PUT', { usernames: ['other'] })).status).toBe(403);
  });

  it('an unassigned Volunteer login stays read-only', async () => {
    expect((await call('volunteer', 'other', 'events/1/roles', 'POST', { name: 'x' })).status).toBe(403);
  });
});

describe('emailing the people signed up', () => {
  it('previews the recipients without sending', async () => {
    const r = await marla('events/1/remind', 'POST', { dry_run: true });
    expect(r.body).toMatchObject({ ok: true, count: 1, names: ['Jane Tester'] });
    expect(sent).toHaveLength(0);
  });

  it('sends one personalised email per person, skipping declined sign-ups', async () => {
    const r = await marla('events/1/remind', 'POST', { subject: 'Reminder: {name}', body: 'Hi {name},\n{shifts}' });
    expect(r.body).toMatchObject({ ok: true, sent: 1, failed: 0 });
    expect(sent).toHaveLength(1);
    expect(sent[0].url).toBe('https://api.resend.com/emails/batch');
    const [msg] = sent[0].body;
    expect(msg.to).toBe('jane@example.com');
    expect(msg.reply_to).toBe('marla@example.com');
    expect(msg.subject).toBe('Reminder: Jane');
    expect(msg.text).toContain('Friday, December 4 · Set up tents · 9:00 AM–11:00 AM');
    expect(msg.text).toContain('Move Glasses');
    expect(sqlite.prepare('SELECT contact_count FROM signups WHERE id=1').get().contact_count).toBe(1);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action='volunteer_event_reminder_sent'").get().n).toBe(1);
  });

  it('can be limited to one shift', async () => {
    const r = await marla('events/1/remind', 'POST', { dry_run: true, role_id: 2 });
    expect(r.body.count).toBe(1);
    const bad = await marla('events/1/remind', 'POST', { dry_run: true, role_id: 3 });
    expect(bad.status).toBe(400);
  });

  it('reports a provider failure instead of claiming success', async () => {
    globalThis.fetch = vi.fn(async () => new Response('nope', { status: 500 }));
    const r = await marla('events/1/remind', 'POST', { subject: 's', body: 'b' });
    expect(r.status).toBe(502);
    expect(sqlite.prepare('SELECT contact_count FROM signups WHERE id=1').get().contact_count).toBe(0);
  });

  it('fills placeholders and formats shift lines', () => {
    expect(reminderShiftLine({ name: 'Kitchen', role_date: '2026-12-05', start_time: '8:00 AM', end_time: '10:00 AM' }))
      .toBe('Saturday, December 5 · Kitchen · 8:00 AM–10:00 AM');
    expect(fillReminder('Hi {name}: {shifts}', { name: 'Ann Lee', shifts: ['A'] })).toBe('Hi Ann:   • A');
  });
});

describe('assigning coordinators', () => {
  it('admin can list and replace them, Volunteer-role accounts only', async () => {
    const g = await call('admin', '', 'events/1/coordinators', 'GET');
    expect(g.body.assigned).toEqual(['marla']);
    expect(g.body.candidates.map((c) => c.username)).toEqual(['marla', 'other']);
    expect((await call('admin', '', 'events/1/coordinators', 'PUT', { usernames: ['sam'] })).status).toBe(400);
    const p = await call('admin', '', 'events/1/coordinators', 'PUT', { usernames: ['Other'] });
    expect(p.body).toEqual({ ok: true, assigned: ['other'] });
    expect((await marla('events/1/roles', 'POST', { name: 'x' })).status).toBe(403);
  });

  it('staff cannot assign', async () => {
    expect((await call('staff', '', 'events/1/coordinators', 'GET')).status).toBe(403);
  });
});


describe('volunteer contact read authorization', () => {
  const routes = ['signups', 'signups?ministry=events&event_id=1', 'export.csv', 'export.csv?event_id=1', 'events/1/roster'];
  it.each(routes)('requires authentication for %s', async (path) => {
    expect((await call(null, '', path, 'GET')).status).toBe(401);
  });
  it.each(['member', 'finance', 'council', 'compensation', 'unknown'])('denies the %s role', async (role) => {
    for (const path of routes) expect((await call(role, '', path, 'GET')).status).toBe(403);
  });
  it('limits rosters to assigned events and rejects anonymous Volunteer sessions', async () => {
    expect((await marla('events/1/roster', 'GET')).body.roster[0].volunteers.map(v => v.email))
      .toEqual(['bob@example.com', 'jane@example.com']);
    expect((await marla('events/2/roster', 'GET')).status).toBe(403);
    expect((await call('volunteer', 'other', 'events/1/roster', 'GET')).status).toBe(403);
    for (const path of routes) expect((await call('volunteer', '', path, 'GET')).status).toBe(403);
  });
  it.each(['', '?ministry=all', '?ministry=events', '?event_id=1', '?event_id=1&event_id=2'])('scopes bulk lists and exports with filter %s', async (filter) => {
    const list = await marla('signups' + filter, 'GET');
    expect(list.status).toBe(200);
    expect(list.body.signups.map(s => s.id).sort()).toEqual([1, 2]);
    const csv = await marla('export.csv' + filter, 'GET');
    expect(csv.status).toBe(200);
    expect(csv.text).toContain('jane@example.com');
    expect(csv.text).not.toContain('pat@example.com');
  });
  it.each(['?event_id=2', '?event_id=999', '?event_id=', '?event_id=1 OR 1=1', '?ministry=other'])('cannot widen access with %s', async (filter) => {
    expect((await marla('signups' + filter, 'GET')).body.signups).toEqual([]);
    expect((await marla('export.csv' + filter, 'GET')).text.trim().split('\n')).toHaveLength(1);
  });
  it('returns no contacts for an unassigned or revoked coordinator', async () => {
    for (const username of ['other', 'marla']) {
      if (username === 'marla') sqlite.exec('DELETE FROM serve_event_coordinators');
      expect((await call('volunteer', username, 'signups', 'GET')).body.signups).toEqual([]);
      expect((await call('volunteer', username, 'export.csv', 'GET')).text).not.toContain('@example.com');
    }
  });
  it('handles legacy slot ownership without leaking unassigned or mixed-event notes', async () => {
    sqlite.exec(`INSERT INTO signups (id,event_id,name,email,notes) VALUES
      (4,NULL,'Legacy','legacy@example.com','assigned'),
      (5,0,'Other legacy','otherlegacy@example.com','private'),
      (6,NULL,'No event','none@example.com','private'),
      (7,NULL,'Mixed','mixed@example.com','private'),
      (8,2,'Conflicting','conflict@example.com','private');
      INSERT INTO signup_slots (signup_id,role_id) VALUES (4,1),(5,3),(7,1),(7,3),(8,1);`);
    for (const filter of ['', '?event_id=1']) {
      expect((await marla('signups' + filter, 'GET')).body.signups.map(s => s.id).sort()).toEqual([1,2,4]);
      const csv = await marla('export.csv' + filter, 'GET');
      expect(csv.text).toContain('legacy@example.com');
      expect(csv.text).not.toContain('private');
    }
  });
  it.each(['admin', 'staff'])('preserves global %s access and honors event/ministry filters', async role => {
    expect((await call(role, '', 'signups', 'GET')).body.signups).toHaveLength(3);
    expect((await call(role, '', 'export.csv', 'GET')).text).toContain('pat@example.com');
    expect((await call(role, '', 'events/2/roster', 'GET')).status).toBe(200);
    expect((await call(role, '', 'signups?event_id=2&ministry=events', 'GET')).body.signups.map(s => s.id)).toEqual([3]);
    expect((await call(role, '', 'export.csv?event_id=2', 'GET')).text).not.toContain('jane@example.com');
  });
});
