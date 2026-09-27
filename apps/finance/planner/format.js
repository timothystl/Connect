// Display helpers for the Compensation Planner, carried over from legacy js-finance.js
// (finCompMoney, finCompMoneyCents, finCompMoneySigned, finCompPctFmt, finFmtMoney, esc).
// Every figure in the planner is whole dollars; monthly premiums are shown to the cent.

export function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function money(cents) {
  return '$' + Math.round((Number(cents) || 0) / 100).toLocaleString('en-US');
}

export function moneyCents(cents) {
  const n = (Number(cents) || 0) / 100;
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function moneySigned(cents) {
  const r = Math.round((Number(cents) || 0) / 100);
  return (r >= 0 ? '+' : '&minus;') + '$' + Math.abs(r).toLocaleString('en-US');
}

export function pct(fraction, places) {
  return ((Number(fraction) || 0) * 100).toFixed(places == null ? 2 : places) + '%';
}

// Legacy finFmtMoney: dollars with two decimals, used where the district base salary is quoted.
export function dollars(n) {
  return (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// A percentage stored as a fraction, shown in an input without float noise (legacy finFmtPctInput).
export function pctInput(fraction) {
  return Math.round((Number(fraction) || 0) * 10000) / 100;
}

// Legacy finCompRatioColor as a CSS class: at or near 100% is good, within 5% is a warning.
export function ratioTone(ratio) {
  return ratio >= 0.995 ? 'good' : ratio >= 0.95 ? 'warn' : 'bad';
}

export function vsScaleText(salaryCents, worksheetCents) {
  if (!worksheetCents) return { text: '&mdash;', tone: 'muted' };
  const diff = salaryCents - worksheetCents;
  return {
    text: Math.abs(diff) < 50000 ? 'at scale' : moneySigned(diff) + ' (' + Math.round(salaryCents / worksheetCents * 100) + '% of scale)',
    tone: ratioTone(salaryCents / worksheetCents),
  };
}

export function vsMedianText(salaryCents, midCents) {
  if (!midCents) return { text: 'no report', tone: 'muted' };
  const diff = salaryCents - midCents;
  return {
    text: Math.abs(diff) < 50000 ? 'at median' : moneySigned(diff) + ' (' + Math.round(salaryCents / midCents * 100) + '% of median)',
    tone: ratioTone(salaryCents / midCents),
  };
}

// Live input sanitizers (legacy finSanitizeDecimalInput / finPlanSanitizeWholeDollarInput): the
// inputs are type=text so a full re-render on every keystroke never fights the caret.
export function sanitizeDecimal(el) {
  const v = el.value;
  const neg = v.charAt(0) === '-';
  let body = v.replace(/[^0-9.]/g, '');
  const firstDot = body.indexOf('.');
  if (firstDot !== -1) body = body.slice(0, firstDot + 1) + body.slice(firstDot + 1).replace(/\./g, '');
  const cleaned = (neg ? '-' : '') + body;
  if (cleaned !== v) el.value = cleaned;
  return cleaned;
}

export function sanitizeWholeDollar(el) {
  const neg = el.value.charAt(0) === '-';
  const cleaned = (neg ? '-' : '') + el.value.replace(/[^0-9]/g, '');
  if (cleaned !== el.value) el.value = cleaned;
  return cleaned;
}
