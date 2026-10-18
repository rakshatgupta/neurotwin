import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import {buildTwin} from '../lib/analytics.ts';
import {hasGroqConsent,GROQ_CONSENT_VERSION,statisticalInsight} from '../lib/insights.ts';
import {record} from '../lib/validation.ts';
const require=createRequire(import.meta.url);

// Compile the real route with isolated auth/database/provider boundaries.
function route({version=GROQ_CONSENT_VERSION,key='test-key',allowed=true,withdraw=false,providerResult={kind:'ai',content:'Observed patterns only.',model:'test-model'}}={}) {
 const calls={provider:0,insert:0,claim:0,consent:0};
 const consent={storage_consent:true,ai_consent:true,voice_consent:false,consent_version:version};
 const query=(table)=>{
  const value={data:table==='checkins'?[{on_date:'2026-01-01',sleep:8,activity:30,stress:3,mood:'Balanced',source:'manual'}]:[],error:null};
  const chain={select:()=>chain,eq:()=>chain,order:()=>chain,limit:()=>Promise.resolve(value),insert:async()=>{calls.insert++;return {error:null}}};return chain;
 };
 class HttpError extends Error{constructor(message,status){super(message);this.status=status}}
 const db={from:query,rpc:async()=>{calls.claim++;return {data:allowed,error:null}}};
 const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
 const modules={
  '../../../lib/server':{HttpError,json,failure:e=>json({error:e.message},e.status||500),body:r=>r.json(),authenticate:async()=>({db,user:{id:'test-owner'}}),requireConsent:async()=>{calls.consent++;return {...consent,consent_version:withdraw&&calls.consent>1?'withdrawn':version}}},
  '../../../lib/validation':{record},'../../../lib/analytics':{buildTwin},
  '../../../lib/insights':{hasGroqConsent,GROQ_CONSENT_VERSION,statisticalInsight},
  '../../../lib/groq':{generateGroqInsight:async()=>{calls.provider++;return providerResult}},
 };
 const source=readFileSync(new URL('../app/api/insights/route.ts',import.meta.url),'utf8');
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(output,{exports,require:name=>modules[name],process:{env:{GROQ_API_KEY:key}},Response});
 return {calls,post:(input={consent:true,consentVersion:GROQ_CONSENT_VERSION})=>exports.POST(new Request('http://localhost/api/insights/',{method:'POST',body:JSON.stringify(input)}))};
}
test('old provider consent and missing request consent cannot make Groq requests',async()=>{
 for(const [options,input] of [[{version:'2026-10-14'},undefined],[{}, {consent:true}],[{}, {consent:false,consentVersion:GROQ_CONSENT_VERSION}]]){
  const r=route(options);const response=await r.post(input);assert.equal(response.status,403);assert.equal(r.calls.provider,0);assert.equal(r.calls.insert,0);
 }
});
test('unconfigured provider returns honest statistical text without spending quota or storing it as AI',async()=>{
 const r=route({key:''});const response=await r.post(),body=await response.json();
 assert.equal(body.kind,'statistical');assert.match(body.content,/8 hours of sleep/);assert.match(response.headers.get('cache-control'),/no-store/);
 assert.equal(r.calls.provider,0);assert.equal(r.calls.claim,0);assert.equal(r.calls.insert,0);
});
test('application quota prevents provider request while retaining statistical fallback',async()=>{
 const r=route({allowed:false});const body=await (await r.post()).json();assert.equal(body.kind,'statistical');assert.equal(r.calls.provider,0);assert.equal(r.calls.insert,0);
});
test('provider failure does not insert a fake AI explanation',async()=>{
 const r=route({providerResult:{kind:'unavailable',notice:'Groq quota reached.'}});const body=await (await r.post()).json();assert.equal(body.kind,'statistical');assert.match(body.notice,/quota/);assert.equal(r.calls.insert,0);
});
test('completed AI response is saved with provenance after a second consent check',async()=>{
 const r=route();const body=await (await r.post()).json();assert.equal(body.kind,'ai');assert.match(body.content,/AI explanation from Groq \(test-model\)/);assert.equal(r.calls.insert,1);assert.equal(r.calls.consent,2);
});
test('consent withdrawal during generation prevents saving the response',async()=>{
 const r=route({withdraw:true});const response=await r.post();assert.equal(response.status,403);assert.equal(r.calls.insert,0);
});

// Render the actual component with real React, using synthetic records only.
export function renderInsightFixture(overrides={}) {
 const cache=new Map();
 function load(filename){
  if(cache.has(filename))return cache.get(filename).exports;
  const mod={exports:{}};cache.set(filename,mod);
  const source=readFileSync(filename,'utf8');const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  vm.runInNewContext(code,{exports:mod.exports,module:mod,require:name=>{
   if(!name.startsWith('.'))return require(name);
   const base=path.resolve(path.dirname(filename),name);return load([base+'.ts',base+'.tsx'].find(existsSync)||base);
  },process:{env:{}},console,Date,AbortSignal,fetch},{filename});return mod.exports;
 }
 const Component=load(path.resolve('components/PersonalizedInsight.tsx')).default;
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const data={checkins:[{on_date:'2026-01-01',sleep:8,activity:30,stress:3,mood:'Balanced',source:'manual'}],assessments:[],voices:[],preferences:{storage_consent:true,ai_consent:false,voice_consent:false},insights:[],aiAvailable:false,accountDeletionAvailable:false,...overrides};
 return renderToStaticMarkup(React.createElement(Component,{data,busy:false,refresh:async()=>{},task:async action=>action()}));
}
test('workspace displays a free non-AI summary when provider is absent',()=>{
 const html=renderInsightFixture();assert.match(html,/Built-in statistical summary/);assert.match(html,/This is not AI-generated text/);assert.match(html,/8 hours of sleep/);assert.match(html,/Groq is not configured/);assert.match(html,/disabled/);
});
test('old saved AI text is separated from the current statistical summary',()=>{
 const html=renderInsightFixture({insights:[{id:'test',content:'Earlier provider explanation.',created_at:'2026-01-01T00:00:00Z'}],aiAvailable:true});
 assert.match(html,/Last saved AI explanation/);assert.match(html,/Earlier provider explanation/);assert.match(html,/Previous OpenAI consent does not enable Groq/);
});
