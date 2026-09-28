import { describe, it, expect } from 'vitest';
import vm from 'node:vm';
import { CHMS_APP_CORE_JS, CHMS_APP_EXT_JS } from '../src/html-chms.js';
import { createTuitionModel } from '../apps/finance/tuition-planner/model.js';

// Finance's Tuition Aid planner (apps/finance/tuition-planner/model.js) is a port of Connect's
// planner math. These run both on the same records, year by year, and require the same answers:
// grades, awards, the budget pool, Apply Aid Policy, Auto-Balance and the pin promotion.

function legacy(bundle) {
  const el = (id) => ({
    id, innerHTML: '', textContent: '', value: '', style: {}, dataset: {}, disabled: false, checked: false,
    files: [], classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild() {}, addEventListener() {}, querySelector() { return null; },
    querySelectorAll() { return []; }, setAttribute() {}, focus() {}, closest() { return { querySelectorAll: () => [] }; },
  });
  const store = {};
  const ctx = {
    document: {
      getElementById(id) { return store[id] || (store[id] = el(id)); },
      querySelector() { return null; }, querySelectorAll() { return []; },
      createElement: () => el('x'), addEventListener() {}, body: el('body'), activeElement: null,
    },
    console, setTimeout: () => 0, clearTimeout() {}, Math, JSON, Date, parseFloat, parseInt, isFinite,
    Number, String, Object, Array, Promise, encodeURIComponent, decodeURIComponent,
    localStorage: { getItem() { return null; }, setItem() {} },
    FormData: class { append() {} }, navigator: {}, location: { href: '', hash: '' },
    addEventListener() {}, removeEventListener() {}, scrollTo() {}, requestAnimationFrame() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    URL: { createObjectURL: () => '', revokeObjectURL() {} }, confirm: () => true,
    fetch: () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) }),
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(CHMS_APP_CORE_JS, ctx, { filename: 'app-core.js' });
  vm.runInContext(CHMS_APP_EXT_JS, ctx, { filename: 'app-ext.js' });
  ctx.tapApplyBundle(JSON.parse(JSON.stringify(bundle)));
  return ctx;
}

const student = (id, over) => ({
  id, person_id: null, household_id: null, family: `Family${id}`, child: `Child${id}`, is_pipeline: 0, base_grade: '3',
  birth_year: null, outside_aid_cents: 0, fam_pct: 40, fam_pct_orig: 40, touched: 0, lhs_award_cents: 120000,
  lhs_award_orig_cents: 120000, attends_lhs: 1, timothy_award_exact_cents: null, family_owed_exact_cents: null,
  timothy_award_override_cents: null, family_owed_override_cents: null, note: '', active: 1, sort_order: id, ...over,
});

