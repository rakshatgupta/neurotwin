# Experimental learning implementation

## What is included

About the research → Experimental learning lab shows a counterfactual **of the existing calculation**, using signed-in records. It projects each fresh flagged measurement onto the interior of its fixed reference interval. No data is changed or sent externally. The dependency diagram describes computation, not physiology. Minimum means the least absolute numerical change for that one fixed coordinate; rounded outputs are not prescriptions or attainable integer step targets. No structural causal effects or healthy-state targets have been estimated.

`training/experimental_learning.py` implements three two-layer tanh modality encoders, normalized shared 8-dimensional projections, symmetric InfoNCE, masked missing modalities, train-only standardization, and validation checkpoint selection. It also trains a **first-order MAML** linear head on frozen averaged embeddings to predict later reaction time in milliseconds. This is a genuine first-order optimization implementation, not a transformer, full second-order MAML, a diagnostic model or an activated population model.

Participants are separated into train/validation/test before scaling or training. Meta support examples precede query examples, and their outcomes must have become available before the first query input window. Encoders are frozen during personal head adaptation. Evaluation reports held-out retrieval with chance levels and participant-weighted MAE against unadapted and support-mean comparators. These controls do not replace external evaluation.

## Free local training setup (PowerShell)

1. Open Terminal in the repository folder.
2. Run `py -m venv .venv-research` (install Python if `py` is unavailable).
3. Run `.\.venv-research\Scripts\python.exe -m pip install numpy`.
4. Obtain a consented population dataset with synchronized sleep, activity and voice feature windows. Do not pair unrelated people/dates, infer missing voice, or use synthetic rows as population evidence. The existing Brighter Time PVT artifacts do not provide these modalities.
5. Keep raw records outside Git. Create a JSONL file (one JSON object per line) using the schema below. Have the data owner verify units, feature order, provenance, licensing, consent and alignment. Use stable pseudonymous participant IDs. Never include raw audio or email addresses.
6. Run `.\.venv-research\Scripts\python.exe training\experimental_learning.py C:\private-data\aligned.jsonl C:\private-data\experimental-artifact.json --epochs 100 --support 3`.
7. Inspect the reported evaluation. Compare multiple participant splits using different `--seed` values; do not select a favorable test split. Reserve a new external dataset for final validation. Report failures as well as improvements.
8. Run `.\.venv-research\Scripts\python.exe -m unittest discover -s training -p test_experimental_learning.py` for synthetic numerical checks. These checks are not model validation.

Example schema only (one illustrative row; insufficient for training):

```json
{"participant":"p01","window_start":"2026-01-01T08:00:00Z","window_end":"2026-01-01T09:00:00Z","modalities":{"sleep":[7.5],"activity":[20],"voice":[0.04,12000]},"target_reaction_ms":330,"target_at":"2026-01-01T10:00:00Z"}
```

Choose and document a fixed feature schema: e.g. sleep hours; activity minutes; voice RMS and duration milliseconds. Arrays must keep the same ordering/dimensions within each modality. Missing modalities are null or absent, never invented zeros. Targets must be later than all features; no overlapping windows per participant. At least six participants are required by the implementation, but that minimum is a software constraint, **not** adequate scientific sample size. Each split needs paired modalities and eligible support/query tasks. Few-shot support currently requires complete modalities and later observed reaction targets; it cannot adapt from unlabeled days alone. Daily observations do not establish hardware sensor integration.

## Activation and deployment

### Offline personal inference (now implemented)

After training a real research artifact, prepare a local JSON file with `support` (an array of earlier labelled records in the training schema) and `query` (one current complete feature record with no target or target timestamp). All rows must belong to one pseudonymous participant. Every support outcome must precede the query window start. Keep feature order and measurement units identical to training; dimension validation cannot detect swapped units or feature meanings.

Run:

```powershell
.\.venv-research\Scripts\python.exe training\experimental_inference.py C:\private-data\experimental-artifact.json C:\private-data\personal-input.json
```

The command validates artifact dimensions, finite parameters, positive scaler spreads, input timing, participant ownership within the submitted file and complete modalities. It adapts on the most recent required support records and returns a later reaction-time estimate plus a support-average comparator. It rejects observed query outcomes and inputs beyond six training standard deviations. That six-unit guard is an engineering check, not calibrated uncertainty. This local file check does not authenticate ownership of real-world data; the future web endpoint must retrieve records from the authenticated account itself.

No raw records, participant identifiers or audio are returned. No account data is uploaded or changed. Run all research tests using `.\.venv-research\Scripts\python.exe -m unittest discover -s training -p "test_experimental*.py"`. Synthetic tests prove execution and rejection behavior only.

The lab UI deploys with the normal Next.js build. No migration, additional secret, paid API or Python service is needed for it. The training artifacts are deliberately not connected to the production predictor. The lab accurately displays that state; the existing Ridge predictions continue to work.

After obtaining genuine aligned data: audit provenance and consent; freeze feature schema and pairing rules; train and evaluate; independently review failure modes, subgroup errors, uncertainty and minimum support; then implement an authenticated, consent-controlled inference endpoint with artifact/schema version validation, personal support fitting, RLS-backed result history and export/deletion coverage. Test prospectively before enabling it for users. This integration remains future work pending an appropriate validated artifact; uploading an arbitrary artifact cannot enable it.

Neither this implementation nor good retrospective metrics establish exact health-restoring interventions, medical decision support suitability, patent novelty or journal acceptance. A physiological structural causal model requires justified causal structure, confounding assumptions and intervention validation. The current diagram intentionally asserts only computational relationships.

Contrastive matching still requires an explicit alignment rule; it does not discover which unrelated records belong together. Other windows, including windows from the same person, act as negatives in the current loss. Such false negatives, device/identity shortcuts and time-of-day confounding can degrade learned representations. Test against shuffled pairing and single-modality ablations before claiming useful fusion. Existing voice RMS/duration features contain little physiological information and are strongly affected by hardware/environment. The implementation does not support claims that richer speech biomarkers were collected.

Sources: [CLIP](https://proceedings.mlr.press/v139/radford21a.html), [MAML](https://proceedings.mlr.press/v70/finn17a.html), [counterfactual explanations](https://arxiv.org/abs/1711.00399).
