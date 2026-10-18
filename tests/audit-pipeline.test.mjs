import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {buildTwin,twinHistory} from '../lib/analytics.ts';
import {checkin,csv} from '../lib/validation.ts';
import {statisticalInsight} from '../lib/insights.ts';
function load(name,modules){const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL(`../lib/${name}.ts`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:key=>modules[key],Date,JSON});return exports;}
const {twinSnapshot}=load('twinSnapshot',{'node:crypto':{createHash},'./analytics':{buildTwin,twinHistory}});
const {wellnessActions}=load('guidance',{});
const row=(day,sleep=8)=>({id:`day-${day}`,on_date:`2026-10-${String(day).padStart(2,'0')}`,sleep,activity:30,stress:3,mood:'Balanced',source:'manual'});
const now=Date.parse('2026-10-18T12:00:00Z');
test('optional sleep pattern fields validate and legacy CSV does not fabricate them',()=>{
 const saved=checkin({...row(18),bed_time:'23:30',wake_time:'07:00',sleep_quality:4});assert.equal(saved.bed_time,'23:30');assert.equal(saved.sleep_quality,4);
 for(const patch of [{bed_time:'24:00'},{wake_time:'bad'},{sleep_quality:0},{sleep_quality:6},{sleep_quality:2.5}])assert.throws(()=>checkin({...row(18),...patch}));
 assert.equal(checkin({...row(18),sleep_quality:null}).sleep_quality,null);
 assert.equal(csv('date,sleep,activity,stress,mood\n2026-10-17,8,30,3,Clear')[0].bed_time,undefined);
});
test('snapshot fingerprints are order independent and change with edited measurements',()=>{
 const rows=Array.from({length:8},(_,i)=>row(i+11));const first=twinSnapshot(rows,[],[],now),reordered=twinSnapshot([...rows].reverse(),[],[],now+1000);
 assert.equal(first.dataset_hash,reordered.dataset_hash);assert.equal(first.summary.counts.checkins,8);
 const changed=twinSnapshot(rows.map(r=>r.on_date==='2026-10-18'?{...r,sleep:2}:r),[],[],now);
 assert.notEqual(changed.dataset_hash,first.dataset_hash);assert(changed.summary.deviations.some(p=>p.signal==='Sleep'));
 assert.equal(first.summary.deviations.length,0);assert.equal(changed.summary.sources.checkins.at(-1).id,'day-18');
});
test('cognitive-only data yields real insights without requiring daily or voice records',()=>{
 const assessments=Array.from({length:4},(_,i)=>({created_at:`2026-10-${i+14}T12:00:00Z`,reaction_ms:i===3?500:250,memory_accuracy:80,false_starts:0}));
 const twin=buildTwin([],assessments,[],now),text=statisticalInsight(twin);
 assert.equal(twin.assessmentSessions,4);assert.match(text,/No daily check-in/);assert.match(text,/Reaction time/);assert.match(text,/500.00 ms/);
 assert.equal(twinSnapshot([],assessments,[],now).summary.counts.voices,0);
});
test('latest and historical comparisons agree for equal-timestamp assessments',()=>{
 const assessments=Array.from({length:4},()=>({created_at:'2026-10-18T12:00:00Z',reaction_ms:300,memory_accuracy:80,false_starts:0}));
 assert.equal(buildTwin([],assessments,[],now).factors.length,0);assert.equal(twinHistory([],assessments).length,0);
});
test('wellness actions derive from current flags and do not invent stale or absent ones',()=>{
 const rows=Array.from({length:8},(_,i)=>row(i+11,i===7?2:8));
 assert(wellnessActions(buildTwin(rows,[],[],now)).some(s=>s.includes('Sleep is below')));
 assert.equal(wellnessActions(buildTwin(rows,[],[],now+10*86400000)).length,0);
 assert.equal(wellnessActions(buildTwin([],[],[],now)).length,0);
});
