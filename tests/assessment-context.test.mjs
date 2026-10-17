import test from 'node:test';
import assert from 'node:assert/strict';
import {assessment} from '../lib/validation.ts';
const legacy={reaction_ms:350,memory_accuracy:80,false_starts:0};
const context=()=>({...legacy,hours_awake:8.5,sleepiness_score:10,assessment_started_at:new Date().toISOString(),utc_offset_minutes:330,protocol_version:'neurotwin-five-trial-v1'});
test('legacy assessments do not acquire fabricated context',()=>{
 assert.deepEqual(assessment(legacy),legacy);
});
test('complete context preserves modified ten-point scale and timezone without accepting caller identity',()=>{
 const input=context(),result=assessment({...input,user_id:'another-user',created_at:'2000-01-01'});
 assert.deepEqual(result,input);
});
test('incomplete or invalid context is rejected instead of being silently dropped',()=>{
 for(const patch of [{hours_awake:undefined},{hours_awake:-1},{hours_awake:49},{sleepiness_score:0},{sleepiness_score:11},{sleepiness_score:1.5},{utc_offset_minutes:900},{utc_offset_minutes:1.2},{protocol_version:'brighter-time-pvt'},{assessment_started_at:'2026-02-30T12:00:00.000Z'},{assessment_started_at:new Date(Date.now()+600000).toISOString()},{assessment_started_at:new Date(Date.now()-7200000).toISOString()}]){
  assert.throws(()=>assessment({...context(),...patch}));
 }
 assert.throws(()=>assessment({...legacy,hours_awake:5}));
});
