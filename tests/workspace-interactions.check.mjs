// Actual React components in a disposable DOM with mocked auth/API boundaries.
// npm install --prefix .taste-skill/ui-check jsdom
import {createRequire} from 'node:module';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
const require=createRequire(import.meta.url),root=path.resolve(import.meta.dirname,'..');
const {JSDOM}=require('../.taste-skill/ui-check/node_modules/jsdom');
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'http://localhost/home/',pretendToBeVisual:true});
globalThis.window=dom.window;globalThis.document=dom.window.document;
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.URL=dom.window.URL;URL.createObjectURL=()=> 'blob:test-export';URL.revokeObjectURL=()=>{};
let trackStops=0;const frames=new Map();
Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>({getTracks:()=>[{stop(){trackStops++}}]})},configurable:true});
class FakeAudioContext{resume(){return Promise.resolve()}close(){return Promise.resolve()}createMediaStreamSource(){return {connect(){}}}createAnalyser(){return {fftSize:2048,getFloatTimeDomainData(values){values.fill(.1)}}}}
let downloads=0;dom.window.HTMLAnchorElement.prototype.click=function(){downloads++};
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),ts=require('typescript');
const owner='ui-test-owner',calls=[];let authChanged=()=>{};let clock=0,timerID=0;const timers=new Map();
const today=new Date().toISOString().slice(0,10);
let records={checkins:Array.from({length:8},(_,i)=>({id:`daily-${i}`,on_date:new Date(Date.now()-(7-i)*86400000).toISOString().slice(0,10),sleep:7.5,activity:30,stress:3,mood:'Balanced',source:'manual',bed_time:'23:00:00',wake_time:'07:00:00',sleep_quality:4})),assessments:[],voices:[],preferences:{storage_consent:true,ai_consent:false,voice_consent:false},insights:[],aiAvailable:false,accountDeletionAvailable:false};
let snapshots=[];
const client={auth:{getSession:async()=>({data:{session:{user:{id:owner,email:'test@example.invalid'}}}}),onAuthStateChange:callback=>{authChanged=callback;return {data:{subscription:{unsubscribe(){}}}}},signOut:async()=>{authChanged('SIGNED_OUT',null);return {error:null}}}};
const api=async(url,method='GET',body)=>{
 calls.push({url,method,body});
 if(url==='/api/data/'&&method==='GET')return {...structuredClone(records),accountId:owner};
 if(url==='/api/data/'&&method==='POST'){
  if(body.kind==='checkin'){records.checkins=records.checkins.filter(row=>row.on_date!==body.values.on_date);records.checkins.push({id:'daily',...body.values});}
  if(body.kind==='assessment')records.assessments.push({id:'assessment',created_at:new Date().toISOString(),...body.values});
  if(body.kind==='voice')records.voices.push({id:'voice',created_at:new Date().toISOString(),...body.values});
  if(body.kind==='preferences')records.preferences={...body.values};
  return {ok:true};
 }
 if(url==='/api/data/'&&method==='DELETE'){records={...records,checkins:[],assessments:[],voices:[],preferences:{storage_consent:false,ai_consent:false,voice_consent:false}};snapshots=[];return {ok:true};}
 if(url==='/api/twin/'&&method==='POST'){snapshots=[{id:'snapshot',created_at:new Date().toISOString(),algorithm_version:'test',dataset_hash:'a'.repeat(64),summary:{evaluated_at:new Date().toISOString(),status:'forming',counts:{checkins:records.checkins.length,assessments:records.assessments.length,voices:0},sources:{},deviation_count:0,deviations:[]}}];return {ok:true};}
 if(url==='/api/twin/')return {updates:structuredClone(snapshots)};
 if(url==='/api/predictions/'&&method==='POST')throw Error('Complete at least three assessments with prediction context');
 if(url==='/api/predictions/')return {predictions:[]};
 if(url==='/api/export/')return {...records,predictions:[],twin_updates:snapshots};
 throw Error(`Unexpected API ${method} ${url}`);
};
const cache=new Map();
function load(file){
 if(file.endsWith(path.join('lib','supabase.ts')))return {api,browserClient:()=>client};
 if(cache.has(file))return cache.get(file);
 if(file.endsWith('.json'))return JSON.parse(readFileSync(file,'utf8'));
 const exports={};cache.set(file,exports);
 const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const timed=file.endsWith('CognitiveTest.tsx');
 vm.runInNewContext(code,{exports,require(name){if(name==='next/link')return {__esModule:true,default:({href,children,...props})=>React.createElement('a',{href,...props},children)};if(!name.startsWith('.'))return require(name);const base=path.resolve(path.dirname(file),name);return load([base,base+'.ts',base+'.tsx',base+'.json'].find(p=>existsSync(p)))},window,document,navigator,URL,Blob,Date,Error,console,confirm:()=>true,crypto:webcrypto,performance:{now:()=>clock},AudioContext:FakeAudioContext,requestAnimationFrame:fn=>{const id=++timerID;frames.set(id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),setTimeout:timed?(fn,ms)=>{const id=++timerID;timers.set(id,{fn,at:clock+ms});return id}:setTimeout,clearTimeout:timed?id=>timers.delete(id):clearTimeout,setInterval,clearInterval},{filename:file});
 return exports;
}
let checks=0;const check=value=>{assert.ok(value);checks++};
const button=name=>[...document.querySelectorAll('button')].find(el=>el.textContent.trim()===name);
async function click(name){const element=button(name);assert.ok(element,`Missing button ${name}`);await act(async()=>{element.click();await new Promise(resolve=>setTimeout(resolve,0))})}
async function fill(element,value){assert.ok(element);await act(async()=>{const prototype=element.tagName==='SELECT'?window.HTMLSelectElement.prototype:window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(element,value);element.dispatchEvent(new window.Event(element.tagName==='SELECT'?'change':'input',{bubbles:true}));})}
async function advance(ms){await act(async()=>{clock+=ms;for(const [id,timer] of [...timers])if(timer.at<=clock){timers.delete(id);timer.fn()}})}
const app=createRoot(document.getElementById('root'));
try{
 await act(async()=>{app.render(React.createElement(load(path.join(root,'app/home/page.tsx')).default));await new Promise(resolve=>setTimeout(resolve,0))});
 check(document.body.textContent.includes('Data readiness'));
 const explanation=document.querySelector('.disclosure-button');check(explanation.getAttribute('aria-expanded')==='false');check(document.getElementById(explanation.getAttribute('aria-controls')).hidden);await act(async()=>explanation.click());check(explanation.getAttribute('aria-expanded')==='true');check(!document.getElementById(explanation.getAttribute('aria-controls')).hidden);await act(async()=>explanation.click());check(explanation.getAttribute('aria-expanded')==='false');
 await fill(document.querySelector('select[aria-label="Chart signal"]'),'stress');check(document.querySelector('svg[role=img]').getAttribute('aria-label').includes('stress recorded values in /10'));
 for(const name of ['Daily check-in','Cognitive tests','My baseline','Trends & import','Voice signal','Personal predictions','Privacy & data']){await click(name);check(document.querySelector('h1').textContent===name)}
 await click('My baseline');await fill(document.getElementById('reference-signal'),'Stress');check(document.querySelector('svg[role=img]').getAttribute('aria-label').startsWith('Stress:'));await act(async()=>document.querySelector('input[type=checkbox]').click());check(document.body.textContent.includes('Within typical range.'));
 await act(async()=>document.querySelector('.research-nav summary').click());await click('Methods & evaluation');check(document.querySelector('h1').textContent==='About the research');
 await click('Trends & import');await click('Edit');
 check(document.querySelector('input[type=time]').value==='23:00');
 const ranges=document.querySelectorAll('input[type=range]');await fill(ranges[0],'6.5');await fill(document.querySelector('input[aria-label="Daily steps"]'),'7000');
 await fill(document.querySelector('input[type=time]'),'22:30');const previousTwinWrites=calls.filter(c=>c.url==='/api/twin/'&&c.method==='POST').length;await click('Save check-in');check(records.checkins.find(r=>r.steps===7000));check(calls.filter(c=>c.url==='/api/twin/'&&c.method==='POST').length>previousTwinWrites);
 check(records.checkins.find(row=>row.on_date===today).sleep===6.5&&records.checkins.find(row=>row.on_date===today).bed_time==='22:30');
 await click('Cognitive tests');
 await fill(document.getElementById('assessment-hours-awake'),'8');await fill(document.getElementById('assessment-sleepiness'),'4');await click('Start assessment');
 for(let i=0;i<5;i++){await advance(5000);clock+=350;await click('Tap now')}
 for(let round=0;round<3;round++){const digits=document.querySelector('.memory-digits').textContent;await advance(4000);await fill(document.querySelector('input[inputmode=numeric]'),digits);await click('Submit recall')}
 await click('Save assessment');check(records.assessments.length===1);check(records.assessments[0].memory_accuracy===100);check(records.assessments[0].hours_awake===8);
 await fill(document.getElementById('assessment-hours-awake'),'8');await fill(document.getElementById('assessment-sleepiness'),'4');await click('Start assessment');await act(async()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new window.Event('visibilitychange'))});check(document.body.textContent.includes('Assessment interrupted'));Object.defineProperty(document,'hidden',{value:false,configurable:true});
 await click('Trends & import');check(document.body.textContent.includes('sleepiness 4/10'));check(document.body.textContent.includes('7000'));
 await click('Voice signal');check(document.body.textContent.includes('No voice features saved'));check(!button('Start microphone'));
 await click('Privacy & data');await act(async()=>document.querySelectorAll('input[type=checkbox]')[2].click());await click('Save consent choices');
 await click('Voice signal');await click('Start microphone');clock+=5000;
 await act(async()=>[...document.querySelectorAll('button')].find(el=>el.textContent.startsWith('Stop recording')).click());
 await click('Save numeric features');check(records.voices.length===1);check(records.voices[0].duration_ms===5000);check(Math.abs(records.voices[0].rms_mean-.1)<1e-6);check(trackStops===1);
 await click('Start microphone');await act(async()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new window.Event('visibilitychange'))});check(!button('Save numeric features'));check(trackStops===2);Object.defineProperty(document,'hidden',{value:false,configurable:true});
 await click('Personal predictions');check(button('Generate personal prediction').disabled);await act(async()=>document.querySelector('input[type=checkbox]').click());await click('Generate personal prediction');check(document.body.textContent.includes('Complete at least three assessments'));await click('Go to cognitive tests');check(document.querySelector('h1').textContent==='Cognitive tests');
 await click('Privacy & data');await click('Export my records');check(downloads===1);
 check(button('Delete my account').disabled);
 const inputs=document.querySelectorAll('input[type=checkbox]');await act(async()=>inputs[0].click());await click('Save consent choices');check(records.preferences.storage_consent===false);
 await click('Daily check-in');check(button('Save check-in').disabled);
 await click('Privacy & data');await click('Delete all wellness data');check(records.checkins.length===0&&records.assessments.length===0&&snapshots.length===0);
 await click('Sign out');check(document.body.textContent.includes('Your mind. Your workspace.'));
 console.log(`${checks} actual React interaction checks passed with mocked auth/API (all workspace tabs, edit/save, full cognitive task, simulated voice capture/cleanup, prediction eligibility, export, consent, deletion and sign-out).`);
}finally{await act(async()=>app.unmount());dom.window.close()}
