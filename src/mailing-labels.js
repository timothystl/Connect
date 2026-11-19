// Mailing labels for a chosen set of people (People tab → Select → Print labels).
//
// Prints on Avery 5160-compatible sheets: US Letter, 3 columns x 10 rows of
// 2-5/8" x 1" labels, 1/2" top margin, 3/16" side margins, 1/8" column gap.
// People who share a household AND an address get one label ("John & Mary Smith").
// Deceased people and people with no usable street address are left off and listed
// on screen (never printed) so the office can fix the record.

export const LABELS_PER_SHEET = 30;
export const MAX_LABEL_IDS = 1000;

const ROLE_ORDER = { head: 0, spouse: 1, child: 2 };

const clean = s => String(s == null ? '' : s).trim();

function joinNames(list) {
  if (list.length <= 1) return list.join('');
  return list.slice(0, -1).join(', ') + ' & ' + list[list.length - 1];
}

// Address lines for a person: their own address, or the household's when theirs is blank.
function addressOf(p) {
  const own = { address1: clean(p.address1), address2: clean(p.address2), city: clean(p.city), state: clean(p.state), zip: clean(p.zip) };
  if (own.address1) return own;
  return { address1: clean(p.hh_address1), address2: clean(p.hh_address2), city: clean(p.hh_city), state: clean(p.hh_state), zip: clean(p.hh_zip) };
}

function fullName(p) {
  return [clean(p.first_name), clean(p.last_name)].filter(Boolean).join(' ');
}

