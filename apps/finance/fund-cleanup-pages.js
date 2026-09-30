// Gift Entry › Funds › Clean up funds (Connect admin only). Connect's giving-fund-cleanup-v1 lists
// every fund with fund-level totals and groups the likely duplicates: funds sharing an account
// number ("46045 Youth" / "46045 Youth Gathering") or the same name once the number is set aside
// ("25004 Building Fund" / "Building Fund"). An admin combines a group into the fund they choose
// to keep (every gift moves there; the others are removed) or retires funds no longer used, which
// takes them out of gift entry, online giving and Finance's fund lists with their history intact.
// Above that, Fund settings edits each active fund's name, category (which drives the council
// report's lens), annual budget (the "vs. budget" figures) and account code, and adds a fund.
import { escapeHtml, formatCents, renderSectionHeading } from './render-helpers.js';

const CATEGORY_LABELS = {
  general: 'General Fund', earned: 'Earned', passive: 'Passive', restricted: 'Designated', mdo: 'MDO', passthrough: 'Pass-through',
};

function lastGift(month) {
  if (!/^\d{4}-\d{2}$/.test(month || '')) return 'Never';
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function fundFacts(f) {
  return `${escapeHtml(CATEGORY_LABELS[f.category] || f.category)} · ${f.gift_count} gift${f.gift_count === 1 ? '' : 's'} · ${formatCents(f.total_cents)} in all · last gift ${lastGift(f.last_month)}${f.active ? '' : ' · retired'}`;
}

const CATEGORY_OPTIONS = [
  ['general', 'General Fund'], ['earned', 'Earned income'], ['passive', 'Passive income'],
  ['restricted', 'Restricted & designated'], ['mdo', 'MDO income'], ['passthrough', 'Pass-through (not church income)'],
];

const dollars = (cents) => (Math.max(0, Number(cents) || 0) / 100).toFixed(2);

function categorySelect(name, value, label) {
  const opts = CATEGORY_OPTIONS.map(([key, text]) => `<option value="${key}"${key === value ? ' selected' : ''}>${escapeHtml(text)}</option>`).join('');
  return `<select name="${name}" aria-label="${escapeHtml(label)}">${opts}</select>`;
}

function settingsForm(funds) {
  const e = escapeHtml;
  const active = funds.filter((f) => f.active);
  const rows = active.map((f) => `<tr>
      <td><input type="hidden" name="fund_id" value="${f.id}"><input type="text" name="name_${f.id}" value="${e(f.name)}" maxlength="120" required aria-label="Name of ${e(f.name)}"></td>
      <td>${categorySelect(`category_${f.id}`, f.category, `Category of ${f.name}`)}</td>
      <td class="num"><input type="text" name="budget_${f.id}" value="${dollars(f.budget_annual_cents)}" inputmode="decimal" size="10" aria-label="Annual budget of ${e(f.name)}"></td>
      <td><input type="text" name="gl_${f.id}" value="${e(f.gl_code || '')}" maxlength="40" size="10" aria-label="Account code of ${e(f.name)}"></td>
    </tr>`).join('');
  return `<h3 id="fund-settings">Fund settings</h3>
    <p>Each active fund’s category decides which part of the council report it appears in, and its annual budget drives the “vs. budget” figures. Changing a name does not touch any gift already recorded.</p>
    ${active.length ? `<form method="POST" action="/api/v1/giving-fund-cleanup"><input type="hidden" name="op" value="settings">
      <div class="table-wrap"><table class="fc-table"><thead><tr><th>Fund</th><th>Category</th><th class="num">Annual budget ($)</th><th>Account code</th></tr></thead><tbody>${rows}</tbody></table></div>
      <button type="submit">Save fund settings</button></form>` : '<p class="muted-line">No active funds.</p>'}
    <details class="panel panel-spaced"><summary>Add a fund</summary>
      <form method="POST" action="/api/v1/giving-fund-cleanup"><input type="hidden" name="op" value="add">
        <p><label>Name <input type="text" name="name" maxlength="120" required></label></p>
        <p><label>Category ${categorySelect('category', 'restricted', 'Category of the new fund')}</label></p>
        <p><label>Annual budget ($) <input type="text" name="budget" inputmode="decimal" size="10" value="0.00"></label>
           <label>Account code <input type="text" name="gl_code" maxlength="40" size="10"></label></p>
        <button type="submit">Add the fund</button>
      </form>
    </details>`;
}

function mergeForm(group, byId, index) {
  const e = escapeHtml;
  const funds = group.fund_ids.map((id) => byId.get(id)).filter(Boolean);
  if (funds.length < 2) return '';
  const rows = funds.map((f) => `<tr>
      <td><input type="radio" name="keep" value="${f.id}" id="fc-keep-${index}-${f.id}"${f.id === group.suggested_keep_id ? ' checked' : ''} required></td>
      <td><input type="checkbox" name="remove" value="${f.id}" aria-label="Combine ${e(f.name)}"${f.id === group.suggested_keep_id ? '' : ' checked'}></td>
      <td><label for="fc-keep-${index}-${f.id}"><b>${e(f.name)}</b></label><small>${fundFacts(f)}</small></td>
    </tr>`).join('');
  return `<form method="POST" action="/api/v1/giving-fund-cleanup" class="panel panel-spaced fc-group">
      <input type="hidden" name="op" value="merge">
      <p class="muted-line">${e(group.reason)}</p>
      <div class="table-wrap"><table class="fc-table"><thead><tr><th>Keep</th><th>Combine</th><th>Fund</th></tr></thead><tbody>${rows}</tbody></table></div>
      <label class="fc-confirm"><input type="checkbox" name="confirm" value="1" required> Move every gift from the ticked funds into the one I keep, and remove the ticked funds. This cannot be undone from here.</label>
      <button type="submit">Combine into the fund I keep</button>
    </form>`;
}

export function renderFundCleanup({ result, status = null }) {
  const e = escapeHtml;
  const head = renderSectionHeading({ eyebrow: 'Gift Entry', heading: 'Fund settings and cleanup', badge: 'Relayed live to Connect' });
  const banner = status ? `<p class="status${status.ok ? '' : ' status-error'}">${e(status.message)}</p>` : '';
  if (!result || !result.ok) {
    return `<section id="fund-cleanup" aria-label="Clean up funds">${head}${banner}<p class="status status-error">The fund list could not be read from Connect${result?.message ? `: ${e(result.message)}` : ''}.</p></section>`;
  }
  const data = result.data || {};
  const funds = Array.isArray(data.funds) ? data.funds : [];
  const byId = new Map(funds.map((f) => [f.id, f]));
  const groups = Array.isArray(data.duplicate_groups) ? data.duplicate_groups : [];
  const active = funds.filter((f) => f.active);
  const retired = funds.filter((f) => !f.active);
  const fundRow = (f, name) => `<tr><td><input type="checkbox" name="fund_id" value="${f.id}" aria-label="${name} ${e(f.name)}"></td><td><b>${e(f.name)}</b><small>${fundFacts(f)}</small></td><td class="num">${formatCents(f.year_cents)}</td></tr>`;
  const list = (rows, op, name, button) => `<form method="POST" action="/api/v1/giving-fund-cleanup"><input type="hidden" name="op" value="${op}">
      <div class="table-wrap"><table class="fc-table"><thead><tr><th>${name}</th><th>Fund</th><th class="num">FY${e(String(data.year || ''))} gifts</th></tr></thead><tbody>${rows.map((f) => fundRow(f, name)).join('')}</tbody></table></div>
      <button type="submit">${button}</button></form>`;
  return `<section id="fund-cleanup" aria-label="Clean up funds">
    ${head}${banner}
    ${settingsForm(funds)}
    <h3>Likely duplicates</h3>
    <p>Funds that share an account number, or have the same name once the number is set aside. Pick the fund to keep (usually the one with the account number), tick the ones to fold into it, and confirm. Every gift, recurring gift and statement line moves to the kept fund.</p>
    ${groups.length ? groups.map((g, i) => mergeForm(g, byId, i)).join('') : '<p class="muted-line">No likely duplicates found.</p>'}
    <h3>Retire funds no longer used</h3>
    <p>A retired fund leaves gift entry, online giving and Finance’s fund lists (unless it received gifts this year or last). Its gifts and history stay, and it can be restored below.</p>
    ${active.length ? list(active, 'retire', 'Retire', 'Retire the ticked funds') : '<p class="muted-line">No active funds.</p>'}
    ${retired.length ? `<details class="panel panel-spaced"><summary>Retired funds (${retired.length})</summary>${list(retired, 'restore', 'Restore', 'Restore the ticked funds')}</details>` : ''}
  </section>`;
}

export const FUND_CLEANUP_STYLES = `
    .fc-table td { vertical-align:top; }
    .fc-table td small { display:block; color:#6B7280; font-size:12px; }
    .fc-confirm { display:block; margin:10px 0; font-size:14px; }
`;
