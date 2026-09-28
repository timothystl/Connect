// The Compensation Planner's stylesheet, drawn with Finance's own shell tokens and patterns
// (shell-layout.js SHELL_STYLES, the Budget builder's navy banner and underline tabs): white
// bordered cards, grey table headings, the navy KPI strip, outlined chips. Scoped to .cp so it
// cannot restyle the rest of the shell. The --color-* / --warm-* names are the legacy aliases the
// views' inline styles still read, mapped onto Finance's palette here. It also resets the few
// Finance-wide element rules (button margins, right-aligned third columns) that would otherwise
// fight the planner's own tables and controls.
export const PLANNER_CSS = `
main:has(.cp) { max-width:none; }
.cp { --color-navy:var(--navy); --color-teal:var(--teal); --color-gold:var(--gold); --color-cream:#F7F8FA;
  --blue-mist:#EAF3F8; --linen:var(--page); --pale-gold:#F3D9A4; --pale-sage:#E6F2EC; --chip-negative-bg:#FBEFEC;
  --sage-text:var(--green); --deep-amber:var(--gold-ink); --danger:var(--red); --white:#fff;
  --warm-gray:var(--muted); --warm-meta:var(--muted); --warm-ink-label:var(--ink); --charcoal:var(--ink);
  --warm-surface-header:#FBF5E6; --warm-surface-page:#F7F8FA; --warm-row-divider:var(--line-soft); --warm-border:var(--line);
  --border:var(--line); --font-display:"Hero","Outfit","Figtree",system-ui,sans-serif; --font-body:inherit;
  margin-top:14px; color:var(--ink); font-size:14px; }
.cp button { margin-top:0; }
.cp th, .cp td { padding:0; border-bottom:0; text-align:left; background:none; }
.cp th:nth-child(n+3), .cp td:nth-child(n+3) { text-align:left; }
.cp label { font-weight:inherit; }
.cp input, .cp select { font-size:13.5px; padding:6px 9px; border:1px solid #D5DAE3; border-radius:8px; }
.cp input:disabled, .cp select:disabled { background:#F7F8FA; color:var(--muted); }
.cp [data-act] { cursor:pointer; }
.cp .btn-primary, .cp .btn-secondary { display:inline-flex; align-items:center; justify-content:center; gap:6px; min-height:38px; padding:9px 16px; border-radius:8px; font:inherit; font-size:14px; font-weight:600; text-decoration:none; cursor:pointer; }
.cp .btn-primary { background:var(--navy); color:#fff; border:1px solid var(--navy); }
.cp .btn-primary:hover { background:#14203A; color:#fff; }
.cp .btn-secondary { background:#fff; color:var(--navy); border:1px solid #D5DAE3; }
.cp .btn-secondary:hover { background:var(--hover); color:var(--navy); }
.cp .fin-card { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:18px 20px; }
.cp .fin-card-title { font-family:var(--font-display); font-size:20px; font-weight:500; color:var(--navy); margin:0 0 4px; letter-spacing:-.01em; }
.cp .fin-card-sub { font-size:13px; color:var(--muted); margin:0 0 12px; line-height:1.5; }
.cp .fin-comp-shell { display:flex; flex-direction:column; gap:14px; margin-bottom:16px; }
.cp .fin-comp-titlebar { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.cp .fin-comp-title { font-family:var(--font-display); font-size:20px; font-weight:500; color:var(--navy); line-height:1.2; margin:0; letter-spacing:-.01em; }
.cp .fin-comp-subtitle { font-size:13px; color:var(--muted); margin-top:4px; line-height:1.5; }
.cp .fin-comp-actions { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
.cp .fin-comp-save { font-size:12.5px; color:var(--muted); }
.cp .fin-comp-save.err { color:var(--red); font-weight:600; }
.cp .fin-comp-strip { background:var(--navy); border-radius:10px; padding:20px 24px; color:#fff; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:18px; align-items:center; }
.cp .fin-comp-strip-lbl { font-size:13px; color:#C9D2E2; }
.cp .fin-comp-strip-val { font-family:"Outfit",sans-serif; font-size:28px; font-weight:500; font-variant-numeric:tabular-nums; margin-top:4px; line-height:1.15; }
.cp .fin-comp-strip-val.gold { color:var(--pale-gold); }
.cp .fin-comp-strip-delta { border-left:1px solid rgba(255,255,255,.2); padding-left:18px; }
.cp .fin-comp-pills { display:flex; align-items:flex-end; gap:22px; border-bottom:1px solid #E3E7EE; flex-wrap:wrap; }
.cp .fin-comp-pill { padding:10px 0; margin-bottom:-1px; font-size:14px; font-weight:600; color:#4B5563; white-space:nowrap; border-bottom:2px solid transparent; }
.cp .fin-comp-pill:hover { color:var(--navy); }
.cp .fin-comp-pill.active { color:var(--navy); border-bottom-color:#9A6B12; }
.cp .fin-comp-basis .fin-comp-pill { padding:5px 11px; margin:0; border:1px solid var(--line); border-radius:8px; background:#fff; font-size:12.5px; color:var(--muted); }
.cp .fin-comp-basis .fin-comp-pill.active { background:var(--navy); border-color:var(--navy); color:#fff; }
.cp .fin-comp-toast { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 14px; border:1px solid #CFE3D8; border-radius:8px; background:#EFF7F2; color:var(--green); font-size:13.5px; font-weight:600; }
.cp .fin-comp-toast-x { color:var(--muted); font-size:18px; line-height:1; }
.cp .fin-comp-chiprow { display:flex; align-items:center; gap:10px 14px; flex-wrap:wrap; }
.cp .fin-comp-chiprow-lbl { font-size:11.5px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--gold-ink); }
.cp .fin-comp-chips { display:flex; gap:6px; flex-wrap:wrap; }
.cp .fin-comp-chip { padding:6px 12px; border:1px solid var(--line); border-radius:8px; background:#fff; color:var(--muted); font-size:13px; font-weight:600; white-space:nowrap; }
.cp .fin-comp-chip:hover { color:var(--navy); border-color:#C3CDDD; }
.cp .fin-comp-chip.active { background:var(--navy); border-color:var(--navy); color:#fff; }
.cp .fin-comp-inline { display:inline-flex; align-items:center; gap:6px; font-size:13px; font-weight:600; color:var(--muted); }
.cp .fin-comp-pctbox { width:64px; text-align:right; }
.cp .fin-comp-help { margin:10px 0 0; font-size:13px; color:var(--muted); }
.cp .fin-comp-link { font-size:13px; font-weight:600; color:var(--teal); }
.cp .fin-comp-link:hover { text-decoration:underline; }
.cp .fin-comp-muted { color:var(--muted); font-weight:400; }
.cp .fin-comp-strong { font-weight:700; }
.cp .fin-comp-flag { color:var(--gold-ink); font-weight:600; }
.cp .fin-comp-badge { display:inline-block; padding:2px 9px; border-radius:999px; background:#FBF0D9; color:#8A5A0B; font-size:11.5px; font-weight:600; }
.cp .fin-comp-scroll { overflow-x:auto; margin-top:14px; border:1px solid var(--line); border-radius:10px; background:#fff; }
.cp .fin-comp-table { width:100%; border-collapse:collapse; font-size:13.5px; }
.cp .fin-comp-settable { min-width:880px; }
.cp .fin-comp-th { padding:10px 12px; font-size:12px; font-weight:600; color:var(--muted); background:#F7F8FA; border-bottom:1px solid var(--line); white-space:nowrap; }
.cp .fin-comp-th.num { text-align:right; }
.cp .fin-comp-th.active { background:#EAF3F8; color:var(--navy); }
.cp .fin-comp-td { padding:10px 12px; vertical-align:top; }
.cp .fin-comp-td.num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
.cp .fin-comp-td.active { font-weight:700; color:var(--navy); background:#EAF3F8; }
.cp .fin-comp-td.edited { font-weight:700; color:#8A5A0B; background:#FBF5E6; }
.cp .fin-comp-td.num[data-act]:hover { box-shadow:inset 0 0 0 1px #C3CDDD; }
.cp .fin-comp-row { border-bottom:1px solid var(--line-soft); }
.cp .fin-comp-row.selected { background:#F7F8FA; }
.cp .fin-comp-row.selected .fin-comp-who { box-shadow:inset 3px 0 0 var(--gold); }
.cp .fin-comp-who { min-width:200px; }
.cp .fin-comp-who:hover .fin-comp-who-name { color:var(--teal); }
.cp .fin-comp-who-name { font-weight:600; color:var(--navy); display:flex; align-items:baseline; gap:6px; }
.cp .fin-comp-who-meta { font-size:12px; color:var(--muted); margin:2px 0 0 16px; line-height:1.45; }
.cp .fin-comp-caret { width:10px; flex-shrink:0; color:var(--faint); font-size:11px; }
.cp .fin-comp-vs { font-size:12.5px; font-weight:600; }
.cp .fin-comp-handset-cell { padding-top:6px; padding-bottom:6px; }
.cp .fin-comp-handset { width:92px; text-align:right; font-variant-numeric:tabular-nums; }
.cp .fin-comp-handset.set { border-color:var(--gold); background:#fff; font-weight:700; color:var(--ink); }
.cp .fin-comp-clear { font-size:15px; margin-left:2px; }
.cp .fin-comp-editor-row > td { padding:0; background:#F7F8FA; border-bottom:1px solid var(--line); box-shadow:inset 3px 0 0 var(--gold); }
.cp .fin-comp-addrow td { padding:10px 12px; }
.cp .fin-comp-total-row { border-top:2px solid var(--line); font-weight:600; }
.cp .fin-comp-total-row .fin-comp-td { font-weight:600; }
.cp .fin-comp-add { display:inline-flex; align-items:center; gap:7px; font-size:13px; font-weight:600; color:var(--teal); }
.cp .fin-comp-add-plus { width:18px; height:18px; border-radius:50%; border:1.5px solid var(--teal); display:inline-flex; align-items:center; justify-content:center; font-size:13px; line-height:1; }
.cp .fin-comp-cardfoot { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-top:14px; font-size:13px; }
.cp .fin-comp-basis { margin-top:14px; padding:12px 16px; border:1px solid var(--line); border-left:3px solid var(--gold); border-radius:8px; background:#fff; font-size:13px; line-height:1.55; color:var(--ink); }
.cp .fin-comp-basis-list { margin:7px 0; padding-left:18px; }
.cp .fin-comp-basis-h { font-weight:600; color:var(--navy); margin-top:9px; }
.cp .fin-comp-basis-h.warn { color:var(--red); }
.cp .fin-comp-mini { width:auto; border-collapse:collapse; font-size:13px; margin:8px 0; }
.cp .fin-comp-mini th { padding:2px 8px; color:var(--muted); font-weight:600; font-size:12px; text-align:right; }
.cp .fin-comp-mini th:first-child { text-align:left; padding-left:0; }
.cp .fin-comp-mini.wide { width:100%; max-width:520px; font-size:12.5px; }
.cp .fin-comp-mini.wide td { padding:2px 6px; }
.cp .fin-comp-mini td.n { text-align:right; }
.cp .fin-comp-cardhd { display:flex; align-items:baseline; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:14px; }
.cp .fin-comp-drawer { padding:18px 20px 20px 23px; display:flex; flex-direction:column; gap:16px; }
.cp .fin-comp-drawer-hd { display:grid; grid-template-columns:minmax(200px,1fr) minmax(0,2fr) auto; align-items:start; gap:16px; }
.cp .fin-comp-drawer-name { font-family:var(--font-display); font-size:20px; font-weight:500; color:var(--navy); line-height:1.2; margin-top:2px; }
.cp .fin-comp-drawer-cols { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; align-items:start; }
.cp .fin-comp-drawer-cols > section { background:#fff; border:1px solid var(--line); border-radius:10px; padding:14px 16px; display:flex; flex-direction:column; gap:10px; min-width:0; }
.cp .fin-comp-drawer-h { font-size:11.5px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--gold-ink); }
.cp .fin-comp-close { font-size:24px; line-height:1; color:var(--muted); padding:0 4px; }
.cp .fin-comp-close:hover { color:var(--navy); }
.cp .fin-comp-tiles { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
.cp .fin-comp-tile { background:#fff; border:1px solid var(--line); border-radius:10px; padding:10px 14px; display:flex; flex-direction:column; gap:2px; }
.cp .fin-comp-tile.teal { border-color:#BFD9E8; background:#EAF3F8; }
.cp .fin-comp-tile-lbl { font-size:12.5px; color:var(--muted); }
.cp .fin-comp-tile-lbl.teal, .cp .fin-comp-tile.teal .fin-comp-tile-lbl { color:var(--teal); }
.cp .fin-comp-tile-val { font-family:"Outfit",sans-serif; font-size:20px; font-weight:500; font-variant-numeric:tabular-nums; color:var(--navy); }
.cp .fin-comp-fieldgrid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
.cp .fin-comp-field { display:flex; flex-direction:column; gap:5px; font-size:12.5px; font-weight:600; color:var(--muted); min-width:0; }
.cp .fin-comp-field.wide { grid-column:1/-1; }
.cp .fin-comp-field input, .cp .fin-comp-field select { width:100%; min-width:0; font-weight:400; color:var(--ink); }
.cp .fin-comp-inputrow { display:inline-flex; align-items:center; gap:8px; }
.cp .fin-comp-inputrow .fin-comp-muted { white-space:nowrap; }
.cp .fin-comp-note { font-size:12.5px; color:var(--muted); line-height:1.5; }
.cp .fin-comp-note.warn { color:var(--gold-ink); }
.cp .fin-comp-curpay { width:130px !important; text-align:right; }
.cp .fin-comp-salary { width:110px; text-align:right; font-weight:700; }
.cp .fin-comp-curpay.set, .cp .fin-comp-salary.set { border-color:var(--gold); font-weight:700; }
.cp .fin-comp-bar { display:flex; align-items:center; justify-content:space-between; gap:10px; border-radius:8px; padding:8px 12px; font-size:13px; color:var(--ink); flex-wrap:wrap; }
.cp .fin-comp-bar b { font-variant-numeric:tabular-nums; }
.cp .fin-comp-bar.cream { background:#F7F8FA; border:1px solid var(--line-soft); }
.cp .fin-comp-bar.page { background:#F7F8FA; border:1px solid var(--line-soft); }
.cp .fin-comp-bar.mist { background:#EAF3F8; margin-top:12px; }
.cp .fin-comp-paylist { display:flex; flex-direction:column; gap:6px; border-top:1px solid var(--line-soft); padding-top:10px; }
.cp .fin-comp-payrow { display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:13.5px; color:var(--muted); }
.cp .fin-comp-payrow b { font-variant-numeric:tabular-nums; color:var(--ink); }
.cp .fin-comp-payrow.total { font-size:14px; border-top:2px solid var(--line); padding-top:6px; }
.cp .fin-comp-payrow.total span { font-weight:600; color:var(--navy); }
.cp .fin-comp-inline-check { font-size:12.5px; font-weight:400; color:var(--muted); display:inline-flex; align-items:center; gap:6px; margin-left:6px; }
.cp .fin-comp-inline-check.block { display:flex; align-items:flex-start; margin:2px 0 0; line-height:1.45; }
.cp .fin-comp-inline-check.block input { margin-top:2px; }
.cp .fin-comp-seca { display:flex; justify-content:space-between; gap:8px; font-size:12.5px; background:#FBF5E6; border-radius:8px; padding:8px 10px; color:var(--ink); }
.cp .fin-comp-seca b { white-space:nowrap; }
.cp .fin-comp-remove { align-self:flex-start; margin-top:4px; font-size:13px; color:var(--red); }
.cp .fin-comp-legend { display:flex; gap:20px; font-size:12.5px; color:var(--muted); flex-wrap:wrap; margin-bottom:8px; }
.cp .fin-comp-swatch { display:inline-block; vertical-align:middle; }
.cp .fin-comp-swatch.fill { width:16px; height:9px; background:var(--teal); opacity:.22; border-radius:5px; }
.cp .fin-comp-swatch.mid { width:3px; height:12px; background:var(--teal); }
.cp .fin-comp-swatch.salary { width:3px; height:12px; background:var(--gold); }
.cp .fin-comp-fairblock { border-top:1px solid var(--line-soft); padding-top:14px; margin-top:14px; display:flex; flex-direction:column; gap:10px; }
.cp .fin-comp-fairhd { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.cp .fin-comp-verdict { padding:4px 10px; border-radius:999px; font-size:12px; font-weight:600; white-space:nowrap; }
.cp .fin-comp-embed-badge { display:inline-block; padding:1px 8px; border-radius:999px; font-size:11px; font-weight:600; white-space:nowrap; cursor:help; }
.cp .fin-comp-embed-badge.emb { background:var(--teal); color:#fff; }
.cp .fin-comp-embed-badge.agg { background:var(--page); color:var(--ink); border:1px solid var(--line); }
.cp .fin-comp-ranges { display:flex; flex-direction:column; gap:12px; }
.cp .fin-comp-rangerow { display:grid; grid-template-columns:160px minmax(0,1fr) 210px; gap:14px; align-items:center; }
.cp .fin-comp-rangelbl { font-size:13px; font-weight:600; color:var(--ink); }
.cp .fin-comp-rangenum { font-size:12.5px; color:var(--muted); font-variant-numeric:tabular-nums; }
.cp .fin-comp-track { height:14px; border-radius:7px; background:var(--page); position:relative; }
.cp .fin-comp-fill { position:absolute; top:0; bottom:0; border-radius:7px; background:var(--teal); opacity:.22; }
.cp .fin-comp-tick { position:absolute; width:3px; }
.cp .fin-comp-tick.mid { top:-4px; bottom:-4px; background:var(--teal); }
.cp .fin-comp-tick.salary { top:-7px; bottom:-7px; background:var(--gold); }
.cp .fin-comp-noreport { font-size:13px; color:var(--muted); background:#F7F8FA; border:1px solid var(--line-soft); border-radius:8px; padding:10px 14px; }
.cp .fin-comp-plangrid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-bottom:16px; }
.cp .fin-comp-plancard { border-radius:10px; padding:14px 16px; display:flex; flex-direction:column; gap:6px; background:#fff; border:1px solid var(--line); }
.cp .fin-comp-plancard.active { background:#EAF3F8; border:1px solid var(--navy); box-shadow:inset 0 0 0 1px var(--navy); }
.cp .fin-comp-planval { font-family:"Outfit",sans-serif; font-size:20px; font-weight:500; color:var(--navy); font-variant-numeric:tabular-nums; }
.cp .fin-comp-radio { width:15px; height:15px; border-radius:50%; flex-shrink:0; background:#fff; border:1.5px solid #C3CDDD; }
.cp .fin-comp-radio.active { border:5px solid var(--navy); }
.cp .fin-comp-dollarbox { display:inline-flex; align-items:center; gap:3px; justify-content:flex-end; }
.cp .fin-comp-dollarbox span { color:var(--muted); font-weight:400; }
.cp .fin-comp-dollarbox input { width:92px; text-align:right; font-weight:700; }
.cp .fin-comp-details { margin-top:12px; }
.cp .fin-comp-details summary { cursor:pointer; font-size:13px; font-weight:600; color:var(--teal); }
.cp .fin-comp-ratesbanner { background:#fff; border:1px solid var(--line); border-left:3px solid var(--gold); border-radius:8px; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.cp .fin-comp-yearsel { padding:6px 10px; border:1px solid var(--gold); border-radius:8px; font-size:14px; font-weight:600; background:#fff; color:var(--navy); }
.cp .fin-comp-ratesgrid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; align-items:start; }
.cp .fin-comp-rategrid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
.cp .fin-comp-reflabel { display:flex; flex-direction:column; gap:5px; font-size:12.5px; font-weight:600; color:var(--muted); min-width:0; }
.cp .fin-comp-reflabel input, .cp .fin-comp-reflabel select { padding:8px 10px; font-size:14px; font-weight:400; font-variant-numeric:tabular-nums; color:var(--ink); }
.cp .fin-comp-reflabel-hd { font-size:11.5px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--gold-ink); }
.cp .fin-comp-warn { font-size:13px; color:var(--gold-ink); background:#FBF5E6; border:1px solid #F0E0BC; border-radius:8px; padding:9px 12px; margin-top:10px; }
.cp .fin-comp-histchip { padding:4px 10px; border-radius:999px; font-size:12px; font-variant-numeric:tabular-nums; background:var(--page); color:var(--muted); }
.cp .fin-comp-histchip.active { background:#EAF3F8; color:var(--teal); font-weight:600; }
.cp .fin-comp-quote-active, .cp .fin-comp-lcms-row { background:#EAF3F8; }
.cp .fin-comp-counciltiles { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; margin-bottom:18px; }
.cp .fin-comp-ctile { background:#fff; border:1px solid var(--line); border-radius:10px; padding:16px 18px; display:flex; flex-direction:column; gap:4px; }
.cp .fin-comp-ctile.mist { background:#EAF3F8; border-color:#BFD9E8; }
.cp .fin-comp-ctile.navy { background:var(--navy); border-color:var(--navy); }
.cp .fin-comp-ctile.navy .fin-comp-tile-lbl { color:#C9D2E2; }
.cp .fin-comp-ctile-val { font-family:"Outfit",sans-serif; font-size:24px; font-weight:500; font-variant-numeric:tabular-nums; color:var(--navy); }
.cp .fin-comp-ctile.mist .fin-comp-ctile-val { color:var(--navy); }
.cp .fin-comp-ctile-val.gold { color:var(--pale-gold); }
@media(max-width:1200px){
  .cp .fin-comp-drawer-cols { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .cp .fin-comp-drawer-cols > section:last-child { grid-column:1/-1; }
  .cp .fin-comp-drawer-hd { grid-template-columns:minmax(0,1fr) auto; }
  .cp .fin-comp-drawer-hd .fin-comp-tiles { grid-column:1/-1; grid-row:2; }
}
@media(max-width:900px){
  .cp .fin-comp-strip { grid-template-columns:1fr 1fr; }
  .cp .fin-comp-strip-delta { border-left:none; padding-left:0; }
  .cp .fin-comp-plangrid, .cp .fin-comp-counciltiles { grid-template-columns:1fr 1fr; }
  .cp .fin-comp-ratesgrid, .cp .fin-comp-drawer-cols { grid-template-columns:1fr; }
  .cp .fin-comp-tiles { grid-template-columns:1fr 1fr; }
}
@media(max-width:767px){
  .cp .fin-comp-strip, .cp .fin-comp-plangrid, .cp .fin-comp-counciltiles, .cp .fin-comp-rategrid { grid-template-columns:1fr; }
  .cp .fin-comp-rangerow { grid-template-columns:minmax(0,1fr); gap:4px; }
  .cp .fin-comp-fieldgrid { grid-template-columns:1fr 1fr; }
}
`;
