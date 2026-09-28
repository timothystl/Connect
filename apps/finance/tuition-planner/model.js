// The Tuition Aid planner's figures, as Finance code. Every function here is a line-for-line port
// of Connect's planner (src/frontend/js-tuition-aid.js: tapGradeAt, tapSplitFor, tapApplyPolicy,
// ...) over one state object instead of page globals, so the award math, grade progression and
// budget pool behave exactly as they did in Connect. test/finance-tuition-planner-model.test.js
// runs both side by side on the same records.
//
// Money in the model is dollars (the saved records are cents), as in Connect's planner.

export const GRADE_SEQ = ['PK 3', 'PK 4', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export const CONFIG_FIELDS = [
  { key: 'tuition_base_cents', kind: 'cents', def: 850000, label: 'Base K-8 tuition rate', unit: '$' },
  { key: 'tuition_growth_pct', kind: 'pct', def: 6, label: 'Annual tuition growth', unit: '%/yr', step: '0.1' },
  { key: 'lhs_standard_rate_cents', kind: 'cents', def: 120000, label: 'Standard LHS award', unit: '$' },
  { key: 'lhs_max_award_cents', kind: 'cents', def: 250000, label: 'Maximum LHS award', unit: '$' },
  { key: 'timothy_min_award_cents', kind: 'cents', def: 200000, label: 'Minimum Timothy award', unit: '$' },
  { key: 'family_share_cap_pct', kind: 'pct', def: 50, label: 'Family share cap', unit: '%', max: 100 },
  { key: 'default_pipeline_fam_pct', kind: 'pct', def: 50, label: 'Default pipeline family share', unit: '%', max: 100 },
  { key: 'base_school_year', kind: 'year', def: 2026, label: 'Current school year starts', unit: '' },
];

export function schoolYearLabel(y) {
  const yy = (y + 1) % 100;
  return `${y}-${yy < 10 ? `0${yy}` : yy}`;
}

export function fromServerRow(r) {
  return {
    id: r.id, personId: r.person_id || null, householdId: r.household_id || null,
    family: r.family || '', child: r.child || '',
    isPipeline: !!r.is_pipeline, baseGrade: r.base_grade || '', birthYear: r.birth_year || null,
    outsideAid: (r.outside_aid_cents || 0) / 100,
    famPct: r.fam_pct, famPctOrig: r.fam_pct_orig, touched: !!r.touched,
    lhsAward: (r.lhs_award_cents || 0) / 100, lhsAwardOrig: (r.lhs_award_orig_cents || 0) / 100,
    attendsLHS: r.attends_lhs !== 0,
    timothyAwardExact: r.timothy_award_exact_cents != null ? r.timothy_award_exact_cents / 100 : null,
    familyOwedExact: r.family_owed_exact_cents != null ? r.family_owed_exact_cents / 100 : null,
    timothyAwardOverride: r.timothy_award_override_cents != null ? r.timothy_award_override_cents / 100 : null,
    familyOwedOverride: r.family_owed_override_cents != null ? r.family_owed_override_cents / 100 : null,
    note: r.note || '',
  };
}

export function nextGrade(g) {
  if (g === 'Graduated') return 'Graduated';
  const i = GRADE_SEQ.indexOf(g);
  if (i === -1) return '?';
  return i + 1 >= GRADE_SEQ.length ? 'Graduated' : GRADE_SEQ[i + 1];
}

export function gradeAtYear(baseGrade, yearIdx) {
  let g = baseGrade;
  for (let i = 0; i < yearIdx; i += 1) g = nextGrade(g);
  return g;
}

export function bucketOf(g) {
  if (g === 'Graduated') return 'Graduated';
  if (['9', '10', '11', '12'].includes(g)) return 'LHS';
  return 'K8';
}

export function computeSplit(tuition, outsideAid, pct) {
  const familyRaw = tuition * (pct / 100);
  const familyOwed = Math.max(0, familyRaw - outsideAid);
  const timothyAward = Math.max(0, tuition - outsideAid - familyOwed);
  return { familyOwed, timothyAward };
}

export function pctFromFamilyOwed(tuition, outsideAid, familyOwed) {
  if (tuition <= 0) return 0;
  const familyRaw = Math.min(tuition, familyOwed + outsideAid);
  return Math.max(0, Math.min(100, Math.round((familyRaw / tuition) * 100)));
}

// Display only: once a family truly owes nothing, show the real effective share (0%) rather than
// the stored figure, which then only reflects outside aid (Connect's tapDisplayFamPct).
export function displayFamPct(famPctVal, sp, tuition) {
  if (sp.familyOwed > 0.005) return famPctVal;
  return tuition > 0 ? Math.round((sp.familyOwed / tuition) * 100) : 0;
}

const isPk = (g) => g === 'PK 3' || g === 'PK 4';

// The planner state: the saved bundle from /api/v1/tuition (students, config, history, year rates,
// per-student year pins), plus the helpers every view reads through.
export function createTuitionModel(bundle) {
  const M = {
    config: { ...(bundle.config || {}) },
    history: bundle.history || [],
    roster: (bundle.students || []).map(fromServerRow),
    yearRates: {},
    studentYears: (bundle.studentYears || []).map((r) => ({ ...r })),
    pins: {},
    moved: bundle.moved || null,  // when the records came over from Connect
  };
  (bundle.yearRates || []).forEach((r) => { M.yearRates[r.school_year] = r.tuition_cents; });
  const indexPins = () => {
    M.pins = {};
    M.studentYears.forEach((row) => { M.pins[`${row.student_id}|${row.school_year}`] = row; });
  };
  indexPins();

  const cfgNum = (key, def) => {
    const n = parseFloat(M.config[key]);
    return Number.isNaN(n) ? def : n;
  };
  const baseYear = () => cfgNum('base_school_year', 2026);
  const yearLabel = (yearIdx) => schoolYearLabel(baseYear() + yearIdx);
  const byId = (id) => M.roster.find((s) => s.id === id);
  const pinFor = (studentId, yearIdx) => M.pins[`${studentId}|${yearLabel(yearIdx)}`] || null;

  function upsertPinLocal(studentId, yearIdx, fields) {
    const label = yearLabel(yearIdx);
    const key = `${studentId}|${label}`;
    let row = M.pins[key];
    if (!row) {
      const s = byId(studentId);
      row = { student_id: studentId, school_year: label, grade: '', outside_aid_cents: null, fam_pct: null,
        timothy_award_cents: null, family_owed_cents: null, lhs_award_cents: null, note: '',
        family: s ? s.family : '', child: s ? s.child : '' };
      M.pins[key] = row;
      M.studentYears.push(row);
    }
    Object.assign(row, fields);
    return row;
  }
  function removePinLocal(studentId, yearIdx) {
    const label = yearLabel(yearIdx);
    delete M.pins[`${studentId}|${label}`];
    M.studentYears = M.studentYears.filter((r) => !(r.student_id === studentId && r.school_year === label));
  }

  function gradeAt(s, yearIdx) {
    if (s.isPipeline) {
      // An entered grade ("this grade as of the current year") wins over the birth-year guess.
      if (s.baseGrade) return gradeAtYear(s.baseGrade, yearIdx);
      const seqIdx = baseYear() + yearIdx - (s.birthYear + 3);
      if (seqIdx < 0) return null;
      if (seqIdx >= GRADE_SEQ.length) return 'Graduated';
      return GRADE_SEQ[seqIdx];
    }
    return gradeAtYear(s.baseGrade, yearIdx);
  }
  function bucketFor(s, g) {
    if (g === null) return 'NotYet';
    const b = bucketOf(g);
    if (b === 'LHS' && s.attendsLHS === false) return 'Departed';
    return b;
  }
  // Everyone in school that year, pipeline included (the projection and enrollment charts).
  function activeForYear(yearIdx) {
    return M.roster.map((s) => {
      const grade = gradeAt(s, yearIdx);
      return { s, grade, bucket: bucketFor(s, grade) };
    }).filter((x) => !['Graduated', 'Departed', 'NotYet'].includes(x.bucket));
  }
  // Actually enrolled students only: a pipeline child counts once someone clicks Enroll.
  const enrolledActiveForYear = (yearIdx) => activeForYear(yearIdx).filter((x) => !x.s.isPipeline);

  function tuitionForYear(yearIdx) {
    const override = M.yearRates[yearLabel(yearIdx)];
    if (override != null) return override / 100;
    const base = cfgNum('tuition_base_cents', 850000) / 100;
    const growth = cfgNum('tuition_growth_pct', 6) / 100;
    return Math.round((base * (1 + growth) ** yearIdx) / 100) * 100;
  }
  function outsideAidFor(s, yearIdx) {
    const pin = yearIdx !== 0 ? pinFor(s.id, yearIdx) : null;
    return pin && pin.outside_aid_cents != null ? pin.outside_aid_cents / 100 : s.outsideAid;
  }
  function famPctFor(s, yearIdx) {
    const pin = yearIdx !== 0 ? pinFor(s.id, yearIdx) : null;
    return pin && pin.fam_pct != null ? pin.fam_pct : s.famPct;
  }
  function lhsAwardFor(s, yearIdx) {
    const pin = yearIdx !== 0 ? pinFor(s.id, yearIdx) : null;
    return pin && pin.lhs_award_cents != null ? pin.lhs_award_cents / 100 : s.lhsAward;
  }
  function splitAt(tuition, outsideAid, pct) {
    const r = computeSplit(tuition, outsideAid, pct);
    const minAward = cfgNum('timothy_min_award_cents', 200000) / 100;
    if (r.timothyAward < minAward) {
      r.timothyAward = minAward;
      r.familyOwed = Math.max(0, tuition - outsideAid - r.timothyAward);
    }
    return r;
  }
  // Priority: a year's typed $ figures, then this year's typed award, then the seeded exact
  // figures until the row is edited, then the formula.
  function splitFor(s, yearIdx) {
    const pin = yearIdx !== 0 ? pinFor(s.id, yearIdx) : null;
    if (pin && (pin.timothy_award_cents != null || pin.family_owed_cents != null)) {
      return {
        timothyAward: (pin.timothy_award_cents != null ? pin.timothy_award_cents : 0) / 100,
        familyOwed: (pin.family_owed_cents != null ? pin.family_owed_cents : 0) / 100,
      };
    }
    if (yearIdx === 0 && !s.isPipeline && s.timothyAwardOverride != null) {
      return { familyOwed: s.familyOwedOverride || 0, timothyAward: s.timothyAwardOverride };
    }
    if (yearIdx === 0 && !s.isPipeline && !s.touched && s.timothyAwardExact != null) {
      return { familyOwed: s.familyOwedExact, timothyAward: s.timothyAwardExact };
    }
    return splitAt(tuitionForYear(yearIdx), outsideAidFor(s, yearIdx), famPctFor(s, yearIdx));
  }
  function isOverridden(s, yearIdx) {
    if (yearIdx === 0) return s.timothyAwardOverride != null;
    const pin = pinFor(s.id, yearIdx);
    return !!(pin && pin.timothy_award_cents != null);
  }

  // Pipeline children previewed in a future year: planned figures, reported beside the budget but
  // never inside it until they are enrolled.
  function pipelinePreviewForYear(yearIdx) {
    const maxAward = cfgNum('lhs_max_award_cents', 250000) / 100;
    const k8 = [];
    const lhs = [];
    if (yearIdx === 0) return { k8, lhs };
    M.roster.forEach((s) => {
      if (!s.isPipeline) return;
      const pGrade = gradeAt(s, yearIdx);
      if (pGrade === null || pGrade === 'Graduated' || isPk(pGrade)) return;
      const pBucket = bucketOf(pGrade);
      if (pBucket === 'K8') {
        k8.push({ s, grade: pGrade, sp: splitFor(s, yearIdx), isOverridden: isOverridden(s, yearIdx),
          famPctVal: famPctFor(s, yearIdx), outsideAidVal: outsideAidFor(s, yearIdx), preview: true });
      } else if (pBucket === 'LHS') {
        lhs.push({ s, grade: pGrade, lhsVal: Math.min(lhsAwardFor(s, yearIdx), maxAward), justGraduated: false, preview: true });
      }
    });
    return { k8, lhs };
  }

  // One shared pool: LHS awards come off the Total Timothy Aid first; without a total, the
  // standalone K-8 budget applies.
  function k8BudgetFor(lhsTotal) {
    if (M.config.timothy_total_budget_cents != null) {
      return Math.max(0, cfgNum('timothy_total_budget_cents', 0) / 100 - lhsTotal);
    }
    return cfgNum('k8_budget_cents', 7500000) / 100;
  }

  // The K-8 and LHS rows the planner tables show for a year (current or future), previews last.
  function plannerRows(yearIdx) {
    const k8 = [];
    const lhs = [];
    const maxAward = cfgNum('lhs_max_award_cents', 250000) / 100;
    M.roster.forEach((s) => {
      if (s.isPipeline) return;
      const grade = gradeAt(s, yearIdx);
      const bucket = bucketFor(s, grade);
      const prevGrade = yearIdx > 0 ? gradeAt(s, yearIdx - 1) : null;
      if (['Graduated', 'Departed', 'NotYet'].includes(bucket)) return;
      if (bucket === 'K8') {
        if (isPk(grade)) return;
        k8.push({ s, grade, sp: splitFor(s, yearIdx), isOverridden: isOverridden(s, yearIdx),
          famPctVal: famPctFor(s, yearIdx), outsideAidVal: outsideAidFor(s, yearIdx) });
      } else if (bucket === 'LHS') {
        lhs.push({ s, grade, lhsVal: Math.min(lhsAwardFor(s, yearIdx), maxAward), justGraduated: prevGrade === '8' });
      }
    });
    const preview = pipelinePreviewForYear(yearIdx);
    return { k8: k8.concat(preview.k8), lhs: lhs.concat(preview.lhs) };
  }

  // The three budget gauges for a year (Connect's tapUpdateGauges, as numbers).
  function gauges(yearIdx) {
    const active = enrolledActiveForYear(yearIdx).filter((x) => !(x.bucket === 'K8' && isPk(x.grade)));
    const k8Active = active.filter((x) => x.bucket === 'K8');
    const lhsActive = active.filter((x) => x.bucket === 'LHS');
    const k8Total = k8Active.reduce((sum, x) => sum + splitFor(x.s, yearIdx).timothyAward, 0);
    const lhsTotal = lhsActive.reduce((sum, x) => sum + lhsAwardFor(x.s, yearIdx), 0);
    const lhsRate = cfgNum('lhs_standard_rate_cents', 120000) / 100;
    const preview = pipelinePreviewForYear(yearIdx);
    return {
      k8Total, lhsTotal, lhsCount: lhsActive.length, lhsRate, lhsReference: lhsActive.length * lhsRate,
      hasTotalBudget: M.config.timothy_total_budget_cents != null,
      totalBudget: cfgNum('timothy_total_budget_cents', 0) / 100,
      k8Budget: k8BudgetFor(lhsTotal),
      k8PipelineTotal: preview.k8.reduce((sum, x) => sum + x.sp.timothyAward, 0), k8PipelineCount: preview.k8.length,
      lhsPipelineTotal: preview.lhs.reduce((sum, x) => sum + x.lhsVal, 0), lhsPipelineCount: preview.lhs.length,
    };
  }

  // The six headline figures, always for the current year (Connect's tapRenderKpis).
  function kpis() {
    const active0 = enrolledActiveForYear(0);
    const k8Active = active0.filter((x) => x.bucket === 'K8' && !isPk(x.grade));
    const lhsActive = active0.filter((x) => x.bucket === 'LHS');
    let totalTimothy = 0;
    let totalFamily = 0;
    let totalOutside = 0;
    k8Active.forEach((x) => {
      const sp = splitFor(x.s, 0);
      totalTimothy += sp.timothyAward; totalFamily += sp.familyOwed; totalOutside += x.s.outsideAid;
    });
    return {
      k8Count: k8Active.length, lhsCount: lhsActive.length, tuition0: tuitionForYear(0),
      totalTimothy, totalFamily, totalOutside,
      totalLhs: lhsActive.reduce((sum, x) => sum + x.s.lhsAward, 0),
      k8Budget: cfgNum('k8_budget_cents', 7500000) / 100,
    };
  }

  function pathway() {
    const active0 = enrolledActiveForYear(0);
    const count = (list) => active0.filter((x) => list.includes(x.grade)).length;
    return {
      stages: [
        { label: 'PK 3–4', count: count(['PK 3', 'PK 4']) },
        { label: 'Kindergarten', count: count(['K']) },
        { label: 'Grades 1–7', count: count(['1', '2', '3', '4', '5', '6', '7']) },
        { label: 'Grade 8', count: count(['8']), hot: true },
        { label: 'LHS 9–12', count: count(['9', '10', '11', '12']) },
      ],
      grads: active0.filter((x) => x.grade === '8'),
      pk4: active0.filter((x) => x.grade === 'PK 4'),
      soonPipeline: M.roster.filter((s) => s.isPipeline && gradeAt(s, 0) === null && gradeAt(s, 2) !== null),
    };
  }

  // Baseline need for a projection year: original family shares and this year's outside aid,
  // pipeline included (Connect's tapProjectedNeedByYear).
  function projectedNeedByYear(yearIdx) {
    const active = activeForYear(yearIdx);
    const k8 = active.filter((x) => x.bucket === 'K8' && !isPk(x.grade));
    const lhs = active.filter((x) => x.bucket === 'LHS');
    const tuition = tuitionForYear(yearIdx);
    let timothyTotal = 0;
    k8.forEach((x) => { timothyTotal += splitAt(tuition, x.s.outsideAid, x.s.famPctOrig).timothyAward; });
    const lhsRate = cfgNum('lhs_standard_rate_cents', 120000) / 100;
    return { need: timothyTotal + lhs.length * lhsRate, k8Count: k8.length, lhsCount: lhs.length };
  }
  function projection() {
    const k8Budget = cfgNum('k8_budget_cents', 7500000) / 100;
    const lhsRate = cfgNum('lhs_standard_rate_cents', 120000) / 100;
    return [0, 1, 2, 3, 4, 5].map((i) => {
      const p = projectedNeedByYear(i);
      return { label: yearLabel(i), need: p.need, budget: k8Budget + p.lhsCount * lhsRate, k8Count: p.k8Count, lhsCount: p.lhsCount };
    });
  }

  // Apply Aid Policy: every family at the share cap with the Timothy floor, scaled down to fit the
  // K-8 budget, or with leftover budget given in proportion to what families still owe.
  function applyPolicyUpdates(yearIdx) {
    const active = enrolledActiveForYear(yearIdx).filter((x) => x.bucket === 'K8' && !isPk(x.grade));
    if (!active.length) return [];
    const tuition = tuitionForYear(yearIdx);
    const capPct = cfgNum('family_share_cap_pct', 50);
    const lhsTotal = enrolledActiveForYear(yearIdx).filter((x) => x.bucket === 'LHS')
      .reduce((sum, x) => sum + lhsAwardFor(x.s, yearIdx), 0);
    const k8Budget = k8BudgetFor(lhsTotal);
    const outsideAidOf = (s) => outsideAidFor(s, yearIdx);
    const alloc = active.map((x) => {
      const r = splitAt(tuition, outsideAidOf(x.s), capPct);
      return { s: x.s, timothy: r.timothyAward, family: r.familyOwed };
    });
    const total = alloc.reduce((sum, a) => sum + a.timothy, 0);
    if (total > k8Budget) {
      const raw = active.map((x) => {
        const r = computeSplit(tuition, outsideAidOf(x.s), capPct);
        return { s: x.s, timothy: r.timothyAward, family: r.familyOwed };
      });
      let rawTotal = raw.reduce((sum, a) => sum + a.timothy, 0);
      for (let pass = 0; pass < 12 && rawTotal > k8Budget; pass += 1) {
        const scale = k8Budget / rawTotal;
        raw.forEach((a) => { a.timothy *= scale; a.family = Math.max(0, tuition - outsideAidOf(a.s) - a.timothy); });
        rawTotal = raw.reduce((sum, a) => sum + a.timothy, 0);
      }
      return raw.map((a) => ({ id: a.s.id, famPct: pctFromFamilyOwed(tuition, outsideAidOf(a.s), a.family) }));
    }
    if (total < k8Budget) {
      const surplus = k8Budget - total;
      const capacity = alloc.reduce((sum, a) => sum + a.family, 0);
      if (capacity > 0) {
        const give = Math.min(1, surplus / capacity);
        alloc.forEach((a) => { const extra = a.family * give; a.timothy += extra; a.family -= extra; });
      }
    }
    return alloc.map((a) => ({ id: a.s.id, famPct: pctFromFamilyOwed(tuition, outsideAidOf(a.s), a.family) }));
  }

  // Auto-Balance: raise family shares proportionally until the K-8 awards fit the budget.
  function autoBalanceUpdates(yearIdx) {
    const active = enrolledActiveForYear(yearIdx).filter((x) => x.bucket === 'K8' && !isPk(x.grade));
    const tuition = tuitionForYear(yearIdx);
    const lhsTotal = enrolledActiveForYear(yearIdx).filter((x) => x.bucket === 'LHS')
      .reduce((sum, x) => sum + lhsAwardFor(x.s, yearIdx), 0);
    const k8Budget = k8BudgetFor(lhsTotal);
    const pctById = {};
    active.forEach((x) => { pctById[x.s.id] = famPctFor(x.s, yearIdx); });
    for (let pass = 0; pass < 12; pass += 1) {
      const total = active.reduce((sum, x) => sum + computeSplit(tuition, outsideAidFor(x.s, yearIdx), pctById[x.s.id]).timothyAward, 0);
      if (total <= k8Budget) break;
      const scale = k8Budget / total;
      active.forEach((x) => {
        const newShare = (1 - pctById[x.s.id] / 100) * scale;
        pctById[x.s.id] = Math.min(100, Math.max(0, Math.round((1 - newShare) * 100)));
      });
    }
    return active.map((x) => ({ id: x.s.id, famPct: pctById[x.s.id] }));
  }

  // A pin made while a year was still "next year" becomes the master row once that year is
  // current (Connect's tapPromoteCurrentYearPins). Returns the PATCH bodies; applies them locally.
  function promoteCurrentYearPins() {
    const label = yearLabel(0);
    const out = [];
    M.roster.forEach((s) => {
      if (s.isPipeline || s.touched || s.timothyAwardOverride != null) return;
      const pin = M.pins[`${s.id}|${label}`];
      if (!pin) return;
      const fields = {};
      if (pin.outside_aid_cents != null) { s.outsideAid = pin.outside_aid_cents / 100; fields.outside_aid_cents = pin.outside_aid_cents; }
      if (pin.lhs_award_cents != null) { s.lhsAward = pin.lhs_award_cents / 100; fields.lhs_award_cents = pin.lhs_award_cents; }
      if (pin.fam_pct != null) { s.famPct = pin.fam_pct; s.touched = true; fields.fam_pct = pin.fam_pct; fields.touched = 1; }
      if (pin.timothy_award_cents != null || pin.family_owed_cents != null) {
        s.timothyAwardOverride = (pin.timothy_award_cents != null ? pin.timothy_award_cents : 0) / 100;
        s.familyOwedOverride = (pin.family_owed_cents != null ? pin.family_owed_cents : 0) / 100;
        fields.timothy_award_override_cents = pin.timothy_award_cents;
        fields.family_owed_override_cents = pin.family_owed_cents;
      }
      if (Object.keys(fields).length) out.push({ id: s.id, fields });
    });
    return out;
  }

  return Object.assign(M, {
    cfgNum, baseYear, yearLabel, byId, pinFor, upsertPinLocal, removePinLocal, gradeAt, bucketFor,
    activeForYear, enrolledActiveForYear, tuitionForYear, outsideAidFor, famPctFor, lhsAwardFor,
    splitAt, splitFor, isOverridden, pipelinePreviewForYear, k8BudgetFor, plannerRows, gauges, kpis,
    pathway, projectedNeedByYear, projection, applyPolicyUpdates, autoBalanceUpdates,
    promoteCurrentYearPins,
  });
}
