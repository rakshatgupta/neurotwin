'use client';
import {useState} from 'react';
import model from '../training/artifacts/neurotwin-synthetic-demo-model.json';
import {predictDemo} from '../lib/demoPrediction';

const fields = [
  {key:'sleep', label:'Example sleep (hours)', min:4, max:10, step:0.1},
  {key:'activity', label:'Example activity (minutes)', min:0, max:120, step:1},
  {key:'stress', label:'Example stress (1–9)', min:1, max:9, step:1},
  {key:'previous_reaction_ms', label:'Example previous reaction (ms)', min:180, max:600, step:1},
];
export default function TrainingDemo() {
  const [inputs,setInputs] = useState<Record<string,string>>({sleep:'7',activity:'35',stress:'5',previous_reaction_ms:'330'});
  const [result,setResult] = useState<number|null>(null);
  const [error,setError] = useState('');
  const evaluation = model.evaluation;
  return <section className="panel checkin">
    <h2>Training demonstration</h2>
    <p className="panel-sub mt-4"><strong>Synthetic data only — not validated on real users.</strong> This Ridge regression model learned from artificial examples. Its predictions do not assess your cognitive or neurological health.</p>
    <div className="data-row"><span>Model version</span><span>{model.version}</span></div>
    <div className="data-row"><span>Training / held-out examples</span><span>{evaluation.training_examples} / {evaluation.test_examples}</span></div>
    <div className="data-row"><span>Synthetic test mean absolute error</span><span>{evaluation.model_mae_ms.toFixed(2)} ms</span></div>
    <div className="data-row"><span>Previous-result baseline error</span><span>{evaluation.baseline_mae_ms.toFixed(2)} ms</span></div>
    <p className="panel-sub mt-4">The artificial target was generated using a known formula. These errors demonstrate the training pipeline, not real-world predictive performance. This model is fixed; it does not retrain when you save records.</p>
    <form onSubmit={event=>{
      event.preventDefault();setError('');setResult(null);
      try {
        const values:Record<string,number> = {};
        for(const field of fields) {
          const raw=inputs[field.key], value=Number(raw);
          if(!raw.trim() || !Number.isFinite(value) || value<field.min || value>field.max) throw new Error(`Check ${field.label.toLowerCase()}.`);
          values[field.key]=value;
        }
        setResult(predictDemo(model,values));
      } catch(e) {setError(e instanceof Error?e.message:'Could not calculate the example.');}
    }}>
      <h3 className="mt-6">Try example inputs</h3>
      {fields.map(field=><label key={field.key} htmlFor={`demo-${field.key}`}>{field.label}<input id={`demo-${field.key}`} type="number" required min={field.min} max={field.max} step={field.step} value={inputs[field.key]} onChange={event=>{setInputs(previous=>({...previous,[field.key]:event.target.value}));setResult(null);setError('');}}/></label>)}
      <button className="primary-button" type="submit">Calculate demo prediction</button>
    </form>
    {error&&<p role="alert">{error}</p>}
    <div aria-live="polite">{result!==null&&<p className="mt-6"><strong>Synthetic-model example: {result.toFixed(1)} ms.</strong> This is an artificial scenario, not your predicted test result.</p>}</div>
    <p className="panel-sub mt-4">Calculations stay in this browser. Example inputs are not saved, sent to Groq, or mixed with your wellness records. A genuine prediction model still requires suitable real data and independent evaluation.</p>
  </section>;
}
