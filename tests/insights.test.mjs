import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTwin} from '../lib/analytics.ts';
import {statisticalInsight,hasGroqConsent,GROQ_CONSENT_VERSION} from '../lib/insights.ts';
import {generateGroqInsight,DEFAULT_GROQ_MODEL} from '../lib/groq.ts';
const entry=(day,sleep=8)=>({on_date:`2026-01-${String(day).padStart(2,'0')}`,sleep,activity:30,stress:3,mood:'Balanced',source:'manual'});
const reply=(content='Recorded sleep differs from the personal reference.',finish='stop')=>Response.json({choices:[{finish_reason:finish,message:{content}}]});

test('statistical summaries handle empty and sparse histories without inventing a baseline',()=>{
 assert.match(statisticalInsight(buildTwin([])),/Save a daily check-in/);
 const text=statisticalInsight(buildTwin([entry(1,5)]));
 assert.match(text,/2026-01-01: 5 hours/);assert.match(text,/Eight recorded days/);assert.doesNotMatch(text,/Sleep is .*personal median/);
});
test('statistical explanation reports exact personal departures and cannot call a flat history healthy',()=>{
 const rows=Array.from({length:8},(_,i)=>entry(i+1,i===7?4:8));
 const changed=statisticalInsight(buildTwin(rows));
 assert.match(changed,/Sleep is 4.00 hours/);assert.match(changed,/8.00 hours/);assert.match(changed,/8.00 reference spreads below/);
 const flat=statisticalInsight(buildTwin(rows.map(r=>({...r,sleep:8}))));assert.match(flat,/not a health assessment/);
 assert.doesNotMatch(flat,/you are healthy/i);
});
test('Groq needs new provider-specific consent as well as storage and AI consent',()=>{
 const consent={storage_consent:true,ai_consent:true,voice_consent:false,consent_version:GROQ_CONSENT_VERSION};
 assert.equal(hasGroqConsent(consent),true);
 for(const value of [{...consent,consent_version:'2026-10-14'},{...consent,consent_version:undefined},{...consent,ai_consent:false},{...consent,storage_consent:false}])assert.equal(hasGroqConsent(value),false);
});
test('missing Groq key never calls a provider or silently uses an OpenAI key',async()=>{
 let calls=0;const r=await generateGroqInsight({}, {},async()=>{calls++;throw new Error('must not call')});
 assert.equal(calls,0);assert.equal(r.kind,'unavailable');assert.match(r.notice,/not configured/);
});
test('Groq request uses the fixed endpoint, server token and chat format without exposing reasoning',async()=>{
 let requested;
 const r=await generateGroqInsight({observations:8,latest:{sleep:5}}, {key:' test-secret '},async(url,init)=>{requested={url,init};return reply();});
 assert.equal(requested.url,'https://api.groq.com/openai/v1/chat/completions');
 assert.equal(requested.init.headers.Authorization,'Bearer test-secret');
 const body=JSON.parse(requested.init.body);assert.equal(body.model,DEFAULT_GROQ_MODEL);assert.equal(body.messages[1].content,JSON.stringify({observations:8,latest:{sleep:5}}));
 assert.equal(body.include_reasoning,false);assert.equal(body.reasoning_effort,'low');assert.equal(body.stream,undefined);
 assert.equal(r.kind,'ai');assert(!JSON.stringify(r).includes('test-secret'));
});
test('custom non-GPT model does not receive unsupported reasoning controls',async()=>{
 await generateGroqInsight({}, {key:'secret',model:'another-model'},async(_url,init)=>{const b=JSON.parse(init.body);assert.equal(b.model,'another-model');assert.equal(b.reasoning_effort,undefined);assert.equal(b.include_reasoning,undefined);return reply();});
});
test('provider auth, access, model, quota and server errors yield safe useful fallbacks',async()=>{
 for(const [status,pattern] of [[401,/API key/],[403,/permissions/],[404,/model/],[429,/limit/],[500,/temporarily/],[400,/compatibility/]]){
  const r=await generateGroqInsight({}, {key:'secret'},async()=>new Response('secret private payload',{status}));
  assert.equal(r.kind,'unavailable');assert.match(r.notice,pattern);assert(!r.notice.includes('private payload'));assert(!r.notice.includes('secret'));
 }
});
test('empty, truncated, reasoning-tagged, oversized and malformed responses cannot be saved as AI explanations',async()=>{
 for(const response of [reply(''),reply('partial','length'),reply('<think>hidden</think>'),reply('x'.repeat(5501)),Response.json({}),new Response('not-json')]){
  const r=await generateGroqInsight({}, {key:'secret'},async()=>response);assert.equal(r.kind,'unavailable');
 }
});
test('timeouts and network errors preserve the no-provider fallback',async()=>{
 const r=await generateGroqInsight({}, {key:'secret'},async()=>{throw new DOMException('secret','TimeoutError')});
 assert.equal(r.kind,'unavailable');assert.match(r.notice,/statistical summary/);assert(!r.notice.includes('secret'));
});
