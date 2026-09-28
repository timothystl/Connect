import { describe, it, expect, beforeEach } from 'vitest';
import vm from 'node:vm';
import { CHMS_APP_CORE_JS } from '../src/html-chms.js';
import { HTML_HEAD } from '../src/frontend/html-head.js';

// Regression cover for a bug shipped alongside the Compensation/Budget permission split: the
// The standalone Finance app, retained Connect Budget, and retained Connect Compensation links
// are independently permissioned. The Finance heading remains visible when any one is available.
//
// Minimal fake DOM: elements are plain objects with an id, a className string and a style object;
// querySelectorAll('.foo') filters by class, getElementById by id — enough for applyPermissionUI,
// which never does anything more elaborate than that.
function makeEl(id, className) {
  return { id, className: className || '', style: {} };
}
function makeCtx() {
  const elements = [
    makeEl('s-hdr-finance', 's-section-hdr require-finance'),
    makeEl(null, 's-item require-financeapp'),
    makeEl(null, 's-item require-connect-budget'),
    makeEl(null, 's-item require-connect-compensation'),
    makeEl(null, 's-item require-finance'),
  ];
  const document = {
    getElementById(id) { return elements.filter(e => e.id === id)[0] || null; },
    querySelectorAll(sel) {
      const cls = sel.replace(/^\./, '');
      return elements.filter(e => (e.className || '').split(/\s+/).includes(cls));
    },
    querySelector() { return null; },
    body: { classList: { add() {}, remove() {}, toggle() {} } },
    addEventListener() {}, createElement() { return makeEl(null, ''); },
  };
  const ctx = {
    document, console, setTimeout, clearTimeout, Math, JSON, Date, parseFloat, parseInt, isFinite,
    Number, String, Object, Array, encodeURIComponent, decodeURIComponent,
    localStorage: { getItem() { return null; }, setItem() {} },
    fetch: () => Promise.reject(new Error('no network in tests')),
    navigator: {}, location: { href: '', hash: '', hostname: '', assign(url) { this.href = url; } },
    addEventListener() {}, removeEventListener() {}, scrollTo() {}, requestAnimationFrame() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    URL: { createObjectURL: () => '', revokeObjectURL() {} },
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(CHMS_APP_CORE_JS, ctx, { filename: 'app-core.js' });
  ctx.__elements = elements;
  return ctx;
}

let ctx;
beforeEach(() => { ctx = makeCtx(); });

function financeAppEl() { return ctx.__elements.find(e => (e.className || '').includes('require-financeapp')); }
function budgetEl() { return ctx.__elements.find(e => (e.className || '').includes('require-connect-budget')); }
function compensationEl() { return ctx.__elements.find(e => (e.className || '').includes('require-connect-compensation')); }
function financeHdr() { return ctx.__elements.filter(e => e.id === 's-hdr-finance')[0]; }

describe('applyPermissionUI — Finance cutover links', () => {
  it('shows only retained Compensation for council\'s actual default', () => {
    ctx._userRole = 'council';
    ctx.applyPermissionUI({ finance: 'none', compensation: 'edit', budget: 'none', giving: 'anon', tuitionaid: 'none', attendance: 'none', register: 'none', reports: 'view' });
    expect(financeAppEl().style.display).toBe('none');
    expect(budgetEl().style.display).toBe('none');
    expect(compensationEl().style.display).not.toBe('none');
    expect(financeHdr().style.display).not.toBe('none');
  });

  it('shows it when only budget is granted, with compensation and finance both none', () => {
    ctx._userRole = 'council';
    ctx.applyPermissionUI({ finance: 'none', compensation: 'none', budget: 'view', giving: 'none', tuitionaid: 'none', attendance: 'none', register: 'none', reports: 'none' });
    expect(financeAppEl().style.display).toBe('none');
    expect(budgetEl().style.display).not.toBe('none');
    expect(compensationEl().style.display).toBe('none');
  });

  it('hides it when none of the three Finance items are granted', () => {
    ctx._userRole = 'staff';
    ctx.applyPermissionUI({ finance: 'none', compensation: 'none', budget: 'none', giving: 'none', tuitionaid: 'none', attendance: 'edit', register: 'edit', reports: 'view' });
    expect(financeAppEl().style.display).toBe('none');
    expect(budgetEl().style.display).toBe('none');
    expect(compensationEl().style.display).toBe('none');
    // The Finance header itself has nothing under it either (no giving/tuitionaid/finance-family
    // access), so it should also be hidden.
    expect(financeHdr().style.display).toBe('none');
  });

  it('shows the header (but not necessarily the Financial Reports link) purely from Giving access', () => {
    ctx._userRole = 'finance';
    ctx.applyPermissionUI({ finance: 'none', compensation: 'none', budget: 'none', giving: 'edit', tuitionaid: 'none', attendance: 'none', register: 'none', reports: 'none' });
    expect(financeHdr().style.display).not.toBe('none');
    expect(financeAppEl().style.display).toBe('none');
  });

  it('shows all three links for admin regardless of the permissions object', () => {
    ctx._userRole = 'admin';
    ctx.applyPermissionUI({ finance: 'none', compensation: 'none', budget: 'none' });
    expect(financeAppEl().style.display).not.toBe('none');
    expect(budgetEl().style.display).not.toBe('none');
    expect(compensationEl().style.display).not.toBe('none');
  });

  it('sends production and staging to their matching standalone Finance apps', () => {
    ctx.location.hostname = 'connect.timothystl.org';
    ctx.openFinanceWorkspace();
    expect(ctx.location.href).toBe('https://finance.timothystl.org/');
    ctx.location.hostname = 'connect-staging.timothystl.org';
    ctx.openFinanceWorkspace();
    expect(ctx.location.href).toBe('https://finance-staging.timothystl.org/');
  });

  it('retains only Budget and Compensation inside Connect', () => {
    expect(ctx.FIN_TOPNAV_ITEMS.map((item) => item.id)).toEqual(['planning', 'compensation']);
    expect(HTML_HEAD).toContain('class="s-item require-financeapp"');
    expect(HTML_HEAD).toContain('data-fin-section="planning"');
    expect(HTML_HEAD).toContain('data-fin-section="compensation"');
  });
});
