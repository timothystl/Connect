// Donor letters: the form post (email a batch, mark or undo), the print sheet, and a statement's
// CSV. Every request checks the caller's live Connect role here, and Connect checks it again.
import { fetchVerifiedRole } from './connect-role-client.js';
import { isSameOriginPost } from './form-post.js';
import { csvText, csvNum } from './payroll-report-render.js';
import {
  EMAIL_BATCH, PRINT_LIMIT, LETTER_KINDS, buildLetters, fetchGivingLetters, lettersParams, postGivingLettersMark, postGivingLettersSend, postGivingLettersSettings,
} from './donor-letters-service.js';
import { PAGE_OF_KIND, renderPrintSheet } from './donor-letters-pages.js';
import { fmtDate, letterSubject, renderStatementLetter } from './donor-letters.js';

const isoToday = () => new Date().toISOString().slice(0, 10);
const KEY = /^(p|h)\d{1,12}$|^ge\d{1,12}:\d{4}-\d{2}-\d{2}$/;

export function canSendLetters(roleResult, councilPreview = false) {
  if (councilPreview || !roleResult?.ok) return false;
  return roleResult.role === 'admin' || roleResult.permissions?.giving === 'edit';
}
export function canReadLetters(roleResult) {
  if (!roleResult?.ok) return false;
  return roleResult.role === 'admin' || ['view', 'edit'].includes(roleResult.permissions?.giving);
}

function describe(result) {
  if (result?.message) return String(result.message);
  const byReason = { not_configured: 'Finance is not connected to Connect', no_access_identity: 'no Access sign-in', network_error: 'Connect did not answer', invalid_json: 'Connect sent an unreadable answer' };
  return byReason[result?.reason] || 'the request did not complete';
}

function keepParams(kind, p) {
  if (kind === 'receipts') return { from: p.from, to: p.to, threshold: String(p.threshold), first_gift: p.firstGift ? '1' : '0', channel: p.channel };
  if (kind === 'nudges') return { year: String(p.year), scope: p.nudgeScope, option: p.option, channel: p.channel, ...(p.fund ? { fund_id: p.fund } : {}) };
  return { type: p.type, year: String(p.year), channel: p.channel, ...(p.scope ? { scope: p.scope } : {}), ...(p.through ? { through: p.through } : {}) };
}

function redirect(page, params) {
  const search = new URLSearchParams({ section: 'giving-letters', page, ...params });
  return new Response(null, { status: 303, headers: { Location: `/?${search.toString()}` } });
}

// The one statement page's letter: build it from the statement itself.
async function buildSingle(env, jwt, p, key) {
  const [statement, config] = await Promise.all([
    fetchGivingLetters(env, jwt, 'statements', { year: p.year, keys: key, through: p.through }),
    fetchGivingLetters(env, jwt, 'config'),
  ]);
  if (!statement.ok) return { error: statement };
  if (!config.ok) return { error: config };
  const s = statement.result.statements?.[0];
  if (!s) return { letters: [] };
  const email = s.kind === 'person' ? s.person?.email || '' : '';
  return { letters: [{
    recipient_key: key, to_email: email, to_name: s.kind === 'person' ? `${s.person.first_name || ''} ${s.person.last_name || ''}`.trim() : s.household?.name,
    person_id: s.kind === 'person' ? s.id : 0, household_id: s.kind === 'household' ? s.id : null, year: p.year, letter_type: p.type,
    subject: letterSubject(p.type, p.year, config.result.church_name), html: renderStatementLetter(s, p.type, config.result, p.today),
  }] };
}

