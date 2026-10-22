"""Offline research only. NumPy CPU encoders and first-order MAML.

Input JSONL: participant, window_start, window_end, modalities mapping
sleep/activity/voice to fixed-length numeric arrays (null/absent = missing).
Optional target_reaction_ms and target_at must describe a LATER test.
No identifiers, audio or training rows are exported in the model artifact.
"""
import argparse
import itertools
import json
from datetime import datetime
from pathlib import Path
import numpy as np

MODALITIES = ('sleep', 'activity', 'voice')


def timestamp(value):
    dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if dt.tzinfo is None:
        raise ValueError('Timestamps must include timezone')
    return dt.timestamp()


def validate(rows):
    dims, seen, ends = {}, set(), {}
    for row in sorted(rows, key=lambda r: (str(r['participant']), timestamp(r['window_start']))):
        pid = str(row['participant'])
        start, end = timestamp(row['window_start']), timestamp(row['window_end'])
        if not pid or end <= start or (pid, start) in seen or start < ends.get(pid, -float('inf')):
            raise ValueError('Duplicate, overlapping or invalid participant windows')
        seen.add((pid, start)); ends[pid] = end
        for name, values in row['modalities'].items():
            if name not in MODALITIES:
                raise ValueError('Unknown modality')
            if values is None:
                continue
            a = np.asarray(values, dtype=float)
            if a.ndim != 1 or not len(a) or not np.isfinite(a).all():
                raise ValueError('Features must be finite nonempty vectors')
            if name in dims and dims[name] != len(a):
                raise ValueError('Inconsistent feature dimensions')
            dims[name] = len(a)
        if row.get('target_reaction_ms') is not None:
            target = float(row['target_reaction_ms'])
            if not np.isfinite(target) or target <= 0 or timestamp(row['target_at']) <= end:
                raise ValueError('Reaction target must be finite, positive and later than inputs')
    if set(dims) != set(MODALITIES):
        raise ValueError('All three modalities must occur in the dataset')
    return dims


