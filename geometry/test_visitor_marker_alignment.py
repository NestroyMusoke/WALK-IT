import hashlib
import json
import unittest
from pathlib import Path

from geometry.visitor_marker_alignment import align_visitor_marker
from geometry.test_marker_scale import MARKER_CENTERS, SESSION_CENTERS, ROTATION
from geometry.test_calibration_window import SETTLING, STATIONARY
from geometry.marker_scale import calibrate_marker_to_session
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


def as_receipts(observations):
 """Turn window-test observations into production-shaped marker receipts."""
 return [{**observation,'configSha256':SHA,'canonicalConfigSha256':CANONICAL,
          'frameAtPhoneMs':1000+index*250,'imageSha256':f'{index+1:064x}'}
         for index,observation in enumerate(observations)]


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

 def test_the_window_search_reaches_through_the_visitor_alignment_boundary(self):
  buffered=as_receipts(SETTLING)
  self.assertFalse(calibrate_marker_to_session(SETTLING,CONFIG)['accepted'])
  result=align_visitor_marker(buffered,RAW,'r1')
  self.assertTrue(result['accepted'],result)
  selection=result['windowSelection']
  self.assertTrue(selection['accepted'])
  self.assertGreaterEqual(result['discardedLeadingObservationCount'],1)
  self.assertEqual(result['markerObservationCount'],len(SETTLING)-selection['selectedStartIndex'])
  # Freshness stays anchored to the newest view even though leading views were set aside.
  self.assertEqual(result['sourceFrameAtPhoneMs'],buffered[-1]['frameAtPhoneMs'])
  self.assertEqual(result['startTrackerPosition'],SETTLING[-1]['trackerCameraCenter'])
  independent=calibrate_marker_to_session(SETTLING[selection['selectedStartIndex']:],CONFIG)
  self.assertTrue(independent['accepted'],independent)
  self.assertEqual(independent['markerToSession'],result['routeToSession'])
  self.assertFalse(result['arrowAuthorized'])
  self.assertFalse(result['navigationReady'])

 def test_a_refusal_carries_the_near_miss_metrics_that_drive_the_phone_readout(self):
  result=align_visitor_marker(as_receipts(STATIONARY),RAW,'r1')
  self.assertFalse(result['accepted'])
  self.assertEqual(result['reason'],'insufficient-metric-baseline')
  self.assertNotIn('routeToSession',result)
  self.assertLess(result['markerBaselineM'],CONFIG['ANCHOR_MIN_START_BASELINE_M'])
  selection=result['windowSelection']
  self.assertEqual(selection['passingWindowCount'],0)
  self.assertEqual(selection['totalObservationCount'],len(STATIONARY))
  self.assertLess(selection['gateMargins']['metricBaseline'],1.)
  self.assertFalse(result['arrowAuthorized'])

 def test_a_buffer_that_ends_unsettled_refuses_because_only_leading_views_are_dropped(self):
  backwards=[{**observation,'frameId':f'x{index}','imageVideoTime':float(index),
              'poseVideoTime':float(index)} for index,observation in enumerate(reversed(SETTLING))]
  result=align_visitor_marker(as_receipts(backwards),RAW,'r1')
  self.assertFalse(result['accepted'],result)
  selection=result['windowSelection']
  self.assertEqual(selection['passingWindowCount'],0)
  self.assertIn('x7',selection['selectedFrameIds'])


if __name__=='__main__':unittest.main()
