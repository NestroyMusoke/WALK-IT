import copy,hashlib,json,unittest
from route_artifact import build_route_artifact

class RouteArtifactTests(unittest.TestCase):
 def fixture(self):
  frames=[{'id':f'kf{i}','image':f'frames/kf{i}.png','width':100,'height':80,'intrinsics':[100,0,50,0,100,40,0,0,1],'position':[float(i),0,0],'rotation':[0,0,0,1]} for i in range(3)]
  manifest={'schemaVersion':1,'routeId':'route1','configSha256':'b'*64,'source':'captured','units':'tracker','scaleVerified':False,'privacy':{'capturePermitted':True,'imagesReviewed':True},'keyframes':frames,'path':[{'position':k['position'],'keyframeId':k['id']} for k in frames],'destination':{'pathIndex':2,'keyframeId':'kf2'}}
  raw=json.dumps({'manifest':manifest,'images':[{'id':k['id'],'png':'private'} for k in frames],'timing':[]}).encode()
  m={'schemaVersion':1,'descriptorType':'SIFT-float32-128-L2','units':'tracker','scaleVerified':False,'navigationReady':False,'captureSha256':hashlib.sha256(raw).hexdigest(),'captureConfigSha256':'b'*64,'geometryConfigSha256':'c'*64,'opencv':'5.0.0','landmarkCount':1,'landmarks':[{'id':'lm0','position':[1,2,3],'descriptor':[1.]*128,'observations':[{'keyframeId':f'kf{i}','featureIndex':0,'pixel':[10,20]} for i in range(3)],'maxReprojectionErrorPx':1.,'maxParallaxDeg':2.}]}
  return raw,m
 def test_binds_real_route_and_sparse_map_without_images_or_navigation_claim(self):
  raw,m=self.fixture();map_raw=json.dumps(m).encode();artifact=build_route_artifact(raw,map_raw)
  self.assertEqual(artifact['sourceCaptureSha256'],hashlib.sha256(raw).hexdigest())
  self.assertEqual(artifact['sparseMapSha256'],hashlib.sha256(map_raw).hexdigest())
  self.assertEqual(artifact['destination']['keyframeId'],'kf2')
  self.assertEqual(len(artifact['landmarks']),1)
  self.assertFalse(artifact['navigationReady'])
  self.assertFalse(artifact['scaleVerified'])
  self.assertNotIn('private',json.dumps(artifact))
 def test_rejects_mismatched_provenance_and_observations(self):
  raw,m=self.fixture()
  for change in [lambda x:x.update(captureSha256='0'*64),lambda x:x.update(captureConfigSha256='0'*64),lambda x:x['landmarks'][0]['observations'][0].update(keyframeId='missing'),lambda x:x['landmarks'][0]['observations'][0].update(pixel=[101,20]),lambda x:x.update(scaleVerified=True)]:
   bad=copy.deepcopy(m);change(bad)
   with self.assertRaises(ValueError):build_route_artifact(raw,json.dumps(bad).encode())
 def test_rejects_modified_path_destination_and_unreviewed_capture(self):
  raw,m=self.fixture()
  for change in [lambda x:x['manifest']['path'][1].update(position=[9,0,0]),lambda x:x['manifest']['destination'].update(keyframeId='kf0'),lambda x:x['manifest']['privacy'].update(imagesReviewed=False)]:
   capture=json.loads(raw);change(capture);newraw=json.dumps(capture).encode();newmap=copy.deepcopy(m);newmap['captureSha256']=hashlib.sha256(newraw).hexdigest()
   with self.assertRaises(ValueError):build_route_artifact(newraw,json.dumps(newmap).encode())
