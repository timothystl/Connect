// ── Donor letters sent from Finance (Andrew, Sept 28 2026: "Finance can send donor letters itself")
// Finance runs the letters: it chooses recipients, renders each letter, prints, and sends email
// runs (apps/finance/donor-letters*.js). The giving records, the church's letter settings, the
// sent ledger (giving_letter_sends) and the Brevo sender still live in Connect until the Giving
// data moves to Finance's database, so this contract hands Finance what it needs in bulk and
// delivers what Finance rendered:
//
//   GET  giving-letters-v1?op=config      church name, sender, EIN, templates, logo, giving URL
//   GET  giving-letters-v1?op=status      recipients for a letter type/year/scope/channel
//   GET  giving-letters-v1?op=statements  gifts for up to 25 recipients (p<id>/h<id>) for a year
//   GET  giving-letters-v1?op=receipts    the thank-you receipts queue
//   GET  giving-letters-v1?op=nudges      the giving-nudge recipients
//   POST giving-letters-send-v1           send up to 20 rendered letters; records each send
//   POST giving-letters-mark-v1           record (or undo) printed or sent letters
//   POST giving-letters-settings-v1       save the church's letter settings, templates and logo
//                                         (admin only, as Connect's own Settings)
//
// Reads need Giving view; sending and marking need Giving edit (or admin), as in Connect. Every
// read reuses Connect's own handlers or the statement queries, so a letter shows exactly the
// gifts Connect's statement shows (voided gifts left out, refunds at what was kept).
import { json } from './auth.js';
import { handleGivingApi } from './api-giving.js';
import { authorizeGivingAnalyticsContract } from './api-giving-analytics-contracts.js';
import { sendBrevoTransactionalEmail } from './api-emails.js';
import { LETTER_TYPES, logoSizeWarning, sanitizeLetterTemplateHtml } from './api-utils.js';
import { validateImageUpload } from './api-people.js';
import { DEFAULT_MIDYEAR_TEMPLATE, DEFAULT_YEAR_END_TEMPLATE } from './giving-letter-templates.js';

export const LETTER_SEND_LIMIT = 20;
export const STATEMENT_LIMIT = 25;
const MAX_HTML = 1_200_000;
const CONNECT_ORIGIN = 'https://connect.timothystl.org';

const isDay = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));
const yearOf = (v) => {
  const y = Number.parseInt(v, 10);
  return Number.isInteger(y) && y >= 2000 && y <= 2100 ? y : null;
};

async function configValue(db, table, key) {
  const row = await db.prepare(`SELECT value FROM ${table} WHERE key=?`).bind(key).first().catch(() => null);
  return row?.value || '';
}

// Everything a letter needs besides the gifts. The EIN goes to anyone who may send letters: it is
// the church's public tax number, printed on every year-end statement, and without it the IRS
// acknowledgement sentence drops out of the letter.
export async function readLetterConfig(db) {
  const [churchName, fromName, fromEmail, ein, logoExt, yearEnd, midyear, givingUrl] = await Promise.all([
    configValue(db, 'chms_config', 'church_name'), configValue(db, 'chms_config', 'church_from_name'),
    configValue(db, 'chms_config', 'church_from_email'), configValue(db, 'chms_config', 'church_ein'),
    configValue(db, 'chms_config', 'letterhead_logo_ext'), configValue(db, 'giving_settings', 'giving_letter_template'),
    configValue(db, 'giving_settings', 'giving_midyear_letter_template'), configValue(db, 'giving_settings', 'online_giving_url'),
  ]);
  return {
    church_name: churchName || 'Timothy Lutheran Church',
    from_name: fromName || 'Timothy Lutheran Church',
    from_email: fromEmail,
    church_ein: ein,
    logo_url: logoExt ? `${CONNECT_ORIGIN}/admin/letterhead-logo` : '',
    online_giving_url: givingUrl,
    templates: {
      year_end: yearEnd || DEFAULT_YEAR_END_TEMPLATE,
      midyear: midyear || DEFAULT_MIDYEAR_TEMPLATE,
    },
    letter_types: Object.fromEntries(Object.entries(LETTER_TYPES).map(([k, v]) => [k, v.label])),
  };
}

