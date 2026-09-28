import { PLANNER_CSS } from './planner/styles.js';
import { buildCompensationCouncilSnapshot, buildCompensationReportView, buildLiveCompensationCouncilSnapshot } from './compensation-report-service.js';
import { buildCompensationBenchmarkView } from './compensation-benchmark-service.js';
import { buildCompensationBenefitsView } from './compensation-benefits-service.js';
import { escapeHtml, formatCents, renderKpiCards, renderSectionHeading, renderTable } from './render-helpers.js';
import { renderBenchmarksPage, renderBenefitsTaxesPage, renderCouncilReport } from './compensation-council-report.js';
import { renderConcordiaRangesEditor, renderRatesPage } from './compensation-settings-pages.js';

// Which plan year the projection is for; a plain GET form, so the choice is a link like any other.
function renderPlanYearForm(pageId, projection) {
  const year = projection.model.targetYear;
  return `<form method="GET" action="/" class="inline-form" aria-label="Plan year">
    <input type="hidden" name="section" value="compensation"><input type="hidden" name="page" value="${pageId}">
    <label for="plan-year-${pageId}">Plan year</label>
    <input id="plan-year-${pageId}" type="number" name="plan_year" min="2000" max="2100" step="1" value="${year}">
    <button type="submit">Show</button>
    <small>Compared against FY${projection.model.baseYear}.</small>
  </form>`;
}

function renderProjectionUnavailable(projection) {
  return `<p class="status status-error">The raise projection could not be computed: ${escapeHtml(projection.message || 'unknown error')}.</p>`;
}

export function renderCompensationBenchmarkRows(rows) {
  return rows.map((row) => `<tr><td>${escapeHtml(row.roleLabel)}</td><td>${formatCents(row.salaryCents)}</td><td>${formatCents(row.benchmarkSalaryCents)}</td><td>${row.salaryToBenchmarkPct.toFixed(1)}%</td><td>${formatCents(row.gapCents)}</td></tr>`).join('');
}

export function renderCompensationBenefitRows(rows, totalCents) {
  return rows.map((row) => `<tr><td>${escapeHtml(row.componentLabel)}</td><td>${formatCents(row.amountCents)}</td><td>${totalCents === 0 ? '0.0' : (row.amountCents / totalCents * 100).toFixed(1)}%</td><td>${row.roleCount}</td></tr>`).join('');
}

