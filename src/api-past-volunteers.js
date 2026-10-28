// ── PAST VOLUNTEERS: import last year's list, match it to People, invite them back ──
// A Serve event's coordinator pastes or uploads last year's volunteer spreadsheet. Each row is
// kept per event in serve_past_volunteers. Rows whose email (or, failing that, phone) matches
// an active person in People are linked to that person and given a People tag named after the
// event ("Christmas Market volunteer"), so the office can find them from the directory. Name
// alone never links anyone: two "John Smith"s are common enough that a guess would tag the
// wrong person. Unmatched rows stay on the list only — an import never creates People records.
//
// "Invite to sign up" emails everyone on the list who has an email address and is not already
// signed up for this year's event, with the event's public sign-up link.
import { json } from './auth.js';
import { parseCsvRows } from './api-utils.js';

const MAX_ROWS = 3000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function phoneKey(v) {
  const d = String(v || '').replace(/\D/g, '');
  return d.length >= 10 ? d.slice(-10) : '';
}

const HEADER_ALIASES = {
  name: ['name', 'full name', 'fullname', 'volunteer', 'volunteer name'],
  first: ['first', 'first name', 'firstname', 'given name'],
  last: ['last', 'last name', 'lastname', 'surname', 'family name'],
  email: ['email', 'e-mail', 'email address', 'e-mail address', 'emailaddress'],
  phone: ['phone', 'phone number', 'cell', 'cell phone', 'mobile', 'mobile phone', 'telephone', 'home phone'],
};
function headerKind(cell) {
  const c = String(cell || '').trim().toLowerCase().replace(/[_:]+/g, ' ').replace(/\s+/g, ' ');
  for (const [kind, names] of Object.entries(HEADER_ALIASES)) if (names.includes(c)) return kind;
  return null;
}

/**
 * Reads a pasted or uploaded sheet: CSV, or tab-separated text as copied out of Excel / Google
 * Sheets. Needs a header row naming at least a name (or first/last) column and an email or
 * phone column. Returns { rows: [{ name, email, phone }], skipped, error }.
 */
export function parsePastVolunteerSheet(text) {
  const src = String(text || '').replace(/^﻿/, '');
  const firstLine = (src.split(/\r?\n/).find((l) => l.trim()) || '');
  const grid = firstLine.includes('\t') && !firstLine.includes(',')
    ? src.split(/\r?\n/).filter((l) => l.trim()).map((l) => l.split('\t'))
    : parseCsvRows(src);
  let headerAt = -1; let cols = {};
  for (let i = 0; i < Math.min(grid.length, 5); i++) {
    const found = {};
    grid[i].forEach((cell, idx) => { const k = headerKind(cell); if (k && found[k] === undefined) found[k] = idx; });
    if ((found.name !== undefined || found.first !== undefined) && (found.email !== undefined || found.phone !== undefined)) {
      headerAt = i; cols = found; break;
    }
  }
  if (headerAt < 0) {
    return { rows: [], skipped: 0, error: 'Could not find the column headings. The first row needs a "Name" (or "First Name" and "Last Name") column and an "Email" or "Phone" column.' };
  }
  const cell = (r, k) => (cols[k] === undefined ? '' : String(r[cols[k]] || '').trim());
  const rows = []; let skipped = 0;
  for (const r of grid.slice(headerAt + 1)) {
    const name = cell(r, 'name') || [cell(r, 'first'), cell(r, 'last')].filter(Boolean).join(' ');
    let email = cell(r, 'email').toLowerCase();
    if (email && !EMAIL_RE.test(email)) email = '';
    const phone = cell(r, 'phone');
    if (!name && !email) { skipped++; continue; }
    if (!email && !phoneKey(phone)) { skipped++; continue; }
    rows.push({ name: name.slice(0, 200), email: email.slice(0, 200), phone: phone.slice(0, 40) });
  }
  if (rows.length > MAX_ROWS) return { rows: [], skipped, error: `That is more than ${MAX_ROWS} people. Please split it into smaller files.` };
  return { rows, skipped, error: null };
}

