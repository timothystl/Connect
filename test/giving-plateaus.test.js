import { describe, it, expect } from 'vitest';
import { computeNudgeOptions, pickImpactPhrase, computeGivingPlateaus, classifyGiverGroup, expandFundCodeIds, fundCodeScope } from '../src/api-utils.js';

describe('computeNudgeOptions', () => {
  it('returns fixed, familiar round numbers — not percentage-derived figures', () => {
    expect(computeNudgeOptions(43).map(o => o.target_dollars)).toEqual([50, 60, 75]);
    expect(computeNudgeOptions(83).map(o => o.target_dollars)).toEqual([100, 125, 150]);
    expect(computeNudgeOptions(5).map(o => o.target_dollars)).toEqual([10, 15, 20]);
  });

  it('stays a modest jump at high amounts by densifying the ladder, not by scaling percentages', () => {
    // $2,500/wk no longer jumps straight to $3,000 (+20%) — the ladder itself
    // has $100 rungs in this range, so "next rung" is naturally gentle.
    const opts = computeNudgeOptions(2500);
    expect(opts.map(o => o.target_dollars)).toEqual([2600, 2700, 2800]);
    expect(opts[0].pct_increase).toBeCloseTo(4, 5);
    expect(opts[2].pct_increase).toBeCloseTo(12, 5);
  });

  it('extends in flat $1,000 steps beyond the top of the curated ladder', () => {
    expect(computeNudgeOptions(60000).map(o => o.target_dollars)).toEqual([61000, 62000, 63000]);
  });

  it('always returns 3 strictly increasing options, each above the base', () => {
    for (const base of [1, 5, 20, 43, 83, 100, 250, 1000, 2500, 10000, 30000]) {
      const opts = computeNudgeOptions(base);
      expect(opts.length).toBe(3);
      let prev = base;
      for (const o of opts) {
        expect(o.target_dollars).toBeGreaterThan(prev);
        expect(o.delta_dollars).toBe(o.target_dollars - base);
        prev = o.target_dollars;
      }
    }
  });

  it('returns an empty array for a non-positive base', () => {
    expect(computeNudgeOptions(0)).toEqual([]);
    expect(computeNudgeOptions(-5)).toEqual([]);
  });
});

describe('pickImpactPhrase', () => {
  const statements = [
    { monthly_cents: 1000, label: 'a week of coffee hour supplies' },
    { monthly_cents: 1800, label: 'one more week of Tuition Aid support' },
    { monthly_cents: 5000, label: 'a family food pantry box' },
  ];

  it('picks the richest statement the delta actually clears', () => {
    // monthly_cents thresholds are already in cents — 1800 = $18/mo, matching
    // the user's own "if you gave $18 more a month" example.
    expect(pickImpactPhrase(1800, statements)).toBe('one more week of Tuition Aid support');
    expect(pickImpactPhrase(4999, statements)).toBe('one more week of Tuition Aid support');
    expect(pickImpactPhrase(5000, statements)).toBe('a family food pantry box');
  });

  it('returns null when nothing qualifies or none are configured', () => {
    expect(pickImpactPhrase(500, statements)).toBeNull();
    expect(pickImpactPhrase(999999, [])).toBeNull();
    expect(pickImpactPhrase(999999, null)).toBeNull();
  });

  it('never fabricates a phrase — ignores malformed entries instead of guessing', () => {
    const dirty = [{ monthly_cents: 1000 }, { label: 'no amount' }, { monthly_cents: 0, label: 'zero' }];
    expect(pickImpactPhrase(999999, dirty)).toBeNull();
  });
});

// Helper to build one giver-summary row (the new shape: whole-year total +
// gift count, no per-day grouping — the endpoint now sums everything up
// front, same as reports/giving-bands).
function row(person_id, name, totalDollars, gifts, extra) {
  return Object.assign({ person_id, name, total_cents: totalDollars * 100, gifts }, extra || {});
}

