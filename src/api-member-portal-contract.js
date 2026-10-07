// ── Member portal: sign-in codes and a giver's own giving, for the launcher's member app ──────────
// app.timothystl.org (the launcher Worker) shows church members one front door. A member signs in
// with their email address and a 6-digit code, then sees their own giving history and year-end
// statements. The launcher keeps the session; Connect stays the only holder of people and gifts.
//
//   POST member-portal-v1  { op: 'request_code', email, origin, client }
//                          { op: 'verify_code',  email, code }
//                          { op: 'giving',       email, year? }
//                          { op: 'statement',    email, year }
//                          { op: 'serving',      email }
//                          { op: 'respond',      email, date, role, svc, status }
//
// Who may call: only the launcher Worker, holding MEMBER_PORTAL_CONTRACT_API_KEY (a secret separate
// from Finance's). That key proves the call came from the launcher; the launcher only asks about an
// email address whose code the member just proved they received.
//
// Identity is the mailbox: every active person record carrying that email address (a couple who share
// one address see their gifts together). A code is never revealed to the caller; request_code answers
// the same way whether or not the address is on file, so the form cannot be used to look people up.
import { json, timingSafeEqual, authCookieHeader, isPhoneUserAgent } from './auth.js';
import { sendBrevoTransactionalEmail } from './api-emails.js';
import { readLetterConfig, readStatement } from './api-giving-letters-contract.js';
import { finishRsvp, schedKvGet, schedKvPut } from './api-scheduler.js';

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


// ── Where this person is scheduled and signed up to serve ───────────────────────────────────────
// The worship Scheduler stores each month's Sunday rows in scheduler_data 'ws_schedule_v2' (roles filled by the
// Scheduler's own volunteer ids from 'ws_people'); confirmations live in scheduler_confirmations. Those ids
// are not people ids, so a mailbox is matched to them by email and by the migration link on scheduler_volunteers.
const PER_SERVICE_ROLES = ['Elder', 'Acolyte', 'PowerPoint', 'Lector', 'Liturgist'];
const SHARED_ROLES = ['Preacher', 'Childrens Message'];
const SERVICE_LABELS = { '8am': '8:00 AM', '10:45am': '10:45 AM' };

const chicagoToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
const parseJson = (text, fallback) => { try { const v = JSON.parse(text); return v ?? fallback; } catch { return fallback; } };

async function volunteerIdsFor(db, email, people) {
  const ids = new Set(people.map((p) => String(p.id)));
  const marks = people.map(() => '?').join(',');
  const linked = (await db.prepare(
    `SELECT migrated_from_legacy_id AS legacy FROM scheduler_volunteers WHERE person_id IN (${marks})`
  ).bind(...people.map((p) => p.id)).all().catch(() => ({ results: [] }))).results || [];
  for (const row of linked) if (row.legacy) ids.add(String(row.legacy));
  const wsRow = await db.prepare(`SELECT value FROM scheduler_data WHERE key='ws_people'`).first().catch(() => null);
  const legacy = parseJson(wsRow?.value, []);
  for (const lp of Array.isArray(legacy) ? legacy : []) {
    if (!lp || lp.id == null) continue;
    const emails = [lp.email, lp.notifyEmail, lp.reminderEmail].map((v) => String(v || '').trim().toLowerCase());
    if (emails.includes(email)) ids.add(String(lp.id));
  }
  return ids;
}

