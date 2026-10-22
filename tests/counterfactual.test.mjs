import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceProjection} from '../lib/counterfactual.ts';
const input={name:'Sleep',latest:4,baseline:7,deviation:-6,unit:'hours',fresh:true};
test('projection enters fixed reference with minimum coordinate change',()=>{
 const p=referenceProjection(input);
 assert.equal(p.projected,5.755);
 assert.ok(Math.abs(p.deviationAfter)<2.5);
 assert.ok(p.change>0);
 assert.equal(input.latest,4);
});
test('stale, unflagged, invalid or unknown signals never produce targets',()=>{
 for(const patch of [{fresh:false},{deviation:2},{latest:NaN},{name:'Disease'},{baseline:5,deviation:6}])assert.equal(referenceProjection({...input,...patch}),null);
});
test('upper variation is projected down and physical input bounds respected',()=>{
 const p=referenceProjection({...input,latest:10,deviation:6});
 assert.ok(p.change<0);assert.ok(p.projected<=24);assert.ok(Math.abs(p.deviationAfter)<2.5);
});
