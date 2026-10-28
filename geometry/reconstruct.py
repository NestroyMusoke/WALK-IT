"""Offline known-pose geometry diagnostic; never authorizes navigation."""
import argparse,base64,hashlib,json
from pathlib import Path
import cv2
import numpy as np

def triangulate_known(a,b,k1,k2,e1,e2,max_error):
 p1=k1@e1;p2=k2@e2
 h=cv2.triangulatePoints(p1,p2,np.asarray(a).T.astype(float),np.asarray(b).T.astype(float))
 with np.errstate(divide='ignore',invalid='ignore'): xyz=(h[:3]/h[3]).T
 world=np.c_[xyz,np.ones(len(xyz))]
 q1=(p1@world.T).T;q2=(p2@world.T).T
 with np.errstate(divide='ignore',invalid='ignore'):
  error=np.maximum(np.linalg.norm(q1[:,:2]/q1[:,2:]-a,axis=1),np.linalg.norm(q2[:,:2]/q2[:,2:]-b,axis=1))
 valid=np.isfinite(xyz).all(axis=1)&np.isfinite(error)&(q1[:,2]>0)&(q2[:,2]>0)&(error<=max_error)
 return xyz,error,valid

def extrinsic(k):
 x,y,z,w=k['rotation']
 r=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
 # Camera-to-world OpenGL -> world-to-camera OpenCV (+Z forward,+Y down).
 r=np.diag([1.,-1.,-1.])@r.T
 return np.c_[r,-r@np.array(k['position'])]

def run(path):
 if cv2.__version__.split('.')[0]!='5':raise RuntimeError('OpenCV 5 required; no silent fallback')
 root=Path(__file__).resolve().parents[1];raw=(root/'config/vision.yaml').read_bytes();cfg=json.loads(raw)
 data=json.loads(path.read_text());ks=data['manifest']['keyframes']
 if data['manifest']['privacy']!={'capturePermitted':True,'imagesReviewed':True}:raise ValueError('Reviewed permitted capture required')
 sift=cv2.SIFT_create(nfeatures=cfg['GEOMETRY_SIFT_FEATURES_COUNT']);features=[]
 for image,k in zip(data['images'],ks,strict=True):
  im=cv2.imdecode(np.frombuffer(base64.b64decode(image['png'],validate=True),np.uint8),cv2.IMREAD_GRAYSCALE)
  if im is None or im.shape!=(k['height'],k['width']) or image['id']!=k['id']:raise ValueError('Image mismatch')
  features.append(sift.detectAndCompute(im,None))
 pairs=[];cloud=[]
 for i in range(len(ks)-1):
  kp1,d1=features[i];kp2,d2=features[i+1];row={'a':ks[i]['id'],'b':ks[i+1]['id'],'features':[len(kp1),len(kp2)],'matches':0,'accepted':0}
  if d1 is not None and d2 is not None and len(d2)>=2:
   matches=[m for pair in cv2.BFMatcher(cv2.NORM_L2).knnMatch(d1,d2,k=2) if len(pair)==2 for m,n in [pair] if m.distance<cfg['GEOMETRY_MATCH_RATIO']*n.distance]
   row['matches']=len(matches)
   if len(matches)>=cfg['GEOMETRY_MIN_MATCHES_COUNT']:
    a=np.array([kp1[m.queryIdx].pt for m in matches]);b=np.array([kp2[m.trainIdx].pt for m in matches])
    xyz,err,valid=triangulate_known(a,b,np.array(ks[i]['intrinsics']).reshape(3,3),np.array(ks[i+1]['intrinsics']).reshape(3,3),extrinsic(ks[i]),extrinsic(ks[i+1]),cfg['GEOMETRY_REPROJECTION_LIMIT_PX'])
    row['accepted']=int(valid.sum());row['medianAcceptedErrorPx']=float(np.median(err[valid])) if valid.any() else None
    cloud.extend(xyz[valid].tolist())
  pairs.append(row)
 report={'kind':'known-tracker-pose consistency diagnostic; not a validated map','opencv':cv2.__version__,'numpy':np.__version__,'captureSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'geometryConfigSha256':hashlib.sha256(raw).hexdigest(),'captureConfigSha256':data['manifest']['configSha256'],'units':data['manifest']['units'],'navigationReady':False,'pairs':pairs,'candidatePointsIncludingDuplicates':len(cloud)}
 out=path.with_name(path.stem+'-geometry.json');out.write_text(json.dumps(report,indent=2))
 path.with_name(path.stem+'-candidate-points.json').write_text(json.dumps(cloud))
 print(json.dumps(report,indent=2))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('capture',type=Path);run(parser.parse_args().capture)