function scheduledFor(months, ids, confirmations, today) {
  const out = [];
  const mine = (v) => v != null && ids.has(String(v));
  const status = (date, role, svc) => confirmations[`${date}|${role}|${svc}`] || 'pending';
  for (const month of Object.values(months || {})) {
    for (const row of Array.isArray(month?.rows) ? month.rows : []) {
      const date = row?.dateISO;
      if (!date || date < today) continue;
      if (row.type === 'special') {
        for (const svc of Array.isArray(row.services) ? row.services : []) {
          const key = svc.time || 'shared';
          for (const role of Array.isArray(svc.roles) ? svc.roles : []) {
            if (mine(svc.assignments?.[role])) out.push({ date, what: row.name || 'Special service', service: svc.time || '', svc: key, role, status: status(date, role, key) });
          }
        }
        continue;
      }
      const assigned = row.assignments && typeof row.assignments === 'object' ? row.assignments : {};
      for (const role of PER_SERVICE_ROLES) {
        for (const svc of ['8am', '10:45am']) {
          if (mine(assigned[role]?.[svc])) out.push({ date, what: row.label || 'Sunday worship', service: SERVICE_LABELS[svc], svc, role, status: status(date, role, svc) });
        }
      }
      for (const role of SHARED_ROLES) {
        if (mine(assigned[role]?.shared)) out.push({ date, what: row.label || 'Sunday worship', service: 'All services', svc: 'shared', role, status: status(date, role, 'shared') });
      }
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.service.localeCompare(b.service));
}

async function signupsFor(db, email, today) {
  const rows = (await db.prepare(
    `SELECT s.ministry, s.roles, s.service, s.sundays, s.status, e.name AS event_name, e.event_date
     FROM signups s LEFT JOIN serve_events e ON e.id = s.event_id
     WHERE LOWER(TRIM(s.email)) = ? AND NOT (s.ministry = 'worship' AND (s.event_id IS NULL OR s.event_id = 0))
       AND COALESCE(s.status, 'new') != 'declined'
     ORDER BY COALESCE(e.event_date, ''), s.created_at DESC LIMIT 100`
  ).bind(email).all().catch(() => ({ results: [] }))).results || [];
  return rows
    .filter((r) => !r.event_date || r.event_date >= today)
    .map((r) => ({
      what: r.event_name || r.ministry || 'Ministry',
      date: r.event_date || '',
      roles: parseJson(r.roles, []).filter((x) => typeof x === 'string').slice(0, 10),
      status: r.status || 'new',
    }));
}

async function serving(env, body) {
  const email = normalizeEmail(body.email);
  if (!validEmail(email)) return json({ error: 'invalid_email' }, 400);
  const people = await peopleForEmail(env.DB, email);
  if (!people.length) return json({ error: 'not_found' }, 404);
  const today = chicagoToday();
  const [ids, scheduleRow, confRows, signups] = await Promise.all([
    volunteerIdsFor(env.DB, email, people),
    env.DB.prepare(`SELECT value FROM scheduler_data WHERE key='ws_schedule_v2'`).first().catch(() => null),
    env.DB.prepare(`SELECT date_iso, role, svc, status FROM scheduler_confirmations WHERE date_iso >= ?`).bind(today).all().catch(() => ({ results: [] })),
    signupsFor(env.DB, email, today),
  ]);
  const confirmations = {};
  for (const r of confRows.results || []) confirmations[`${r.date_iso}|${r.role}|${r.svc}`] = r.status;
  return json({
    contract: 'connect.member-portal-serving.v1',
    first_name: people[0].first_name,
    scheduled: scheduledFor(parseJson(scheduleRow?.value, {}), ids, confirmations, today).slice(0, 60),
    signups,
  });
}

// ── Answering "waiting for your reply" ──────────────────────────────────────────────────────────
// The same answers the emailed links record (confirmed, needs changes, declined), written to the same places and
// announced to the office the same way (src/api-scheduler.js finishRsvp). The slot must be one this mailbox is
// actually scheduled for; nothing the caller sends can answer for someone else.
const RSVP_STATUSES = ['confirmed', 'needs_changes', 'declined'];

async function respond(env, body) {
  const email = normalizeEmail(body.email);
  const date = String(body.date || '');
  const role = String(body.role || '').slice(0, 80);
  const svc = String(body.svc || '').slice(0, 40);
  const status = String(body.status || '');
  if (!validEmail(email) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !role || !svc || !RSVP_STATUSES.includes(status)) return json({ error: 'invalid_request' }, 400);
  const people = await peopleForEmail(env.DB, email);
  if (!people.length) return json({ error: 'not_found' }, 404);
  const today = chicagoToday();
  const [ids, scheduleRow, confRows] = await Promise.all([
    volunteerIdsFor(env.DB, email, people),
    env.DB.prepare(`SELECT value FROM scheduler_data WHERE key='ws_schedule_v2'`).first().catch(() => null),
    env.DB.prepare(`SELECT date_iso, role, svc, status FROM scheduler_confirmations WHERE date_iso >= ?`).bind(today).all().catch(() => ({ results: [] })),
  ]);
  const confirmations = {};
  for (const r of confRows.results || []) confirmations[`${r.date_iso}|${r.role}|${r.svc}`] = r.status;
  const slot = scheduledFor(parseJson(scheduleRow?.value, {}), ids, confirmations, today).find((x) => x.date === date && x.role === role && x.svc === svc);
  if (!slot) return json({ error: 'not_scheduled' }, 404);

  const fullName = `${people[0].first_name} ${people[0].last_name}`.trim();
  const notifyRow = await env.DB.prepare(`SELECT value FROM chms_config WHERE key='volunteer_public_email'`).first().catch(() => null);
  const notifyFallback = notifyRow?.value || env.REPLY_TO_EMAIL || 'office@timothystl.org';
  // Keep the volunteer's own reminder record (if one was sent) in step, so the emailed link shows the same answer.
  const marks = [...ids].map(() => '?').join(',');
  const tokens = (await env.DB.prepare(`SELECT token FROM scheduler_rsvp_tokens WHERE person_id IN (${marks})`).bind(...ids).all().catch(() => ({ results: [] }))).results || [];
  let notifyEmail = notifyFallback;
  for (const { token } of tokens) {
    const record = await schedKvGet(env, token);
    const match = (record?.assignments || []).find((a) => a.dateISO === date && a.role === role && (a.svc === 'both services' ? 'shared' : a.svc) === svc);
    if (!match) continue;
    match.status = status;
    record.overallStatus = status;
    record.updatedAt = new Date().toISOString();
    await schedKvPut(env, token, record);
    notifyEmail = record.notifyEmail || notifyFallback;
  }
  // Only this one slot is written to the confirmations table, so no one else's answer is touched.
  await finishRsvp(env, null, {
    name: fullName, email, notifyEmail,
    assignments: [{ dateISO: date, date: slot.date, svc, role, status }],
  }, status);
  return json({ ok: true, date, role, svc, status });
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
    case 'serving': return serving(env, body);
    case 'respond': return respond(env, body);
    default: return json({ error: 'Unknown op' }, 400);
  }
}

