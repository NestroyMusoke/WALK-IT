"""Geometric pose hypothesis only. Tracking/scale/expiry gates remain external."""
import time,hashlib,json
import cv2
import numpy as np

def estimate_pose(xyz,pixels,intrinsics,image_size,landmark_ids,cfg):
 started=time.perf_counter()
 identity={'configSha256':hashlib.sha256(json.dumps(cfg,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'configHashEncoding':'canonical-json','opencv':cv2.__version__}
 def reject(reason):return {**identity,'accepted':False,'reason':reason,'navigationReady':False,'elapsedMs':(time.perf_counter()-started)*1000}
 if cv2.__version__.split('.')[0]!='5':return reject('opencv-version')
 xyz=np.asarray(xyz,dtype=np.float64);uv=np.asarray(pixels,dtype=np.float64);k=np.asarray(intrinsics,dtype=np.float64)
 if xyz.ndim!=2 or xyz.shape[1:]!=(3,) or uv.shape!=(len(xyz),2) or k.shape!=(3,3):return reject('invalid-shape')
 if not all(np.isfinite(a).all() for a in [xyz,uv,k]):return reject('nonfinite-input')
 if len(xyz)<cfg['LOCALIZER_MIN_INLIERS_COUNT']:return reject('insufficient-matches')
 if len(landmark_ids)!=len(xyz) or len(set(landmark_ids))!=len(xyz) or len(np.unique(xyz,axis=0))!=len(xyz) or len(np.unique(uv,axis=0))!=len(uv):return reject('duplicate-correspondences')
 w,h=image_size
 if not np.isfinite([w,h]).all() or min(w,h)<=0 or k[0,0]<=0 or k[1,1]<=0 or not np.array_equal(k[2],[0,0,1]):return reject('invalid-calibration')
 if (uv[:,0]<0).any() or (uv[:,0]>=w).any() or (uv[:,1]<0).any() or (uv[:,1]>=h).any():return reject('pixels-outside-image')
 def rank_ok(points):
  s=np.linalg.svd(points-points.mean(axis=0),compute_uv=False)
  return s[0]>0 and s[-1]/s[0]>=cfg['LOCALIZER_MIN_3D_RANK_RATIO']
 if not rank_ok(xyz):return reject('degenerate-geometry')
 try:
  ok,r,t,indices=cv2.solvePnPRansac(xyz,uv,k,None,iterationsCount=cfg['LOCALIZER_RANSAC_ITERATIONS_COUNT'],reprojectionError=cfg['LOCALIZER_REPROJECTION_LIMIT_PX'],confidence=cfg['LOCALIZER_RANSAC_CONFIDENCE'],flags=cv2.SOLVEPNP_EPNP)
  if not ok or indices is None:return reject('pnp-failed')
  selected=indices.ravel()
  if len(selected)<cfg['LOCALIZER_MIN_INLIERS_COUNT'] or len(selected)/len(xyz)<cfg['LOCALIZER_MIN_INLIER_RATIO']:return reject('insufficient-inliers')
  if not rank_ok(xyz[selected]):return reject('degenerate-inliers')
  ok,r,t=cv2.solvePnP(xyz[selected],uv[selected],k,None,r,t,True,flags=cv2.SOLVEPNP_ITERATIVE)
  if not ok or not np.isfinite(r).all() or not np.isfinite(t).all():return reject('refinement-failed')
  projected=cv2.projectPoints(xyz,r,t,k,None)[0].reshape(-1,2)
  errors=np.linalg.norm(projected-uv,axis=1);rotation=cv2.Rodrigues(r)[0]
  depths=(rotation@xyz.T+t).T[:,2]
  valid=(errors<=cfg['LOCALIZER_REPROJECTION_LIMIT_PX'])&(depths>0)
  selected=np.flatnonzero(valid)
  if len(selected)<cfg['LOCALIZER_MIN_INLIERS_COUNT'] or len(selected)/len(xyz)<cfg['LOCALIZER_MIN_INLIER_RATIO']:return reject('refined-pose-inconsistent')
  if not rank_ok(xyz[selected]):return reject('degenerate-refined-inliers')
  coverage=float(cv2.contourArea(cv2.convexHull(uv[selected].astype(np.float32))))/(w*h)
  if coverage<cfg['LOCALIZER_MIN_IMAGE_COVERAGE_FRACTION']:return reject('insufficient-image-coverage')
  return {**identity,'accepted':True,'reason':'geometric-hypothesis-only','navigationReady':False,'rotationVector':r.ravel().tolist(),'translation':t.ravel().tolist(),'cameraCenter':(-rotation.T@t).ravel().tolist(),'inlierIndices':selected.tolist(),'inliers':len(selected),'matches':len(xyz),'inlierRatio':len(selected)/len(xyz),'maxInlierErrorPx':float(errors[selected].max()),'imageCoverageFraction':coverage,'elapsedMs':(time.perf_counter()-started)*1000}
 except cv2.error:return reject('opencv-failure')

def select_unambiguous(candidates):
 accepted=[c for c in candidates if c.get('accepted') is True]
 if len(accepted)!=1:return {'accepted':False,'reason':'ambiguous' if accepted else 'no-valid-candidate','navigationReady':False}
 return {**accepted[0],'navigationReady':False}

