import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { CONFIG_FIELDS, createTuitionModel, displayFamPct } from '../apps/finance/tuition-planner/model.js';
import { bundle } from './fixtures/tuition-planner-fixture.js';

// Finance's Tuition Aid planner (apps/finance/tuition-planner/model.js) is a port of Connect's
// former planner (src/frontend/js-tuition-aid.js, removed once Finance's planner shipped). Its
// answers on the fixture records were saved, before that removal, in
// fixtures/tuition-planner-legacy-answers.json: grades, awards, the budget pool, the pipeline, Apply
// Aid Policy, Auto-Balance and the pin promotion, for years -2..5 and three budget setups. The model
// must keep giving exactly those answers.
const LEGACY = JSON.parse(fs.readFileSync(new URL('./fixtures/tuition-planner-legacy-answers.json', import.meta.url), 'utf8'));

const round = (v) => (v == null ? v : Math.round(v * 1000) / 1000);
const split = (sp) => ({ t: round(sp.timothyAward), f: round(sp.familyOwed) });
const plain = (v) => JSON.parse(JSON.stringify(v));

for (const [key, name, config] of [['standalone', 'a standalone K-8 budget', {}], ['pool', 'a Total Timothy Aid pool', { timothy_total_budget_cents: '9000000' }], ['tight', 'a tight pool', { timothy_total_budget_cents: '3000000' }]]) {
  const L = LEGACY[key];
  describe(`Tuition planner model matches Connect's former planner, with ${name}`, () => {
    it('promotes the current year’s pins the same way', () => {
      const M = createTuitionModel(bundle(config));
      expect(M.promoteCurrentYearPins().map((p) => p.id)).toEqual([13]);
      const s13 = M.byId(13);
      expect({ outside: s13.outsideAid, famPct: s13.famPct, touched: s13.touched }).toEqual(L.promoted13);
    });

    it('gives the same grades, awards and shares for every student, this year and five ahead', () => {
      const M = createTuitionModel(bundle(config));
      M.promoteCurrentYearPins();
      for (let y = -2; y <= 5; y += 1) {
        const want = L.years[y];
        expect(M.tuitionForYear(y)).toBe(want.tuition);
        for (const s of M.roster) {
          expect(plain({ grade: M.gradeAt(s, y), split: split(M.splitFor(s, y)), famPct: M.famPctFor(s, y), outside: M.outsideAidFor(s, y), lhs: M.lhsAwardFor(s, y) }), `student ${s.id} y${y}`)
            .toEqual(want.students[s.id]);
        }
        if (y >= 0) {
          expect(M.projectedNeedByYear(y)).toEqual(want.need);
          const mp = M.pipelinePreviewForYear(y);
          expect(mp.k8.map((x) => [x.s.id, split(x.sp)])).toEqual(want.pipelineK8);
          expect(mp.lhs.map((x) => [x.s.id, x.lhsVal])).toEqual(want.pipelineLhs);
          const lhsTotal = M.enrolledActiveForYear(y).filter((x) => x.bucket === 'LHS').reduce((n, x) => n + M.lhsAwardFor(x.s, y), 0);
          expect(M.k8BudgetFor(lhsTotal)).toBe(want.k8Budget);
        }
      }
    });

    for (const [action, legacyFn, modelFn] of [['Apply Aid Policy', 'tapApplyPolicy', 'applyPolicyUpdates'], ['Auto-Balance', 'tapAutoBalance', 'autoBalanceUpdates']]) {
      it(`${action} sets the same family shares in every year`, () => {
        for (let y = 0; y <= 5; y += 1) {
          const M = createTuitionModel(bundle(config));
          M.promoteCurrentYearPins();
          const byId = Object.fromEntries(M[modelFn](y).map((u) => [u.id, u.famPct]));
          for (const s of M.roster) {
            const got = s.id in byId ? byId[s.id] : M.famPctFor(s, y);
            expect(got, `${action} ${s.id} y${y}`).toBe(L.actions[legacyFn][y][s.id]);
          }
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

// Carried over from Connect's former planner tests (family-share display, year-pin promotion,
// settings defaults), now against Finance's model.
describe('Tuition planner model: behavior kept from Connect’s planner', () => {
  const one = (over, config = {}, studentYears = []) => createTuitionModel({ config: { base_school_year: '2026', ...config }, students: [{
    id: 3, family: 'Sample', child: 'Ada', is_pipeline: 0, base_grade: '3', outside_aid_cents: 0, fam_pct: 50, fam_pct_orig: 50,
    touched: 0, lhs_award_cents: 0, lhs_award_orig_cents: 0, attends_lhs: 1, ...over }], studentYears });

  it('shows the effective 0% family share once outside aid covers the assigned share, keeping the stored figure', () => {
    const M = one({ outside_aid_cents: 690000, fam_pct: 81, fam_pct_orig: 81, timothy_award_exact_cents: 160000, family_owed_exact_cents: 0 });
    const s = M.byId(3);
    const sp = M.splitFor(s, 0);
    expect(sp).toEqual({ timothyAward: 1600, familyOwed: 0 });
    expect(displayFamPct(M.famPctFor(s, 0), sp, M.tuitionForYear(0))).toBe(0);
    expect(s.famPct).toBe(81);
  });

  it('keeps showing the assigned share while the family still owes something', () => {
    const M = one({ outside_aid_cents: 600000, fam_pct: 76, fam_pct_orig: 76, timothy_award_exact_cents: 200000, family_owed_exact_cents: 50000 });
    const s = M.byId(3);
    expect(displayFamPct(M.famPctFor(s, 0), M.splitFor(s, 0), M.tuitionForYear(0))).toBe(76);
  });

  it('promotes a pin saved for the year that is now current, including a typed award, and only once', () => {
    const pin = { student_id: 3, school_year: '2026-27', grade: '', outside_aid_cents: 100000, fam_pct: 30, timothy_award_cents: 450000, family_owed_cents: 300000, lhs_award_cents: 90000, note: '' };
    const M = one({}, {}, [pin]);
    expect(M.promoteCurrentYearPins()).toEqual([{ id: 3, fields: { outside_aid_cents: 100000, lhs_award_cents: 90000, fam_pct: 30, touched: 1, timothy_award_override_cents: 450000, family_owed_override_cents: 300000 } }]);
    expect(M.splitFor(M.byId(3), 0)).toEqual({ timothyAward: 4500, familyOwed: 3000 });
    expect(M.promoteCurrentYearPins()).toEqual([]);
  });

  it('never promotes over an edited or overridden record, a pipeline child, or a pin for another year', () => {
    const pin = (id, year = '2026-27') => ({ student_id: id, school_year: year, grade: '', outside_aid_cents: 1, fam_pct: 1, timothy_award_cents: null, family_owed_cents: null, lhs_award_cents: null, note: '' });
    expect(one({ touched: 1 }, {}, [pin(3)]).promoteCurrentYearPins()).toEqual([]);
    expect(one({ timothy_award_override_cents: 1000 }, {}, [pin(3)]).promoteCurrentYearPins()).toEqual([]);
    expect(one({ is_pipeline: 1, birth_year: 2021 }, {}, [pin(3)]).promoteCurrentYearPins()).toEqual([]);
    expect(one({}, {}, [pin(3, '2027-28')]).promoteCurrentYearPins()).toEqual([]);
  });

  it('falls back to the documented settings when none are stored', () => {
    const M = createTuitionModel({ config: {}, students: [] });
    expect(Object.fromEntries(CONFIG_FIELDS.map((f) => [f.key, M.cfgNum(f.key, f.def)]))).toEqual({
      tuition_base_cents: 850000, tuition_growth_pct: 6, lhs_standard_rate_cents: 120000, lhs_max_award_cents: 250000,
      timothy_min_award_cents: 200000, family_share_cap_pct: 50, default_pipeline_fam_pct: 50, base_school_year: 2026,
    });
    expect(M.tuitionForYear(0)).toBe(8500);
    expect(M.k8BudgetFor(0)).toBe(75000);
  });
});
