import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { handleMemberPortalContracts, MAX_CODE_TRIES } from '../src/api-member-portal-contract.js';

const KEY = 'test-member-portal-key-0123456789abcdef';
const PATH = '/api/contracts/member-portal-v1';

function makeTestDb() {
  const sqlite = new DatabaseSync(':memory:');
  for (const f of readdirSync(new URL('../migrations/', import.meta.url)).filter((n) => n.endsWith('.sql')).sort()) {
    sqlite.exec(readFileSync(new URL(`../migrations/${f}`, import.meta.url), 'utf8'));
  }
  return {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() { const r = sqlite.prepare(sql).run(...args); return { meta: { last_row_id: Number(r.lastInsertRowid), changes: r.changes } }; },
            async first() { return sqlite.prepare(sql).get(...args); },
            async all() { return { results: sqlite.prepare(sql).all(...args) }; },
          };
        },
        async first() { return sqlite.prepare(sql).get(); },
        async all() { return { results: sqlite.prepare(sql).all() }; },
      };
    },
    _raw: sqlite,
  };
}

function makeKv() {
  const store = new Map();
  return {
    store,
    async get(k) { return store.get(k) ?? null; },
    async put(k, v) { store.set(k, v); },
    async delete(k) { store.delete(k); },
  };
}

function call(env, body, { key = KEY, method = 'POST', path = PATH } = {}) {
  return handleMemberPortalContracts(new Request(`https://connect.timothystl.org${path}`, {
    method,
    headers: { 'X-Contract-Key': key, 'content-type': 'application/json' },
    ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
  }), env, path);
}

let db; let kv; let env; let sent;

function addPerson(first, last, email, extra = {}) {
  return Number(db._raw.prepare(
    `INSERT INTO people (first_name, last_name, email, member_type, status) VALUES (?,?,?,?,?)`
  ).run(first, last, email, extra.member_type || 'member', extra.status || 'active').lastInsertRowid);
}
function addGift(personId, fundName, cents, date, extra = {}) {
  let fund = db._raw.prepare('SELECT id FROM funds WHERE name=?').get(fundName);
  if (!fund) db._raw.prepare('INSERT INTO funds (name) VALUES (?)').run(fundName);
  fund = db._raw.prepare('SELECT id FROM funds WHERE name=?').get(fundName);
  const batch = Number(db._raw.prepare('INSERT INTO giving_batches (batch_date) VALUES (?)').run(date).lastInsertRowid);
  db._raw.prepare(
    'INSERT INTO giving_entries (batch_id, person_id, fund_id, amount, method, original_amount_cents) VALUES (?,?,?,?,?,?)'
  ).run(batch, personId, fund.id, cents, extra.method || 'check', extra.original ?? 0);
}
const lastCode = () => /letter-spacing:10px[^>]*>(\d{6})</.exec(sent.at(-1).htmlContent)?.[1];

beforeEach(() => {
  db = makeTestDb();
  kv = makeKv();
  env = { DB: db, KV: kv, MEMBER_PORTAL_CONTRACT_API_KEY: KEY, BREVO_API_KEY: 'brevo-test' };
  db._raw.prepare(`INSERT OR REPLACE INTO chms_config (key, value) VALUES ('church_from_email','office@example.org')`).run();
  db._raw.prepare(`INSERT OR REPLACE INTO chms_config (key, value) VALUES ('church_ein','12-3456789')`).run();
  sent = [];
  vi.stubGlobal('fetch', vi.fn(async (_url, init) => { sent.push(JSON.parse(init.body)); return new Response(JSON.stringify({ messageId: 'm1' }), { status: 201 }); }));
});
afterEach(() => vi.unstubAllGlobals());

describe('member portal access', () => {
  it('ignores other paths', async () => {
    expect(await handleMemberPortalContracts(new Request('https://x/api/contracts/other'), env, '/api/contracts/other')).toBeNull();
  });
  it('fails closed when no key is configured and rejects a wrong key', async () => {
    expect((await call({ ...env, MEMBER_PORTAL_CONTRACT_API_KEY: '' }, { op: 'giving' })).status).toBe(503);
    expect((await call(env, { op: 'giving' }, { key: 'nope' })).status).toBe(401);
  });
  it('only accepts POST', async () => {
    expect((await call(env, null, { method: 'GET' })).status).toBe(405);
  });
});

