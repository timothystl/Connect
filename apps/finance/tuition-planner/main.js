// Tuition Aid planner — Finance's own, on Tuition Aid › Overview / Planner / Past years / Settings.
//
// The same figures, controls and saves as Connect's planner, rebuilt as Finance code: every figure
// comes from model.js, loading and saving from state.js, and the pages from view.js. The whole view
// re-renders after each change, keeping focus and caret where they were; edits save shortly after.
import { S, canEdit, call, load, onStateChange, saveNow, savePin, saveStudent, hasPendingSaves } from './state.js';
import { renderPage, saveIndicator } from './view.js';
import {
  parseWorkbookAllSheets, detectMultiYearHistoryLayout, extractMultiYearHistory, extractHistoryRecords,
  extractFromRawWorkbook, buildImportRecords,
} from './xlsx-import.js';

let root;
const $ = (id) => document.getElementById(id);
const whole = (v) => Math.max(0, Math.round(+v || 0));

function body() {
  if (S.error && !S.loaded) return `<p class="status status-error">Tuition Aid could not load: ${S.error.replace(/</g, '&lt;')}</p>`;
  if (!S.loaded) return '<p class="status status-pending">Loading Tuition Aid…</p>';
  return renderPage(S.model);
}

function render() {
  const active = document.activeElement;
  const activeId = active && root.contains(active) ? active.id : '';
  const activeValue = activeId && typeof active.value === 'string' && active.type !== 'file' ? active.value : null;
  const selStart = active && typeof active.selectionStart === 'number' ? active.selectionStart : null;
  const selEnd = active && typeof active.selectionEnd === 'number' ? active.selectionEnd : null;
  // Values typed into the add forms survive a re-render.
  const drafts = [...root.querySelectorAll('input[id^="tp-pipe-"],input[id^="tp-past-"]:not(.tp-num),input[id^="tp-add-"],select[id^="tp-add-"],select[id^="tp-pipe-"],input[type=search]')]
    .map((el) => [el.id, el.value]);
  const scrollY = window.scrollY;
  root.innerHTML = body();
  drafts.forEach(([id, value]) => { const el = $(id); if (el && el.type !== 'checkbox') el.value = value; });
  if (activeId) {
    const restored = $(activeId);
    if (restored) {
      restored.focus({ preventScroll: true });
      if (activeValue != null && restored.value !== activeValue) restored.value = activeValue;
      if (selStart != null && restored.setSelectionRange) {
        try { restored.setSelectionRange(selStart, selEnd); } catch { /* not a text input */ }
      }
    }
  }
  window.scrollTo(0, scrollY);
}

function refreshStatus() {
  const slot = $('tp-save-slot');
  if (slot) slot.innerHTML = saveIndicator();
}

const M = () => S.model;
const reload = () => load();

