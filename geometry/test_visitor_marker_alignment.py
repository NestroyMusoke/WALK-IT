import hashlib
import json
import unittest
from pathlib import Path

from geometry.visitor_marker_alignment import align_visitor_marker
from geometry.test_marker_scale import MARKER_CENTERS, SESSION_CENTERS, ROTATION
import numpy as np


RAW=(Path(__file__).resolve().parents[1]/'config/vision.yaml').read_bytes()
CONFIG=json.loads(RAW)
SHA=hashlib.sha256(RAW).hexdigest()
CANONICAL=hashlib.sha256(json.dumps(CONFIG,sort_keys=True,separators=(',',':')).encode()).hexdigest()


def receipts():
 return [{'frameId':f'v{i}','frameAtPhoneMs':1000+i*100,'imageVideoTime':float(i),
          'poseVideoTime':float(i),'markerId':CONFIG['MARKER_ID'],
          'accepted':True,'configSha256':SHA,'canonicalConfigSha256':CANONICAL,
          'opencvVersion':'5.0.0','cameraCenterMarkerM':a.tolist(),
          'trackerCameraCenter':b.tolist(),
          'markerToCameraRotation':(np.diag([1.,-1.,-1.])@ROTATION).reshape(9).tolist(),
          'trackerRotation':[0.,0.,0.,1.],
          'imageSha256':f'{i+1:064x}'}
         for i,(a,b) in enumerate(zip(MARKER_CENTERS,SESSION_CENTERS))]


class VisitorAlignmentTests(unittest.TestCase):
 def test_marker_observations_produce_transform_but_not_navigation(self):
  result=align_visitor_marker(receipts(),RAW,'r1')
  self.assertTrue(result['accepted'],result)
  self.assertEqual(result['routeToSession']['direction'],'map-to-session')
  self.assertEqual(result['sourceFrameAtPhoneMs'],1400)
  self.assertFalse(result['navigationReady'])
  self.assertFalse(result['arrowAuthorized'])

 def test_mixed_config_and_missing_marker_refuse(self):
  bad=receipts();bad[1]['canonicalConfigSha256']='a'*64
  self.assertFalse(align_visitor_marker(bad,RAW,'r1')['accepted'])
  bad=receipts();bad[1]['accepted']=False
  self.assertFalse(align_visitor_marker(bad,RAW,'r1')['accepted'])


if __name__=='__main__':unittest.main()
