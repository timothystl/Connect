// The Compensation Planner's stylesheet: legacy's .fin-comp-* layout (src/frontend/html-head.js),
// drawn in Finance's palette and type. Scoped to .cp so it cannot restyle the rest of the shell,
// and it resets the few Finance-wide element rules (button margins, right-aligned third columns)
// that would otherwise fight the planner's own tables and controls.
export const PLANNER_CSS = `
main:has(.cp) { max-width:none; }
.cp { --color-navy:var(--navy); --color-teal:var(--teal); --color-gold:var(--gold); --color-cream:#F7EFDD;
  --blue-mist:#E8F1F7; --linen:#EEF0F4; --pale-gold:#F3D9A4; --pale-sage:#E6F2EC; --chip-negative-bg:#FBEFEC;
  --sage-text:var(--green); --deep-amber:var(--gold-ink); --danger:var(--red); --white:#fff;
  --warm-gray:var(--muted); --warm-meta:#6B7385; --warm-ink-label:var(--ink); --charcoal:var(--ink);
  --warm-surface-header:#FBF5E6; --warm-surface-page:#F7F8FA; --warm-row-divider:var(--line-soft); --warm-border:var(--line);
  --border:var(--line); --font-display:"Hero","Outfit","Figtree",system-ui,sans-serif; --font-body:inherit;
  margin-top:8px; color:var(--ink); }
.cp button { margin-top:0; }
.cp th, .cp td { padding:0; border-bottom:0; text-align:left; background:none; }
.cp th:nth-child(n+3), .cp td:nth-child(n+3) { text-align:left; }
.cp label { font-weight:inherit; }
.cp input, .cp select { font-size:.8rem; padding:5px 7px; border:1.5px solid var(--line); border-radius:7px; }
.cp input:disabled, .cp select:disabled { background:#F7F8FA; color:var(--muted); }
.cp [data-act] { cursor:pointer; }
.cp .btn-primary, .cp .btn-secondary { display:inline-flex; align-items:center; justify-content:center; gap:6px; min-height:38px; padding:8px 16px; border-radius:8px; font:inherit; font-size:14px; font-weight:600; text-decoration:none; cursor:pointer; }
.cp .btn-primary { background:var(--navy); color:#fff; border:1px solid var(--navy); }
.cp .btn-primary:hover { background:#14203A; }
.cp .btn-secondary { background:#fff; color:var(--navy); border:1px solid #D5DAE3; }
.cp .btn-secondary:hover { background:var(--hover); color:var(--navy); }
.cp .fin-card { background:#fff; border:1px solid var(--line); border-radius:12px; padding:20px 22px; }
.cp .fin-card-title { font-family:var(--font-display); font-size:20px; font-weight:600; color:var(--navy); margin:0 0 4px; }
.cp .fin-card-sub { font-size:.8rem; color:var(--muted); margin:0 0 12px; line-height:1.5; }
.cp .fin-comp-shell { display:flex; flex-direction:column; gap:14px; margin-bottom:14px; }
.cp .fin-comp-titlebar { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; flex-wrap:wrap; }
.cp .fin-comp-title { font-family:var(--font-display); font-size:28px; font-weight:600; color:var(--navy); line-height:1.1; }
.cp .fin-comp-subtitle { font-size:.8rem; color:var(--muted); margin-top:4px; }
.cp .fin-comp-actions { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
.cp .fin-comp-save { font-size:.76rem; color:var(--muted); }
.cp .fin-comp-save.err { color:var(--red); font-weight:600; }
.cp .fin-comp-strip { background:var(--navy); border-radius:14px; padding:15px 22px; color:#fff; display:grid; grid-template-columns:1fr 1fr 1fr 1.3fr; gap:22px; align-items:center; }
.cp .fin-comp-strip-lbl { font-size:10.5px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:rgba(255,255,255,.6); }
.cp .fin-comp-strip-val { font-family:"Outfit",sans-serif; font-size:23px; font-weight:600; font-variant-numeric:tabular-nums; }
.cp .fin-comp-strip-val.gold { color:var(--pale-gold); }
.cp .fin-comp-strip-delta { border-left:1px solid rgba(255,255,255,.25); padding-left:22px; }
.cp .fin-comp-pills { display:flex; align-items:center; gap:6px; background:var(--linen); border-radius:99px; padding:4px; flex-wrap:wrap; align-self:flex-start; }
.cp .fin-comp-pill { padding:7px 16px; border-radius:99px; font-size:.82rem; font-weight:700; color:var(--warm-meta); white-space:nowrap; }
.cp .fin-comp-pill.active { background:var(--navy); color:#fff; }
.cp .fin-comp-toast { background:var(--navy); color:#fff; padding:9px 16px; border-radius:8px; font-size:.84rem; display:flex; align-items:center; justify-content:space-between; gap:12px; }
.cp .fin-comp-toast-x { opacity:.7; font-size:18px; line-height:1; }
.cp .fin-comp-plan-grid { display:grid; grid-template-columns:minmax(0,1fr) 380px; gap:16px; align-items:start; }
.cp .fin-comp-plan-grid.closed { grid-template-columns:minmax(0,1fr); }
.cp .fin-comp-chiprow { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
.cp .fin-comp-chiprow-lbl { font-size:.72rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--warm-meta); }
.cp .fin-comp-chip { padding:5px 12px; border-radius:99px; font-size:.78rem; font-weight:700; background:var(--linen); color:var(--warm-meta); white-space:nowrap; }
.cp .fin-comp-chip.active { background:var(--navy); color:#fff; }
.cp .fin-comp-inline { display:inline-flex; align-items:center; gap:5px; font-size:.74rem; color:var(--muted); }
.cp .fin-comp-link { font-size:.76rem; font-weight:700; color:var(--teal); }
.cp .fin-comp-scroll { overflow-x:auto; }
.cp .fin-comp-table { width:100%; border-collapse:collapse; font-size:.82rem; }
.cp .fin-comp-th { text-align:left; padding:8px 6px; font-size:.7rem; text-transform:uppercase; letter-spacing:.06em; color:var(--warm-meta); border-bottom:1.5px solid var(--line); font-weight:700; background:none; }
.cp .fin-comp-th.num { text-align:right; }
.cp .fin-comp-th.active { background:var(--blue-mist); color:var(--navy); }
.cp .fin-comp-td { padding:11px 6px; vertical-align:top; }
.cp .fin-comp-td.num { text-align:right; font-variant-numeric:tabular-nums; }
.cp .fin-comp-td.active { font-weight:700; color:var(--ink); background:var(--blue-mist); }
.cp .fin-comp-td.edited { font-weight:700; color:var(--deep-amber); background:var(--warm-surface-header); }
.cp .fin-comp-row { border-bottom:1px solid var(--line-soft); }
.cp .fin-comp-row.selected { background:var(--warm-surface-page); }
.cp .fin-comp-total-row { border-top:2px solid var(--navy); font-weight:700; }
.cp .fin-comp-add { display:inline-flex; align-items:center; gap:7px; font-size:.8rem; font-weight:700; color:var(--teal); }
.cp .fin-comp-add-plus { width:18px; height:18px; border-radius:50%; border:1.5px solid var(--teal); display:inline-flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
.cp .fin-comp-cardfoot { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-top:12px; }
.cp .fin-comp-basis { margin-top:14px; padding:11px 13px; border-radius:10px; background:var(--warm-surface-page); border:1px solid var(--line); font-size:.75rem; line-height:1.55; color:var(--ink); }
.cp .fin-comp-basis .fin-comp-pill { padding:4px 11px; font-size:.74rem; }
.cp .fin-comp-basis-list { margin:7px 0; padding-left:18px; }
.cp .fin-comp-basis-h { font-weight:700; color:var(--navy); margin-top:9px; }
.cp .fin-comp-basis-h.warn { color:var(--red); }
.cp .fin-comp-mini { width:auto; border-collapse:collapse; font-size:.78rem; margin:8px 0; }
.cp .fin-comp-mini th { padding:2px 8px; color:var(--muted); font-weight:600; font-size:.78rem; text-align:right; }
.cp .fin-comp-mini th:first-child { text-align:left; padding-left:0; }
.cp .fin-comp-mini.wide { width:100%; max-width:520px; font-size:.72rem; }
.cp .fin-comp-mini.wide td { padding:2px 6px; }
.cp .fin-comp-mini td.n { text-align:right; }
.cp .fin-comp-cardhd { display:flex; align-items:baseline; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:14px; }
.cp .fin-comp-drawer { padding:18px 20px; display:flex; flex-direction:column; gap:12px; }
.cp .fin-comp-drawer-hd { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
.cp .fin-comp-drawer-name { font-family:var(--font-display); font-size:23px; font-weight:600; color:var(--navy); line-height:1.15; }
.cp .fin-comp-drawer-h { font-size:.8rem; font-weight:700; color:var(--navy); margin-top:4px; }
.cp .fin-comp-close { font-size:22px; line-height:1; color:var(--muted); }
.cp .fin-comp-tiles { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
.cp .fin-comp-tile { background:var(--color-cream); border-radius:11px; padding:10px 12px; display:flex; flex-direction:column; gap:2px; }
.cp .fin-comp-tile.teal { background:var(--blue-mist); }
.cp .fin-comp-tile-lbl { font-size:10px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--warm-meta); }
.cp .fin-comp-tile-lbl.teal, .cp .fin-comp-tile.teal .fin-comp-tile-lbl { color:var(--teal); }
.cp .fin-comp-tile-val { font-family:"Outfit",sans-serif; font-size:18px; font-weight:600; font-variant-numeric:tabular-nums; color:var(--ink); }
.cp .fin-comp-fieldgrid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
.cp .fin-comp-field { display:flex; flex-direction:column; gap:3px; font-size:.72rem; color:var(--muted); min-width:0; }
.cp .fin-comp-field.wide { grid-column:1/-1; }
.cp .fin-comp-field input, .cp .fin-comp-field select { width:100%; min-width:0; }
.cp .fin-comp-note { font-size:.72rem; color:var(--muted); line-height:1.5; }
.cp .fin-comp-curpay { width:120px; text-align:right; }
.cp .fin-comp-salary { width:104px; text-align:right; font-weight:700; }
.cp .fin-comp-curpay.set, .cp .fin-comp-salary.set { background:var(--warm-surface-header); border-color:var(--gold); font-weight:700; }
.cp .fin-comp-bar { display:flex; align-items:center; justify-content:space-between; gap:10px; border-radius:9px; padding:8px 12px; font-size:.8rem; color:var(--ink); flex-wrap:wrap; }
.cp .fin-comp-bar b { font-variant-numeric:tabular-nums; }
.cp .fin-comp-bar.cream { background:var(--color-cream); }
.cp .fin-comp-bar.page { background:var(--warm-surface-page); }
.cp .fin-comp-bar.mist { background:var(--blue-mist); margin-top:12px; }
.cp .fin-comp-paylist { display:flex; flex-direction:column; gap:6px; }
.cp .fin-comp-payrow { display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:.8rem; color:var(--muted); }
.cp .fin-comp-payrow b { font-variant-numeric:tabular-nums; color:var(--ink); }
.cp .fin-comp-payrow.total { font-size:.88rem; border-top:1px solid var(--line); padding-top:6px; }
.cp .fin-comp-payrow.total span { font-weight:700; color:var(--navy); }
.cp .fin-comp-inline-check { font-size:.72rem; color:var(--muted); display:inline-flex; align-items:center; gap:4px; margin-left:6px; }
.cp .fin-comp-inline-check.block { display:flex; margin:6px 0 0; }
.cp .fin-comp-seca { display:flex; justify-content:space-between; gap:8px; font-size:.8rem; background:var(--warm-surface-header); border-radius:8px; padding:8px 10px; color:var(--ink); }
.cp .fin-comp-remove { align-self:flex-start; margin-top:4px; font-size:.78rem; color:var(--red); }
.cp .fin-comp-legend { display:flex; gap:20px; font-size:.72rem; color:var(--muted); flex-wrap:wrap; margin-bottom:8px; }
.cp .fin-comp-swatch { display:inline-block; vertical-align:middle; }
.cp .fin-comp-swatch.fill { width:16px; height:9px; background:var(--teal); opacity:.22; border-radius:5px; }
.cp .fin-comp-swatch.mid { width:3px; height:12px; background:var(--teal); }
.cp .fin-comp-swatch.salary { width:3px; height:12px; background:var(--gold); }
.cp .fin-comp-fairblock { border-top:1px solid var(--line-soft); padding-top:14px; margin-top:14px; display:flex; flex-direction:column; gap:10px; }
.cp .fin-comp-fairhd { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.cp .fin-comp-verdict { padding:5px 12px; border-radius:99px; font-size:.76rem; font-weight:700; white-space:nowrap; }
.cp .fin-comp-embed-badge { display:inline-block; padding:1px 8px; border-radius:99px; font-size:.66rem; font-weight:700; white-space:nowrap; cursor:help; }
.cp .fin-comp-embed-badge.emb { background:var(--teal); color:#fff; }
.cp .fin-comp-embed-badge.agg { background:var(--linen); color:var(--ink); border:1px solid var(--line); }
.cp .fin-comp-ranges { display:flex; flex-direction:column; gap:12px; }
.cp .fin-comp-rangerow { display:grid; grid-template-columns:160px minmax(0,1fr) 210px; gap:14px; align-items:center; }
.cp .fin-comp-rangelbl { font-size:.78rem; font-weight:600; color:var(--ink); }
.cp .fin-comp-rangenum { font-size:.74rem; color:var(--muted); font-variant-numeric:tabular-nums; }
.cp .fin-comp-track { height:14px; border-radius:7px; background:var(--linen); position:relative; }
.cp .fin-comp-fill { position:absolute; top:0; bottom:0; border-radius:7px; background:var(--teal); opacity:.22; }
.cp .fin-comp-tick { position:absolute; width:3px; }
.cp .fin-comp-tick.mid { top:-4px; bottom:-4px; background:var(--teal); }
.cp .fin-comp-tick.salary { top:-7px; bottom:-7px; background:var(--gold); }
.cp .fin-comp-noreport { font-size:.78rem; color:var(--muted); background:var(--color-cream); border-radius:10px; padding:10px 14px; }
.cp .fin-comp-plangrid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-bottom:16px; }
.cp .fin-comp-plancard { border-radius:12px; padding:14px 16px; display:flex; flex-direction:column; gap:6px; background:#fff; border:1.5px solid var(--line); }
.cp .fin-comp-plancard.active { background:var(--blue-mist); border:2px solid var(--navy); }
.cp .fin-comp-planval { font-family:"Outfit",sans-serif; font-size:20px; font-weight:600; color:var(--navy); font-variant-numeric:tabular-nums; }
.cp .fin-comp-radio { width:15px; height:15px; border-radius:50%; flex-shrink:0; background:#fff; border:1.5px solid var(--line); }
.cp .fin-comp-radio.active { border:5px solid var(--navy); }
.cp .fin-comp-dollarbox { display:inline-flex; align-items:center; gap:3px; justify-content:flex-end; }
.cp .fin-comp-dollarbox span { color:var(--muted); font-weight:400; }
.cp .fin-comp-dollarbox input { width:88px; text-align:right; font-weight:700; }
.cp .fin-comp-details { margin-top:12px; }
.cp .fin-comp-details summary { cursor:pointer; font-size:.78rem; font-weight:700; color:var(--teal); }
.cp .fin-comp-ratesbanner { background:var(--warm-surface-header); border-radius:12px; padding:14px 18px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.cp .fin-comp-yearsel { padding:6px 10px; border:1.5px solid var(--gold); border-radius:8px; font-size:.86rem; font-weight:700; background:#fff; color:var(--navy); }
.cp .fin-comp-ratesgrid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; align-items:start; }
.cp .fin-comp-rategrid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
.cp .fin-comp-reflabel { display:flex; flex-direction:column; gap:4px; font-size:.72rem; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--warm-meta); min-width:0; }
.cp .fin-comp-reflabel input, .cp .fin-comp-reflabel select { padding:7px 9px; font-size:.92rem; font-variant-numeric:tabular-nums; letter-spacing:0; text-transform:none; color:var(--ink); }
.cp .fin-comp-reflabel-hd { font-size:.72rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--warm-meta); }
.cp .fin-comp-warn { font-size:.78rem; color:var(--deep-amber); background:var(--warm-surface-header); border-radius:9px; padding:9px 12px; margin-top:10px; }
.cp .fin-comp-histchip { padding:5px 10px; border-radius:8px; font-size:.76rem; font-variant-numeric:tabular-nums; background:var(--color-cream); color:var(--warm-meta); }
.cp .fin-comp-histchip.active { background:var(--blue-mist); color:var(--navy); font-weight:700; }
.cp .fin-comp-quote-active, .cp .fin-comp-lcms-row { background:var(--blue-mist); }
.cp .fin-comp-counciltiles { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; margin-bottom:18px; }
.cp .fin-comp-ctile { background:var(--color-cream); border-radius:12px; padding:16px 18px; display:flex; flex-direction:column; gap:3px; }
.cp .fin-comp-ctile.mist { background:var(--blue-mist); }
.cp .fin-comp-ctile.navy { background:var(--navy); }
.cp .fin-comp-ctile.navy .fin-comp-tile-lbl { color:rgba(255,255,255,.6); }
.cp .fin-comp-ctile-val { font-family:"Outfit",sans-serif; font-size:22px; font-weight:600; font-variant-numeric:tabular-nums; color:var(--ink); }
.cp .fin-comp-ctile.mist .fin-comp-ctile-val { color:var(--navy); }
.cp .fin-comp-ctile-val.gold { color:var(--pale-gold); }
@media(max-width:1100px){ .cp .fin-comp-plan-grid { grid-template-columns:minmax(0,1fr); } }
@media(max-width:900px){
  .cp .fin-comp-strip { grid-template-columns:1fr 1fr; }
  .cp .fin-comp-strip-delta { border-left:none; padding-left:0; }
  .cp .fin-comp-plangrid, .cp .fin-comp-counciltiles { grid-template-columns:1fr 1fr; }
  .cp .fin-comp-ratesgrid { grid-template-columns:1fr; }
}
@media(max-width:767px){
  .cp .fin-comp-strip, .cp .fin-comp-plangrid, .cp .fin-comp-counciltiles, .cp .fin-comp-rategrid { grid-template-columns:1fr; }
  .cp .fin-comp-rangerow { grid-template-columns:minmax(0,1fr); gap:4px; }
  .cp .fin-comp-fieldgrid, .cp .fin-comp-tiles { grid-template-columns:1fr 1fr; }
}
`;