// ── Row edits (Connect's tapOutsideAidChange, tapSliderChange, ...) ───────
function outsideAid(id, value) {
  const s = M().byId(id); if (!s) return;
  const d = whole(value); const cents = d * 100;
  if (S.year === 0) {
    s.outsideAid = d;
    if (s.timothyAwardOverride != null) {
      // Keep a typed Timothy award fixed; only what the family owes moves with outside aid.
      s.familyOwedOverride = Math.max(0, M().tuitionForYear(0) - d - s.timothyAwardOverride);
      saveStudent(id, { outside_aid_cents: cents, family_owed_override_cents: Math.round(s.familyOwedOverride * 100) });
    } else saveStudent(id, { outside_aid_cents: cents });
  } else {
    M().upsertPinLocal(id, S.year, { outside_aid_cents: cents });
    savePin(id, S.year, { outside_aid_cents: cents });
  }
}
function famPct(id, value) {
  const s = M().byId(id); if (!s) return;
  const v = Math.min(100, Math.max(0, Math.round(+value || 0)));
  if (S.year === 0) {
    s.famPct = v; s.touched = true; s.timothyAwardOverride = null; s.familyOwedOverride = null;
    saveStudent(id, { fam_pct: v, touched: 1, timothy_award_override_cents: null, family_owed_override_cents: null });
  } else {
    M().upsertPinLocal(id, S.year, { fam_pct: v, timothy_award_cents: null, family_owed_cents: null });
    savePin(id, S.year, { fam_pct: v, timothy_award_cents: null, family_owed_cents: null });
  }
}
function timothyAward(id, value) {
  const s = M().byId(id);
  if (!s || (s.isPipeline && S.year === 0)) return;
  const d = whole(value);
  const familyOwed = Math.max(0, M().tuitionForYear(S.year) - M().outsideAidFor(s, S.year) - d);
  if (S.year === 0) {
    s.timothyAwardOverride = d; s.familyOwedOverride = familyOwed;
    saveStudent(id, { timothy_award_override_cents: d * 100, family_owed_override_cents: Math.round(familyOwed * 100) });
  } else {
    const fields = { timothy_award_cents: d * 100, family_owed_cents: Math.round(familyOwed * 100) };
    M().upsertPinLocal(id, S.year, fields);
    savePin(id, S.year, fields);
  }
}
function clearOverride(id) {
  const s = M().byId(id); if (!s) return;
  if (S.year === 0) {
    s.timothyAwardOverride = null; s.familyOwedOverride = null;
    saveStudent(id, { timothy_award_override_cents: null, family_owed_override_cents: null });
  } else {
    M().upsertPinLocal(id, S.year, { timothy_award_cents: null, family_owed_cents: null });
    savePin(id, S.year, { timothy_award_cents: null, family_owed_cents: null });
  }
}
function lhsAward(id, value) {
  const s = M().byId(id); if (!s) return;
  const max = M().cfgNum('lhs_max_award_cents', 250000) / 100;
  const v = Math.min(max, Math.max(0, Math.round(+value || 0)));
  if (S.year === 0) { s.lhsAward = v; saveStudent(id, { lhs_award_cents: Math.round(v * 100) }); } else {
    M().upsertPinLocal(id, S.year, { lhs_award_cents: Math.round(v * 100) });
    savePin(id, S.year, { lhs_award_cents: Math.round(v * 100) });
  }
}

// Apply Policy / Auto-Balance results: the current year updates each record (clearing typed
// awards); another year is kept as that year's plan, typed $ figures cleared so the % applies.
function bulkSaveForYear(updates) {
  if (!updates.length) return Promise.resolve();
  if (S.year === 0) {
    updates.forEach((u) => { const s = M().byId(u.id); if (s) { s.famPct = u.famPct; s.touched = true; s.timothyAwardOverride = null; s.familyOwedOverride = null; } });
    return saveNow('tuition-aid/students/bulk', 'POST', { updates: updates.map((u) => ({ id: u.id, fam_pct: u.famPct, touched: 1, timothy_award_override_cents: null, family_owed_override_cents: null })) });
  }
  updates.forEach((u) => M().upsertPinLocal(u.id, S.year, { fam_pct: u.famPct, timothy_award_cents: null, family_owed_cents: null }));
  return saveNow('tuition-aid/year-pins/bulk', 'POST', { school_year: M().yearLabel(S.year), updates: updates.map((u) => ({ student_id: u.id, fam_pct: u.famPct, timothy_award_cents: null, family_owed_cents: null })) });
}

async function searchPeople(q) {
  const s = S.panel && S.panel.kind === 'link' ? M().byId(S.panel.id) : null;
  if (q.trim().length < 2) { S.people = []; render(); return; }
  try {
    const d = await call('people', { query: '&q=' + encodeURIComponent(q.trim()) });
    const fam = (s ? s.family : '').trim().toLowerCase();
    const child = (s ? s.child : '').trim().toLowerCase();
    S.people = (d.people || []).slice(0, 8).map((p) => {
      const fn = (p.first_name || '').toLowerCase(); const ln = (p.last_name || '').toLowerCase();
      let score = 0;
      if (fam && ln === fam) score += 2; else if (fam && ln.includes(fam)) score += 1;
      if (child && fn === child) score += 2; else if (child && fn.includes(child)) score += 1;
      return { ...p, score, best: score >= 4 };
    }).sort((a, b) => b.score - a.score);
  } catch (e) { S.people = []; S.saveError = e.message; }
  render();
}
let searchTimer;