describe('computeGivingPlateaus', () => {
  it('gives every giver the same weekly-equivalent = total ÷ 52, but asks each group for something different', () => {
    // A weekly giver ($50 × 52 = $2,600) and a single December retirement distribution of $2,600
    // both read as $50/wk, yet one is asked to increase and the other is thanked.
    const weekly = row(1, 'Weekly Wanda', 2600, 52, { months_given: 12 });
    const oneTime = row(2, 'One-Time Otto', 2600, 1, { months_given: 1 });
    const r = computeGivingPlateaus([weekly, oneTime], { periodsElapsed: 52 });
    expect(r.summary.total_givers).toBe(2);
    const wanda = r.givers.find(p => p.name === 'Weekly Wanda');
    const otto = r.givers.find(p => p.name === 'One-Time Otto');
    expect(wanda.weekly_cents).toBe(5000);
    expect(otto.weekly_cents).toBe(5000);
    expect(wanda.group).toBe('regular');
    expect(otto.group).toBe('large_gift');
    expect(wanda.options.map(o => o.delta_cents)).toEqual([1000, 2500, 4000]);
    expect(otto.options.map(o => o.annual_delta_cents)).toEqual([10000, 30000, 40000]);
  });

  it('but states each of them their figure in the rhythm they actually give in', () => {
    // The same two givers the test above proves are analyzed identically must be WRITTEN TO
    // differently: telling Otto, who wrote one check in December, that he gives "$50 a week" is
    // the failure the cadence fields exist to prevent.
    const r = computeGivingPlateaus([row(1, 'Weekly Wanda', 2600, 52), row(2, 'One-Time Otto', 2600, 1)], { periodsElapsed: 52 });
    const wanda = r.givers.find(g => g.name === 'Weekly Wanda');
    const otto = r.givers.find(g => g.name === 'One-Time Otto');
    expect(wanda.cadence).toBe('weekly');
    expect(wanda.cadence_amount_cents).toBe(5000);      // $50 a week
    expect(otto.cadence).toBe('annual');
    expect(otto.cadence_amount_cents).toBe(260000);     // $2,600 a year
    expect(wanda.cadence_adverb).not.toBe(otto.cadence_adverb);
  });

  it('flags low-frequency givers (occasional/stock/IRA-style) for narrative framing, without excluding them', () => {
    const oneTime = row(9, 'Otto', 2600, 1);
    const weekly = row(10, 'Wanda', 2600, 52);
    const r = computeGivingPlateaus([oneTime, weekly], { periodsElapsed: 52 });
    expect(r.summary.total_givers).toBe(2); // nobody excluded
    expect(r.summary.low_frequency_givers).toBe(1);
    const otto = r.givers.find(p => p.name === 'Otto');
    const wanda = r.givers.find(p => p.name === 'Wanda');
    expect(otto.low_frequency).toBe(true);
    expect(wanda.low_frequency).toBe(false);
  });

  it('respects a custom low-frequency threshold', () => {
    const r = computeGivingPlateaus([row(1, 'P', 260, 4)], { periodsElapsed: 52, lowFrequencyMax: 3 });
    expect(r.tiers[0].people[0].low_frequency).toBe(false);
    const r2 = computeGivingPlateaus([row(1, 'P', 260, 4)], { periodsElapsed: 52, lowFrequencyMax: 5 });
    expect(r2.tiers[0].people[0].low_frequency).toBe(true);
  });

  it('every option always carries a concrete annual dollar figure, even the Modest one', () => {
    const r = computeGivingPlateaus([row(1, 'P', 2600, 52)], { periodsElapsed: 52 });
    const opts = r.tiers[0].people[0].options;
    // $50/wk -> Modest $60 (+$10/wk = +$520/yr)
    expect(opts[0].annual_delta_cents).toBe(1000 * 52);
    expect(opts[0].new_annual_total_cents).toBe(6000 * 52);
    opts.forEach(o => expect(o.annual_delta_cents).toBeGreaterThan(0));
  });

  it('attaches an impact phrase to whichever option clears a configured monthly threshold', () => {
    const impactStatements = [{ monthly_cents: 4000, label: 'a week of Food Pantry groceries' }];
    // $50/wk: Modest +$10/wk = $520/yr = ~$43.33/mo -> clears $40/mo threshold.
    const r = computeGivingPlateaus([row(1, 'P', 2600, 52)], { periodsElapsed: 52, impactStatements });
    const opts = r.tiers[0].people[0].options;
    expect(opts[0].impact_text).toBe('a week of Food Pantry groceries');
  });

  it('never shows an impact phrase when no statements are configured', () => {
    const r = computeGivingPlateaus([row(1, 'P', 2600, 52)], { periodsElapsed: 52 });
    r.tiers[0].people[0].options.forEach(o => expect(o.impact_text).toBeNull());
  });

  it('uses periodsElapsed for a partial current year so pace is not understated', () => {
    // $1,300 given in the first 26 weeks of the year -> $50/wk pace, same as a
    // giver who gave $2,600 across the full 52 weeks.
    const r = computeGivingPlateaus([row(1, 'P', 1300, 26)], { periodsElapsed: 26 });
    expect(r.tiers[0].people[0].weekly_cents).toBe(5000);
  });

  it('groups givers by their Standard option into tiers', () => {
    const rows = [
      row(1, 'A', 2600, 52), row(2, 'B', 2600, 52), row(3, 'C', 2600, 52), // $50/wk -> Standard $75 (the +$25 band)
      row(4, 'D', 4316, 52), row(5, 'E', 4316, 52), // $83/wk -> Standard $128 (the +$45 band)
    ];
    const r = computeGivingPlateaus(rows, { periodsElapsed: 52 });
    expect(r.tiers.length).toBe(2);
    const t75 = r.tiers.find(t => t.target_cents === 7500);
    const t125 = r.tiers.find(t => t.target_cents === 12800);
    expect(t75.num_people).toBe(3);
    expect(t125.num_people).toBe(2);
    expect(r.tiers[0].target_cents).toBeLessThan(r.tiers[1].target_cents);
  });

  it('sums every fund into one figure at the SQL layer — this function just receives the total (no fund discounted)', () => {
    // The caller's SQL already sums General + Tuition Aid + Food Pantry etc.
    // into total_cents before this function ever sees it; verify a giver's
    // full combined total drives the weekly-equivalent, not a partial figure.
    const r = computeGivingPlateaus([row(1, 'Carol', 2600, 52)], { periodsElapsed: 52 });
    expect(r.tiers[0].people[0].weekly_cents).toBe(5000);
    expect(r.tiers[0].people[0].total_cents).toBe(260000);
  });

  it('builds a per-dollar distribution histogram of weekly-equivalent levels', () => {
    const rows = [row(1, 'A', 2600, 52), row(2, 'B', 2600, 52), row(3, 'C', 4316, 52)];
    const r = computeGivingPlateaus(rows, { periodsElapsed: 52 });
    expect(r.distribution).toEqual([
      { plateau_dollars: 50, n: 2 },
      { plateau_dollars: 83, n: 1 },
    ]);
  });

  it('defaults link fields to the person when not provided', () => {
    const r = computeGivingPlateaus([row(9, 'Fay F', 2600, 52)], { periodsElapsed: 52 });
    const p = r.tiers[0].people[0];
    expect(p.link_kind).toBe('person');
    expect(p.link_id).toBe(9);
  });

  it('carries household link fields through (household scope)', () => {
    const hh = row('h:12', 'Smith Household', 4316, 52, { link_id: 12, link_kind: 'household' });
    const r = computeGivingPlateaus([hh], { periodsElapsed: 52 });
    const p = r.tiers[0].people[0];
    expect(p.name).toBe('Smith Household');
    expect(p.link_kind).toBe('household');
    expect(p.link_id).toBe(12);
    expect(p.weekly_cents).toBe(8300);
  });

  it('ignores zero/negative totals', () => {
    const r = computeGivingPlateaus([row(1, 'A', 0, 0), row(2, 'B', -20, 1), row(3, 'C', 2600, 52)], { periodsElapsed: 52 });
    expect(r.summary.total_givers).toBe(1);
  });

  describe('low_frequency_givers_list', () => {
    it('lists low-frequency givers sorted by total given — a one-time large gift surfaces first', () => {
      const rows = [
        row(1, 'Small Occasional', 200, 2),
        row(2, 'One-Time Major Gift', 9000, 1, { auto_gifts: 0 }),
        row(3, 'Regular Weekly', 2600, 52), // not low-frequency, excluded from this list
      ];
      const r = computeGivingPlateaus(rows, { periodsElapsed: 52, lowFrequencyMax: 3 });
      expect(r.low_frequency_givers_list.map(g => g.name)).toEqual(['One-Time Major Gift', 'Small Occasional']);
      expect(r.low_frequency_givers_list.length).toBe(2);
    });

    it('still includes low-frequency givers in the normal tiers — this list is informational, not exclusionary', () => {
      const r = computeGivingPlateaus([row(1, 'Otto', 2600, 1)], { periodsElapsed: 52, lowFrequencyMax: 3 });
      expect(r.summary.total_givers).toBe(1);
      expect(r.tiers[0].people.some(p => p.name === 'Otto')).toBe(true);
      expect(r.low_frequency_givers_list.some(g => g.name === 'Otto')).toBe(true);
    });

    it('flags whether a low-frequency giver already gives via an automatic method', () => {
      const manual = row(1, 'Otto Manual', 2600, 1, { auto_gifts: 0 });
      const auto = row(2, 'Amy Auto', 2600, 2, { auto_gifts: 2 });
      const r = computeGivingPlateaus([manual, auto], { periodsElapsed: 52, lowFrequencyMax: 3 });
      const otto = r.low_frequency_givers_list.find(g => g.name === 'Otto Manual');
      const amy = r.low_frequency_givers_list.find(g => g.name === 'Amy Auto');
      expect(otto.all_manual_methods).toBe(true);
      expect(amy.all_manual_methods).toBe(false);
    });

    it('respects a custom low_frequency_max threshold for the list too', () => {
      const rows = [row(1, 'P', 260, 4)];
      expect(computeGivingPlateaus(rows, { periodsElapsed: 52, lowFrequencyMax: 3 }).low_frequency_givers_list.length).toBe(0);
      expect(computeGivingPlateaus(rows, { periodsElapsed: 52, lowFrequencyMax: 5 }).low_frequency_givers_list.length).toBe(1);
    });
  });
});