// rows: people joined to their household's address (hh_* columns).
// Returns { labels: [{ name, lines: [] }], skipped: [{ name, reason }] }.
export function buildMailingLabels(rows) {
  const skipped = [];
  const groups = new Map();
  for (const p of rows || []) {
    const name = fullName(p) || '(unnamed)';
    if (p.deceased || p.status === 'deceased' || clean(p.death_date)) { skipped.push({ name, reason: 'deceased' }); continue; }
    const a = addressOf(p);
    if (!a.address1 || !(a.zip || a.city)) { skipped.push({ name, reason: 'no mailing address' }); continue; }
    const addrKey = [a.address1, a.address2, a.city, a.zip].join('|').toLowerCase().replace(/\s+/g, ' ');
    const key = (p.household_id ? 'h' + p.household_id : 'p' + p.id) + '|' + addrKey;
    if (!groups.has(key)) groups.set(key, { addr: a, people: [] });
    groups.get(key).people.push(p);
  }

  const labels = [];
  for (const g of groups.values()) {
    const people = g.people.slice().sort((x, y) =>
      ((ROLE_ORDER[x.family_role] ?? 3) - (ROLE_ORDER[y.family_role] ?? 3)) ||
      clean(x.first_name).localeCompare(clean(y.first_name)));
    const lasts = [...new Set(people.map(p => clean(p.last_name)))];
    let name;
    if (people.length === 1) name = fullName(people[0]);
    else if (lasts.length === 1 && lasts[0]) name = joinNames(people.map(p => clean(p.first_name)).filter(Boolean)) + ' ' + lasts[0];
    else name = joinNames(people.map(fullName));
    const a = g.addr;
    const cityLine = [a.city, [a.state, a.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    const lines = [a.address1, a.address2, cityLine].filter(Boolean);
    labels.push({ name, lines, sortKey: (clean(people[0].last_name) + ' ' + clean(people[0].first_name)).toLowerCase() });
  }
  labels.sort((x, y) => x.sortKey.localeCompare(y.sortKey));
  return { labels: labels.map(({ name, lines }) => ({ name, lines })), skipped };
}

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const MAX_COPIES = 10;

// copies: a number 1..MAX_COPIES (each person printed that many times), or 'fill' (repeat the
// list until the last sheet is full). Repeats run as whole passes through the list
// (A B C A B C), so each pass is one complete mailing.
export function expandLabelCopies(labels, copies, skip = 0) {
  if (!labels.length) return [];
  let total;
  if (copies === 'fill') {
    const used = skip + labels.length;
    total = Math.ceil(used / LABELS_PER_SHEET) * LABELS_PER_SHEET - skip;
  } else {
    const n = Math.max(1, Math.min(MAX_COPIES, parseInt(copies, 10) || 1));
    total = labels.length * n;
  }
  const out = [];
  for (let i = 0; i < total; i++) out.push(labels[i % labels.length]);
  return out;
}

export function renderMailingLabelsPage({ labels, skipped }, skip = 0, copies = 1) {
  skip = Math.max(0, Math.min(LABELS_PER_SHEET - 1, parseInt(skip, 10) || 0));
  if (copies !== 'fill') copies = Math.max(1, Math.min(MAX_COPIES, parseInt(copies, 10) || 1));
  const people = labels.length;
  labels = expandLabelCopies(labels, copies, skip);
  const cells = [];
  for (let i = 0; i < skip; i++) cells.push('<div class="lbl"></div>');
  for (const l of labels) {
    const small = l.name.length > 34 || l.lines.some(x => x.length > 38) ? ' small' : '';
    cells.push('<div class="lbl' + small + '"><div class="nm">' + esc(l.name) + '</div>'
      + l.lines.map(x => '<div>' + esc(x) + '</div>').join('') + '</div>');
  }
  const sheets = [];
  for (let i = 0; i < cells.length; i += LABELS_PER_SHEET) {
    sheets.push('<div class="sheet">' + cells.slice(i, i + LABELS_PER_SHEET).join('') + '</div>');
  }
  const pages = Math.max(1, sheets.length);
  const skipOpts = Array.from({ length: LABELS_PER_SHEET }, (_, i) =>
    '<option value="' + i + '"' + (i === skip ? ' selected' : '') + '>' + (i + 1) + '</option>').join('');
  const copyOpts = ['<option value="fill"' + (copies === 'fill' ? ' selected' : '') + '>Fill the sheet</option>']
    .concat(Array.from({ length: MAX_COPIES }, (_, i) =>
      '<option value="' + (i + 1) + '"' + (copies === i + 1 ? ' selected' : '') + '>' + (i + 1) + '</option>')).join('');
  const skippedHtml = skipped.length
    ? '<div class="note warn"><b>Not printed (' + skipped.length + '):</b> '
      + skipped.map(s => esc(s.name) + ' <span class="why">(' + esc(s.reason) + ')</span>').join(', ') + '</div>'
    : '';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mailing Labels</title>
<style>
*{box-sizing:border-box;}
@page{size:letter;margin:0;}
html,body{margin:0;padding:0;background:#e9e4dd;font-family:Arial,Helvetica,sans-serif;color:#000;}
.toolbar{max-width:8.5in;margin:16px auto;background:#f5f0ea;border-radius:8px;padding:12px 14px;font-size:13px;color:#333;}
.toolbar .row{display:flex;gap:12px;align-items:center;flex-wrap:wrap;}
.toolbar button{padding:7px 16px;background:#1E2D4A;color:#fff;border:none;border-radius:5px;font-size:13px;cursor:pointer;}
.toolbar select{padding:4px 6px;font-size:13px;}
.note{margin-top:8px;font-size:12px;line-height:1.45;color:#555;}
.note.warn{color:#7a3b00;}
.why{color:#999;}
.sheet{width:8.5in;height:11in;margin:0 auto 16px;background:#fff;padding:0.5in 0.1875in 0;
  display:grid;grid-template-columns:repeat(3,2.625in);column-gap:0.125in;grid-auto-rows:1in;overflow:hidden;
  box-shadow:0 1px 6px rgba(0,0,0,.15);}
.lbl{width:2.625in;height:1in;padding:0.1in 0.15in;overflow:hidden;font-size:10pt;line-height:1.2;
  display:flex;flex-direction:column;justify-content:center;outline:1px dashed #ddd;}
.lbl div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.lbl.small{font-size:8.5pt;}
.nm{font-weight:bold;}
@media print{
  html,body{background:#fff;}
  .toolbar{display:none;}
  .sheet{margin:0;box-shadow:none;break-after:page;page-break-after:always;}
  .sheet:last-child{break-after:auto;page-break-after:auto;}
  .lbl{outline:none;}
}
</style></head><body>
<div class="toolbar">
  <div class="row">
    <button onclick="window.print()">Print labels</button>
    <label>Start at label
      <select onchange="var u=new URL(location.href);u.searchParams.set('skip',this.value);location.href=u.toString();">${skipOpts}</select>
    </label>
    <label>Copies of each
      <select onchange="var u=new URL(location.href);u.searchParams.set('copies',this.value);location.href=u.toString();">${copyOpts}</select>
    </label>
    <span style="margin-left:auto;">${people} ${people === 1 ? 'address' : 'addresses'} &bull; ${labels.length} label${labels.length === 1 ? '' : 's'} &bull; ${pages} sheet${pages === 1 ? '' : 's'}</span>
  </div>
  <div class="note">For Avery 5160 (or any 30-per-sheet, 1&quot; x 2-5/8&quot; label). In the print dialog, set <b>Scale</b> to 100% (not &ldquo;Fit to page&rdquo;) and <b>Margins</b> to None. Print one plain-paper test sheet first and hold it up to a label sheet. Using a sheet that&rsquo;s partly used? Pick the first empty label under &ldquo;Start at label.&rdquo; Need extras? &ldquo;Copies of each&rdquo; repeats the whole list in order; &ldquo;Fill the sheet&rdquo; keeps repeating it until the last sheet is full.</div>
  ${skippedHtml}
</div>
${sheets.join('\n') || '<div class="sheet"></div>'}
</body></html>`;
}
