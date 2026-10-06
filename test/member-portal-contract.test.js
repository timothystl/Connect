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