describe('giver groups', () => {
  const g = (gifts, monthsGiven, totalCents, weeks = 52, extra) => classifyGiverGroup(Object.assign({ gifts, monthsGiven, totalCents }, extra || {}), weeks);
  it('counts a monthly giver with ten gifts by October as regular', () => {
    expect(g(10, 10, 200000, 40, { firstMonth: '2026-01', lastMonth: '2026-10' })).toBe('regular');
  });
  it('counts a weekly giver as regular', () => expect(g(52, 12, 260000)).toBe('regular'));
  it('counts more than a gift a month over the months someone has been giving as regular, even if they started late', () => {
    expect(g(8, 6, 2000000, 40, { firstMonth: '2026-04', lastMonth: '2026-09' })).toBe('regular');   // 8 gifts in 6 months
    expect(g(14, 6, 618800, 40, { firstMonth: '2026-04', lastMonth: '2026-09' })).toBe('regular');
    expect(g(7, 7, 540000, 40, { firstMonth: '2026-03', lastMonth: '2026-09' })).toBe('regular');    // exactly one a month
  });
  it('calls someone irregular when their gifts are spread thinner than one a month', () => {
    expect(g(5, 5, 60000, 40, { firstMonth: '2026-01', lastMonth: '2026-10' })).toBe('irregular');
    expect(g(4, 4, 40000, 40, { firstMonth: '2026-02', lastMonth: '2026-09' })).toBe('irregular');
  });
  it('calls someone rare when they gave a few times at most and not monthly', () => {
    expect(g(2, 2, 20000, 40, { firstMonth: '2026-02', lastMonth: '2026-08' })).toBe('rare');
  });
  it('treats one or two gifts in the thousands as a large annual gift, not a rare giver', () => {
    expect(g(1, 1, 300000)).toBe('large_gift');
    expect(g(2, 2, 450000)).toBe('large_gift');
    expect(g(2, 2, 150000)).toBe('rare');
    expect(g(12, 12, 3600000)).toBe('regular');
  });
});

