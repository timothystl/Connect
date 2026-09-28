// The Tuition Aid planner hosted in Finance reaches Connect's own tuition-aid handlers here, with
// an independently verified Access identity. The caller cannot supply a role or username; the
// verified user's Connect role goes through the same ACCESS_GATE (tuitionaid view/edit, and the
// directory permission for the people search) as Connect's own Tuition Aid tab.
import { json } from './auth.js';
import { verifyAccessJwt } from './access-jwt.js';
import { handleChmsApi } from './api-chms.js';
import { tuitionAidWorkspaceTarget } from '../contracts/tuition-aid-workspace.js';

export async function handleTuitionAidWorkspaceContract(req, env) {
  const target = tuitionAidWorkspaceTarget(new URL(req.url).searchParams.get('path'), req.method);
  if (!target) return json({ error: 'Unknown tuition aid operation' }, 404);
  const teamDomain = env.FINANCE_ACCESS_TEAM_DOMAIN;
  const audience = env.FINANCE_ACCESS_AUD;
  if (!teamDomain || !audience) return json({ error: 'Access verification not configured' }, 503);
  const email = await verifyAccessJwt(req.headers.get('Cf-Access-Jwt-Assertion') || '', { teamDomain, audience });
  if (!email) return json({ error: 'Unauthorized' }, 401);
  const user = await env.DB.prepare('SELECT username, role FROM app_users WHERE LOWER(email)=? AND active=1 LIMIT 1').bind(email).first();
  if (!user || ['member', 'volunteer'].includes(user.role)) return json({ error: 'Access denied' }, 403);
  const headers = new Headers();
  if (req.headers.has('Content-Type')) headers.set('Content-Type', req.headers.get('Content-Type'));
  const forwarded = new Request(target, { method: req.method, headers,
    ...(!['GET', 'HEAD'].includes(req.method) ? { body: req.body, duplex: 'half' } : {}),
  });
  return handleChmsApi(forwarded, env, target, req.method, target.pathname.slice('/admin/api/'.length), user.role, user);
}
