// Facilities → Gym rental income. Read-only report on gym rental invoices, fetched live from
// Website Admin, where bookings and invoices are managed (gym-income-client.js). Nothing here
// is stored in Finance.
import { escapeHtml as e } from './render-helpers.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EXACT_USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (cents) => EXACT_USD.format((Number(cents) || 0) / 100);
const hours = (h) => (Number(h) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

function shortDate(iso) {
  const [y, m, d] = String(iso || '').slice(0, 10).split('-').map(Number);
  return y ? `${MONTHS[m - 1]} ${d}, ${y}` : '—';
}

function href(year) {
  return `/?section=facilities&amp;page=gym-rentals&amp;year=${year}`;
}

export function renderGymIncomePage({ result }) {
  if (!result.ok) {
    return `<p class="status status-error">Gym rental invoices could not be read from Website Admin: ${e(result.message)} Nothing here is a real $0.</p>`;
  }
  const r = result.data;
  const t = r.totals;
  const years = [...new Set([r.year, ...r.years])].sort((a, b) => b - a);
  const yearChips = years.length > 1
    ? `<div class="chip-row">${years.map((y) => `<a class="chip${y === r.year ? ' is-on' : ''}" href="${href(y)}">${y}</a>`).join('')}</div>` : '';
  const cards = `<div class="grid">
    <div class="card"><small>Invoiced in ${r.year}</small><strong>${money(t.invoiced_cents)}</strong><span>${t.invoice_count} invoices · ${hours(t.hours)} hours</span></div>
    <div class="card"><small>Paid</small><strong>${money(t.paid_cents)}</strong><span class="tone-good">Of ${r.year}’s invoices</span></div>
    <div class="card"><small>Unpaid</small><strong>${money(t.unpaid_cents)}</strong><span class="${t.unpaid_cents ? 'tone-warn' : ''}">Of ${r.year}’s invoices</span></div>
    <div class="card"><small>Overdue</small><strong>${money(t.overdue_cents)}</strong><span class="${t.overdue_cents ? 'tone-bad' : ''}">Unpaid ${r.due_days}+ days after invoicing</span></div>
  </div>`;
  const monthRows = r.months.filter((m) => m.invoice_count).map((m) => `<tr><td>${MONTHS[m.month - 1]}</td><td>${m.invoice_count}</td><td>${money(m.invoiced_cents)}</td><td>${money(m.paid_cents)}</td><td>${money(m.invoiced_cents - m.paid_cents)}</td></tr>`).join('');
  const groupRows = r.groups.map((g) => `<tr><td>${e(g.group_name)}</td><td>${g.invoice_count}</td><td>${hours(g.hours)}</td><td>${money(g.invoiced_cents)}</td><td>${money(g.paid_cents)}</td><td class="${g.unpaid_cents ? 'tone-warn' : 'tone-muted'}">${money(g.unpaid_cents)}</td></tr>`).join('');
  const openTotal = r.open_invoices.reduce((s, i) => s + i.amount_cents, 0);
  const openRows = r.open_invoices.map((i) => `<tr><td>${e(i.group_name)}</td><td>${e(shortDate(i.invoice_date))}</td><td>${i.period_start ? `${e(shortDate(i.period_start))}${i.period_end && i.period_end !== i.period_start ? ` – ${e(shortDate(i.period_end))}` : ''}` : '—'}</td><td>${e(shortDate(i.due_date))}</td><td>${money(i.amount_cents)}</td><td>${i.overdue ? '<span class="pill pill-bad">Overdue</span>' : '<span class="pill pill-plain">Not yet due</span>'}</td></tr>`).join('');
  const table = (head, rows, empty) => (rows
    ? `<div class="table-scroll"><table class="pm-table"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`
    : `<div class="empty-note">${empty}</div>`);
  return `<section class="facilities" aria-label="Gym rental income">
    <p class="lede">Building-use income from gym rentals. Bookings and invoices are managed in Website Admin; this page reports on them live.</p>
    ${yearChips}
    ${cards}
    <div class="panel panel-spaced"><h2>By month</h2>${table(['Month', 'Invoices', 'Invoiced', 'Paid', 'Unpaid'], monthRows, `No gym invoices dated in ${r.year}.`)}</div>
    <div class="panel panel-spaced"><h2>By group</h2>${table(['Group', 'Invoices', 'Hours', 'Invoiced', 'Paid', 'Unpaid'], groupRows, `No gym invoices dated in ${r.year}.`)}</div>
    <div class="panel panel-spaced"><h2>Open invoices, all years${openRows ? ` · ${money(openTotal)}` : ''}</h2>${table(['Group', 'Invoiced', 'Rental dates', 'Due', 'Amount', 'Status'], openRows, 'No unpaid gym invoices.')}
      ${r.open_limited ? `<p class="muted-line">Showing the oldest ${r.open_invoices.length}; see Website Admin for the rest.</p>` : ''}</div>
    <p class="muted-line">Invoices count toward the month they were issued. Website Admin records whether an invoice is paid, not the date the money arrived, so “Paid” reflects status today. To mark an invoice paid or send one, use Website Admin → Gym.</p>
  </section>`;
}
