import { describe, expect, it } from 'vitest';
import worker from '../apps/finance/shell.js';

// Finance › Gift Entry › Reconciliation to bank: the deposit tools, relayed to Connect.
// Fictional givers only.
const LEDGER = {
  contract: 'connect.giving-batch-ledger.v1',
  batches: [
    { id: 1040, batch_date: '2026-09-24', description: 'Midweek gifts', closed: 1, entry_count: 4, total_cents: 134000, linked_cents: 34000, deposit_status: { key: 'split', label: 'Split', remaining_cents: 100000 } },
  ],
  deposits: [
    { id: 22, deposit_date: '2026-09-25', external_ref: 'Payout 9/25', bank_cents: null, status: 'open', line_cents: 0, batch_count: 0, gift_count: 2, gift_cents: 20000, fee_cents: 640, given_cents: 20000 },
    { id: 21, deposit_date: '2026-09-21', external_ref: '', bank_cents: null, status: 'open', line_cents: 34000, batch_count: 1, gift_count: 0, gift_cents: 0, fee_cents: 0, given_cents: 34000 },
  ],
  lines: [{ deposit_id: 21, batch_id: 1040, amount_cents: 34000 }],
  summary: { open_batches: { count: 1, cents: 26425 }, awaiting_deposit: { count: 1, cents: 100000, days: 90 }, unreconciled_deposits: { count: 2, earliest_date: '2026-09-21' }, fees_ytd: { cents: 12345 } },
};
const DETAIL = {
  deposit: { id: 22, deposit_date: '2026-09-25', source: 'online', external_ref: 'Payout 9/25', notes: '', bank_cents: 19000, status: 'open', given_cents: 20000, line_cents: 0, gift_count: 2, batch_count: 0 },
  lines: [],
  gifts: [
    { id: 501, amount: 15000, fee_cents: 480, method: 'online', gift_date: '2026-09-23', fund_name: 'General Fund', person_name: 'Ada Sample' },
    { id: 502, amount: 5000, fee_cents: 160, method: 'online', gift_date: '2026-09-24', fund_name: 'Missions', person_name: 'Cara Example' },
  ],
  totals: { count: 2, gross_cents: 20000, fee_cents: 640, net_cents: 19360 },
  bank_gap_cents: 1000,
  batches_to_add: [{ id: 1040, batch_date: '2026-09-24', description: 'Midweek gifts', total_cents: 134000, linked_cents: 34000 }],
  unassigned: [{ id: 503, amount: 2500, fee_cents: 80, method: 'online', gift_date: '2026-09-26', fund_name: 'General Fund', person_name: 'Dana Example' }],
  unassigned_from: '2026-07-28', unassigned_to: '2026-09-26',
};

function makeEnv({ answer } = {}) {
  const calls = [];
  const env = {
    ENVIRONMENT: 'staging', RELEASE_SHA: 't', FINANCE_DB: { prepare: (sql) => ({ sql }) }, FINANCE_CONTRACT_API_KEY: 'k',
    CONNECT_SERVICE: {
      async fetch(req) {
        const url = new URL(req.url);
        const body = req.method === 'POST' ? await req.json() : null;
        calls.push({ path: url.pathname.split('/').pop(), query: Object.fromEntries(url.searchParams), body });
        if (url.pathname.endsWith('/staff-role-v1')) return Response.json({ role: 'finance', permissions: { finance: 'edit', giving: 'edit' } });
        if (url.pathname.endsWith('/giving-batch-ledger-v1')) return Response.json(LEDGER);
        if (url.pathname.endsWith('/giving-deposit-v1')) return Response.json(DETAIL);
        if (url.pathname.endsWith('/giving-batch-write-v1')) {
          const out = answer ? answer(body) : { ok: true, deposit_id: body.deposit_id ? Number(body.deposit_id) : 23 };
          return Response.json(out, { status: out.error ? 409 : 200 });
        }
        return new Response('{}', { status: 404 });
      },
    },
  };
  return { env, calls };
}
const get = (env, query) => worker.fetch(new Request(`https://finance.test/?section=giving&page=reconciliation${query}`, { headers: { 'Cf-Access-Jwt-Assertion': 'jwt' } }), env);
function post(env, fields) {
  const body = new URLSearchParams();
  for (const [k, v] of fields) body.append(k, v);
  return worker.fetch(new Request('https://finance.test/api/v1/gift-batch-write', { method: 'POST', headers: { 'Cf-Access-Jwt-Assertion': 'jwt', 'Sec-Fetch-Site': 'same-origin' }, body }), env);
}
const location = (res) => new URL(res.headers.get('Location'), 'https://finance.test').searchParams;

