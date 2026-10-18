import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function fixture(statuses,failRefresh=false){
 let refreshes=0;const calls=[];
 const client={auth:{getSession:async()=>({data:{session:{access_token:'old-test-token'}}}),refreshSession:async()=>{refreshes++;return {data:{session:failRefresh?null:{access_token:'new-test-token'}},error:failRefresh?Error('private error'):null}}}};
 const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/supabase.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:()=>({createClient:()=>client}),process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://example.invalid',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'public-test'}},fetch:async(path,options)=>{calls.push(options);const status=statuses.shift();return Response.json(status===200?{ok:true}:{error:'Request rejected'},{status})},Error});
 return {api:exports.api,calls,refreshes:()=>refreshes};
}
test('an API authentication rejection refreshes once and preserves the authorized request',async()=>{
 const f=fixture([401,200]);assert.equal((await f.api('/api/data/','POST',{kind:'checkin'})).ok,true);assert.equal(f.refreshes(),1);assert.equal(f.calls.length,2);assert.equal(f.calls[0].body,f.calls[1].body);assert.match(f.calls[1].headers.Authorization,/new-test-token/);
});
test('permission failures are not retried and repeated unauthorized responses cannot loop',async()=>{
 const forbidden=fixture([403]);await assert.rejects(()=>forbidden.api('/api/data/'),/Request rejected/);assert.equal(forbidden.refreshes(),0);
 const rejected=fixture([401,401]);await assert.rejects(()=>rejected.api('/api/data/'),/Request rejected/);assert.equal(rejected.calls.length,2);
});
test('failed refresh requests sign-in without exposing a provider error',async()=>{
 const f=fixture([401],true);await assert.rejects(()=>f.api('/api/data/'),/Your session has expired/);assert.equal(f.calls.length,1);
});
