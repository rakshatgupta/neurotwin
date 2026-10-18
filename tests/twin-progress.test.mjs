import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTwin,twinHistory,isFresh} from '../lib/analytics.ts';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/readiness.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:()=>({isFresh}),Date});
const {dataReadiness}=exports;
const daily=(day,sleep=8)=>({on_date:`2026-10-${String(day).padStart(2,'0')}`,sleep,activity:30,stress:3,mood:'Balanced',source:'manual'});
const now=Date.parse('2026-10-18T12:00:00Z');
test('historical references exclude their target and any future readings',()=>{
 const rows=Array.from({length:9},(_,i)=>daily(i+1,i===7?2:8));
 const before=twinHistory(rows),after=twinHistory([...rows,daily(20,24)]);
 assert.deepEqual(after.filter(p=>p.date<'2026-10-20'),before);
 const point=before.find(p=>p.signal==='Sleep'&&p.date==='2026-10-08');
 assert.equal(point.reference,8);assert.equal(point.observations,7);assert.equal(point.deviation,-12);
});
test('historical window uses at most 30 strictly earlier observations',()=>{
 const rows=Array.from({length:35},(_,i)=>({...daily(1),on_date:new Date(Date.UTC(2026,8,i+1)).toISOString().slice(0,10)}));
 const history=twinHistory(rows);assert.equal(history.at(-1).observations,30);
 const tests=Array.from({length:4},()=>({created_at:'2026-10-18T10:00:00Z',reaction_ms:300,memory_accuracy:80}));
 assert.equal(twinHistory([],tests).length,0);
});
test('stale and future readings stay visible but do not enter recent fusion',()=>{
 const rows=Array.from({length:8},(_,i)=>daily(i+1));
 const old=buildTwin(rows,[],[],now);assert.equal(old.factors.length,3);assert.equal(old.fusion,null);
 const current=buildTwin([...rows,daily(18)],[],[],now);assert.equal(current.freshFactors.length,3);assert.equal(current.fusion,0);
 assert.equal(isFresh('2026-10-19',now),false);assert.equal(isFresh('bad date',now),false);
});
test('stale voice does not inflate a recent daily combined summary',()=>{
 const rows=Array.from({length:8},(_,i)=>daily(i+11));
 const voices=Array.from({length:4},(_,i)=>({created_at:`2026-09-0${i+1}T12:00:00Z`,rms_mean:i===3?.5:.1,duration_ms:5000}));
 const twin=buildTwin(rows,[],voices,now);
 assert.equal(twin.factors.find(f=>f.name==='Recording level').fresh,false);
 assert.equal(twin.fusion,0);assert.equal(twin.currentDeviations.length,0);
});
test('readiness never invents context for legacy assessments and identifies stale forecast inputs',()=>{
 const data={checkins:[],assessments:[],voices:[],preferences:{voice_consent:false}};
 assert.equal(dataReadiness(data,now)[3].status,'Optional / off');
 const base={reaction_ms:300,memory_accuracy:80,false_starts:0};
 data.assessments=Array.from({length:3},(_,i)=>({...base,created_at:`2026-10-18T0${i}:00:00Z`}));
 assert.equal(dataReadiness(data,now)[2].count,0);
 data.assessments=data.assessments.map(a=>({...a,protocol_version:'neurotwin-five-trial-v1',hours_awake:5,sleepiness_score:3,assessment_started_at:a.created_at,utc_offset_minutes:330}));
 assert.equal(dataReadiness(data,now)[2].status,'Ready to request');
 assert.equal(dataReadiness(data,now+3*86400000)[2].status,'More context needed');
});
