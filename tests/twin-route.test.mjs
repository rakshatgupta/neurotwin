import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function fixture({signedIn=true,consent=true,empty=false,insertError=null}={}){
 const calls={filters:[],insert:[],snapshots:0};
 class HttpError extends Error{constructor(message,status){super(message);this.status=status}}
 const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store'}});
 const db={from:table=>{const chain={select:()=>chain,eq:(key,id)=>{calls.filters.push([table,key,id]);return chain},order:()=>chain,limit:async()=>({data:table==='checkins'&&!empty?[{on_date:'2026-10-18',sleep:8}]:[],error:null}),insert:async value=>{calls.insert.push(value);return {error:insertError}}};return chain}};
 const server={HttpError,json,authenticate:async()=>{if(!signedIn)throw new HttpError('Sign in',401);return {db,user:{id:'verified-owner'}}},requireConsent:async()=>{if(!consent)throw new HttpError('Consent required',403)},failure:e=>json({error:e.message},e.status||500)};
 const modules={'../../../lib/server':server,'../../../lib/twinSnapshot':{twinSnapshot:(c,a,v)=>{calls.snapshots++;return {algorithm_version:'actual-version',dataset_hash:'a'.repeat(64),summary:{counts:{checkins:c.length,assessments:a.length,voices:v.length}}}}}};
 const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/api/twin/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:name=>modules[name]});
 return {calls,get:()=>exports.GET(new Request('http://localhost/api/twin/')),post:()=>exports.POST(new Request('http://localhost/api/twin/',{method:'POST',body:JSON.stringify({user_id:'victim',summary:{fake:true}})}))};
}
test('saved twin endpoints require authentication and never leak records',async()=>{
 const r=fixture({signedIn:false});assert.equal((await r.get()).status,401);assert.equal((await r.post()).status,401);assert.equal(r.calls.insert.length,0);
});
test('snapshot calculation uses only owner-scoped database inputs, not caller content',async()=>{
 const r=fixture();const response=await r.post();assert.equal(response.status,200);assert.equal(r.calls.snapshots,1);
 assert.equal(r.calls.filters.length,3);assert(r.calls.filters.every(([,key,id])=>key==='user_id'&&id==='verified-owner'));
 assert.equal(r.calls.insert[0].user_id,'verified-owner');assert.equal(r.calls.insert[0].summary.counts.checkins,1);assert.equal(r.calls.insert[0].summary.fake,undefined);
});
test('withdrawn consent blocks snapshots and empty datasets do not create fake updates',async()=>{
 const blocked=fixture({consent:false});assert.equal((await blocked.post()).status,403);assert.equal(blocked.calls.insert.length,0);
 const empty=fixture({empty:true});assert.equal((await empty.post()).status,200);assert.equal(empty.calls.snapshots,0);assert.equal(empty.calls.insert.length,0);
});
test('duplicate fingerprints are idempotent and other database failures remain safe',async()=>{
 const duplicate=fixture({insertError:{code:'23505'}});assert.equal((await duplicate.post()).status,200);
 const failed=fixture({insertError:{code:'42501',message:'private SQL'}});const response=await failed.post();assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/private SQL/);
});
test('saved history is owner scoped and uncached',async()=>{
 const r=fixture();const response=await r.get();assert.equal(response.status,200);assert.deepEqual(r.calls.filters,[['twin_updates','user_id','verified-owner']]);assert.match(response.headers.get('cache-control'),/no-store/);
});