// Gifts for one recipient key ('p<person>' or 'h<household>'), as Connect's statement shows them.
// `through` (YYYY-MM-DD) ends the period early, for mid-year and quarterly letters.
export async function readStatement(db, key, year, through = '') {
  const m = /^([ph])(\d{1,12})$/.exec(String(key || ''));
  if (!m) return null;
  const id = Number(m[2]);
  const effDate = `COALESCE(NULLIF(ge.contribution_date,''), gb.batch_date)`;
  const until = isDay(through) && through.slice(0, 4) === String(year) ? through : `${year}-12-31`;
  if (m[1] === 'p') {
    const person = await db.prepare('SELECT id, first_name, last_name, email FROM people WHERE id=?').bind(id).first();
    if (!person) return null;
    const entries = (await db.prepare(
      `SELECT ge.amount, ge.method, f.name as fund_name, ${effDate} as gift_date
       FROM giving_entries ge JOIN funds f ON ge.fund_id=f.id JOIN giving_batches gb ON ge.batch_id=gb.id
       WHERE ge.person_id=? AND NOT (ge.amount = 0 AND ge.original_amount_cents > 0)
         AND ${effDate} >= ? AND ${effDate} <= ?
       ORDER BY gift_date, ge.id`
    ).bind(id, `${year}-01-01`, until).all()).results || [];
    return { key, kind: 'person', id, mode: 'person', year, through: until, person, entries, total_cents: entries.reduce((s, e) => s + (e.amount || 0), 0) };
  }
  const household = await db.prepare('SELECT id, name FROM households WHERE id=?').bind(id).first();
  if (!household) return null;
  const entries = (await db.prepare(
    `SELECT ge.amount, ge.method, f.name as fund_name, ${effDate} as gift_date, p.first_name, p.last_name
     FROM giving_entries ge JOIN funds f ON ge.fund_id=f.id JOIN giving_batches gb ON ge.batch_id=gb.id
     JOIN people p ON ge.person_id=p.id
     WHERE p.household_id=? AND NOT (ge.amount = 0 AND ge.original_amount_cents > 0)
       AND ${effDate} >= ? AND ${effDate} <= ?
     ORDER BY gift_date, ge.id`
  ).bind(id, `${year}-01-01`, until).all()).results || [];
  return { key, kind: 'household', id, mode: 'household', year, through: until, household, entries, total_cents: entries.reduce((s, e) => s + (e.amount || 0), 0) };
}

// Runs one of Connect's own giving handlers with only the listed query parameters.
async function viaGivingApi(env, seg, url, params, isAdmin) {
  const target = new URL(`${CONNECT_ORIGIN}/admin/api/${seg}`);
  for (const key of params) {
    const value = url.searchParams.get(key);
    if (value != null && value !== '') target.searchParams.set(key, String(value).slice(0, 20));
  }
  return handleGivingApi(new Request(target), env, target, 'GET', seg, env.DB, isAdmin, true, false, false);
}

const RECORD_SEND = `INSERT INTO giving_letter_sends(person_id, household_id, year, letter_type, channel, recipient_key, sent_at)
  VALUES(?,?,?,?,?,?,datetime('now'))
  ON CONFLICT(recipient_key, year, letter_type, channel) WHERE recipient_key IS NOT NULL
  DO UPDATE SET sent_at=excluded.sent_at, person_id=excluded.person_id, household_id=excluded.household_id`;

function markFields(m) {
  const key = String(m?.recipient_key || '');
  const year = yearOf(m?.year);
  if (!/^(p|h)\d{1,12}$|^ge\d{1,12}:\d{4}-\d{2}-\d{2}$/.test(key) || !year || !LETTER_TYPES[m?.letter_type]) return null;
  return {
    key, year, letterType: m.letter_type, channel: m.channel === 'print' ? 'print' : 'email',
    personId: Number.parseInt(m.person_id, 10) || 0, householdId: Number.parseInt(m.household_id, 10) || null,
  };
}