def split_participants(rows, seed):
    people = np.array(sorted({str(r['participant']) for r in rows}))
    if len(people) < 6:
        raise ValueError('At least six participants required for disjoint train/validation/test')
    np.random.default_rng(seed).shuffle(people)
    n = max(1, len(people) // 5)
    groups = [set(people[2*n:]), set(people[n:2*n]), set(people[:n])]
    return [[r for r in rows if str(r['participant']) in group] for group in groups]


def init_encoder(dimension, rng, hidden=16, latent=8):
    return [rng.normal(0, .1, (dimension, hidden)), np.zeros(hidden),
            rng.normal(0, .1, (hidden, latent)), np.zeros(latent)]


def encode(x, weights):
    h = np.tanh(x @ weights[0] + weights[1])
    raw = h @ weights[2] + weights[3]
    norm = np.maximum(np.linalg.norm(raw, axis=1, keepdims=True), 1e-8)
    return raw / norm, (x, h, norm)


def backward(gradient, z, cache, weights):
    x, h, norm = cache
    raw_gradient = (gradient - z * (gradient * z).sum(axis=1, keepdims=True)) / norm
    hidden_gradient = (raw_gradient @ weights[2].T) * (1-h*h)
    return [x.T @ hidden_gradient, hidden_gradient.sum(0), h.T @ raw_gradient, raw_gradient.sum(0)]


def contrastive(a, b, temperature=.2):
    logits = a @ b.T / temperature
    def softmax(x):
        ex = np.exp(x-x.max(axis=1, keepdims=True))
        return ex/ex.sum(axis=1, keepdims=True)
    p, q, n = softmax(logits), softmax(logits.T), len(a)
    loss = -.5 * (np.log(np.maximum(np.diag(p), 1e-12)).mean()+np.log(np.maximum(np.diag(q), 1e-12)).mean())
    g = ((p-np.eye(n))+(q-np.eye(n)).T)/(2*n*temperature)
    return float(loss), g @ b, g.T @ a


def paired(rows, left, right, scalers):
    pairs = [r for r in rows if r['modalities'].get(left) is not None and r['modalities'].get(right) is not None]
    def matrix(name):
        mean, scale = scalers[name]
        return (np.array([r['modalities'][name] for r in pairs])-mean)/scale
    return (matrix(left), matrix(right)) if len(pairs) >= 2 else None


def train_encoders(train, validation, dims, rng, epochs):
    scalers = {}
    for name in MODALITIES:
        x = np.array([r['modalities'][name] for r in train if r['modalities'].get(name) is not None])
        if len(x) < 4:
            raise ValueError('Too few training observations for '+name)
        scalers[name] = (x.mean(0), np.maximum(x.std(0), 1e-6))
    weights = {name: init_encoder(dims[name], rng) for name in MODALITIES}
    best, best_loss = None, float('inf')
    for _ in range(epochs):
        for left, right in itertools.combinations(MODALITIES, 2):
            data = paired(train, left, right, scalers)
            if data is None:
                raise ValueError('Each modality pair needs aligned training observations')
            order = rng.permutation(len(data[0]))
            for indexes in np.array_split(order, max(1, int(np.ceil(len(order)/64)))):
                if len(indexes) < 2:
                    continue
                a, ca = encode(data[0][indexes], weights[left]); b, cb = encode(data[1][indexes], weights[right])
                _, ga, gb = contrastive(a, b)
                grads = [backward(ga, a, ca, weights[left]), backward(gb, b, cb, weights[right])]
                for name, gradient in zip((left, right), grads):
                    for w, g in zip(weights[name], gradient):
                        w -= .005 * np.clip(g, -5, 5)
        score = retrieval(validation, weights, scalers)['mean_loss']
        if score < best_loss:
            best_loss = score
            best = {k: [v.copy() for v in value] for k, value in weights.items()}
    if best is None:
        raise ValueError('Validation requires paired observations')
    return best, scalers


def retrieval(rows, weights, scalers):
    scores, losses = {}, []
    for left, right in itertools.combinations(MODALITIES, 2):
        data = paired(rows, left, right, scalers)
        if data is None:
            raise ValueError('Evaluation requires each modality pair')
        a, _ = encode(data[0], weights[left]); b, _ = encode(data[1], weights[right])
        similarity = a @ b.T
        scores[left+'_'+right] = {'pairs': len(a), 'chance': 1/len(a), 'top1': float(((similarity.argmax(1)==np.arange(len(a))).mean()+(similarity.argmax(0)==np.arange(len(a))).mean())/2)}
        losses.append(contrastive(a, b)[0])
    return {'mean_loss': float(np.mean(losses)), 'retrieval': scores}


def tasks(rows, encoders, scalers, support):
    result = []
    for pid in sorted({str(r['participant']) for r in rows}):
        records = sorted([r for r in rows if str(r['participant']) == pid and r.get('target_reaction_ms') is not None and all(r['modalities'].get(k) is not None for k in MODALITIES)], key=lambda r: timestamp(r['window_end']))
        if len(records) < support+2:
            continue
        # Support outcomes must be known BEFORE the first query inputs end.
        if max(timestamp(r['target_at']) for r in records[:support]) >= timestamp(records[support]['window_start']):
            continue
        embeddings = []
        for name in MODALITIES:
            mean, scale = scalers[name]
            z, _ = encode((np.array([r['modalities'][name] for r in records])-mean)/scale, encoders[name])
            embeddings.append(z)
        # Equal-weight fused shared representation; all modalities required for this head.
        x = np.c_[np.mean(embeddings, axis=0), np.ones(len(records))]
        y = np.array([r['target_reaction_ms'] for r in records])/1000
        result.append((x[:support], y[:support], x[support:], y[support:]))
    if not result:
        raise ValueError('No temporally valid support/query tasks; need more aligned records')
    return result


def adapt(theta, x, y, steps=5, rate=.05):
    value = theta.copy()
    for _ in range(steps):
        value -= rate * 2*x.T@(x@value-y)/len(y)
    return value


def evaluate_meta(theta, task_list):
    model, population, support_mean = [], [], []
    for x, y, qx, qy in task_list:
        model.append(np.abs(qx@adapt(theta, x, y)-qy).mean()*1000)
        population.append(np.abs(qx@theta-qy).mean()*1000)
        support_mean.append(np.abs(y.mean()-qy).mean()*1000)
    return {'participants': len(task_list), 'participant_mean_mae_ms': float(np.mean(model)), 'unadapted_mae_ms': float(np.mean(population)), 'support_mean_mae_ms': float(np.mean(support_mean))}


def train_meta(train, validation, epochs):
    theta = np.zeros(train[0][0].shape[1]); theta[-1] = np.mean([y.mean() for _, y, _, _ in train])
    best, score = theta.copy(), float('inf')
    for _ in range(epochs):
        # First-order MAML: query gradients evaluated at support-adapted parameters,
        # ignoring second-order derivatives through the inner optimization.
        gradients = []
        for x, y, qx, qy in train:
            phi = adapt(theta, x, y)
            gradients.append(2*qx.T@(qx@phi-qy)/len(qy))
        theta -= .02*np.mean(gradients, axis=0)
        loss = evaluate_meta(theta, validation)['participant_mean_mae_ms']
        if loss < score:
            score, best = loss, theta.copy()
    return best


def run(rows, seed=42, epochs=100, support=3):
    if epochs < 1 or support < 1:
        raise ValueError('Epochs and support must be positive')
    dims = validate(rows)
    train, val, test = split_participants(rows, seed)
    weights, scalers = train_encoders(train, val, dims, np.random.default_rng(seed), epochs)
    training_tasks, validation_tasks, test_tasks = [tasks(r, weights, scalers, support) for r in (train, val, test)]
    theta = train_meta(training_tasks, validation_tasks, epochs)
    return {'schema_version': 1, 'status': 'offline_research_only', 'clinical_validation': False, 'live_activation': False,
            'seed': seed, 'epochs': epochs, 'support_records': support,
            'participant_split_counts': [len({r['participant'] for r in group}) for group in (train, val, test)],
            'encoder_architecture': 'two-layer tanh MLP, normalized 8D projection; symmetric InfoNCE',
            'meta_algorithm': 'first-order MAML linear reaction-time head on frozen mean embeddings',
            'encoders': {k: [a.tolist() for a in v] for k, v in weights.items()},
            'scalers': {k: [a.tolist() for a in v] for k, v in scalers.items()},
            'meta_weights_seconds': theta.tolist(), 'contrastive_test': retrieval(test, weights, scalers),
            'few_shot_test': evaluate_meta(theta, test_tasks),
            'limits': ['Not a disease or healthy-baseline model', 'No causal intervention effects learned', 'Support size is records, not guaranteed days', 'Independent external and prospective evaluation required']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path); parser.add_argument('output', type=Path)
    parser.add_argument('--seed', type=int, default=42); parser.add_argument('--epochs', type=int, default=100)
    parser.add_argument('--support', type=int, default=3)
    args = parser.parse_args()
    if args.input.resolve() == args.output.resolve():
        raise ValueError('Output must differ from input')
    output = run([json.loads(line) for line in args.input.read_text(encoding='utf-8').splitlines() if line.strip()], args.seed, args.epochs, args.support)
    args.output.write_text(json.dumps(output, indent=2, allow_nan=False), encoding='utf-8')
    print(json.dumps({k: output[k] for k in ('status', 'participant_split_counts', 'contrastive_test', 'few_shot_test')}, indent=2))
