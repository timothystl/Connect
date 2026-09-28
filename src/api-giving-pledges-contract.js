// ── Pledges kept from Finance (Andrew, Sept 28 2026: Giving moves to Finance) ─────────────────
// Finance › Giving › Pledge list names each pledge for a year and adds, changes or removes one.
// The pledges table stays in Connect until the Giving data moves, so this contract reads and
// writes it exactly as Connect's person Giving record does (one annual amount per person per
// year, upserted on person and year):
//
//   GET  giving-pledges-v1?year=&q=   the year's pledges with what each pledger has given that
//                                     year (voided gifts are $0), and a name search for adding one
//   POST giving-pledges-write-v1      { op: 'set', person_id, fiscal_year, amount_cents, note }
//                                     { op: 'delete', person_id, fiscal_year }
//
// Pledges name people, so reading needs Giving view and writing Giving edit (council refused).
import { json } from './auth.js';
import { authorizeGivingAnalyticsContract } from './api-giving-analytics-contracts.js';

const yearOf = (v) => {
  const y = Number.parseInt(v, 10);
  return Number.isInteger(y) && y >= 2000 && y <= 2100 ? y : null;
};

export async function readPledges(db, year, today) {
  const through = today.slice(0, 4) === String(year) ? today : `${year}-12-31`;
  const rows = (await db.prepare(
    `SELECT pl.person_id, pl.fiscal_year, pl.amount_cents, pl.note, pl.updated_at,
            p.first_name, p.last_name, h.name AS household_name,
            COALESCE((SELECT SUM(ge.amount) FROM giving_entries ge
                       WHERE ge.person_id=pl.person_id AND ge.contribution_date BETWEEN ? AND ?),0) AS given_cents
       FROM pledges pl JOIN people p ON p.id=pl.person_id LEFT JOIN households h ON h.id=p.household_id
      WHERE pl.fiscal_year=?
      ORDER BY p.last_name COLLATE NOCASE, p.first_name COLLATE NOCASE`
  ).bind(`${year}-01-01`, through, year).all()).results || [];
  return { year, through, pledges: rows };
}

export async function searchPeople(db, q) {
  const needle = String(q || '').trim().slice(0, 60);
  if (needle.length < 2) return [];
  const like = `%${needle.replace(/[%_]/g, '')}%`;
  return (await db.prepare(
    `SELECT p.id, p.first_name, p.last_name, h.name AS household_name
       FROM people p LEFT JOIN households h ON h.id=p.household_id
      WHERE (p.first_name || ' ' || p.last_name) LIKE ? OR p.last_name LIKE ? OR h.name LIKE ?
      ORDER BY p.last_name COLLATE NOCASE, p.first_name COLLATE NOCASE LIMIT 20`
  ).bind(like, like, like).all()).results || [];
}

export async function writePledge(db, body) {
  const b = body && typeof body === 'object' ? body : {};
  const personId = Number.parseInt(b.person_id, 10);
  const year = yearOf(b.fiscal_year);
  if (!Number.isInteger(personId) || personId <= 0 || !year) return { error: 'Choose a person and a year.' };
  if (b.op === 'delete') {
    const r = await db.prepare('DELETE FROM pledges WHERE person_id=? AND fiscal_year=?').bind(personId, year).run();
    return { ok: true, op: 'delete', removed: r?.meta?.changes || 0 };
  }
  if (b.op !== 'set') return { error: 'Unknown pledge operation.' };
  const amountCents = Math.round(Number(b.amount_cents));
  if (!Number.isFinite(amountCents) || amountCents < 0 || amountCents > 100_000_000_00) return { error: 'The pledge must be a dollar amount of zero or more.' };
  const person = await db.prepare('SELECT id FROM people WHERE id=?').bind(personId).first();
  if (!person) return { error: 'That person is not in Connect.', status: 404 };
  await db.prepare(
    `INSERT INTO pledges(person_id, fiscal_year, amount_cents, note, updated_at)
     VALUES(?,?,?,?,datetime('now'))
     ON CONFLICT(person_id, fiscal_year) DO UPDATE SET
       amount_cents=excluded.amount_cents, note=excluded.note, updated_at=datetime('now')`
  ).bind(personId, year, amountCents, String(b.note || '').slice(0, 500)).run();
  return { ok: true, op: 'set' };
}

export async function handleGivingPledgesContracts(req, env, path) {
  if (path === '/api/contracts/giving-pledges-v1' && req.method === 'GET') {
    const auth = await authorizeGivingAnalyticsContract(req, env, { level: 'people' });
    if (auth.response) return auth.response;
    const url = new URL(req.url);
    const today = new Date().toISOString().slice(0, 10);
    const year = yearOf(url.searchParams.get('year')) || Number(today.slice(0, 4));
    const [list, people] = await Promise.all([readPledges(env.DB, year, today), searchPeople(env.DB, url.searchParams.get('q'))]);
    return json({ contract: 'connect.giving-pledges.v1', ...list, people });
  }
  if (path === '/api/contracts/giving-pledges-write-v1' && req.method === 'POST') {
    const auth = await authorizeGivingAnalyticsContract(req, env, { level: 'write' });
    if (auth.response) return auth.response;
    let body = {};
    try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const result = await writePledge(env.DB, body);
    return result.error ? json({ error: result.error }, result.status || 400) : json(result);
  }
  return null;
}
