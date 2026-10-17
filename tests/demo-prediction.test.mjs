import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {predictDemo} from '../lib/demoPrediction.ts';
const model=JSON.parse(readFileSync(new URL('../training/artifacts/neurotwin-synthetic-demo-model.json',import.meta.url),'utf8'));
test('exported model predicts the intercept at its training feature means',()=>{
 const inputs=Object.fromEntries(model.features.map((feature,i)=>[feature,model.means[i]]));
 assert.ok(Math.abs(predictDemo(model,inputs)-model.intercept)<1e-10);
});
test('each standardized feature changes prediction by its exported Ridge coefficient',()=>{
 for(let i=0;i<model.features.length;i++){
  const inputs=Object.fromEntries(model.features.map((feature,j)=>[feature,model.means[j]+(i===j?model.scales[j]:0)]));
  assert.ok(Math.abs(predictDemo(model,inputs)-(model.intercept+model.coefficients[i]))<1e-10);
 }
});
test('malformed artifacts and missing or nonfinite inputs are rejected',()=>{
 const inputs=Object.fromEntries(model.features.map((feature,i)=>[feature,model.means[i]]));
 assert.throws(()=>predictDemo(model,{}));
 assert.throws(()=>predictDemo(model,{...inputs,sleep:Infinity}));
 assert.throws(()=>predictDemo({...model,scales:[0,...model.scales.slice(1)]},inputs));
 assert.throws(()=>predictDemo({...model,coefficients:[]},inputs));
});
