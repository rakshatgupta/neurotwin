import test from 'node:test';
import assert from 'node:assert/strict';
import {checkin,csv} from '../lib/validation.ts';
import {buildTwin,twinHistory} from '../lib/analytics.ts';
import {statisticalInsight} from '../lib/insights.ts';
const now=Date.parse('2026-10-18T12:00:00Z');
const rows=(sleep=8,steps=7000)=>Array.from({length:8},(_,i)=>({on_date:`2026-10-${i+11}`,sleep,activity:30,steps,stress:3,mood:'Balanced',source:'manual'}));
test('step counts retain 7000, reject invalid counts, and never convert minutes or missing inputs',()=>{
 assert.equal(checkin({...rows()[0],steps:7000}).steps,7000);
 for(const steps of [-1,1.5,200001,NaN,'7000'])assert.throws(()=>checkin({...rows()[0],steps}));
 assert.equal(checkin({...rows()[0],steps:null}).steps,null);
 const {steps,...legacy}=rows()[0];assert.equal(checkin(legacy).steps,undefined);
 assert.equal(csv('date,sleep,activity,stress,mood,steps\n2026-10-17,8,30,3,Clear,7000')[0].steps,7000);
 assert.equal(csv('date,sleep,activity,stress,mood,steps\n2026-10-17,8,30,3,Clear,')[0].steps,null);
 assert.equal(csv('date,sleep,activity,stress,mood\n2026-10-17,8,30,3,Clear')[0].steps,undefined);
 assert.throws(()=>csv('date,sleep,activity,stress,mood,steps\n2026-10-17,8,30,3,Clear,1.5'));
});
test('optional steps use dated prior counts and explain real differences without imputing zeros',()=>{
 const daily=rows();daily[7].steps=2000;
 const twin=buildTwin(daily,[],[],now),factor=twin.factors.find(f=>f.name==='Steps');
 assert.equal(factor.baseline,7000);assert.equal(factor.latest,2000);assert.equal(factor.unit,'steps');assert.equal(factor.deviation,-10);
 assert(twin.currentDeviations.some(f=>f.name==='Steps'));
 assert.equal(twinHistory(daily).find(f=>f.signal==='Steps').reference,7000);
 assert.match(statisticalInsight(twin),/2000 steps/);
 assert(!buildTwin(daily.map(r=>({...r,steps:null})),[],[],now).factors.some(f=>f.name==='Steps'));
 assert(!buildTwin(daily.map((r,i)=>({...r,steps:i===0?null:r.steps})),[],[],now).factors.some(f=>f.name==='Steps'));
});
test('equal current observations produce different personal comparisons for different histories',()=>{
 const first=rows(8),second=rows(6);first[7].sleep=6;second[7].sleep=6;
 const a=buildTwin(first,[],[],now).factors.find(f=>f.name==='Sleep'),b=buildTwin(second,[],[],now).factors.find(f=>f.name==='Sleep');
 assert.equal(a.latest,b.latest);assert.equal(a.baseline,8);assert.equal(b.baseline,6);assert(a.deviation<-2.5);assert.equal(b.deviation,0);
});
test('fusion responds to sleep and stress changes while cognitive observations stay fixed',()=>{
 const assessments=Array.from({length:4},(_,i)=>({created_at:`2026-10-${i+15}T09:00:00Z`,reaction_ms:300,memory_accuracy:80,false_starts:0}));
 const daily=rows(),before=buildTwin(daily,assessments,[],now);daily[7].sleep=5;daily[7].stress=8;
 const after=buildTwin(daily,assessments,[],now);
 assert(after.fusion>before.fusion);assert.deepEqual(after.factors.filter(f=>f.name==='Reaction time'||f.name==='Recall accuracy'),before.factors.filter(f=>f.name==='Reaction time'||f.name==='Recall accuracy'));
 assert(after.currentDeviations.some(f=>f.name==='Sleep'));assert(after.currentDeviations.some(f=>f.name==='Stress'));
});
