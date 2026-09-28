// ── Compensation plan year ───────────────────────────────────────────────────────────────────
// What remains of the retired Plan (new view) roster editor: the plan year every Compensation
// page defaults to. The roster itself is edited on the Planner (apps/finance/planner/); the
// compensation-plan-write-v1 relay's add/edit/remove actions in shell.js remain as that API.

export function defaultCompensationTargetYear(now = new Date()) {
  return now.getUTCFullYear() + 1;
}
