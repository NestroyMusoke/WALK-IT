"""Map-to-session similarity fixture. Does not validate correspondence identity."""
import hashlib,json
import numpy as np

def estimate_gravity_windowed_alignment(map_centers,session_centers,cfg):
 """Robust recent map-to-session yaw/scale/translation hypothesis in tracker units.

 This does not establish metres, correspondence identity, expiry, or navigation readiness.
 """
 identity={'configSha256':hashlib.sha256(json.dumps(cfg,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'configHashEncoding':'canonical-json','navigationReady':False,'metricScaleVerified':False,'direction':'map-to-session'}
 def reject(reason,**evidence):return {**identity,'accepted':False,'reason':reason,**evidence}
 x=np.asarray(map_centers,dtype=float);y=np.asarray(session_centers,dtype=float)
 if x.ndim!=2 or x.shape[1:]!=(3,) or y.shape!=x.shape:return reject('invalid-pair-shape')
 x=x[-cfg['ALIGNMENT_WINDOW_MAX_PAIRS_COUNT']:];y=y[-cfg['ALIGNMENT_WINDOW_MAX_PAIRS_COUNT']:]
 if len(x)<cfg['ALIGNMENT_MIN_PAIRS_COUNT'] or not np.isfinite(x).all() or not np.isfinite(y).all():return reject('insufficient-or-invalid-pairs')
 a=x[:,[0,2]];b=y[:,[0,2]]
 if np.ptp(a,axis=0).max()<cfg['ALIGNMENT_WINDOW_MIN_HORIZONTAL_EXTENT_TRACKER_UNITS']:return reject('unobservable-horizontal-motion')
 distances=np.linalg.norm(b[:,None,:]-b[None,:,:],axis=2)
 positives=distances[distances>0]
 if not len(positives):return reject('unobservable-session-motion')
 extent=float(np.median(positives)*2)
 limit=cfg['ALIGNMENT_MAX_RELATIVE_RESIDUAL']*extent
 candidates=[]
 for i in range(len(x)):
  for j in range(i+1,len(x)):
   dx=a[j]-a[i];dy=b[j]-b[i]
   nx=np.linalg.norm(dx);ny=np.linalg.norm(dy)
   if nx<cfg['ALIGNMENT_WINDOW_MIN_HORIZONTAL_EXTENT_TRACKER_UNITS'] or ny<=0:continue
   scale=ny/nx;c=np.dot(dx,dy)/(nx*ny);s=(dx[0]*dy[1]-dx[1]*dy[0])/(nx*ny)
   rot2=np.array([[c,-s],[s,c]]);translation=np.median(b-scale*a@rot2.T,axis=0)
   vertical=float(np.median(y[:,1]-scale*x[:,1]))
   errors=np.linalg.norm(np.c_[scale*a@rot2.T+translation,scale*x[:,1]+vertical]-np.c_[b,y[:,1]],axis=1)
   inliers=errors<=limit
   if inliers.sum()>=cfg['ALIGNMENT_MIN_PAIRS_COUNT'] and inliers.mean()>=cfg['ALIGNMENT_MIN_INLIER_RATIO']:
    candidates.append((int(inliers.sum()),float(np.median(errors[inliers])),inliers))
 if not candidates:return reject('inconsistent-window',pairs=len(x),windowExtentSessionUnits=extent)
 _,_,inliers=max(candidates,key=lambda row:(row[0],-row[1]))
 aa=a[inliers];bb=b[inliers];ma=aa.mean(axis=0);mb=bb.mean(axis=0)
 u,s,vt=np.linalg.svd((bb-mb).T@(aa-ma))
 correction=np.diag([1.,np.linalg.det(u@vt)])
 rot2=u@correction@vt
 variance=np.sum((aa-ma)**2)
 if variance<=0:return reject('unobservable-horizontal-motion')
 scale=float(np.sum(s*np.diag(correction))/variance)
 if not np.isfinite(scale) or scale<=0:return reject('invalid-scale')
 translation2=mb-scale*rot2@ma;vertical=float(np.median(y[inliers,1]-scale*x[inliers,1]))
 r=np.array([[rot2[0,0],0,rot2[0,1]],[0,1,0],[rot2[1,0],0,rot2[1,1]]])
 translation=np.array([translation2[0],vertical,translation2[1]])
 errors=np.linalg.norm(scale*x@r.T+translation-y,axis=1)
 final=errors<=limit
 if final.sum()<cfg['ALIGNMENT_MIN_PAIRS_COUNT'] or final.mean()<cfg['ALIGNMENT_MIN_INLIER_RATIO']:return reject('inconsistent-refined-window',pairs=len(x))
 if not final[-cfg['ALIGNMENT_RECENT_REQUIRED_INLIERS_COUNT']:].all():return reject('stale-window-support',pairs=len(x),inliers=int(final.sum()))
 relative=float(errors[final].max()/extent)
 if relative>cfg['ALIGNMENT_MAX_RELATIVE_RESIDUAL']:return reject('inconsistent-refined-window',maxRelativeResidual=relative)
 return {**identity,'accepted':True,'reason':'gravity-window-hypothesis-only','scale':scale,'rotation':r.tolist(),'translation':translation.tolist(),'pairs':len(x),'inliers':int(final.sum()),'maxRelativeResidual':relative,'maxResidualSessionUnits':float(errors[final].max()),'windowExtentSessionUnits':extent}

def estimate_alignment(map_centers,session_centers,cfg):
 identity={'configSha256':hashlib.sha256(json.dumps(cfg,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'configHashEncoding':'canonical-json','navigationReady':False,'metricScaleVerified':False}
 def reject(reason,**evidence):return {**identity,**evidence,'accepted':False,'reason':reason}
 x=np.asarray(map_centers,dtype=float);y=np.asarray(session_centers,dtype=float)
 if x.ndim!=2 or x.shape[1:]!=(3,) or y.shape!=x.shape:return reject('invalid-pair-shape')
 if len(x)<cfg['ALIGNMENT_MIN_PAIRS_COUNT']:return reject('insufficient-pairs')
 if not np.isfinite(x).all() or not np.isfinite(y).all():return reject('nonfinite-pairs')
 if len(np.unique(x,axis=0))!=len(x) or len(np.unique(y,axis=0))!=len(y):return reject('duplicate-centers')
 mx=x.mean(axis=0);my=y.mean(axis=0);a=x-mx;b=y-my
 for centered in [a,b]:
  s=np.linalg.svd(centered,compute_uv=False)
  if s[0]<=np.finfo(float).eps or s[1]/s[0]<cfg['ALIGNMENT_MIN_SECOND_AXIS_RATIO']:return reject('unobservable-trajectory')
 covariance=b.T@a/len(x);u,s,vt=np.linalg.svd(covariance)
 correction=np.eye(3);correction[-1,-1]=1 if np.linalg.det(u@vt)>0 else -1
 rotation=u@correction@vt;variance=np.sum(a*a)/len(x)
 scale=float(np.sum(s*np.diag(correction))/variance)
 if not np.isfinite(scale) or scale<=0:return reject('invalid-scale')
 translation=my-scale*rotation@mx
 errors=np.linalg.norm(scale*x@rotation.T+translation-y,axis=1)
 extent=float(np.max(np.linalg.norm(y[:,None,:]-y[None,:,:],axis=2)))
 relative=float(errors.max()/extent)
 if not np.isfinite(relative) or relative>cfg['ALIGNMENT_MAX_RELATIVE_RESIDUAL']:return reject('inconsistent-alignment',maxRelativeResidual=relative if np.isfinite(relative) else None,maxResidualSessionUnits=float(errors.max()) if np.isfinite(errors).all() else None,pairs=len(x))
 return {**identity,'accepted':True,'reason':'similarity-hypothesis-only','direction':'map-to-session','scale':scale,'rotation':rotation.tolist(),'translation':translation.tolist(),'maxResidualSessionUnits':float(errors.max()),'maxRelativeResidual':relative,'pairs':len(x)}

def transform_points(points,alignment):
 if alignment.get('accepted') is not True or alignment.get('direction')!='map-to-session':raise ValueError('Accepted map-to-session hypothesis required')
 return alignment['scale']*np.asarray(points)@np.asarray(alignment['rotation']).T+alignment['translation']