describe('group asks', () => {
  const one = (total, gifts, months, extra) => computeGivingPlateaus([row(1, 'X', total, gifts, { months_given: months })], Object.assign({ periodsElapsed: 52 }, extra)).givers[0];
  it('sets a regular giver\'s increase by what they give now: +$10, +$25 or +$45 a week', () => {
    expect(one(520, 52, 12).options.map(o => o.delta_cents / 100)).toEqual([5, 10, 15]);      // $10/wk
    expect(one(2600, 52, 12).options.map(o => o.delta_cents / 100)).toEqual([10, 25, 40]);    // $50/wk
    expect(one(7800, 52, 12).options.map(o => o.delta_cents / 100)).toEqual([20, 45, 70]);    // $150/wk
    expect(one(520, 52, 12).step_label).toBe('+$10/wk band');
  });
  it('asks a rare giver for a standing monthly gift above what they give per month', () => {
    const rare = one(300, 2, 2); // $300 a year = $25 a month
    expect(rare.group).toBe('rare');
    expect(rare.options.map(o => o.new_annual_total_cents / 1200)).toEqual([30, 40, 50]);
    expect(rare.options.map(o => o.annual_delta_cents)).toEqual([6000, 18000, 30000]);
    expect(rare.group).toBe('rare');
  });
  it('asks an irregular giver only to automate at their average gift, with no guessed increase', () => {
    // $500, $200 and $500 over ten months: average gift $400, so $4,800 a year if automated.
    const r = computeGivingPlateaus([row(1, 'X', 1200, 3, { months_given: 3, first_month: '2026-01', last_month: '2026-10' }), row(2, 'Y', 2000, 5, { months_given: 5, first_month: '2026-01', last_month: '2026-10' })], { periodsElapsed: 52, lowFrequencyMax: 2 });
    const x = r.givers.find(gv => gv.name === 'X');
    expect(x.group).toBe('irregular');
    expect(x.options.length).toBe(1);
    expect(x.options[0].new_annual_total_cents).toBe(480000);
    expect(x.options[0].annual_delta_cents).toBe(480000 - 120000);
    const y = r.givers.find(gv => gv.name === 'Y');   // $2,000 over 5 gifts: average $400, same figure
    expect(y.options[0].new_annual_total_cents).toBe(480000);
  });
  it('offers a large annual giver a percentage rounded to $100, never a weekly step', () => {
    const big = one(3000, 1, 1);
    expect(big.group).toBe('large_gift');
    expect(big.options.map(o => o.annual_delta_cents)).toEqual([20000, 30000, 50000]);
    expect(one(1200, 1, 1).options[0].annual_delta_cents).toBe(10000);
  });
  it('builds groups with steps, and the group totals add up to the report totals', () => {
    const rows = [row(1, 'A', 2600, 52, { months_given: 12 }), row(2, 'B', 2600, 52, { months_given: 12 }), row(3, 'C', 300, 2, { months_given: 2 }), row(4, 'D', 5000, 1, { months_given: 1 })];
    const r = computeGivingPlateaus(rows, { periodsElapsed: 52 });
    expect(r.groups.map(x => [x.key, x.num_people])).toEqual([['rare', 1], ['irregular', 0], ['regular', 2], ['large_gift', 1]]);
    expect(r.groups[2].not_automated).toBe(2);
    expect(r.groups.reduce((s, x) => s + x.upside_modest_annual_cents, 0)).toBe(r.summary.total_upside_modest_annual_cents);
    expect(r.groups.reduce((s, x) => s + x.upside_generous_annual_cents, 0)).toBe(r.summary.total_upside_generous_annual_cents);
    expect(r.groups[2].steps[0].num_people).toBe(2);
  });
});

