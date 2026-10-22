import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
const require=createRequire(import.meta.url),ts=require('typescript'),React=require('react');
function render(factors){
 const cache=new Map();
 function load(file){
  if(cache.has(file))return cache.get(file);
  const exports={};cache.set(file,exports);
  const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  vm.runInNewContext(code,{exports,require:name=>{if(!name.startsWith('.'))return require(name);const base=path.resolve(path.dirname(file),name);return load([base+'.tsx',base+'.ts'].find(existsSync));}});
  return exports;
 }
 const Component=load(path.resolve('components/ExperimentalResearch.tsx')).default;
 return require('react-dom/server').renderToStaticMarkup(React.createElement(Component,{factors}));
}
test('research UI exposes actual model projection without implying trained live modules',()=>{
 const html=render([{name:'Sleep',latest:4,baseline:7,deviation:-6,unit:'hours',fresh:true}]);
 assert.match(html,/5.75|5.76/);assert.match(html,/hours/);
 assert.match(html,/no population artifact activated/);assert.match(html,/not a recommended change/);
 assert.match(html,/aria-expanded="false"/);
});
test('no fresh eligible data produces no fabricated counterfactual',()=>{
 const html=render([]);assert.match(html,/No fresh, flagged signals/);assert.ok(!html.includes('<tbody>'));
});