export function renderCompensationPage(pageId, {
  compensationReport, compensationReportLive, compensationBenchmarks, compensationBenefits, viewerRole,
  compensationPlanRaw, canEditCompensation, entryStatus, entryMessage,
  compensationProjection = null, planYear = null, refYear = null, plannerConfig = null,
}) {
  // The Compensation Planner (apps/finance/planner/): Finance's own interactive page, with the
  // same five views, live totals and autosave as Connect's legacy Salary Planner. The page is a
  // mount point plus its settings; the bundled script does the rest and saves to the same plan.
  if (pageId === 'planner') {
    if (!plannerConfig) {
      return '<p class="status status-error">The Compensation Planner is available to admin, compensation and council accounts.</p>';
    }
    const config = JSON.stringify(plannerConfig).replace(/</g, '\\u003c');
    return `<style>${PLANNER_CSS}</style>
      <div id="cp-root" class="cp"><p class="status status-pending">Loading the compensation plan…</p></div>
      <noscript><p class="status status-error">The Compensation Planner needs JavaScript. Without it, the Council report, Benefits &amp; taxes, Benchmarks and Rates &amp; ranges pages show the saved plan.</p></noscript>
      <script type="application/json" id="cp-config">${config}</script>
      <script src="/compensation-planner/app.js?v=${encodeURIComponent(plannerConfig.version || 'local')}" defer></script>`;
  }
  // Legacy's "This year's rates" and market comparison data: editable by admin/compensation,
  // shown read-only to the other roles allowed to read the saved plan.
  if (pageId === 'rates') {
    if (compensationProjection && compensationProjection.ok && compensationPlanRaw && compensationPlanRaw.ok) {
      return renderRatesPage(compensationProjection, compensationPlanRaw.data, {
        canEdit: Boolean(canEditCompensation), refYear, planYear, entryStatus, entryMessage,
      });
    }
    if (compensationProjection && !compensationProjection.ok) return renderProjectionUnavailable(compensationProjection);
    return `<p class="status status-error">Rates &amp; ranges are part of the saved compensation plan, which could not be read${compensationPlanRaw && !compensationPlanRaw.ok ? `: ${escapeHtml(compensationPlanRaw.message || compensationPlanRaw.reason || 'unknown error')}` : ''}.</p>`;
  }
  // With the saved plan (admin, council and compensation roles), both pages are built from the same
  // projection as the Council report: the LCMS Missouri District tables, the Concordia Plans rates
  // and health quote, and each worker's Concordia Compensation Decision Support ranges. The
  // synthetic role-level fixtures below remain only for viewers the saved plan is not shown to.
  if (pageId === 'benchmarks' && compensationProjection && compensationProjection.ok) {
    const rangesEditor = canEditCompensation && compensationPlanRaw && compensationPlanRaw.ok
      ? renderConcordiaRangesEditor(compensationPlanRaw.data, compensationProjection.model, { planYear, canEdit: true, returnPage: 'benchmarks' })
      : '';
    const status = entryStatus === 'ok' ? '<p class="status">Saved in Connect.</p>'
      : entryStatus === 'error' ? `<p class="status status-error">Not saved: ${escapeHtml(entryMessage || 'unknown error')}</p>` : '';
    return status + renderPlanYearForm('benchmarks', compensationProjection) + renderBenchmarksPage(compensationProjection) + rangesEditor;
  }
  if (pageId === 'benefits' && compensationProjection && compensationProjection.ok) {
    return renderPlanYearForm('benefits', compensationProjection) + renderBenefitsTaxesPage(compensationProjection);
  }
  if (['benchmarks', 'benefits'].includes(pageId) && compensationProjection && !compensationProjection.ok) {
    return renderProjectionUnavailable(compensationProjection);
  }
  if (['benchmarks', 'benefits'].includes(pageId) && compensationPlanRaw && !compensationPlanRaw.ok) {
    return `<p class="status status-error">This page is built from the saved compensation plan, which could not be read: ${escapeHtml(compensationPlanRaw.message || compensationPlanRaw.reason || 'unknown error')}. Nothing here is a real $0.</p>`;
  }
  if (pageId === 'benchmarks') {
    const benchmark = buildCompensationBenchmarkView(buildCompensationReportView(compensationReport), compensationBenchmarks);
    return `<section class="report" aria-label="Synthetic Compensation Report benchmarks">
      ${renderSectionHeading({ eyebrow: 'Benchmark comparison', heading: 'Salary against synthetic district-style reference', badge: 'Synthetic · not published guidance' })}
      ${renderKpiCards([
        { label: 'Planned salaries', value: formatCents(benchmark.totals.salaryCents) },
        { label: 'Benchmark salaries', value: formatCents(benchmark.totals.benchmarkSalaryCents), hint: `${benchmark.totals.salaryToBenchmarkPct.toFixed(1)}% of benchmark` },
        { label: 'Gap to benchmark', value: formatCents(benchmark.totals.gapCents), hint: 'Salary only · alternative, not the plan' },
      ])}
      ${renderTable({ head: ['Role', 'Planned salary', 'Benchmark salary', 'Share of benchmark', 'Gap'], rows: renderCompensationBenchmarkRows(benchmark.rows) })}
    </section>`;
  }
  if (pageId === 'benefits') {
    const benefits = buildCompensationBenefitsView(buildCompensationReportView(compensationReport), compensationBenefits);
    return `<section class="report" aria-label="Synthetic Compensation Report benefits and taxes">
      ${renderSectionHeading({ eyebrow: 'Benefits &amp; taxes', heading: 'What the benefits plan contains', badge: `${benefits.reconciled ? 'Reconciled' : 'Review required'} · role-only` })}
      ${renderTable({ head: ['Component', 'Amount', 'Share of benefits', 'Roles covered'], rows: renderCompensationBenefitRows(benefits.rows, benefits.totalCents) })}
      <p>The component total is ${formatCents(benefits.totalCents)} and must exactly match the benefits plan. No personal identities are included.</p>
    </section>`;
  }
  if (pageId === 'council' && compensationProjection && compensationProjection.ok) {
    return renderPlanYearForm('council', compensationProjection) + renderCouncilReport(compensationProjection);
  }
  if (pageId === 'council') {
    const projectionNote = compensationProjection ? renderProjectionUnavailable(compensationProjection)
      : (compensationPlanRaw && !compensationPlanRaw.ok ? `<p class="status status-pending">The Council report needs the saved plan, which could not be read: ${escapeHtml(compensationPlanRaw.message || compensationPlanRaw.reason || 'unknown error')}. The aggregate snapshot is shown instead.</p>` : '');
    // Unlike Benchmarks/Benefits above, a real council rollup IS possible for the roles who
    // already see this same roster, per person, on the Planner -- see
    // buildLiveCompensationCouncilSnapshot's own header comment in compensation-report-service.js
    // for exactly which real fields it uses and which synthetic-only fields (benefitsSharePct,
    // weightedAdjustmentPct) it deliberately does not try to reconstruct.
    if (compensationReportLive && compensationReportLive.source === 'live') {
      const council = buildLiveCompensationCouncilSnapshot(compensationReportLive, viewerRole);
      return `${projectionNote}<section class="report" aria-label="Compensation Report council snapshot">
        ${renderSectionHeading({ eyebrow: 'Council review snapshot', heading: 'Real roster decision context', badge: 'Live from Connect · review-only · not approved' })}
        ${renderKpiCards([
          { label: 'Workers on roster', value: String(council.workerCount), hint: viewerRole === 'council' ? 'Excludes any worker not shown to council' : 'Real per-person roster, aggregated' },
          { label: 'Current pay entered', value: String(council.enteredCurrentPayCount), hint: `${council.unenteredCurrentPayCount} read from a linked budget line or not yet set` },
          { label: 'Entered current pay total', value: formatCents(council.enteredCurrentPayCents), hint: 'Sum of hand-entered current-pay figures only' },
        ])}
        <p>Real, aggregate roster facts only -- restricted to the admin, council, and compensation roles who already see this same data, per person, on the Planner. No benefits-share or weighted-adjustment figure is shown here: those are planning assumptions Connect does not store per worker, so this page never estimates or reconstructs them.</p>
      </section>`;
    }
    const council = buildCompensationCouncilSnapshot(buildCompensationReportView(compensationReport));
    return `${projectionNote}<section class="report" aria-label="Synthetic Compensation Report council snapshot">
      ${renderSectionHeading({ eyebrow: 'Council review snapshot', heading: 'Plan-level decision context', badge: 'Role-only · review-only · not approved' })}
      ${renderKpiCards([
        { label: 'Roles represented', value: String(council.roleCount), hint: 'No personal identities' },
        { label: 'Benefits share', value: `${council.benefitsSharePct.toFixed(1)}%`, hint: 'Of total planned compensation' },
        { label: 'Weighted adjustment', value: `${council.weightedAdjustmentPct.toFixed(1)}%`, hint: 'Salary-weighted planning assumption' },
      ])}
    </section>`;
  }
  // Every Compensation page is handled above; 'plan' (the retired "Plan (new view)") redirects to
  // the Planner in shell.js before it gets here.
  return '<p class="status status-error">This Compensation page no longer exists. The <a href="/?section=compensation&amp;page=planner">Planner</a> has the plan.</p>';
}
