import unittest,json
from pathlib import Path
import numpy as np
from alignment import estimate_alignment,transform_points
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
if __name__=='__main__':unittest.main()
