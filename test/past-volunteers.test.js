import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleAdminApi } from '../src/api-admin.js';
import { authCookieHeader } from '../src/auth.js';
import { parsePastVolunteerSheet, phoneKey } from '../src/api-past-volunteers.js';

// Past volunteers: a coordinator imports last year's list for their event. Rows matching an
// active person by email (then phone) are linked and tagged "<event> volunteer" in People;
// name alone never links. "Invite to sign up" emails everyone with an address who has not
// signed up this year and was not already invited. Synthetic data only.

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
  sqlite.exec(`CREATE TABLE people (id INTEGER PRIMARY KEY AUTOINCREMENT, first_name TEXT NOT NULL DEFAULT '', last_name TEXT NOT NULL DEFAULT '', preferred_name TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1, deceased INTEGER NOT NULL DEFAULT 0)`);
  sqlite.exec(`CREATE TABLE tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, color TEXT NOT NULL DEFAULT '#5C8FA8', description TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')))`);
  sqlite.exec(`CREATE TABLE person_tags (person_id INTEGER NOT NULL, tag_id INTEGER NOT NULL, PRIMARY KEY (person_id, tag_id))`);
  sqlite.exec(readFileSync(new URL('../migrations/0064_serve_past_volunteers.sql', import.meta.url), 'utf8'));
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
  sqlite.exec(`INSERT INTO app_users (username, role, email) VALUES ('marla', 'volunteer', 'marla@example.com'), ('other', 'volunteer', '')`);
  sqlite.exec(`INSERT INTO serve_events (name) VALUES ('Christmas Market'), ('Food Pantry')`);
  sqlite.exec(`INSERT INTO serve_event_coordinators (event_id, username) VALUES (1, 'marla')`);
  sqlite.exec(`INSERT INTO people (first_name, last_name, email, phone) VALUES
    ('Ann', 'Lee', 'ann@example.com', ''),
    ('Ben', 'Ortiz', '', '(314) 555-0101'),
    ('Cal', 'Smith', 'shared@example.com', ''),
    ('Cara', 'Smith', 'shared@example.com', ''),
    ('Dee', 'Gone', 'dee@example.com', '')`);
  sqlite.exec(`UPDATE people SET active=0 WHERE first_name='Dee'`);
  // Already signed up this year.
  sqlite.exec(`INSERT INTO signups (event_id, name, email, ministry) VALUES (1, 'Eve Early', 'eve@example.com', 'events')`);
  realFetch = globalThis.fetch;
  sent = [];
  globalThis.fetch = vi.fn(async (url, init) => { sent.push({ url: String(url), body: JSON.parse(init.body) }); return new Response('{}', { status: 200 }); });
});
afterEach(() => { globalThis.fetch = realFetch; });