describe('sign-in codes', () => {
  it('emails a code and signs the member in once, then refuses reuse', async () => {
    addPerson('Margaret', 'Hale', 'Margaret.H@gmail.com');
    const res = await call(env, { op: 'request_code', email: ' margaret.h@gmail.com ', client: 'c1' });
    expect(await res.json()).toEqual({ ok: true });
    expect(sent).toHaveLength(1);
    expect(sent[0].to[0].email).toBe('margaret.h@gmail.com');
    expect(sent[0].htmlContent).toContain('https://app.timothystl.org/signin?');
    const code = lastCode();
    expect(code).toMatch(/^\d{6}$/);
    const ok = await (await call(env, { op: 'verify_code', email: 'margaret.h@gmail.com', code })).json();
    expect(ok).toMatchObject({ ok: true, first_name: 'Margaret' });
    const again = await (await call(env, { op: 'verify_code', email: 'margaret.h@gmail.com', code })).json();
    expect(again).toEqual({ ok: false, reason: 'expired' });
  });

  it('answers the same way for an unknown address and sends nothing', async () => {
    addPerson('Margaret', 'Hale', 'margaret.h@gmail.com');
    const res = await call(env, { op: 'request_code', email: 'stranger@example.com', client: 'c1' });
    expect(await res.json()).toEqual({ ok: true });
    expect(sent).toHaveLength(0);
  });

  it('does not sign in archived people or organizations', async () => {
    addPerson('Old', 'Member', 'old@example.com', { status: 'archived' });
    addPerson('Acme', 'Co', 'acme@example.com', { member_type: 'organization' });
    for (const email of ['old@example.com', 'acme@example.com']) await call(env, { op: 'request_code', email, client: 'c' });
    expect(sent).toHaveLength(0);
  });

  it('rejects wrong codes, and burns the code after too many tries', async () => {
    addPerson('Margaret', 'Hale', 'm@example.com');
    await call(env, { op: 'request_code', email: 'm@example.com', client: 'c1' });
    const real = lastCode();
    const wrong = real === '000000' ? '111111' : '000000';
    let last;
    for (let i = 0; i < MAX_CODE_TRIES; i += 1) last = await (await call(env, { op: 'verify_code', email: 'm@example.com', code: wrong })).json();
    expect(last).toEqual({ ok: false, reason: 'expired' });
    expect(await (await call(env, { op: 'verify_code', email: 'm@example.com', code: real })).json()).toEqual({ ok: false, reason: 'expired' });
  });

  it('first wrong try is a gentle "wrong"', async () => {
    addPerson('Margaret', 'Hale', 'm@example.com');
    await call(env, { op: 'request_code', email: 'm@example.com', client: 'c1' });
    const real = lastCode();
    const res = await (await call(env, { op: 'verify_code', email: 'm@example.com', code: real === '000000' ? '111111' : '000000' })).json();
    expect(res).toEqual({ ok: false, reason: 'wrong' });
  });

  it('limits how many codes one address can ask for in an hour', async () => {
    addPerson('Margaret', 'Hale', 'm@example.com');
    const statuses = [];
    for (let i = 0; i < 7; i += 1) statuses.push((await call(env, { op: 'request_code', email: 'm@example.com', client: `c${i}` })).status);
    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(statuses.slice(5)).toEqual([429, 429]);
  });

  it('limits how many codes one device can ask for across addresses', async () => {
    let blocked = 0;
    for (let i = 0; i < 25; i += 1) {
      const res = await call(env, { op: 'request_code', email: `p${i}@example.com`, client: 'same-device' });
      if (res.status === 429) blocked += 1;
    }
    expect(blocked).toBe(5);
  });

  it('only links back to an allowed launcher address', async () => {
    addPerson('Margaret', 'Hale', 'm@example.com');
    await call(env, { op: 'request_code', email: 'm@example.com', origin: 'https://evil.example', client: 'c1' });
    expect(sent[0].htmlContent).toContain('https://app.timothystl.org/signin?');
    expect(sent[0].htmlContent).not.toContain('evil.example');
  });

  it('rejects a malformed email', async () => {
    expect((await call(env, { op: 'request_code', email: 'nope' })).status).toBe(400);
  });
});

