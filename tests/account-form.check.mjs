import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{JSDOM}=require('../.taste-skill/ui-check/node_modules/jsdom'),React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),ts=require('typescript');
const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/account/'});
globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const calls=[],routes=[];let failure=null,session={access_token:'test'};
const client={auth:{onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signUp:async value=>{calls.push(value);return {data:{session},error:failure};},signInWithPassword:async value=>{calls.push(value);return {error:null};}}};
const profileExports={};vm.runInNewContext(ts.transpileModule(readFileSync('lib/profile.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:profileExports,Error});
const exports={};vm.runInNewContext(ts.transpileModule(readFileSync('app/account/page.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{exports,location:dom.window.location,Error,require:name=>{
 if(name==='next/link')return {__esModule:true,default:({href,children,...rest})=>React.createElement('a',{href,...rest},children)};
 if(name==='next/navigation')return {useRouter:()=>({push:path=>routes.push(path)})};
 if(name.includes('supabase'))return {browserClient:()=>client};
 if(name.includes('/profile'))return profileExports;
 return require(name);
}});
const root=createRoot(document.getElementById('root'));
await act(async()=>{root.render(React.createElement(exports.default));});
const buttons=()=>[...document.querySelectorAll('button')];
await act(async()=>{buttons().find(b=>b.textContent==='Create an account').click();});
const set=(input,value)=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
// React's event support is selected at import time; dispatch through the actual props
// when a Node import predates DOM setup, preserving the component's state handlers.
const change=(selector,value)=>{const input=document.querySelector(selector);const key=Object.keys(input).find(k=>k.startsWith('__reactProps'));input[key].onChange({target:{value}});};
await act(async()=>{change('input[autocomplete="name"]',' Same Name ');change('input[autocomplete="username"]','Anand_01');change('input[type="email"]','ONE@EXAMPLE.INVALID');change('input[type="password"]','example-password-123');});
await act(async()=>{document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));});
assert.equal(calls[0].email,'one@example.invalid');assert.equal(calls[0].options.data.username,'anand_01');assert.equal(calls[0].options.data.display_name,'Same Name');assert.deepEqual(routes,['/home/']);
failure=new Error('Database error saving new user');
await act(async()=>{document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));});
assert.match(document.body.textContent,/username may already be taken/);
failure=null;session=null;
await act(async()=>{document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));});
assert.match(document.body.textContent,/confirmation because it is still enabled/);
assert.equal(routes.length,1);
await act(async()=>root.unmount());
console.log('Actual signup form checks passed: profile metadata, email normalization, immediate session, duplicate username and enabled-confirmation fallback.');
