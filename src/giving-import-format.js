// Shared import boundary: reject ambiguous money, dates and splits before any writes.
export function cents(value) {
  const s = String(value ?? '').replace(/[$,\s]/g, '');
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(s)) throw new Error('Invalid amount. Use dollars and at most two decimal places.');
  const n = Math.round(Number(s) * 100);
  if (!Number.isSafeInteger(n) || n < 0) throw new Error('Negative or invalid gifts need a reviewed correction.');
  return n;
}
export function day(value) {
  let s = String(value || '').slice(0, 10);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) s = `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isFinite(Date.parse(s)) || new Date(s).toISOString().slice(0, 10) !== s) throw new Error('Invalid contribution date.');
  return s;
}
export function method(value) {
  const s = String(value || '').toLowerCase();
  if (s === 'cash') return 'cash';
  if (s.includes('check')) return 'check';
  if (/ach|bank|eft|electronic/.test(s)) return 'ach';
  if (/card|credit|online|egiving/.test(s)) return 'card';
  return ['stock', 'other'].includes(s) ? s : 'other';
}
export function normalizeGift(r) {
  const id = String(r.id ?? '').trim();
  if (!/^\d+$/.test(id)) throw new Error('A numeric Breeze payment ID is required.');
  const total = cents(r.amount);
  const raw = Array.isArray(r.funds) ? r.funds : r.fund && typeof r.fund === 'object' ? [r.fund] : r.fund_id ? [{ fund_id: r.fund_id, name: r.fund_name }] : [];
  if (!raw.length || raw.length > 40) throw new Error(`Payment ${id}: missing or excessive fund allocations.`);
  const funds = raw.map(f => ({ ref: String(f.fund_id ?? f.id ?? '').trim(), name: String(f.name || f.fund_name || '').trim().slice(0, 120), cents: raw.length === 1 && (f.amount == null || f.amount === '') ? total : cents(f.amount) }));
  if (funds.some(f => !/^\d+$/.test(f.ref)) || new Set(funds.map(f => f.ref)).size !== funds.length || funds.reduce((s, f) => s + f.cents, 0) !== total) throw new Error(`Payment ${id}: fund allocations must be unique and sum exactly to the gift.`);
  return { id, personRef: String(r.person_id || '').trim(), date: day(r.paid_on || r.date), cents: total, feeCents: r.fee == null || r.fee === '' ? null : cents(r.fee), funds, method: method(r.method), check: String(r.check_number || '').slice(0, 40), note: String(r.note || '').slice(0, 300), batch: String(r.num || r.batch || '').slice(0, 80) };
}
export function parseCsv(text) {
  const delimiter = text.slice(0, text.indexOf('\n') < 0 ? text.length : text.indexOf('\n')).includes('\t') ? '\t' : ',';
  const rows = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && c === delimiter) { row.push(field.trim()); field = ''; }
    else if (!quoted && (c === '\n' || c === '\r')) { if (c === '\r' && text[i + 1] === '\n') i++; row.push(field.trim()); if (row.some(Boolean)) rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (quoted) throw new Error('Unclosed quoted CSV field.');
  row.push(field.trim()); if (row.some(Boolean)) rows.push(row);
  return rows;
}
export function giftsFromCsv(text) {
  if (new TextEncoder().encode(text).length > 1000000) throw new Error('Upload at most 1 MB at a time.');
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  const header = rows.shift()?.map(s => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim()) || [];
  const col = (...names) => names.map(n => header.indexOf(n)).find(i => i >= 0) ?? -1;
  const idx = { id: col('payment id'), date: col('date'), amount: col('amount'), funds: col('fund s', 'fund', 'funds'), person: col('person id'), method: col('method', 'method id'), batch: col('batch number', 'batch'), check: col('check number'), note: col('note', 'notes') };
  if (['id', 'date', 'amount', 'funds'].some(k => idx[k] < 0)) throw new Error('Expected Payment ID, Date, Amount and Fund(s) columns.');
  const gifts = new Map();
  for (const [i, row] of rows.entries()) {
    try {
      if (row.length !== header.length) throw new Error('Column count does not match the header.');
      const amount = row[idx.amount];
      const funds = row[idx.funds].split(/,\s*(?=\d+\s)/).map(s => {
        const m = s.match(/^(\d+)\s+(.+?)(?:\s+\(([\d,.]+)\))?$/);
        if (!m) throw new Error('Each fund needs its Breeze number and name.');
        return { fund_id: m[1], name: m[2], amount: m[3] };
      });
      const gift = normalizeGift({ id: row[idx.id], date: row[idx.date], amount, funds, person_id: (row[idx.person] || '').replace(/\.0$/, ''), method: row[idx.method], num: row[idx.batch], check_number: row[idx.check], note: row[idx.note] });
      const old = gifts.get(gift.id);
      if (old) {
        if (old.date !== gift.date || old.personRef !== gift.personRef || old.method !== gift.method || old.batch !== gift.batch || gift.funds.some(f => old.funds.some(o => o.ref === f.ref))) throw new Error('Conflicting or repeated payment/fund row.');
        old.funds.push(...gift.funds); old.cents += gift.cents;
      } else gifts.set(gift.id, gift);
    } catch (e) { throw new Error(`CSV row ${i + 2}: ${e.message}`); }
  }
  if (!gifts.size || gifts.size > 5000) throw new Error('Choose a file containing 1 to 5,000 payments.');
  return [...gifts.values()];
}