function personFields() {
  const p = S.panel && S.panel.person;
  return p ? { person_id: p.id, family: p.last_name || '', child: p.first_name || '', household_id: p.household_id ?? null } : null;
}

function fail(message) { S.saveError = message; S.saveMessage = ''; render(); }

const ACTIONS = {
  sort(d) {
    const st = d.table === 'lhs' ? S.lhsSort : S.k8Sort;
    if (st.col === d.col) st.dir = -st.dir; else { st.col = d.col; st.dir = 1; }
  },
  history(d) { S.panel = { kind: 'history', id: +d.id }; window.scrollTo(0, 0); },
  closePanel() { S.panel = null; S.people = []; },
  jump(d) {
    const off = +d.offset; S.panel = null;
    if (off < 0) { if (S.config.page !== 'past-years') { location.href = `/?section=tuition&page=past-years&year=${off}`; return; } S.pastYear = off; } else {
      if (S.config.page !== 'planner') { location.href = `/?section=tuition&page=planner&year=${off}`; return; }
      S.year = off;
    }
  },
  openLink(d) { S.panel = { kind: 'link', id: +d.id }; S.people = []; const s = M().byId(+d.id); if (s && (s.family || s.child)) searchPeople(s.family || s.child); window.scrollTo(0, 0); },
  openAdd() { S.panel = { kind: 'add', pipeline: false }; S.people = []; window.scrollTo(0, 0); },
  // The past-year form picks a person without a panel open.
  pickPerson(d) { if (!S.panel) S.panel = { kind: 'past-add' }; S.panel.person = S.people.find((p) => p.id === +d.id) || null; S.people = []; },
  clearPerson() { if (S.panel) S.panel.person = null; },
  async saveLink() {
    const fields = personFields();
    if (!fields) { fail('Search for and select a person first.'); return; }
    const id = S.panel.id;
    try { await saveNow(`tuition-aid/students/${id}`, 'PATCH', fields); S.panel = null; await reload(); } catch { /* shown */ }
  },
  async saveAdd() {
    const person = personFields();
    const family = ($('tp-add-family').value || '').trim() || (person ? person.family : '');
    const child = ($('tp-add-child').value || '').trim() || (person ? person.child : '');
    const pipeline = !!S.panel.pipeline;
    const b = { person_id: person ? person.id : null, household_id: person ? person.household_id : null, family, child, is_pipeline: pipeline,
      lhs_award_cents: M().cfgNum('lhs_standard_rate_cents', 120000) };
    if (pipeline) {
      const by = +($('tp-add-birth') || {}).value;
      if (!by) { fail('Enter the birth year.'); return; }
      b.birth_year = by; b.fam_pct = M().cfgNum('default_pipeline_fam_pct', 50);
    } else { b.base_grade = $('tp-add-grade').value; b.fam_pct = 50; }
    if (!b.family && !b.person_id) { fail('Enter a family name or link a person.'); return; }
    try { await saveNow('tuition-aid/students', 'POST', b); S.panel = null; await reload(); } catch { /* shown */ }
  },
  async addPipeline() {
    const family = $('tp-pipe-family').value.trim(); const child = $('tp-pipe-child').value.trim();
    const birthYear = +$('tp-pipe-birth').value; const grade = $('tp-pipe-grade').value; const base = M().baseYear();
    if (!family || !child) { fail('Enter both a family name and a child’s name.'); return; }
    if (!birthYear || birthYear < base - 6 || birthYear > base + 1) { fail(`Enter a birth year between ${base - 6} and ${base + 1}.`); return; }
    const b = { family, child, is_pipeline: true, birth_year: birthYear, fam_pct: M().cfgNum('default_pipeline_fam_pct', 50), lhs_award_cents: M().cfgNum('lhs_standard_rate_cents', 120000) };
    if (grade) b.base_grade = grade;
    try {
      await saveNow('tuition-aid/students', 'POST', b);
      ['tp-pipe-family', 'tp-pipe-child', 'tp-pipe-birth', 'tp-pipe-grade'].forEach((id) => { $(id).value = ''; });
      await reload();
    } catch { /* shown */ }
  },
  async enroll(d) {
    const s = M().byId(+d.id); if (!s) return;
    const grade0 = M().gradeAt(s, 0);
    if (grade0 === null || grade0 === 'Graduated') return;
    if (!window.confirm(`Enroll ${s.child} as a current grade ${grade0} student for ${M().yearLabel(0)}?`)) return;
    try { await saveNow(`tuition-aid/students/${s.id}`, 'PATCH', { is_pipeline: false, base_grade: grade0 }); await reload(); } catch { /* shown */ }
  },
  async remove(d) {
    if (!window.confirm('Remove this student from the planner? Their past-year records are kept.')) return;
    try { await saveNow(`tuition-aid/students/${+d.id}`, 'DELETE'); await reload(); } catch { /* shown */ }
  },
  clearOverride(d) { clearOverride(+d.id); },
  applyPolicy() { bulkSaveForYear(M().applyPolicyUpdates(S.year)).catch(() => {}); },
  autoBalance() { bulkSaveForYear(M().autoBalanceUpdates(S.year)).catch(() => {}); },
  async resetAwards() {
    const label = M().yearLabel(S.year);
    if (!window.confirm(S.year === 0 ? 'Reset every student’s family share and LHS award to their original figures, and clear typed awards?' : `Clear every plan saved for ${label} (outside aid, shares, awards and LHS awards) so it projects from the current records again?`)) return;
    if (S.year === 0) {
      const updates = M().roster.map((s) => {
        s.famPct = s.famPctOrig; s.lhsAward = s.lhsAwardOrig; s.attendsLHS = true; s.touched = false; s.timothyAwardOverride = null; s.familyOwedOverride = null;
        return { id: s.id, fam_pct: s.famPctOrig, lhs_award_cents: Math.round(s.lhsAwardOrig * 100), attends_lhs: 1, touched: 0, timothy_award_override_cents: null, family_owed_override_cents: null };
      });
      if (updates.length) saveNow('tuition-aid/students/bulk', 'POST', { updates }).catch(() => {});
    } else {
      const ids = M().roster.map((s) => s.id).filter((id) => M().pinFor(id, S.year));
      ids.forEach((id) => M().removePinLocal(id, S.year));
      Promise.all(ids.map((id) => saveNow(`tuition-aid/students/${id}/years/${encodeURIComponent(label)}`, 'DELETE'))).catch(() => {});
    }
  },
  async saveYearRate() {
    const d = +$('tp-year-rate').value;
    if (!d || d <= 0) { fail('Enter the tuition in dollars.'); return; }
    const label = M().yearLabel(S.year); const cents = Math.round(d * 100);
    try { await saveNow(`tuition-aid/year-rates/${encodeURIComponent(label)}`, 'PUT', { tuition_cents: cents }); M().yearRates[label] = cents; } catch { /* shown */ }
  },
  async saveTotalBudget() {
    const d = +$('tp-total-budget').value;
    if (!d || d < 0) { fail('Enter the Total Timothy Aid budget in dollars.'); return; }
    const cents = Math.round(d * 100);
    try { await saveNow('tuition-aid/config', 'PATCH', { values: { timothy_total_budget_cents: cents } }); M().config.timothy_total_budget_cents = String(cents); } catch { /* shown */ }
  },
  async saveConfig(d) {
    const raw = +$(`tp-cfg-${d.key}`).value;
    if (!Number.isFinite(raw) || raw < 0) { fail('Enter a number of zero or more.'); return; }
    const stored = d.kind === 'cents' ? Math.round(raw * 100) : raw;
    try {
      await saveNow('tuition-aid/config', 'PATCH', { values: { [d.key]: stored } });
      M().config[d.key] = String(stored);
      if (d.key === 'base_school_year') await reload();
    } catch { /* shown */ }
  },
  async addPast() {
    const person = personFields();
    const family = $('tp-past-family').value.trim() || (person ? person.family : '');
    const child = $('tp-past-child').value.trim() || (person ? person.child : '');
    const grade = $('tp-past-grade').value.trim();
    if (!family && !person) { fail('Enter a family name or link a person.'); return; }
    const opt = (id) => ($(id).value === '' ? null : Math.round(+$(id).value * 100));
    const label = M().yearLabel(S.pastYear);
    try {
      const created = await saveNow('tuition-aid/students', 'POST', { person_id: person ? person.id : null, household_id: person ? person.household_id : null, family, child, base_grade: grade, active: false });
      await saveNow(`tuition-aid/students/${created.id}/years/${encodeURIComponent(label)}`, 'PUT', {
        grade, outside_aid_cents: Math.round((+$('tp-past-outside').value || 0) * 100),
        timothy_award_cents: opt('tp-past-timothy'), family_owed_cents: opt('tp-past-owed'), lhs_award_cents: opt('tp-past-lhs'),
      });
      ['tp-past-family', 'tp-past-child', 'tp-past-grade', 'tp-past-outside', 'tp-past-timothy', 'tp-past-owed', 'tp-past-lhs'].forEach((id) => { $(id).value = ''; });
      S.panel = null;
      await reload();
    } catch { /* shown */ }
  },
  async confirmImport() {
    const st = S.importState;
    const payload = st.records.map((rec, r) => ({ family: rec.family, child: rec.child, entries: rec.entries.filter((e, i) => st.selected[`${r}-${i}`]) }))
      .filter((rec) => rec.entries.length);
    if (!payload.length) { st.message = 'Nothing selected to import.'; return; }
    st.message = 'Importing…'; render();
    try {
      const d = await saveNow('tuition-aid/import-history', 'POST', { records: payload });
      S.importState = { message: `Imported: ${d.created || 0} new, ${d.updated || 0} updated, ${d.unchanged || 0} unchanged${d.newStudents ? `, ${d.newStudents} new history-only record${d.newStudents === 1 ? '' : 's'}` : ''}.` };
      await reload();
    } catch (e) { S.importState = { ...st, message: e.message, error: true }; }
  },
};

