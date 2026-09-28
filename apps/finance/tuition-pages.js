// Tuition Aid › Overview, Planner, Past years, Settings: Finance's own planner (tuition-planner/),
// in the Finance page like every other section. The page is a mount point plus its settings; the
// bundled script draws the figures and saves through /api/v1/tuition (tuition-service.js).
import { escapeHtml as e } from './render-helpers.js';

export const TUITION_PAGES = ['overview', 'planner', 'past-years', 'settings'];

export const TUITION_STYLES = `
  .tp-head { display:flex; justify-content:flex-end; align-items:center; gap:10px; min-height:22px; margin-top:6px; }
  .tp-save { font-size:12.5px; color:var(--muted); }
  .tp-save.is-ok { color:var(--green); }
  .tp-save.is-error { color:var(--red); font-weight:600; }
  .tp-card, .tp-panel { margin-top:18px; padding:18px 20px; border:1px solid var(--line); border-radius:10px; background:#fff; }
  .tp-panel { border-left:3px solid var(--gold); }
  .tp-panel-head { display:flex; justify-content:space-between; align-items:baseline; gap:12px; }
  .tp-card h2, .tp-panel h2 { margin:0 0 .35rem; font-size:18px; }
  .tp-card h3 { margin:0 0 .4rem; font-size:15px; }
  .tp-card h3 small { color:var(--muted); font-weight:400; font-family:"Figtree", sans-serif; font-size:12.5px; }
  .tp-card > .muted, .tp-panel > .muted { margin:.2rem 0 .8rem; font-size:13.5px; }
  .tp-caption { margin:.5rem 0 0; color:var(--muted); font-size:12.5px; }
  .tp-accent { border-color:var(--navy); background:#F4F7FB; }
  .tp-grid2 { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr)); gap:14px; }
  .tp-kpis { grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); }
  @media(min-width:1100px){ .tp-kpis { grid-template-columns:repeat(3,1fr); } }
  .tp-nowrap { white-space:nowrap; }
  .tp-pct-cell { white-space:nowrap; }
  .tp-grid2 .tp-card { margin-top:14px; }
  .tp-toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:12px 22px; margin-top:14px; padding:12px 16px; border:1px solid var(--line); border-radius:10px; background:#fff; }
  .tp-inline { display:inline-flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:6px; font-size:13.5px; color:var(--muted); }
  .tp-inline label { font-size:13.5px; font-weight:600; color:var(--ink); }
  .tp-inline input[type=number] { width:8rem; }
  .tp-btn { margin-top:0; padding:7px 13px; border:1px solid var(--line); border-radius:8px; background:#fff; color:var(--navy); font-size:13px; font-weight:600; }
  .tp-btn:hover { background:var(--hover); }
  .tp-btn.tp-primary { background:var(--navy); border-color:var(--navy); color:#fff; }
  .tp-btn.tp-primary:hover { background:#14203A; }
  .tp-link { margin:0; padding:2px 4px; border:0; background:none; color:var(--navy); font-size:12.5px; font-weight:600; text-decoration:underline; text-decoration-color:var(--gold); text-underline-offset:3px; cursor:pointer; }
  .tp-link:hover { background:none; color:var(--gold-ink); }
  .tp-link.tp-danger { color:var(--red); text-decoration-color:currentColor; }
  .tp-actionsbar { display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
  .tp-gauge { margin:14px 0 4px; }
  .tp-gauge-track { height:12px; border-radius:999px; background:var(--line-soft); overflow:hidden; }
  .tp-gauge-fill { height:100%; border-radius:999px; background:var(--green); }
  .tp-gauge-fill.is-over { background:var(--red); }
  .tp-gauge-label { display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px 16px; margin-top:6px; font-size:13px; color:var(--muted); }
  .tp-gauge-label b { color:var(--navy); font-family:"Outfit", sans-serif; font-size:15px; font-weight:500; }
  .tp-gauge-label b.tp-over, .tp-over { color:var(--red); }
  .tp-note { margin-top:4px; color:var(--gold-ink); font-size:12.5px; font-style:italic; }
  .tp-table td { vertical-align:middle; }
  .tp-table th:nth-child(n+3), .tp-table td:nth-child(n+3) { text-align:left; }
  .tp-table th.num, .tp-table td.num { text-align:right; }
  .tp-sort { white-space:nowrap; margin:0; padding:0; border:0; background:none; color:inherit; font:inherit; font-weight:600; cursor:pointer; }
  .tp-sort:hover { background:none; color:var(--navy); text-decoration:underline; }
  .tp-table th, .tp-table td { padding:9px 10px; }
  .tp-num { width:5.5rem; padding:6px 8px; text-align:right; font-size:13.5px; }
  .tp-num.tp-pct { width:4.6rem; }
  .tp-num.is-over, .tp-range input.is-over { outline:2px solid rgba(180,65,47,.35); }
  .tp-sub { display:block; margin-top:2px; color:var(--faint); font-size:11.5px; }
  .tp-range { display:flex; align-items:center; gap:8px; }
  .tp-range input[type=range] { width:140px; accent-color:var(--navy); }
  .tp-check { display:flex; align-items:center; gap:6px; margin-top:4px; color:var(--muted); font-size:12px; font-weight:500; justify-content:flex-end; }
  .tp-actions { white-space:nowrap; }
  .tp-preview td { background:#FBF6EC; }
  .tp-live td { background:var(--cream); font-weight:600; }
  .tp-pill { display:inline-block; padding:2px 8px; border-radius:999px; background:#FBF1DC; color:var(--gold-ink); font-size:11px; font-weight:600; }
  .tp-pill.is-new { background:#E6F2EC; color:var(--green); }
  .tp-ok { color:var(--green); font-weight:600; }
  .tp-path { display:grid; grid-template-columns:repeat(5,1fr); gap:0; margin:16px 0 8px; padding:0; list-style:none; }
  .tp-path li { position:relative; display:flex; flex-direction:column; align-items:center; gap:4px; padding-top:22px; text-align:center; }
  .tp-path li::before { content:""; position:absolute; top:7px; left:0; right:0; height:2px; background:var(--line); }
  .tp-path li::after { content:""; position:absolute; top:1px; left:calc(50% - 7px); width:14px; height:14px; border-radius:50%; background:var(--teal); }
  .tp-path li.is-hot::after { background:var(--gold); }
  .tp-path b { font-family:"Outfit", sans-serif; font-size:26px; font-weight:500; color:var(--navy); }
  .tp-path span { color:var(--muted); font-size:12.5px; }
  .tp-flags { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; font-size:13px; }
  .tp-flag { padding:5px 11px; border-radius:999px; background:var(--cream); color:var(--ink); cursor:help; }
  .tp-chart { display:block; width:100%; height:auto; max-height:240px; }
  .tp-bar { fill:#9EC3D6; } .tp-bar-over { fill:var(--red); }
  .tp-line { fill:none; stroke:var(--gold); stroke-width:2.5; } .tp-line.is-dashed { stroke:var(--navy); stroke-width:2; stroke-dasharray:6 4; }
  .tp-dot { fill:var(--gold); } .is-dashed + .tp-dot, .tp-line.is-dashed ~ .tp-dot { fill:var(--navy); }
  .tp-axis { fill:var(--muted); font-size:13px; }
  .tp-seg-k8 { fill:var(--navy); background:var(--navy); } .tp-seg-lhs { fill:var(--gold); background:var(--gold); }
  .tp-legend { display:flex; flex-wrap:wrap; gap:14px; margin-top:6px; color:var(--muted); font-size:12px; }
  .tp-key { display:inline-block; width:10px; height:10px; margin-right:5px; border-radius:2px; vertical-align:-1px; }
  .tp-key-bar { background:#9EC3D6; } .tp-key-line { background:var(--gold); border-radius:50%; }
  .tp-donut { display:flex; flex-wrap:wrap; align-items:center; gap:18px; }
  .tp-donut svg { width:180px; height:180px; }
  .tp-donut ul { flex:1; min-width:200px; margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:8px; font-size:13px; color:var(--ink); }
  .tp-donut li { display:grid; grid-template-columns:auto 1fr auto 3rem; align-items:center; gap:6px; }
  .tp-donut li b { font-family:"Outfit", sans-serif; font-weight:500; } .tp-donut li small { color:var(--muted); text-align:right; }
  .tp-c1 { fill:var(--navy); background:var(--navy); } .tp-c2 { fill:var(--gold); background:var(--gold); } .tp-c3 { fill:#B9C0CC; background:#B9C0CC; }
  .tp-pipeline { margin-top:12px; padding:12px 14px; border:1px dashed #D5DAE3; border-radius:10px; background:#FBFBFC; }
  .tp-pipeline ul { margin:0; padding:0; list-style:none; display:flex; flex-wrap:wrap; gap:8px; }
  .tp-pipeline li { display:flex; align-items:center; gap:4px; padding:4px 10px; border:1px solid var(--line); border-radius:999px; background:#fff; font-size:13px; }
  .tp-pipeline li small { color:var(--muted); }
  .tp-pipeline li.muted { border:0; background:none; font-style:italic; }
  .tp-form-row { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
  .tp-form-row input, .tp-form-row select { padding:7px 9px; font-size:13.5px; }
  .tp-form-row input[type=number] { width:7.5rem; }
  .tp-form-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:10px 14px; margin:10px 0 14px; }
  .tp-form-grid label, .tp-person label { display:flex; flex-direction:column; gap:5px; }
  .tp-form-grid .tp-check { flex-direction:row; justify-content:flex-start; align-self:end; }
  .tp-person { margin-top:8px; max-width:520px; }
  .tp-results { margin:6px 0 0; padding:0; list-style:none; }
  .tp-results li { padding:3px 0; }
  .tp-settings { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:12px 24px; }
  .tp-setting { padding:10px 0; border-bottom:1px solid var(--line-soft); }
  .tp-setting .tp-inline { display:flex; }
  .tp-setting > label { display:block; font-size:13.5px; font-weight:600; color:var(--ink); }
  .tp-setting small { display:block; margin-top:6px; line-height:1.45; }
  .tp-scroll { max-height:360px; overflow:auto; }
  .tp-warn-row td { background:#FBEFEC; } .tp-soft-row td { background:var(--page); }
  .notice ul { margin:6px 0 0; padding-left:18px; }
  @media(max-width:767px){ .tp-path b { font-size:20px; } .tp-path span { font-size:11px; } .tp-grid2 { grid-template-columns:1fr; } }
  @media print{ .tp-head, .tp-actionsbar, .tp-form-row, .tp-toolbar button, .tp-actions, .tp-panel .tp-link, #tp-import-file { display:none !important; } .tp-card { break-inside:avoid; } }
`;

const LEDES = {
  overview: 'This year’s tuition aid at a glance: students supported, awards, the pathway from PK to Lutheran High, and the budget outlook.',
  planner: 'Plan K–8 and Lutheran High School tuition aid against the aid budget, for this year or a year ahead.',
  'past-years': 'What was awarded in earlier years, family by family, and the Excel history import.',
  settings: 'Tuition rates, growth and the aid policy the planner uses.',
};

export function renderTuitionPage(pageId, { viewer, version, year }) {
  const page = TUITION_PAGES.includes(pageId) ? pageId : 'overview';
  const config = JSON.stringify({ page, role: viewer.role, canEdit: viewer.permissions.tuitionaid === 'edit', year: year ?? null })
    .replace(/</g, '\\u003c');
  return `<p class="lede">${e(LEDES[page])}</p>
    <style>${TUITION_STYLES}</style>
    <div id="tp-root" class="tp"><p class="status status-pending">Loading Tuition Aid…</p></div>
    <noscript><p class="status status-error">The Tuition Aid planner needs JavaScript.</p></noscript>
    <script type="application/json" id="tp-config">${config}</script>
    <script src="/tuition-planner/app.js?v=${encodeURIComponent(version || 'local')}" defer></script>`;
}