describe('giving and statements', () => {
  it('returns only this mailbox’s gifts, newest first, with year totals', async () => {
    const mine = addPerson('Margaret', 'Hale', 'm@example.com');
    const other = addPerson('Someone', 'Else', 'other@example.com');
    addGift(mine, 'General Fund', 5000, '2026-09-27');
    addGift(mine, 'Missions', 10000, '2026-10-04', { method: 'online' });
    addGift(mine, 'General Fund', 260000, '2025-12-28');
    addGift(other, 'General Fund', 99900, '2026-09-27');
    const res = await (await call(env, { op: 'giving', email: 'M@example.com', year: 2026 })).json();
    expect(res.first_name).toBe('Margaret');
    expect(res.total_cents).toBe(15000);
    expect(res.gifts.map((g) => g.date)).toEqual(['2026-10-04', '2026-09-27']);
    expect(res.years).toEqual([{ year: 2026, total_cents: 15000 }, { year: 2025, total_cents: 260000 }]);
  });

  it('leaves out voided gifts', async () => {
    const mine = addPerson('Margaret', 'Hale', 'm@example.com');
    addGift(mine, 'General Fund', 5000, '2026-09-27');
    addGift(mine, 'General Fund', 0, '2026-09-28', { original: 7000 });
    const res = await (await call(env, { op: 'giving', email: 'm@example.com', year: 2026 })).json();
    expect(res.total_cents).toBe(5000);
    expect(res.gifts).toHaveLength(1);
  });

  it('shows a couple who share an address their gifts together', async () => {
    const a = addPerson('Margaret', 'Hale', 'family@example.com');
    const b = addPerson('Tom', 'Hale', 'family@example.com');
    addGift(a, 'General Fund', 5000, '2026-09-27');
    addGift(b, 'General Fund', 3000, '2026-09-28');
    const res = await (await call(env, { op: 'statement', email: 'family@example.com', year: 2026 })).json();
    expect(res.total_cents).toBe(8000);
    expect(res.names).toEqual(['Margaret Hale', 'Tom Hale']);
    expect(res.church_ein).toBe('12-3456789');
  });

  it('answers not_found for an unknown address and no_gifts for an empty year', async () => {
    const mine = addPerson('Margaret', 'Hale', 'm@example.com');
    expect((await call(env, { op: 'giving', email: 'ghost@example.com' })).status).toBe(404);
    expect((await call(env, { op: 'statement', email: 'm@example.com', year: 2024 })).status).toBe(404);
    expect(mine).toBeGreaterThan(0);
  });

  it('rejects a bad year', async () => {
    addPerson('Margaret', 'Hale', 'm@example.com');
    expect((await call(env, { op: 'statement', email: 'm@example.com', year: 'abc' })).status).toBe(400);
  });
});

// ── Serving list ────────────────────────────────────────────────────────────────────────────────
const dayFromNow = (n) => new Date(Date.now() + n * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });

function setBlob(key, value) {
  db._raw.prepare(`INSERT OR REPLACE INTO scheduler_data (key, value) VALUES (?, ?)`).run(key, JSON.stringify(value));
}

