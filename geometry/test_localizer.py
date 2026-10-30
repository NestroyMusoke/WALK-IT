import unittest,json
from pathlib import Path
import numpy as np
import cv2
from localizer import estimate_pose,select_unambiguous
CFG=json.loads((Path(__file__).resolve().parents[1]/'config/vision.yaml').read_text())
class LocalizerTests(unittest.TestCase):
 def fixture(self):
  rng=np.random.default_rng(42);xyz=rng.uniform([-2,-1,4],[2,1,9],(40,3))
  k=np.array([[500.,0,320],[0,500,240],[0,0,1.]])
  r=np.array([.03,-.04,.02]);t=np.array([.2,-.1,.3]);uv=cv2.projectPoints(xyz,r,t,k,None)[0].reshape(-1,2)
  return xyz,uv,k,r,t
 def call(self,xyz,uv,k):return estimate_pose(xyz,uv,k,(640,480),list(range(len(xyz))),CFG)
 def test_recovers_known_pose_with_outliers(self):
  xyz,uv,k,r,t=self.fixture();uv[:6]=[[20+i*7,30] for i in range(6)]
  result=self.call(xyz,uv,k);self.assertTrue(result['accepted']);self.assertFalse(result['navigationReady'])
  np.testing.assert_allclose(result['translation'],t,atol=1e-4)
  np.testing.assert_allclose(result['rotationVector'],r,atol=1e-4)
 def test_rejects_insufficient_duplicate_degenerate_and_wrong_matches(self):
  xyz,uv,k,_,_=self.fixture()
  self.assertFalse(self.call(xyz[:3],uv[:3],k)['accepted'])
  duplicate=estimate_pose(xyz,uv,k,(640,480),[0]*len(xyz),CFG);self.assertFalse(duplicate['accepted'])
  planar=xyz.copy();planar[:,2]=5;self.assertFalse(self.call(planar,uv,k)['accepted'])
  bad=uv[np.random.default_rng(7).permutation(len(uv))];self.assertFalse(self.call(xyz,bad,k)['accepted'])
 def test_ambiguity_never_selects_a_winner(self):
  good={'accepted':True,'navigationReady':False}
  self.assertEqual(select_unambiguous([good,good])['reason'],'ambiguous')
  self.assertEqual(select_unambiguous([])['reason'],'no-valid-candidate')
 def test_rejects_pose_supported_by_small_image_patch(self):
  rng=np.random.default_rng(123)
  xyz=rng.uniform([-2,-1,4],[2,1,9],(40,3));xyz[:,:2]*=.4
  k=np.array([[500.,0,320],[0,500,240],[0,0,1.]])
  uv=cv2.projectPoints(xyz,np.array([.03,-.04,.02]),np.array([.2,-.1,.3]),k,None)[0].reshape(-1,2)
  result=self.call(xyz,uv,k)
  self.assertFalse(result['accepted'])
  self.assertEqual(result['reason'],'insufficient-image-coverage')
  self.assertGreater(result['imageCoverageFraction'],.01)
  self.assertLess(result['imageCoverageFraction'],.05)
if __name__=='__main__':unittest.main()
