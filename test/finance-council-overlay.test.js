import { describe, expect, it } from 'vitest';
import worker from '../apps/finance/shell.js';
import {
  buildCouncilOverlayFromForm, councilPlannerKey, saveCouncilOverlay,
} from '../apps/finance/compensation-council-overlay.js';
import { councilPlannerKey as connectCouncilPlannerKey } from '../src/api-finance.js';

// Council's own raise-plan writer in Finance (Andrew, 2026-09-25).

const LIVE_COMPENSATION = {
  contract: 'connect.finance-compensation.v1', dataClassification: 'aggregate',
  sourceProduct: 'connect', consumerProduct: 'finance', currency: 'USD', generatedAt: '2026-09-14T12:00:00Z',
  workers: [{
    name: 'Test Worker A', position: 'Fictional Director', accountCode: '', role: 'other',
    trackKey: '', education: 'bachelors', yearsExperience: 3, responsibilityStipend: 0,
    attendanceBonus: 0, selfEmployedFica: false, hasDependents: false, healthEnrolled: true,
    hideFromCouncil: false, currentPayCents: 5000000, currentPaySource: 'entered',
  }],
  totals: { workerCount: 1, enteredCurrentPayCount: 1, unenteredCurrentPayCount: 0, enteredCurrentPayCents: 5000000 },
  reconciliation: { workerCount: 1, totalsMatch: true },
};

// The plan exactly as Connect resolves it for this council member: hidden workers already removed,
// their saved draft already laid over the shared plan.
const COUNCIL_PLAN = {
  roster: [{ name: 'Test Worker A', position: 'Fictional Director' }, { name: 'Test Worker B' }],
  compMethod: 'custom', compCustomPct: 3.5, compPerWorkerMethod: { 1: 'worksheet' },
};

function fakeFinanceDb() {
  const writes = [];
  return {
    writes,
    prepare(sql) { return { bind: (...args) => ({ run: async () => { writes.push({ sql, args }); return {}; } }) }; },
  };
}

function env({ role = 'council', compensation = 'edit', username = 'elder1', plan = COUNCIL_PLAN, db = fakeFinanceDb() } = {}) {
  return {
    ENVIRONMENT: 'staging', RELEASE_SHA: 'test', FINANCE_CONTRACT_API_KEY: 'k', FINANCE_DB: db,
    CONNECT_SERVICE: {
      async fetch(req) {
        const { pathname } = new URL(req.url);
        if (pathname === '/api/contracts/staff-role-v1') {
          return new Response(JSON.stringify({ role, identity: 'elder@timothystl.org', username, permissions: { compensation } }));
        }
        if (pathname === '/api/contracts/finance-compensation-v1') return new Response(JSON.stringify(LIVE_COMPENSATION));
        if (pathname === '/api/contracts/finance-compensation-plan-v1') return new Response(JSON.stringify({ data: plan }));
        return new Response('nf', { status: 404 });
      },
    },
  };
}

const JWT = { 'Cf-Access-Jwt-Assertion': 'signed.jwt' };

