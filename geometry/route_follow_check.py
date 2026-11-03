"""2D image agreement for route-follow screening; not a metric localization pose."""
import hashlib
import json
import sys
import time
from pathlib import Path

import cv2
import numpy as np

geometry_dir=str(Path(__file__).resolve().parent)
if geometry_dir not in sys.path:sys.path.insert(0,geometry_dir)
from sift_profile import make_sift
from tracks import ratio_matches


def compare_frames(reference,query,config):
 started=time.perf_counter()
 identity={'opencvVersion':cv2.__version__,
  'configSha256':hashlib.sha256(json.dumps(config,sort_keys=True,separators=(',',':')).encode()).hexdigest(),
  'navigationReady':False,'arrowAuthorized':False}
 def result(accepted,reason,mutual=0,inliers=0,spread=0):
  return {**identity,'accepted':accepted,'reason':reason,'mutualMatches':mutual,
          'homographyInliers':inliers,'imageSpreadFraction':spread,
          'elapsedMs':(time.perf_counter()-started)*1000}
 if cv2.__version__.split('.')[0]!='5':return result(False,'opencv-version')
 if any(not isinstance(image,np.ndarray) or image.dtype!=np.uint8 or image.ndim!=2 or
        min(image.shape)<2 for image in (reference,query)):
  return result(False,'invalid-image')
 sift=make_sift(config)
 ref_points,ref_descriptors=sift.detectAndCompute(reference,None)
 query_points,query_descriptors=sift.detectAndCompute(query,None)
 if ref_descriptors is None or query_descriptors is None:return result(False,'insufficient-features')
 forward=ratio_matches(query_descriptors,ref_descriptors,config['GEOMETRY_MATCH_RATIO'])
 reverse=ratio_matches(ref_descriptors,query_descriptors,config['GEOMETRY_MATCH_RATIO'])
 pairs=[(qi,ri) for qi,ri in forward.items() if reverse.get(ri)==qi]
 if len(pairs)<config['GEOMETRY_MIN_MATCHES_COUNT']:return result(False,'insufficient-matches',len(pairs))
 uv=np.float32([query_points[qi].pt for qi,_ in pairs])
 xy=np.float32([ref_points[ri].pt for _,ri in pairs])
 try:_,mask=cv2.findHomography(uv,xy,cv2.RANSAC,config['GEOMETRY_REPROJECTION_LIMIT_PX'])
 except cv2.error:return result(False,'homography-failed',len(pairs))
 if mask is None:return result(False,'homography-failed',len(pairs))
 retained=uv[mask.ravel().astype(bool)]
 inliers=len(retained)
 if inliers<config['LOCALIZER_MIN_INLIERS_COUNT'] or inliers/len(pairs)<config['LOCALIZER_MIN_INLIER_RATIO']:
  return result(False,'insufficient-inliers',len(pairs),inliers)
 spread=min(float(np.ptp(retained[:,0])/query.shape[1]),float(np.ptp(retained[:,1])/query.shape[0]))
 if spread<config['LOCALIZER_MIN_IMAGE_SPREAD_FRACTION']:
  return result(False,'narrow-image-support',len(pairs),inliers,spread)
 return result(True,'two-view-image-agreement-only',len(pairs),inliers,spread)
