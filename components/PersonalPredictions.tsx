'use client';
import SeeMore from './SeeMore';
import {useEffect,useState} from 'react';
import {api} from '../lib/supabase';
type Prediction={id:string;created_at:string;expires_at:string;history_cutoff:string;model_version:string;protocol_version:string;model_prediction_ms:number;baseline_prediction_ms:number;actual_reaction_ms:number|null;status:'pending'|'matched'|'expired'|'invalidated'};
export default function PersonalPredictions({storageConsent}:{storageConsent:boolean}){
 const [rows,setRows]=useState<Prediction[]>([]),[busy,setBusy]=useState(true),[error,setError]=useState(''),[acknowledged,setAcknowledged]=useState(false),[now,setNow]=useState(Date.now()),[notice,setNotice]=useState('');
 useEffect(()=>{let active=true;api<{predictions:Prediction[]}>('/api/predictions/').then(result=>{if(active)setRows(result.predictions)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setBusy(false)});const interval=setInterval(()=>setNow(Date.now()),30000);return()=>{active=false;clearInterval(interval)}},[]);
 async function run(generate:boolean){setBusy(true);setError('');setNotice('');try{
  if(generate){await api('/api/predictions/','POST',{acknowledgeExperiment:acknowledged});setNotice('Forecast saved, or the existing forecast for your latest assessment was restored.');setAcknowledged(false);}
  const result=await api<{predictions:Prediction[]}>('/api/predictions/');setRows(result.predictions);setNow(Date.now());
 }catch(e){setError(e instanceof Error?e.message:'Please try again.')}finally{setBusy(false)}}
 const matched=rows.filter(row=>row.status==='matched'&&row.actual_reaction_ms!==null);
 const mae=(key:'model_prediction_ms'|'baseline_prediction_ms')=>matched.reduce((total,row)=>total+Math.abs(row[key]-row.actual_reaction_ms!),0)/matched.length;
 return <section className="panel">
  <h2>Experimental personal predictions</h2><p className="panel-sub">Estimate your next reaction time. Experimental, not a brain-health or disease prediction.</p><SeeMore label="What milliseconds mean"><p>Reaction time is the delay between the signal and your tap. We use milliseconds (ms) because responses are shorter than a second: 1,000 ms = 1 second. Lower means faster on this task, not healthier. Error in ms is the distance between an estimate and the later measured result; lower error is better.</p></SeeMore>
  <SeeMore label="Details"><p className="panel-sub mt-4">Estimate your next recorded five-trial reaction result using a fixed Ridge model trained on real Brighter Time PVT records. This is an unvalidated transfer experiment: the research task differs from this browser task. It is not a neurological assessment.</p></SeeMore>
  <SeeMore label="Details"><p className="panel-sub">The recent-average baseline performed slightly better in repeated research evaluation (39.258 ms MAE versus 39.907 ms for Ridge). Both estimates are shown. These research errors are not personal confidence intervals.</p></SeeMore>
  <h3 className="mt-6">Create a forecast before your next test</h3>
  <p className="panel-sub">Save three assessments first, then forecast before your next test. Complete that test within the 48-hour window.</p><SeeMore label="Forecast eligibility"><p>Assessments need hours awake, sleepiness and start-time context. The window ends 48 hours after the source test started. Older records without context are excluded. Repeated tests can introduce practice effects.</p></SeeMore>
  <label className="consent"><input type="checkbox" checked={acknowledged} disabled={busy||!storageConsent} onChange={e=>setAcknowledged(e.target.checked)}/>I understand this experimental model is not validated for my browser task, and agree to save its forecast and compare it with my next recorded result.</label>
  <button className="primary-button" disabled={busy||!storageConsent||!acknowledged} onClick={()=>run(true)}>Generate personal prediction</button>{' '}
  <button className="secondary-button" disabled={busy} onClick={()=>run(false)}>Refresh predictions</button>
  {!storageConsent&&<p>Enable storage in Privacy &amp; data first.</p>}
  {busy&&<p role="status">Loading predictions…</p>}{error&&<p role="alert" className="error-message">{error}</p>}{notice&&<p role="status">{notice}</p>}
  <h3 className="mt-6">Your forecast history</h3>
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
  {matched.length>0&&<div className="mt-6"><h3>Observed performance in this history</h3><p>{matched.length} matched forecast{matched.length===1?'':'s'} · model MAE {mae('model_prediction_ms').toFixed(1)} ms · recent-average MAE {mae('baseline_prediction_ms').toFixed(1)} ms.</p><p className="panel-sub">Based on the latest 100 loaded forecasts, not a clinical validation study.</p></div>}
  <SeeMore label="Details"><p className="panel-sub mt-6">Your account records stay in Supabase. No paid prediction API or Groq request is used. The model does not automatically retrain. Predictions are included in record export and removed when you delete wellness data or your account.</p></SeeMore>
 </section>;
}
