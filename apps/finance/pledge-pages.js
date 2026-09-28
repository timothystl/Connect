// Giving › Pledge list: each pledge for a year, named, with what the pledger has given so far, and
// forms to add, change or remove one (Andrew, Sept 28 2026: pledges editable in Finance). The
// pledges live in Connect until the Giving data moves; reads go through giving-pledges-v1 and
// writes through giving-pledges-write-v1, which re-check Giving view and Giving edit. Script-free.
import { callConnectContract } from './connect-giving-batch-client.js';
import { fetchVerifiedRole } from './connect-role-client.js';
import { isSameOriginPost } from './form-post.js';
import { escapeHtml as e } from './donor-letters.js';

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const money = (cents) => USD.format(Math.round((Number(cents) || 0) / 100));
const dollars = (cents) => ((Number(cents) || 0) / 100).toFixed(2).replace(/\.00$/, '');
const hidden = (name, value) => `<input type="hidden" name="${e(name)}" value="${e(value)}">`;

export function pledgeParams(get, today) {
  const thisYear = Number(today.slice(0, 4));
  const y = Number(get('year'));
  return {
    today, thisYear,
    year: Number.isInteger(y) && y >= 2000 && y <= thisYear + 2 ? y : thisYear,
    q: String(get('q') || '').trim().slice(0, 60),
  };
}

export function fetchPledges(env, accessJwt, p) {
  return callConnectContract(env, accessJwt, 'giving-pledges-v1', { query: { year: String(p.year), ...(p.q.length >= 2 ? { q: p.q } : {}) } });
}

export function canEditPledges(roleResult, councilPreview = false) {
  if (councilPreview || !roleResult?.ok) return false;
  return roleResult.role === 'admin' || roleResult.permissions?.giving === 'edit';
}

const fullName = (r) => `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Unnamed';

function status(r, elapsed) {
  if (!r.amount_cents) return ['No amount', ''];
  if (r.given_cents >= r.amount_cents) return ['Fulfilled', 'good'];
  if (!r.given_cents) return ['Not started', 'warn'];
  return r.given_cents >= r.amount_cents * elapsed * 0.9 ? ['On pace', 'good'] : ['Behind', 'warn'];
}

// Share of the year gone by `through` (1 for a past year, 0 for a future one).
export function yearElapsed(year, today) {
  const y = Number(today.slice(0, 4));
  if (year < y) return 1;
  if (year > y) return 0;
  const start = Date.UTC(year, 0, 1);
  return Math.min(1, (Date.parse(`${today}T00:00:00Z`) - start + 864e5) / (Date.UTC(year + 1, 0, 1) - start));
}

export function renderPledgeListPage({ result, params: p, canEdit, namedHidden, status: banner }) {
  if (namedHidden) return '<div class="panel"><h2>Pledges name each giver</h2><p class="muted-line">The pledge list is for people with Giving view access. Council sees pledge totals on the Pledges page.</p></div>';
  const statusLine = banner ? `<p class="status${banner.ok ? '' : ' status-error'}">${e(banner.message)}</p>` : '';
  const picker = `<form method="GET" action="/" class="panel pl-controls">${hidden('section', 'giving-analytics')}${hidden('page', 'pledge-list')}
    <label>Year <input type="number" name="year" min="2000" max="${p.thisYear + 2}" value="${p.year}"></label><button type="submit">Show</button></form>`;
  if (!result.ok) return `${statusLine}${picker}<p class="status status-error">Pledges could not be read from Connect: ${e(result.message)} Nothing here is a real empty list.</p>`;
  const d = result.data;
  const rows = d.pledges || [];
  const elapsed = yearElapsed(p.year, p.today);
  const pledged = rows.reduce((s, r) => s + (r.amount_cents || 0), 0);
  const toward = rows.reduce((s, r) => s + Math.min(r.given_cents || 0, r.amount_cents || 0), 0);
  const kpis = `<div class="grid">${[
    [`${p.year} pledges`, money(pledged), `${rows.length} pledger${rows.length === 1 ? '' : 's'}`],
    ['Received toward pledges', money(toward), pledged ? `${Math.round((toward / pledged) * 100)}% · ${Math.round(elapsed * 100)}% of the year gone` : ''],
  ].map(([l, v, n]) => `<div class="card"><small>${e(l)}</small><strong>${v}</strong>${n ? `<span>${e(n)}</span>` : ''}</div>`).join('')}</div>`;
  const back = hidden('fiscal_year', p.year);
  const editCell = (r) => (canEdit
    ? `<form method="POST" action="/api/v1/giving-pledges-write" class="inline-form">${hidden('op', 'set')}${hidden('person_id', r.person_id)}${back}
        <label class="sr-only" for="pl-${r.person_id}">Pledge for ${e(fullName(r))}</label><span class="pl-dollar">$<input id="pl-${r.person_id}" name="amount" inputmode="decimal" value="${dollars(r.amount_cents)}" class="pl-amount"></span>
        <input name="note" value="${e(r.note || '')}" placeholder="Note" maxlength="500" class="pl-note" aria-label="Note for ${e(fullName(r))}"><button type="submit" class="button-outline">Save</button></form>`
    : `${money(r.amount_cents)}${r.note ? `<span class="pl-sub">${e(r.note)}</span>` : ''}`);
  const removeCell = (r) => (canEdit
    ? `<form method="POST" action="/api/v1/giving-pledges-write" class="inline-form">${hidden('op', 'delete')}${hidden('person_id', r.person_id)}${back}<button type="submit" class="button-outline">Remove</button></form>` : '');
  const table = rows.length
    ? `<div class="table-scroll"><table class="pm-table pl-table"><thead><tr><th>Pledger</th><th>Pledge</th><th class="num">Given in ${p.year}</th><th class="num">Progress</th><th>Status</th>${canEdit ? '<th></th>' : ''}</tr></thead><tbody>${rows.map((r) => {
      const [label, tone] = status(r, elapsed);
      return `<tr><td>${e(fullName(r))}${r.household_name ? `<span class="pl-sub">${e(r.household_name)}</span>` : ''}</td><td>${editCell(r)}</td><td class="num">${money(r.given_cents)}</td><td class="num">${r.amount_cents ? `${Math.round((r.given_cents / r.amount_cents) * 100)}%` : '—'}</td><td class="${tone ? `tone-${tone}` : ''}">${label}</td>${canEdit ? `<td>${removeCell(r)}</td>` : ''}</tr>`;
    }).join('')}</tbody></table></div>`
    : `<div class="empty-note">No pledges recorded for ${p.year}.</div>`;
  const pledgedIds = new Set(rows.map((r) => r.person_id));
  const found = p.q.length >= 2 ? (d.people || []) : [];
  const add = canEdit ? `<div class="panel panel-spaced"><h2>Add a pledge for ${p.year}</h2>
      <form method="GET" action="/" class="pl-controls">${hidden('section', 'giving-analytics')}${hidden('page', 'pledge-list')}${hidden('year', p.year)}
        <label>Find a person <input type="search" name="q" value="${e(p.q)}" minlength="2" placeholder="Name or household"></label><button type="submit">Find</button></form>
      ${p.q.length >= 2 ? (found.length ? `<div class="table-scroll"><table class="pm-table pl-table"><tbody>${found.map((r) => `<tr><td>${e(fullName(r))}${r.household_name ? `<span class="pl-sub">${e(r.household_name)}</span>` : ''}</td><td>${pledgedIds.has(r.id) ? '<span class="muted-line">Already pledged; change it above.</span>'
        : `<form method="POST" action="/api/v1/giving-pledges-write" class="inline-form">${hidden('op', 'set')}${hidden('person_id', r.id)}${back}<span class="pl-dollar">$<input name="amount" inputmode="decimal" required class="pl-amount" aria-label="Pledge for ${e(fullName(r))}"></span><input name="note" placeholder="Note" maxlength="500" class="pl-note" aria-label="Note"><button type="submit" class="button-outline">Add pledge</button></form>`}</td></tr>`).join('')}</tbody></table></div>`
        : `<p class="muted-line">Nobody in Connect matches “${e(p.q)}”.</p>`) : ''}</div>` : '';
  return `${statusLine}<p class="lede">One annual pledge per person per year, as on each person’s Giving record. Given counts that person’s ${p.year} gifts to any fund${p.year === p.thisYear ? ' so far' : ''}; voided gifts count as $0.</p>
    ${picker}${kpis}<div class="panel panel-spaced list-panel"><h2>Pledges</h2>${table}</div>${add}`;
}

export const PLEDGE_STYLES = `
  .pl-controls { display:flex; flex-wrap:wrap; align-items:flex-end; gap:10px 16px; }
  .pl-controls label { display:flex; flex-direction:column; gap:4px; }
  .pl-controls button { margin-top:0; }
  .pl-table .inline-form { display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin:0; }
  .pl-table .inline-form button { margin-top:0; }
  .pl-amount { width:6.5rem; } .pl-note { width:12rem; }
  .pl-dollar { display:inline-flex; align-items:center; gap:2px; }
  .pl-sub { display:block; color:var(--muted); font-size:12px; }
  .pl-table .num { text-align:right; white-space:nowrap; }
  .sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }
