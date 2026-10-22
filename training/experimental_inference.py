"""Run a frozen research artifact with a single person's earlier support records.
No cloud calls, automatic activation, database writes or clinical predictions.
"""
import argparse
import json
from pathlib import Path
import numpy as np
from experimental_learning import MODALITIES, encode, adapt, timestamp, validate


def artifact_arrays(artifact):
    if artifact.get('schema_version') != 1 or artifact.get('status') != 'offline_research_only':
        raise ValueError('Unsupported research artifact')
    weights, scalers = {}, {}
    for name in MODALITIES:
        values = [np.asarray(v, dtype=float) for v in artifact['encoders'][name]]
        if len(values) != 4:
            raise ValueError('Invalid encoder')
        w1, b1, w2, b2 = values
        if w1.ndim != 2 or w1.shape[1] != 16 or b1.shape != (16,) or w2.shape != (16, 8) or b2.shape != (8,):
            raise ValueError('Unsupported encoder dimensions')
        mean, scale = [np.asarray(v, dtype=float) for v in artifact['scalers'][name]]
        if mean.shape != (w1.shape[0],) or scale.shape != mean.shape or (scale <= 0).any():
            raise ValueError('Invalid scaler')
        if not all(np.isfinite(v).all() for v in values+[mean, scale]):
            raise ValueError('Nonfinite artifact parameters')
        weights[name], scalers[name] = values, (mean, scale)
    theta = np.asarray(artifact['meta_weights_seconds'], dtype=float)
    if theta.shape != (9,) or not np.isfinite(theta).all():
        raise ValueError('Invalid adaptation head')
    support = artifact.get('support_records')
    if type(support) is not int or support < 1:
        raise ValueError('Invalid support requirement')
    return weights, scalers, theta, support


def predict(artifact, support_rows, query):
    weights, scalers, theta, required = artifact_arrays(artifact)
    if len(support_rows) < required:
        raise ValueError(f'At least {required} earlier labelled support records required')
    if query.get('target_reaction_ms') is not None or query.get('target_at') is not None:
        raise ValueError('Query must not contain a known outcome')
    rows = sorted(support_rows, key=lambda r: timestamp(r['window_end']))
    # Validate ALL submitted rows before selecting most recent support.
    validate(rows+[query])
    if len({str(r['participant']) for r in rows+[query]}) != 1:
        raise ValueError('Inference accepts one participant only')
    if any(r.get('target_reaction_ms') is None or timestamp(r['target_at']) >= timestamp(query['window_start']) for r in rows):
        raise ValueError('All support outcomes must be known before query inputs start')
    rows = rows[-required:]
    matrices = []
    for name in MODALITIES:
        if any(r['modalities'].get(name) is None for r in rows+[query]):
            raise ValueError('This adaptation head requires complete modalities')
        mean, scale = scalers[name]
        values = np.asarray([r['modalities'][name] for r in rows+[query]], dtype=float)
        if values.shape != (required+1, len(mean)):
            raise ValueError('Input features do not match artifact dimensions')
        normalized = (values-mean)/scale
        # Engineering guard, not a validated uncertainty interval.
        if (np.abs(normalized) > 6).any():
            raise ValueError('Inputs outside experimental training support; prediction withheld')
        matrices.append(encode(normalized, weights[name])[0])
    x = np.c_[np.mean(matrices, axis=0), np.ones(required+1)]
    y = np.array([r['target_reaction_ms'] for r in rows])/1000
    phi = adapt(theta, x[:-1], y)
    estimate = float(x[-1]@phi*1000)
    if not np.isfinite(estimate) or not 1 <= estimate <= 10000:
        raise ValueError('Unsupported reaction estimate; prediction withheld')
    return {'status': 'offline_unvalidated_experiment', 'estimate_reaction_ms': estimate,
            'support_mean_ms': float(y.mean()*1000), 'support_records': required,
            'target': 'later reaction time', 'unit': 'milliseconds',
            'clinical_use': False, 'live_activation': False,
            'limitations': 'No calibrated uncertainty; not a health, disease or treatment prediction'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('artifact', type=Path)
    parser.add_argument('input', type=Path, help='JSON object with support array and query object')
    args = parser.parse_args()
    artifact = json.loads(args.artifact.read_text(encoding='utf-8'))
    inputs = json.loads(args.input.read_text(encoding='utf-8'))
    print(json.dumps(predict(artifact, inputs['support'], inputs['query']), indent=2, allow_nan=False))
