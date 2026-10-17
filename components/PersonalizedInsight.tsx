'use client';
import {useState} from 'react';
import {Sparkles} from 'lucide-react';
import type {Dataset} from '../lib/types';
import {buildTwin} from '../lib/analytics';
import {GROQ_CONSENT_VERSION,statisticalInsight} from '../lib/insights';
import {api} from '../lib/supabase';

type Props = {data: Dataset; busy: boolean; refresh: () => Promise<void>; task: (action: () => Promise<void>) => Promise<void>};
export default function PersonalizedInsight({data,busy,refresh,task}: Props) {
 const [confirmed,setConfirmed]=useState(false),[notice,setNotice]=useState('');
 const summary=statisticalInsight(buildTwin(data.checkins,data.assessments,data.voices));
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
  <h3 className="mt-6">Built-in statistical summary</h3>
  <p className="panel-sub">Calculated from your records in this browser. No external AI request, API key or AI consent is needed. This is not AI-generated text.</p>
  <p className="insight-content">{summary}</p>
  <h3 className="mt-6">Optional AI explanation with Groq</h3>
  <p className="panel-sub">Groq may offer free API usage within your account limits. If it is unavailable, the statistical summary above remains available.</p>
  <label className="consent"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} disabled={busy||!data.preferences.ai_consent||!data.aiAvailable}/>Send my summarized wellness signals to Groq for this explanation. No email, account ID or raw audio is sent. Groq’s data policies apply; the explanation is saved in my account.</label>
  <button className="primary-button mt-4" disabled={busy||!confirmed||!data.preferences.ai_consent||!data.aiAvailable||!data.checkins.length} onClick={generate}>{busy?'Working…':'Generate AI explanation'}</button>
  <p className="panel-sub">{!data.aiAvailable?'Groq is not configured. You can use the statistical summary above without paying for an AI API.':!data.preferences.ai_consent?'Review and save the updated Groq consent in Privacy & data. Previous OpenAI consent does not enable Groq.':!data.checkins.length?'Save a daily check-in before requesting an explanation.':'10 attempts per UTC day; wait one minute between requests.'}</p>
  {notice&&<p className="auth-message mt-4" role="status">{notice}</p>}
  {data.insights[0]&&<><h3 className="mt-6">Last saved AI explanation</h3><p className="panel-sub">{new Date(data.insights[0].created_at).toLocaleString()} · Previous providers’ explanations are retained until you delete your records.</p><p className="insight-content">{data.insights[0].content}</p></>}
 </section>;
}
