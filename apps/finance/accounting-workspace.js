// Preserve the established accounting screens inside Finance while the newer views evolve.
// Assets and markup come from Connect's source, so import, forecast, print and editing controls
// stay identical. Only startup/navigation and the authenticated API transport differ.
import { HTML_TABS_2 } from '../../src/frontend/html-tabs.js';
import { CONNECT_PLANNER_JS, CONNECT_PLANNER_CSS, CONNECT_PLANNER_CSP } from './connect-planner.js';
import { fetchVerifiedRole } from './connect-role-client.js';
import { isSameOriginPost } from './form-post.js';
import { accountingWorkspaceTarget } from '../../contracts/accounting-workspace.js';

export { CONNECT_PLANNER_JS as ACCOUNTING_JS, CONNECT_PLANNER_CSS as ACCOUNTING_CSS, CONNECT_PLANNER_CSP as ACCOUNTING_CSP };
const start = HTML_TABS_2.indexOf('<div id="tab-finance"');
const end = HTML_TABS_2.indexOf('</div><!-- /content-area -->', start);
if (start < 0 || end < 0) throw new Error('Accounting workspace markup not found');
const MARKUP = HTML_TABS_2.slice(start, end);
const safeJson = value => JSON.stringify(value).replace(/</g, '\\u003c');

export function accountingViewer(result) {
  if (!result?.ok) return null;
  if (result.role === 'admin' || result.role === 'compensation') return result;
  if (!['finance', 'staff', 'council'].includes(result.role)) return null;
  return ['finance', 'budget', 'compensation'].some(item => ['view', 'edit'].includes(result.permissions?.[item])) ? result : null;
}

const SHIM = `(function(){var add=window.addEventListener;window.addEventListener=function(t,f,o){if(t==='load'||t==='popstate'||t==='hashchange')return;return add.call(window,t,f,o);};window.__restoreAccountingListeners=function(){window.addEventListener=add;};})();`;
export const ACCOUNTING_BOOT = String.raw`(function(){
  window.__restoreAccountingListeners();
  var cfg=window.__ACCOUNTING__;
  _userRole=cfg.role; _perm=cfg.permissions; _userPermissions.finance=true;
  function call(path, opts){
    return fetch(path,opts||{}).then(function(r){return r.json().catch(function(){return {};}).then(function(d){
      if(!r.ok) throw new Error(d.error||('Request failed ('+r.status+')')); return d;
    });});
  }
  api=function(path,opts){
    var base=path.split('?')[0], method=((opts&&opts.method)||'GET').toUpperCase();
    if(base==='/admin/api/finance/planning/salary'){
      if(method==='GET' && cfg.role!=='finance' && cfg.role!=='staff') return call('/api/v1/connect-planner/salary');
      if(method==='PUT') return call('/api/v1/connect-planner/salary-save',{method:'POST',headers:{'Content-Type':'application/json'},body:opts.body});
    }
    if(path.indexOf('/admin/api/finance/')!==0) return Promise.reject(new Error('Not an accounting operation'));
    return call('/api/v1/accounting-workspace?path='+encodeURIComponent(path.slice('/admin/api/finance/'.length)),opts);
  };
  // QuickBooks has one connection, owned by Finance. Its existing native screens provide all
  // OAuth/sync/transaction controls; never send those operations to the retired Connect owner.
  finRenderConnection=function(){var el=document.getElementById('fin-connection');if(el){var badge=el.previousElementSibling&&el.previousElementSibling.lastElementChild;if(badge){badge.textContent='Managed in Finance';badge.className='fin-chip';}el.innerHTML='<p><a href="/?section=quickbooks">Open QuickBooks connection and sync</a></p>';}};
  finRenderQboTxnsCard=function(){return '<h3>QuickBooks transactions</h3><p><a href="/?section=quickbooks&page=transactions">Open transactions, vendor spend and expense detail</a></p>';};
  // Keep navigation within this workspace; Connect's app/session/service-worker startup is off.
  showTab=function(name,section){
    if(name!=='finance') return;
    var visible=finVisibleNavItems();
    var item=visible.filter(function(i){return i.finSection===section;})[0]||visible[0];
    if(!item)return;
    _finActiveNavId=item.id;
    history.replaceState(null,'','/accounting?section='+encodeURIComponent(item.finSection));
    finRenderSubnavMounts();finShowSection(item.finSection);loadFinance();
  };
  showTab('finance',cfg.section);
})();`;

export function renderAccountingWorkspace(viewer, url, version) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Accounting workspace · Timothy Finance</title><link rel="stylesheet" href="/accounting/app.css?v=${encodeURIComponent(version || 'dev')}">
<style>body{margin:0;background:var(--warm-bg,#F3F7FA)}#tab-finance{display:block!important}.workspace-header{padding:14px 20px;background:#fff;border-bottom:1px solid #ddd;display:flex;gap:20px;align-items:center}@media print{.workspace-header{display:none}}</style>
</head><body><header class="workspace-header"><strong>Timothy Finance · Accounting workspace</strong><a href="/" target="_top">New Finance pages</a><a href="/?section=quickbooks" target="_top">QuickBooks</a></header>
<div id="error-boundary" style="display:none"></div>${MARKUP}
<script>window.__ACCOUNTING__=${safeJson({ role: viewer.role, permissions: viewer.permissions || {}, section: url.searchParams.get('section') || 'health' })};${SHIM}</script>
<script src="/accounting/app.js?v=${encodeURIComponent(version || 'dev')}"></script><script>${ACCOUNTING_BOOT}</script></body></html>`;
}

export async function relayAccountingWorkspace(request, env, url) {
  const json = (error, status) => new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  const path = url.searchParams.get('path');
  if (!accountingWorkspaceTarget(path, request.method)) return json('Unknown accounting operation', 404);
  if (request.method !== 'GET' && !isSameOriginPost(request, url)) return json('Cross-site request refused', 403);
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion') || '';
  // Live checks on every operation: role-cache fallback must never authorize a save.
  if (!accountingViewer(await fetchVerifiedRole(env, jwt))) return json('Access denied: accounting role could not be verified', 403);
  const headers = new Headers({ 'X-Contract-Key': env.FINANCE_CONTRACT_API_KEY, 'Cf-Access-Jwt-Assertion': jwt });
  if (request.headers.has('Content-Type')) headers.set('Content-Type', request.headers.get('Content-Type'));
  try {
    const upstream = await env.CONNECT_SERVICE.fetch(new Request('https://connect.timothystl.org/api/contracts/finance-workspace-v1?path='+encodeURIComponent(path), {
      method: request.method, headers, redirect: 'manual',
      ...(!['GET', 'HEAD'].includes(request.method) ? { body: request.body, duplex: 'half' } : {}),
    }));
    // Do not forward cookies, redirect locations, CORS grants or cache headers across products.
    if (upstream.status >= 300 && upstream.status < 400) return json('Unexpected accounting redirect', 502);
    return new Response(upstream.body, { status: upstream.status, headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    } });
  } catch { return json('Accounting service unavailable. Reload before retrying a save to check whether it completed.', 502); }
}
