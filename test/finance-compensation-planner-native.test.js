// Compensation → Planner, Finance's own interactive page (apps/finance/planner/). Drives it in a
// real Chromium against the Finance Worker with a fabricated plan (test/fixtures/planner-harness.js),
// checking the figures against compensation-projection.js and what each change saves.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { chromium } from 'playwright-core';
import { bundlePlanner, bundleModule, BUNDLE_PATH } from '../apps/finance/planner/build.mjs';
import { projectCompensation } from '../apps/finance/compensation-projection.js';
import { PLANNER_FIXTURE_LEDGER, PLANNER_FIXTURE_PLAN, plannerEnv, servePlanner } from './fixtures/planner-harness.js';

describe('Compensation Planner bundle', () => {
  it('is up to date with apps/finance/planner (run node apps/finance/planner/build.mjs)', async () => {
    expect(fs.readFileSync(BUNDLE_PATH, 'utf8')).toBe(bundleModule(await bundlePlanner()));
  }, 30000);
});

// A local Chromium when one is installed (Playwright's, or Chrome on a CI runner).
function browserExecutable() {
  const candidates = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  if (fs.existsSync('/opt/pw-browsers')) {
    for (const dir of fs.readdirSync('/opt/pw-browsers')) candidates.push(`/opt/pw-browsers/${dir}/chrome-linux/chrome`);
  }
  return candidates.find((p) => p && fs.existsSync(p) && fs.statSync(p).isFile()) || null;
}
const executablePath = browserExecutable();

