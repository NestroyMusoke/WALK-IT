import unittest
import numpy as np
from motion_evidence import compare_motion

class MotionEvidenceTests(unittest.TestCase):
 def test_scaled_rotated_motion(self):
  x=np.array([[0.,0,0],[1,0,0],[1,0,2]])
  r=np.array([[0.,0,1],[0,1,0],[-1,0,0]])
  result=compare_motion(x,3*x@r.T+4,[r]*3)
  self.assertFalse(result['navigationReady'])
  self.assertEqual(len(result['pairs']),3)
  for pair in result['pairs']:
   self.assertAlmostEqual(pair['sessionUnitsPerMapUnit'],3)
   self.assertAlmostEqual(pair['rotationDisagreementDeg'],0)
 def test_collapsed_visual_motion_is_reported_not_divided_by_zero(self):
  result=compare_motion([[0,0,0],[0,0,0]],[[0,0,0],[0,0,2]],[np.eye(3)]*2)
  self.assertIsNone(result['pairs'][0]['sessionUnitsPerMapUnit'])
  self.assertEqual(result['pairs'][0]['sessionDistanceUnits'],2)
 def test_invalid_input_rejected(self):
  with self.assertRaises(ValueError):compare_motion([[float('nan'),0,0]],[[0,0,0]],[np.eye(3)])
  with self.assertRaises(ValueError):compare_motion([[0,0,0]],[[0,0,0]],[])
