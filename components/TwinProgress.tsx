'use client';
import SeeMore from './SeeMore';
import {useState} from 'react';
import MeasurementHelp from './MeasurementHelp';
import type {Dataset} from '../lib/types';
import {buildTwin,twinHistory,HISTORY_SIGNALS} from '../lib/analytics';
import {dataReadiness} from '../lib/readiness';
import {wellnessActions} from '../lib/guidance';

export function DataReadiness({data,now}:{data:Dataset;now:number}){
 const rows=dataReadiness(data,now),twin=buildTwin(data.checkins,data.assessments,data.voices,now);
 return <section className="panel mt-6"><h2>Data readiness</h2><SeeMore label="Details"><p className="panel-sub">Coverage of loaded records, not confidence in your health. References use available history; combined variation includes only readings from the past seven days.</p></SeeMore>
 <div className="readiness-grid">{rows.map(row=><article className="readiness-item" key={row.name}><h3>{row.name}</h3><p><strong>{row.status}</strong> · {row.count} / {row.needed} records for first eligibility</p><p className="panel-sub">Latest: {row.latest?`${row.latest.slice(0,10)} · ${row.fresh?'recent':'older than the display window or future-dated'}`:'not recorded'}</p><SeeMore label="Eligibility"><p className="panel-sub">{row.detail}</p></SeeMore></article>)}</div>
 <p className="panel-sub">{twin.freshFactors.length} eligible signal{twin.freshFactors.length===1?'':'s'} in the current combined summary. {twin.factors.filter(f=>!f.fresh).map(f=>`${f.name} (${f.recordedAt.slice(0,10)})`).join(', ')||'No eligible stale signals'} excluded as stale or future-dated. Readings in the same window may still be from different days.</p>
 <SeeMore label="Details"><p className="panel-sub">Workspace loads up to 365 daily records and 100 cognitive/voice sessions. Export includes older retained records.</p></SeeMore></section>;
}

export function WellnessGuidance({data,now}:{data:Dataset;now:number}){
 const twin=buildTwin(data.checkins,data.assessments,data.voices,now);
 return <section className="panel mt-6"><h2>Practical next steps</h2>
 <p className="panel-sub">Suggestions based on your available patterns. Not medical advice.</p><SeeMore label="Your suggested next steps"><ul className="guidance-list">
 {wellnessActions(twin).map(action=><li key={action}>{action}</li>)}
 {twin.status==='forming'&&<li>Keep recording on different days. Eight daily entries are needed for the first daily reference comparison.</li>}
 {!twin.freshFactors.length&&<li>No recent signal has enough reference history for the combined summary. Add a check-in or assessment under your usual conditions.</li>}
 {twin.currentDeviations.length>0&&<li>Review the flagged readings and their dates. A statistical flag can reflect sleep, attention, practice, device differences or recording conditions; it does not establish a health problem.</li>}
 <li>Use a similar device, setting and time of day when practical. Do not repeatedly test or deliberately change your sleep to obtain a particular score.</li>
 <li>If changes persist across comparable recordings, review your routine and consider discussing concerns with a qualified health professional. Seek advice about symptoms rather than relying on this dashboard to diagnose or rule out a condition.</li>
 </ul></SeeMore></section>;
}

export default function TwinProgress({data}:{data:Dataset}){
 const [signal,setSignal]=useState('Sleep'),[onlyFlags,setOnlyFlags]=useState(true);
 const history=twinHistory(data.checkins,data.assessments,data.voices);
 const points=history.filter(p=>p.signal===signal),shown=history.filter(p=>(!onlyFlags||Math.abs(p.deviation)>=2.5)).slice(-60).reverse();
 const low=points.length?Math.min(...points.flatMap(p=>[p.value,p.reference])):0,high=points.length?Math.max(...points.flatMap(p=>[p.value,p.reference])):1;
 const first=Date.parse(points[0]?.date||''),last=Date.parse(points.at(-1)?.date||'');
 const x=(date:string)=>35+530*(Date.parse(date)-first)/(last-first||1),y=(value:number)=>160-125*(value-low)/(high-low||1);
 return <section className="panel mt-6"><h2>How your reference changes</h2><SeeMore label="Details"><p className="panel-sub">Reconstructed from currently retained, loaded records. Each point uses only strictly earlier observations (up to 30), excluding itself. Editing, deleting or loading different history can change this reconstruction.</p></SeeMore>
 <label htmlFor="reference-signal">Signal <select id="reference-signal" className="range-select" value={signal} onChange={e=>setSignal(e.target.value)}>{HISTORY_SIGNALS.map(name=><option key={name}>{name}</option>)}</select></label>
 <MeasurementHelp signal={signal}/><p className="panel-sub">Blue: your recorded {signal.toLowerCase()} · dashed green: your usual value · orange: flagged change.</p>{points.length?<><svg className="chart" viewBox="0 0 600 200" role="img" aria-label={`${signal}: actual readings and rolling personal reference`}>
 <polyline points={points.map(p=>`${x(p.date)},${y(p.reference)}`).join(' ')} fill="none" stroke="#496957" strokeWidth="2" strokeDasharray="7 5"/>
 <polyline points={points.map(p=>`${x(p.date)},${y(p.value)}`).join(' ')} fill="none" stroke="#627fa0" strokeWidth="2"/>
 {points.map((p,i)=><circle key={i} cx={x(p.date)} cy={y(p.value)} r={Math.abs(p.deviation)>=2.5?5:3} fill={Math.abs(p.deviation)>=2.5?'#aa603e':'#627fa0'}><title>{`${p.date.slice(0,10)}: ${p.value.toFixed(2)} ${p.unit}; reference ${p.reference.toFixed(2)}; ${p.observations} earlier observations`}</title></circle>)}
 </svg><p className="panel-sub">Solid blue: recorded value · dashed green: rolling reference · orange dots: statistical flags. Scale {low.toFixed(2)}–{high.toFixed(2)} {points[0].unit}. {points[0].date.slice(0,10)} to {points.at(-1)!.date.slice(0,10)}.</p></>:<p className="empty mt-4">Not enough earlier history for {signal.toLowerCase()}. Daily signals need eight entries; cognitive and voice signals need four sessions.</p>}
 <h3 className="mt-6">Change timeline</h3><label className="consent"><input type="checkbox" checked={onlyFlags} onChange={e=>setOnlyFlags(e.target.checked)}/>Show flagged observations only</label>
 <SeeMore label="Details"><p className="panel-sub">Latest 60 matching comparisons across signals. A flag means an absolute change of at least 2.5 reference spreads, not a medical threshold.</p></SeeMore>
 {shown.length?<div className="overflow-x-auto"><table className="records-table"><thead><tr><th>Date / signal</th><th>Reading</th><th>Usual value</th><th>Explanation</th></tr></thead><tbody>{shown.map((p,i)=><tr key={`${p.signal}-${p.date}-${i}`}><td>{p.date.slice(0,10)}<br/>{p.signal}</td><td>{p.value.toFixed(2)} {p.unit}</td><td>{p.reference.toFixed(2)} {p.unit} · {p.observations} observations</td><td>{p.signal}: {Math.abs(p.value-p.reference).toFixed(2)} {p.unit==='%'?'percentage points':p.unit==='/10'?'rating points':p.unit} {p.deviation<0?'below':'above'} usual. {Math.abs(p.deviation)>=2.5?'Flagged change.':'Within typical range.'}</td></tr>)}</tbody></table></div>:<p className="panel-sub">No {onlyFlags?'flagged ':''}historical comparisons available. This does not establish that you are healthy.</p>}
 </section>;
}
