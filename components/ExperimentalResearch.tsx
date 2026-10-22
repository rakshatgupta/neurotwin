import SeeMore from './SeeMore';
import {referenceProjection,type ReferenceInput} from '../lib/counterfactual';

export default function ExperimentalResearch({factors}:{factors:ReferenceInput[]}){
 const projections=factors.map(referenceProjection).filter(p=>p!==null);
 return <section className="panel mt-6">
  <h2>Experimental learning lab</h2>
  <p className="panel-sub">Research tools. Your current predictions and reference calculations remain unchanged.</p>
  <h3 className="mt-6">What would change a variation flag?</h3>
  <p>This calculation moves a recorded value just inside its personal reference range. It is a mathematical comparison, not a recommended change to your body or a healthy target.</p>
  {projections.length?<div className="overflow-x-auto"><table className="records-table"><thead><tr><th>Signal</th><th>Recorded</th><th>Hypothetical value</th><th>Difference</th></tr></thead><tbody>{projections.map(p=><tr key={p.name}><td>{p.name}</td><td>{p.current.toFixed(2)} {p.unit}</td><td>{p.projected.toFixed(2)} {p.unit}</td><td>{p.change>0?'+':''}{p.change.toFixed(2)} {p.unit}</td></tr>)}</tbody></table></div>:<p className="mt-4">No fresh, flagged signals with sufficient earlier records are available. No change is suggested.</p>}
  <SeeMore label="See calculation and dependency graph">
   <figure aria-label="Computational dependency graph, not a physiological causal model" className="mt-4"><div className="data-row"><span>Earlier records → fixed median &amp; spread</span></div><div className="data-row"><span>Recorded value + fixed reference → deviation → variation flag</span></div><figcaption>Computational dependencies only. No arrows assert that sleep, activity or voice causes another signal.</figcaption></figure>
   <p className="panel-sub">The observed deviation is (value − median) / spread. Projection minimizes absolute change in each signal’s original unit, subject to a deviation within ±2.49 and input bounds. Exactly ±2.5 would still be flagged. This is a coordinate-wise constrained projection, not an optimized treatment. Sleep is in hours, activity in minutes, reaction in milliseconds, and recall differences are percentage points. RMS is a dimensionless recording amplitude; changing microphone distance is not a health improvement. References stay fixed; changing a record does not simulate tomorrow’s physiology. Rounded values are for display.</p>
  </SeeMore>
  <h3 className="mt-6">Shared multimodal representation</h3>
  <p><strong>Training pipeline implemented · no population artifact activated.</strong> Two-layer modality encoders use symmetric contrastive loss on synchronized observations, with missing modalities masked.</p>
  <h3 className="mt-6">Few-shot population adaptation</h3>
  <p><strong>Training pipeline implemented · no population artifact activated.</strong> First-order MAML learns a reaction-time initialization across participant tasks, then adapts on earlier support records.</p>
  <SeeMore label="See data and validation requirements"><p className="panel-sub">Both pipelines need consented, genuinely aligned multi-participant data. The existing PVT dataset has no paired voice/activity data. Synthetic smoke tests verify execution only. Participant-disjoint tests compare against simple baselines; few-shot adaptation must use earlier records and predict later outcomes. These modules do not diagnose disease, establish causality, guarantee few-day personalization, or replace the existing trained predictor. A structural causal model would additionally require defensible causal assumptions and intervention evidence; observational correlations alone do not supply those.</p></SeeMore>
 </section>;
}
