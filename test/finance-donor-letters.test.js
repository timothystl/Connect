import { describe, expect, it } from 'vitest';
import worker from '../apps/finance/shell.js';
import { roleCanAccessSection } from '../apps/finance/connect-role-client.js';
import { FINANCE_PARITY_SECTIONS } from '../apps/finance/parity-manifest.js';
import { renderReceiptLetter, renderStatementLetter } from '../apps/finance/donor-letters.js';
import { DEFAULT_YEAR_END_TEMPLATE } from '../src/giving-letter-templates.js';

// Finance › Donor letters: rendered and run by Finance, delivered through Connect's
// giving-letters contracts. Fictional givers only.
const CONFIG = {
  church_name: 'Sample Church', from_name: 'Sample Church', from_email: 'office@example.test', church_ein: '00-0000000',
  logo_url: '', online_giving_url: 'https://give.example.test', templates: { year_end: DEFAULT_YEAR_END_TEMPLATE, midyear: DEFAULT_YEAR_END_TEMPLATE },
};
const RECIPIENTS = [
  { recipient_key: 'h1', kind: 'household', id: 1, name: 'Sample Household', recipient_name: 'Ada Sample', recipient_person_id: 1, email: 'ada@example.test', has_email: true, sent: false, total_cents: 150000 },
  { recipient_key: 'p3', kind: 'person', id: 3, person_id: 3, name: 'Cara Example', email: 'cara@example.test', has_email: true, sent: true, total_cents: 30000 },
  { recipient_key: 'p4', kind: 'person', id: 4, person_id: 4, name: 'Dana Example', email: '', has_email: false, sent: false, total_cents: 10000 },
];
const STATEMENTS = {
  h1: { key: 'h1', kind: 'household', id: 1, mode: 'household', year: 2026, through: '2026-12-31', household: { id: 1, name: 'Sample Household' }, total_cents: 150000,
    entries: [{ gift_date: '2026-03-01', first_name: 'Ada', last_name: 'Sample', fund_name: '40085 General Fund', amount: 100000 }, { gift_date: '2026-07-15', first_name: 'Ben', last_name: 'Sample', fund_name: '40085 General Fund', amount: 50000 }] },
  p3: { key: 'p3', kind: 'person', id: 3, mode: 'person', year: 2026, through: '2026-12-31', person: { id: 3, first_name: 'Cara', last_name: 'Example', email: 'cara@example.test' }, total_cents: 30000,
    entries: [{ gift_date: '2026-02-01', fund_name: '40085 General Fund', amount: 30000, method: 'check' }] },
  p4: { key: 'p4', kind: 'person', id: 4, mode: 'person', year: 2026, through: '2026-12-31', person: { id: 4, first_name: 'Dana', last_name: 'Example', email: '' }, total_cents: 10000, entries: [] },
};

function env({ role = 'finance', permissions = { finance: 'edit', giving: 'edit' }, sendAnswer } = {}) {
  const calls = [];
  return { ENVIRONMENT: 'production', FINANCE_CONTRACT_API_KEY: 'key', RELEASE_SHA: 'test', calls,
    FINANCE_DB: { prepare: (sql) => ({ sql, bind() { return this; }, async first() { return null; }, async all() { return { results: [] }; }, async run() { return {}; } }) },
    CONNECT_SERVICE: { async fetch(req) {
      const u = new URL(req.url);
      if (u.pathname.endsWith('staff-role-v1')) return Response.json({ role, permissions, username: 'tester' });
      const call = { path: u.pathname.split('/').pop(), query: Object.fromEntries(u.searchParams), body: req.method === 'POST' ? await req.json() : null };
      calls.push(call);
      if (call.path === 'giving-letters-send-v1') return Response.json(sendAnswer ? sendAnswer(call.body.letters) : { ok: true, sent: call.body.letters.map((l) => l.recipient_key), failed: [], stopped: false });
      if (call.path === 'giving-letters-mark-v1') return Response.json({ ok: true, marked: call.body.marks.length, unmarked: !!call.body.unmark });
      if (call.path === 'giving-reports-v1') return Response.json({ report: 'funds', funds: [{ id: 4, name: '40085 General Fund' }] });
      const op = u.searchParams.get('op');
      if (op === 'config') return Response.json({ op, ...CONFIG });
      if (op === 'status') return Response.json({ op, recipients: RECIPIENTS, counts: { total: 3, sent: 1, unsent: 2, no_email: 1 } });
      if (op === 'statements') return Response.json({ op, statements: u.searchParams.get('keys').split(',').map((k) => STATEMENTS[k]).filter(Boolean) });
      if (op === 'receipts') return Response.json({ op, receipts: [{ recipient_key: 'ge7:2026-09-01', person_id: 3, name: 'Cara Example', email: 'cara@example.test', has_email: true, sent: false, gift_date: '2026-09-01', amount_cents: 50000, suggested_monthly_cents: 4200, funds: '40085 General Fund', reasons: ['first_gift'] }] });
      return Response.json({ error: 'Unknown' }, { status: 404 });
    } } };
}
const call = (e, path, init = {}) => worker.fetch(new Request(`https://finance.test${path}`, { ...init, headers: { 'Cf-Access-Jwt-Assertion': 'jwt', ...(init.headers || {}) } }), e);
const page = async (e, p, q = '') => (await call(e, `/?section=giving-letters&page=${p}${q}`)).text();
function post(e, fields) {
  const body = new URLSearchParams();
  for (const [k, v] of fields) body.append(k, v);
  return call(e, '/api/v1/giving-letters', { method: 'POST', body, headers: { 'Sec-Fetch-Site': 'same-origin', 'Content-Type': 'application/x-www-form-urlencoded' } });
}
const location = (res) => new URL(res.headers.get('Location'), 'https://finance.test').searchParams;

