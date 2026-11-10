import { execFileSync } from 'node:child_process';
import { readFileSync, appendFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
const files=['migrations/0066_member_login_atomic.sql','migrations/0067_stax_reversal_events.sql','migrations/0068_stax_payment_intents.sql'];
const local=new DatabaseSync(':memory:');
for(const f of files) local.exec(readFileSync(f,'utf8'));
const expected=local.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all();
const tables=expected.filter(x=>x.type==='table').map(x=>x.name);
const sql="SELECT type,name,tbl_name,sql FROM sqlite_master WHERE tbl_name IN ("+tables.map(t=>"'"+t+"'").join(',')+") AND name NOT LIKE 'sqlite_%' ORDER BY name";
const normalize=s=>s.toLowerCase().replace(/if\s+not\s+exists/g,'').replace(/\s+/g,'').replace(/["`\[\]]/g,'');
function query(command) {
  const raw=execFileSync('npx',['--no-install','wrangler','d1','execute','timothy-connect-db','--remote','--json','--command',command],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
  const result=JSON.parse(raw);
  if(!Array.isArray(result)||result.some(r=>!r.success)) throw Error('Schema query failed');
  return result.flatMap(r=>r.results||[]);
}
function inspect(required=false) {
  const found=query(sql);
  for(const item of expected) {
    const actual=found.find(x=>x.name===item.name);
    if(!actual) {if(required) throw Error('Required schema object missing: '+item.name); continue;}
    if(actual.type!==item.type || normalize(actual.sql)!==normalize(item.sql)) throw Error('Schema definition conflict: '+item.name);
  }
  // Verify the live ledger already has its processor/transaction uniqueness guard.
  const indexes=query("SELECT name,sql FROM sqlite_master WHERE type='index' AND tbl_name='giving_entries' AND sql IS NOT NULL");
  if(!indexes.some(x=>/unique/i.test(x.sql)&&/processor/i.test(x.sql)&&/external_txn_id/i.test(x.sql))) throw Error('Giving transaction uniqueness index missing');
  console.log(JSON.stringify({mode:process.env.SCHEMA_MODE,expectedObjects:expected.length,presentObjects:found.length,compatible:true,ledgerUniqueness:true}));
  return found.length;
}
const before=inspect();
if(process.env.SCHEMA_MODE==='apply'){
  for(const f of files) execFileSync('npx',['--no-install','wrangler','d1','execute','timothy-connect-db','--remote','--file',f],{stdio:['ignore','pipe','pipe']});
  inspect(true);
}
if(process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, '\nSecurity schema verified: '+before+'/'+expected.length+' expected objects initially present. Mode: '+process.env.SCHEMA_MODE+'. No private rows queried.\n');
