import type {Checkin,Assessment,Voice} from './types';
export function median(values:number[]) {if(!values.length)return 0;const a=[...values].sort((x,y)=>x-y),i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2;}
export function baseline(values:number[],floor:number) {const center=median(values);return {center,spread:Math.max(floor,1.4826*median(values.map(x=>Math.abs(x-center)))),count:values.length};}
export function buildTwin(checkins:Checkin[],assessments:Assessment[]=[],voices:Voice[]=[]) {
  const ordered=[...checkins].sort((a,b)=>a.on_date.localeCompare(b.on_date));
  const latest=ordered.at(-1),prior=ordered.slice(-31,-1);
  const factors:{name:string;latest:number;baseline:number;deviation:number;unit:string;observations:number}[]=[];
  if(latest && prior.length>=7)for(const [key,label,floor,unit] of [['sleep','Sleep',.5,'hours'],['activity','Activity',10,'minutes'],['stress','Stress',1,'/10']] as const){const ref=baseline(prior.map(e=>e[key]),floor);factors.push({name:label,latest:latest[key],baseline:ref.center,deviation:(latest[key]-ref.center)/ref.spread,unit,observations:ref.count});}
  const tests=[...assessments].sort((a,b)=>a.created_at.localeCompare(b.created_at)),test=tests.at(-1);
  if(test && tests.length>=4)for(const [key,label,floor,unit] of [['reaction_ms','Reaction time',40,'ms'],['memory_accuracy','Recall accuracy',10,'%']] as const){const ref=baseline(tests.slice(-31,-1).map(e=>e[key]),floor);factors.push({name:label,latest:test[key],baseline:ref.center,deviation:(test[key]-ref.center)/ref.spread,unit,observations:ref.count});}
  const voiceRows=[...voices].sort((a,b)=>a.created_at.localeCompare(b.created_at)),v=voiceRows.at(-1);
  if(v&&voiceRows.length>=4){const ref=baseline(voiceRows.slice(-31,-1).map(e=>e.rms_mean),.03);factors.push({name:'Recording level',latest:v.rms_mean,baseline:ref.center,deviation:(v.rms_mean-ref.center)/ref.spread,unit:'RMS',observations:ref.count});}
  const deviations=factors.filter(f=>Math.abs(f.deviation)>=2.5);
  const fusion=factors.length?factors.reduce((s,f)=>s+Math.min(Math.abs(f.deviation),5),0)/factors.length:null;
  const recent=ordered.slice(-14);
  let sleepTrend:number|null=null;
  let sleepForecast:{date:string;estimate:number;low:number;high:number}|null=null;
  if(recent.length>=7){const x=recent.map(e=>(Date.parse(e.on_date)-Date.parse(recent[0].on_date))/86400000),xm=x.reduce((a,b)=>a+b,0)/x.length,ym=recent.reduce((a,b)=>a+b.sleep,0)/recent.length,den=x.reduce((a,b)=>a+(b-xm)**2,0);sleepTrend=den?x.reduce((s,n,i)=>s+(n-xm)*(recent[i].sleep-ym),0)/den:0;const slope=sleepTrend,intercept=ym-slope*xm,estimate=Math.max(0,Math.min(24,intercept+slope*(x.at(-1)!+1))),residuals=recent.map((e,i)=>e.sleep-(intercept+slope*x[i])),spread=baseline(residuals,.5).spread;sleepForecast={date:new Date(Date.parse(recent.at(-1)!.on_date)+86400000).toISOString().slice(0,10),estimate,low:Math.max(0,estimate-2*spread),high:Math.min(24,estimate+2*spread)};}
  return {status:prior.length>=7?'established':'forming',checkinDays:ordered.length,latest:latest||null,factors,deviations,fusion,sleepTrend,sleepForecast,method:'Rolling 30-observation median and MAD, minimum variance floors, latest observation excluded; change threshold 2.5 robust standard deviations. Recording levels reflect device/environment as well as voice. Changes are not diagnoses.'};
}
