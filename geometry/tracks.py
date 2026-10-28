"""Experimental multiview landmark tracks; not a navigation-ready map."""
import argparse,base64,hashlib,json
from pathlib import Path
import cv2
import numpy as np
from reconstruct import extrinsic

def observation_tracks(edges):
 parent={}
 def find(x):
  parent.setdefault(x,x)
  if parent[x]!=x:parent[x]=find(parent[x])
  return parent[x]
 for a,b in edges:
  ra,rb=find(a),find(b)
  if ra!=rb:parent[rb]=ra
 groups={}
 for obs in parent:groups.setdefault(find(obs),[]).append(obs)
 tracks=[];conflicts=0
 for group in groups.values():
  if len({o[0] for o in group})!=len(group):conflicts+=1
  else:tracks.append(sorted(group))
 return sorted(tracks),conflicts

def fit_track(uv,projections,extrinsics,max_error,min_angle_deg):
 if len(uv)<2 or len(uv)!=len(projections) or len(uv)!=len(extrinsics):raise ValueError('Mismatched observations')
 rows=[]
 for (u,v),p in zip(uv,projections):rows.extend([u*p[2]-p[0],v*p[2]-p[1]])
 a=np.asarray(rows)
 if not np.isfinite(a).all():return None
 _,_,vt=np.linalg.svd(a);h=vt[-1]
 if h[3]==0:return None
 xyz=h[:3]/h[3]
 if not np.isfinite(xyz).all():return None
 world=np.r_[xyz,1.];rays=[];errors=[]
 for point,p,e in zip(uv,projections,extrinsics):
  q=p@world
  if q[2]<=0:return None
  error=float(np.linalg.norm(q[:2]/q[2]-point))
  if not np.isfinite(error) or error>max_error:return None
  errors.append(error);center=-e[:,:3].T@e[:,3];ray=xyz-center;n=np.linalg.norm(ray)
  if not np.isfinite(n) or n==0:return None
  rays.append(ray/n)
 dots=np.clip(np.array(rays)@np.array(rays).T,-1,1)
 angle=float(np.degrees(np.arccos(dots.min())))
 if angle<min_angle_deg:return None
 return {'position':xyz.tolist(),'maxReprojectionErrorPx':max(errors),'maxParallaxDeg':angle}

def ratio_matches(a,b,ratio):
 if a is None or b is None or len(a)<2 or len(b)<2:return {}
 return {m.queryIdx:m.trainIdx for pair in cv2.BFMatcher(cv2.NORM_L2).knnMatch(a,b,k=2) if len(pair)==2 for m,n in [pair] if m.distance<ratio*n.distance}

def run(path):
 if cv2.__version__.split('.')[0]!='5':raise RuntimeError('OpenCV 5 required')
 raw=(Path(__file__).resolve().parents[1]/'config/vision.yaml').read_bytes();cfg=json.loads(raw)
 capture=json.loads(path.read_text());manifest=capture['manifest'];ks=manifest['keyframes']
 if manifest['privacy']!={'capturePermitted':True,'imagesReviewed':True}:raise ValueError('Review required')
 sift=cv2.SIFT_create(nfeatures=cfg['GEOMETRY_SIFT_FEATURES_COUNT']);features=[]
 for image,k in zip(capture['images'],ks,strict=True):
  im=cv2.imdecode(np.frombuffer(base64.b64decode(image['png'],validate=True),np.uint8),cv2.IMREAD_GRAYSCALE)
  if im is None or im.shape!=(k['height'],k['width']) or image['id']!=k['id']:raise ValueError('Image mismatch')
  features.append(sift.detectAndCompute(im,None))
 edges=[];pair_counts=[]
 for i in range(len(ks)-1):
  f=ratio_matches(features[i][1],features[i+1][1],cfg['GEOMETRY_MATCH_RATIO']);b=ratio_matches(features[i+1][1],features[i][1],cfg['GEOMETRY_MATCH_RATIO'])
  matches=[((i,q),(i+1,t)) for q,t in f.items() if b.get(t)==q]
  edges.extend(matches);pair_counts.append(len(matches))
 tracks,conflicts=observation_tracks(edges);landmarks=[];too_short=0;rejected=0
 es=[extrinsic(k) for k in ks];ps=[np.array(k['intrinsics']).reshape(3,3)@e for k,e in zip(ks,es)]
 for track in tracks:
  if len(track)<cfg['GEOMETRY_TRACK_MIN_VIEWS_COUNT']:too_short+=1;continue
  uv=[features[i][0][q].pt for i,q in track]
  result=fit_track(uv,[ps[i] for i,q in track],[es[i] for i,q in track],cfg['GEOMETRY_REPROJECTION_LIMIT_PX'],cfg['GEOMETRY_MIN_PARALLAX_DEG'])
  if result is None:rejected+=1;continue
  i,q=track[0]
  landmarks.append({'id':f'lm{len(landmarks)}',**result,'descriptor':features[i][1][q].tolist(),'observations':[{'keyframeId':ks[i]['id'],'featureIndex':q,'pixel':list(features[i][0][q].pt)} for i,q in track]})
 coverage={k['id']:0 for k in ks}
 for landmark in landmarks:
  for obs in landmark['observations']:coverage[obs['keyframeId']]+=1
 report={'schemaVersion':1,'kind':'experimental known-pose SIFT tracks; no localization validation','captureSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'captureConfigSha256':manifest['configSha256'],'geometryConfigSha256':hashlib.sha256(raw).hexdigest(),'opencv':cv2.__version__,'numpy':np.__version__,'units':manifest['units'],'scaleVerified':False,'navigationReady':False,'descriptorType':'SIFT-float32-128-L2','mutualMatchesByPair':pair_counts,'conflictingComponents':conflicts,'shortTracks':too_short,'geometryRejectedTracks':rejected,'landmarkCount':len(landmarks),'coverageByKeyframe':coverage,'landmarks':landmarks}
 path.with_name(path.stem+'-tracks.json').write_text(json.dumps(report,allow_nan=False))
 print(json.dumps({k:v for k,v in report.items() if k!='landmarks'},indent=2))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('capture',type=Path);run(parser.parse_args().capture)
