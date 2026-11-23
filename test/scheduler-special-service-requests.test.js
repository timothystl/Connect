import { describe, it, expect } from 'vitest';
import vm from 'node:vm';
import { SCHEDULER_HTML } from '../src/scheduler-html.js';

// "Request Volunteers" only listed open Sunday slots: special services such as
// Thanksgiving never appeared, so there was no way to ask for a PowerPoint (or
// any other) volunteer for them. Exercised against the real served script.

const SERVED_JS = SCHEDULER_HTML.match(/<script>([\s\S]*?)<\/script>/)[1];

function fakeEl(id) {
  const e = {
    id, tagName: 'DIV', style: {}, dataset: {}, children: [], _attrs: {}, _classes: new Set(),
    innerHTML: '', textContent: '', value: '', checked: false, disabled: false, className: '',
    parentNode: null,
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
    removeChild() {}, remove() {},
    setAttribute(k, v) { this._attrs[k] = String(v); },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(this._attrs, k) ? this._attrs[k] : null; },
    removeAttribute(k) { delete this._attrs[k]; },
    addEventListener() {}, removeEventListener() {},
    focus() {}, blur() {}, scrollIntoView() {}, click() {},
    closest() { return null; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    getBoundingClientRect() { return { top: 0, left: 0, right: 0, bottom: 0, width: 100, height: 100 }; },
  };
  e.parentNode = { setAttribute() {}, removeAttribute() {}, appendChild() {}, parentNode: { appendChild() {} } };
  e.classList = {
    add: (...c) => c.forEach((x) => e._classes.add(x)),
    remove: (...c) => c.forEach((x) => e._classes.delete(x)),
    contains: (c) => e._classes.has(c),
    toggle: (c, on) => (on === undefined
      ? (e._classes.has(c) ? e._classes.delete(c) : e._classes.add(c))
      : (on ? e._classes.add(c) : e._classes.delete(c))),
  };
  return e;
}

function runScheduler() {
  const els = {};
  const store = {};
  const ctx = {
    document: {
      getElementById(id) { return els[id] || (els[id] = fakeEl(id)); },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      createElement(tag) { const el = fakeEl('created-' + tag); el.tagName = String(tag).toUpperCase(); return el; },
      addEventListener() {},
      body: fakeEl('body'),
      documentElement: fakeEl('html'),
      activeElement: null,
      hidden: false,
    },
    console: { log() {}, warn() {}, error() {} },
    setTimeout, clearTimeout, setInterval: () => 0, clearInterval,
    Math, JSON, Date, RegExp, Boolean, parseFloat, parseInt, isFinite, isNaN,
    Number, String, Object, Array, Promise, Error, Map, Set, Intl,
    encodeURIComponent, decodeURIComponent, URLSearchParams,
    alert() {}, confirm() { return true; }, prompt() { return null; },
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    unescape: globalThis.unescape,
    crypto: { getRandomValues(a) { for (let i = 0; i < a.length; i++) a[i] = i + 1; return a; } },
    navigator: { userAgent: 'test', clipboard: null },
    localStorage: {
      getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      setItem(k, v) { store[k] = String(v); },
      removeItem(k) { delete store[k]; },
    },
    fetch() { return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }), text: () => Promise.resolve('{}') }); },
    URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
    Blob: class { constructor() {} },
    Element: class {},
  };
  ctx.window = ctx;
  ctx.self = ctx;
  ctx.globalThis = ctx;
  ctx.window.location = { origin: 'https://connect.timothystl.org', href: '', search: '' };
  ctx.window.addEventListener = () => {};
  ctx.window.removeEventListener = () => {};
  ctx.window.open = () => null;
  ctx.window.innerWidth = 1200;
  ctx.window.innerHeight = 900;
  ctx.window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });

  vm.createContext(ctx);
  vm.runInContext(SERVED_JS, ctx, { filename: 'scheduler-served.js' });
  const el = (id) => ctx.document.getElementById(id);
  return { ctx, els, el };
}

function setup() {
  const { ctx } = runScheduler();
  const role = ctx.SHARED_ROLES[0];
  ctx.getConfirmations = () => ({});
  ctx.getPeople = () => ([
    { id: 'p1', name: 'Ann', email: 'ann@example.org', roles: [role], servicePreference: '8am', blackoutDates: [] },
    { id: 'p2', name: 'Bob', email: 'bob@example.org', roles: [role], servicePreference: 'both', blackoutDates: ['2026-11-26'] },
    { id: 'p3', name: 'Cy', email: 'cy@example.org', roles: [], servicePreference: 'both', blackoutDates: [] },
  ]);
  ctx.currentSchedule = [{
    type: 'special', date: new Date('2026-11-26T12:00:00'), name: 'Thanksgiving Day',
    services: [{ time: '10am', roles: [role, 'otherRole'], assignments: { otherRole: 'p3' } }],
  }];
  return { ctx, role };
}

describe('Request Volunteers includes special services', () => {
  it('lists each unassigned special-service role as an open slot', () => {
    const { ctx, role } = setup();
    const slots = ctx.getOpenSlots();
    expect(slots).toHaveLength(1);
    expect(slots[0]).toMatchObject({ dateISO: '2026-11-26', svc: '10am', role, specialName: 'Thanksgiving Day' });
  });

  it('asks qualified people regardless of 8am/10:45am preference, but honors blackout dates', () => {
    const { ctx } = setup();
    const pool = ctx.getOpenSlots()[0].pool.map((p) => p.id);
    expect(pool).toEqual(['p1']);
  });

  it('names the special service in the request email', () => {
    const { ctx } = setup();
    const slot = ctx.getOpenSlots()[0];
    const html = ctx.buildVolunteerRequestHtml(ctx.getPeople()[0], slot, '');
    expect(html).toContain('Thanksgiving Day');
    expect(html).toContain('10am Service');
  });
});
