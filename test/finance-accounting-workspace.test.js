import { describe, expect, it } from 'vitest';
import vm from 'node:vm';
import worker from '../apps/finance/shell.js';
import { accountingWorkspaceTarget } from '../contracts/accounting-workspace.js';
import { ACCOUNTING_BOOT, ACCOUNTING_JS, renderAccountingWorkspace } from '../apps/finance/accounting-workspace.js';
import { plannerViewer } from '../apps/finance/connect-planner.js';
function env(role='admin', permissions={}) {
  const calls=[];
  return { ENVIRONMENT:'production', FINANCE_CONTRACT_API_KEY:'key', RELEASE_SHA:'test', calls,
    CONNECT_SERVICE:{async fetch(req){
      if(new URL(req.url).pathname.endsWith('staff-role-v1'))return Response.json({role,permissions,username:'tester'});
      calls.push({url:req.url,method:req.method,headers:Object.fromEntries(req.headers),body:await req.text()});
      return Response.json({ok:true},{headers:{'Set-Cookie':'not-forwarded','Access-Control-Allow-Origin':'*'}});
    }},
  };
}
const call=(e,path,init={})=>worker.fetch(new Request('https://finance.test'+path,{...init,headers:{'Cf-Access-Jwt-Assertion':'jwt',...(init.headers||{})}}),e);
describe('Finance accounting workspace',()=>{
  it('serves every original accounting panel with Finance-only navigation and no Connect startup',async()=>{
    const r=await call(env(),'/accounting'); const html=await r.text();
    expect(r.status).toBe(200); expect(r.headers.get('cache-control')).toContain('no-store');
    expect(r.headers.get('content-security-policy')).toContain("connect-src 'self'");
    for(const section of ['church','balance','daycare','property','planning','accounts','compensation','fullreport','data'])expect(html).toContain('id="fin-panel-'+section+'"');
    expect(html).not.toContain('id="tab-people"');
    expect(html).toContain('/accounting/app.js?v=test');
    for(const script of [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)])expect(()=>new vm.Script(script[1])).not.toThrow();
    expect(()=>new vm.Script(ACCOUNTING_JS)).not.toThrow();
  });
  it('lets the page scroll: Connect\u2019s stylesheet locks html and body, which only works inside its own app frame',()=>{
    const html = renderAccountingWorkspace({ role: 'admin', permissions: {} }, new URL('https://finance.test/accounting?section=accounts'), 'v');
    expect(html).toContain('html,body{height:auto;overflow:auto}');
  });

  it('denies unknown roles and roles with no accounting access',async()=>{
    for(const role of ['member','volunteer','unknown','staff','council'])expect((await call(env(role),'/accounting')).status).toBe(403);
    expect((await call(env('staff',{budget:'view'}),'/accounting')).status).toBe(200);
    expect(plannerViewer({ok:true,role:'council',permissions:{compensation:'none'}})).toBeNull();
  });
  it('streams file previews intact and forwards only the required identity/content headers',async()=>{
    const e=env(); const form=new FormData();form.set('file',new Blob(['fake workbook']), 'test.xlsx');
    const r=await call(e,'/api/v1/accounting-workspace?path=church%2Fimport-preview',{method:'POST',body:form,headers:{Origin:'https://finance.test',Cookie:'do-not-forward', 'X-Role':'admin'}});
    expect(r.status).toBe(200); expect(e.calls).toHaveLength(1);
    expect(e.calls[0].body).toContain('fake workbook');expect(e.calls[0].headers['content-type']).toContain('multipart/form-data');
    expect(e.calls[0].headers.cookie).toBeUndefined();expect(e.calls[0].headers['x-role']).toBeUndefined();
    expect(e.calls[0].headers['cf-access-jwt-assertion']).toBe('jwt');
    expect(r.headers.get('set-cookie')).toBeNull();expect(r.headers.get('access-control-allow-origin')).toBeNull();
  });
  it('rejects cross-site writes and unlisted targets before contacting Connect',async()=>{
    const e=env();
    expect((await call(e,'/api/v1/accounting-workspace?path=cash-policy',{method:'PUT',headers:{'Sec-Fetch-Site':'cross-site'},body:'{}'})).status).toBe(403);
    expect((await call(e,'/api/v1/accounting-workspace?path=qb%2Fconnect')).status).toBe(404);
    expect(e.calls).toHaveLength(0);
  });
  it('keeps explicit methods, the old deletion controls and query strings bounded',()=>{
    expect(accountingWorkspaceTarget('church/this-year?year=2026','GET').search).toBe('?year=2026');
    expect(accountingWorkspaceTarget('property/ivanhoe/monthly/2026-09','DELETE')).not.toBeNull();
    expect(accountingWorkspaceTarget('property/ivanhoe/monthly/2026-09','PUT')).toBeNull();
    expect(accountingWorkspaceTarget('planning/church?x=1#fragment','GET')).toBeNull();
  });
  it('escapes inline viewer data',()=>{
    const html=renderAccountingWorkspace({role:'admin',permissions:{}},new URL('https://finance.test/accounting?section=%3C/script%3E'),'v');
    expect(html).toContain('\\u003c/script>');
  });
});
