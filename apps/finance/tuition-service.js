// Tuition Aid in Finance (Andrew, September 28, 2026: Tuition Aid moves to Finance for good).
// The tuition_* tables live in Finance's own database (moved there by Connect's Worker and checked
// row for row, src/tuition-storage.js), and this is now their only writer: the planner page
// (tuition-planner/) calls /api/v1/tuition?path=..., answered here straight from FINANCE_DB with
// the same handlers Connect used (src/api-tuition-aid.js). Every call checks the caller's live
// Connect role and Tuition Aid permission. Connect is asked for two things only: to finish the
// move if Finance does not yet hold a verified copy, and the link-a-person search.
import { handleTuitionAidApi } from '../../src/api-tuition-aid.js';
import { TUITION_FINANCE_SCHEMA } from '../../src/tuition-storage.js';
import { fetchVerifiedRole } from './connect-role-client.js';
import { isSameOriginPost } from './form-post.js';

// Anyone whose Connect role has Tuition Aid view or edit (admin always).
export function tuitionAidViewer(result) {
  if (!result?.ok) return null;
  if (result.role === 'admin') return { role: 'admin', permissions: { tuitionaid: 'edit' } };
  if (['member', 'volunteer', 'compensation'].includes(result.role)) return null;
  const level = result.permissions?.tuitionaid;
  return ['view', 'edit'].includes(level) ? { role: result.role, permissions: { tuitionaid: level } } : null;
}