// Fictional records covering every path: seeded exact figures, a typed award, outside aid larger
// than the share, grade 8 leaving and staying, LHS over the maximum, pipeline by birth year and by
// entered grade, future-year pins (percent, dollars, outside aid, LHS), a pin for the current year
// awaiting promotion, and a year with its tuition on file.
function bundle(config = {}) {
  return {
    config: { base_school_year: '2026', tuition_base_cents: '850000', tuition_growth_pct: '6', k8_budget_cents: '7500000',
      lhs_standard_rate_cents: '120000', lhs_max_award_cents: '250000', timothy_min_award_cents: '200000',
      family_share_cap_pct: '50', default_pipeline_fam_pct: '50', ...config },
    history: [{ school_year: '2025-26', tuition_cents: 810000, family_pct: 31 }],
    yearRates: [{ school_year: '2027-28', tuition_cents: 905000 }],
    students: [
      student(1, { base_grade: 'K', fam_pct: 30, fam_pct_orig: 30, timothy_award_exact_cents: 595000, family_owed_exact_cents: 255000 }),
      student(2, { base_grade: '2', outside_aid_cents: 400000, fam_pct: 35, fam_pct_orig: 35 }),
      student(3, { base_grade: '5', fam_pct: 60, fam_pct_orig: 55, touched: 1, timothy_award_override_cents: 300000, family_owed_override_cents: 550000 }),
      student(4, { base_grade: '8', fam_pct: 45, fam_pct_orig: 45 }),
      student(5, { base_grade: '8', fam_pct: 20, fam_pct_orig: 20, attends_lhs: 0 }),
      student(6, { base_grade: '10', lhs_award_cents: 300000 }),
      student(7, { base_grade: '12', lhs_award_cents: 150000 }),
      student(8, { base_grade: 'PK 4', fam_pct: 50, fam_pct_orig: 50 }),
      student(9, { base_grade: '7', outside_aid_cents: 100000, fam_pct: 10, fam_pct_orig: 10 }),
      student(10, { is_pipeline: 1, base_grade: '', birth_year: 2022, fam_pct: 50, fam_pct_orig: 50 }),
      student(11, { is_pipeline: 1, base_grade: 'PK 4', birth_year: 2021, fam_pct: 45, fam_pct_orig: 45 }),
      student(12, { is_pipeline: 1, base_grade: '', birth_year: 2025, fam_pct: 50, fam_pct_orig: 50 }),
      student(13, { base_grade: '1', fam_pct: 25, fam_pct_orig: 25 }),
    ],
    studentYears: [
      { student_id: 2, school_year: '2027-28', grade: '', outside_aid_cents: 350000, fam_pct: 42, timothy_award_cents: null, family_owed_cents: null, lhs_award_cents: null, note: '', family: 'Family2', child: 'Child2' },
      { student_id: 9, school_year: '2028-29', grade: '', outside_aid_cents: null, fam_pct: null, timothy_award_cents: 410000, family_owed_cents: 500000, lhs_award_cents: null, note: '', family: 'Family9', child: 'Child9' },
      { student_id: 4, school_year: '2027-28', grade: '', outside_aid_cents: null, fam_pct: null, timothy_award_cents: null, family_owed_cents: null, lhs_award_cents: 180000, note: '', family: 'Family4', child: 'Child4' },
      { student_id: 10, school_year: '2028-29', grade: '', outside_aid_cents: 50000, fam_pct: 30, timothy_award_cents: null, family_owed_cents: null, lhs_award_cents: null, note: '', family: 'Family10', child: 'Child10' },
      { student_id: 13, school_year: '2026-27', grade: '', outside_aid_cents: 20000, fam_pct: 33, timothy_award_cents: null, family_owed_cents: null, lhs_award_cents: null, note: '', family: 'Family13', child: 'Child13' },
      { student_id: 1, school_year: '2024-25', grade: 'PK 4', outside_aid_cents: 0, fam_pct: null, timothy_award_cents: 300000, family_owed_cents: 400000, lhs_award_cents: null, note: '', family: 'Family1', child: 'Child1' },
    ],
  };
}

const round = (v) => (v == null ? v : Math.round(v * 1000) / 1000);
const split = (sp) => ({ t: round(sp.timothyAward), f: round(sp.familyOwed) });

