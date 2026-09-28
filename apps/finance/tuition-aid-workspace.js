// The Tuition Aid planner, now in Finance (Andrew, Sept 28 2026: Tuition Aid moves to Finance for
// good). This serves Connect's own planner (markup, the four pop-up forms, and js-tuition-aid.js
// from the same bundle the accounting workspace uses), so every slider, gauge, auto-balance and
// import behaves exactly as it did in Connect. Only startup and the API transport differ: the
// planner's calls go to /api/v1/tuition-aid-workspace, which relays the explicitly allowed
// operations (contracts/tuition-aid-workspace.js) to Connect's tuition-aid-workspace-v1 with the
// caller's Access identity. Connect's ACCESS_GATE still decides view/edit for each call. The
// tuition records stay in Connect's database until they are moved to Finance's.
import { HTML_TABS_2 } from '../../src/frontend/html-tabs.js';
import { fetchVerifiedRole } from './connect-role-client.js';
import { isSameOriginPost } from './form-post.js';
import { tuitionAidWorkspaceTarget } from '../../contracts/tuition-aid-workspace.js';

function slice(startMarker, endMarker) {
  const start = HTML_TABS_2.indexOf(startMarker);
  const end = HTML_TABS_2.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error(`Tuition Aid markup not found: ${startMarker}`);
  return HTML_TABS_2.slice(start, end);
}
function modal(id) {
  const start = HTML_TABS_2.indexOf(`<div class="modal-overlay" id="${id}">`);
  if (start < 0) throw new Error(`Tuition Aid modal not found: ${id}`);
  // A modal ends at the first top-level closing tag: a line that is exactly "</div>".
  const end = HTML_TABS_2.indexOf('\n</div>', start);
  return HTML_TABS_2.slice(start, end + '\n</div>'.length);
}
const MARKUP = slice('<div id="tab-tuitionaid"', '<!-- ═══ FINANCE OVERVIEW TAB ═══ -->');
const MODALS = ['tap-student-modal', 'tap-link-modal', 'tap-history-modal', 'tap-past-add-modal', 'tap-import-modal'].map(modal).join('\n');
const safeJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

// Anyone whose Connect role has Tuition Aid view or edit (admin always). Connect re-checks every
// call; this only decides whether to serve the page.
export function tuitionAidViewer(result) {
  if (!result?.ok) return null;
  if (result.role === 'admin') return { role: 'admin', permissions: { tuitionaid: 'edit' } };
  if (['member', 'volunteer', 'compensation'].includes(result.role)) return null;
  const level = result.permissions?.tuitionaid;
  return ['view', 'edit'].includes(level) ? { role: result.role, permissions: { tuitionaid: level } } : null;
}

export const TUITION_AID_BOOT = String.raw`(function(){
  window.__restoreTuitionListeners();
  var cfg=window.__TUITION_AID__;
  _userRole=cfg.role; _perm=cfg.permissions; _userPermissions.finance=true; _userPermissions.tuitionaid=true;
  function call(path, opts){
    return fetch(path,opts||{}).then(function(r){return r.json().catch(function(){return {};}).then(function(d){
      if(!r.ok) throw new Error(d.error||('Request failed ('+r.status+')')); return d;
    });});
  }
  api=function(path,opts){
    if(path.indexOf('/admin/api/')!==0) return Promise.reject(new Error('Not a tuition aid operation'));
    return call('/api/v1/tuition-aid-workspace?path='+encodeURIComponent(path.slice('/admin/api/'.length)),opts);
  };
  showTab=function(){};
  var tab=document.getElementById('tab-tuitionaid'); if(tab) tab.classList.add('active');
  loadTuitionAid();
})();`;
const SHIM = `(function(){var add=window.addEventListener;window.addEventListener=function(t,f,o){if(t==='load'||t==='popstate'||t==='hashchange')return;return add.call(window,t,f,o);};window.__restoreTuitionListeners=function(){window.addEventListener=add;};})();`;

export function renderTuitionAidWorkspace(viewer, version) {
  const v = encodeURIComponent(version || 'dev');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tuition Aid planner · Timothy Finance</title><link rel="stylesheet" href="/accounting/app.css?v=${v}">
<style>html,body{height:auto!important;overflow:auto!important}body{margin:0;background:var(--warm-bg,#F3F7FA)}#tab-tuitionaid{display:block!important}.workspace-header{padding:14px 20px;background:#fff;border-bottom:1px solid #ddd;display:flex;gap:20px;align-items:center;flex-wrap:wrap}.workspace-header small{color:#5B6475}@media print{.workspace-header{display:none}}</style>
</head><body><header class="workspace-header"><strong>Timothy Finance · Tuition Aid planner</strong><a href="/" target="_top">Finance home</a>${viewer.permissions.tuitionaid === 'view' ? '<small>View only — changes need Tuition Aid edit access.</small>' : ''}</header>
<div id="error-boundary" style="display:none"></div>${MARKUP}${MODALS}
<script>window.__TUITION_AID__=${safeJson({ role: viewer.role, permissions: { tuitionaid: viewer.permissions.tuitionaid } })};${SHIM}</script>
<script src="/accounting/app.js?v=${v}"></script><script>${TUITION_AID_BOOT}</script></body></html>`;
}

export async function relayTuitionAidWorkspace(request, env, url) {
  const json = (error, status) => new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  const path = url.searchParams.get('path');
  if (!tuitionAidWorkspaceTarget(path, request.method)) return json('Unknown tuition aid operation', 404);
  if (request.method !== 'GET' && !isSameOriginPost(request, url)) return json('Cross-site request refused', 403);
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion') || '';
  // Checked live on every call; a cached role never authorizes a save.
  const viewer = tuitionAidViewer(await fetchVerifiedRole(env, jwt));
  if (!viewer) return json('Access denied: Tuition Aid access could not be verified', 403);
  if (request.method !== 'GET' && viewer.permissions.tuitionaid !== 'edit') return json('Access denied: view-only Tuition Aid access', 403);
  const headers = new Headers({ 'X-Contract-Key': env.FINANCE_CONTRACT_API_KEY, 'Cf-Access-Jwt-Assertion': jwt });
  if (request.headers.has('Content-Type')) headers.set('Content-Type', request.headers.get('Content-Type'));
  try {
    const upstream = await env.CONNECT_SERVICE.fetch(new Request(`https://connect.timothystl.org/api/contracts/tuition-aid-workspace-v1?path=${encodeURIComponent(path)}`, {
      method: request.method, headers, redirect: 'manual',
      ...(!['GET', 'HEAD'].includes(request.method) ? { body: request.body, duplex: 'half' } : {}),
    }));
    if (upstream.status >= 300 && upstream.status < 400) return json('Unexpected tuition aid redirect', 502);
    return new Response(upstream.body, { status: upstream.status, headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    } });
  } catch { return json('Tuition aid service unavailable. Reload before retrying a save to check whether it completed.', 502); }
}