// Sends each letter in order, one message per recipient. Stops at Brevo's sending limit (the rest
// stay pending for the next run) and records every letter that went out.
export async function sendLetters(env, db, letters) {
  const list = Array.isArray(letters) ? letters.slice(0, LETTER_SEND_LIMIT) : [];
  const config = await readLetterConfig(db);
  if (!config.from_email) return { error: 'The church’s sending address is not set in Connect’s Giving settings.', status: 400 };
  const sent = [];
  const failed = [];
  let stopped = false;
  for (const letter of list) {
    const f = markFields({ ...letter, channel: 'email' });
    const to = String(letter?.to_email || '').trim();
    const html = String(letter?.html || '');
    if (stopped) break;
    if (!f || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || !html || html.length > MAX_HTML) {
      failed.push({ recipient_key: f?.key || String(letter?.recipient_key || ''), error: 'Not sendable (missing address or letter).' });
      continue;
    }
    const result = await sendBrevoTransactionalEmail(env, {
      toEmail: to, toName: String(letter.to_name || '').slice(0, 200), subject: String(letter.subject || '').slice(0, 300) || 'Your Giving Statement',
      html, fromName: config.from_name, fromEmail: config.from_email,
    });
    if (!result.ok) {
      if (result.rate_limited) { stopped = true; break; }
      failed.push({ recipient_key: f.key, error: String(result.error || 'Not sent').slice(0, 200) });
      if (result.status === 500 && /BREVO_API_KEY/.test(result.error || '')) break;
      continue;
    }
    await db.prepare(RECORD_SEND).bind(f.personId, f.householdId, f.year, f.letterType, 'email', f.key).run();
    sent.push(f.key);
  }
  return { ok: true, sent, failed, stopped, remaining: list.length - sent.length - failed.length };
}

export async function markLetters(db, marks, unmark) {
  const list = Array.isArray(marks) ? marks.slice(0, 500) : [];
  const stmts = [];
  for (const m of list) {
    const f = markFields(m);
    if (!f) continue;
    stmts.push(unmark
      ? db.prepare('DELETE FROM giving_letter_sends WHERE recipient_key=? AND year=? AND letter_type=? AND channel=?').bind(f.key, f.year, f.letterType, f.channel)
      : db.prepare(RECORD_SEND).bind(f.personId, f.householdId, f.year, f.letterType, f.channel, f.key));
  }
  if (stmts.length) await db.batch(stmts);
  return { ok: true, marked: stmts.length, unmarked: !!unmark };
}

