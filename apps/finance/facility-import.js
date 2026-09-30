// One-time bundle import for Facilities: a manifest.json describing assets, capital projects and
// service entries, plus the PDFs or photos that belong to them, loaded in a single post. Every
// value goes through the same validators as the ordinary forms. The whole bundle is checked
// before anything is written, and a record already on file (same name, or same date and
// description for service) is reused rather than duplicated, so a second run adds nothing twice.
import { FormValidationError } from './form-fields.js';
import {
  MAX_FILE_BYTES, attachFacilityFiles, cleanFileName, recordReturn, sniffContentType,
} from './facility-files.js';
import { logFacilityService, saveFacilityAsset, saveFacilityProject } from './facilities-service.js';

export const MAX_MANIFEST_BYTES = 256 * 1024;
export const MAX_IMPORT_FILES = 40;

const KEY = /^[A-Za-z0-9_-]{1,40}$/;
const str = (value) => (value === undefined || value === null ? '' : String(value));

function list(manifest, name) {
  const value = manifest[name];
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) {
    throw new FormValidationError(`The manifest's "${name}" must be a list of records.`);
  }
  return value;
}

function parseManifest(raw) {
  let manifest;
  try { manifest = JSON.parse(raw); } catch { throw new FormValidationError('manifest.json is not valid JSON.'); }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new FormValidationError('manifest.json must be an object.');
  if (manifest.version !== 1) throw new FormValidationError('manifest.json must say "version": 1.');
  return {
    assets: list(manifest, 'assets'),
    projects: list(manifest, 'projects'),
    service: list(manifest, 'service'),
    documents: list(manifest, 'documents'),
  };
}

// Reads the uploaded manifest and files, and checks the whole bundle: field values, keys, and
// that every document names a record in the manifest and a file that was actually sent.
async function prepareBundle(formData) {
  const manifestFile = formData?.get('manifest');
  if (!manifestFile || typeof manifestFile.text !== 'function' || !manifestFile.size) throw new FormValidationError('Choose the manifest.json file.');
  if (manifestFile.size > MAX_MANIFEST_BYTES) throw new FormValidationError('manifest.json is too large.');
  const plan = parseManifest(await manifestFile.text());

  const sent = formData.getAll('files').filter((f) => f && typeof f === 'object' && typeof f.arrayBuffer === 'function' && f.size > 0);
  if (sent.length > MAX_IMPORT_FILES) throw new FormValidationError(`Import up to ${MAX_IMPORT_FILES} files at a time.`);
  const files = new Map();
  for (const file of sent) {
    const name = cleanFileName(file.name);
    if (file.size > MAX_FILE_BYTES) throw new FormValidationError(`${name} is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB.`);
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!sniffContentType(bytes)) throw new FormValidationError(`${name} is not a photo or PDF.`);
    if (files.has(name)) throw new FormValidationError(`Two files are named ${name}.`);
    files.set(name, { name, size: file.size, blob: file });
  }

  const keys = new Map();
  const claim = (kind, record) => {
    const key = str(record.key);
    if (!KEY.test(key)) throw new FormValidationError(`Every ${kind} needs a short "key" using letters, numbers, - or _.`);
    if (keys.has(key)) throw new FormValidationError(`The key "${key}" is used twice.`);
    keys.set(key, kind);
    return key;
  };
  plan.assets.forEach((a) => claim('asset', a));
  plan.projects.forEach((p) => claim('project', p));
  plan.service.forEach((s) => claim('service', s));
  for (const s of plan.service) {
    if (s.asset !== undefined && s.asset !== null && keys.get(str(s.asset)) !== 'asset') throw new FormValidationError(`Service entry "${s.key}" names an asset key that is not in the manifest.`);
  }
  for (const d of plan.documents) {
    const name = cleanFileName(d.file);
    if (!files.has(name)) throw new FormValidationError(`The manifest lists ${name}, but that file was not chosen.`);
    if (!keys.has(str(d.record))) throw new FormValidationError(`${name} is attached to "${d.record}", which is not a key in the manifest.`);
  }
  return { plan, files, keys };
}

function assetForm(a) {
  return { ...a, name: str(a.name), category: str(a.category), installed_month: str(a.installed_month), expected_life_years: str(a.expected_life_years), replacement_cost: str(a.replacement_cost), status: 'active' };
}

