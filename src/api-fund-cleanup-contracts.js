// ── Fund cleanup (Finance › Giving › Fund cleanup) ───────────────────────────────────────────
// Years of Breeze imports left funds that are really one fund under two names ("46045 Youth" /
// "46045 Youth Gathering", "25004 Building Fund" / "Building Fund") and funds no longer used
// (an old Easter egg hunt, VBS). Finance lists them here and an admin combines or retires them.
//
//   GET  /api/contracts/giving-fund-cleanup-v1        every fund with its gift count, lifetime and
//                                                      this-year totals and last gift month, plus
//                                                      the likely-duplicate groups. Fund-level
//                                                      aggregates only, no donor.
//   POST /api/contracts/giving-fund-cleanup-write-v1  { op: 'merge', keep_id, remove_ids }
//                                                      { op: 'retire' | 'restore', fund_ids }
//
// Both are Connect admin only (the same gate as Connect's own Manage Funds merge). A merge moves
// every gift, recurring schedule and test gift from the removed funds to the kept one (the monthly
// fund totals follow through their triggers), then deletes the removed fund rows and writes an
// audit entry naming them. Retiring only sets active=0: the fund leaves every gift-entry and
// online-giving picker and Finance's fund lists, and all its history stays.
import { json } from './auth.js';
import { normalizeFundCategory } from './api-utils.js';

const NUMBER_RE = /^\s*(\d{4,})\b/;

