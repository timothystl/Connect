// Explicit surface for the Tuition Aid planner hosted in Finance (apps/finance/tuition-aid-
// workspace.js). Only the planner's own Connect calls are allowed, method by method; this is not a
// general proxy. `people` is the planner's "link a student to a person" search (GET with q only).
const ROUTES = new Map([
  ['tuition-aid/students', ['GET', 'POST']],
  ['tuition-aid/students/bulk', ['POST']],
  ['tuition-aid/config', ['PATCH']],
  ['tuition-aid/year-pins/bulk', ['POST']],
  ['tuition-aid/import-history', ['POST']],
  ['tuition-aid/history', ['PUT']],
  ['tuition-aid/storage', ['GET']],
]);
const DYNAMIC = [
  [/^tuition-aid\/students\/\d+$/, ['PATCH', 'DELETE']],
  [/^tuition-aid\/students\/\d+\/years\/[^/?#]+$/, ['PUT', 'DELETE']],
  [/^tuition-aid\/year-rates\/[^/?#]+$/, ['PUT']],
];

export function tuitionAidWorkspaceTarget(value, method) {
  if (typeof value !== 'string' || value.length > 2048 || /[\\#]/.test(value)) return null;
  const [path, query = ''] = value.split('?');
  if (path === 'people') {
    const params = new URLSearchParams(query);
    if (method !== 'GET' || !params.get('q') || [...params.keys()].some((k) => !['q', 'limit'].includes(k))) return null;
    return new URL('/admin/api/' + value, 'https://connect.timothystl.org');
  }
  const methods = ROUTES.get(path) || DYNAMIC.find(([pattern]) => pattern.test(path))?.[1];
  if (!methods?.includes(method)) return null;
  return new URL('/admin/api/' + value, 'https://connect.timothystl.org');
}
