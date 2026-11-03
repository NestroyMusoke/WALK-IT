import unittest
from geometry.replay_ablation import compare, evaluate_paired
from geometry.test_replay_verifier_report import capture, CONFIG_BYTES


class AblationTests(unittest.TestCase):
    def test_no_held_out_pairs_is_unavailable(self):
        self.assertEqual(compare([], []), {'available': False, 'reason': 'no-held-out-paired-approaches',
                                          'approaches': 0})

    def test_paired_counts_include_false_confirms_and_abstentions(self):
        with_model = [{'status': 'confirmed'}, {'status': 'abstain'}]
        without_model = [{'status': 'abstain'}, {'status': 'abstain'}]
        result = compare(with_model, without_model, ['wrong', 'right'])
        self.assertEqual(result['withModel']['falseConfirms'], 1)
        self.assertEqual(result['withModel']['abstentions'], 1)
        self.assertEqual(result['withoutModel']['falseConfirms'], 0)
        self.assertEqual(result['approaches'], 2)

    def test_unpaired_or_unlabelled_comparison_refused(self):
        with self.assertRaises(ValueError):
            compare([{'status': 'abstain'}], [], ['right'])
        with self.assertRaises(ValueError):
            compare([{'status': 'abstain'}], [{'status': 'abstain'}], [])

    def test_incomplete_frame_receipts_do_not_count_as_paired_ablation(self):
        with self.assertRaisesRegex(ValueError, 'every paired frame'):
            evaluate_paired(capture(), CONFIG_BYTES, {'kf0': {}},
                            {'kf0': 'wrong', 'kf1': 'right'})


if __name__ == '__main__':
    unittest.main()
