import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function fixture({signedIn=true,consent=true,rpcError=null}={}){
 const calls={rpc:[],filters:[],consent:0};
 class HttpError extends Error{constructor(message,status){super(message);this.status=status}}
 const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store'}});
 const chain={select:()=>chain,eq:(key,id)=>{calls.filters.push([key,id]);return chain},order:()=>chain,limit:async()=>({data:[],error:null})};
 const db={from:()=>chain,rpc:async(...args)=>{calls.rpc.push(args);return {data:{id:'saved'},error:rpcError}}};
 const server={HttpError,json,body:r=>r.json(),authenticate:async()=>{if(!signedIn)throw new HttpError('Sign in',401);return {db,user:{id:'verified-user'}}},requireConsent:async()=>{calls.consent++;if(!consent)throw new HttpError('Consent required',403)},failure:e=>json({error:e.message},e.status||500)};
 const source=readFileSync(new URL('../app/api/predictions/route.ts',import.meta.url),'utf8');
 const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:()=>server});
 return {calls,get:()=>exports.GET(new Request('http://localhost/api/predictions/')),post:input=>exports.POST(new Request('http://localhost/api/predictions/',{method:'POST',body:JSON.stringify(input)}))};
}
test('prediction endpoints reject signed-out users without database calls',async()=>{
 const r=fixture({signedIn:false});assert.equal((await r.get()).status,401);assert.equal((await r.post({acknowledgeExperiment:true})).status,401);assert.equal(r.calls.rpc.length,0);assert.equal(r.calls.filters.length,0);
});
test('prediction reads use verified ownership and no-store responses',async()=>{
 const r=fixture(),response=await r.get();assert.equal(response.status,200);assert.deepEqual(r.calls.filters,[['user_id','verified-user']]);assert.match(response.headers.get('cache-control'),/no-store/);
});
test('experimental acknowledgement and storage consent gate forecast creation',async()=>{
 const r=fixture();assert.equal((await r.post({})).status,400);assert.equal(r.calls.rpc.length,0);
 const denied=fixture({consent:false});assert.equal((await denied.post({acknowledgeExperiment:true})).status,403);assert.equal(denied.calls.rpc.length,0);
});
test('caller identity and prediction numbers cannot be forwarded to the database',async()=>{
 const r=fixture();assert.equal((await r.post({acknowledgeExperiment:true,user_id:'victim',model_prediction_ms:1})).status,200);assert.deepEqual(r.calls.rpc,[['create_personal_prediction']]);
});
test('expected eligibility failures are readable while unknown database errors stay private',async()=>{
 const missing=fixture({rpcError:{message:'Complete at least three assessments with prediction context'}});assert.equal((await missing.post({acknowledgeExperiment:true})).status,400);
 const unknown=fixture({rpcError:{message:'private database information'}});const response=await unknown.post({acknowledgeExperiment:true});assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/private database information/);
});
