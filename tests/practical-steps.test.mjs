import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {buildTwin} from '../lib/analytics.ts';
const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/guidance.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,Date});
const {practicalNextSteps}=exports,now=Date.parse('2026-10-18T12:00:00Z');
const rows=()=>Array.from({length:8},(_,i)=>({on_date:`2026-10-${i+11}`,sleep:8,activity:30,steps:7000,stress:3,mood:'Balanced',source:'manual'}));
test('sleep and stress changes produce specific actions with actual evidence',()=>{
 const data=rows();data[7].sleep=5;data[7].stress=8;
 const cards=practicalNextSteps(buildTwin(data,[],[],now),now);
 assert(cards.some(c=>c.id==='sleep'&&c.reason.includes('3.0 hours below')&&c.action.includes('30 minutes')));
 assert(cards.some(c=>c.id==='stress'&&c.reason.includes('8.0 /10')&&c.action.includes('five minutes')));
});
test('zero-hour entry prompts confirmation, not a routine inferred from uncertain input',()=>{
 const data=rows();data[7].sleep=0;const cards=practicalNextSteps(buildTwin(data,[],[],now),now);
 assert.equal(cards[0].id,'verify-sleep');assert(!cards.some(c=>c.id==='sleep'));assert.match(cards[0].action,/actual sleep duration/);
});
test('correlated movement departures share one action and retain both reasons',()=>{
 const data=rows();data[7].steps=0;data[7].activity=0;const cards=practicalNextSteps(buildTwin(data,[],[],now),now).filter(c=>c.id==='movement');
 assert.equal(cards.length,1);assert.match(cards[0].reason,/Steps/);assert.match(cards[0].reason,/Activity/);assert.match(cards[0].action,/comfortable walk/);
});
test('missing, steady and forming histories do not invent a flagged condition',()=>{
 assert.equal(practicalNextSteps(buildTwin([],[],[],now),now)[0].id,'missing');
 assert.equal(practicalNextSteps(buildTwin(rows(),[],[],now),now)[0].id,'steady');
 assert.equal(practicalNextSteps(buildTwin(rows().slice(-1),[],[],now),now)[0].id,'forming');
 const data=rows();data[7].stress=10;assert(!practicalNextSteps(buildTwin(data,[],[],now+10*86400000),now+10*86400000).some(c=>c.id==='stress'));
});