// The church's letter settings, saved as Connect's Settings › Church and Giving settings save
// them: a blank field keeps what is stored, templates are cleaned of stray base64 and capped, and
// the letterhead logo is checked to be a real image before it replaces the stored one.
const SETTING_KEYS = { church_name: 200, church_from_name: 200, church_from_email: 254, church_ein: 20 };
const TEMPLATE_KEYS = { template_year_end: 'giving_letter_template', template_midyear: 'giving_midyear_letter_template' };
const TEMPLATE_MAX_CHARS = 1_000_000;
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export async function saveLetterSettings(env, db, body) {
  const b = body && typeof body === 'object' ? body : {};
  const stmts = [];
  const setConfig = (key, value) => db.prepare('INSERT INTO chms_config(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key, value);
  const setGiving = (key, value) => db.prepare('INSERT INTO giving_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key, value);
  for (const [key, max] of Object.entries(SETTING_KEYS)) {
    const value = String(b[key] ?? '').trim();
    if (!value) continue;
    if (value.length > max) return { error: `That ${key.replace(/_/g, ' ')} is too long.` };
    if (key === 'church_from_email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { error: 'The sending address is not an email address.' };
    stmts.push(setConfig(key, value));
  }
  const url = String(b.online_giving_url ?? '').trim();
  if (url) {
    if (!/^https:\/\/[^\s"'<>]+$/.test(url) || url.length > 500) return { error: 'The online giving link must be an https:// address.' };
    stmts.push(setGiving('online_giving_url', url));
  }
  for (const [field, key] of Object.entries(TEMPLATE_KEYS)) {
    const value = String(b[field] ?? '');
    if (!value.trim()) continue;
    if (value.length > TEMPLATE_MAX_CHARS) return { error: 'A letter template is too large to save (likely an embedded image). Use a smaller image or remove it.' };
    stmts.push(setGiving(key, sanitizeLetterTemplateHtml(value).cleaned));
  }
  let warning = '';
  let logo = null;
  if (b.logo?.data_base64) {
    if (!env.PHOTOS) return { error: 'Photo storage is not configured in Connect.' };
    let bytes;
    try { bytes = Uint8Array.from(atob(String(b.logo.data_base64)), (c) => c.charCodeAt(0)); } catch { return { error: 'The logo could not be read.' }; }
    if (bytes.byteLength > LOGO_MAX_BYTES) return { error: 'The logo is larger than 2 MB. Use a smaller image.' };
    const v = await validateImageUpload(new Blob([bytes]));
    if (!v.ok) return { error: v.error };
    logo = v;
    warning = logoSizeWarning(bytes.byteLength);
  }
  const prev = (b.remove_logo || logo) ? await db.prepare("SELECT value FROM chms_config WHERE key='letterhead_logo_ext'").first() : null;
  if (logo) {
    if (prev?.value && prev.value !== logo.ext) { try { await env.PHOTOS.delete(`branding/letterhead-logo.${prev.value}`); } catch { /* replaced below */ } }
    await env.PHOTOS.put(`branding/letterhead-logo.${logo.ext}`, logo.buf, { httpMetadata: { contentType: logo.ct } });
    stmts.push(setConfig('letterhead_logo_ext', logo.ext));
  } else if (b.remove_logo) {
    if (prev?.value && env.PHOTOS) { try { await env.PHOTOS.delete(`branding/letterhead-logo.${prev.value}`); } catch { /* row removed below */ } }
    stmts.push(db.prepare("DELETE FROM chms_config WHERE key='letterhead_logo_ext'"));
  }
  if (stmts.length) await db.batch(stmts);
  return { ok: true, saved: stmts.length, warning };
}

export async function handleGivingLettersContracts(req, env, path) {
  if (path === '/api/contracts/giving-letters-v1' && req.method === 'GET') {
    const auth = await authorizeGivingAnalyticsContract(req, env, { level: 'people' });
    if (auth.response) return auth.response;
    const url = new URL(req.url);
    const op = url.searchParams.get('op') || '';
    const isAdmin = auth.user.role === 'admin';
    if (op === 'config') return json({ contract: 'connect.giving-letters.v1', op, ...(await readLetterConfig(env.DB)) });
    if (op === 'statements') {
      const year = yearOf(url.searchParams.get('year'));
      if (!year) return json({ error: 'Choose a year.' }, 400);
      const keys = [...new Set(String(url.searchParams.get('keys') || '').split(',').filter(Boolean))].slice(0, STATEMENT_LIMIT);
      const through = url.searchParams.get('through') || '';
      const statements = (await Promise.all(keys.map((k) => readStatement(env.DB, k, year, through)))).filter(Boolean);
      return json({ contract: 'connect.giving-letters.v1', op, year, statements });
    }
    const handlers = {
      status: ['giving/letters/status', ['year', 'letter_type', 'channel', 'scope']],
      receipts: ['giving/receipts/queue', ['from', 'to', 'threshold_cents', 'first_gift']],
      nudges: ['giving/nudges/status', ['year', 'scope', 'fund_id', 'channel', 'option', 'low_frequency_max']],
    };
    if (!Object.prototype.hasOwnProperty.call(handlers, op)) return json({ error: 'Unknown letters operation' }, 404);
    const [seg, params] = handlers[op];
    const result = await viaGivingApi(env, seg, url, params, isAdmin);
    if (!result) return json({ error: 'Unknown letters operation' }, 404);
    if (!result.ok) return result;
    return json({ contract: 'connect.giving-letters.v1', op, ...(await result.json()) });
  }
  if (path === '/api/contracts/giving-letters-settings-v1' && req.method === 'POST') {
    const auth = await authorizeGivingAnalyticsContract(req, env, { level: 'write' });
    if (auth.response) return auth.response;
    if (auth.user.role !== 'admin') return json({ error: 'Letter settings are changed by an administrator, as in Connect’s Settings.' }, 403);
    let body = {};
    try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const result = await saveLetterSettings(env, env.DB, body);
    return result.error ? json({ error: result.error }, 400) : json(result);
  }
  if ((path === '/api/contracts/giving-letters-send-v1' || path === '/api/contracts/giving-letters-mark-v1') && req.method === 'POST') {
    const auth = await authorizeGivingAnalyticsContract(req, env, { level: 'write' });
    if (auth.response) return auth.response;
    let body = {};
    try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    if (path.endsWith('mark-v1')) return json(await markLetters(env.DB, body.marks, !!body.unmark));
    const result = await sendLetters(env, env.DB, body.letters);
    return result.error ? json({ error: result.error }, result.status || 400) : json(result);
  }
  return null;
}
