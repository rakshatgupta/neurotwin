"""Population adaptation benchmark on Brighter Time PVT, without voice or activity."""
import argparse
import json
from pathlib import Path

import numpy as np

from experimental_learning import adapt, split_participants, train_meta
from train_brighter_time import FEATURES, prepare


def benchmark(csv_path, epochs=100):
    examples, audit = prepare(csv_path)
    # Same eligible cohort for each support size. Each target is a later PVT
    # session; features were available at the previous session (<=48 hours).
    people = {str(pid): group.sort_values('timestamp') for pid, group in examples.groupby('id') if len(group) >= 7}
    metrics = []
    for seed in range(42, 52):
        groups = [[people[r['participant']] for r in part]
                  for part in split_participants([{'participant': p} for p in people], seed)]
        fit = np.concatenate([p[FEATURES].to_numpy() for p in groups[0]])
        mean, scale = fit.mean(0), np.maximum(fit.std(0), 1e-6)

        def task(person, support):
            x = np.tanh((person[FEATURES].to_numpy()-mean)/scale)/np.sqrt(len(FEATURES))
            x = np.c_[x, np.ones(len(x))]
            y = person.medianrt.to_numpy()/1000
            # Keep evaluation windows identical across support sizes.
            return x[:support], y[:support], x[5:], y[5:]

        for support in (1, 3, 5):
            train, val, test = [[task(p, support) for p in group] for group in groups]
            theta = train_meta(train, val, epochs)
            population_mean = np.mean([person.medianrt.mean() for person in groups[0]])
            errors = []
            for (sx, sy, qx, qy), person in zip(test, groups[2]):
                y = qy*1000
                predictions = [qx@adapt(theta, sx, sy)*1000, qx@theta*1000, sy.mean()*1000,
                               population_mean, person.recent_reaction_mean_ms.to_numpy()[5:]]
                errors.append([float(np.abs(estimate-y).mean()) for estimate in predictions])
            keys = ['adapted', 'unadapted', 'support_mean', 'population_mean', 'recent_average']
            metrics.append({'seed': seed, 'support': support, 'test_participants': len(test),
                            'mae_ms': dict(zip(keys, np.mean(errors, axis=0).tolist()))})
    means = []
    for support in (1, 3, 5):
        results = [r['mae_ms'] for r in metrics if r['support'] == support]
        means.append({'support': support, 'mae_ms': {key: float(np.mean([r[key] for r in results])) for key in keys},
                      'wins_vs_recent': sum(r['adapted'] < r['recent_average'] for r in results)})
    return {'source_doi': '10.48420/20212265.v1', 'license': 'CC BY 4.0', 'epochs': epochs,
            'target': 'next Brighter Time PVT median reaction time, within 48 hours (ms)',
            'audit': audit, 'eligible_participants': len(people), 'mean_by_support': means, 'splits': metrics,
            'live_activation': False,
            'limitations': ['Repeated splits overlap; the source has already been explored.',
                            'Only recorded PVT sessions and context; no sleep, activity or voice fusion.',
                            'Support counts refer to labelled sessions, not days or wearable recordings.',
                            'Population adaptation benchmark, not a clinical baseline or a browser-task validation.']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv_path', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    if args.csv_path.resolve() == args.output.resolve():
        raise ValueError('Output must differ from input')
    result = benchmark(args.csv_path)
    args.output.write_text(json.dumps(result, indent=2, allow_nan=False)+'\n', encoding='utf-8')
    print(json.dumps({'participants': result['eligible_participants'], 'means': result['mean_by_support']}, indent=2))