describe('serving list', () => {
  it('lists upcoming scheduled roles for the person, matched by email, with confirmation status', async () => {
    addPerson('Margaret', 'Hale', 'm@example.com');
    const soon = dayFromNow(7); const past = dayFromNow(-7);
    setBlob('ws_people', [
      { id: 'w1', name: 'Margaret Hale', email: 'M@Example.com' },
      { id: 'w2', name: 'Someone Else', email: 'else@example.com' },
    ]);
    setBlob('ws_schedule_v2', { month: { rows: [
      { dateISO: soon, label: '3rd Sunday', assignments: { Lector: { '8am': 'w1', '10:45am': 'w2' }, Preacher: { shared: 'w2' }, Acolyte: { '10:45am': 'w1' } } },
      { dateISO: past, label: 'Old', assignments: { Lector: { '8am': 'w1' } } },
      { dateISO: dayFromNow(14), type: 'special', name: 'Christmas Eve', services: [{ time: '7:00 PM', roles: ['Lector'], assignments: { Lector: 'w1' } }] },
    ] } });
    db._raw.prepare(`INSERT INTO scheduler_confirmations (date_iso, role, svc, status) VALUES (?, 'Lector', '8am', 'confirmed')`).run(soon);

    const res = await (await call(env, { op: 'serving', email: 'm@example.com' })).json();
    expect(res.first_name).toBe('Margaret');
    expect(res.scheduled).toEqual([
      { date: soon, what: '3rd Sunday', service: '10:45 AM', svc: '10:45am', role: 'Acolyte', status: 'pending' },
      { date: soon, what: '3rd Sunday', service: '8:00 AM', svc: '8am', role: 'Lector', status: 'confirmed' },
      { date: dayFromNow(14), what: 'Christmas Eve', service: '7:00 PM', svc: '7:00 PM', role: 'Lector', status: 'pending' },
    ]);
  });

  it('matches through the migration link when the schedule still uses the old volunteer id', async () => {
    const id = addPerson('Margaret', 'Hale', 'm@example.com');
    db._raw.prepare(`INSERT INTO scheduler_volunteers (person_id, migrated_from_legacy_id) VALUES (?, 'legacy-7')`).run(id);
    const soon = dayFromNow(3);
    setBlob('ws_schedule_v2', { month: { rows: [{ dateISO: soon, assignments: { Elder: { '8am': 'legacy-7' } } }] } });
    const res = await (await call(env, { op: 'serving', email: 'm@example.com' })).json();
    expect(res.scheduled.map((s) => s.role)).toEqual(['Elder']);
  });

  it('lists event and ministry sign-ups, not declined or past ones, and never someone else’s', async () => {
    addPerson('Margaret', 'Hale', 'm@example.com');
    const evt = Number(db._raw.prepare(`INSERT INTO serve_events (name, event_date) VALUES ('Christmas Market', ?)`).run(dayFromNow(30)).lastInsertRowid);
    const old = Number(db._raw.prepare(`INSERT INTO serve_events (name, event_date) VALUES ('Old Event', ?)`).run(dayFromNow(-30)).lastInsertRowid);
    const add = (event, email, status, ministry = 'events') => db._raw.prepare(
      `INSERT INTO signups (event_id, ministry, name, email, roles, status) VALUES (?,?,?,?,?,?)`).run(event, ministry, 'N', email, '["Baking"]', status);
    add(evt, 'M@example.com', 'confirmed'); add(evt, 'm@example.com', 'declined'); add(old, 'm@example.com', 'new'); add(evt, 'other@example.com', 'new');
    add(null, 'm@example.com', 'new', 'worship'); // a pending worship interest form, not a place they serve
    const res = await (await call(env, { op: 'serving', email: 'm@example.com' })).json();
    expect(res.signups).toEqual([{ what: 'Christmas Market', date: dayFromNow(30), roles: ['Baking'], status: 'confirmed' }]);
  });

  it('answers not_found for an unknown address', async () => {
    expect((await call(env, { op: 'serving', email: 'ghost@example.com' })).status).toBe(404);
  });
});

