import {createHash} from 'node:crypto';
import {buildTwin,twinHistory} from './analytics';
import type {Checkin,Assessment,Voice} from './types';
export const TWIN_ALGORITHM_VERSION='rolling-mad-v2';
export function twinSnapshot(checkins:Checkin[],assessments:Assessment[],voices:Voice[],now=Date.now()) {
 const c=[...checkins].sort((a,b)=>a.on_date.localeCompare(b.on_date));
 const a=[...assessments].sort((a,b)=>a.created_at.localeCompare(b.created_at));
 const v=[...voices].sort((a,b)=>a.created_at.localeCompare(b.created_at));
 const dataset_hash=createHash('sha256').update(JSON.stringify({checkins:c,assessments:a,voices:v})).digest('hex');
 const twin=buildTwin(c,a,v,now),history=twinHistory(c,a,v);
 return {algorithm_version:TWIN_ALGORITHM_VERSION,dataset_hash,summary:{
  evaluated_at:new Date(now).toISOString(),status:twin.status,
  counts:{checkins:c.length,assessments:a.length,voices:v.length},
  sources:{checkins:c.map(r=>({id:r.id,date:r.on_date,updated_at:r.updated_at||r.created_at||null})),assessments:a.map(r=>({id:r.id,date:r.created_at})),voices:v.map(r=>({id:r.id,date:r.created_at}))},
  factors:twin.factors,fusion:twin.fusion,sleepTrend:twin.sleepTrend,
  deviation_count:history.filter(p=>Math.abs(p.deviation)>=2.5).length,
  deviations:history.filter(p=>Math.abs(p.deviation)>=2.5).slice(-100),
  method:twin.method,
 }};
}