function projectForm(p) {
  return { ...p, cost: str(p.cost), useful_life_years: str(p.useful_life_years) };
}

// Runs every validator without writing, so a bad row is reported before the first insert.
async function validateRecords(plan) {
  const noDb = { prepare: () => ({ bind: () => ({ first: async () => ({ id: 1 }), run: async () => ({ meta: {} }) }) }) };
  for (const a of plan.assets) await saveFacilityAsset(noDb, assetForm(a), 'import');
  for (const p of plan.projects) await saveFacilityProject(noDb, projectForm(p), 'import');
  for (const s of plan.service) await logFacilityService(noDb, { ...s, asset_id: '', cost: str(s.cost) }, 'import');
}

export async function importFacilityBundle(db, form, actor, { formData, bucket } = {}) {
  const { plan, files } = await prepareBundle(formData);
  if (plan.documents.length && !bucket) throw new FormValidationError('Photo storage is not set up yet.');
  await validateRecords(plan);

  const summary = { created: 0, reused: 0, attached: 0, skipped: 0 };
  const ids = new Map();

  for (const a of plan.assets) {
    const form = assetForm(a);
    const found = await db.prepare('SELECT id FROM finance_facility_assets WHERE lower(name) = lower(?) AND category = ?').bind(form.name.trim(), form.category).first();
    if (found) { ids.set(a.key, { type: 'asset', id: found.id }); summary.reused += 1; continue; }
    const { id } = await saveFacilityAsset(db, form, actor);
    ids.set(a.key, { type: 'asset', id });
    summary.created += 1;
  }
  for (const p of plan.projects) {
    const found = await db.prepare('SELECT id FROM finance_facility_projects WHERE lower(name) = lower(?)').bind(str(p.name).trim()).first();
    if (found) { ids.set(p.key, { type: 'project', id: found.id }); summary.reused += 1; continue; }
    const { id } = await saveFacilityProject(db, projectForm(p), actor);
    ids.set(p.key, { type: 'project', id });
    summary.created += 1;
  }
  for (const s of plan.service) {
    const assetId = s.asset ? ids.get(str(s.asset)).id : null;
    const found = await db.prepare('SELECT id FROM finance_facility_service_log WHERE service_date = ? AND lower(description) = lower(?) AND COALESCE(asset_id, 0) = ?')
      .bind(str(s.service_date).trim(), str(s.description).trim(), assetId || 0).first();
    if (found) { ids.set(s.key, { type: 'service', id: found.id }); summary.reused += 1; continue; }
    const { id } = await logFacilityService(db, { ...s, asset_id: assetId ? String(assetId) : '', cost: str(s.cost) }, actor);
    ids.set(s.key, { type: 'service', id });
    summary.created += 1;
  }

  const byRecord = new Map();
  for (const d of plan.documents) {
    const target = ids.get(str(d.record));
    const k = `${target.type}:${target.id}`;
    if (!byRecord.has(k)) byRecord.set(k, { target, docs: [] });
    byRecord.get(k).docs.push(d);
  }
  for (const { target, docs } of byRecord.values()) {
    const { results } = await db.prepare('SELECT file_name FROM finance_facility_files WHERE record_type = ? AND record_id = ?').bind(target.type, target.id).all();
    const have = new Set((results || []).map((r) => r.file_name));
    const fresh = [];
    for (const d of docs) {
      const name = cleanFileName(d.file);
      if (have.has(name)) { summary.skipped += 1; continue; }
      fresh.push({ d, file: files.get(name).blob });
    }
    // One at a time, because each document carries its own caption.
    for (const { d, file } of fresh) {
      await attachFacilityFiles(db, bucket, { recordType: target.type, recordId: target.id, files: [file], caption: str(d.caption).slice(0, 200), actor });
      summary.attached += 1;
    }
  }

  const first = [...ids.values()].find((r) => r.type === 'project') || [...ids.values()][0];
  const landing = first ? recordReturn(first.type, first.id) : { page: 'assets', params: {} };
  const note = `Import finished: ${summary.created} new record${summary.created === 1 ? '' : 's'}, ${summary.reused} already on file, ${summary.attached} document${summary.attached === 1 ? '' : 's'} attached${summary.skipped ? `, ${summary.skipped} already attached` : ''}.`;
  return { ...landing, params: { ...landing.params, note } };
}
