import { describe, it, expect } from 'vitest';
import vm from 'node:vm';
import { CHMS_APP_MEMBER_JS, CHMS_APP_STAFF_JS, CHMS_APP_EXT_JS } from '../src/html-chms.js';
import { HTML_TABS_1 } from '../src/frontend/html-tabs.js';

// Print labels lives beside Print directory and, with nothing checked, prints the whole
// filtered list — every page of it, not just the 25 rows on screen.
function makeCtx(totalPeople) {
  const mkEl = (id) => ({
    id, innerHTML: '', textContent: '', value: '', checked: false, style: {}, dataset: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild() {}, addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
    getAttribute() { return null; }, setAttribute() {}, focus() {},
  });
  const document = {
    getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
    createElement: mkEl, addEventListener() {}, body: mkEl('body'), documentElement: mkEl('html'),
  };
  const calls = [];
  const opened = { location: { href: '' }, document: { write() {} }, close() { opened.closed = true; } };
  const ctx = {
    document, console, setTimeout, clearTimeout, Math, JSON, Date, parseFloat, parseInt, isFinite,
    Number, String, Object, Array, Set, Promise, RegExp, URLSearchParams, encodeURIComponent, decodeURIComponent,
    localStorage: { getItem: () => null, setItem() {} },
    fetch: (path) => {
      calls.push(String(path));
      const u = new URL(String(path), 'https://x');
      const off = +u.searchParams.get('offset'), lim = +u.searchParams.get('limit');
      const people = [];
      for (let i = off; i < Math.min(off + lim, totalPeople); i++) people.push({ id: i + 1 });
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ people, total: totalPeople }) });
    },
    alert(m) { ctx.__alerts.push(m); }, confirm: () => true,
    open: (url) => { ctx.__opens.push(url); return url ? null : opened; },
    navigator: {}, location: { href: '', hash: '' },
    addEventListener() {}, removeEventListener() {}, scrollTo() {}, requestAnimationFrame() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.__alerts = []; ctx.__opens = [];
  vm.createContext(ctx);
  vm.runInContext(CHMS_APP_MEMBER_JS, ctx);
  vm.runInContext(CHMS_APP_STAFF_JS, ctx);
  vm.runInContext(CHMS_APP_EXT_JS, ctx);
  ctx.__calls = calls; ctx.__win = opened;
  return ctx;
}
const flush = () => new Promise(r => setTimeout(r, 0));

describe('Print labels button', () => {
  it('sits beside Print directory in the People toolbar', () => {
    expect(HTML_TABS_1).toMatch(/onclick="printDirectory\(\)">Print directory<\/button>\s*<button[^>]*onclick="printMailingLabels\(\)"[^>]*>Print labels<\/button>/);
  });

  it('with nothing checked, gathers every page of the filtered list (tag filter kept)', async () => {
    const ctx = makeCtx(250);
    vm.runInContext("peopleFilter.tagIds=['7']; peopleFilter.mt=''; _peopleTotal=250;", ctx);
    ctx.printMailingLabels();
    for (let i = 0; i < 10; i++) await flush();
    const listCalls = ctx.__calls.filter(c => c.startsWith('/admin/api/people?'));
    expect(listCalls.length).toBe(2);
    expect(listCalls[0]).toContain('tag_ids=7');
    const href = ctx.__win.location.href;
    expect(href.startsWith('/admin/api/people/mailing-labels?ids=1,2,')).toBe(true);
    expect(href.split('=')[1].split(',').length).toBe(250);
  });

  it('uses only the checked people when Select is on', () => {
    const ctx = makeCtx(250);
    vm.runInContext('_selectMode=true; _selectedPeople.add(4); _selectedPeople.add(9); _peopleTotal=250;', ctx);
    ctx.printMailingLabels();
    expect(ctx.__opens).toEqual(['/admin/api/people/mailing-labels?ids=4,9']);
  });

  it('refuses an empty list without opening a tab', () => {
    const ctx = makeCtx(0);
    vm.runInContext('_peopleTotal=0;', ctx);
    ctx.printMailingLabels();
    expect(ctx.__opens).toEqual([]);
    expect(ctx.__alerts[0]).toMatch(/No one matches/);
  });
});