const dedupeKey = (r) => (r.email ? 'e:' + r.email : phoneKey(r.phone) ? 'p:' + phoneKey(r.phone) : 'n:' + r.name.toLowerCase());

/** Matches rows to active People by email, then by phone; both only when the match is unambiguous. */
export async function matchPeople(db, rows) {
  const firstWord = (s) => String(s || '').trim().split(/\s+/)[0].toLowerCase();
  const pick = (cands, row) => {
    if (cands.length === 1) return cands[0];
    const byName = cands.filter((p) => [p.first_name, p.preferred_name].some((n) => n && firstWord(n) === firstWord(row.name)));
    return byName.length === 1 ? byName[0] : null;
  };
  const emails = [...new Set(rows.map((r) => r.email).filter(Boolean))];
  const byEmail = new Map();
  for (let i = 0; i < emails.length; i += 90) {
    const chunk = emails.slice(i, i + 90);
    const found = (await db.prepare(
      `SELECT id, first_name, preferred_name, LOWER(TRIM(email)) AS em FROM people
       WHERE active=1 AND COALESCE(deceased,0)=0 AND LOWER(TRIM(email)) IN (${chunk.map(() => '?').join(',')})`
    ).bind(...chunk).all()).results || [];
    for (const p of found) { if (!byEmail.has(p.em)) byEmail.set(p.em, []); byEmail.get(p.em).push(p); }
  }
  let byPhone = null;
  const needPhone = rows.some((r) => phoneKey(r.phone));
  if (needPhone) {
    byPhone = new Map();
    const all = (await db.prepare(
      `SELECT id, first_name, preferred_name, phone FROM people WHERE active=1 AND COALESCE(deceased,0)=0 AND phone != ''`
    ).all()).results || [];
    for (const p of all) {
      const k = phoneKey(p.phone); if (!k) continue;
      if (!byPhone.has(k)) byPhone.set(k, []); byPhone.get(k).push(p);
    }
  }
  return rows.map((r) => {
    let hit = r.email && byEmail.get(r.email) ? pick(byEmail.get(r.email), r) : null;
    let how = hit ? 'email' : '';
    if (!hit && byPhone && phoneKey(r.phone) && byPhone.get(phoneKey(r.phone))) {
      hit = pick(byPhone.get(phoneKey(r.phone)), r); how = hit ? 'phone' : '';
    }
    return { ...r, person_id: hit ? hit.id : null, match_method: how };
  });
}

/** The People tag for this event's volunteers, created on first use. */
async function eventTagId(db, eventName) {
  const name = `${String(eventName || 'Event').trim()} volunteer`;
  const t = await db.prepare('SELECT id FROM tags WHERE LOWER(name)=LOWER(?)').bind(name).first();
  if (t) return { id: t.id, name };
  const r = await db.prepare('INSERT INTO tags (name, description) VALUES (?, ?)')
    .bind(name, 'Added by the past-volunteer import on the Volunteers screen').run();
  return { id: r.meta?.last_row_id, name };
}

export function eventSignupLink(ev) {
  return ev.slug ? `https://serve.timothystl.org/${ev.slug}` : `https://serve.timothystl.org/#event-${ev.id}`;
}

const SIGNED_UP_SQL = `LOWER(pv.email) IN (
  SELECT LOWER(TRIM(s.email)) FROM signups s
  WHERE COALESCE(s.status,'new')!='declined' AND (s.event_id=? OR s.id IN (
    SELECT ss.signup_id FROM signup_slots ss JOIN serve_roles r ON r.id=ss.role_id WHERE r.event_id=?)))`;

