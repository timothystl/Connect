// Giving impact statements: admin-entered "$X a month more could provide Y" lines, used by the
// Giving Plateaus report and the giving nudge letters to name what a suggested increase would do.
// Real ministry costs are church-specific and never made up by the app. One JSON array in
// giving_settings; read and written by Connect's config/giving-impact and Finance's contracts.
const IMPACT_KEY = 'giving_impact_statements_json';

// "$X a month more could provide Y": what an admin typed, cleaned the way Connect always has.
export function cleanImpactStatements(list) {
  return (Array.isArray(list) ? list : [])
    .map((s) => ({
      monthly_cents: Math.max(0, Math.round(Number(s?.monthly_cents) || 0)),
      label: String(s?.label || '').trim().slice(0, 200),
    }))
    .filter((s) => s.monthly_cents > 0 && s.label)
    .slice(0, 50);
}

export async function readImpactStatements(db) {
  const row = await db.prepare(`SELECT value FROM giving_settings WHERE key='${IMPACT_KEY}'`).first();
  let statements = [];
  try { statements = row?.value ? JSON.parse(row.value) : []; } catch { statements = []; }
  return Array.isArray(statements) ? statements : [];
}

export async function writeImpactStatements(db, list) {
  const cleaned = cleanImpactStatements(list);
  await db.prepare(`INSERT INTO giving_settings(key,value) VALUES('${IMPACT_KEY}',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`)
    .bind(JSON.stringify(cleaned)).run();
  return cleaned;
}
