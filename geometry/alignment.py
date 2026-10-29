"""Map-to-session similarity fixture. Does not validate correspondence identity."""
import hashlib,json
import numpy as np

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