async function importFile(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  S.importState = { message: `Reading ${file.name}…` }; render();
  const current = M().yearLabel(0);
  try {
    const sheets = await parseWorkbookAllSheets(await file.arrayBuffer());
    const simple = sheets.find((s) => s.name === 'Student Tuition History');
    let st;
    if (simple) {
      const layout = detectMultiYearHistoryLayout(simple.grid);
      const res = layout ? extractMultiYearHistory(simple.grid, layout, current) : { records: extractHistoryRecords(simple.grid, current), reconcileWarnings: [] };
      const entries = res.records.reduce((n, r) => n + r.entries.length, 0);
      st = { records: res.records, reconcile: res.reconcileWarnings, collisions: [], unresolved: [],
        message: res.records.length ? `Found ${res.records.length} student${res.records.length === 1 ? '' : 's'}, ${entries} year${entries === 1 ? '' : 's'} of history. Review below, then import.` : 'No importable records found in this file.' };
    } else {
      const ex = extractFromRawWorkbook(sheets, current);
      const built = buildImportRecords(ex.k8Records, ex.lhsRaw, M().roster);
      const entries = built.records.reduce((n, r) => n + r.entries.length, 0);
      let msg = built.records.length || built.lhsUnresolved.length
        ? `Found ${built.records.length} student${built.records.length === 1 ? '' : 's'}, ${entries} year${entries === 1 ? '' : 's'} of history.` : 'No importable records found in this file.';
      if (ex.skippedSheets.length) msg += ` Skipped (a different layout): ${ex.skippedSheets.join(', ')}.`;
      st = { records: built.records, reconcile: [], collisions: built.collisionWarnings, unresolved: built.lhsUnresolved, message: msg };
    }
    const collided = new Set(st.collisions.map((w) => `${w.family.trim().toLowerCase()}|${w.child.trim().toLowerCase()}`));
    st.selected = {};
    st.records.forEach((rec, r) => rec.entries.forEach((e, i) => { st.selected[`${r}-${i}`] = !collided.has(`${rec.family.trim().toLowerCase()}|${rec.child.trim().toLowerCase()}`); }));
    S.importState = st;
  } catch (e) {
    S.importState = { message: (e && e.message) || 'Could not read this file.', error: true };
  }
  render();
}

