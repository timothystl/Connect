import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker from '../apps/finance/shell.js';
import { TUITION_FINANCE_SCHEMA } from '../src/tuition-storage.js';
import { tuitionAidViewer, tuitionOperation } from '../apps/finance/tuition-service.js';
import { bundleTuitionPlanner, bundleModule, BUNDLE_PATH } from '../apps/finance/tuition-planner/build.mjs';

// Finance's own Tuition Aid planner: the page, its script, and /api/v1/tuition answering from the
// tuition_* tables in Finance's database (Connect is asked only for the move and the people search).

function financeDb() {
  const sqlite = new DatabaseSync(':memory:');
  for (const sql of TUITION_FINANCE_SCHEMA) sqlite.exec(sql);
  const stmt = (sql, args = []) => ({
    sql, args,
    bind: (...a) => stmt(sql, a),
    async run() { const r = sqlite.prepare(sql).run(...args); return { meta: { last_row_id: Number(r.lastInsertRowid), changes: r.changes } }; },
    async first() { return sqlite.prepare(sql).get(...args); },
    async all() { return { results: sqlite.prepare(sql).all(...args) }; },
  });
  return {
    prepare: (sql) => stmt(sql),
    async batch(list) {
      sqlite.exec('BEGIN');
      try { const out = list.map((s) => (sqlite.prepare(s.sql).run(...s.args), { results: [] })); sqlite.exec('COMMIT'); return out; } catch (e) { sqlite.exec('ROLLBACK'); throw e; }
    },
    _raw: sqlite,
  };
}

function env({ role = 'finance', permissions = { finance: 'edit', tuitionaid: 'edit' }, moved = 'verified', storageAnswer = null } = {}) {
  const db = financeDb();
  db._raw.exec(`INSERT INTO tuition_config (key, value) VALUES ('base_school_year','2026');
    INSERT INTO tuition_students (id, family, child, base_grade, fam_pct, fam_pct_orig, lhs_award_cents, lhs_award_orig_cents, attends_lhs, active, sort_order)
      VALUES (1, 'Sample', 'Ada', '3', 40, 40, 120000, 120000, 1, 1, 0);`);
  if (moved) db._raw.prepare("INSERT INTO tuition_storage_migration (started_at, finished_at, status, manifest) VALUES ('2026-09-28T03:20:00Z','2026-09-28T03:20:01Z',?, ?)").run(moved, JSON.stringify([{ table: 'tuition_students', count: 1 }]));
  const calls = [];
  return { ENVIRONMENT: 'production', FINANCE_CONTRACT_API_KEY: 'key', RELEASE_SHA: 'test', FINANCE_DB: db, calls,
    CONNECT_SERVICE: { async fetch(req) {
      const u = new URL(req.url);
      if (u.pathname.endsWith('staff-role-v1')) return Response.json({ role, permissions, username: 'tester' });
      calls.push({ path: u.searchParams.get('path'), headers: Object.fromEntries(req.headers) });
      if (u.searchParams.get('path') === 'tuition-aid/storage') {
        if (storageAnswer) storageAnswer(db);
        return Response.json({ mode: 'finance' });
      }
      return Response.json({ people: [{ id: 9, first_name: 'Linked', last_name: 'Person', household_id: 4, household_name: 'Person household', email: 'not-forwarded@example.test' }] });
    } },
  };
}
const call = (e, path, init = {}) => worker.fetch(new Request('https://finance.test' + path, { ...init, headers: { 'Cf-Access-Jwt-Assertion': 'jwt', ...(init.headers || {}) } }), e);
const api = (e, op, init = {}) => call(e, '/api/v1/tuition?path=' + encodeURIComponent(op) + (init.query || ''), {
  ...init, headers: { 'Content-Type': 'application/json', ...(init.method && init.method !== 'GET' ? { Origin: 'https://finance.test' } : {}), ...(init.headers || {}) },
});

