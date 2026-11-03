"""Same-start marker to visitor tracker transform; never authorizes route-follow arrows."""
import hashlib
import json
import re
import sys
from pathlib import Path

geometry_dir=str(Path(__file__).resolve().parent)
if geometry_dir not in sys.path:sys.path.insert(0,geometry_dir)
from calibration_window import select_calibration_window


def align_visitor_marker(receipts,config_bytes,route_id):
 config=json.loads(config_bytes)
 raw_sha=hashlib.sha256(config_bytes).hexdigest()
 canonical_sha=hashlib.sha256(json.dumps(config,sort_keys=True,separators=(',',':')).encode()).hexdigest()
 identity={'routeId':route_id,'configSha256':raw_sha,'metricScaleVerified':False,
           'navigationReady':False,'arrowAuthorized':False,'receiptProvenance':'caller-supplied'}
 def reject(reason):return {**identity,'accepted':False,'reason':reason}
 if not isinstance(route_id,str) or not route_id or not isinstance(receipts,list) or len(receipts)<config['ALIGNMENT_MIN_PAIRS_COUNT']:
  return reject('insufficient-marker-views')
 seen_images=set();last_phone=-1;observations=[]
 for receipt in receipts:
  if not isinstance(receipt,dict) or receipt.get('accepted') is not True or receipt.get('markerId')!=config['MARKER_ID'] or receipt.get('configSha256')!=raw_sha or receipt.get('canonicalConfigSha256')!=canonical_sha or not re.fullmatch(r'[0-9a-f]{64}',str(receipt.get('imageSha256',''))) or not re.match(r'^5\.',str(receipt.get('opencvVersion',''))):
   return reject('untrusted-or-inconsistent-marker-view')
  image_sha=receipt['imageSha256'];phone=receipt.get('frameAtPhoneMs')
  if image_sha in seen_images or type(phone) not in (int,float) or phone<=last_phone:
   return reject('duplicate-or-unsynchronized-marker-view')
  seen_images.add(image_sha);last_phone=phone
  observations.append({'frameId':receipt.get('frameId'),
   'imageVideoTime':receipt.get('imageVideoTime'),'poseVideoTime':receipt.get('poseVideoTime'),
   'markerId':receipt.get('markerId'),'accepted':True,'configSha256':canonical_sha,
   'opencvVersion':receipt.get('opencvVersion'),
   'cameraCenterMarkerM':receipt.get('cameraCenterMarkerM'),
   'markerToCameraRotation':receipt.get('markerToCameraRotation'),
   'trackerRotation':receipt.get('trackerRotation'),
   'trackerCameraCenter':receipt.get('trackerCameraCenter')})
 calibrated=select_calibration_window(observations,config)
 selection=calibrated.get('windowSelection') or {}
 start=selection.get('selectedStartIndex')
 used=observations if start is None else observations[start:]
 if not calibrated['accepted']:
  return {**reject(calibrated['reason']),**{key:calibrated[key] for key in
   ('markerBaselineM','maxOrientationDisagreementDeg','maxPairwiseScaleDisagreementFraction') if key in calibrated},
   'windowSelection':selection}
 return {**identity,'accepted':True,'ambiguous':False,'reason':'marker-session-transform-hypothesis-only',
         'routeToSession':calibrated['markerToSession'],
         'sourceFrameAtPhoneMs':last_phone,
         'startTrackerPosition':used[-1]['trackerCameraCenter'],
         'opencvVersion':receipts[-1]['opencvVersion'],
         'markerObservationCount':len(used),
         'discardedLeadingObservationCount':len(observations)-len(used),
         'windowSelection':selection,
         'markerBaselineM':calibrated['markerBaselineM'],
         'maxOrientationDisagreementDeg':calibrated['maxOrientationDisagreementDeg'],
         'maxPairwiseScaleDisagreementFraction':calibrated['maxPairwiseScaleDisagreementFraction'],
         'maxRelativeResidual':calibrated['maxRelativeResidual']}


def main():
 config_bytes=(Path(__file__).resolve().parents[1]/'config/vision.yaml').read_bytes()
 payload=json.load(sys.stdin)
 print(json.dumps(align_visitor_marker(payload['receipts'],config_bytes,payload['routeId']),allow_nan=False))


if __name__=='__main__':main()