describe('Finance › Donor letters', () => {
  it('is four pages under Giving, closed to council', async () => {
    const section = FINANCE_PARITY_SECTIONS.find((s) => s.id === 'giving-letters');
    expect(section.group).toBe('Giving');
    expect(section.pages.map((p) => p.id)).toEqual(['letters', 'receipts', 'nudge-letters', 'statement']);
    expect(roleCanAccessSection('staff', section, { giving: 'none', finance: 'edit' })).toBe(false);
    const e = env({ role: 'council', permissions: { giving: 'anon', finance: 'view' } });
    const html = await page(e, 'letters', '&year=2026');
    expect(html).not.toContain('Sample Household');
    expect(e.calls.filter((c) => c.path.startsWith('giving-letters'))).toEqual([]);
  });

  it('lists recipients with pending letters checked and the email batch button', async () => {
    const e = env();
    const html = await page(e, 'letters', '&year=2026&type=year_end');
    expect(e.calls[0]).toMatchObject({ path: 'giving-letters-v1', query: { op: 'status', year: '2026', letter_type: 'year_end', channel: 'email' } });
    expect(html).toContain('Sample Household');
    expect(html).toMatch(/name="key" value="h1" checked/);
    expect(html).not.toMatch(/name="key" value="p3" checked/);
    expect(html).not.toContain('value="p4"');
    expect(html).toContain('Email the checked letters');
  });

  it('lets Giving view read but not send', async () => {
    const html = await page(env({ role: 'staff', permissions: { giving: 'view', finance: 'view' } }), 'letters', '&year=2026');
    expect(html).toContain('Sample Household');
    expect(html).not.toContain('Email the checked letters');
    const res = await post(env({ role: 'staff', permissions: { giving: 'view', finance: 'view' } }), [['kind', 'letters'], ['year', '2026'], ['action', 'email'], ['key', 'h1']]);
    expect(location(res).get('message')).toMatch(/Giving edit/);
  });

  it('emails a batch of rendered letters, skipping sent ones and those without an address', async () => {
    const e = env();
    const res = await post(e, [['kind', 'letters'], ['type', 'year_end'], ['year', '2026'], ['channel', 'email'], ['action', 'email'], ['key', 'h1'], ['key', 'p3'], ['key', 'p4']]);
    expect(res.status).toBe(303);
    const sent = e.calls.find((c) => c.path === 'giving-letters-send-v1').body.letters;
    expect(sent.map((l) => l.recipient_key)).toEqual(['h1']);
    expect(sent[0]).toMatchObject({ to_email: 'ada@example.test', year: 2026, letter_type: 'year_end', household_id: 1, person_id: 1, subject: '2026 Charitable Contribution Statement — Sample Church' });
    expect(sent[0].html).toContain('$1,500.00');
    expect(sent[0].html).toContain('00-0000000');
    expect(location(res).get('status')).toBe('ok');
    expect(location(res).get('msg')).toContain('Emailed 1 letter');
  });

  it('reports Brevo’s daily limit and leaves the rest pending', async () => {
    const e = env({ sendAnswer: () => ({ ok: true, sent: [], failed: [], stopped: true }) });
    const res = await post(e, [['kind', 'letters'], ['year', '2026'], ['action', 'email'], ['key', 'h1']]);
    expect(location(res).get('status')).toBe('error');
    expect(location(res).get('message')).toMatch(/daily sending limit/);
  });

  it('refuses a cross-site post before asking Connect', async () => {
    const e = env();
    const body = new URLSearchParams({ kind: 'letters', action: 'email', key: 'h1' });
    const res = await call(e, '/api/v1/giving-letters', { method: 'POST', body, headers: { 'Sec-Fetch-Site': 'cross-site', 'Content-Type': 'application/x-www-form-urlencoded' } });
    expect(location(res).get('status')).toBe('error');
    expect(e.calls).toEqual([]);
  });

  it('prints a sheet of letters that marks them printed, whatever channel the list showed', async () => {
    const e = env();
    const res = await call(e, '/giving-letters/print?kind=letters&type=year_end&year=2026&channel=email&key=h1&key=p3');
    const html = await res.text();
    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'none'");
    expect(html).toContain('2 letters ready to print');
    expect(html).toContain('Sample Household');
    expect(html).toContain('Mark these 2 as printed');
    expect(html.match(/name="channel" value="([^"]+)"/g)).toEqual(['name="channel" value="print"']);
    const council = await call(env({ role: 'council', permissions: { giving: 'anon' } }), '/giving-letters/print?kind=letters&year=2026&key=h1');
    expect(council.status).toBe(403);
  });

  it('marks and undoes letters through Connect’s ledger', async () => {
    const e = env();
    const res = await post(e, [['kind', 'letters'], ['type', 'year_end'], ['year', '2026'], ['channel', 'print'], ['action', 'mark'], ['key', 'h1'], ['key', 'p3']]);
    const marks = e.calls.find((c) => c.path === 'giving-letters-mark-v1').body;
    expect(marks.unmark).toBe(false);
    expect(marks.marks).toEqual([
      { recipient_key: 'h1', year: 2026, letter_type: 'year_end', channel: 'print', person_id: 1, household_id: 1 },
      { recipient_key: 'p3', year: 2026, letter_type: 'year_end', channel: 'print', person_id: 3, household_id: null },
    ]);
    expect(location(res).get('msg')).toBe('2 letters marked printed.');
    expect(location(res).get('page')).toBe('letters');
  });

  it('sends thank-you receipts from the receipts queue', async () => {
    const e = env();
    const html = await page(e, 'receipts', '&from=2026-09-01&to=2026-09-30');
    expect(html).toContain('Cara Example');
    await post(e, [['kind', 'receipts'], ['from', '2026-09-01'], ['to', '2026-09-30'], ['action', 'email'], ['key', 'ge7:2026-09-01']]);
    const [letter] = e.calls.find((c) => c.path === 'giving-letters-send-v1').body.letters;
    expect(letter).toMatchObject({ recipient_key: 'ge7:2026-09-01', letter_type: 'thank_you', year: 2026, person_id: 3 });
    expect(letter.html).toContain('first gift');
  });

  it('shows one statement with its letter and CSV', async () => {
    const e = env();
    const html = await page(e, 'statement', '&key=p3&year=2026');
    expect(html).toContain('Cara Example, 2026');
    expect(html).toContain('Email to cara@example.test');
    const csv = await call(e, '/api/v1/giving-statement.csv?key=p3&year=2026');
    expect(csv.headers.get('Content-Disposition')).toContain('giving-statement-Example-2026.csv');
    const text = await csv.text();
    expect(text.split('\r\n')[0]).toBe('Date,Fund,Amount,Method');
    expect(text).toContain('300.00');
  });

  it('renders the IRS acknowledgement only when the EIN is known', () => {
    expect(renderStatementLetter(STATEMENTS.p3, 'year_end', CONFIG, '2026-12-31')).toContain('Our EIN/Tax ID is 00-0000000');
    expect(renderStatementLetter(STATEMENTS.p3, 'year_end', { ...CONFIG, church_ein: '' }, '2026-12-31')).not.toContain('EIN/Tax ID');
    expect(renderReceiptLetter({ name: '<b>x</b>', amount_cents: 100, gift_date: '2026-01-01', reasons: [] }, CONFIG)).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});