describe('Tuition Aid planner in Finance', () => {
  it('ships the committed planner bundle built from its sources', async () => {
    expect(fs.readFileSync(BUNDLE_PATH, 'utf8')).toBe(bundleModule(await bundleTuitionPlanner()));
  });

  it('is four Finance pages mounting the planner under the planner’s script policy', async () => {
    const dummy = { ...env(), FINANCE_DB: { prepare: (sql) => ({ sql }) } };
    for (const page of ['overview', 'planner', 'past-years', 'settings']) {
      const r = await call(dummy, `/?section=tuition&page=${page}`);
      const html = await r.text();
      expect(r.status).toBe(200);
      expect(html).toContain('id="tp-root"');
      expect(html).toContain(`"page":"${page}"`);
      expect(html).toContain('/tuition-planner/app.js?v=');
      expect(html).not.toContain('<iframe');
      expect(r.headers.get('content-security-policy')).toContain("script-src 'self'");
    }
    const js = await call(dummy, '/tuition-planner/app.js');
    expect(js.headers.get('content-type')).toContain('javascript');
    expect(await js.text()).toContain('/api/v1/tuition?path=');
    const old = await call(dummy, '/tuition-aid');
    expect(old.status).toBe(302);
    expect(old.headers.get('location')).toBe('/?section=tuition&page=planner');
  });

  it('marks the planner view only for view access and for the council preview', async () => {
    const dummy = (o) => ({ ...env(o), FINANCE_DB: { prepare: (sql) => ({ sql }) } });
    expect(await (await call(dummy({ role: 'council', permissions: { tuitionaid: 'view' } }), '/?section=tuition&page=planner')).text()).toContain('"canEdit":false');
    expect(await (await call(dummy(), '/?section=tuition&page=planner')).text()).toContain('"canEdit":true');
    expect(await (await call(dummy({ role: 'admin', permissions: {} }), '/?section=tuition&page=planner&council=1')).text()).toContain('"canEdit":false');
    expect(tuitionAidViewer({ ok: true, role: 'compensation', permissions: { tuitionaid: 'edit' } })).toBeNull();
    expect(tuitionAidViewer({ ok: true, role: 'staff', permissions: { tuitionaid: 'none' } })).toBeNull();
  });

  it('reads and saves the tuition records in Finance’s own database', async () => {
    const e = env();
    const bundle = await (await api(e, 'tuition-aid/students')).json();
    expect(bundle.students.map((s) => s.child)).toEqual(['Ada']);
    expect(bundle.moved).toEqual({ movedAt: '2026-09-28', students: 1 });
    expect((await api(e, 'tuition-aid/students/1', { method: 'PATCH', body: JSON.stringify({ outside_aid_cents: 50000 }) })).status).toBe(200);
    expect(e.FINANCE_DB._raw.prepare('SELECT outside_aid_cents FROM tuition_students WHERE id=1').get().outside_aid_cents).toBe(50000);
    // Next year's plan, and the year-pin bulk now clears typed dollar figures along with the new share.
    await api(e, 'tuition-aid/students/1/years/2027-28', { method: 'PUT', body: JSON.stringify({ timothy_award_cents: 400000, family_owed_cents: 500000 }) });
    await api(e, 'tuition-aid/year-pins/bulk', { method: 'POST', body: JSON.stringify({ school_year: '2027-28', updates: [{ student_id: 1, fam_pct: 45, timothy_award_cents: null, family_owed_cents: null }] }) });
    expect(e.FINANCE_DB._raw.prepare("SELECT fam_pct, timothy_award_cents FROM tuition_student_years WHERE student_id=1 AND school_year='2027-28'").get()).toEqual({ fam_pct: 45, timothy_award_cents: null });
    // Linking keeps the name the search returned (Finance has no people table).
    await api(e, 'tuition-aid/students/1', { method: 'PATCH', body: JSON.stringify({ person_id: 9, family: 'Person', child: 'Linked', household_id: 4 }) });
    expect(e.FINANCE_DB._raw.prepare('SELECT person_id, family, child, household_id FROM tuition_students WHERE id=1').get()).toEqual({ person_id: 9, family: 'Person', child: 'Linked', household_id: 4 });
    // None of that went to Connect.
    expect(e.calls).toEqual([]);
  });

  it('searches Connect for a person to link, passing on only what the link needs', async () => {
    const e = env();
    const d = await (await api(e, 'people', { query: '&q=Pers' })).json();
    expect(d.people).toEqual([{ id: 9, first_name: 'Linked', last_name: 'Person', household_id: 4, household_name: 'Person household' }]);
    expect(e.calls[0]).toMatchObject({ path: 'people?q=Pers', headers: { 'cf-access-jwt-assertion': 'jwt', 'x-contract-key': 'key' } });
  });

  it('refuses view-only saves, cross-site changes and anything outside the planner', async () => {
    const viewer = env({ role: 'council', permissions: { tuitionaid: 'view' } });
    expect((await api(viewer, 'tuition-aid/students')).status).toBe(200);
    const denied = await api(viewer, 'tuition-aid/config', { method: 'PATCH', body: '{"values":{"a":"1"}}' });
    expect(denied.status).toBe(403);
    expect((await denied.json()).error).toContain('view only');
    const e = env();
    expect((await api(e, 'tuition-aid/config', { method: 'PATCH', body: '{}', headers: { 'Sec-Fetch-Site': 'cross-site' } })).status).toBe(403);
    expect((await api(env({ role: 'staff', permissions: { tuitionaid: 'none' } }), 'tuition-aid/students')).status).toBe(403);
    for (const op of ['giving', 'tuition-aid/storage', 'tuition-aid/history', 'tuition-aid/students/1/../2', 'people/3']) {
      expect((await api(e, op)).status).toBe(404);
    }
    expect((await api(e, 'tuition-aid/config')).status).toBe(404); // PATCH only
    expect(tuitionOperation('tuition-aid/year-rates/2027-28', 'PUT')).toBe('tuition');
    expect(tuitionOperation('people', 'POST')).toBeNull();
  });

  it('opens only on a copy Connect verified, asking Connect to finish the move first', async () => {
    const e = env({ moved: null, storageAnswer: (db) => db._raw.exec("INSERT INTO tuition_storage_migration (started_at, finished_at, status, manifest) VALUES ('t','t','verified','[]')") });
    expect((await api(e, 'tuition-aid/students')).status).toBe(200);
    expect(e.calls.map((c) => c.path)).toEqual(['tuition-aid/storage']);
    const never = env({ moved: null });
    const r = await api(never, 'tuition-aid/students');
    expect(r.status).toBe(503);
    expect((await r.json()).error).toContain('not been moved');
    const failed = await api(env({ moved: 'failed' }), 'tuition-aid/students', { method: 'GET' });
    expect(failed.status).toBe(503);
    expect((await failed.json()).error).toContain('Connect still has every record');
  });
});