describe('Finance › Reconciliation to bank: deposit tools', () => {
  it('shows the work queue and offers a split batch to a new or open deposit', async () => {
    const html = await (await get(makeEnv().env, '')).text();
    expect(html).toContain('Awaiting deposit');
    expect(html).toContain('$123.45'); // fees this year
    expect(html).toContain('Oldest Sep 21');
    expect(html).toContain('$1,000.00 not yet deposited');
    expect(html).toContain('name="amount" inputmode="decimal" value="1000.00"');
    expect(html).toContain('<option value="22">Add to Sep 25 deposit');
    expect(html).toContain('2 gifts');
    expect(html).toContain('$6.40'); // processor fees on the online deposit
    expect(html).toContain('value="193.60"'); // bank amount suggested net of fees
    expect(html).toContain('href="/?section=giving&amp;page=reconciliation&amp;deposit_id=22"');
  });

  it('opens one deposit with its gifts, fees, what could be added, and its tools', async () => {
    const { env, calls } = makeEnv();
    const html = await (await get(env, '&deposit_id=22&from=2026-08-01')).text();
    expect(calls.find((c) => c.path === 'giving-deposit-v1').query).toEqual({ id: '22', from: '2026-08-01' });
    expect(html).toContain('Deposit of Friday, Sep 25');
    expect(html).toContain('Given − bank = $10.00 in fees; $3.60 more than reported');
    expect(html).toContain('Ada Sample');
    expect(html).toContain('Dana Example');
    expect(html).toContain('value="assign_gifts"');
    expect(html).toContain('value="unassign_gifts"');
    expect(html).toContain('Midweek gifts · $1,000.00 left');
    expect(html).toContain('Delete this deposit');
  });

  it('relays split, add-to-deposit, gift and deposit changes, returning to the deposit', async () => {
    const { env, calls } = makeEnv();
    const writes = () => calls.filter((c) => c.path === 'giving-batch-write-v1').map((c) => c.body);
    let res = await post(env, [['op', 'deposit_batch'], ['batch_id', '1040'], ['deposit_date', '2026-09-28'], ['source', 'mixed'], ['amount', '400.00']]);
    expect(writes().at(-1)).toEqual({ op: 'deposit_batch', batch_id: '1040', deposit_date: '2026-09-28', source: 'mixed', amount: '400.00' });
    res = await post(env, [['op', 'deposit_batch'], ['batch_id', '1040'], ['deposit_id', '22'], ['deposit_date', '2026-09-28'], ['amount', '600']]);
    expect(writes().at(-1)).toMatchObject({ op: 'set_deposit_line', batch_id: '1040', deposit_id: '22', amount: '600' });
    expect(location(res).get('deposit_id')).toBe('22');
    res = await post(env, [['op', 'assign_gifts'], ['deposit_id', '22'], ['gift', '503'], ['gift', 'x'], ['gift', '504']]);
    expect(writes().at(-1)).toEqual({ op: 'assign_gifts', deposit_id: '22', entry_ids: ['503', '504'] });
    expect(location(res).get('msg')).toBe('Gifts added to this deposit.');
    res = await post(env, [['op', 'create_deposit'], ['deposit_date', '2026-09-28'], ['source', 'online']]);
    expect(location(res).get('deposit_id')).toBe('23');
    res = await post(env, [['op', 'update_deposit'], ['deposit_id', '22'], ['deposit_date', '2026-09-25'], ['notes', '']]);
    expect(writes().at(-1)).toMatchObject({ op: 'update_deposit', notes: '' });
    res = await post(env, [['op', 'reconcile_deposit'], ['deposit_id', '22'], ['bank_amount', '190.00'], ['stay', '1']]);
    expect(location(res).get('deposit_id')).toBe('22');
  });

  it('returns to the list after a deposit is deleted, and shows Connect’s refusal', async () => {
    const { env } = makeEnv({ answer: (b) => (b.op === 'delete_deposit' ? { ok: true, deposit_deleted: true } : { error: 'That deposit is matched to the bank. Reopen it to change what it holds.' }) });
    let res = await post(env, [['op', 'delete_deposit'], ['deposit_id', '22']]);
    expect(location(res).get('deposit_id')).toBeNull();
    expect(location(res).get('status')).toBe('ok');
    res = await post(env, [['op', 'remove_deposit_line'], ['deposit_id', '22'], ['batch_id', '1040']]);
    expect(location(res).get('status')).toBe('error');
    expect(location(res).get('deposit_id')).toBe('22');
  });
});
