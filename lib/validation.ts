import type { Checkin } from './types';
export class InputError extends Error {}
export function record(input: unknown): Record<string,unknown> {
  if(!input || typeof input!=='object' || Array.isArray(input)) throw new InputError('Invalid request.');
  return input as Record<string,unknown>;
}
export function number(value:unknown,min:number,max:number,name:string) {
  if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max) throw new InputError(`${name} must be between ${min} and ${max}.`);
  return value;
}
export function checkin(input:unknown):Checkin {
  const v=record(input);
  const date=v.on_date;
  if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||date>new Date(Date.now()+86400000).toISOString().slice(0,10)||date<'2000-01-01') throw new InputError('Use a valid date from 2000 through today.');
  if(!['Clear','Balanced','Foggy','Tired'].includes(String(v.mood)))throw new InputError('Select a valid mood.');
  const result:Checkin={on_date:date,sleep:number(v.sleep,0,24,'Sleep'),activity:number(v.activity,0,1440,'Activity'),stress:number(v.stress,0,10,'Stress'),mood:v.mood as string,source:v.source==='csv'?'csv':'manual'};
  for(const key of ['bed_time','wake_time'] as const)if(key in v){const value=v[key];if(value!==null&&(typeof value!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)))throw new InputError('Use a local clock time in HH:MM format.');result[key]=value as string|null;}
  if('sleep_quality' in v){if(v.sleep_quality===null)result.sleep_quality=null;else{const quality=number(v.sleep_quality,1,5,'Sleep quality');if(!Number.isInteger(quality))throw new InputError('Sleep quality must be an integer.');result.sleep_quality=quality;}}
  if('steps' in v){if(v.steps===null)result.steps=null;else{const steps=number(v.steps,0,200000,'Steps');if(!Number.isInteger(steps))throw new InputError('Steps must be a whole number.');result.steps=steps;}}
  return result;
}
export function assessment(input:unknown) {
 const v=record(input), starts=number(v.false_starts,0,100,'False starts');
 if(!Number.isInteger(starts))throw new InputError('False starts must be an integer.');
 const result={reaction_ms:number(v.reaction_ms,80,10000,'Reaction time'),memory_accuracy:number(v.memory_accuracy,0,100,'Recall accuracy'),false_starts:starts};
 const contextKeys=['hours_awake','sleepiness_score','assessment_started_at','utc_offset_minutes'];
 // Older clients can still save legacy results, without fabricated context.
 if(!contextKeys.some(key=>v[key]!==undefined))return result;
 const hours=number(v.hours_awake,0,48,'Hours awake'),sleepiness=number(v.sleepiness_score,1,10,'Sleepiness'),offset=number(v.utc_offset_minutes,-840,840,'Timezone offset');
 if(!Number.isInteger(sleepiness)||!Number.isInteger(offset))throw new InputError('Sleepiness and timezone offset must be integers.');
 const started=v.assessment_started_at;
 if(typeof started!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(started)||!Number.isFinite(Date.parse(started))||new Date(started).toISOString()!==started||Date.parse(started)>Date.now()+300000||Date.parse(started)<Date.now()-3600000)throw new InputError('Assessment start time is invalid or older than one hour. Start a new assessment.');
 if(v.protocol_version!=='neurotwin-five-trial-v1')throw new InputError('Unsupported assessment protocol.');
 return {...result,hours_awake:hours,sleepiness_score:sleepiness,assessment_started_at:started,utc_offset_minutes:offset,protocol_version:'neurotwin-five-trial-v1'};
}
export function voice(input:unknown) {const v=record(input);return {duration_ms:number(v.duration_ms,3000,61000,'Recording duration'),rms_mean:number(v.rms_mean,0,1,'Audio level')};}
export function preferences(input:unknown) {const v=record(input);for(const key of ['storage_consent','ai_consent','voice_consent'])if(typeof v[key]!=='boolean')throw new InputError('Consent settings must be true or false.');if(!v.storage_consent&&(v.ai_consent||v.voice_consent))throw new InputError('Enable storage before optional processing.');return {storage_consent:v.storage_consent as boolean,ai_consent:v.ai_consent as boolean,voice_consent:v.voice_consent as boolean};}
export function csv(text:string) {
  if(text.length>100000)throw new InputError('CSV is too large (maximum 100 KB).');
  const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
  if(lines.length<2||lines.length>366)throw new InputError('Import 1–365 daily rows.');
  const header=lines.shift()?.trim(),withSteps=header==='date,sleep,activity,stress,mood,steps';
  if(header!=='date,sleep,activity,stress,mood'&&!withSteps)throw new InputError('Use the header: date,sleep,activity,stress,mood (optionally add ,steps)');
  const dates=new Set<string>();
  return lines.map((line,i)=>{const values=line.split(',').map(s=>s.trim());if(values.length!==(withSteps?6:5)||values.slice(1,4).some(s=>!s))throw new InputError(`Invalid row ${i+2}.`);if(withSteps&&values[5]&&!/^\d+$/.test(values[5]))throw new InputError(`Steps in row ${i+2} must be a whole count.`);const r=checkin({on_date:values[0],sleep:Number(values[1]),activity:Number(values[2]),stress:Number(values[3]),mood:values[4],source:'csv',...(withSteps?{steps:values[5]?Number(values[5]):null}:{})});if(dates.has(r.on_date))throw new InputError('Each date must appear only once.');dates.add(r.on_date);return r;});
}
