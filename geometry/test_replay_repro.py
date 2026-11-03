import unittest
from geometry.replay_repro import summarize


class ReproSummaryTests(unittest.TestCase):
    def test_candidate_is_not_navigation_success_and_missing_receipts_abstain(self):
        queries = [{'candidates': [{'accepted': True}, {'accepted': True}]},
                   {'candidates': []}]
        verifier = [{'status': 'abstain'}, {'status': 'abstain'}]
        summary = summarize(queries, verifier)
        self.assertEqual(summary, {'attempts': 2, 'verifiedStartSuccesses': 0,
                                   'localizationCandidateFrames': 1,
                                   'ambiguousCandidateFrames': 1,
                                   'refusals': 0, 'abstentions': 2,
                                   'failures': 1, 'confirmations': 0})


if __name__ == '__main__':
    unittest.main()
