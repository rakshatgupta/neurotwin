"""Offline research experiment. Never reads NeuroTwin account exports."""
import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error

FEATURES = ['previous_reaction_ms', 'recent_reaction_mean_ms', 'previous_time_awake', 'previous_sleepiness', 'previous_clock_sin', 'previous_clock_cos']

def prepare(csv_path):
    raw = pd.read_csv(csv_path)
    required = ['id','task','date','time_of_day','time_awake','kss_score','medianrt']
    if not set(required).issubset(raw.columns):
        raise ValueError('This is not the expected Brighter Time CSV.')
    data = raw.loc[raw.task.eq('PVT'), required].copy()
    for column in ['time_of_day','time_awake','kss_score','medianrt']:
        data[column] = pd.to_numeric(data[column], errors='coerce')
    data['timestamp'] = pd.to_datetime(data['date'], errors='coerce') + pd.to_timedelta(data.time_of_day, unit='h')
    valid = data[required].notna().all(axis=1) & data.timestamp.notna() & data.time_of_day.between(0,24,inclusive='left') & data.time_awake.ge(0) & data.medianrt.gt(0)
    rejected = int((~valid).sum())
    data = data.loc[valid].sort_values(['id','timestamp']).copy()
    if data.duplicated(['id','timestamp']).any():
        raise ValueError('Duplicate participant timestamps require review.')
    group = data.groupby('id', sort=False)
    data['previous_reaction_ms'] = group.medianrt.shift(1)
    data['recent_reaction_mean_ms'] = group.medianrt.transform(lambda s:s.shift(1).rolling(3,min_periods=1).mean())
    data['previous_time_awake'] = group.time_awake.shift(1)
    data['previous_sleepiness'] = group.kss_score.shift(1)
    previous_clock = group.time_of_day.shift(1)
    data['previous_clock_sin'] = np.sin(2*np.pi*previous_clock/24)
    data['previous_clock_cos'] = np.cos(2*np.pi*previous_clock/24)
    previous_timestamp = group.timestamp.shift(1)
    data['gap_hours'] = (data.timestamp-previous_timestamp).dt.total_seconds()/3600
    # The next recorded session need not be tomorrow. Exclude gaps over 48h
    # as an explicit experiment design choice, not a clinical threshold.
    examples = data.loc[data.gap_hours.gt(0) & data.gap_hours.le(48)].dropna(subset=FEATURES).copy()
    audit = {'raw_rows':len(raw),'pvt_rows':int(raw.task.eq('PVT').sum()),'invalid_pvt_rows':rejected,'eligible_examples':len(examples),'participants':int(examples.id.nunique()),'observed_sleepiness_range':[float(data.kss_score.min()),float(data.kss_score.max())]}
    return examples, audit

def train(csv_path, output_dir):
    data, audit = prepare(csv_path)
    ids = np.sort(data.id.unique())
    if len(ids)<10:
        raise ValueError('Too few participants for this experiment split.')
    rng = np.random.default_rng(42)
    ids = rng.permutation(ids)
    a,b = int(len(ids)*.6),int(len(ids)*.8)
    partitions = [data[data.id.isin(part)] for part in [ids[:a],ids[a:b],ids[b:]]]
    train_data, validation, test = partitions
    assert not set(train_data.id)&set(validation.id) and not set(train_data.id)&set(test.id) and not set(validation.id)&set(test.id)
    if any(part.empty for part in partitions):
        raise ValueError('An evaluation partition is empty.')
    candidates=[]
    for alpha in [.1,1.,10.,100.]:
        candidate=make_pipeline(StandardScaler(),Ridge(alpha=alpha))
        candidate.fit(train_data[FEATURES],train_data.medianrt)
        error=mean_absolute_error(validation.medianrt,candidate.predict(validation[FEATURES]))
        candidates.append((float(error),alpha))
    _,alpha=min(candidates)
    development=pd.concat([train_data,validation])
    model=make_pipeline(StandardScaler(),Ridge(alpha=alpha))
    model.fit(development[FEATURES],development.medianrt)
    predicted=model.predict(test[FEATURES])
    metrics={
        'model_mae_ms':float(mean_absolute_error(test.medianrt,predicted)),
        'previous_result_mae_ms':float(mean_absolute_error(test.medianrt,test.previous_reaction_ms)),
        'recent_mean_mae_ms':float(mean_absolute_error(test.medianrt,test.recent_reaction_mean_ms)),
    }
    scaler=model.named_steps['standardscaler']; ridge=model.named_steps['ridge']
    reconstructed=((test[FEATURES].to_numpy()-scaler.mean_)/scaler.scale_)@ridge.coef_+ridge.intercept_
    np.testing.assert_allclose(predicted,reconstructed,rtol=1e-10,atol=1e-8)
    result={'version':'brighter-time-research-v1','source_doi':'10.48420/20212265','license':'CC BY 4.0','training_data':'real research PVT records','target':'next recorded PVT median reaction time (ms), within 48 hours','features':FEATURES,'means':scaler.mean_.tolist(),'scales':scaler.scale_.tolist(),'coefficients':ridge.coef_.tolist(),'intercept':float(ridge.intercept_),'alpha':alpha,'audit':audit,'evaluation':{**metrics,'train_examples':len(train_data),'validation_examples':len(validation),'test_examples':len(test),'split':'60/20/20 participant-disjoint; validation selects alpha; refit development participants only','selection_validation_mae':dict((str(a),e) for e,a in candidates)},'validated_for_neurotwin_browser_task':False,'limitations':['Prior sessions of held-out participants are available as inputs, but never as fit targets.','Not a prospective calendar-wide evaluation.','Observed KSS includes 10; confirm source coding before deployment.','No disease labels or clinical validation.','PVT research task differs from five-trial NeuroTwin task.','Results apply to this fixed split; repeat grouped evaluation before performance claims.']}
    output=Path(output_dir); output.mkdir(parents=True,exist_ok=True)
    (output/'brighter-time-research-model.json').write_text(json.dumps(result,indent=2,allow_nan=False),encoding='utf-8')
    print(json.dumps({'audit':audit,'test_results':metrics,'selected_alpha':alpha},indent=2))
    print('Research artifact exported. This does not activate live website predictions.')
    return result

if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser()
    parser.add_argument('csv_path'); parser.add_argument('--output',default='research-output')
    args=parser.parse_args(); train(args.csv_path,args.output)
