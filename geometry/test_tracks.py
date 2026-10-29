import unittest
import numpy as np
from tracks import observation_tracks,fit_track,frame_pairs,geometric_pair_mask
class TrackTests(unittest.TestCase):
 def test_pair_geometry_removes_inconsistent_matches_before_union(self):
  k=np.array([[400.,0,320],[0,400,240],[0,0,1.]])
  a=np.c_[np.eye(3),[0.,0,0]];b=np.c_[np.eye(3),[-1.,0,0]]
  left=np.array([[320.,240],[340,240]]);right=np.array([[220.,240],[240,270]])
  self.assertEqual(geometric_pair_mask(left,right,k,k,a,b,3.).tolist(),[True,False])
 def test_frame_window_has_no_duplicates_or_out_of_range_pairs(self):
  self.assertEqual(frame_pairs(4,1),[(0,1),(1,2),(2,3)])
  self.assertEqual(frame_pairs(4,2),[(0,1),(0,2),(1,2),(1,3),(2,3)])
  with self.assertRaises(ValueError):frame_pairs(4,0)
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