export async function handleDonorLettersWrite(request, env, url) {
  let form = null;
  try { form = await request.formData(); } catch { /* reported below */ }
  const get = (k) => String(form?.get(k) || '');
  const kind = ['letters', 'receipts', 'nudges', 'single'].includes(get('kind')) ? get('kind') : 'letters';
  const p = lettersParams(get, isoToday());
  const page = kind === 'single' ? 'statement' : PAGE_OF_KIND[kind];
  const keep = kind === 'single' ? { key: get('key'), year: String(p.year), type: p.type, ...(p.through ? { through: p.through } : {}) } : keepParams(kind, p);
  const back = (status, message) => redirect(page, { ...keep, status, [status === 'ok' ? 'msg' : 'message']: String(message).slice(0, 300) });
  if (!isSameOriginPost(request, url)) return back('error', 'That form did not come from Timothy Finance.');
  if (!form) return back('error', 'The form could not be read.');
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion') || '';
  if (!canSendLetters(await fetchVerifiedRole(env, jwt))) return back('error', 'Sending or marking letters needs Giving edit access.');
  const keys = [...new Set(form.getAll('key').map(String).filter((k) => KEY.test(k)))];
  const action = get('action');
  if (!keys.length) return back('error', 'Check at least one letter first.');
  if (action === 'mark' || action === 'unmark') {
    if (kind === 'single') return back('error', 'Nothing to mark here.');
    const built = await buildLetters(env, jwt, kind, p, keys, { render: false });
    if (built.error) return back('error', describe(built.error));
    const marks = built.letters.map((l) => ({ recipient_key: l.recipient_key, year: l.year, letter_type: l.letter_type, channel: p.channel, person_id: l.person_id, household_id: l.household_id }));
    const res = await postGivingLettersMark(env, jwt, marks, action === 'unmark');
    if (!res.ok) return back('error', describe(res));
    const n = res.result.marked;
    return back('ok', action === 'unmark' ? `${n} letter${n === 1 ? '' : 's'} set back to pending.` : `${n} letter${n === 1 ? '' : 's'} marked ${p.channel === 'print' ? 'printed' : 'sent'}.`);
  }
  if (action !== 'email') return back('error', 'Choose what to do with the checked letters.');
  const built = kind === 'single' ? await buildSingle(env, jwt, p, keys[0]) : await buildLetters(env, jwt, kind, p, keys.slice(0, EMAIL_BATCH * 3));
  if (built.error) return back('error', describe(built.error));
  const sendable = built.letters.filter((l) => l.to_email && (kind === 'single' || !l.sent)).slice(0, EMAIL_BATCH);
  if (!sendable.length) return back('error', 'None of the checked letters can be emailed (already sent, or no email address).');
  const res = await postGivingLettersSend(env, jwt, sendable.map(({ recipient_key, to_email, to_name, subject, html, year, letter_type, person_id, household_id }) => ({ recipient_key, to_email, to_name, subject, html, year, letter_type, person_id, household_id })));
  if (!res.ok) return back('error', describe(res));
  const { sent = [], failed = [], stopped } = res.result;
  const leftChecked = keys.length - sent.length;
  let msg = `Emailed ${sent.length} letter${sent.length === 1 ? '' : 's'}.`;
  if (failed.length) msg += ` ${failed.length} not sent: ${failed.slice(0, 3).map((f) => f.error).join('; ')}`;
  if (stopped) msg += ' Brevo’s daily sending limit was reached; the rest stay pending. Send again tomorrow.';
  else if (kind !== 'single' && leftChecked > failed.length) msg += ` Send again for the next ${EMAIL_BATCH}; already-sent letters are skipped.`;
  return back(failed.length || stopped ? 'error' : 'ok', msg);
}

