"""Exploratory grouped validation. Does not overwrite the deployed model."""
import json
from pathlib import Path
import numpy as np
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error
from train_brighter_time import prepare, FEATURES

SETS={
 'History only':FEATURES[:2],
 'History + context':FEATURES[:4],
 'History + context + clock':FEATURES,
}

def compare_features(csv_path,output_path):
 data,audit=prepare(csv_path)
 folds=list(GroupKFold(n_splits=5).split(data,groups=data.id))
 candidates=[]
 for label,features in SETS.items():
  for alpha in [.1,1.,10.,100.]:
   scores=[]
   for train_index,validation_index in folds:
    training,validation=data.iloc[train_index],data.iloc[validation_index]
    assert set(training.id).isdisjoint(validation.id)
    fitted=make_pipeline(StandardScaler(),Ridge(alpha=alpha))
    fitted.fit(training[features],training.medianrt)
    scores.append(float(mean_absolute_error(validation.medianrt,fitted.predict(validation[features]))))
   candidates.append({'feature_set':label,'features':features,'alpha':alpha,'fold_mae_ms':scores,'mean_validation_mae_ms':float(np.mean(scores))})
 best_per_set=[min((row for row in candidates if row['feature_set']==label),key=lambda row:row['mean_validation_mae_ms']) for label in SETS]
 selected=min(best_per_set,key=lambda row:row['mean_validation_mae_ms'])
 baseline=[]
 for _,index in folds:
  validation=data.iloc[index]
  baseline.append(float(mean_absolute_error(validation.medianrt,validation.recent_reaction_mean_ms)))
 result={
  'stage':'exploratory-feature-selection','source_doi':'10.48420/20212265','audit':audit,
  'method':'Five participant-disjoint GroupKFold validation folds; scaler fitted inside each fold; feature set and alpha selected by mean validation MAE.',
  'selected':selected,'best_per_set':best_per_set,'all_candidates':candidates,
  'recent_average_validation_mae_ms':float(np.mean(baseline)),
  'independent_final_test':False,'changes_deployed_model':False,
  'limitations':['Dataset already explored in prior evaluations. These are selection/validation scores, not an untouched final test.','Fold scores equally weighted; participants are disjoint within each split.','Prior sessions supply inputs for held-out participants, never fit targets.','Source modified sleepiness scale is 1–10.','No clinical validation or validation for the NeuroTwin five-trial task.'],
 }
 Path(output_path).write_text(json.dumps(result,indent=2,allow_nan=False),encoding='utf-8')
 print(json.dumps({'selected_feature_set':selected['feature_set'],'selected_alpha':selected['alpha'],'validation_mae_ms':selected['mean_validation_mae_ms'],'recent_average_validation_mae_ms':result['recent_average_validation_mae_ms'],'independent_final_test':False,'deployed_model_changed':False},indent=2))
 return result

if __name__=='__main__':
 import argparse
 parser=argparse.ArgumentParser();parser.add_argument('csv_path');parser.add_argument('--output',default='feature-selection.json');args=parser.parse_args()
 compare_features(args.csv_path,args.output)
