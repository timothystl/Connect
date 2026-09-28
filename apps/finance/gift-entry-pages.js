import { escapeHtml, formatCents, renderSectionHeading, renderTable } from './render-helpers.js';

function renderFundActivityRows(funds) {
  return funds.map((fund) => `<tr><td>${escapeHtml(fund.fundLabel || fund.fundRef)}</td><td>${fund.giftCount}</td><td>${fund.householdCount}</td><td>${formatCents(fund.amounts.grossCents)}</td><td>${formatCents(fund.amounts.refundCents)}</td><td>${formatCents(fund.amounts.netCents)}</td></tr>`).join('');
}

// Gift Entry › Funds. (The single-gift quick-entry form that used to live here was removed: every
// gift is entered in a batch.)
export function renderGiftEntryPage(pageId, { giving, givingSource }) {
  const funds = giving?.funds || [];
  return `<section class="report" aria-label="Fund activity this period">
      ${renderSectionHeading({ eyebrow: 'Gift Entry', heading: 'Funds', badge: givingSource === 'live' ? 'Live from Connect' : 'Synthetic fixture' })}
      <p>This shows each fund’s activity for the current period from Connect’s aggregate giving contract -- gift count, household count, and gross/refund/net amounts. It is not a running restricted-vs-undesignated balance; Connect does not share that classification with Finance today.</p>
      ${renderTable({ head: ['Fund', 'Gifts', 'Households', 'Gross', 'Refunds', 'Net'], rows: renderFundActivityRows(funds) })}
    </section>`;
}
