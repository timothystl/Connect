// Fictional Tuition Aid records covering every planner path (see
// test/finance-tuition-planner-model.test.js). No real family is named.
const student = (id, over) => ({
  id, person_id: null, household_id: null, family: `Family${id}`, child: `Child${id}`, is_pipeline: 0, base_grade: '3',
  birth_year: null, outside_aid_cents: 0, fam_pct: 40, fam_pct_orig: 40, touched: 0, lhs_award_cents: 120000,
  lhs_award_orig_cents: 120000, attends_lhs: 1, timothy_award_exact_cents: null, family_owed_exact_cents: null,
  timothy_award_override_cents: null, family_owed_override_cents: null, note: '', active: 1, sort_order: id, ...over,
});

// Covers: seeded exact figures, a typed award, outside aid larger
// than the share, grade 8 leaving and staying, LHS over the maximum, pipeline by birth year and by
// entered grade, future-year pins (percent, dollars, outside aid, LHS), a pin for the current year
// awaiting promotion, and a year with its tuition on file.
export function bundle(config = {}) {
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

