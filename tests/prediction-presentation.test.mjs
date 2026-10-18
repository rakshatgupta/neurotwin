import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function render(rows){const cache=new Map();function load(file){if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);let index=0;const states=[rows,false,'',false,Date.parse('2026-10-18T12:00:00Z'),''];const seeded={...React,useState(value){return React.useState(index<states.length?states[index++]:value)}};
 const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 vm.runInNewContext(code,{exports,require:name=>{if(name==='react'&&file.endsWith('PersonalPredictions.tsx'))return seeded;if(name.endsWith('/supabase'))return {api:async()=>({predictions:rows})};if(!name.startsWith('.'))return require(name);const base=path.resolve(path.dirname(file),name);return load([base+'.tsx',base+'.ts'].find(existsSync))},Date,setInterval,clearInterval});return exports;}
 const Component=load(path.resolve('components/PersonalPredictions.tsx')).default;return renderToStaticMarkup(React.createElement(Component,{storageConsent:true}));}
const row={id:'synthetic',created_at:'2026-10-18T10:00:00Z',expires_at:'2026-10-19T10:00:00Z',history_cutoff:'2026-10-18T09:59:00Z',model_version:'test',protocol_version:'test',model_prediction_ms:320,baseline_prediction_ms:330,actual_reaction_ms:null,status:'pending'};
test('saved forecast is a visible result before technical and history explanations',()=>{const html=render([row]);const result=html.match(/<section class="prediction-result".*?<\/section>/s)[0];assert.match(result,/320.0/);assert.match(result,/330.0/);assert.match(result,/Waiting for your next test/);assert(html.indexOf('320.0')<html.indexOf('What this model uses'));});
test('matched and expired forecasts show outcome or closed-window context',()=>{const html=render([{...row,status:'matched',actual_reaction_ms:350}]);assert.match(html,/Later measured result/);assert.match(html,/30\.0 ms away/);assert.match(render([{...row,expires_at:'2026-10-17T10:00:00Z'}]),/Forecast window closed/);});
test('empty history gives instructions without inventing an estimate',()=>{const html=render([]);assert.match(html,/No forecast saved yet/);assert(!html.includes('prediction-result'));});
