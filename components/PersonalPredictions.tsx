'use client';
import SeeMore from './SeeMore';
import {useEffect,useState} from 'react';
import {api} from '../lib/supabase';
import type {Assessment} from '../lib/types';
type Prediction={id:string;created_at:string;expires_at:string;history_cutoff:string;model_version:string;protocol_version:string;model_prediction_ms:number;baseline_prediction_ms:number;actual_reaction_ms:number|null;status:'pending'|'matched'|'expired'|'invalidated'};
export default function PersonalPredictions({storageConsent,assessments=[],onStartAssessment}:{storageConsent:boolean;assessments?:Assessment[];onStartAssessment?:()=>void}){
 const [rows,setRows]=useState<Prediction[]>([]),[busy,setBusy]=useState(true),[error,setError]=useState(''),[acknowledged,setAcknowledged]=useState(false),[now,setNow]=useState(Date.now()),[notice,setNotice]=useState('');
 useEffect(()=>{let active=true;api<{predictions:Prediction[]}>('/api/predictions/').then(result=>{if(active)setRows(result.predictions)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setBusy(false)});const interval=setInterval(()=>setNow(Date.now()),30000);return()=>{active=false;clearInterval(interval)}},[]);
 async function run(generate:boolean){setBusy(true);setError('');setNotice('');try{
  if(generate){await api('/api/predictions/','POST',{acknowledgeExperiment:acknowledged});setNotice('Forecast saved, or the existing forecast for your latest assessment was restored.');setAcknowledged(false);}
  const result=await api<{predictions:Prediction[]}>('/api/predictions/');setRows(result.predictions);setNow(Date.now());
 }catch(e){setError(e instanceof Error?e.message:'Please try again.')}finally{setBusy(false)}}
 const latest=rows.find(row=>row.status==='pending'&&Date.parse(row.expires_at)>now)||rows[0];
 const latestStatus=latest?.status==='pending'&&Date.parse(latest.expires_at)<=now?'expired':latest?.status;
 const contextCount=assessments.filter(a=>a.protocol_version==='neurotwin-five-trial-v1'&&a.hours_awake!=null&&a.sleepiness_score!=null&&a.assessment_started_at&&a.utc_offset_minutes!=null).length;
 const matched=rows.filter(row=>row.status==='matched'&&row.actual_reaction_ms!==null);
 const mae=(key:'model_prediction_ms'|'baseline_prediction_ms')=>matched.reduce((total,row)=>total+Math.abs(row[key]-row.actual_reaction_ms!),0)/matched.length;
 return <section className="panel">
  <h2>Your next reaction-time estimate</h2><p className="panel-sub">A forecast of the delay between the signal and your tap in your next cognitive test. Experimental—not a brain-health score.</p>
  {latest?<section className="prediction-result" aria-label="Latest prediction result"><span className="section-eyebrow">{latestStatus==='pending'?'Waiting for your next test':latestStatus==='matched'?'Compared with a later test':latestStatus==='expired'?'Forecast window closed':'Forecast cannot be compared'}</span>
   <div className="prediction-values"><div><span>Trained-model estimate</span><strong>{Number(latest.model_prediction_ms).toFixed(1)} <small>ms</small></strong></div><div><span>Recent-average estimate</span><strong>{Number(latest.baseline_prediction_ms).toFixed(1)} <small>ms</small></strong></div>{latest.status==='matched'&&latest.actual_reaction_ms!==null&&<div><span>Later measured result</span><strong>{Number(latest.actual_reaction_ms).toFixed(1)} <small>ms</small></strong></div>}</div>
   <p className="panel-sub">Saved {new Date(latest.created_at).toLocaleString()}. {latestStatus==='pending'? 'Complete and save your next assessment before '+new Date(latest.expires_at).toLocaleString()+', then refresh predictions.':latestStatus==='matched'?'The saved forecast has been compared with your next recorded test.':'This is a historical estimate. Create a new forecast from an eligible recent assessment.'}</p>
   {latest.status==='matched'&&latest.actual_reaction_ms!==null&&<p><strong>Model error:</strong> {Math.abs(latest.model_prediction_ms-latest.actual_reaction_ms).toFixed(1)} ms away from the later result. Lower error is better.</p>}
  </section>:busy?<p role="status">Loading your saved result…</p>:!error&&<div className="empty"><h3>No forecast saved yet</h3><p>Complete three assessments with context, then acknowledge the experiment and generate a prediction below. The website does not invent a result.</p></div>}
  <div className="prediction-workflow"><h3>What to do next</h3><ol><li>Save three cognitive assessments with hours awake and sleepiness.</li><li>Generate a forecast before starting your next assessment.</li><li>Save that next assessment within the forecast window and refresh here.</li></ol><p className="panel-sub">{contextCount} context-bearing assessment{contextCount===1?'':'s'} loaded. The server checks recency and eligibility; the window ends 48 hours after the source assessment started.</p>{onStartAssessment&&<button type="button" className="secondary-button" onClick={onStartAssessment}>Go to cognitive tests</button>}</div>
  <label className="consent"><input type="checkbox" checked={acknowledged} disabled={busy||!storageConsent} onChange={e=>setAcknowledged(e.target.checked)}/>I understand this experimental model is not validated for my browser task, and agree to save its forecast and compare it with my next recorded result.</label>
  <button className="primary-button" disabled={busy||!storageConsent||!acknowledged} onClick={()=>run(true)}>Generate personal prediction</button>{' '}
  <button className="secondary-button" disabled={busy} onClick={()=>run(false)}>Refresh predictions</button>
  {!storageConsent&&<p>Enable storage in Privacy &amp; data first.</p>}
  {busy&&<p role="status">Loading predictions…</p>}{error&&<p role="alert" className="error-message">{error}</p>}{notice&&<p role="status">{notice}</p>}
  <SeeMore label="What this model uses and what ms means"><p>Milliseconds measure short delays: 1,000 ms equals one second. Lower means faster responses on this task, not better brain health. The fixed research model uses earlier reaction results, hours awake, sleepiness and time of day. Voice amplitude, step counts and daily sleep/stress entries are not model inputs.</p><p>The recent-average estimate is shown because it slightly outperformed the model in repeated research evaluation. Neither estimate is a calibrated personal confidence interval.</p></SeeMore>
  <SeeMore label="Your forecast history"><h3>Your forecast history</h3>
  {!busy&&!rows.length&&<p className="panel-sub">No saved predictions yet.</p>}
  {rows.map(row=>{const status=row.status==='pending'&&Date.parse(row.expires_at)<=now?'expired':row.status;return <article key={row.id} className="mt-6">
   <h4>{new Date(row.created_at).toLocaleString()} · {status}</h4>
   <div className="data-row"><span>Trained-model estimate</span><span>{Number(row.model_prediction_ms).toFixed(1)} ms</span></div>
   <div className="data-row"><span>Recent-average estimate</span><span>{Number(row.baseline_prediction_ms).toFixed(1)} ms</span></div>
   {row.status==='matched'&&row.actual_reaction_ms!==null&&<><div className="data-row"><span>Later measured result</span><span>{Number(row.actual_reaction_ms).toFixed(1)} ms</span></div><div className="data-row"><span>Model / baseline absolute error</span><span>{Math.abs(row.model_prediction_ms-row.actual_reaction_ms).toFixed(1)} / {Math.abs(row.baseline_prediction_ms-row.actual_reaction_ms).toFixed(1)} ms</span></div></>}
   <p className="panel-sub">Window ends {new Date(row.expires_at).toLocaleString()}.</p>
   <SeeMore label="Technical details"><p className="panel-sub">Model: {row.model_version}. Task: {row.protocol_version}. History cutoff: {new Date(row.history_cutoff).toLocaleString()}.</p></SeeMore>
   {status==='pending'&&<p className="panel-sub">Complete and save your next cognitive assessment within the window, then refresh here to compare.</p>}
   {status==='invalidated'&&<p className="panel-sub">A later saved assessment had missing timing or had already started when this forecast was created. It cannot be used as a prospective outcome.</p>}
  </article>})}
  </SeeMore>
  {matched.length>0&&<div className="mt-6"><h3>Observed performance in this history</h3><p>{matched.length} matched forecast{matched.length===1?'':'s'} · model MAE {mae('model_prediction_ms').toFixed(1)} ms · recent-average MAE {mae('baseline_prediction_ms').toFixed(1)} ms.</p><p className="panel-sub">Based on the latest 100 loaded forecasts, not a clinical validation study.</p></div>}
  <SeeMore label="Details"><p className="panel-sub mt-6">Your account records stay in Supabase. No paid prediction API or Groq request is used. The model does not automatically retrain. Predictions are included in record export and removed when you delete wellness data or your account.</p></SeeMore>
 </section>;
}