const CHANGES = {
  year(el) { S.year = +el.value; S.panel = null; syncUrl('year', S.year); },
  pastYear(el) { S.pastYear = +el.value; syncUrl('year', S.pastYear); },
  outsideAid(el) { outsideAid(+el.dataset.id, el.value); },
  timothyAward(el) { timothyAward(+el.dataset.id, el.value); },
  attendsLhs(el) { const s = M().byId(+el.dataset.id); if (s) { s.attendsLHS = el.checked; saveStudent(s.id, { attends_lhs: el.checked ? 1 : 0 }); } },
  pastField(el) {
    const cents = el.value === '' ? null : whole(el.value) * 100;
    const fields = { [el.dataset.field]: cents };
    M().upsertPinLocal(+el.dataset.id, S.pastYear, fields);
    savePin(+el.dataset.id, S.pastYear, fields);
  },
  addMode(el) { S.panel.pipeline = el.checked; },
  importPick(el) { S.importState.selected[el.dataset.key] = el.checked; return true; },
  importFile(el) { importFile(el); return true; },
};

// Typing: figures update as you type; the box being typed in is left alone.
const INPUTS = {
  famPct(el) { famPct(+el.dataset.id, el.value); },
  lhsAward(el) { lhsAward(+el.dataset.id, el.value); },
  personSearch(el) { clearTimeout(searchTimer); searchTimer = setTimeout(() => searchPeople(el.value), 250); return true; },
};

