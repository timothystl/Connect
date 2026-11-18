import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { handlePeopleApi } from '../src/api-people.js';
import { buildMailingLabels, renderMailingLabelsPage } from '../src/mailing-labels.js';

function realSchema() {
  const sqlite = new DatabaseSync(':memory:');
  const dir = new URL('../migrations/', import.meta.url);
  for (const f of readdirSync(dir).filter(n => n.endsWith('.sql')).sort()) {
    try { sqlite.exec(readFileSync(new URL(f, dir), 'utf8')); } catch { /* other tables */ }
  }
  const dbSrc = readFileSync(new URL('../src/db.js', import.meta.url), 'utf8');
  for (const m of dbSrc.matchAll(/'(ALTER TABLE [^']+)'/g)) {
    try { sqlite.exec(m[1]); } catch { /* already present */ }
  }
  return sqlite;
}
function makeDb(sqlite) {
  return {
    prepare(sql) {
      const mk = (args) => ({
        async run() { const r = sqlite.prepare(sql).run(...args); return { meta: { changes: r.changes } }; },
        async first() { return sqlite.prepare(sql).get(...args); },
        async all() { return { results: sqlite.prepare(sql).all(...args) }; },
      });
      return { bind: (...args) => mk(args), ...mk([]) };
    },
  };
}
async function getLabels(db, ids, role = 'admin', isStaff = true) {
  const seg = 'people/mailing-labels';
  const url = new URL('https://x/admin/api/' + seg + '?ids=' + ids.join(','));
  const req = new Request(url, { method: 'GET' });
  const res = await handlePeopleApi(req, {}, url, 'GET', seg, db, role === 'admin', false, isStaff, isStaff, isStaff, role);
  return { status: res.status, text: await res.text() };
}

describe('buildMailingLabels', () => {
  it('combines a couple at one address, keeps others separate, skips deceased and no-address', () => {
    const { labels, skipped } = buildMailingLabels([
      { id: 1, first_name: 'John', last_name: 'Smith', household_id: 5, family_role: 'head', address1: '1 Elm St', city: 'St. Louis', state: 'MO', zip: '63109' },
      { id: 2, first_name: 'Mary', last_name: 'Smith', household_id: 5, family_role: 'spouse', address1: '1 Elm St', city: 'St. Louis', state: 'MO', zip: '63109' },
      { id: 3, first_name: 'Ann', last_name: 'Adams', household_id: null, address1: '', hh_address1: '' },
      { id: 4, first_name: 'Ed', last_name: 'Brown', deceased: 1, address1: '2 Oak', zip: '63109' },
      { id: 5, first_name: 'Ruth', last_name: 'Zane', household_id: 9, address1: '', hh_address1: '9 Pine Ave', hh_city: 'Affton', hh_state: 'MO', hh_zip: '63123' },
    ]);
    expect(labels).toEqual([
      { name: 'John & Mary Smith', lines: ['1 Elm St', 'St. Louis, MO 63109'] },
      { name: 'Ruth Zane', lines: ['9 Pine Ave', 'Affton, MO 63123'] },
    ]);
    expect(skipped).toEqual([
      { name: 'Ann Adams', reason: 'no mailing address' },
      { name: 'Ed Brown', reason: 'deceased' },
    ]);
  });

  it('gives a household member living elsewhere (e.g. care facility) their own label', () => {
    const { labels } = buildMailingLabels([
      { id: 1, first_name: 'John', last_name: 'Smith', household_id: 5, family_role: 'head', address1: '1 Elm St', zip: '63109' },
      { id: 2, first_name: 'Mary', last_name: 'Smith', household_id: 5, family_role: 'spouse', address1: '50 Care Way', zip: '63110' },
    ]);
    expect(labels.length).toBe(2);
  });

  it('paginates 30 per sheet, honors the start offset, and escapes names', () => {
    const labels = Array.from({ length: 31 }, (_, i) => ({ name: '<b>P' + i, lines: ['1 St', 'X, MO 1'] }));
    const html = renderMailingLabelsPage({ labels, skipped: [] }, 2);
    expect((html.match(/class="sheet"/g) || []).length).toBe(2);
    expect(html).not.toContain('<b>P0');
    expect(html).toContain('&lt;b&gt;P0');
  });
});

describe('GET people/mailing-labels', () => {
  it('prints labels for staff and refuses members', async () => {
    const sqlite = realSchema();
    sqlite.exec(`INSERT INTO people (first_name,last_name,member_type,active,address1,city,state,zip) VALUES ('Lois','Lane','member',1,'5 Main','Webster Groves','MO','63119')`);
    const db = makeDb(sqlite);
    const ok = await getLabels(db, [1]);
    expect(ok.status).toBe(200);
    expect(ok.text).toContain('Lois Lane');
    expect(ok.text).toContain('Webster Groves, MO 63119');
    const denied = await getLabels(db, [1], 'member', false);
    expect(denied.status).toBe(403);
  });
});