describe('moving a giver by hand', () => {
  const rows = [row(1, 'Meyer', 20000, 8, { months_given: 6, link_kind: 'household', link_id: 7 })];
  it('puts a household in the group it was moved to, and says where the rule would have put it', () => {
    const auto = computeGivingPlateaus(rows, { periodsElapsed: 40 }).givers[0];
    expect(auto.recipient_key).toBe('h7');
    expect(auto.moved_from).toBeNull();
    const moved = computeGivingPlateaus(rows, { periodsElapsed: 40, groupOverrides: { h7: 'irregular' } });
    expect(moved.givers[0].group).toBe('irregular');
    expect(moved.givers[0].moved_from).toBe(auto.group);
    expect(moved.groups.find(g => g.key === 'irregular').num_people).toBe(1);
    expect(moved.groups.find(g => g.key === auto.group).num_people).toBe(0);
    expect(moved.givers[0].options.length).toBe(1);   // irregular is asked only to automate
  });
  it('ignores a move to the group the rule already chose', () => {
    const auto = computeGivingPlateaus(rows, { periodsElapsed: 40 }).givers[0];
    const same = computeGivingPlateaus(rows, { periodsElapsed: 40, groupOverrides: { h7: auto.group } }).givers[0];
    expect(same.moved_from).toBeNull();
  });
});

describe('fund code rule', () => {
  const db = { prepare: () => ({ all: async () => ({ results: [
    { id: 1, name: '40085 General Fund' }, { id: 2, name: '40085 Lent' }, { id: 3, name: '40085 Retirement Distribution' },
    { id: 4, name: '40120 Tuition Aid' }, { id: 5, name: 'Memorial' },
  ] }) }) };
  it('treats every fund sharing a leading account code as one fund', async () => {
    expect(await expandFundCodeIds(db, 2)).toEqual([1, 2, 3]);
    expect((await fundCodeScope(db, 3)).clause).toBe(' AND ge.fund_id IN (?,?,?)');
  });
  it('leaves a fund with no code on its own, and no fund means no restriction', async () => {
    expect(await expandFundCodeIds(db, 5)).toEqual([5]);
    expect(await expandFundCodeIds(db, 4)).toEqual([4]);
    expect(await fundCodeScope(db, 0)).toEqual({ clause: '', bind: [] });
  });
});
