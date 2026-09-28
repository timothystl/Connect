import { describe, expect, it } from 'vitest';
import worker from '../apps/finance/shell.js';
import { buildTransactionsCsv } from '../apps/finance/gift-transactions-pages.js';

const ROW = {
  id: 55, gift_date: '2026-09-27', batch_id: 2202, batch_date: '2026-09-27', batch_description: 'Sunday', batch_closed: 1,
  person_id: 7, person_name: 'Walter Krause', envelope_number: '212', fund_id: 1, fund_name: 'General Fund', method: 'check',
  check_number: '2207', notes: 'In memory', amount: 10000, original_amount_cents: 0, refunded_cents: 0, voided_at: '', void_reason: '',
  processor: '', external_txn_id: '', fee_cents: 0, deposit_id: 21, change_count: 0,
};
const TRANSACTIONS = {
  contract: 'connect.giving-transactions.v1',
  filters: { from: '2026-01-01', to: '2026-09-30', funds: [], methods: [], q: '', status: 'all', sort: 'date_desc', offset: 0 },
  page: { offset: 0, limit: 200, returned: 2, total: 2 },
  totals: { gift_count: 2, total_cents: 10000, giver_count: 1, anonymous_count: 1, voided_count: 1, refunded_cents: 0 },
  by_fund: [{ fund_id: 1, fund_name: 'General Fund', gift_count: 2, total_cents: 10000 }],
  by_method: [{ method: 'check', gift_count: 1, total_cents: 10000 }, { method: 'cash', gift_count: 1, total_cents: 0 }],
  by_giver: [{ person_id: 7, person_name: 'Walter Krause', envelope_number: '212', gift_count: 1, total_cents: 10000, last_gift_date: '2026-09-27' }],
  by_month: [{ month: '2026-09', gift_count: 2, total_cents: 10000 }],
  rows: [ROW, { ...ROW, id: 56, person_id: null, person_name: '', envelope_number: '', method: 'cash', check_number: '', notes: '=HYPERLINK("x")', amount: 0, original_amount_cents: 1250, voided_at: '2026-09-28 10:00:00', void_reason: 'Recorded in error' }],
  funds: [{ id: 1, name: 'General Fund', active: 1 }, { id: 2, name: 'Missions', active: 1 }],
  methods: ['cash', 'check'],
  detail: null,
  givers: [],
};
const ONLINE = {
  contract: 'connect.giving-online.v1',
  totals: { month_cents: 80649, month_count: 4, year_cents: 2191100, year_count: 196, year_fee_cents: 61000, year_givers: 40 },
  payments: [{ id: 90, gift_date: '2026-09-27', batch_id: 2201, person_id: null, person_name: '', payer_name: 'John Hagan', fund_name: 'General Fund', method: 'card', processor: 'stax', amount: 28867, fee_cents: 867, refunded_cents: 0, voided_at: '' }],
  recurring: [{ id: 3, fund_id: 1, fund_name: 'General Fund', amount_cents: 5000, interval: 'monthly', status: 'active', has_stax_schedule: 1, payer_name: 'Walter Krause', person_id: 7, person_name: 'Walter Krause', created_at: '2026-06-01' }],
  unmatched: [{ queue_id: 4, payer_name: 'John Hagan', payer_email: 'jh@example.org', card_brand: 'visa', card_last4: '4242', entry_id: 90, amount: 28867, gift_date: '2026-09-27', fund_name: 'General Fund' }],
  connections: [{ person_id: 7, person_name: 'Walter Krause', envelope_number: '212', processor_accounts: 1, active_recurring: 1, methods: 'card', year_cents: 60000, last_online_gift: '2026-09-20' }],
  funds: [{ id: 1, name: 'General Fund' }],
};

