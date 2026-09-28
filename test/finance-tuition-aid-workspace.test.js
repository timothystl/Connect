import { describe, expect, it } from 'vitest';
import vm from 'node:vm';
import worker from '../apps/finance/shell.js';
import { tuitionAidWorkspaceTarget } from '../contracts/tuition-aid-workspace.js';
import { TUITION_AID_BOOT, tuitionAidViewer } from '../apps/finance/tuition-aid-workspace.js';

function env(role = 'finance', permissions = { finance: 'edit', tuitionaid: 'edit' }) {
  const calls = [];
  return { ENVIRONMENT: 'production', FINANCE_CONTRACT_API_KEY: 'key', RELEASE_SHA: 'test', calls,
    FINANCE_DB: { prepare: (sql) => ({ sql }) },
    CONNECT_SERVICE: { async fetch(req) {
      if (new URL(req.url).pathname.endsWith('staff-role-v1')) return Response.json({ role, permissions, username: 'tester' });
      calls.push({ url: req.url, method: req.method, headers: Object.fromEntries(req.headers), body: await req.text() });
      return Response.json({ students: [] }, { headers: { 'Set-Cookie': 'not-forwarded' } });
    } },
  };
}
const call = (e, path, init = {}) => worker.fetch(new Request('https://finance.test' + path, { ...init, headers: { 'Cf-Access-Jwt-Assertion': 'jwt', ...(init.headers || {}) } }), e);

describe('Tuition Aid planner in Finance', () => {
  it('serves Connect’s planner and its pop-up forms, starting the planner without Connect’s app', async () => {
    const r = await call(env(), '/tuition-aid');
    const html = await r.text();
    expect(r.status).toBe(200);
    expect(r.headers.get('content-security-policy')).toContain("connect-src 'self'");
    expect(r.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(html).toContain('id="tab-tuitionaid"');
    for (const id of ['tap-student-modal', 'tap-link-modal', 'tap-history-modal', 'tap-past-add-modal', 'tap-import-modal']) expect(html).toContain(`id="${id}"`);
    expect(html).not.toContain('id="tab-people"');
    expect(html).not.toContain('id="tab-finance"');
    expect(html).toContain('/accounting/app.js?v=test');
    expect(html).toContain('loadTuitionAid()');
    // Connect's stylesheet pins the body to one screen (Connect scrolls an inner panel); here the
    // whole page must scroll or everything below the charts is unreachable.
    expect(html).toContain('html,body{height:auto!important;overflow:auto!important}');
    for (const script of [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]) expect(() => new vm.Script(script[1])).not.toThrow();
    expect(TUITION_AID_BOOT).toContain('/api/v1/tuition-aid-workspace?path=');
  });

  it('is a Finance menu section framed around the planner, for Tuition Aid access only', async () => {
    const page = await (await call(env(), '/?section=tuition')).text();
    expect(page).toContain('<h1 class="page-title">Tuition Aid</h1>');
    expect(page).toContain('<iframe class="tuition-frame" src="/tuition-aid"');
    const staff = env('staff', { finance: 'none', tuitionaid: 'none' });
    expect((await call(staff, '/tuition-aid')).status).toBe(403);
    expect((await call(env('council', { tuitionaid: 'none', compensation: 'edit' }), '/tuition-aid')).status).toBe(403);
    expect((await call(env('council', { tuitionaid: 'view' }), '/tuition-aid')).status).toBe(200);
    expect((await call(env('admin', {}), '/tuition-aid')).status).toBe(200);
    expect(tuitionAidViewer({ ok: true, role: 'compensation', permissions: { tuitionaid: 'edit' } })).toBeNull();
  });

  it('relays only the planner’s own calls, with the caller’s identity and nothing else', async () => {
    const e = env();
    const r = await call(e, '/api/v1/tuition-aid-workspace?path=' + encodeURIComponent('tuition-aid/students/7'), {
      method: 'PATCH', body: '{"outside_aid_cents":50000}', headers: { 'Content-Type': 'application/json', Origin: 'https://finance.test', Cookie: 'x', 'X-Role': 'admin' },
    });
    expect(r.status).toBe(200);
    expect(r.headers.get('set-cookie')).toBeNull();
    expect(e.calls[0].url).toBe('https://connect.timothystl.org/api/contracts/tuition-aid-workspace-v1?path=tuition-aid%2Fstudents%2F7');
    expect(e.calls[0].headers).toMatchObject({ 'cf-access-jwt-assertion': 'jwt', 'x-contract-key': 'key' });
    expect(e.calls[0].headers.cookie).toBeUndefined();
    expect(e.calls[0].headers['x-role']).toBeUndefined();
    expect(e.calls[0].body).toBe('{"outside_aid_cents":50000}');
  });

  it('refuses view-only saves, cross-site writes, and unlisted targets before reaching Connect', async () => {
    const viewer = env('council', { tuitionaid: 'view' });
    expect((await call(viewer, '/api/v1/tuition-aid-workspace?path=tuition-aid%2Fconfig', { method: 'PATCH', body: '{}', headers: { Origin: 'https://finance.test' } })).status).toBe(403);
    expect((await call(viewer, '/api/v1/tuition-aid-workspace?path=tuition-aid%2Fstudents')).status).toBe(200);
    const e = env();
    expect((await call(e, '/api/v1/tuition-aid-workspace?path=tuition-aid%2Fconfig', { method: 'PATCH', body: '{}', headers: { 'Sec-Fetch-Site': 'cross-site' } })).status).toBe(403);
    for (const p of ['giving', 'finance/status', 'people', 'people/3', '../people?q=a']) {
      expect((await call(e, '/api/v1/tuition-aid-workspace?path=' + encodeURIComponent(p))).status).toBe(404);
    }
    expect(e.calls).toHaveLength(0);
    expect(tuitionAidWorkspaceTarget('tuition-aid/year-rates/2026-27', 'PUT')?.pathname).toBe('/admin/api/tuition-aid/year-rates/2026-27');
    expect(tuitionAidWorkspaceTarget('people?q=smith&limit=10', 'GET')?.search).toBe('?q=smith&limit=10');
  });
});
