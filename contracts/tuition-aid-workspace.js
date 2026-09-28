// What Finance still asks Connect about Tuition Aid (apps/finance/tuition-service.js), now that the
// tuition_* tables live in Finance's database and Finance's planner reads and writes them itself:
// the move's checked copy and status (tuition-aid/storage), and the planner's "link a student to a
// person" search (people, GET with q only). This is not a general proxy.
const ROUTES = new Map([
  ['tuition-aid/storage', ['GET']],
]);
const DYNAMIC = [];

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