for (const [name, config] of [['a standalone K-8 budget', {}], ['a Total Timothy Aid pool', { timothy_total_budget_cents: '9000000' }], ['a tight pool', { timothy_total_budget_cents: '3000000' }]]) {
  describe(`Tuition planner model matches Connect's planner, with ${name}`, () => {
    it('promotes the current year’s pins the same way', () => {
      const L = legacy(bundle(config));
      const M = createTuitionModel(bundle(config));
      const promoted = M.promoteCurrentYearPins();
      expect(promoted.map((p) => p.id)).toEqual([13]);
      const s13 = M.byId(13);
      const l13 = L.tapById(13);
      expect({ o: s13.outsideAid, p: s13.famPct, t: s13.touched }).toEqual({ o: l13.outsideAid, p: l13.famPct, t: l13.touched });
    });

    it('gives the same grades, awards and shares for every student, this year and five ahead', () => {
      const L = legacy(bundle(config));
      const M = createTuitionModel(bundle(config));
      M.promoteCurrentYearPins();
      for (let y = -2; y <= 5; y += 1) {
        expect(M.tuitionForYear(y)).toBe(L.tapTuitionForYear(y));
        for (const s of M.roster) {
          const ls = L.tapById(s.id);
          expect(M.gradeAt(s, y), `grade ${s.id} y${y}`).toEqual(L.tapGradeAt(ls, y));
          expect(split(M.splitFor(s, y)), `split ${s.id} y${y}`).toEqual(split(L.tapSplitFor(ls, y)));
          expect(M.famPctFor(s, y)).toEqual(L.tapFamPctFor(ls, y));
          expect(M.outsideAidFor(s, y)).toEqual(L.tapOutsideAidFor(ls, y));
          expect(M.lhsAwardFor(s, y)).toEqual(L.tapLhsAwardFor(ls, y));
        }
        if (y >= 0) {
          expect(M.projectedNeedByYear(y)).toEqual(L.tapProjectedNeedByYear(y));
          const lp = L.tapPipelinePreviewForYear(y);
          const mp = M.pipelinePreviewForYear(y);
          expect(mp.k8.map((x) => [x.s.id, split(x.sp)])).toEqual(lp.k8.map((x) => [x.s.id, split(x.sp)]));
          expect(mp.lhs.map((x) => [x.s.id, x.lhsVal])).toEqual(lp.lhs.map((x) => [x.s.id, x.lhsVal]));
          const lhsTotal = M.enrolledActiveForYear(y).filter((x) => x.bucket === 'LHS').reduce((n, x) => n + M.lhsAwardFor(x.s, y), 0);
          expect(M.k8BudgetFor(lhsTotal)).toBe(L.tapK8BudgetFor(lhsTotal));
        }
      }
    });

    for (const [action, legacyFn, modelFn] of [['Apply Aid Policy', 'tapApplyPolicy', 'applyPolicyUpdates'], ['Auto-Balance', 'tapAutoBalance', 'autoBalanceUpdates']]) {
      it(`${action} sets the same family shares in every year`, () => {
        for (let y = 0; y <= 5; y += 1) {
          const L = legacy(bundle(config));
          const M = createTuitionModel(bundle(config));
          M.promoteCurrentYearPins();
          const updates = M[modelFn](y);
          L._tapYearIdx = y;
          vm.runInContext(`_tapYearIdx = ${y}; ${legacyFn}();`, L);
          for (const u of updates) expect(u.famPct, `${action} ${u.id} y${y}`).toBe(L.tapFamPctFor(L.tapById(u.id), y));
        }
      });
    }
  });
}

describe('Tuition planner model: pages', () => {
  it('a tight pool really does move family shares, so the parity checks above compare real changes', () => {
    const M = createTuitionModel(bundle({ timothy_total_budget_cents: '3000000' }));
    const before = Object.fromEntries(M.roster.map((s) => [s.id, M.famPctFor(s, 0)]));
    expect(M.autoBalanceUpdates(0).filter((u) => u.famPct > before[u.id]).length).toBeGreaterThan(3);
    expect(M.applyPolicyUpdates(0).some((u) => u.famPct !== before[u.id])).toBe(true);
  });

  it('reads the headline figures and planner rows the way Connect’s planner draws them', () => {
    const M = createTuitionModel(bundle());
    M.promoteCurrentYearPins();
    const k = M.kpis();
    // K, 1, 2, 5, 7, two 8th graders (PK 4 is not a K-8 aid student); two in LHS.
    expect(k.k8Count).toBe(7);
    expect(k.lhsCount).toBe(2);
    const next = M.plannerRows(1);
    expect(next.lhs.find((r) => r.s.id === 4)).toMatchObject({ justGraduated: true, lhsVal: 1800 });
    expect(next.lhs.find((r) => r.s.id === 5)).toBeUndefined(); // not attending LHS
    expect(M.plannerRows(0).lhs.find((r) => r.s.id === 6).lhsVal).toBe(2500); // capped at the maximum
    expect(M.pathway().grads.map((x) => x.s.id)).toEqual([4, 5]);
    expect(M.pathway().soonPipeline.map((s) => s.id)).toEqual([12]);
  });
});
