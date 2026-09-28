// ── Online giving form settings, relayed from Finance's Giving Entry → Online giving form page ──
// The settings stay in Connect (the fee percentage in giving_settings, the public-form flag on
// funds), because the public form, checkout, and recurring signups all read them here. Finance
// renders the page and relays edits through these routes, the same way its Gift Entry pages do.
// Identity and permission come from authorizeGivingBatchContract: reads need Giving view or
// edit, writes need Giving edit or admin.
import { json } from './auth.js';
import { authorizeGivingBatchContract } from './api-giving-batch-contracts.js';
import {
  loadEstimatedFeeRate, saveFeePercent, feeRateToPercent, DEFAULT_FEE_RATE, MAX_FEE_RATE,
} from './stax-giving-mockup.js';

export async function respondWithGivingOnlineSettingsV1(db) {
  const funds = (await db.prepare(
    'SELECT id, name, public_giving FROM funds WHERE active=1 ORDER BY sort_order, name'
  ).all()).results || [];
  return json({
    fee_percent: feeRateToPercent(await loadEstimatedFeeRate(db)),
    default_fee_percent: feeRateToPercent(DEFAULT_FEE_RATE),
    max_fee_percent: feeRateToPercent(MAX_FEE_RATE),
    funds: funds.map((f) => ({ id: f.id, name: f.name, public_giving: f.public_giving ? 1 : 0 })),
  });
}

// Body: { op: 'fee', fee_percent } or { op: 'funds', public_fund_ids: [id, ...] }. The funds op
// sets the flag on every ACTIVE fund, checked or not, so an unchecked box really turns a fund off.
export async function applyGivingOnlineSettingsWrite(db, body, email) {
  if (body.op === 'fee') {
    const saved = await saveFeePercent(db, body.fee_percent);
    if (saved.error) return { error: saved.error };
    await audit(db, 'giving_online_fee', 'fee_percent', String(saved.percent), email);
    return { ok: true, fee_percent: saved.percent };
  }
  if (body.op === 'funds') {
    const raw = Array.isArray(body.public_fund_ids) ? body.public_fund_ids : [];
    const chosen = new Set(raw.map((id) => parseInt(id, 10)).filter(Number.isInteger));
    const active = (await db.prepare('SELECT id FROM funds WHERE active=1').all()).results || [];
    if (!active.length) return { error: 'No active funds to update.' };
    await db.batch(active.map((f) => db.prepare('UPDATE funds SET public_giving=? WHERE id=?').bind(chosen.has(f.id) ? 1 : 0, f.id)));
    const count = active.filter((f) => chosen.has(f.id)).length;
    await audit(db, 'giving_online_funds', 'public_giving', String(count), email);
    return { ok: true, public_count: count };
  }
  return { error: 'Unknown action.' };
}

async function audit(db, action, field, value, email) {
  await db.prepare(
    `INSERT INTO audit_log(action,entity_type,entity_id,person_name,field,old_value,new_value)
     VALUES(?, 'giving_settings', NULL, '', ?, '', ?)`
  ).bind(`${action}_via_finance`, `${field}=${value}`, email).run().catch(() => {});
}

export async function handleGivingOnlineContracts(req, env, path) {
  if (path === '/api/contracts/giving-online-settings-v1' && req.method === 'GET') {
    const auth = await authorizeGivingBatchContract(req, env, { write: false });
    if (auth.response) return auth.response;
    return respondWithGivingOnlineSettingsV1(env.DB);
  }
  if (path === '/api/contracts/giving-online-settings-write-v1' && req.method === 'POST') {
    const auth = await authorizeGivingBatchContract(req, env, { write: true });
    if (auth.response) return auth.response;
    let body;
    try { body = await req.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
    const result = await applyGivingOnlineSettingsWrite(env.DB, body || {}, auth.email);
    if (result.error) return json({ error: result.error }, 400);
    return json(result);
  }
  return null;
}