function syncUrl(key, value) {
  try { const u = new URL(location.href); u.searchParams.set(key, String(value)); history.replaceState(null, '', u); } catch { /* ignore */ }
}

function onClick(event) {
  const el = event.target.closest('[data-act]');
  if (!el || !root.contains(el)) return;
  event.preventDefault();
  const fn = ACTIONS[el.dataset.act];
  if (!fn) return;
  const result = fn(el.dataset);
  if (result && typeof result.then === 'function') result.then(render, render); else render();
}

function onChange(event) {
  const el = event.target;
  const fn = el.dataset && CHANGES[el.dataset.change];
  if (!fn) return;
  if (!canEdit() && !['year', 'pastYear'].includes(el.dataset.change)) return;
  if (!fn(el)) render();
}

function onInput(event) {
  const el = event.target;
  const fn = el.dataset && INPUTS[el.dataset.input];
  if (!fn || (!canEdit() && el.dataset.input !== 'personSearch')) return;
  if (!fn(el)) render();
}

function start() {
  root = $('tp-root');
  const cfgEl = $('tp-config');
  if (!root || !cfgEl) return;
  S.config = JSON.parse(cfgEl.textContent || '{}');
  const y = Number(S.config.year);
  if (S.config.page === 'past-years') S.pastYear = Number.isInteger(y) && y < 0 ? y : -1;
  else S.year = Number.isInteger(y) && y >= 0 && y <= 5 ? y : 0;
  onStateChange((what) => (what === 'status' ? refreshStatus() : render()));
  root.addEventListener('click', onClick);
  root.addEventListener('change', onChange);
  root.addEventListener('input', onInput);
  window.addEventListener('beforeunload', (e) => { if (hasPendingSaves()) { e.preventDefault(); e.returnValue = ''; } });
  render();
  load();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
}
