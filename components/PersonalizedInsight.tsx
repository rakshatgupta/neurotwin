'use client';
import SeeMore from './SeeMore';
import ExplanationText from './ExplanationText';
import {useState} from 'react';
import {Sparkles} from 'lucide-react';
import type {Dataset} from '../lib/types';
import {buildTwin} from '../lib/analytics';
import {GROQ_CONSENT_VERSION,statisticalInsight} from '../lib/insights';
import {api} from '../lib/supabase';

type Props = {data: Dataset; busy: boolean; refresh: () => Promise<void>; task: (action: () => Promise<void>) => Promise<void>};
export default function PersonalizedInsight({data,busy,refresh,task}: Props) {
 const [confirmed,setConfirmed]=useState(false),[notice,setNotice]=useState('');
 const hasSignals=!!(data.checkins.length||data.assessments.length||data.voices.length);
 const twin=buildTwin(data.checkins,data.assessments,data.voices);
 const summary=statisticalInsight(twin);
 async function generate(){
  setNotice('');setConfirmed(false);
  await task(async()=>{
   const result=await api<{kind:'ai'|'statistical';notice?:string}>('/api/insights/','POST',{consent:true,consentVersion:GROQ_CONSENT_VERSION});
   await refresh();
   setNotice(result.kind==='ai'?'Groq explanation saved.':result.notice||'AI unavailable. Your built-in statistical summary is shown below.');
  });
 }
 return <section className="panel mt-6">
  <h2><Sparkles size={18} className="inline mr-2"/>Personalized insight</h2>
  <div className="insight-block"><span className="section-eyebrow">From your records</span><h3>Built-in statistical summary</h3>
  <p className="panel-sub">A quick view of your latest daily entry. Not a diagnosis.</p>
  {twin.latest?<dl className="insight-facts"><div><dt>Sleep duration</dt><dd>{twin.latest.sleep} <small>hours</small></dd></div><div><dt>Movement</dt><dd>{twin.latest.activity} <small>minutes</small></dd></div>{twin.latest.steps!=null&&<div><dt>Daily steps</dt><dd>{twin.latest.steps} <small>steps</small></dd></div>}<div><dt>Reported stress</dt><dd>{twin.latest.stress}<small>/10</small></dd></div></dl>:<p className="panel-sub">No daily entry yet. Other available signals are analyzed separately.</p>}
  <p className="panel-sub"><strong>Recent flagged changes:</strong> {twin.currentDeviations.length?twin.currentDeviations.map(f=>f.name).join(', '):twin.freshFactors.length?'None in eligible recent signals.':'More history is needed.'}</p>
  <ExplanationText text={summary} label="Full statistical summary"/>
  <SeeMore label="How this summary is made"><p className="panel-sub">Calculated from your records in this browser. No external AI request, API key or AI consent is needed. This is not AI-generated text.</p></SeeMore></div>
  <div className="insight-block"><span className="section-eyebrow">Optional</span><h3>AI explanation with Groq</h3><p className="panel-sub">Ask AI to explain your summarized patterns. Your statistical summary stays available without it.</p>
  <label className="consent"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} disabled={busy||!data.preferences.ai_consent||!data.aiAvailable}/>Send my summarized wellness signals to Groq for this explanation. No email, account ID or raw audio is sent. Groq’s data policies apply; the explanation is saved in my account.</label>
  <button className="primary-button mt-4" disabled={busy||!confirmed||!data.preferences.ai_consent||!data.aiAvailable||!hasSignals} onClick={generate}>{busy?'Working…':'Generate AI explanation'}</button>
  <p className="panel-sub">{!data.aiAvailable?'Groq is not configured. You can use the statistical summary above without paying for an AI API.':!data.preferences.ai_consent?'Review and save the updated Groq consent in Privacy & data. Previous OpenAI consent does not enable Groq.':!hasSignals?'Save a check-in, cognitive result or optional voice feature before requesting an explanation.':'10 attempts per UTC day; wait one minute between requests.'}</p>
  {notice&&<p className="auth-message mt-4" role="status">{notice}</p>}
  </div>
  {data.insights[0]&&<div className="insight-block saved-insight"><span className="section-eyebrow">Saved in your account</span><h3>Last saved AI explanation</h3><p className="panel-sub">{new Date(data.insights[0].created_at).toLocaleString()} · Previous providers’ explanations are retained until you delete your records.</p><ExplanationText text={data.insights[0].content} label="Full AI explanation"/></div>}
 </section>;
}
