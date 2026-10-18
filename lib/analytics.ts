import type {Checkin,Assessment,Voice} from './types';
export function median(values:number[]) {if(!values.length)return 0;const a=[...values].sort((x,y)=>x-y),i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2;}
export function baseline(values:number[],floor:number) {const center=median(values);return {center,spread:Math.max(floor,1.4826*median(values.map(x=>Math.abs(x-center)))),count:values.length};}
export const FRESHNESS_DAYS=7;
export function isFresh(date:string,now=Date.now()) {const age=now-Date.parse(date);return Number.isFinite(age)&&age>=0&&age<=FRESHNESS_DAYS*86400000;}
export function buildTwin(checkins:Checkin[],assessments:Assessment[]=[],voices:Voice[]=[],now=Date.now()) {
  const ordered=[...checkins].sort((a,b)=>a.on_date.localeCompare(b.on_date));
  const latest=ordered.at(-1),prior=ordered.slice(-31,-1);
  const factors:{name:string;latest:number;baseline:number;deviation:number;unit:string;observations:number}[]=[];
  if(latest && prior.length>=7)for(const [key,label,floor,unit] of [['sleep','Sleep',.5,'hours'],['activity','Activity',10,'minutes'],['stress','Stress',1,'/10']] as const){const ref=baseline(prior.map(e=>e[key]),floor);factors.push({name:label,latest:latest[key],baseline:ref.center,deviation:(latest[key]-ref.center)/ref.spread,unit,observations:ref.count});}
  const tests=[...assessments].sort((a,b)=>a.created_at.localeCompare(b.created_at)),test=tests.at(-1);
  const priorTests=test?tests.filter(row=>Date.parse(row.created_at)<Date.parse(test.created_at)).slice(-30):[];
  if(test && priorTests.length>=3)for(const [key,label,floor,unit] of [['reaction_ms','Reaction time',40,'ms'],['memory_accuracy','Recall accuracy',10,'%']] as const){const ref=baseline(priorTests.map(e=>e[key]),floor);factors.push({name:label,latest:test[key],baseline:ref.center,deviation:(test[key]-ref.center)/ref.spread,unit,observations:ref.count});}
  const voiceRows=[...voices].sort((a,b)=>a.created_at.localeCompare(b.created_at)),v=voiceRows.at(-1);
  const priorVoices=v?voiceRows.filter(row=>Date.parse(row.created_at)<Date.parse(v.created_at)).slice(-30):[];
  if(v&&priorVoices.length>=3){const ref=baseline(priorVoices.map(e=>e.rms_mean),.03);factors.push({name:'Recording level',latest:v.rms_mean,baseline:ref.center,deviation:(v.rms_mean-ref.center)/ref.spread,unit:'RMS',observations:ref.count});}
  const datedFactors=factors.map(f=>{const recordedAt=f.name==='Recording level'?v!.created_at:(f.name==='Reaction time'||f.name==='Recall accuracy')?test!.created_at:latest!.on_date;return {...f,recordedAt,fresh:isFresh(recordedAt,now)};});
  const freshFactors=datedFactors.filter(f=>f.fresh);
  const fusion=freshFactors.length?freshFactors.reduce((s,f)=>s+Math.min(Math.abs(f.deviation),5),0)/freshFactors.length:null;
  const recent=ordered.slice(-14);
  let sleepTrend:number|null=null;
  let sleepForecast:{date:string;estimate:number;low:number;high:number}|null=null;
  if(recent.length>=7){const x=recent.map(e=>(Date.parse(e.on_date)-Date.parse(recent[0].on_date))/86400000),xm=x.reduce((a,b)=>a+b,0)/x.length,ym=recent.reduce((a,b)=>a+b.sleep,0)/recent.length,den=x.reduce((a,b)=>a+(b-xm)**2,0);sleepTrend=den?x.reduce((s,n,i)=>s+(n-xm)*(recent[i].sleep-ym),0)/den:0;const slope=sleepTrend,intercept=ym-slope*xm,estimate=Math.max(0,Math.min(24,intercept+slope*(x.at(-1)!+1))),residuals=recent.map((e,i)=>e.sleep-(intercept+slope*x[i])),spread=baseline(residuals,.5).spread;sleepForecast={date:new Date(Date.parse(recent.at(-1)!.on_date)+86400000).toISOString().slice(0,10),estimate,low:Math.max(0,estimate-2*spread),high:Math.min(24,estimate+2*spread)};}
  return {status:prior.length>=7?'established':'forming',checkinDays:ordered.length,assessmentSessions:tests.length,voiceRecordings:voiceRows.length,latest:latest||null,factors:datedFactors,deviations:datedFactors.filter(f=>Math.abs(f.deviation)>=2.5),freshFactors,currentDeviations:freshFactors.filter(f=>Math.abs(f.deviation)>=2.5),fusion,sleepTrend,sleepForecast,method:'Rolling 30-observation median and MAD, minimum variance floors, latest observation excluded; change threshold 2.5 robust standard deviations. Combined variation uses only readings from the past 7 days; this is a display policy, not a medical threshold. Recording levels reflect device/environment as well as voice. Changes are not diagnoses.'};
}

export type HistoryPoint={signal:string;date:string;value:number;reference:number;spread:number;deviation:number;observations:number;unit:string};
export const HISTORY_SIGNALS=['Sleep','Activity','Stress','Reaction time','Recall accuracy','Recording level'];
export function twinHistory(checkins:Checkin[],assessments:Assessment[]=[],voices:Voice[]=[]) {
 const history:HistoryPoint[]=[];
 function series(rows:{date:string;value:number}[],signal:string,minimum:number,floor:number,unit:string){
  const sorted=[...rows].sort((a,b)=>a.date.localeCompare(b.date));
  sorted.forEach(point=>{const previous=sorted.filter(row=>Date.parse(row.date)<Date.parse(point.date)).slice(-30);if(previous.length<minimum)return;const ref=baseline(previous.map(row=>row.value),floor);history.push({signal,date:point.date,value:point.value,reference:ref.center,spread:ref.spread,deviation:(point.value-ref.center)/ref.spread,observations:ref.count,unit});});
 }
 series(checkins.map(r=>({date:r.on_date,value:r.sleep})),'Sleep',7,.5,'hours');
 series(checkins.map(r=>({date:r.on_date,value:r.activity})),'Activity',7,10,'minutes');
 series(checkins.map(r=>({date:r.on_date,value:r.stress})),'Stress',7,1,'/10');
 series(assessments.map(r=>({date:r.created_at,value:r.reaction_ms})),'Reaction time',3,40,'ms');
 series(assessments.map(r=>({date:r.created_at,value:r.memory_accuracy})),'Recall accuracy',3,10,'%');
 series(voices.map(r=>({date:r.created_at,value:r.rms_mean})),'Recording level',3,.03,'RMS');
 return history.sort((a,b)=>a.date.localeCompare(b.date)||a.signal.localeCompare(b.signal));
}