async function listRows(db, evId) {
  const rows = (await db.prepare(
    `SELECT pv.id, pv.name, pv.email, pv.phone, pv.source_label, pv.person_id, pv.match_method,
            pv.invited_at, pv.invite_count, (pv.email != '' AND ${SIGNED_UP_SQL}) AS signed_up
     FROM serve_past_volunteers pv WHERE pv.event_id=? ORDER BY pv.name COLLATE NOCASE, pv.id`
  ).bind(evId, evId, evId).all()).results || [];
  return rows.map((r) => ({
    id: r.id, name: r.name, email: r.email, phone: r.phone, source_label: r.source_label,
    in_connect: !!r.person_id, match_method: r.match_method || '',
    invited_at: r.invited_at || '', invite_count: r.invite_count || 0, signed_up: !!r.signed_up,
  }));
}

function fill(text, person, ev, link) {
  const first = String(person.name || '').trim().split(/\s+/)[0] || 'friend';
  return String(text || '').replace(/\{name\}/g, first).replace(/\{link\}/g, link).replace(/\{event\}/g, ev.name);
}

/** Routes under /admin/api/events/:id/past-volunteers. Access is checked by the caller. */
export async function handlePastVolunteers(req, env, evId, rest, method, sender) {
  const db = env.DB;
  const ev = await db.prepare('SELECT id, name, slug FROM serve_events WHERE id=?').bind(evId).first();
  if (!ev) return json({ error: 'Event not found' }, 404);

  if (rest === '' && method === 'GET') {
    const rows = await listRows(db, evId);
    return json({ ok: true, link: eventSignupLink(ev), tag: `${ev.name} volunteer`, rows });
  }

  if (rest === '/import' && method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const text = String(b.text || '');
    if (!text.trim()) return json({ error: 'Choose a file or paste the list first' }, 400);
    if (text.length > 2_000_000) return json({ error: 'That file is too large' }, 400);
    const label = String(b.label || '').trim().slice(0, 60);
    const parsed = parsePastVolunteerSheet(text);
    if (parsed.error) return json({ error: parsed.error }, 400);
    // The same person twice in one file (two shifts last year) is one row here.
    const unique = new Map();
    for (const r of parsed.rows) if (!unique.has(dedupeKey(r))) unique.set(dedupeKey(r), r);
    const matched = await matchPeople(db, [...unique.values()]);
    const before = new Set(((await db.prepare('SELECT dedupe_key FROM serve_past_volunteers WHERE event_id=?').bind(evId).all()).results || []).map((r) => r.dedupe_key));
    const stmts = matched.map((r) => db.prepare(
      `INSERT INTO serve_past_volunteers (event_id, dedupe_key, name, email, phone, source_label, person_id, match_method)
       VALUES (?,?,?,?,?,?,?,?)
       ON CONFLICT(event_id, dedupe_key) DO UPDATE SET
         name=CASE WHEN excluded.name!='' THEN excluded.name ELSE serve_past_volunteers.name END,
         phone=CASE WHEN excluded.phone!='' THEN excluded.phone ELSE serve_past_volunteers.phone END,
         source_label=CASE WHEN excluded.source_label!='' THEN excluded.source_label ELSE serve_past_volunteers.source_label END,
         person_id=COALESCE(excluded.person_id, serve_past_volunteers.person_id),
         match_method=CASE WHEN excluded.person_id IS NOT NULL THEN excluded.match_method ELSE serve_past_volunteers.match_method END`
    ).bind(evId, dedupeKey(r), r.name, r.email, r.phone, label, r.person_id, r.match_method));
    for (let i = 0; i < stmts.length; i += 50) await db.batch(stmts.slice(i, i + 50));

    const personIds = [...new Set(matched.map((r) => r.person_id).filter(Boolean))];
    let tag = null;
    if (personIds.length) {
      tag = await eventTagId(db, ev.name);
      const tagStmts = personIds.map((pid) => db.prepare('INSERT OR IGNORE INTO person_tags (person_id, tag_id) VALUES (?, ?)').bind(pid, tag.id));
      for (let i = 0; i < tagStmts.length; i += 50) await db.batch(tagStmts.slice(i, i + 50));
    }
    const added = matched.filter((r) => !before.has(dedupeKey(r))).length;
    const summary = {
      ok: true, read: parsed.rows.length, added, updated: matched.length - added,
      in_connect: personIds.length, not_in_connect: matched.filter((r) => !r.person_id).length,
      skipped: parsed.skipped, tag: tag ? tag.name : `${ev.name} volunteer`,
    };
    await db.prepare(
      `INSERT INTO audit_log (action, object_type, object_id, object_json) VALUES ('past_volunteers_imported', 'serve_event', ?, ?)`
    ).bind(evId, JSON.stringify({ ...summary, label, by: sender && sender.username || '' })).run().catch(() => {});
    return json(summary);
  }

  if (rest === '/invite' && method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const link = eventSignupLink(ev);
    const all = await listRows(db, evId);
    const seen = new Set();
    const people = all.filter((r) => {
      if (!r.email || r.signed_up || (r.invited_at && !b.include_invited)) return false;
      const k = r.email.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true;
    });
    if (b.dry_run) {
      return json({ ok: true, count: people.length, names: people.map((p) => p.name || p.email), link,
        already_signed_up: all.filter((r) => r.signed_up).length, already_invited: all.filter((r) => r.invited_at && !r.signed_up).length });
    }
    const subject = String(b.subject || '').trim();
    const body = String(b.body || '').trim();
    if (!subject || !body) return json({ error: 'A subject and a message are both required' }, 400);
    if (!people.length) return json({ error: 'Nobody left to invite' }, 400);
    const resendKey = env.RESEND_API_KEY || ''; const emailFrom = env.EMAIL_FROM || '';
    if (!resendKey || !emailFrom) return json({ error: 'Email not configured (RESEND_API_KEY / EMAIL_FROM missing)' }, 500);
    const replyTo = String((sender && sender.email) || env.REPLY_TO_EMAIL || 'office@timothystl.org').trim();
    let sent = 0; const failed = [];
    for (let i = 0; i < people.length; i += 100) {
      const chunk = people.slice(i, i + 100);
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk.map((p) => ({
          from: emailFrom, to: p.email, reply_to: replyTo,
          subject: fill(subject, p, ev, link).replace(/\s*\n\s*/g, ' '),
          text: fill(body, p, ev, link),
        }))),
      }).catch(() => ({ ok: false }));
      if (!res.ok) { failed.push(...chunk.map((p) => p.email)); continue; }
      sent += chunk.length;
      await db.prepare(
        `UPDATE serve_past_volunteers SET invited_at=datetime('now'), invite_count=invite_count+1 WHERE id IN (${chunk.map(() => '?').join(',')})`
      ).bind(...chunk.map((p) => p.id)).run();
    }
    await db.prepare(
      `INSERT INTO audit_log (action, object_type, object_id, object_json) VALUES ('past_volunteers_invited', 'serve_event', ?, ?)`
    ).bind(evId, JSON.stringify({ subject, sent, failed: failed.length, by: sender && sender.username || '' })).run().catch(() => {});
    if (!sent) return json({ error: 'The email service did not accept the message. Nothing was sent.' }, 502);
    return json({ ok: true, sent, failed: failed.length });
  }

  const one = rest.match(/^\/(\d+)$/);
  if (one && method === 'DELETE') {
    await db.prepare('DELETE FROM serve_past_volunteers WHERE id=? AND event_id=?').bind(parseInt(one[1]), evId).run();
    return json({ ok: true });
  }
  if (rest === '' && method === 'DELETE') {
    const r = await db.prepare('DELETE FROM serve_past_volunteers WHERE event_id=?').bind(evId).run();
    return json({ ok: true, removed: r.meta?.changes ?? 0 });
  }
  return json({ error: 'Not found' }, 404);
}