`;

// The pledge form: set (add or change) or delete one pledge, relayed to Connect.
export async function handlePledgeWrite(request, env, url) {
  let form = null;
  try { form = await request.formData(); } catch { /* reported below */ }
  const get = (k) => String(form?.get(k) || '');
  const year = /^\d{4}$/.test(get('fiscal_year')) ? get('fiscal_year') : String(new Date().getUTCFullYear());
  const back = (ok, message) => new Response(null, { status: 303, headers: { Location: `/?${new URLSearchParams({ section: 'giving-analytics', page: 'pledge-list', year, status: ok ? 'ok' : 'error', [ok ? 'msg' : 'message']: String(message).slice(0, 300) }).toString()}` } });
  if (!isSameOriginPost(request, url)) return back(false, 'That form did not come from Timothy Finance.');
  if (!form) return back(false, 'The form could not be read.');
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion') || '';
  if (!canEditPledges(await fetchVerifiedRole(env, jwt))) return back(false, 'Changing pledges needs Giving edit access.');
  const op = get('op') === 'delete' ? 'delete' : 'set';
  const body = { op, person_id: Number(get('person_id')), fiscal_year: Number(year) };
  if (op === 'set') {
    const amount = Number(get('amount').replace(/[$,\s]/g, ''));
    if (!get('amount').trim() || !Number.isFinite(amount) || amount < 0) return back(false, 'Enter the pledge as a dollar amount, such as 1200.');
    body.amount_cents = Math.round(amount * 100);
    body.note = get('note').slice(0, 500);
  }
  const res = await callConnectContract(env, jwt, 'giving-pledges-write-v1', { method: 'POST', body });
  if (!res.ok) return back(false, res.message || 'Connect did not save the pledge.');
  return back(true, op === 'delete' ? (res.result.removed ? 'Pledge removed.' : 'There was no pledge to remove.') : 'Pledge saved.');
}
