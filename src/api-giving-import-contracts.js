import { json } from './auth.js';
import { authorizeGivingBatchContract } from './api-giving-batch-contracts.js';
import { prepareImport, readImport, applyImport, matchImportedDonor, ensureImportSchema } from './giving-import-jobs.js';

export async function handleGivingImportContracts(req, env) {
  const auth = await authorizeGivingBatchContract(req, env, { write: true });
  if (auth.response) return auth.response;
  if (auth.user.role !== 'admin') return json({ error: 'Giving imports require administrator access.' }, 403);
  const url = new URL(req.url);
  try {
    if (req.method === 'GET') {
      if (url.searchParams.get('job')) return json(await readImport(env.DB, url.searchParams.get('job')));
      await ensureImportSchema(env.DB);
      const jobs = (await env.DB.prepare('SELECT id,source,cursor,created_at FROM giving_import_jobs ORDER BY created_at DESC LIMIT 20').all()).results || [];
      const unmatched = (await env.DB.prepare(`SELECT p.person_ref, COUNT(*) AS gifts, MIN(people.id) AS person_id, MIN(TRIM(people.first_name||' '||people.last_name)) AS person_name
        FROM giving_import_people p JOIN giving_entries ge ON ge.breeze_id=p.payment_id LEFT JOIN people ON people.breeze_id=p.person_ref
        WHERE ge.person_id IS NULL AND p.person_ref!='' GROUP BY p.person_ref LIMIT 100`).all()).results || [];
      return json({ jobs, unmatched });
    }
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const text = await req.text();
    if (new TextEncoder().encode(text).length > 1600000) return json({ error: 'Upload at most 1 MB of CSV.' }, 413);
    const body = JSON.parse(text);
    if (body.op === 'preview') return json(await prepareImport(env.DB, env, auth.email, body));
    if (body.op === 'apply') return json(await applyImport(env.DB, String(body.job || ''), auth.email, Number(body.cursor)));
    if (body.op === 'match') return json(await matchImportedDonor(env.DB, String(body.personRef || ''), Number(body.personId), auth.email));
    return json({ error: 'Unknown import action.' }, 400);
  } catch (error) {
    // Do not return database errors, raw upstream responses or donor payloads.
    const message = String(error.message || '');
    const safe = /^(CSV row|Choose|Expected|Upload|Invalid|Negative|A numeric|Payment |Breeze |The official|This preview|Import not found|Only the person|Unclosed|Each fund|Conflicting)/.test(message);
    return json({ error: safe ? message : 'Import could not complete. No changes from the failed step were saved. Reload the preview; concurrent edits may require a new preview.' }, 409);
  }
}
