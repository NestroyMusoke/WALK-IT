import unittest
import numpy as np
from tracks import observation_tracks,fit_track
class TrackTests(unittest.TestCase):
 def test_shared_observations_merge_but_conflicting_component_is_rejected(self):
  edges=[((0,1),(1,2)),((1,2),(2,3)),((3,1),(4,1)),((4,1),(3,2))]
  tracks,rejected=observation_tracks(edges)
  self.assertEqual(tracks,[[(0,1),(1,2),(2,3)]]);self.assertEqual(rejected,1)
 def test_multiview_recovery_and_stationary_rejection(self):
  k=np.array([[400.,0,320],[0,400,240],[0,0,1]])
  xyz=np.array([.2,.1,4.,1.]);es=[np.c_[np.eye(3),[-x,0,0]] for x in [0,.5,1]]
  ps=[k@e for e in es];uv=[(p@xyz)[:2]/(p@xyz)[2] for p in ps]
  r=fit_track(uv,ps,es,1.,1.)
  self.assertIsNotNone(r);np.testing.assert_allclose(r['position'],xyz[:3],atol=1e-9)
  self.assertIsNone(fit_track([uv[0]]*3,[ps[0]]*3,[es[0]]*3,1.,1.))
  uv[2]=uv[2]+[0,30];self.assertIsNone(fit_track(uv,ps,es,1.,1.))
if __name__=='__main__':unittest.main()
