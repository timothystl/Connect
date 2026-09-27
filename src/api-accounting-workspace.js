// Same business handlers and authorization as Connect's accounting UI, reached with an
// independently verified Access identity. The caller cannot supply a role or username.
import { json } from './auth.js';
import { verifyAccessJwt } from './access-jwt.js';
import { handleChmsApi } from './api-chms.js';
import { accountingWorkspaceTarget } from '../contracts/accounting-workspace.js';

export async function handleAccountingWorkspaceContract(req, env) {
  const target = accountingWorkspaceTarget(new URL(req.url).searchParams.get('path'), req.method);
  if (!target) return json({ error: 'Unknown accounting operation' }, 404);
  const teamDomain = env.FINANCE_ACCESS_TEAM_DOMAIN;
  const audience = env.FINANCE_ACCESS_AUD;
  if (!teamDomain || !audience) return json({ error: 'Access verification not configured' }, 503);
  const email = await verifyAccessJwt(req.headers.get('Cf-Access-Jwt-Assertion') || '', { teamDomain, audience });
  if (!email) return json({ error: 'Unauthorized' }, 401);
  const user = await env.DB.prepare('SELECT username, role FROM app_users WHERE LOWER(email)=? AND active=1 LIMIT 1').bind(email).first();
  if (!user || !['admin', 'finance', 'staff', 'council', 'compensation'].includes(user.role)) return json({ error: 'Access denied' }, 403);
  // No session cookies, caller-supplied actor headers or redirect targets enter the legacy handler.
  const headers = new Headers();
  if (req.headers.has('Content-Type')) headers.set('Content-Type', req.headers.get('Content-Type'));
  const forwarded = new Request(target, { method: req.method, headers,
    ...(!['GET', 'HEAD'].includes(req.method) ? { body: req.body, duplex: 'half' } : {}),
  });
  return handleChmsApi(forwarded, env, target, req.method, target.pathname.slice('/admin/api/'.length), user.role, user);
}
