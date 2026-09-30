import { describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../apps/finance/shell.js';
import { cleanFileName, sniffContentType } from '../apps/finance/facility-files.js';

const sql = (name) => readFileSync(new URL(`../apps/finance/migrations/${name}`, import.meta.url), 'utf8');

function makeDb() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(sql('0010_finance_facilities.sql'));
  sqlite.exec(sql('0012_finance_facility_files.sql'));
  const statement = (text, args = []) => ({
    sql: text,
    bind: (...next) => statement(text, next),
    async run() { const r = sqlite.prepare(text).run(...args); return { meta: { last_row_id: Number(r.lastInsertRowid), changes: r.changes } }; },
    async first() { return sqlite.prepare(text).get(...args) ?? null; },
    async all() { return { results: sqlite.prepare(text).all(...args) }; },
  });
  const db = {
    prepare: (text) => statement(text),
    async batch(stmts) {
      sqlite.exec('BEGIN');
      try {
        const out = [];
        for (const s of stmts) out.push(/^\s*SELECT/i.test(s.sql) ? await s.all() : await s.run());
        sqlite.exec('COMMIT');
        return out;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  return { db, sqlite };
}

// An R2-shaped bucket kept in memory.
function makeBucket() {
  const objects = new Map();
  return {
    objects,
    async put(key, bytes, options) { objects.set(key, { bytes: new Uint8Array(bytes), contentType: options?.httpMetadata?.contentType }); },
    async get(key) { const o = objects.get(key); return o ? { body: o.bytes, size: o.bytes.byteLength } : null; },
    async head(key) { const o = objects.get(key); return o ? { size: o.bytes.byteLength } : null; },
    async delete(key) { objects.delete(key); },
  };
}

const JPEG = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0, 16, 74, 70, 73, 70, 0, 1]);
const PDF = new TextEncoder().encode('%PDF-1.7\n1 0 obj\n');
const adminRole = { role: 'admin', identity: 'office@example.com', permissions: { finance: 'edit', giving: 'edit' } };
const viewer = { role: 'finance', permissions: { finance: 'view', giving: 'view' } };

function envFor(role, db, bucket) {
  return {
    ENVIRONMENT: 'production', RELEASE_SHA: 'test', FINANCE_DB: db, FINANCE_CONTRACT_API_KEY: 'k', FACILITY_FILES: bucket,
    CONNECT_SERVICE: { fetch: async () => (role ? new Response(JSON.stringify(role)) : new Response('{}', { status: 403 })) },
  };
}

function bundle(manifest, files = []) {
  const body = new FormData();
  body.append('manifest', new File([typeof manifest === 'string' ? manifest : JSON.stringify(manifest)], 'manifest.json', { type: 'application/json' }));
  for (const [name, bytes] of files) body.append('files', new File([bytes], name, { type: 'application/pdf' }));
  return new Request('https://finance.test/api/v1/facilities/import', { method: 'POST', body, headers: { 'Cf-Access-Jwt-Assertion': 'jwt', 'Sec-Fetch-Site': 'same-origin' } });
}

const manifest = {
  version: 1,
  assets: [{ key: 'boiler', name: 'Main boiler', category: 'HVAC', installed_month: '2020-03', expected_life_years: 25, replacement_cost: '85,000', vendor: 'JN Certified' }],
  projects: [{ key: 'hvac', name: 'HVAC replacement', status: 'Completed', target_month: '2020-03', cost: 120000, useful_life_years: 20 }],
  service: [{ key: 's1', asset: 'boiler', service_date: '2020-03-28', service_type: 'Replacement', description: 'Boiler installed', cost: '0' }],
  documents: [
    { file: 'proposal.pdf', record: 'hvac', caption: 'Signed proposal' },
    { file: 'progress.pdf', record: 'hvac' },
    { file: 'install.pdf', record: 's1' },
  ],
};
const files = [['proposal.pdf', PDF], ['progress.pdf', PDF], ['install.pdf', PDF]];

describe('Facilities bundle import', () => {
  it('creates records, attaches documents, and adds nothing twice on a second run', async () => {
    const { db, sqlite } = makeDb();
    const bucket = makeBucket();
    const res = await worker.fetch(bundle(manifest, files), envFor(adminRole, db, bucket));
    expect(res.status).toBe(303);
    const location = decodeURIComponent(res.headers.get('Location').replace(/\+/g, ' '));
    expect(location).toContain('page=capital-projects');
    expect(location).toContain('3 new records, 0 already on file, 3 documents attached');
    expect(sqlite.prepare('SELECT replacement_cost_cents c FROM finance_facility_assets').get().c).toBe(8500000);
    expect(sqlite.prepare('SELECT cost_cents c FROM finance_facility_projects').get().c).toBe(12000000);
    expect(sqlite.prepare('SELECT asset_id FROM finance_facility_service_log').get().asset_id).toBe(1);
    expect(sqlite.prepare('SELECT file_name, caption FROM finance_facility_files WHERE record_type = ? ORDER BY id').all('project')).toEqual([
      { file_name: 'proposal.pdf', caption: 'Signed proposal' }, { file_name: 'progress.pdf', caption: '' }]);
    expect(bucket.objects.size).toBe(3);

    const again = await worker.fetch(bundle(manifest, files), envFor(adminRole, db, bucket));
    expect(decodeURIComponent(again.headers.get('Location').replace(/\+/g, ' '))).toContain('0 new records, 3 already on file, 0 documents attached, 3 already attached');
    expect(sqlite.prepare('SELECT COUNT(*) n FROM finance_facility_files').get().n).toBe(3);
    expect(sqlite.prepare('SELECT COUNT(*) n FROM finance_facility_assets').get().n).toBe(1);
    expect(bucket.objects.size).toBe(3);
  });

  it('saves nothing when any row or file is wrong', async () => {
    const { db, sqlite } = makeDb();
    const bucket = makeBucket();
    const bad = async (m, f = files) => {
      const res = await worker.fetch(bundle(m, f), envFor(adminRole, db, bucket));
      expect(res.headers.get('Location')).toContain('status=error');
      return decodeURIComponent(res.headers.get('Location').replace(/\+/g, ' '));
    };
    expect(await bad('{nope')).toContain('not valid JSON');
    expect(await bad({ ...manifest, projects: [{ ...manifest.projects[0], status: 'Done' }] })).toContain('valid status');
    expect(await bad(manifest, files.slice(0, 2))).toContain('install.pdf, but that file was not chosen');
    expect(await bad({ ...manifest, documents: [{ file: 'proposal.pdf', record: 'nope' }] })).toContain('not a key');
    expect(await bad(manifest, [...files.slice(0, 2), ['install.pdf', new TextEncoder().encode('<html>')]])).toContain('not a photo or PDF');
    for (const table of ['finance_facility_assets', 'finance_facility_projects', 'finance_facility_service_log', 'finance_facility_files']) {
      expect(sqlite.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n).toBe(0);
    }
    expect(bucket.objects.size).toBe(0);
  });

  it('is refused for a view-only role', async () => {
    const { db, sqlite } = makeDb();
    const res = await worker.fetch(bundle(manifest, files), envFor(viewer, db, makeBucket()));
    expect(res.headers.get('Location')).toContain('reason=access_denied');
    expect(sqlite.prepare('SELECT COUNT(*) n FROM finance_facility_assets').get().n).toBe(0);
  });
});
