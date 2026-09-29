// Finance's copy of Connect's quote-aware CSV reader (src/api-utils.js), used by the pasted
// Commercial Property monthly import.
// Full-text CSV reader, quote-aware across the WHOLE input rather than splitting into lines
// first and parsing each line independently — splitting first corrupts a quoted field that
// itself contains a newline (or a bare \r/\n inside quotes) into extra bogus rows, since the
// split never sees the surrounding quotes. Returns an array of cell-string-array rows; a row
// consisting of a single empty cell (a genuinely blank source line) is dropped, matching what a
// naive line-split + filter(Boolean) already did for every existing caller.
export function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;
  const s = String(text || '');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ',') { row.push(cur); cur = ''; continue; }
    if (ch === '\r') { if (s[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; continue; }
    if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; continue; }
    cur += ch;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => !(r.length === 1 && r[0].trim() === ''));
}
