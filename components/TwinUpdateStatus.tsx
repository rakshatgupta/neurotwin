'use client';
import {useEffect,useState} from 'react';
import type {Dataset} from '../lib/types';
import type {HistoryPoint} from '../lib/analytics';
import {api} from '../lib/supabase';
type Update={id:string;created_at:string;algorithm_version:string;dataset_hash:string;summary:{evaluated_at:string;status:string;counts:{checkins:number;assessments:number;voices:number};sources:Record<string,{id?:string;date:string;updated_at?:string}[]>;deviation_count:number;deviations:HistoryPoint[]}};
export default function TwinUpdateStatus({data}:{data:Dataset}){
 const [updates,setUpdates]=useState<Update[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const revision=JSON.stringify([data.checkins,data.assessments,data.voices,data.preferences.storage_consent]);
 useEffect(()=>{let active=true;
  async function sync(){setBusy(true);setError('');let warning='';
   try{if(data.preferences.storage_consent)await api('/api/twin/','POST');}catch(e){warning=e instanceof Error?e.message:'Processing history could not be saved.'}
   try{const result=await api<{updates:Update[]}>('/api/twin/');if(active){setUpdates(result.updates);setError(warning)}}catch(e){if(active){setUpdates([]);setError(e instanceof Error?e.message:'Processing history is unavailable.')}}finally{if(active)setBusy(false)}
  }
  void sync();return()=>{active=false};
 },[revision,retry]);
 const latest=updates[0];
 return <section className="panel mt-6" aria-label="Digital twin processing status"><h2>Latest saved twin update</h2>
 {busy&&<p role="status">Checking saved analysis…</p>}{error&&<p role="status" className="panel-sub">{error} <button type="button" disabled={busy} onClick={()=>setRetry(n=>n+1)}>Retry processing history</button></p>}
 {latest?<><p>Saved {new Date(latest.created_at).toLocaleString()} · reference {latest.summary.status==='established'?'established':'forming'}.</p><p className="panel-sub">Data used: {latest.summary.counts?.checkins??0} daily records, {latest.summary.counts?.assessments??0} cognitive sessions, {latest.summary.counts?.voices??0} optional voice records. This snapshot describes the data evaluated at that time, not a continuous sensor connection.</p>
 <details><summary>Saved changes, source records and processing history</summary>
 <p className="panel-sub">Each distinct dataset is recorded once per algorithm version. Snapshots preserve computed findings when source check-ins are later edited. They are private self-report research records, not tamper-proof clinical evidence.</p>
 {updates.map(update=><article className="mt-4" key={update.id}><h3>{new Date(update.created_at).toLocaleString()}</h3><p className="panel-sub">{update.algorithm_version} · {update.summary.deviation_count??0} historical flags (latest 100 retained per snapshot).</p>
 {Array.isArray(update.summary.deviations)&&update.summary.deviations.slice(-10).reverse().map((point,i)=><p className="panel-sub" key={i}>{point.date.slice(0,10)} · {point.signal}: {Number(point.value).toFixed(2)} {point.unit}, earlier reference {Number(point.reference).toFixed(2)}; {Math.abs(point.deviation).toFixed(2)} reference spreads {point.deviation<0?'below':'above'}.</p>)}
 <details><summary>Input record references</summary><p className="panel-sub">Dataset fingerprint: {update.dataset_hash}</p>{Object.entries(update.summary.sources||{}).map(([name,rows])=><p className="panel-sub" key={name}>{name}: {Array.isArray(rows)?rows.map(row=>`${row.date.slice(0,10)} (${row.id||'unavailable ID'})`).join(', '):'Unavailable'}</p>)}</details>
 </article>)}
 </details></>:!busy&&<p className="panel-sub">No saved processing update yet. With storage consent, new records create one automatically when the workspace refreshes. Live baseline calculations remain available.</p>}
 </section>;
}
