// ── Member portal: sign-in codes and a giver's own giving, for the launcher's member app ──────────
// app.timothystl.org (the launcher Worker) shows church members one front door. A member signs in
// with their email address and a 6-digit code, then sees their own giving history and year-end
// statements. The launcher keeps the session; Connect stays the only holder of people and gifts.
//
//   POST member-portal-v1  { op: 'request_code', email, origin, client }
//                          { op: 'verify_code',  email, code }
//                          { op: 'giving',       email, year? }
//                          { op: 'statement',    email, year }
//
// Who may call: only the launcher Worker, holding MEMBER_PORTAL_CONTRACT_API_KEY (a secret separate
// from Finance's). That key proves the call came from the launcher; the launcher only asks about an
// email address whose code the member just proved they received.
//
// Identity is the mailbox: every active person record carrying that email address (a couple who share
// one address see their gifts together). A code is never revealed to the caller; request_code answers
// the same way whether or not the address is on file, so the form cannot be used to look people up.
import { json, timingSafeEqual } from './auth.js';
import { sendBrevoTransactionalEmail } from './api-emails.js';
import { readLetterConfig, readStatement } from './api-giving-letters-contract.js';

export const CODE_TTL_SECONDS = 15 * 60;
export const MAX_CODE_TRIES = 5;
const MAX_REQUESTS_PER_EMAIL_HOUR = 5;
const MAX_REQUESTS_PER_CLIENT_HOUR = 20;
const DEFAULT_ORIGINS = ['https://app.timothystl.org'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = (v) => String(v || '').trim().toLowerCase();
const validEmail = (e) => e.length > 0 && e.length <= 254 && EMAIL_RE.test(e);
const yearOf = (v) => {
  const y = Number.parseInt(v, 10);
  return Number.isInteger(y) && y >= 2000 && y <= 2100 ? y : null;
};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Six digits, drawn without modulo bias.
function newCode() {
  const limit = Math.floor(0x100000000 / 1_000_000) * 1_000_000;
  const buf = new Uint32Array(1);
  do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
  return String(buf[0] % 1_000_000).padStart(6, '0');
}

async function codeDigest(env, email, code) {
  return sha256Hex(`${env.MEMBER_PORTAL_CONTRACT_API_KEY}|code|${email}|${code}`);
}

// Active people carrying this email address; organizations are not members.
async function peopleForEmail(db, email) {
  const rows = (await db.prepare(
    `SELECT id, first_name, last_name FROM people
     WHERE LOWER(TRIM(email)) = ? AND status = 'active' AND LOWER(member_type) != 'organization'
     ORDER BY id`
  ).bind(email).all()).results || [];
  return rows;
}

async function countAgainst(kv, key, limit) {
  const used = Number.parseInt((await kv.get(key)) || '0', 10) || 0;
  if (used >= limit) return false;
  await kv.put(key, String(used + 1), { expirationTtl: 3600 });
  return true;
}

function codeEmailHtml({ churchName, firstName, code, signInUrl }) {
  const name = esc(churchName);
  const hello = firstName ? `Hello ${esc(firstName)},` : 'Hello,';
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1E2833;line-height:1.5">
  <p style="font-size:18px">${hello}</p>
  <p style="font-size:18px">Here is your code to sign in to the ${name} app:</p>
  <p style="font-size:40px;font-weight:700;letter-spacing:10px;margin:18px 0;color:#2F4A68">${esc(code)}</p>
  <p style="font-size:16px">It works for 15 minutes. If it's easier, tap the button instead.</p>
  <p style="margin:22px 0"><a href="${esc(signInUrl)}" style="display:inline-block;background:#2F4A68;color:#fff;text-decoration:none;font-weight:700;font-size:18px;padding:16px 28px;border-radius:12px">Sign me in</a></p>
  <p style="font-size:14px;color:#4A5562">Didn't ask for this? You can safely ignore this email. No one can sign in without the code.</p>
</div>`;
}

async function requestCode(env, body) {
  const kv = env.KV;
  if (!kv) return json({ error: 'not_configured' }, 503);
  const email = normalizeEmail(body.email);
  if (!validEmail(email)) return json({ error: 'invalid_email' }, 400);
  const emailHash = await sha256Hex(email);
  const clientHash = await sha256Hex(String(body.client || 'unknown').slice(0, 200));
  const okEmail = await countAgainst(kv, `mp:rl:email:${emailHash}`, MAX_REQUESTS_PER_EMAIL_HOUR);
  const okClient = await countAgainst(kv, `mp:rl:client:${clientHash}`, MAX_REQUESTS_PER_CLIENT_HOUR);
  if (!okEmail || !okClient) return json({ error: 'too_many_requests' }, 429);

  const people = await peopleForEmail(env.DB, email);
  if (!people.length) return json({ ok: true }); // same answer as when a code was sent

  const config = await readLetterConfig(env.DB);
  const origins = String(env.MEMBER_PORTAL_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
  const allowed = origins.length ? origins : DEFAULT_ORIGINS;
  const origin = allowed.includes(String(body.origin || '')) ? body.origin : allowed[0];

  const code = newCode();
  await kv.put(`mp:code:${emailHash}`, JSON.stringify({ h: await codeDigest(env, email, code), tries: 0 }), { expirationTtl: CODE_TTL_SECONDS });

  const signInUrl = `${origin}/signin?${new URLSearchParams({ email, code }).toString()}`;
  const sent = await sendBrevoTransactionalEmail(env, {
    toEmail: email,
    toName: `${people[0].first_name} ${people[0].last_name}`.trim(),
    subject: `Your ${config.church_name} sign-in code`,
    html: codeEmailHtml({ churchName: config.church_name, firstName: people[0].first_name, code, signInUrl }),
    fromName: config.from_name,
    fromEmail: config.from_email,
  });
  if (!sent.ok) console.error('Member sign-in code email failed:', sent.error);
  return json({ ok: true });
}

async function verifyCode(env, body) {
  const kv = env.KV;
  if (!kv) return json({ error: 'not_configured' }, 503);
  const email = normalizeEmail(body.email);
  const code = String(body.code || '').replace(/\s+/g, '');
  if (!validEmail(email) || !/^\d{6}$/.test(code)) return json({ ok: false, reason: 'wrong' });
  const key = `mp:code:${await sha256Hex(email)}`;
  let record = null;
  try { record = JSON.parse((await kv.get(key)) ?? 'null'); } catch { record = null; }
  if (!record?.h) return json({ ok: false, reason: 'expired' });
  if ((record.tries || 0) >= MAX_CODE_TRIES) { await kv.delete(key); return json({ ok: false, reason: 'expired' }); }
  const match = await timingSafeEqual(await codeDigest(env, email, code), record.h);
  if (!match) {
    const tries = (record.tries || 0) + 1;
    if (tries >= MAX_CODE_TRIES) await kv.delete(key);
    else await kv.put(key, JSON.stringify({ ...record, tries }), { expirationTtl: CODE_TTL_SECONDS });
    return json({ ok: false, reason: tries >= MAX_CODE_TRIES ? 'expired' : 'wrong' });
  }
  await kv.delete(key); // a code works once
  const people = await peopleForEmail(env.DB, email);
  if (!people.length) return json({ ok: false, reason: 'expired' });
  return json({ ok: true, first_name: people[0].first_name, full_name: `${people[0].first_name} ${people[0].last_name}`.trim() });
}

// One year of this mailbox's gifts, in date order, as Connect's own statement counts them.
async function giftsForYear(db, people, year) {
  const statements = (await Promise.all(people.map((p) => readStatement(db, `p${p.id}`, year)))).filter(Boolean);
  const entries = statements.flatMap((s) => s.entries).sort((a, b) => String(a.gift_date).localeCompare(String(b.gift_date)));
  return { entries, total_cents: entries.reduce((sum, e) => sum + (e.amount || 0), 0) };
}

async function yearsWithGifts(db, people) {
  const marks = people.map(() => '?').join(',');
  const effDate = `COALESCE(NULLIF(ge.contribution_date,''), gb.batch_date)`;
  const rows = (await db.prepare(
    `SELECT substr(${effDate}, 1, 4) AS year, SUM(ge.amount) AS total_cents
     FROM giving_entries ge JOIN giving_batches gb ON ge.batch_id = gb.id
     WHERE ge.person_id IN (${marks}) AND NOT (ge.amount = 0 AND ge.original_amount_cents > 0)
     GROUP BY year HAVING year GLOB '[0-9][0-9][0-9][0-9]' ORDER BY year DESC`
  ).bind(...people.map((p) => p.id)).all()).results || [];
  return rows.filter((r) => r.total_cents > 0).map((r) => ({ year: Number(r.year), total_cents: r.total_cents }));
}

const toGift = (e) => ({ date: e.gift_date, fund: e.fund_name, method: e.method, amount_cents: e.amount });

async function giving(env, body) {
  const email = normalizeEmail(body.email);
  if (!validEmail(email)) return json({ error: 'invalid_email' }, 400);
  const people = await peopleForEmail(env.DB, email);
  if (!people.length) return json({ error: 'not_found' }, 404);
  const config = await readLetterConfig(env.DB);
  const thisYear = new Date().getUTCFullYear();
  const year = yearOf(body.year) ?? thisYear;
  const [{ entries, total_cents }, years] = await Promise.all([giftsForYear(env.DB, people, year), yearsWithGifts(env.DB, people)]);
  return json({
    contract: 'connect.member-portal-giving.v1',
    first_name: people[0].first_name,
    year, this_year: thisYear,
    total_cents,
    gifts: entries.map(toGift).reverse(),
    years,
    online_giving_url: config.online_giving_url || '',
  });
}

async function statement(env, body) {
  const email = normalizeEmail(body.email);
  const year = yearOf(body.year);
  if (!validEmail(email) || !year) return json({ error: 'invalid_request' }, 400);
  const people = await peopleForEmail(env.DB, email);
  if (!people.length) return json({ error: 'not_found' }, 404);
  const [config, { entries, total_cents }] = await Promise.all([readLetterConfig(env.DB), giftsForYear(env.DB, people, year)]);
  if (!entries.length) return json({ error: 'no_gifts' }, 404);
  return json({
    contract: 'connect.member-portal-statement.v1',
    year,
    church_name: config.church_name,
    church_ein: config.church_ein,
    names: people.map((p) => `${p.first_name} ${p.last_name}`.trim()),
    total_cents,
    gifts: entries.map(toGift),
  });
}

export async function handleMemberPortalContracts(req, env, path) {
  if (path !== '/api/contracts/member-portal-v1') return null;
  const expectedKey = env.MEMBER_PORTAL_CONTRACT_API_KEY || '';
  if (!expectedKey) return json({ error: 'Member portal not configured' }, 503);
  if (!(await timingSafeEqual(req.headers.get('X-Contract-Key') || '', expectedKey))) return json({ error: 'Unauthorized' }, 401);
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  switch (body?.op) {
    case 'request_code': return requestCode(env, body);
    case 'verify_code': return verifyCode(env, body);
    case 'giving': return giving(env, body);
    case 'statement': return statement(env, body);
    default: return json({ error: 'Unknown op' }, 400);
  }
}
