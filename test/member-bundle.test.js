import { describe, it, expect } from 'vitest';
import vm from 'node:vm';
import fs from 'node:fs';
import {
  CHMS_APP_MEMBER_JS, CHMS_APP_STAFF_JS, CHMS_APP_EXT_JS, CHMS_APP_FINANCE_JS, CHMS_APP_CORE_JS,
  CHMS_HTML, chmsHtmlForRole, SW_JS,
} from '../src/html-chms.js';

// Role gating in this app is visibility, not payload: applyRoleUI() sets a `role-member` class
// on <body> and CSS hides the tabs, but every role was served the same ~1.8MB of JS — Finance,
// Giving, Tuition Aid and all — because the cached bundles are shared across users and so
// cannot vary by role. A member account can only ever reach the directory, and is typically on
// a phone.
//
// app-core.js is now split along the role line into app-member.js (core + people + households)
// and app-staff.js (settings + dashboard + register), and the SHELL — which is per-request and
// no-store — decides which tags to emit.
//
// The failure mode this guards is a ReferenceError at load: the member bundle referencing a
// global that only exists in one of the bundles it no longer ships with. That is why the
// central test here actually EXECUTES app-member.js on its own rather than grepping it.

/** Minimal DOM good enough to let the bundles evaluate and a tab render. */
function fakeEl(id) {
  const e = {
    id, tagName: 'DIV', style: {}, dataset: {}, children: [], _classes: new Set(),
    innerHTML: '', textContent: '', value: '', hidden: false, checked: false,
    appendChild(c) { this.children.push(c); return c; },
    removeChild() {}, remove() {}, setAttribute() {}, getAttribute() { return null; },
    addEventListener() {}, removeEventListener() {}, focus() {}, blur() {},
    scrollIntoView() {}, click() {}, closest() { return null; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    getBoundingClientRect() { return { top: 0, left: 0, width: 100, height: 100 }; },
  };
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

/**
 * Build a context and run the given bundles in the order the shell emits them.
 * Records every script the app asks the browser to load, so the lazy path is observable.
 */
function runBundles(bundles, { serve = null, fail = [] } = {}) {
  const store = {};
  const injected = [];
  const ctx = {
    document: {
      getElementById(id) { return store[id] || (store[id] = fakeEl(id)); },
      querySelector() { return null; }, querySelectorAll() { return []; },
      createElement(tag) {
        const el = fakeEl('created-' + tag);
        el.tagName = String(tag).toUpperCase();
        return el;
      },
      addEventListener() {}, body: fakeEl('body'), activeElement: null,
    },
    console: { log() {}, warn() {}, error() {} },
    setTimeout, clearTimeout, setInterval, clearInterval,
    Math, JSON, Date, RegExp, Boolean, parseFloat, parseInt, isFinite, isNaN,
    Number, String, Object, Array, Promise, Error, Map, Set, Intl,
    encodeURIComponent, decodeURIComponent, URLSearchParams,
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    navigator: { userAgent: 'test' },
    location: { href: 'https://connect.timothystl.org/', hash: '', pathname: '/', reload() {} },
    history: { pushState() {}, replaceState() {} },
    addEventListener() {}, removeEventListener() {}, scrollTo() {},
    requestAnimationFrame(fn) { return setTimeout(fn, 0); },
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    alert() {}, confirm() { return false; },
    fetch: () => Promise.resolve({
      ok: true, status: 200,
      json: () => Promise.resolve({ people: [], total: 0, tags: [], types: [], role: 'member' }),
      text: () => Promise.resolve(''),
    }),
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  // Appending a <script> is how both lazy loaders pull code in. Record the src and resolve, so
  // a test can assert WHICH bundles a member is sent to fetch without a real network.
  // With `serve`, the requested bundle's code is actually run before onload, as a browser would;
  // a path listed in `fail` fires onerror instead.
  ctx.document.body.appendChild = function (el) {
    if (el && el.tagName === 'SCRIPT' && el.src) {
      injected.push(el.src);
      const path = el.src.split('?')[0];
      setTimeout(() => {
        if (fail.includes(path)) { if (typeof el.onerror === 'function') el.onerror(); return; }
        if (serve && serve[path]) vm.runInContext(serve[path], ctx, { filename: path });
        if (typeof el.onload === 'function') el.onload();
      }, 0);
    }
    return el;
  };
  vm.createContext(ctx);
  for (const [name, code] of bundles) {
    vm.runInContext(code, ctx, { filename: name });
  }
  ctx.__injected = injected;
  return ctx;
}

const memberCtx = () => runBundles([['app-member.js', CHMS_APP_MEMBER_JS]]);
const fullCtx = () => runBundles([
  ['app-member.js', CHMS_APP_MEMBER_JS],
  ['app-staff.js', CHMS_APP_STAFF_JS],
  ['app-ext.js', CHMS_APP_EXT_JS],
]);

/**
 * The bare function calls inside the window 'load' handler's .finally() — i.e. the work that
 * runs on every page load for every role. Read out of the shipped bundle rather than listed by
 * hand, so a new boot call that the member bundle cannot satisfy fails here instead of on a
 * member's phone.
 */
function bootCalls() {
  // CR3 moved loadTags()/loadMemberTypes() out of the .finally() block to fire in parallel
  // with /me (neither reads _userRole) — so the boot calls this test cares about now span two
  // segments: the plain top-level statements right before the api('/admin/api/me') call, and
  // the original .finally() block. Scanning only .finally() would silently stop covering the
  // two calls that moved, which is exactly the kind of drift this test exists to catch.
  const meAt = CHMS_APP_MEMBER_JS.indexOf("api('/admin/api/me')");
  expect(meAt, 'boot /me call not found — has js-core been restructured?').toBeGreaterThan(-1);
  const fetchRoleAt = CHMS_APP_MEMBER_JS.lastIndexOf('// Fetch role first', meAt);
  expect(fetchRoleAt, 'pre-/me boot comment not found — has js-core been restructured?').toBeGreaterThan(-1);
  const preBlock = CHMS_APP_MEMBER_JS.slice(fetchRoleAt, meAt);

  const finallyAt = CHMS_APP_MEMBER_JS.indexOf('.finally(function() {');
  expect(finallyAt, 'boot .finally() block not found — has js-core been restructured?').toBeGreaterThan(-1);
  const finallyBlock = CHMS_APP_MEMBER_JS.slice(finallyAt, CHMS_APP_MEMBER_JS.indexOf('\n  });', finallyAt));

  const all = [], memberReached = [];
  const scan = (block, indent) => {
    const re = new RegExp('^ {' + indent + '}(if \\(([^)]*)\\) )?([a-zA-Z_$][\\w$]*)\\(', 'gm');
    for (const m of block.matchAll(re)) {
      const [, , guard, name] = m;
      if (name === 'if') continue;
      all.push(name);
      // loadFunds is deliberately skipped for a member (funds are giving data — a guaranteed
      // 403), so it is not required to be in the member bundle. Honor that guard rather than
      // demanding every boot call be present, which would block a legitimate future move.
      if (!(guard && /_userRole\s*!==\s*'member'/.test(guard))) memberReached.push(name);
    }
  };
  scan(preBlock, 2);
  scan(finallyBlock, 4);
  return { all: [...new Set(all)], memberReached: [...new Set(memberReached)] };
}

describe('app-member.js stands on its own', () => {
  it('evaluates with no other bundle present', () => {
    // Necessary but not sufficient: a reference to a global that lives in another bundle only
    // throws when it RUNS, so this catches a parse/top-level failure and the boot test below
    // catches the rest.
    expect(() => memberCtx()).not.toThrow();
  });

  it('can run every boot call a member session actually reaches', () => {
    const ctx = memberCtx();
    const { all, memberReached } = bootCalls();
    // Sanity-check the extraction itself, so an empty list can never pass silently.
    expect(all.length).toBeGreaterThanOrEqual(4);
    expect(memberReached).toContain('loadMemberTypes');
    // The guard is real and still there — if loadFunds ever loses it, this list grows and the
    // loop below starts demanding it, which is the correct outcome.
    expect(all).toContain('loadFunds');
    for (const fn of memberReached) {
      expect(typeof ctx[fn], fn + '() runs on every member load but is not in the member bundle')
        .toBe('function');
      expect(() => ctx[fn](), fn + '() threw during boot').not.toThrow();
    }
  });

  it('defines the shared state the People views read', () => {
    const ctx = memberCtx();
    for (const fn of ['api', 'esc', 'showTab', 'applyRoleUI', 'applyPermissionUI']) {
      expect(typeof ctx[fn], fn + ' is missing from the member bundle').toBe('function');
    }
    // Read by the People filter chip label and the person-edit type <select>.
    expect(Array.isArray(ctx._memberTypes)).toBe(true);
  });

  it('renders the one tab a member can open', () => {
    const ctx = memberCtx();
    ctx.applyRoleUI('member', 'A Member', { finance: false, staff: false, register: false, reports: false });
    expect(() => ctx.showTab('people')).not.toThrow();
    expect(typeof ctx.loadPeople).toBe('function');
  });

  it('redirects a member away from tabs whose code it does not ship', () => {
    const ctx = memberCtx();
    ctx.applyRoleUI('member', '', { finance: false, staff: false, register: false, reports: false });
    // showTab rewrites any non-people target to 'people' for a member BEFORE reaching the
    // per-tab load call — which is what keeps loadDashboard/givSetView/loadFinance, none of
    // which are in this bundle, from ever being evaluated.
    for (const tab of ['home', 'giving', 'finance', 'attendance', 'households', 'settings']) {
      expect(() => ctx.showTab(tab), 'showTab(' + tab + ') threw').not.toThrow();
    }
  });

  it('does not carry the code a member cannot reach', () => {
    const ctx = memberCtx();
    for (const fn of ['loadFinance', 'givSetView', 'loadTuitionAid', 'loadAttendance',
                      'loadSettings', 'loadDashboard', 'loadRegister', 'initReports']) {
      expect(typeof ctx[fn], fn + ' leaked into the member bundle').toBe('undefined');
    }
  });
});

describe('Reports for a member is lazy, not missing', () => {
  it('fetches the other two bundles, in shell order, on first open', async () => {
    const ctx = memberCtx();
    ctx.applyRoleUI('member', '', { finance: false, staff: false, register: false, reports: true });
    ctx.showTab('reports');
    await new Promise((r) => setTimeout(r, 5));
    const names = ctx.__injected.map((s) => s.split('?')[0]);
    expect(names).toEqual(['/admin/app-staff.js', '/admin/app-ext.js']);
  });

  it('asks once, however many times the tab is opened', async () => {
    const ctx = memberCtx();
    ctx.applyRoleUI('member', '', { finance: false, staff: false, register: false, reports: true });
    ctx.showTab('reports');
    ctx.showTab('reports');
    ctx.showTab('reports');
    await new Promise((r) => setTimeout(r, 5));
    expect(ctx.__injected.length).toBe(2);
  });

  it('is inert for a role that already has the code', async () => {
    const ctx = fullCtx();
    ctx.applyRoleUI('admin', '', null);
    ctx.showTab('reports');
    await new Promise((r) => setTimeout(r, 5));
    expect(ctx.__injected).toEqual([]);
  });
});

describe('the split loses nothing', () => {
  it('member + staff is exactly the old app-core', () => {
    expect(CHMS_APP_CORE_JS).toBe(CHMS_APP_MEMBER_JS + '\n' + CHMS_APP_STAFF_JS);
  });

  it('defines the same globals the unsplit app did', () => {
    const globalsOf = (s) => new Set([
      ...[...s.matchAll(/^(?:async )?function ([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]),
      ...[...s.matchAll(/^(?:var|let|const) ([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]),
    ]);
    const halves = new Set([...globalsOf(CHMS_APP_MEMBER_JS), ...globalsOf(CHMS_APP_STAFF_JS)]);
    for (const n of globalsOf(CHMS_APP_CORE_JS)) {
      expect(halves.has(n), n + ' was dropped by the split').toBe(true);
    }
  });

  it('keeps the full app a single global scope — no name is defined twice', () => {
    // Concatenated bundles share one scope, so a duplicated top-level name would silently
    // shadow. This held before the split and has to keep holding after it. P25-E adds a
    // fourth bundle (finance), which loads on top of the other three at runtime (never
    // standalone), so it has to be checked against all of them too.
    const seen = new Map();
    for (const [name, code] of [['member', CHMS_APP_MEMBER_JS], ['staff', CHMS_APP_STAFF_JS],
                                ['ext', CHMS_APP_EXT_JS], ['finance', CHMS_APP_FINANCE_JS]]) {
      for (const m of code.matchAll(/^(?:async )?function ([A-Za-z_$][\w$]*)/gm)) {
        expect(seen.has(m[1]) ? m[1] + ' also in ' + seen.get(m[1]) : '').toBe('');
        seen.set(m[1], name);
      }
    }
  });
});

describe('P25-E: Finance split out of app-ext.js along the permission line', () => {
  const financeCtx = () => runBundles([
    ['app-member.js', CHMS_APP_MEMBER_JS],
    ['app-staff.js', CHMS_APP_STAFF_JS],
    ['app-ext.js', CHMS_APP_EXT_JS],
  ]);

  it('is never in the shell\'s eager script tags, for any role', () => {
    // Unlike the member/staff split, this is not a role-line cut: nobody's landing tab is
    // Finance, so app-finance.js is fetched lazily for every role, admin included.
    for (const role of ['admin', 'finance', 'staff', 'council', 'member', null, undefined, 'future-role']) {
      expect(chmsHtmlForRole(role), String(role)).not.toMatch(/app-finance\.js/);
    }
  });

  it('does not carry finance code before it is loaded', () => {
    const ctx = financeCtx();
    expect(typeof ctx.loadFinance, 'loadFinance leaked into app-ext.js').toBe('undefined');
    expect(typeof ctx.finShowSection, 'finShowSection leaked into app-ext.js').toBe('undefined');
  });

  it('fetches app-finance.js the first time the Finance tab is opened', async () => {
    const ctx = financeCtx();
    ctx.applyRoleUI('finance', '', { finance: true, staff: false, register: false, reports: true });
    ctx.showTab('finance');
    await new Promise((r) => setTimeout(r, 5));
    expect(ctx.__injected.map((s) => s.split('?')[0])).toEqual(['/admin/app-finance.js']);
  });

  it('asks once, however many times the Finance tab is opened', async () => {
    const ctx = financeCtx();
    ctx.applyRoleUI('finance', '', { finance: true, staff: false, register: false, reports: true });
    ctx.showTab('finance');
    ctx.showTab('finance');
    ctx.showTab('finance');
    await new Promise((r) => setTimeout(r, 5));
    expect(ctx.__injected.length).toBe(1);
  });

  it('loading Finance does not shadow or lose anything the rest of the app defines', () => {
    // The one real bug class this kind of split can introduce (per CR9's own precedent):
    // a global landing in the wrong half, or a name the finance bundle happens to reuse.
    const ctx = financeCtx();
    vm.runInContext(CHMS_APP_FINANCE_JS, ctx, { filename: 'app-finance.js' });
    expect(typeof ctx.loadFinance).toBe('function');
    expect(typeof ctx.finShowSection).toBe('function');
    // esc() (core) and givSetView() (ext) must still resolve correctly after finance loads on
    // top — i.e. finance did not redeclare either and silently shadow it.
    expect(ctx.esc('<b>')).toBe('&lt;b&gt;');
    expect(typeof ctx.givSetView).toBe('function');
  });

  it('Giving’s Reports view loads Finance on demand too, since it calls into Finance’s chart helpers', async () => {
    // The one real cross-module coupling found before shipping this split: js-giving.js's
    // 'reports' view calls finInitGivingReports() unconditionally. A giving-only account
    // (giving:edit, finance:none) must not hit a ReferenceError opening it. Uses the admin
    // role purely so permView('giving') short-circuits true — this harness's stub fetch
    // never populates the granular _perm matrix the way a real /me response would. The three
    // sibling calls in that same branch (loadBoardReport/givPopulateFundSelect/givAnalysisInit)
    // need real fund/report data this minimal DOM harness doesn't provide — stubbed out here
    // since they are unrelated to what this test is checking.
    const ctx = financeCtx();
    ctx.applyRoleUI('admin', '', null);
    ctx.loadBoardReport = () => {};
    ctx.givPopulateFundSelect = () => {};
    ctx.givAnalysisInit = () => {};
    expect(() => ctx.givSetView('reports')).not.toThrow();
    await new Promise((r) => setTimeout(r, 5));
    expect(ctx.__injected.map((s) => s.split('?')[0])).toEqual(['/admin/app-finance.js']);
  });
});

describe('app-ext.js is lazy for every role', () => {
  const SERVE = {
    '/admin/app-staff.js': CHMS_APP_STAFF_JS,
    '/admin/app-ext.js': CHMS_APP_EXT_JS,
    '/admin/app-finance.js': CHMS_APP_FINANCE_JS,
  };
  // What a non-member role is served eagerly now: member + staff, no ext.
  const staffCtx = (opts) => runBundles([
    ['app-member.js', CHMS_APP_MEMBER_JS],
    ['app-staff.js', CHMS_APP_STAFF_JS],
  ], { serve: SERVE, ...opts });
  const names = (ctx) => ctx.__injected.map((s) => s.split('?')[0]);
  const tick = () => new Promise((r) => setTimeout(r, 5));
  // Chained lazy loads run each bundle on its own timer (see appendChild above), and the Finance
  // bundle is large enough that a busy CI runner can still be evaluating it after one short tick.
  // Wait for the condition itself, up to a second, instead of a fixed delay.
  const until = async (ready) => { for (let i = 0; i < 200 && !ready(); i += 1) await tick(); };
  const activate = (ctx, tab) => ctx.document.getElementById('tab-' + tab).classList.add('active');

  it('is not needed to land on Home, attendance entry included', async () => {
    const ctx = staffCtx();
    ctx.applyRoleUI('admin', '', null);
    expect(() => ctx.showTab('home')).not.toThrow();
    await tick();
    expect(names(ctx)).toEqual([]);
    // Home's attendance card checks for these before rendering its entry form.
    expect(typeof ctx.attSaveSunday).toBe('function');
    expect(typeof ctx.attSundayMap).toBe('function');
    expect(typeof ctx.initReports, 'app-ext.js code is in the eager bundles').toBe('undefined');
  });

  for (const tab of ['giving', 'attendance', 'reports', 'tuitionaid', 'volunteers', 'import']) {
    it('fetches app-ext.js (only) the first time ' + tab + ' is opened', async () => {
      const ctx = staffCtx();
      ctx.applyRoleUI('admin', '', null);
      ctx.showTab(tab);
      await tick();
      expect(names(ctx)).toEqual(['/admin/app-ext.js']);
      expect(typeof ctx.initReports).toBe('function');
    });
  }

  it('runs the tab\'s own load once the bundle has arrived', async () => {
    // A later declaration in the same script wins, so this records the call showTab defers.
    const ctx = staffCtx({ serve: { ...SERVE, '/admin/app-ext.js': CHMS_APP_EXT_JS + '\nvar __seen = []; function givSetView(v) { __seen.push(v); }' } });
    ctx.applyRoleUI('admin', '', null);
    activate(ctx, 'giving');
    ctx.showTab('giving');
    expect(ctx.__seen).toBeUndefined(); // nothing ran before the bundle arrived
    await tick();
    expect(ctx.__seen).toEqual([ctx._givView]);
  });

  it('skips the deferred load when the user has already left the tab', async () => {
    const ctx = staffCtx({ serve: { ...SERVE, '/admin/app-ext.js': CHMS_APP_EXT_JS + '\nvar __extLoadCalls = 0; function loadTuitionAid() { __extLoadCalls++; }' } });
    ctx.applyRoleUI('admin', '', null);
    ctx.showTab('tuitionaid'); // panel never marked active in this harness = user moved on
    await tick();
    expect(ctx.__extLoadCalls).toBe(0);
  });

  it('asks once, across every tab that needs it', async () => {
    const ctx = staffCtx();
    ctx.applyRoleUI('admin', '', null);
    for (const tab of ['giving', 'attendance', 'reports', 'giving', 'volunteers']) ctx.showTab(tab);
    await tick();
    expect(names(ctx)).toEqual(['/admin/app-ext.js']);
  });

  it('loads Register at once and fetches app-ext.js for its People prompt', async () => {
    const ctx = staffCtx();
    ctx.applyRoleUI('admin', '', null);
    let registerLoaded = false;
    ctx.loadRegister = () => { registerLoaded = true; };
    ctx.showTab('register');
    expect(registerLoaded).toBe(true);
    await tick();
    expect(names(ctx)).toEqual(['/admin/app-ext.js']);
    expect(typeof ctx.openRegFromPeoplePrompt).toBe('function');
  });

  it('loads Settings at once and fetches app-ext.js for its exports and imports', async () => {
    const ctx = staffCtx();
    ctx.applyRoleUI('admin', '', null);
    let settingsLoaded = false;
    ctx.loadSettings = () => { settingsLoaded = true; };
    ctx.showTab('settings');
    expect(settingsLoaded).toBe(true);
    await until(() => typeof ctx.exportPeople === 'function');
    expect(names(ctx)).toEqual(['/admin/app-ext.js']);
    expect(typeof ctx.exportPeople).toBe('function');
  });

  it('Finance fetches app-ext.js first, since js-finance.js reuses its helpers', async () => {
    const ctx = staffCtx();
    ctx.applyRoleUI('finance', '', { finance: true, staff: false, register: false, reports: true });
    ctx.showTab('finance');
    await until(() => typeof ctx.loadFinance === 'function');
    expect(names(ctx)).toEqual(['/admin/app-ext.js', '/admin/app-finance.js']);
    expect(typeof ctx.loadFinance).toBe('function');
  });

  it('People\'s "go to batch" link waits for the Giving code', () => {
    const people = CHMS_APP_MEMBER_JS;
    expect(people).toContain('ensureExtLoaded(function(){goToBatch(');
    expect(people).not.toMatch(/[;"]goToBatch\(/);
  });

  it('the eager bundles reach into app-ext.js only at the reviewed call sites', () => {
    // Every name below is either called inside an ensureExtLoaded() callback (showTab, the boot
    // Giving deep links, People's batch link), or in the Giving tab's letter-template preview
    // (js-settings.js), which can only be clicked once Giving has loaded the bundle. A NEW reference here is a potential
    // ReferenceError for a staff account that has not opened one of those tabs yet: route it
    // through ensureExtLoaded() (or move the helper out of app-ext.js), then add it here.
    const defs = (src) => new Set([...src.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|^(?:var|let|const)\s+([A-Za-z_$][\w$]*)/gm)]
      .map((m) => m[1] || m[2]));
    const eager = (CHMS_APP_MEMBER_JS + '\n' + CHMS_APP_STAFF_JS)
      .split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
    const used = [...defs(CHMS_APP_EXT_JS)]
      .filter((n) => new RegExp('(?<![\\w$.])' + n.replace(/\$/g, '\\$') + '(?![\\w$])').test(eager))
      .sort();
    expect(used).toEqual([
      '_givView', 'givOffSetPane', 'givSetView', 'goToBatch', 'initReports',
      'letterheadImgHtml', 'loadAttendance', 'loadTuitionAid', 'renderLetterHTML',
      'volLoadEvents', 'volLoadMinistryRoles', 'volLoadSignups', 'volLoadTemplates',
    ]);
  });

  it('reports a failed load and retries on the next open', async () => {
    const ctx = staffCtx({ fail: ['/admin/app-ext.js'] });
    ctx.applyRoleUI('admin', '', null);
    ctx.showTab('giving');
    await tick();
    const banner = ctx.document.getElementById('error-boundary');
    expect(banner.innerHTML).toContain('Could not load that section');
    ctx.showTab('giving');
    await tick();
    expect(names(ctx)).toEqual(['/admin/app-ext.js', '/admin/app-ext.js']);
  });

  it('a failed app-ext.js load does not wedge the Finance loader', async () => {
    const failing = ['/admin/app-ext.js'];
    const ctx = staffCtx({ fail: failing });
    ctx.applyRoleUI('finance', '', { finance: true, staff: false, register: false, reports: true });
    ctx.showTab('finance');
    await tick();
    expect(names(ctx)).toEqual(['/admin/app-ext.js']);
    failing.length = 0; // the connection comes back
    ctx.showTab('finance');
    await until(() => typeof ctx.loadFinance === 'function');
    expect(names(ctx)).toEqual(['/admin/app-ext.js', '/admin/app-ext.js', '/admin/app-finance.js']);
    expect(typeof ctx.loadFinance).toBe('function');
  });
});

describe('app-ext.js is prefetched in the background once the landing tab is up', () => {
  const SERVE = { '/admin/app-staff.js': CHMS_APP_STAFF_JS, '/admin/app-ext.js': CHMS_APP_EXT_JS };
  const staffCtx = (opts) => {
    const ctx = runBundles([
      ['app-member.js', CHMS_APP_MEMBER_JS],
      ['app-staff.js', CHMS_APP_STAFF_JS],
    ], { serve: SERVE, ...opts });
    ctx.EXT_PREFETCH_DELAY_MS = 0; // same-context global; keeps the test from waiting 2s
    return ctx;
  };
  const names = (ctx) => ctx.__injected.map((x) => x.split('?')[0]);
  const tick = () => new Promise((r) => setTimeout(r, 10));
  // app-ext.js is large; on a busy runner it can still be evaluating after one tick (see #1158).
  const until = async (ready) => { for (let i = 0; i < 100 && !ready(); i += 1) await tick(); };
  const extReady = (ctx) => () => typeof ctx.initReports === 'function';

  it('is scheduled by the boot sequence, after the landing tab is shown', () => {
    const at = CHMS_APP_MEMBER_JS.indexOf('.finally(function() {');
    const block = CHMS_APP_MEMBER_JS.slice(at, CHMS_APP_MEMBER_JS.indexOf('\n  });', at));
    expect(block).toMatch(/showTab\(hashTab \|\| defaultTab\);[\s\S]*scheduleExtPrefetch\(\);/);
  });

  it('fetches app-ext.js for a staff role without any tab being opened', async () => {
    const ctx = staffCtx();
    ctx.applyRoleUI('admin', '', null);
    ctx.scheduleExtPrefetch();
    await until(extReady(ctx));
    expect(names(ctx)).toEqual(['/admin/app-ext.js']);
    expect(typeof ctx.initReports).toBe('function');
  });

  it('waits before starting, so the landing tab\'s own requests go first', async () => {
    const ctx = staffCtx();
    ctx.EXT_PREFETCH_DELAY_MS = 50;
    ctx.applyRoleUI('admin', '', null);
    ctx.scheduleExtPrefetch();
    await tick();
    expect(names(ctx)).toEqual([]);
    await until(extReady(ctx));
    expect(names(ctx)).toEqual(['/admin/app-ext.js']);
  });

  it('uses requestIdleCallback when the browser has it', async () => {
    const ctx = staffCtx();
    const idle = [];
    ctx.requestIdleCallback = (fn, opts) => { idle.push(opts); fn(); };
    ctx.applyRoleUI('admin', '', null);
    ctx.scheduleExtPrefetch();
    await until(extReady(ctx));
    expect(idle).toEqual([{ timeout: 5000 }]);
    expect(names(ctx)).toEqual(['/admin/app-ext.js']);
  });

  it('does not prefetch for a member', async () => {
    const ctx = runBundles([['app-member.js', CHMS_APP_MEMBER_JS]], { serve: SERVE });
    ctx.EXT_PREFETCH_DELAY_MS = 0;
    ctx.applyRoleUI('member', '', { finance: false, staff: false, register: false, reports: true });
    ctx.scheduleExtPrefetch();
    await tick();
    expect(names(ctx)).toEqual([]);
  });

  for (const [label, connection] of [
    ['Save-Data is on', { saveData: true, effectiveType: '4g' }],
    ['the connection is 2G', { effectiveType: '2g' }],
    ['the connection is slow-2G', { effectiveType: 'slow-2g' }],
  ]) {
    it('does not prefetch when ' + label, async () => {
      const ctx = staffCtx();
      ctx.navigator.connection = connection;
      ctx.applyRoleUI('admin', '', null);
      ctx.scheduleExtPrefetch();
      await tick();
      expect(names(ctx)).toEqual([]);
    });
  }

  it('still prefetches on 3G/4G', async () => {
    for (const effectiveType of ['3g', '4g']) {
      const ctx = staffCtx();
      ctx.navigator.connection = { saveData: false, effectiveType };
      ctx.applyRoleUI('admin', '', null);
      ctx.scheduleExtPrefetch();
      await until(extReady(ctx));
      expect(names(ctx), effectiveType).toEqual(['/admin/app-ext.js']);
    }
  });

  it('a tab opened after the prefetch finished needs no fetch of its own', async () => {
    const ctx = staffCtx();
    ctx.applyRoleUI('admin', '', null);
    ctx.scheduleExtPrefetch();
    await until(extReady(ctx));
    ctx.showTab('giving');
    await tick();
    expect(names(ctx)).toEqual(['/admin/app-ext.js']);
  });

  it('a tab opened mid-prefetch joins the same load', async () => {
    const ctx = staffCtx();
    ctx.applyRoleUI('admin', '', null);
    ctx.showTab('attendance'); // starts the load
    ctx.scheduleExtPrefetch(); // then the prefetch fires while it is in flight
    await until(extReady(ctx));
    expect(names(ctx)).toEqual(['/admin/app-ext.js']);
  });

  it('a failed prefetch is silent, and the next tab open retries and reports', async () => {
    const failing = ['/admin/app-ext.js'];
    const ctx = staffCtx({ fail: failing });
    ctx.applyRoleUI('admin', '', null);
    ctx.scheduleExtPrefetch();
    await tick();
    const banner = ctx.document.getElementById('error-boundary');
    expect(banner.innerHTML).toBe('');
    ctx.showTab('giving');
    await tick();
    expect(banner.innerHTML).toContain('Could not load that section');
    expect(names(ctx)).toEqual(['/admin/app-ext.js', '/admin/app-ext.js']);
  });
});

describe('the shell decides, because the cached assets cannot', () => {
  const tags = (h) => (h.match(/app-[a-z]+\.js/g) || []);

  it('sends a member one bundle', () => {
    expect(tags(chmsHtmlForRole('member'))).toEqual(['app-member.js']);
  });

  it('sends every other role member + staff, in load order', () => {
    for (const role of ['admin', 'finance', 'staff', 'council']) {
      expect(tags(chmsHtmlForRole(role)), role).toEqual(['app-member.js', 'app-staff.js']);
    }
  });

  it('fails safe on an unrecognized role', () => {
    // Under-serving scripts to a real user breaks their app; over-serving to a member costs
    // bytes. An unknown role must land on the harmless side.
    for (const role of [null, undefined, '', 'future-role']) {
      expect(tags(chmsHtmlForRole(role)), String(role)).toEqual(['app-member.js', 'app-staff.js']);
    }
  });

  it('never puts app-ext.js in the eager script tags', () => {
    for (const role of ['admin', 'finance', 'staff', 'council', 'volunteer', 'member', null, 'future-role']) {
      expect(chmsHtmlForRole(role), String(role)).not.toMatch(/app-ext\.js/);
    }
  });

  it('markup is identical whichever role asked — only the script tags differ', () => {
    const strip = (h) => h.replace(/<script src="\/admin\/app-[a-z]+\.js\?v=[^"]*" defer><\/script>\n/g, '');
    expect(strip(chmsHtmlForRole('member'))).toBe(strip(CHMS_HTML));
  });

  it('is meaningfully smaller for a member', () => {
    const B = (s) => Buffer.byteLength(s);
    const member = B(chmsHtmlForRole('member')) + B(CHMS_APP_MEMBER_JS);
    const full = B(CHMS_HTML) + B(CHMS_APP_MEMBER_JS) + B(CHMS_APP_STAFF_JS) + B(CHMS_APP_EXT_JS);
    expect(member).toBeLessThan(full * 0.45);
  });
});

describe('the rest of the plumbing followed the rename', () => {
  const worker = fs.readFileSync(new URL('../connect-worker.js', import.meta.url), 'utf8');

  it('the worker serves both new bundles', () => {
    expect(worker).toMatch(/path === '\/admin\/app-member\.js'/);
    expect(worker).toMatch(/path === '\/admin\/app-staff\.js'/);
    expect(worker).toMatch(/path === '\/admin\/app-ext\.js'/);
  });

  it('nothing still points at the retired app-core.js route', () => {
    // The path, not the word: both files still mention app-core.js in comments explaining what
    // the split replaced, and that prose should not be what fails.
    expect(worker).not.toContain('/admin/app-core.js');
    expect(CHMS_HTML).not.toContain('app-core.js');
    expect(SW_JS).not.toContain('/admin/app-core.js');
  });

  it('the service worker caches the bundles that now exist', () => {
    // These are the immutable ?v= assets. Missing one here means a relaunch re-fetches it,
    // which is exactly the cost the member split exists to remove.
    for (const p of ['/admin/app-member.js', '/admin/app-staff.js', '/admin/app-ext.js', '/admin/app.css']) {
      expect(SW_JS, p + ' is not cached by the service worker').toContain(p);
    }
  });

  it('the shell serves the role, not a constant', () => {
    // Two routes render the app shell; both have to ask.
    const calls = worker.match(/chmsHtmlForRole\(auth\.role\)/g) || [];
    expect(calls.length).toBe(2);
    expect(worker).not.toMatch(/html\(CHMS_HTML/);
  });
});