// The name without its leading account number, lowercased, punctuation and spacing collapsed:
// "25004 Building Fund" and "Building  fund" both read "building fund".
export function fundBaseName(name) {
  return String(name || '').replace(NUMBER_RE, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function fundNumber(name) {
  const m = NUMBER_RE.exec(String(name || ''));
  return m ? m[1] : '';
}

// Funds that share an account number, or the same name once the number is set aside, form one
// group (joined transitively). Each group of two or more is returned with a suggested fund to
// keep: a numbered one first, then the one with the most gifts, then the oldest.
export function groupFundDuplicates(funds) {
  const parent = new Map(funds.map((f) => [f.id, f.id]));
  const find = (id) => { while (parent.get(id) !== id) id = parent.get(id); return id; };
  const union = (a, b) => { const ra = find(a); const rb = find(b); if (ra !== rb) parent.set(rb, ra); };
  const byKey = new Map();
  for (const f of funds) {
    const keys = [];
    const num = fundNumber(f.name);
    if (num) keys.push(`n:${num}`);
    const base = fundBaseName(f.name);
    if (base) keys.push(`b:${base}`);
    for (const k of keys) {
      if (byKey.has(k)) union(byKey.get(k), f.id); else byKey.set(k, f.id);
    }
  }
  const groups = new Map();
  for (const f of funds) {
    const root = find(f.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(f);
  }
  const rank = (f) => [fundNumber(f.name) ? 0 : 1, -(f.gift_count || 0), f.id];
  const cmp = (a, b) => { const x = rank(a); const y = rank(b); for (let i = 0; i < x.length; i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
  return [...groups.values()]
    .filter((g) => g.length > 1)
    .map((g) => {
      const sorted = [...g].sort(cmp);
      const nums = [...new Set(g.map((f) => fundNumber(f.name)).filter(Boolean))];
      return { reason: nums.length === 1 && g.every((f) => fundNumber(f.name)) ? `Same account number ${nums[0]}` : nums.length ? `Same name, account ${nums.join(' / ')}` : 'Same name', suggested_keep_id: sorted[0].id, fund_ids: sorted.map((f) => f.id) };
    })
    .sort((a, b) => String(a.reason).localeCompare(String(b.reason)));
}

export async function buildFundCleanup(db, now = new Date()) {
  const year = String(now.getUTCFullYear());
  const funds = (await db.prepare('SELECT id, name, category, active FROM funds ORDER BY name, id').all()).results || [];
  const stats = (await db.prepare(
    `SELECT fund_id, COALESCE(SUM(gift_count),0) AS gift_count, COALESCE(SUM(total_cents),0) AS total_cents,
            COALESCE(SUM(CASE WHEN substr(month,1,4)=? THEN total_cents ELSE 0 END),0) AS year_cents,
            MAX(month) AS last_month
       FROM giving_monthly_fund_totals GROUP BY fund_id`
  ).bind(year).all()).results || [];
  const statMap = new Map(stats.map((s) => [s.fund_id, s]));
  const rows = funds.map((f) => {
    const s = statMap.get(f.id) || {};
    return {
      id: f.id, name: f.name, category: normalizeFundCategory(f.category), active: Boolean(f.active),
      number: fundNumber(f.name), gift_count: s.gift_count || 0, total_cents: s.total_cents || 0,
      year_cents: s.year_cents || 0, last_month: s.last_month || '',
    };
  });
  return { contract: 'connect.giving-fund-cleanup.v1', year: Number(year), funds: rows, duplicate_groups: groupFundDuplicates(rows) };
}

const ids = (list) => [...new Set((Array.isArray(list) ? list : []).map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0))];

// Tables whose rows point at a fund. giving_entries carries the gifts; the other two are created
// by Connect's schema setup and may be missing from an older or test database.
const FUND_REFERENCES = ['giving_entries', 'giving_stax_recurring_schedules', 'giving_test_gifts'];

export async function applyFundCleanupWrite(db, body, email = '') {
  const op = String(body?.op || '');
  if (op === 'merge') {
    const keepId = Number(body?.keep_id);
    const removeIds = ids(body?.remove_ids);
    if (!Number.isInteger(keepId) || keepId <= 0 || !removeIds.length || removeIds.length > 20 || removeIds.includes(keepId)) {
      return { status: 400, error: 'Choose one fund to keep and at least one other fund to combine into it' };
    }
    const all = [keepId, ...removeIds];
    const found = (await db.prepare(`SELECT id, name FROM funds WHERE id IN (${all.join(',')})`).all()).results || [];
    if (found.length !== all.length) return { status: 404, error: 'One of those funds no longer exists; reload the page' };
    const names = new Map(found.map((f) => [f.id, f.name]));
    let moved = 0;
    for (const table of FUND_REFERENCES) {
      try {
        const r = await db.prepare(`UPDATE ${table} SET fund_id=? WHERE fund_id IN (${removeIds.join(',')})`).bind(keepId).run();
        if (table === 'giving_entries') moved = r?.meta?.changes || 0;
      } catch (e) {
        if (!/no such table/i.test(String(e?.message || e))) throw e;
      }
    }
    await db.prepare(`DELETE FROM funds WHERE id IN (${removeIds.join(',')})`).bind().run();
    await db.prepare(
      `INSERT INTO audit_log(action,entity_type,entity_id,person_name,field,old_value,new_value) VALUES(?,?,?,?,?,?,?)`
    ).bind('merge_funds_via_finance', 'fund', keepId, '', 'merged_from',
      JSON.stringify(removeIds.map((id) => ({ id, name: names.get(id) }))), `${moved} gifts moved into ${names.get(keepId)} by ${email}`).run().catch(() => {});
    return { status: 200, ok: true, moved_gifts: moved, kept: names.get(keepId), removed: removeIds.length };
  }
  if (op === 'retire' || op === 'restore') {
    const fundIds = ids(body?.fund_ids);
    if (!fundIds.length || fundIds.length > 200) return { status: 400, error: 'Choose at least one fund' };
    const active = op === 'restore' ? 1 : 0;
    const r = await db.prepare(`UPDATE funds SET active=? WHERE id IN (${fundIds.join(',')})`).bind(active).run();
    await db.prepare(
      `INSERT INTO audit_log(action,entity_type,entity_id,person_name,field,old_value,new_value) VALUES(?,?,?,?,?,?,?)`
    ).bind(`${op}_funds_via_finance`, 'fund', null, '', 'active', JSON.stringify(fundIds), `${active} by ${email}`).run().catch(() => {});
    return { status: 200, ok: true, changed: r?.meta?.changes ?? fundIds.length };
  }
  return { status: 400, error: 'Unknown action' };
}
