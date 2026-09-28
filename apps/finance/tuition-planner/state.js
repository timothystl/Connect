// The planner's state, and how it is loaded and saved. Records come from Finance's own
// /api/v1/tuition (apps/finance/tuition-service.js), which re-checks the viewer's Tuition Aid
// permission on every call. Edits show at once and save shortly after, one request per record,
// merged the way Connect's planner merged them; a failed save says so and reloads what is stored.
import { createTuitionModel } from './model.js';

export const S = {
  config: null,        // { page, role, canEdit, year }
  model: null,
  loaded: false,
  error: '',
  year: 0,             // year offset being planned (0 = current school year)
  pastYear: -1,        // past-year page offset
  k8Sort: { col: 'grade', dir: 1 },
  lhsSort: { col: 'grade', dir: 1 },
  panel: null,         // { kind: 'history'|'link'|'add'|'past-add', id?, ... }
  people: [],          // link / add search results
  importState: null,   // { records, unresolved, collisions, reconcile, message, selected }
  saving: 0,
  saveMessage: '',
  saveError: '',
};

export const canEdit = () => !!(S.config && S.config.canEdit);

export async function call(path, init = {}) {
  const res = await fetch('/api/v1/tuition?path=' + encodeURIComponent(path) + (init.query || ''), {
    method: init.method || 'GET', credentials: 'same-origin',
    headers: init.body !== undefined ? { 'Content-Type': 'application/json' } : {},
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
  let body = {};
  try { body = await res.json(); } catch { body = {}; }
  if (!res.ok) throw new Error((body && body.error) || ('Request failed (' + res.status + ')'));
  return body;
}

let onChange = () => {};
export function onStateChange(fn) { onChange = fn; }

export async function load() {
  try {
    const bundle = await call('tuition-aid/students');
    S.model = createTuitionModel(bundle);
    S.loaded = true;
    S.error = '';
    if (canEdit()) {
      // A pin saved while its year was still "next year" moves into the student's record now that
      // the year is current (as Connect's planner did on every load).
      S.model.promoteCurrentYearPins().forEach((p) => saveStudent(p.id, p.fields));
    }
  } catch (e) {
    S.error = e.message || 'The Tuition Aid records could not be read.';
  }
  onChange();
}

// ── Saving ────────────────────────────────────────────────────────────────
const timers = {};
const pending = {};

function track(promise) {
  S.saving += 1;
  S.saveError = '';
  onChange('status');
  return promise.then((r) => {
    S.saving -= 1;
    if (!S.saving && !S.saveError) S.saveMessage = 'All changes saved.';
    onChange('status');
    return r;
  }, (e) => {
    S.saving -= 1;
    S.saveError = (e && e.message) || 'The save failed.';
    S.saveMessage = '';
    onChange('status');
    // Show what is actually stored rather than a figure that did not save.
    return load().then(() => { throw e; });
  });
}

function debounce(key, fields, send) {
  pending[key] = Object.assign(pending[key] || {}, fields);
  clearTimeout(timers[key]);
  S.saveMessage = 'Saving…';
  onChange('status');
  timers[key] = setTimeout(() => {
    const body = pending[key];
    delete pending[key];
    delete timers[key];
    track(send(body)).catch(() => {});
  }, 500);
}

export function saveStudent(id, fields) {
  debounce('s' + id, fields, (body) => call('tuition-aid/students/' + id, { method: 'PATCH', body }));
}

export function savePin(studentId, yearIdx, fields) {
  const label = S.model.yearLabel(yearIdx);
  debounce('p' + studentId + '|' + label, fields,
    (body) => call('tuition-aid/students/' + studentId + '/years/' + encodeURIComponent(label), { method: 'PUT', body }));
}

// Immediate saves (bulk actions, adds, settings). Resolves with the response; errors are shown.
export function saveNow(path, method, body) {
  return track(call(path, { method, body }));
}

export function hasPendingSaves() {
  return S.saving > 0 || Object.keys(timers).length > 0;
}