function makeEnv({ detail = false } = {}) {
  const calls = [];
  const env = {
    ENVIRONMENT: 'staging', RELEASE_SHA: 't', FINANCE_DB: { prepare: (sql) => ({ sql }) }, FINANCE_CONTRACT_API_KEY: 'k',
    CONNECT_SERVICE: {
      async fetch(req) {
        const url = new URL(req.url);
        const body = req.method === 'POST' ? await req.json() : null;
        calls.push({ path: url.pathname, query: Object.fromEntries(url.searchParams), body });
        if (url.pathname.endsWith('/staff-role-v1')) return new Response(JSON.stringify({ role: 'finance', permissions: { finance: 'edit', giving: 'edit' } }));
        if (url.pathname.endsWith('/giving-transactions-v1')) {
          return new Response(JSON.stringify({ ...TRANSACTIONS, detail: detail ? { gift: ROW, history: [{ changed_at: '2026-09-28 09:00:00', changed_by: 'sarah@timothystl.org', action: 'corrected', field: 'amount', old_value: '1000', new_value: '10000', reason: 'Keyed wrong' }] } : null,
            givers: url.searchParams.get('giver_q') ? [{ id: 8, first_name: 'Anna', last_name: 'Schreiber', envelope_number: '' }] : [] }));
        }
        if (url.pathname.endsWith('/giving-online-v1')) return new Response(JSON.stringify(ONLINE));
        if (url.pathname.endsWith('/giving-batch-workspace-v1')) return new Response(JSON.stringify({ people: [{ id: 9, first_name: 'John', last_name: 'Hagan', envelope_number: '' }] }));
        if (url.pathname.endsWith('/giving-batch-write-v1')) return new Response(JSON.stringify({ ok: true, entry_id: 55, changed: body.op === 'correct_gift' ? 1 : undefined }));
        return new Response('{}', { status: 404 });
      },
    },
  };
  return { env, calls };
}
const get = (env, query) => worker.fetch(new Request(`https://finance.test/?section=giving${query}`, { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), env);
const post = (env, fields) => worker.fetch(new Request('https://finance.test/api/v1/gift-batch-write', {
  method: 'POST', headers: { 'Cf-Access-Jwt-Assertion': 'jwt', 'Sec-Fetch-Site': 'same-origin' }, body: new URLSearchParams(fields),
}), env);

describe('Gift Entry › Transactions and Online giving (Finance)', () => {
  it('lists gifts with Breeze-style totals and passes every ticked fund and method to Connect', async () => {
    const { env, calls } = makeEnv();
    const html = await (await get(env, '&page=transactions&from=2026-01-01&to=2026-09-30&fund=1&fund=2&method=check&q=212&min=5')).text();
    expect(calls.find((c) => c.path.endsWith('/giving-transactions-v1')).query).toMatchObject({ funds: '1,2', methods: 'check', q: '212', min: '5', from: '2026-01-01' });
    expect(html).toContain('<h1 class="page-title">Transactions</h1>');
    expect(html).toContain('Total givers');
    expect(html).toContain('Funds overview');
    expect(html).toContain('Method overview');
    expect(html).toContain('Walter Krause');
    expect(html).toContain('<span class="tx-badge is-void" title="Recorded in error">Voided</span>');
    expect(html).toContain('of $12.50');
    expect(html).toContain('Download CSV');
    expect(html).toContain('funds=1%2C2');
    expect(html).toContain('1 anonymous · 1 voided');
  });

  it('sorts by clicking a column heading and keeps the main filters on one row', async () => {
    const { env, calls } = makeEnv();
    let html = await (await get(env, '&page=transactions&from=2026-01-01&to=2026-09-30&q=212&offset=200')).text();
    // Newest first by default: Date is marked, and clicking it again reverses it from page one.
    expect(html).toContain('<th aria-sort="descending"><a class="tx-sort" href="/?section=giving&amp;page=transactions&amp;from=2026-01-01&amp;to=2026-09-30&amp;q=212&amp;sort=date_asc" title="Sort by date">Date ▼</a></th>');
    expect(html).toContain('sort=name_asc" title="Sort by name">Name</a>');
    expect(html).toContain('sort=amount_desc" title="Sort by amount">Amount</a>');
    for (const key of ['batch', 'envelope', 'fund', 'method', 'check']) expect(html).toContain(`sort=${key}_asc`);
    expect(html).not.toContain('name="sort"');
    expect(html).toContain('<details class="tx-more"><summary>More filters</summary>');
    html = await (await get(env, '&page=transactions&sort=name_asc&fund=2&min=5')).text();
    expect(calls.at(-1).query).toMatchObject({ sort: 'name_asc', funds: '2' });
    expect(html).toContain('<details class="tx-more" open><summary>More filters <span class="tx-more-count">2 in use</span></summary>');
    expect(html).toContain('<input type="hidden" name="sort" value="name_asc">');
    html = await (await get(env, '&page=transactions&view=givers&gsort=total_desc')).text();
    expect(html).toContain('gsort=total_asc');
    expect(html).toContain('gsort=name_asc');
  });

  it('opens one gift with its correction, giver, void forms and history', async () => {
    const { env } = makeEnv({ detail: true });
    const html = await (await get(env, '&page=transactions&entry_id=55&giver_q=schreiber')).text();
    expect(html).toContain('Gift #55');
    expect(html).toContain('Save correction');
    expect(html).toContain('Why is it being corrected?');
    expect(html).toContain('Anna');
    expect(html).toContain('Move here');
    expect(html).toContain('Returned check (NSF)');
    expect(html).toContain('Keyed wrong');
    expect(html).toContain('name="back" value="entry_id=55"');
  });

  it('relays a correction with blank fields and returns to the same gift and filters', async () => {
    const { env, calls } = makeEnv();
    const res = await post(env, { op: 'correct_gift', entry_id: '55', fund_id: '2', amount: '100.00', method: 'check', gift_date: '2026-09-27', check_number: '', notes: '', reason: 'Wrong fund', return: 'transactions', back: 'q=212&entry_id=55&evil=1' });
    expect(res.status).toBe(303);
    const loc = new URL(res.headers.get('Location'), 'https://finance.test');
    expect(Object.fromEntries(loc.searchParams)).toMatchObject({ section: 'giving', page: 'transactions', q: '212', entry_id: '55', status: 'ok' });
    expect(loc.searchParams.get('evil')).toBeNull();
    expect(calls.find((c) => c.body?.op === 'correct_gift').body).toEqual({ op: 'correct_gift', entry_id: '55', fund_id: '2', amount: '100.00', method: 'check', gift_date: '2026-09-27', check_number: '', notes: '', reason: 'Wrong fund' });
    await post(env, { op: 'correct_gift', entry_id: '55', person_id: 'anonymous', reason: 'Asked', return: 'transactions' });
    expect(calls.filter((c) => c.body?.op === 'correct_gift')[1].body.person_id).toBe('');
    await post(env, { op: 'void_gift', entry_id: '55', kind: 'refund', refund_amount: '25', reason: 'Overpaid', return: 'transactions' });
    expect(calls.find((c) => c.body?.op === 'void_gift').body).toMatchObject({ kind: 'refund', refund_amount: '25', reason: 'Overpaid' });
  });

  it('downloads the filtered gifts as CSV, all rows, formula-safe', async () => {
    const { env, calls } = makeEnv();
    const res = await get(env, '&page=transactions&format=csv&from=2026-01-01&to=2026-09-30&offset=200');
    expect(res.headers.get('Content-Type')).toContain('text/csv');
    expect(res.headers.get('Content-Disposition')).toContain('gifts-2026-01-01-to-2026-09-30.csv');
    const q = calls.find((c) => c.path.endsWith('/giving-transactions-v1')).query;
    expect(q.all).toBe('1');
    expect(q.offset).toBe('0');
    const csv = await res.text();
    expect(csv.split('\r\n')[0]).toBe('"Date","Batch","Name","Envelope","Fund","Method","Check #","Note","Amount","First recorded","Refunded","Voided","Void reason","Processor fee"');
    expect(csv).toContain('"2026-09-27","2202","Walter Krause","212","General Fund","Check","2207","In memory","100.00","100.00","0.00","","","0.00"');
    expect(buildTransactionsCsv(TRANSACTIONS)).toContain(`"'=HYPERLINK(""x"")"`);
  });

  it('shows online payments, recurring gifts, and matching online gifts to people', async () => {
    const { env, calls } = makeEnv();
    let html = await (await get(env, '&page=online')).text();
    expect(html).toContain('<h1 class="page-title">Online giving</h1>');
    expect(html).toContain('$288.67');
    expect(html).toContain('$8.67');
    expect(html).toContain('$280.00');
    expect(html).toContain('not matched');
    html = await (await get(env, '&page=online&view=recurring')).text();
    expect(html).toContain('Cancel this recurring gift');
    expect(html).toContain('value="update_recurring"');
    html = await (await get(env, '&page=online&view=associations&queue=4&q=hagan')).text();
    expect(calls.find((c) => c.path.endsWith('/giving-batch-workspace-v1')).query).toMatchObject({ q: 'hagan' });
    expect(html).toContain('This is them');
    expect(html).toContain('Who gives online');
    expect(html).toContain('visa ····4242');
    const res = await post(env, { op: 'link_online_gift', queue_id: '4', person_id: '9', return: 'online', back: 'view=associations' });
    expect(Object.fromEntries(new URL(res.headers.get('Location'), 'https://x').searchParams)).toMatchObject({ page: 'online', view: 'associations', status: 'ok' });
  });
});