function save(e, pairs) {
  return worker.fetch(new Request('https://finance.test/api/v1/compensation-council-overlay-save', {
    method: 'POST', headers: { ...JWT, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(pairs).toString(),
  }), e);
}

describe('councilPlannerKey', () => {
  it('matches Connect exactly, so existing drafts are found where Connect reads them', () => {
    for (const name of ['elder1', 'Elder.One', 'o’brien', 'a b-c_d']) expect(councilPlannerKey(name)).toBe(connectCouncilPlannerKey(name));
  });
});

describe('buildCouncilOverlayFromForm', () => {
  const form = (pairs) => new URLSearchParams(pairs);
  it('keeps per-worker choices only for visible staff and treats "default" as no override', () => {
    const { overlay } = buildCouncilOverlayFromForm(form([
      ['comp_method', 'cola'], ['worker_method_0', 'default'], ['worker_method_1', 'scalepct'], ['worker_method_5', 'custom'],
      ['comp_scale_pct', '90'],
    ]), 2);
    expect(overlay).toEqual({ compMethod: 'cola', compPerWorkerMethod: { 1: 'scalepct' }, compBaselineRosterOnly: false, compScalePct: 90 });
  });
  it('rejects unknown methods and out-of-range percentages', () => {
    expect(buildCouncilOverlayFromForm(form([['comp_method', 'bonus']]), 1).error).toMatch(/raise method/);
    expect(buildCouncilOverlayFromForm(form([['comp_method', 'cola'], ['worker_method_0', 'bonus']]), 1).error).toMatch(/Unknown/);
    expect(buildCouncilOverlayFromForm(form([['comp_method', 'custom'], ['comp_custom_pct', '150']]), 1).error).toMatch(/between -100 and 100/);
    expect(buildCouncilOverlayFromForm(form([['comp_method', 'custom'], ['comp_custom_pct', '-3']]), 1).overlay.compCustomPct).toBe(-3);
    expect(buildCouncilOverlayFromForm(form([['comp_method', 'scalepct'], ['comp_scale_pct', '-5']]), 1).error).toMatch(/between 0 and 100/);
  });
});

describe('saveCouncilOverlay', () => {
  it('writes only council fields to the member’s own finance_settings row', async () => {
    const db = fakeFinanceDb();
    await saveCouncilOverlay(db, 'elder1', { compMethod: 'none', roster: [{ name: 'smuggled' }] });
    expect(db.writes).toHaveLength(1);
    expect(db.writes[0].args).toEqual(['finance_salary_planner_council_elder1', JSON.stringify({ compMethod: 'none' })]);
  });
  it('refuses without a username or database', async () => {
    expect((await saveCouncilOverlay(fakeFinanceDb(), '', {})).ok).toBe(false);
    expect((await saveCouncilOverlay(null, 'elder1', {})).ok).toBe(false);
  });
});

// The Plan page's form editor for this route is retired with Plan (new view): council members
// steer their draft on the Planner, whose saves land in the same Finance row. The route remains.
describe('Compensation plan page', () => {
  it('sends council to the Planner, where their draft is edited', async () => {
    const res = await worker.fetch(new Request('https://finance.test/?section=compensation&page=plan', { headers: JWT }), env());
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('/?section=compensation&page=planner');
  });
});

describe('POST /api/v1/compensation-council-overlay-save', () => {
  it('saves the member’s draft into Finance’s own database and redirects back', async () => {
    const db = fakeFinanceDb();
    const res = await save(env({ db }), [['comp_method', 'scalepct'], ['comp_scale_pct', '95'], ['worker_method_0', 'cola']]);
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('/?section=compensation&page=planner&status=ok');
    expect(db.writes[0].args[0]).toBe('finance_salary_planner_council_elder1');
    expect(JSON.parse(db.writes[0].args[1])).toEqual({ compMethod: 'scalepct', compPerWorkerMethod: { 0: 'cola' }, compScalePct: 95, compBaselineRosterOnly: false });
  });
  it('refuses anyone but council with compensation edit, and writes nothing', async () => {
    for (const e of [env({ role: 'admin' }), env({ compensation: 'view' }), env({ username: '' })]) {
      const res = await save(e, [['comp_method', 'cola']]);
      const location = new URL(res.headers.get('location'), 'https://finance.test');
      expect(location.searchParams.get('reason')).toBe('access_denied');
      expect(e.FINANCE_DB.writes).toHaveLength(0);
    }
  });
  it('writes nothing when the plan cannot be read', async () => {
    const db = fakeFinanceDb();
    const e = env({ db });
    const inner = e.CONNECT_SERVICE.fetch;
    e.CONNECT_SERVICE = { fetch: async (req) => (new URL(req.url).pathname === '/api/contracts/finance-compensation-plan-v1' ? new Response('{"error":"down"}', { status: 503 }) : inner(req)) };
    const res = await save(e, [['comp_method', 'cola']]);
    expect(new URL(res.headers.get('location'), 'https://finance.test').searchParams.get('status')).toBe('error');
    expect(db.writes).toHaveLength(0);
  });
});
