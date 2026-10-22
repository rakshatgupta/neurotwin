"""Synthetic numerical and leakage tests; never real-world validation."""
import unittest
from datetime import datetime, timedelta, timezone
import numpy as np
from experimental_learning import (contrastive, encode, backward, init_encoder,
    split_participants, validate, adapt, run, tasks)


def fixture():
    rng = np.random.default_rng(7)
    rows = []
    origin = datetime(2025, 1, 1, tzinfo=timezone.utc)
    for person in range(10):
        for day in range(9):
            z = rng.normal(size=3)
            start = origin+timedelta(days=day)
            rows.append({'participant': str(person), 'window_start': start.isoformat(),
                         'window_end': (start+timedelta(hours=1)).isoformat(),
                         'modalities': {k: (z+rng.normal(0, .01, 3)).tolist() for k in ('sleep', 'activity', 'voice')},
                         'target_reaction_ms': float(330+person*3+z[0]*5),
                         'target_at': (start+timedelta(hours=2)).isoformat()})
    return rows


class LearningTests(unittest.TestCase):
    def test_disjoint_subjects(self):
        groups = [{r['participant'] for r in g} for g in split_participants(fixture(), 42)]
        self.assertFalse(groups[0]&groups[1] or groups[1]&groups[2] or groups[0]&groups[2])

    def test_leakage_and_overlap_rejected(self):
        rows = fixture(); rows[0]['target_at'] = rows[0]['window_start']
        with self.assertRaises(ValueError): validate(rows)
        rows = fixture(); rows.append(rows[0])
        with self.assertRaises(ValueError): validate(rows)

    def test_contrastive_gradient(self):
        rng = np.random.default_rng(1)
        x, y = rng.normal(size=(4, 3)), rng.normal(size=(4, 3))
        w, v = init_encoder(3, rng), init_encoder(3, rng)
        a, cache = encode(x, w); b, _ = encode(y, v)
        _, ga, _ = contrastive(a, b)
        analytical = backward(ga, a, cache, w)[0][0, 0]
        eps = 1e-6
        w[0][0, 0] += eps; hi = contrastive(encode(x, w)[0], b)[0]
        w[0][0, 0] -= 2*eps; lo = contrastive(encode(x, w)[0], b)[0]
        self.assertAlmostEqual(analytical, (hi-lo)/(2*eps), places=5)

    def test_few_shot_updates_reduce_support_error(self):
        x = np.c_[np.zeros((5, 8)), np.ones(5)]
        y = np.ones(5)*.35; theta = np.zeros(9)
        phi = adapt(theta, x, y)
        self.assertLess(np.mean((x@phi-y)**2), np.mean((x@theta-y)**2))

    def test_encoder_optimization_reduces_paired_loss(self):
        rng = np.random.default_rng(11)
        x = rng.normal(size=(12, 3)); y = x + rng.normal(0, .01, x.shape)
        w, v = init_encoder(3, rng), init_encoder(3, rng)
        initial = contrastive(encode(x, w)[0], encode(y, v)[0])[0]
        for _ in range(50):
            a, ca = encode(x, w); b, cb = encode(y, v)
            _, ga, gb = contrastive(a, b)
            for weights, gradients in ((w, backward(ga, a, ca, w)), (v, backward(gb, b, cb, v))):
                for parameter, gradient in zip(weights, gradients):
                    parameter -= .005 * np.clip(gradient, -5, 5)
        self.assertLess(contrastive(encode(x, w)[0], encode(y, v)[0])[0], initial)

    def test_support_outcomes_cannot_reach_query_window(self):
        rows = fixture()[:9]
        for row in rows[:3]: row['target_at'] = rows[-1]['target_at']
        rng = np.random.default_rng(2)
        weights = {k: init_encoder(3, rng) for k in ('sleep', 'activity', 'voice')}
        scalers = {k: (np.zeros(3), np.ones(3)) for k in weights}
        with self.assertRaises(ValueError): tasks(rows, weights, scalers, 3)

    def test_full_pipeline_and_missing_modalities(self):
        rows = fixture(); rows[1]['modalities']['voice'] = None
        artifact = run(rows, epochs=10)
        self.assertFalse(artifact['live_activation'])
        self.assertEqual(artifact['participant_split_counts'], [6, 2, 2])
        self.assertTrue(np.isfinite(artifact['few_shot_test']['participant_mean_mae_ms']))
        self.assertNotIn('participant', artifact['encoders'])


if __name__ == '__main__': unittest.main()
