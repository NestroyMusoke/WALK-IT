import copy,unittest
import numpy as np
from map_query import validate_map,match_descriptors,unique_correspondences
class MapTests(unittest.TestCase):
 def fixture(self):
  return {'schemaVersion':1,'descriptorType':'SIFT-float32-128-L2','units':'tracker','scaleVerified':False,'navigationReady':False,'captureSha256':'a'*64,'captureConfigSha256':'b'*64,'geometryConfigSha256':'c'*64,'landmarkCount':1,'landmarks':[{'id':'lm0','position':[1,2,3],'descriptor':[1.]*128,'observations':[{'keyframeId':f'kf{i}','featureIndex':0,'pixel':[10,20]} for i in range(3)],'maxReprojectionErrorPx':1.,'maxParallaxDeg':2.}]}
 def test_schema_rejects_duplicate_invalid_and_falsely_ready_artifacts(self):
  m=self.fixture();self.assertEqual(len(validate_map(m)),1)
  for mutate in [lambda x:x.update(navigationReady=True),lambda x:x.update(schemaVersion=2),lambda x:x['landmarks'][0]['descriptor'].pop(),lambda x:x['landmarks'][0]['position'].__setitem__(0,float('nan')),lambda x:x['landmarks'][0]['observations'].append(x['landmarks'][0]['observations'][0])]:
   bad=copy.deepcopy(m);mutate(bad)
   with self.assertRaises(ValueError):validate_map(bad)
 def test_deduplicates_pixel_and_position_evidence(self):
  pairs=[(0,0),(1,1),(2,2)]
  selected=unique_correspondences(pairs,[(10,10),(10,10),(20,20)],[(0,0,1),(1,0,1),(1,0,1)],[3,1,2])
  self.assertEqual(selected,[(1,1)])
 def test_matching_is_mutual_and_rejects_tied_descriptors(self):
  rng=np.random.default_rng(3);a=rng.uniform(0,100,(10,128)).astype(np.float32)
  matches=match_descriptors(a,a.copy(),.75);self.assertEqual(len(matches),10)
  self.assertEqual(match_descriptors(np.ones((3,128),np.float32),np.ones((3,128),np.float32),.75),[])
if __name__=='__main__':unittest.main()

