# Synthetic training demonstration

## Real-data research experiment

`train_brighter_time.py` and `NeuroTwin_BrighterTime_RealData.ipynb` implement a separate real-data Ridge experiment (source DOI 10.48420/20212265, CC BY 4.0, Didikoglu and colleagues). The owner's exported artifact and repeated-evaluation CSV are retained. `artifacts/brighter-time-evaluation.json` aggregates the ten CSV rows, with each split weighted equally, for the workspace's Research evaluation tab.

Across ten participant-disjoint splits, mean MAE was 39.906726 ms (Ridge), 47.214085 ms (previous result), and 39.257692 ms (recent average). Ridge beat the recent average in 4/10 splits. No consistent learned-model advantage was demonstrated. The research model is not activated for live account predictions. Prior sessions form inputs; participants remain separate between fitting and test. Overlapping splits are sensitivity checks, not independent studies. Source sleepiness coding and transfer to the browser task remain unresolved.

The sections below refer only to the earlier synthetic demonstration.

The notebook trains StandardScaler -> Ridge(alpha=1.0) on 144 artificial examples and evaluates on 36 held-out artificial examples. The JSON is the exported model, not a dataset of real user records. Its synthetic MAE is not evidence of real cognitive prediction performance.

Open the notebook in Google Colab and run all cells to reproduce training. The final cell exports the JSON and verifies its scaling/coefficient formula against the fitted pipeline. No GPU or paid inference API is required.

The signed-in workspace's Training demo tab uses this fixed artifact with manually entered example values. It does not access account records, retrain itself, call providers, or save predictions. It is intentionally separate from live wellness analytics.

Do not commit personal record exports or private trained models here. Real prediction remains pending suitable authorized data, time-aware feature generation, held-out evaluation against baselines, and account-private deployment where applicable.
