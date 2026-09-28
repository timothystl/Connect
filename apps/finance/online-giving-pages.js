// Giving Entry → Online form settings: the "cover the processing fee" percentage and which funds
// the public giving form offers. Both settings live in Connect (giving-online-settings-v1),
// which the public form, checkout, and recurring signups read; every change posts to
// /api/v1/giving-online-settings-write, which relays it to Connect. Finance stores nothing.
import { escapeHtml as e } from './render-helpers.js';
import { renderOnlineGivingTabs } from './gift-transactions-pages.js';

function statusBanner(status) {
  return status ? `<p class="status${status.ok ? '' : ' status-error'}">${e(status.message)}</p>` : '';
}

export function renderOnlineFormSettingsPage({ result, status, canEdit }) {
  if (!result.ok) {
    return `${statusBanner(status)}${renderOnlineGivingTabs('form')}<p class="status status-error">The online giving settings could not be read from Connect: ${e(result.message)}</p>`;
  }
  const { fee_percent: fee, default_fee_percent: defaultFee, max_fee_percent: maxFee, funds } = result.data;
  const disabled = canEdit ? '' : ' disabled';
  const publicCount = funds.filter((f) => f.public_giving).length;
  const fundRows = funds.map((f) => `<li><label><input type="checkbox" name="fund" value="${e(f.id)}"${f.public_giving ? ' checked' : ''}${disabled}> ${e(f.name)}</label></li>`).join('');
  return `${statusBanner(status)}
    ${renderOnlineGivingTabs('form')}
    <p class="lede">Settings for the online giving form on give.timothystl.org. Changes save in Connect and apply the next time a donor opens the form.</p>
    ${canEdit ? '' : '<p class="status">You can view these settings. Changing them requires Giving edit access in Connect.</p>'}
    <div class="grid">
      <div class="card"><small>Suggested fee coverage</small><strong>${e(fee)}%</strong><span>Default ${e(defaultFee)}% when nothing is saved</span></div>
      <div class="card"><small>Funds on the form</small><strong>${publicCount}</strong><span>of ${funds.length} active funds</span></div>
    </div>
    <div class="panel panel-spaced">
      <h2>Cover the processing fee</h2>
      <p>Donors who choose to cover the fee are asked to add this percentage to their gift. The fee actually charged is recorded from the processor on each gift.</p>
      <form method="POST" action="/api/v1/giving-online-settings-write">
        <input type="hidden" name="op" value="fee">
        <label class="field"><span>Suggested percentage (greater than 0, up to ${e(maxFee)}%)</span>
          <input type="number" name="fee_percent" min="0.01" max="${e(maxFee)}" step="0.01" inputmode="decimal" required value="${e(fee)}"${disabled}></label>
        ${canEdit ? '<div class="form-actions"><button type="submit">Save percentage</button></div>' : ''}
      </form>
    </div>
    <div class="panel panel-spaced">
      <h2>Funds on the form</h2>
      <p>Only checked funds appear on the public form. Unchecked funds stay active for internal use.</p>
      ${funds.length ? `<form method="POST" action="/api/v1/giving-online-settings-write">
        <input type="hidden" name="op" value="funds">
        <ul class="row-list">${fundRows}</ul>
        ${canEdit ? '<div class="form-actions"><button type="submit">Save funds</button></div>' : ''}
      </form>` : '<div class="empty-note">No active funds.</div>'}
    </div>`;
}
