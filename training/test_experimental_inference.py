import copy
import unittest
import numpy as np
from experimental_learning import init_encoder
from experimental_inference import predict
from test_experimental_learning import fixture


class InferenceTests(unittest.TestCase):
    def setUp(self):
        rng = np.random.default_rng(3)
        self.artifact = {'schema_version': 1, 'status': 'offline_research_only', 'support_records': 3,
                         'encoders': {k: [a.tolist() for a in init_encoder(3, rng)] for k in ('sleep','activity','voice')},
                         'scalers': {k: [[0,0,0],[1,1,1]] for k in ('sleep','activity','voice')},
                         'meta_weights_seconds': [0]*8+[.33]}
        rows = fixture()[:9]
        self.support = rows[:3]
        self.query = {k:v for k,v in rows[4].items() if k not in ('target_at','target_reaction_ms')}

    def test_prediction_has_units_and_no_personal_identifiers(self):
        output = predict(self.artifact, self.support, self.query)
        self.assertEqual(output['unit'], 'milliseconds')
        self.assertGreater(output['estimate_reaction_ms'], 0)
        self.assertNotIn('participant', output)
        self.assertFalse(output['live_activation'])

    def test_reject_future_support_other_person_and_outcomes(self):
        for kind in ('future','person','outcome','missing','ood'):
            support, query = copy.deepcopy(self.support), copy.deepcopy(self.query)
            if kind == 'future': support[0]['target_at'] = query['window_end']
            if kind == 'person': query['participant'] = 'another'
            if kind == 'outcome': query['target_reaction_ms'] = 300
            if kind == 'missing': query['modalities']['voice'] = None
            if kind == 'ood': query['modalities']['voice'] = [1000]*3
            with self.subTest(kind=kind), self.assertRaises(ValueError):
                predict(self.artifact, support, query)

    def test_reject_corrupted_artifact(self):
        self.artifact['scalers']['voice'][1][0] = 0
        with self.assertRaises(ValueError): predict(self.artifact, self.support, self.query)


if __name__ == '__main__': unittest.main()
