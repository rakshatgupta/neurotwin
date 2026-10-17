# Synthetic training demonstration

The notebook trains StandardScaler -> Ridge(alpha=1.0) on 144 artificial examples and evaluates on 36 held-out artificial examples. The JSON is the exported model, not a dataset of real user records. Its synthetic MAE is not evidence of real cognitive prediction performance.

Open the notebook in Google Colab and run all cells to reproduce training. The final cell exports the JSON and verifies its scaling/coefficient formula against the fitted pipeline. No GPU or paid inference API is required.

The signed-in workspace's Training demo tab uses this fixed artifact with manually entered example values. It does not access account records, retrain itself, call providers, or save predictions. It is intentionally separate from live wellness analytics.

Do not commit personal record exports or private trained models here. Real prediction remains pending suitable authorized data, time-aware feature generation, held-out evaluation against baselines, and account-private deployment where applicable.