export async function handleDonorLettersPrint(request, env, url) {
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion') || '';
  const roleResult = await fetchVerifiedRole(env, jwt);
  const html = (body, status = 200) => new Response(body, { status, headers: {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin',
    // The letterhead logo is Connect's public image, and a template may embed an image (data:).
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data: https://connect.timothystl.org; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  } });
  if (!canReadLetters(roleResult)) return html('<p>Letters need Giving view access.</p>', 403);
  const get = (k) => url.searchParams.get(k) || '';
  const kind = ['letters', 'receipts', 'nudges', 'single'].includes(get('kind')) ? get('kind') : 'letters';
  const p = lettersParams(get, isoToday());
  const keys = [...new Set(url.searchParams.getAll('key').filter((k) => KEY.test(k)))].slice(0, PRINT_LIMIT);
  if (!keys.length) return html('<p>Check at least one letter, then open the print sheet.</p>', 400);
  const built = kind === 'single' ? await buildSingle(env, jwt, p, keys[0]) : await buildLetters(env, jwt, kind, p, keys);
  if (built.error) return html(`<p>Connect could not answer: ${describe(built.error).replace(/</g, '&lt;')}</p>`, 502);
  // The sheet's mark form records these as printed, whichever channel the list was showing.
  const fields = Object.entries(keepParams(kind, { ...p, channel: 'print' })).map(([k, v]) => `<input type="hidden" name="${k}" value="${String(v).replace(/"/g, '&quot;')}">`).join('');
  return html(renderPrintSheet({ letters: built.letters, kind, params: p, keepFields: fields, canEdit: canSendLetters(roleResult) }));
}

export async function handleStatementCsv(request, env, url) {
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion') || '';
  if (!canReadLetters(await fetchVerifiedRole(env, jwt))) return new Response('Statements need Giving view access.', { status: 403 });
  const key = url.searchParams.get('key') || '';
  const p = lettersParams((k) => url.searchParams.get(k) || '', isoToday());
  if (!/^(p|h)\d{1,12}$/.test(key)) return new Response('Choose a giver or household.', { status: 400 });
  const res = await fetchGivingLetters(env, jwt, 'statements', { year: p.year, keys: key });
  if (!res.ok) return new Response(`Connect could not answer: ${describe(res)}`, { status: 502 });
  const s = res.result.statements?.[0];
  if (!s) return new Response('No such giver or household.', { status: 404 });
  const household = s.kind === 'household';
  const lines = [household ? ['Date', 'Person', 'Fund', 'Amount'] : ['Date', 'Fund', 'Amount', 'Method']];
  for (const x of s.entries || []) {
    lines.push(household
      ? [csvText(fmtDate(x.gift_date)), csvText(`${x.first_name || ''} ${x.last_name || ''}`.trim()), csvText(x.fund_name), csvNum(((x.amount || 0) / 100).toFixed(2))]
      : [csvText(fmtDate(x.gift_date)), csvText(x.fund_name), csvNum(((x.amount || 0) / 100).toFixed(2)), csvText(x.method || '')]);
  }
  lines.push(household ? ['', '', csvText('Total'), csvNum(((s.total_cents || 0) / 100).toFixed(2))] : ['', csvText('Total'), csvNum(((s.total_cents || 0) / 100).toFixed(2)), '']);
  const name = (household ? s.household?.name : s.person?.last_name) || 'statement';
  const file = `giving-statement-${String(name).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'statement'}-${p.year}.csv`;
  return new Response(`${lines.map((l) => l.join(',')).join('\r\n')}\r\n`, { headers: {
    'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${file}"`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  } });
}

const LOGO_MAX_BYTES = 2 * 1024 * 1024;
function toBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

// Letter settings: an administrator's form, relayed to Connect (which checks admin again).
export async function handleLetterSettingsWrite(request, env, url) {
  const back = (status, message) => redirect('settings', { status, [status === 'ok' ? 'msg' : 'message']: String(message).slice(0, 300) });
  if (!isSameOriginPost(request, url)) return back('error', 'That form did not come from Timothy Finance.');
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion') || '';
  const role = await fetchVerifiedRole(env, jwt);
  if (!role?.ok || role.role !== 'admin') return back('error', 'Letter settings are changed by an administrator.');
  let form;
  try { form = await request.formData(); } catch { return back('error', 'The form could not be read.'); }
  const text = (k) => String(form.get(k) || '');
  const body = {};
  for (const k of ['church_name', 'church_ein', 'church_from_name', 'church_from_email', 'online_giving_url', 'template_year_end', 'template_midyear']) body[k] = text(k);
  const logo = form.get('logo');
  if (logo && typeof logo === 'object' && logo.size) {
    if (logo.size > LOGO_MAX_BYTES) return back('error', 'The logo is larger than 2 MB. Use a smaller image.');
    body.logo = { data_base64: toBase64(new Uint8Array(await logo.arrayBuffer())) };
  } else if (text('remove_logo') === '1') body.remove_logo = true;
  const res = await postGivingLettersSettings(env, jwt, body);
  if (!res.ok) return back('error', describe(res));
  return back('ok', res.result.warning ? `Letter settings saved. ${res.result.warning}` : 'Letter settings saved.');
}

export { LETTER_KINDS };