async function call(role, username, path, method, body) {
  const cookie = (await authCookieHeader(env, role, username)).split(';')[0];
  const url = new URL('https://connect.timothystl.org/admin/api/' + path);
  const req = new Request(url, { method, headers: { cookie, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const res = await handleAdminApi(req, env, url, method);
  let json = null; try { json = await res.json(); } catch {}
  return { status: res.status, body: json };
}
const marla = (path, method, body) => call('volunteer', 'marla', path, method, body);

const SHEET = [
  'First Name,Last Name,Email,Phone',
  'Ann,Lee,ANN@example.com,',
  'Ben,Ortiz,,314.555.0101',
  'Cara,Smith,shared@example.com,',
  'Dee,Gone,dee@example.com,',
  'Eve,Early,eve@example.com,',
  'Fay,New,fay@example.com,',
  'Ann,Lee,ann@example.com,',
  'Nobody,Reachable,,',
].join('\n');

describe('reading the sheet', () => {
  it('reads CSV and pasted tab-separated rows, and needs a heading row', () => {
    expect(parsePastVolunteerSheet(SHEET).rows).toHaveLength(7);
    expect(parsePastVolunteerSheet(SHEET).skipped).toBe(1);
    const tsv = parsePastVolunteerSheet('Name\tE-mail\nGus Hill\tgus@example.com');
    expect(tsv.rows).toEqual([{ name: 'Gus Hill', email: 'gus@example.com', phone: '' }]);
    expect(parsePastVolunteerSheet('Gus Hill,gus@example.com').error).toMatch(/heading/);
    expect(phoneKey('+1 (314) 555-0101')).toBe('3145550101');
  });
});

describe('importing', () => {
  it('links and tags people matched by email or phone, never by name alone', async () => {
    const r = await marla('events/1/past-volunteers/import', 'POST', { text: SHEET, label: '2025' });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ read: 7, added: 6, updated: 0, in_connect: 3, not_in_connect: 3, skipped: 1, tag: 'Christmas Market volunteer' });
    const tagged = sqlite.prepare(`SELECT p.first_name FROM person_tags pt JOIN people p ON p.id=pt.person_id JOIN tags t ON t.id=pt.tag_id WHERE t.name='Christmas Market volunteer' ORDER BY p.first_name`).all().map((x) => x.first_name);
    // Ann by email, Ben by phone, Cara by shared email + first name; inactive Dee is not linked.
    expect(tagged).toEqual(['Ann', 'Ben', 'Cara']);
    const list = await marla('events/1/past-volunteers', 'GET');
    const byName = Object.fromEntries(list.body.rows.map((x) => [x.name, x]));
    expect(byName['Ann Lee'].in_connect).toBe(true);
    expect(byName['Dee Gone'].in_connect).toBe(false);
    expect(byName['Eve Early'].signed_up).toBe(true);
    expect(list.body.link).toBe('https://serve.timothystl.org/#event-1');
  });

  it('is safe to run twice', async () => {
    await marla('events/1/past-volunteers/import', 'POST', { text: SHEET });
    const again = await marla('events/1/past-volunteers/import', 'POST', { text: SHEET });
    expect(again.body).toMatchObject({ added: 0, updated: 6 });
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM serve_past_volunteers').get().n).toBe(6);
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM tags').get().n).toBe(1);
  });

  it('is limited to the events the coordinator runs', async () => {
    expect((await marla('events/2/past-volunteers/import', 'POST', { text: SHEET })).status).toBe(403);
    expect((await call('volunteer', 'other', 'events/1/past-volunteers', 'GET')).status).toBe(403);
    expect((await call('member', '', 'events/1/past-volunteers', 'GET')).status).toBe(403);
    expect((await call('admin', '', 'events/1/past-volunteers', 'GET')).status).toBe(200);
  });

  it('explains a sheet it cannot read', async () => {
    const r = await marla('events/1/past-volunteers/import', 'POST', { text: 'just,some,cells' });
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/heading/);
  });
});

describe('inviting', () => {
  beforeEach(async () => { await marla('events/1/past-volunteers/import', 'POST', { text: SHEET, label: '2025' }); });

  it('skips people already signed up or without email, and personalises each message', async () => {
    const dry = await marla('events/1/past-volunteers/invite', 'POST', { dry_run: true });
    expect(dry.body).toMatchObject({ count: 4, already_signed_up: 1 });
    expect(sent).toHaveLength(0);
    const r = await marla('events/1/past-volunteers/invite', 'POST', { subject: 'Hi {name}', body: 'Sign up: {link} for {event}' });
    expect(r.body).toMatchObject({ ok: true, sent: 4, failed: 0 });
    const msgs = sent[0].body;
    expect(msgs.map((m) => m.to).sort()).toEqual(['ann@example.com', 'dee@example.com', 'fay@example.com', 'shared@example.com'].sort());
    const ann = msgs.find((m) => m.to === 'ann@example.com');
    expect(ann.subject).toBe('Hi Ann');
    expect(ann.text).toBe('Sign up: https://serve.timothystl.org/#event-1 for Christmas Market');
    expect(ann.reply_to).toBe('marla@example.com');
  });

  it('does not invite the same people twice unless asked', async () => {
    await marla('events/1/past-volunteers/invite', 'POST', { subject: 's', body: 'b' });
    const again = await marla('events/1/past-volunteers/invite', 'POST', { dry_run: true });
    expect(again.body.count).toBe(0);
    const forced = await marla('events/1/past-volunteers/invite', 'POST', { dry_run: true, include_invited: true });
    expect(forced.body.count).toBe(4);
  });

  it('reports a provider failure and marks nobody invited', async () => {
    globalThis.fetch = vi.fn(async () => new Response('nope', { status: 500 }));
    const r = await marla('events/1/past-volunteers/invite', 'POST', { subject: 's', body: 'b' });
    expect(r.status).toBe(502);
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM serve_past_volunteers WHERE invited_at!=''").get().n).toBe(0);
  });

  it('removes one row or the whole list without touching People', async () => {
    const list = await marla('events/1/past-volunteers', 'GET');
    expect((await marla(`events/1/past-volunteers/${list.body.rows[0].id}`, 'DELETE')).status).toBe(200);
    expect((await marla('events/1/past-volunteers', 'DELETE')).status).toBe(200);
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM serve_past_volunteers').get().n).toBe(0);
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM person_tags').get().n).toBe(3);
  });
});