// ── Opening Connect from the member app without a second sign-in ───────────────────────────────
// The launcher signs a short-lived link for a member who has already proved their email address. Connect checks
// it with the same shared secret, spends it once, and signs that person in as a MEMBER. It never signs anyone in
// as staff or an administrator: those roles keep their own sign-in.
const SSO_LINK_SECONDS = 90;

function fromB64url(part) {
  const padded = String(part).replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(String(part).length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function ssoSignature(key, payload) {
  const hmac = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', hmac, new TextEncoder().encode(`member-sso|${payload}`)));
  return btoa(String.fromCharCode(...sig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Returns the verified, not-yet-spent email in the link, or null.
export async function acceptMemberSsoLink(env, token) {
  const key = env.MEMBER_PORTAL_CONTRACT_API_KEY || '';
  const [payload, signature, extra] = String(token || '').split('.');
  if (!key || !env.KV || !payload || !signature || extra !== undefined) return null;
  if (!(await timingSafeEqual(signature, await ssoSignature(key, payload)))) return null;
  let claims;
  try { claims = JSON.parse(new TextDecoder().decode(fromB64url(payload))); } catch { return null; }
  const email = normalizeEmail(claims?.e);
  const now = Math.floor(Date.now() / 1000);
  if (!validEmail(email) || typeof claims.exp !== 'number' || claims.exp < now || claims.exp > now + SSO_LINK_SECONDS + 30) return null;
  if (typeof claims.n !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(claims.n)) return null;
  const spent = `mp:sso:${claims.n}`;
  if (await env.KV.get(spent)) return null;
  await env.KV.put(spent, '1', { expirationTtl: 300 });
  return email;
}

// The member account for this mailbox, created on first use for active members only. Staff, council, and
// administrator accounts are never touched or signed in here.
export async function memberAccountFor(db, email) {
  const found = await peopleForEmail(db, email);
  if (!found.length) return null;
  const person = await db.prepare(`SELECT id, first_name, last_name, member_type FROM people WHERE id = ?`).bind(found[0].id).first();
  if (!person) return null;
  const existing = await db.prepare(
    `SELECT id, username, role, active FROM app_users WHERE people_id = ? OR LOWER(username) = ? OR LOWER(email) = ? LIMIT 1`
  ).bind(person.id, email, email).first();
  // A session cookie can only carry letters, digits, "_" and "-" in the username (see authCookieHeader), so a member
  // account gets a plain name. An account invited under an email address is renamed once, on first use here.
  const safeName = `member-${person.id}`;
  if (existing) {
    if (existing.role !== 'member' || !existing.active) return null;
    if (/^[A-Za-z0-9_-]+$/.test(existing.username)) return { username: existing.username };
    const taken = await db.prepare(`SELECT 1 AS n FROM app_users WHERE LOWER(username) = ? AND id != ?`).bind(safeName, existing.id).first();
    if (taken) return null;
    await db.prepare(`UPDATE app_users SET username = ? WHERE id = ?`).bind(safeName, existing.id).run();
    return { username: safeName };
  }
  if (String(person.member_type || '').toLowerCase() !== 'member') return null;
  // No password: this account can only be entered through the member app (a person can still set one by invitation).
  const unusable = `disabled:${crypto.randomUUID()}`;
  await db.prepare(
    `INSERT INTO app_users (username, password_hash, display_name, email, role, people_id, active) VALUES (?,?,?,?,'member',?,1)`
  ).bind(safeName, unusable, `${person.first_name} ${person.last_name}`.trim(), email, person.id).run();
  return { username: safeName };
}

export async function handleMemberSso(req, env, url) {
  const home = Response.redirect(`${url.origin}/`, 302);
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const email = await acceptMemberSsoLink(env, url.searchParams.get('t'));
  if (!email) return home;
  const account = await memberAccountFor(env.DB, email);
  if (!account) return home;
  const cookie = await authCookieHeader(env, 'member', account.username, isPhoneUserAgent(req));
  return new Response(null, { status: 302, headers: { Location: `${url.origin}/`, 'Set-Cookie': cookie, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}