describe.skipIf(!executablePath)('Compensation Planner in a browser', () => {
  let browser;
  beforeAll(async () => { browser = await chromium.launch({ executablePath }); });
  afterAll(async () => { if (browser) await browser.close(); });

  async function open(opts) {
    const harness = plannerEnv(opts);
    const { server, origin } = await servePlanner(harness.env);
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(origin + '/?section=compensation');
    await page.waitForSelector('.fin-comp-strip');
    const close = async () => { await page.close(); server.close(); };
    const strip = async () => (await page.textContent('.fin-comp-strip')).replace(/\s+/g, ' ');
    const waitForSave = (n) => page.waitForFunction(() => /Saved/.test(document.querySelector('.fin-comp-save')?.textContent || ''), null, { timeout: 5000 })
      .then(() => expect(harness.writes.length).toBeGreaterThanOrEqual(n));
    return { ...harness, page, errors, close, strip, waitForSave, origin };
  }

  it('shows the same totals as Finance’s projection model and runs without errors', async () => {
    const t = await open();
    const config = JSON.parse(await t.page.textContent('#cp-config'));
    const { totals } = projectCompensation({ saved: PLANNER_FIXTURE_PLAN, targetYear: config.targetYear, baseAccounts: PLANNER_FIXTURE_LEDGER });
    const money = (c) => '$' + Math.round(c / 100).toLocaleString('en-US');
    const s = await t.strip();
    expect(s).toContain(money(totals.salaryCents));
    expect(s).toContain(money(totals.benefitsCents));
    expect(s).toContain(money(totals.totalCents));
    for (const view of ['fairness', 'health', 'rates', 'council', 'plan']) {
      await t.page.click(`[data-act="view"][data-v="${view}"]`);
      await t.page.waitForSelector(`.fin-comp-pill.active[data-v="${view}"]`);
    }
    expect(t.errors).toEqual([]);
    await t.close();
  }, 30000);

  it('takes a negative custom raise as a pay cut, keeps typing focus, and autosaves the whole plan', async () => {
    const t = await open();
    const box = t.page.locator('#cp-custom-pct');
    await box.fill('');
    await box.type('-2.5');
    expect(await t.page.evaluate(() => document.activeElement.id)).toBe('cp-custom-pct');
    expect(await box.inputValue()).toBe('-2.5');
    await t.waitForSave(1);
    const body = t.writes.at(-1);
    expect(body.compCustomPct).toBe(-2.5);
    expect(body.compMethod).toBe('custom');
    expect(body.keepMe).toEqual({ untouched: true });
    expect(body.roster).toHaveLength(3);
    // Current pay $40,000 at -2.5%, paycheck-rounded.
    expect(await t.page.textContent('.fin-comp-chip.active')).toContain('Custom -2.5%');
    const directorCut = await t.page.locator('tr.fin-comp-row').nth(1).locator('td.fin-comp-td.num.active').textContent();
    expect(directorCut.trim()).toBe('$39,000');
    expect(t.errors).toEqual([]);
    await t.close();
  }, 30000);

  it('sets one worker’s method from a cell, hand-sets a salary in the panel, and edits a worker', async () => {
    const t = await open();
    await t.page.click('tr.fin-comp-row >> nth=0 >> td[data-act="methodOne"][data-k="worksheet"]');
    await t.page.waitForSelector('.fin-comp-toast');
    expect(await t.page.textContent('.fin-comp-toast')).toContain('Test Pastor → District Scale');
    await t.page.click('tr.fin-comp-row >> nth=1 >> td[data-act="select"]');
    await t.page.fill('#cp-salary-1', '45000');
    await t.page.fill('#cp-name-1', 'Test Director Renamed');
    await t.page.selectOption('select[data-change="healthTier"]', 'self');
    await t.waitForSave(1);
    await t.page.waitForTimeout(900);
    const body = t.writes.at(-1);
    expect(body.compPerWorkerMethod).toEqual({ 0: 'worksheet' });
    expect(body.compOverrides).toEqual({ 1: '45000' });
    expect(body.roster[1]).toMatchObject({ name: 'Test Director Renamed', healthTier: 'self', healthEnrolled: true });
    expect(t.errors).toEqual([]);
    await t.close();
  }, 30000);

  it('adds and removes a worker without shifting anyone else’s settings', async () => {
    const t = await open();
    await t.page.click('tr.fin-comp-row >> nth=2 >> td[data-act="methodOne"][data-k="none"]');
    await t.page.click('[data-act="addWorker"]');
    expect(await t.page.locator('tr.fin-comp-row').count()).toBe(4);
    await t.page.click('tr.fin-comp-row >> nth=0 >> td[data-act="select"]');
    t.page.once('dialog', (d) => d.accept());
    await t.page.click('[data-act="removeWorker"]');
    await t.page.waitForFunction(() => document.querySelectorAll('tr.fin-comp-row').length === 3);
    await t.waitForSave(1);
    await t.page.waitForTimeout(900);
    const body = t.writes.at(-1);
    expect(body.roster.map((w) => w.name)).toEqual(['Test Director', 'Test Helper', 'New staff member']);
    expect(body.compPerWorkerMethod).toEqual({ 1: 'none' });
    await t.close();
  }, 30000);

  it('lets council with edit permission change only the raise plan, saved as their draft', async () => {
    const t = await open({ role: 'council', compensation: 'edit' });
    expect(await t.page.textContent('.fin-comp-shell')).toContain('saved to your own council plan');
    expect(await t.page.locator('#cp-name-0').isDisabled()).toBe(true);
    expect(await t.page.locator('[data-act="addWorker"]').count()).toBe(0);
    await t.page.click('.fin-comp-chip[data-k="worksheet"]');
    await t.page.waitForFunction(() => /council draft/.test(document.querySelector('.fin-comp-save')?.textContent || ''), null, { timeout: 5000 });
    expect(t.writes).toHaveLength(0);
    const row = t.env.FINANCE_DB._raw.prepare('SELECT value FROM finance_settings WHERE key=?').get('finance_salary_planner_council_tester');
    expect(JSON.parse(row.value).compMethod).toBe('worksheet');
    await t.close();
  }, 30000);

  it('previews as council for an admin: hidden workers left out, nothing editable, nothing saved', async () => {
    const plan = JSON.parse(JSON.stringify(PLANNER_FIXTURE_PLAN));
    plan.roster[1].hideFromCouncil = true;
    const harness = plannerEnv({ plan });
    const { server, origin } = await servePlanner(harness.env);
    const page = await browser.newPage();
    await page.goto(origin + '/?section=compensation&council=1');
    await page.waitForSelector('.fin-comp-strip');
    expect(await page.textContent('.fin-comp-shell')).toContain('Council preview');
    expect(await page.locator('tr.fin-comp-row').count()).toBe(2);
    expect(await page.textContent('#cp-root')).not.toContain('Test Director');
    expect(await page.locator('.fin-comp-chip[data-act]').count()).toBe(0);
    await page.waitForTimeout(900);
    expect(harness.writes).toHaveLength(0);
    await page.close();
    server.close();
  }, 30000);

  it('is read-only for council with view permission and never saves', async () => {
    const t = await open({ role: 'council', compensation: 'view' });
    expect(await t.page.textContent('.fin-comp-shell')).toContain('read-only for your account');
    expect(await t.page.locator('.fin-comp-chip[data-act]').count()).toBe(0);
    expect(await t.page.locator('#cp-custom-pct').isDisabled()).toBe(true);
    await t.page.waitForTimeout(900);
    expect(t.writes).toHaveLength(0);
    await t.close();
  }, 30000);
});
