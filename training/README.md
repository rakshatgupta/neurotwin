# Synthetic training demonstration

## Workspace improvements and feature selection

The workspace now reconstructs historical reference/deviation timelines with only strictly earlier observations, shows readiness per modality, and excludes readings older than seven days (or future-dated) from current fusion. The seven-day rule is an explicit display policy, not a clinical threshold. Historical charts use loaded retained records, so edits/deletion and loading limits affect reconstruction. Guidance is available without Groq.

`feature_selection.py` compares history-only, history+context, and history+context+clock feature sets at four Ridge penalties using five participant-disjoint validation folds. Run `python training/feature_selection.py PATH_TO_BrighterTimeData.csv --output training/artifacts/feature-selection.json` with numpy, pandas and scikit-learn installed, or use `NeuroTwin_Feature_Selection.ipynb` in Colab. Source: Didikoglu and colleagues, DOI 10.48420/20212265, CC BY 4.0. Original data remain outside the repository.

The executed experiment selected history+context, alpha 0.1, with mean validation MAE 38.114152 ms versus recent-average 38.241879 ms. These are exploratory selection scores on previously explored data, not independent final-test results. No deployment model was changed. The earlier ten-split findings remain reported separately. Selected candidates still require untouched-data evaluation and browser-task transfer evaluation.

Synthetic demonstrations remain in source/notebooks for development but are no longer exposed in normal workspace navigation. Research findings are under About the research. Legacy local-demo cleanup was removed from the UI; existing browser storage was not automatically deleted.

## Real-data research experiment

`train_brighter_time.py` and `NeuroTwin_BrighterTime_RealData.ipynb` implement a separate real-data Ridge experiment (source DOI 10.48420/20212265, CC BY 4.0, Didikoglu and colleagues). The owner's exported artifact and repeated-evaluation CSV are retained. `artifacts/brighter-time-evaluation.json` aggregates the ten CSV rows, with each split weighted equally, for the workspace's Research evaluation tab.

Across ten participant-disjoint splits, mean MAE was 39.906726 ms (Ridge), 47.214085 ms (previous result), and 39.257692 ms (recent average). Ridge beat the recent average in 4/10 splits. No consistent learned-model advantage was demonstrated. The research model is not activated for live account predictions. Prior sessions form inputs; participants remain separate between fitting and test. Overlapping splits are sensitivity checks, not independent studies. Source sleepiness coding and transfer to the browser task remain unresolved.

The sections below refer only to the earlier synthetic demonstration.

The notebook trains StandardScaler -> Ridge(alpha=1.0) on 144 artificial examples and evaluates on 36 held-out artificial examples. The JSON is the exported model, not a dataset of real user records. Its synthetic MAE is not evidence of real cognitive prediction performance.

Open the notebook in Google Colab and run all cells to reproduce training. The final cell exports the JSON and verifies its scaling/coefficient formula against the fitted pipeline. No GPU or paid inference API is required.

The signed-in workspace's Training demo tab uses this fixed artifact with manually entered example values. It does not access account records, retrain itself, call providers, or save predictions. It is intentionally separate from live wellness analytics.

Do not commit personal record exports or private trained models here. Real prediction remains pending suitable authorized data, time-aware feature generation, held-out evaluation against baselines, and account-private deployment where applicable.