// The planner's operations, method by method; nothing else is answered.
const ROUTES = new Map([
  ['tuition-aid/students', ['GET', 'POST']],
  ['tuition-aid/students/bulk', ['POST']],
  ['tuition-aid/config', ['PATCH']],
  ['tuition-aid/year-pins/bulk', ['POST']],
  ['tuition-aid/import-history', ['POST']],
]);
const DYNAMIC = [
  [/^tuition-aid\/students\/\d+$/, ['PATCH', 'DELETE']],
  [/^tuition-aid\/students\/\d+\/years\/[^/?#]{1,20}$/, ['PUT', 'DELETE']],
  [/^tuition-aid\/year-rates\/[^/?#]{1,20}$/, ['PUT']],
];

export function tuitionOperation(path, method) {
  if (typeof path !== 'string' || path.length > 200 || /[\\#?]/.test(path)) return null;
  if (path === 'people') return method === 'GET' ? 'people' : null;
  const methods = ROUTES.get(path) || DYNAMIC.find(([pattern]) => pattern.test(path))?.[1];
  return methods?.includes(method) ? 'tuition' : null;
}

const MOVE_FAILED = 'The move of the tuition records to Finance’s database did not pass its check, so Tuition Aid is paused. Connect still has every record; nothing was changed.';
const NOT_MOVED = 'The tuition records have not been moved into Finance’s database yet, so Tuition Aid cannot open here.';

async function latestMove(db) {
  for (const sql of TUITION_FINANCE_SCHEMA) await db.prepare(sql).run();
  return db.prepare('SELECT status FROM tuition_storage_migration ORDER BY id DESC LIMIT 1').first();
}

async function connectContract(env, jwt, path) {
  return env.CONNECT_SERVICE.fetch(new Request(`https://connect.timothystl.org/api/contracts/tuition-aid-workspace-v1?path=${encodeURIComponent(path)}`, {
    headers: { 'X-Contract-Key': env.FINANCE_CONTRACT_API_KEY, 'Cf-Access-Jwt-Assertion': jwt, Accept: 'application/json' },
    redirect: 'manual',
  }));
}

// Finance serves the tables only from a copy Connect's Worker verified row for row. Until that
// exists, Connect is asked once to finish the move (its storage call runs the checked copy).
export async function ensureTuitionReady(env, jwt) {
  const db = env.FINANCE_DB;
  if (!db) return { ok: false, message: 'Finance’s database is not connected.' };
  let move = await latestMove(db);
  if (move?.status === 'verified') return { ok: true };
  if (move?.status === 'failed') return { ok: false, message: MOVE_FAILED };
  let connectError = '';
  try {
    const res = await connectContract(env, jwt, 'tuition-aid/storage');
    if (!res.ok) connectError = (await res.json().catch(() => ({}))).error || '';
  } catch { connectError = ''; }
  move = await latestMove(db);
  if (move?.status === 'verified') return { ok: true };
  if (move?.status === 'failed') return { ok: false, message: MOVE_FAILED };
  return { ok: false, message: connectError ? `${NOT_MOVED} Connect said: ${String(connectError).slice(0, 200)}` : NOT_MOVED };
}

// A short line for the page: counts and when, never names.
export async function tuitionMoveSummary(db) {
  const row = await db.prepare('SELECT finished_at, manifest FROM tuition_storage_migration WHERE status=\'verified\' ORDER BY id DESC LIMIT 1').first().catch(() => null);
  if (!row) return null;
  let students = null;
  try {
    const manifest = JSON.parse(row.manifest || '[]');
    students = (Array.isArray(manifest) ? manifest : manifest.expected || []).find((t) => t.table === 'tuition_students')?.count ?? null;
  } catch { students = null; }
  return { movedAt: String(row.finished_at || '').slice(0, 10), students };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  } });
}

export async function handleTuitionApi(request, env, url) {
  const method = request.method === 'HEAD' ? 'GET' : request.method;
  const path = url.searchParams.get('path');
  const op = tuitionOperation(path, method);
  if (!op) return jsonResponse({ error: 'Unknown Tuition Aid operation' }, 404);
  if (method !== 'GET' && !isSameOriginPost(request, url)) return jsonResponse({ error: 'That change did not come from Timothy Finance. Nothing was saved.' }, 403);
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion') || '';
  // Checked live on every call; a cached role never authorizes a save.
  const viewer = tuitionAidViewer(await fetchVerifiedRole(env, jwt));
  if (!viewer) return jsonResponse({ error: 'Access denied: Tuition Aid access could not be verified.' }, 403);
  if (method !== 'GET' && viewer.permissions.tuitionaid !== 'edit') return jsonResponse({ error: 'Access denied: your Tuition Aid access is view only. Nothing was saved.' }, 403);

  if (op === 'people') {
    const q = String(url.searchParams.get('q') || '').trim().slice(0, 80);
    if (q.length < 2) return jsonResponse({ people: [] });
    try {
      const res = await connectContract(env, jwt, `people?q=${encodeURIComponent(q)}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return jsonResponse({ error: body.error || 'The people search is unavailable.' }, res.status === 403 ? 403 : 502);
      // Only what the link needs.
      return jsonResponse({ people: (body.people || []).slice(0, 25).map((p) => ({
        id: p.id, first_name: p.first_name || '', last_name: p.last_name || '',
        household_id: p.household_id ?? null, household_name: p.household_name || '',
      })) });
    } catch { return jsonResponse({ error: 'The people search is unavailable.' }, 502); }
  }

  const ready = await ensureTuitionReady(env, jwt);
  if (!ready.ok) return jsonResponse({ error: ready.message }, 503);
  try {
    // Finance has no people table: a linked person's name and household come from the search
    // result the planner sent with the link.
    const result = await handleTuitionAidApi(request, env, url, method, path, env.FINANCE_DB, true, null);
    if (!result) return jsonResponse({ error: 'Unknown Tuition Aid operation' }, 404);
    let body = await result.text();
    if (path === 'tuition-aid/students' && method === 'GET' && result.ok) {
      body = JSON.stringify({ ...JSON.parse(body), moved: await tuitionMoveSummary(env.FINANCE_DB) });
    }
    return new Response(body, { status: result.status, headers: {
      'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    } });
  } catch {
    return jsonResponse({ error: 'The save failed. Reload the planner to see what is stored, then try again.' }, 500);
  }
}
