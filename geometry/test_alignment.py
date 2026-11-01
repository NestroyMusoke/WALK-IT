import unittest,json
from pathlib import Path
import numpy as np
from alignment import estimate_alignment,estimate_gravity_windowed_alignment,transform_points
CFG=json.loads((Path(__file__).resolve().parents[1]/'config/vision.yaml').read_text())
class AlignmentTests(unittest.TestCase):
 def test_recovers_map_to_session_similarity(self):
  x=np.array([[0.,0,0],[1,0,0],[1,0,1],[1,1,1],[0,1,2]])
  r=np.array([[0.,0,1],[0,1,0],[-1,0,0]]);y=2*x@r.T+[3,4,5]
  result=estimate_alignment(x,y,CFG);self.assertTrue(result['accepted']);self.assertFalse(result['navigationReady'])
  self.assertAlmostEqual(result['scale'],2);np.testing.assert_allclose(transform_points(x,result),y,atol=1e-9)
 def test_rejects_stationary_straight_line_outlier_and_mirror(self):
  x=np.array([[0.,0,0],[1,0,0],[1,0,1],[1,1,1],[0,1,2]])
  self.assertFalse(estimate_alignment(x*0,x,CFG)['accepted'])
  line=np.array([[i,0.,0] for i in range(5)]);self.assertFalse(estimate_alignment(line,line,CFG)['accepted'])
  y=x.copy();y[-1]+=[10,0,0];self.assertFalse(estimate_alignment(x,y,CFG)['accepted'])
  self.assertFalse(estimate_alignment(x,x*[-1,1,1],CFG)['accepted'])
 def test_rejects_missing_or_nonfinite_pairs(self):
  self.assertFalse(estimate_alignment([[0,0,0]],[[0,0,0]],CFG)['accepted'])
  self.assertFalse(estimate_alignment([[float('nan'),0,0]]*5,[[0,0,0]]*5,CFG)['accepted'])
 def test_gravity_window_handles_straight_path_and_one_bad_pose(self):
  x=np.array([[i,1.,0.] for i in range(10)])
  y=.3*x@np.array([[0.,0.,1.],[0.,1.,0.],[-1.,0.,0.]]).T+[4.,2.,3.]
  y[2]+=[20,0,0]
  result=estimate_gravity_windowed_alignment(x,y,CFG)
  self.assertTrue(result['accepted'],result)
  self.assertAlmostEqual(result['scale'],.3,places=3)
  self.assertEqual(result['inliers'],9)
  self.assertFalse(result['metricScaleVerified'])
 def test_gravity_window_uses_recent_pairs_and_rejects_mirror(self):
  x=np.array([[i,0.,(i%3)*.5] for i in range(20)])
  y=x.copy();y[:10]*=.2;y[10:]=.7*x[10:]+[3,0,2]
  result=estimate_gravity_windowed_alignment(x,y,CFG)
  self.assertTrue(result['accepted'],result)
  self.assertAlmostEqual(result['scale'],.7,places=3)
  mirrored=x[-10:]*[-1,1,1]
  self.assertFalse(estimate_gravity_windowed_alignment(x[-10:],mirrored,CFG)['accepted'])
 def test_gravity_window_refuses_transform_without_recent_support(self):
  x=np.array([[i,0.,(i%3)*.5] for i in range(10)])
  y=.4*x+[1,0,2]
  y[-2:]+=[5,0,0]
  result=estimate_gravity_windowed_alignment(x,y,CFG)
  self.assertFalse(result['accepted'],result)
if __name__=='__main__':unittest.main()
