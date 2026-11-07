import SeeMore from './SeeMore';
import {referenceProjection,type ReferenceInput} from '../lib/counterfactual';
import fewShot from '../training/artifacts/brighter-time-few-shot.json';

function ReferencePlot({point}:{point:NonNullable<ReturnType<typeof referenceProjection>>}){
 const observed=(point.current-point.projected)/point.spread+point.deviationAfter;
 const span=Math.max(3,Math.abs(observed))*1.12;
 const x=(deviation:number)=>20+280*(deviation+span)/(2*span);
 return <figure className="mt-4 rounded-xl border p-3">
  <figcaption><strong>{point.name}</strong> — observed {observed.toFixed(2)}, hypothetical {point.deviationAfter.toFixed(2)} reference spread units</figcaption>
  <svg viewBox="0 0 320 64" role="img" aria-label={`${point.name}: observed point outside the variation threshold, hypothetical point just inside`} className="mt-2 w-full max-w-md">
   <rect x={x(-2.5)} y="12" width={x(2.5)-x(-2.5)} height="27" rx="4" fill="#ccfbf1"/>
   <path d="M20 25H300" stroke="#64748b"/>
   <line x1={x(0)} x2={x(0)} y1="12" y2="39" stroke="#64748b" strokeDasharray="3 2"/>
   <line x1={x(observed)} x2={x(point.deviationAfter)} y1="25" y2="25" stroke="#334155" strokeWidth="2"/>
   <circle cx={x(observed)} cy="25" r="5" fill="#9a3412"/>
   <rect x={x(point.deviationAfter)-4} y="21" width="8" height="8" fill="#0f766e"/>
   <text x={x(0)} y="54" textAnchor="middle" fontSize="11" fill="currentColor">Personal median</text>
  </svg>
 </figure>;
}

export default function ExperimentalResearch({factors}:{factors:ReferenceInput[]}){
 const projections=factors.map(referenceProjection).filter(p=>p!==null);
 return <section className="panel mt-6">
  <h2>Experimental learning lab</h2>
  <p className="panel-sub">Research tools. Your current predictions and reference calculations remain unchanged.</p>
  <h3 className="mt-6">What would change a variation flag?</h3>
  <p>This calculation moves a recorded value just inside its personal reference range. It is a mathematical comparison, not a recommended change to your body or a healthy target.</p>
  {projections.length?<div className="overflow-x-auto"><table className="records-table"><thead><tr><th>Signal</th><th>Recorded</th><th>Hypothetical value</th><th>Difference</th></tr></thead><tbody>{projections.map(p=><tr key={p.name}><td>{p.name}</td><td>{p.current.toFixed(2)} {p.unit}</td><td>{p.projected.toFixed(2)} {p.unit}</td><td>{p.change>0?'+':''}{p.change.toFixed(2)} {p.unit}</td></tr>)}</tbody></table></div>:<p className="mt-4">No fresh, flagged signals with sufficient earlier records are available. No change is suggested.</p>}
  <SeeMore label="See calculation and dependency graph">
   {projections.length>0&&<><p className="mt-4">Shading: inside the flag threshold. Circle: recorded value. Square: hypothetical value.</p>{projections.map(p=><ReferencePlot key={p.name} point={p}/>)}</>}
   <figure aria-label="Computational dependency graph, not a physiological causal model" className="mt-4"><div className="data-row"><span>Earlier records → fixed median &amp; spread</span></div><div className="data-row"><span>Recorded value + fixed reference → deviation → variation flag</span></div><figcaption>Computational dependencies only. No arrows assert that sleep, activity or voice causes another signal.</figcaption></figure>
   <p className="panel-sub">The observed deviation is (value − median) / spread. Projection minimizes absolute change in each signal’s original unit, subject to a deviation within ±2.49 and input bounds. Exactly ±2.5 would still be flagged. This is a coordinate-wise constrained projection, not an optimized treatment. Sleep is in hours, activity in minutes, reaction in milliseconds, and recall differences are percentage points. RMS is a dimensionless recording amplitude; changing microphone distance is not a health improvement. References stay fixed; changing a record does not simulate tomorrow’s physiology. Rounded values are for display.</p>
  </SeeMore>
  <h3 className="mt-6">Shared multimodal representation</h3>
  <p><strong>Training pipeline implemented · no population artifact activated.</strong> Two-layer modality encoders use symmetric contrastive loss on synchronized observations, with missing modalities masked.</p>
  <h3 className="mt-6">Few-shot population adaptation</h3>
  <p><strong>Training pipeline implemented · no population artifact activated.</strong> First-order MAML learns a reaction-time initialization across participant tasks, then adapts on earlier support records.</p>
  <SeeMore label="See real-data few-shot benchmark">
   <p className="mt-4">Brighter Time: {fewShot.eligible_participants} eligible participants, ten overlapping participant splits. Errors are mean absolute differences in milliseconds; lower is better. The target is the next recorded PVT result within 48 hours. Support means earlier labelled sessions, not days of sensor data.</p>
   <div className="overflow-x-auto"><table className="records-table"><thead><tr><th>Earlier sessions</th><th>Adapted model (ms)</th><th>Unadapted (ms)</th><th>Recent average (ms)</th><th>Wins vs recent average</th></tr></thead><tbody>{fewShot.mean_by_support.map(row=><tr key={row.support}><td>{row.support}</td><td>{row.mae_ms.adapted.toFixed(2)}</td><td>{row.mae_ms.unadapted.toFixed(2)}</td><td>{row.mae_ms.recent_average.toFixed(2)}</td><td>{row.wins_vs_recent}/10</td></tr>)}</tbody></table></div>
   <p>This experiment used earlier reaction tests and session context. It did not use voice or activity, and it does not validate predictions on NeuroTwin’s browser task. <a href="https://doi.org/10.48420/20212265.v1" target="_blank" rel="noreferrer">Dataset: Didikoglu and colleagues (CC BY 4.0)</a>.</p>
  </SeeMore>
  <SeeMore label="See data and validation requirements"><p className="panel-sub">Both pipelines need consented, genuinely aligned multi-participant data. The existing PVT dataset has no paired voice/activity data. Synthetic smoke tests verify execution only. Participant-disjoint tests compare against simple baselines; few-shot adaptation must use earlier records and predict later outcomes. These modules do not diagnose disease, establish causality, guarantee few-day personalization, or replace the existing trained predictor. A structural causal model would additionally require defensible causal assumptions and intervention evidence; observational correlations alone do not supply those.</p></SeeMore>
 </section>;
}