describe('responding to a scheduled role', () => {
  const setup = () => {
    const id = addPerson('Margaret', 'Hale', 'm@example.com');
    const soon = dayFromNow(7);
    setBlob('ws_people', [{ id: 'w1', name: 'Margaret Hale', email: 'm@example.com' }, { id: 'w2', name: 'Other', email: 'o@example.com' }]);
    setBlob('ws_schedule_v2', { month: { rows: [{ dateISO: soon, label: '3rd Sunday', assignments: { Lector: { '8am': 'w1' }, Acolyte: { '8am': 'w2' } } }] } });
    return { id, soon };
  };
  const answer = (body) => call(env, { op: 'respond', email: 'm@example.com', ...body });

  it('records the answer for the slot, in the confirmations table and the volunteer\u2019s reminder record', async () => {
    const { soon } = setup();
    db._raw.prepare(`INSERT INTO scheduler_rsvp_tokens (person_id, token, name) VALUES ('w1', 'tok1', 'Margaret Hale')`).run();
    kv.store.set('tok1', JSON.stringify({ token: 'tok1', name: 'Margaret Hale', notifyEmail: 'sched@example.org', assignments: [{ dateISO: soon, date: soon, svc: '8am', role: 'Lector', status: 'pending' }] }));
    const res = await answer({ date: soon, role: 'Lector', svc: '8am', status: 'confirmed' });
    expect(await res.json()).toMatchObject({ ok: true, status: 'confirmed' });
    expect(db._raw.prepare(`SELECT status FROM scheduler_confirmations WHERE date_iso=? AND role='Lector' AND svc='8am'`).get(soon).status).toBe('confirmed');
    expect(JSON.parse(kv.store.get('tok1')).assignments[0].status).toBe('confirmed');
    const serving = await (await call(env, { op: 'serving', email: 'm@example.com' })).json();
    expect(serving.scheduled[0].status).toBe('confirmed');
  });

  it('works for someone with no reminder record, and tells the office (email and push)', async () => {
    const { soon } = setup();
    env.RESEND_API_KEY = 'resend-test'; env.EMAIL_FROM = 'office@example.org';
    const res = await answer({ date: soon, role: 'Lector', svc: '8am', status: 'declined' });
    expect((await res.json()).ok).toBe(true);
    const mail = sent.find((m) => m.subject && m.subject.startsWith('Worship Scheduler: Margaret Hale'));
    expect(mail).toBeTruthy();
    expect(mail.to).toBe('office@timothystl.org');
    expect(mail.text).toContain('Declined');
    expect(db._raw.prepare(`SELECT status FROM scheduler_confirmations WHERE date_iso=? AND role='Lector'`).get(soon).status).toBe('declined');
  });

  it('only changes the one slot, never anyone else\u2019s answer', async () => {
    const { soon } = setup();
    db._raw.prepare(`INSERT INTO scheduler_confirmations (date_iso, role, svc, status) VALUES (?, 'Acolyte', '8am', 'confirmed')`).run(soon);
    await answer({ date: soon, role: 'Lector', svc: '8am', status: 'needs_changes' });
    expect(db._raw.prepare(`SELECT status FROM scheduler_confirmations WHERE role='Acolyte'`).get().status).toBe('confirmed');
  });

  it('refuses a role the person is not scheduled for, and bad input', async () => {
    const { soon } = setup();
    expect((await answer({ date: soon, role: 'Acolyte', svc: '8am', status: 'confirmed' })).status).toBe(404); // belongs to someone else
    expect((await answer({ date: dayFromNow(-3), role: 'Lector', svc: '8am', status: 'confirmed' })).status).toBe(404);
    expect((await answer({ date: soon, role: 'Lector', svc: '8am', status: 'maybe' })).status).toBe(400);
    expect((await answer({ date: 'soon', role: 'Lector', svc: '8am', status: 'confirmed' })).status).toBe(400);
    expect(db._raw.prepare(`SELECT COUNT(*) AS n FROM scheduler_confirmations`).get().n).toBe(0);
  });
});

// ── Opening Connect from the member app ─────────────────────────────────────────────────────────
import { handleMemberSso, acceptMemberSsoLink } from '../src/api-member-portal-contract.js';
import { getAuthInfo } from '../src/auth.js';

async function ssoToken(email, { key = KEY, expIn = 60, nonce = `n${Math.random().toString(36).slice(2)}abcdefghijkl` } = {}) {
  const payload = Buffer.from(JSON.stringify({ e: email, exp: Math.floor(Date.now() / 1000) + expIn, n: nonce })).toString('base64url');
  const hmac = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = Buffer.from(await crypto.subtle.sign('HMAC', hmac, new TextEncoder().encode(`member-sso|${payload}`))).toString('base64url');
  return `${payload}.${sig}`;
}
const sso = (token) => handleMemberSso(new Request(`https://connect.timothystl.org/member-sso?t=${encodeURIComponent(token)}`), { ...env, SESSION_SECRET: 'test-session-secret-0123456789abcdef' }, new URL(`https://connect.timothystl.org/member-sso?t=${encodeURIComponent(token)}`));
const sessionOf = async (response) => getAuthInfo(new Request('https://connect.timothystl.org/', { headers: { cookie: response.headers.get('set-cookie')?.split(';')[0] || '' } }), { ...env, SESSION_SECRET: 'test-session-secret-0123456789abcdef' });

