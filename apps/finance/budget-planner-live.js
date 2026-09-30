// Live totals for Planning → Budget planner. The page is server-rendered, so its totals only moved
// after "Save changes". This script (served by this Worker, never inline) recomputes every group
// total, side total, the Net row, each line's Δ% and the navy summary strip as a figure is typed,
// with the same arithmetic the server uses (planning-builder-pages.js sumLines/plannerRows). It
// changes what is on screen only; nothing is saved until the form is submitted.
//
// computeBudgetTotals is a plain function so it can be tested directly; the served script embeds
// its source, so it must not refer to anything outside itself.

// rows: [{ kind: 'leaf' | 'header' | 'total' | 'sidetotal' | 'net' | other, side, excluded, fig }] in
// table order. Returns one entry per row: the summed figure for total, sidetotal and net rows,
// null otherwise. A figure is { bud, hasBud, act, proj, plan, hasPlan }, all cents.
export function computeBudgetTotals(rows) {
  const zero = () => ({ bud: 0, hasBud: false, act: 0, proj: 0, plan: 0, hasPlan: false });
  const add = (into, f) => {
    if (f.hasBud) { into.bud += f.bud || 0; into.hasBud = true; }
    into.act += f.act || 0;
    into.proj += f.proj || 0;
    if (f.hasPlan) { into.plan += f.plan || 0; into.hasPlan = true; }
  };
  const sides = { revenue: zero(), expense: zero() };
  const stack = [];
  const out = rows.map(() => null);
  rows.forEach((row, i) => {
    if (row.kind === 'header') stack.push(zero());
    else if (row.kind === 'leaf') {
      if (row.excluded) return;
      stack.forEach((group) => add(group, row.fig));
      add(sides[row.side] || sides.expense, row.fig);
    } else if (row.kind === 'total') out[i] = stack.pop() || zero();
    else if (row.kind === 'sidetotal') out[i] = { ...(sides[row.side] || zero()) };
    else if (row.kind === 'net') {
      const r = sides.revenue;
      const x = sides.expense;
      out[i] = { bud: r.bud - x.bud, hasBud: r.hasBud || x.hasBud, act: r.act - x.act, proj: r.proj - x.proj, plan: r.plan - x.plan, hasPlan: r.hasPlan || x.hasPlan };
    }
  });
  return out;
}