describe('member sign-in link into Connect', () => {
  it('signs an active member in as a member, and creates their account on first use', async () => {
    addPerson('Margaret', 'Hale', 'm@example.com');
    const response = await sso(await ssoToken('m@example.com'));
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://connect.timothystl.org/');
    const info = await sessionOf(response);
    expect(info).toMatchObject({ role: 'member', username: expect.stringMatching(/^member-\d+$/) });
    const row = db._raw.prepare(`SELECT role, active, password_hash FROM app_users WHERE LOWER(email)='m@example.com'`).get();
    expect(row.role).toBe('member');
    expect(row.password_hash.startsWith('disabled:')).toBe(true);
  });

  it('uses each link once, and rejects forged, expired, wrong-key, or stale links', async () => {
    addPerson('Margaret', 'Hale', 'm@example.com');
    const good = await ssoToken('m@example.com');
    expect(await acceptMemberSsoLink(env, good)).toBe('m@example.com');
    expect(await acceptMemberSsoLink(env, good)).toBeNull(); // spent
    expect(await acceptMemberSsoLink(env, await ssoToken('m@example.com', { expIn: -5 }))).toBeNull();
    expect(await acceptMemberSsoLink(env, await ssoToken('m@example.com', { key: 'some-other-key-0123456789abcdef0123' }))).toBeNull();
    expect(await acceptMemberSsoLink(env, await ssoToken('m@example.com', { expIn: 3600 }))).toBeNull();
    const [payload] = good.split('.');
    expect(await acceptMemberSsoLink(env, `${payload}.AAAA`)).toBeNull();
    expect(await acceptMemberSsoLink({ ...env, MEMBER_PORTAL_CONTRACT_API_KEY: '' }, await ssoToken('m@example.com'))).toBeNull();
    for (const bad of ['', 'x', 'a.b.c']) expect(await acceptMemberSsoLink(env, bad)).toBeNull();
  });

  it('never signs anyone in as staff or an administrator, even with a valid link', async () => {
    const id = addPerson('Pat', 'Staff', 'pat@example.com');
    db._raw.prepare(`INSERT INTO app_users (username, password_hash, role, active, email, people_id) VALUES ('pat','x','admin',1,'pat@example.com',?)`).run(id);
    const response = await sso(await ssoToken('pat@example.com'));
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(response.headers.get('location')).toBe('https://connect.timothystl.org/');
  });

  it('renames an account that was invited under an email address, so its session cookie works', async () => {
    const id = addPerson('Margaret', 'Hale', 'm@example.com');
    db._raw.prepare(`INSERT INTO app_users (username, password_hash, role, active, email, people_id) VALUES ('m@example.com','x','member',1,'m@example.com',?)`).run(id);
    const info = await sessionOf(await sso(await ssoToken('m@example.com')));
    expect(info).toMatchObject({ role: 'member', username: `member-${id}` });
    expect(db._raw.prepare(`SELECT COUNT(*) AS n FROM app_users WHERE people_id=?`).get(id).n).toBe(1);
  });

  it('does not sign in inactive accounts, visitors, or unknown addresses', async () => {
    const id = addPerson('Old', 'Member', 'old@example.com');
    db._raw.prepare(`INSERT INTO app_users (username, password_hash, role, active, email, people_id) VALUES ('old@example.com','x','member',0,'old@example.com',?)`).run(id);
    addPerson('Vera', 'Visitor', 'v@example.com', { member_type: 'visitor' });
    for (const email of ['old@example.com', 'v@example.com', 'ghost@example.com']) {
      const response = await sso(await ssoToken(email));
      expect(response.headers.get('set-cookie'), email).toBeNull();
    }
    expect(db._raw.prepare(`SELECT COUNT(*) AS n FROM app_users WHERE LOWER(email)='v@example.com'`).get().n).toBe(0);
  });
});