const DOM_GLUE = `
(function () {
  var tbody = document.querySelector('.bp-table tbody');
  if (!tbody) return;
  var USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  var money = function (c) { return (c < 0 ? '\\u2212' : '') + USD.format(Math.abs(Math.round(c / 100))); };
  var signed = function (c) { return (c < 0 ? '\\u2212' : '+') + USD.format(Math.abs(Math.round(c / 100))); };
  var pctText = function (v) { return (v >= 0 ? '+' : '\\u2212') + Math.abs(v).toFixed(1) + '%'; };
  var deltaTone = function (pct) { return pct == null ? 'tone-muted' : pct > 4 ? 'bp-up' : pct < 0 ? 'bp-down' : 'bp-flat'; };
  var COLS = ['bud', 'act', 'proj', 'plan'];

  function typed(input) {
    var v = String(input.value).replace(/[$,\\s]/g, '');
    if (v === '' || !/^-?\\d*\\.?\\d+$/.test(v)) return null;
    return Math.round(parseFloat(v) * 100);
  }

  function readLeaf(tr) {
    var fig = { bud: 0, hasBud: false, act: 0, proj: 0, plan: 0, hasPlan: false };
    COLS.forEach(function (col) {
      var td = tr.querySelector('td[data-col="' + col + '"]');
      if (!td) return;
      var cents = td.getAttribute('data-c') === null ? null : Number(td.getAttribute('data-c'));
      var has = td.getAttribute('data-has') === '1';
      var input = td.querySelector('input.bp-input');
      if (input) {
        var t = typed(input);
        if (t !== null) { cents = t; has = true; }
        else if (col === 'plan') { cents = 0; has = false; }
      }
      fig[col] = cents || 0;
      if (col === 'bud') fig.hasBud = has;
      if (col === 'plan') fig.hasPlan = has;
    });
    return fig;
  }

  function cellText(col, f) {
    if (col === 'bud') return f.hasBud ? money(f.bud) : '\\u2014';
    if (col === 'act') return money(f.act);
    if (col === 'proj') return money(f.proj);
    if (col === 'plan') return f.hasPlan ? money(f.plan) : '\\u2014';
    var pct = f.hasBud && f.hasPlan && f.bud ? ((f.plan - f.bud) / Math.abs(f.bud)) * 100 : null;
    return pct == null ? '\\u2014' : pctText(pct);
  }

  function paint(tr, f, net) {
    [].forEach.call(tr.querySelectorAll('td[data-col]'), function (td) {
      if (td.querySelector('input')) return;
      var col = td.getAttribute('data-col');
      var text = cellText(col, f);
      td.textContent = text;
      if (col === 'delta') {
        var pct = f.hasBud && f.hasPlan && f.bud ? ((f.plan - f.bud) / Math.abs(f.bud)) * 100 : null;
        td.className = deltaTone(pct);
      } else if (net) {
        var v = f[col];
        td.className = text === '\\u2014' ? 'tone-muted' : v < 0 ? 'bp-down-net' : 'bp-up-net';
      } else td.className = text === '\\u2014' ? 'tone-muted' : '';
    });
  }

  function setStrip(name, text) {
    var el = document.querySelector('[data-bp-strip="' + name + '"]');
    if (el) el.textContent = text;
  }

  function recompute() {
    var trs = [].slice.call(tbody.rows).filter(function (tr) { return tr.hasAttribute('data-bp'); });
    var rows = trs.map(function (tr) {
      var kind = tr.getAttribute('data-bp');
      return { kind: kind, side: tr.getAttribute('data-side'), excluded: tr.classList.contains('bp-excluded'), fig: kind === 'leaf' ? readLeaf(tr) : null };
    });
    var totals = computeBudgetTotals(rows);
    trs.forEach(function (tr, i) {
      if (rows[i].kind === 'leaf') paint(tr, rows[i].fig, false);
      else if (totals[i]) paint(tr, totals[i], rows[i].kind === 'net');
    });
    var net = totals[rows.map(function (r) { return r.kind; }).lastIndexOf('net')];
    var strip = document.querySelector('.bp-strip');
    if (!strip || !net) return;
    var sums = { revenue: { proj: 0, plan: 0 }, expense: { proj: 0, plan: 0 } };
    rows.forEach(function (r) {
      if (r.kind !== 'leaf' || r.excluded || !sums[r.side]) return;
      sums[r.side].proj += r.fig.proj || 0;
      sums[r.side].plan += r.fig.plan || 0;
    });
    var baseExp = sums.expense.proj;
    var planExp = sums.expense.plan;
    var change = planExp - baseExp;
    var gap = planExp - sums.revenue.proj;
    var base = strip.getAttribute('data-base');
    setStrip('baseExp', money(baseExp));
    setStrip('planExp', money(planExp));
    setStrip('change', signed(change));
    setStrip('changePct', baseExp ? pctText((change / Math.abs(baseExp)) * 100) : '');
    setStrip('needed', money(planExp));
    setStrip('gap', (gap >= 0 ? '+' : '\\u2212') + money(Math.abs(gap)) + ' on this year\\u2019s revenue (FY' + base + ' projected ' + money(sums.revenue.proj) + ')');
  }

  tbody.addEventListener('input', function (event) {
    if (event.target && event.target.classList && event.target.classList.contains('bp-input')) recompute();
  });
})();
`;

export const BUDGET_PLANNER_LIVE_JS = `var computeBudgetTotals = (${computeBudgetTotals.toString()});\n${DOM_GLUE}`;
