"""Offline descriptor-to-PnP diagnostic. Author replay is not held-out evaluation."""
import argparse,base64,hashlib,json,re
from pathlib import Path
import cv2
import numpy as np
from tracks import ratio_matches
from localizer import estimate_pose

def validate_map(m):
 if m.get('schemaVersion')!=1 or m.get('descriptorType')!='SIFT-float32-128-L2' or m.get('units')!='tracker' or m.get('scaleVerified') is not False or m.get('navigationReady') is not False:raise ValueError('Unsupported map contract')
 for key in ['captureSha256','captureConfigSha256','geometryConfigSha256']:
  if not isinstance(m.get(key),str) or not re.fullmatch('[a-f0-9]{64}',m[key]):raise ValueError('Missing map provenance')
 landmarks=m.get('landmarks')
 if not isinstance(landmarks,list) or m.get('landmarkCount')!=len(landmarks):raise ValueError('Invalid landmark count')
 seen=set();used=set();result=[]
 for lm in landmarks:
  name=lm.get('id')
  if not isinstance(name,str) or not re.fullmatch('[a-zA-Z0-9_-]+',name) or name in seen:raise ValueError('Duplicate or invalid landmark ID')
  seen.add(name)
  xyz=np.asarray(lm.get('position'),dtype=float);desc=np.asarray(lm.get('descriptor'),dtype=float)
  if xyz.shape!=(3,) or desc.shape!=(128,) or not np.isfinite(xyz).all() or not np.isfinite(desc).all() or (desc<0).any() or np.linalg.norm(desc)==0:raise ValueError('Invalid landmark data')
  views=set();obs=lm.get('observations')
  if not isinstance(obs,list) or len(obs)<2:raise ValueError('Missing observations')
  for o in obs:
   frame=o.get('keyframeId');index=o.get('featureIndex');pixel=np.asarray(o.get('pixel'),dtype=float)
   if not isinstance(frame,str) or not re.fullmatch('[a-zA-Z0-9_-]+',frame) or frame in views or type(index) is not int or index<0 or pixel.shape!=(2,) or not np.isfinite(pixel).all() or (pixel<0).any():raise ValueError('Invalid observation')
   identity=(frame,index)
   if identity in used:raise ValueError('Observation belongs to multiple landmarks')
   views.add(frame);used.add(identity)
  for field in ['maxReprojectionErrorPx','maxParallaxDeg']:
   val=lm.get(field)
   if not isinstance(val,(int,float)) or not np.isfinite(val) or val<0:raise ValueError('Missing geometry evidence')
  result.append({'id':name,'position':xyz,'descriptor':desc.astype(np.float32)})
 return result

def unique_correspondences(pairs,pixels,positions,scores):
 seen_pixels=set();seen_positions=set();selected=[]
 for index in sorted(range(len(pairs)),key=lambda i:(scores[i],pairs[i])):
  q,t=pairs[index];pixel=tuple(pixels[q]);position=tuple(positions[t])
  if pixel in seen_pixels or position in seen_positions:continue
  seen_pixels.add(pixel);seen_positions.add(position);selected.append((q,t))
 return selected

def match_descriptors(query,reference,ratio):
 forward=ratio_matches(query,reference,ratio);reverse=ratio_matches(reference,query,ratio)
 return sorted((q,t) for q,t in forward.items() if reverse.get(t)==q)

def run(map_path,capture_path):
 if cv2.__version__.split('.')[0]!='5':raise RuntimeError('OpenCV 5 required')
 map_bytes=map_path.read_bytes();m=json.loads(map_bytes);landmarks=validate_map(m)
 cfg=json.loads((Path(__file__).resolve().parents[1]/'config/vision.yaml').read_text())
 raw=capture_path.read_bytes();capture=json.loads(raw);manifest=capture['manifest']
 if manifest['privacy']!={'capturePermitted':True,'imagesReviewed':True}:raise ValueError('Reviewed capture required')
 refs=np.asarray([l['descriptor'] for l in landmarks],dtype=np.float32);sift=cv2.SIFT_create(nfeatures=cfg['GEOMETRY_SIFT_FEATURES_COUNT']);results=[]
 for image,k in zip(capture['images'],manifest['keyframes'],strict=True):
  im=cv2.imdecode(np.frombuffer(base64.b64decode(image['png'],validate=True),np.uint8),cv2.IMREAD_GRAYSCALE)
  if im is None or im.shape!=(k['height'],k['width']) or image['id']!=k['id']:raise ValueError('Query image/calibration mismatch')
  points,descriptors=sift.detectAndCompute(im,None);matches=match_descriptors(descriptors,refs,cfg['GEOMETRY_MATCH_RATIO']) if len(refs)>=2 else []
  raw_matches=len(matches)
  matches=unique_correspondences(matches,[p.pt for p in points],[l['position'] for l in landmarks],[float(np.linalg.norm(descriptors[q]-refs[t])) for q,t in matches])
  xyz=np.asarray([landmarks[t]['position'] for q,t in matches]).reshape(-1,3);uv=np.asarray([points[q].pt for q,t in matches]).reshape(-1,2)
  result=estimate_pose(xyz,uv,np.asarray(k['intrinsics']).reshape(3,3),(k['width'],k['height']),[landmarks[t]['id'] for q,t in matches],cfg)
  results.append({'queryFrame':k['id'],'descriptorMatches':len(matches),'rawDescriptorMatches':raw_matches,**result})
 report={'kind':'offline author-capture query diagnostic; not held-out visitor evaluation','mapSha256':hashlib.sha256(map_bytes).hexdigest(),'queryCaptureSha256':hashlib.sha256(raw).hexdigest(),'mapCaptureSha256':m['captureSha256'],'sameSourceCapture':m['captureSha256']==hashlib.sha256(raw).hexdigest(),'mapGeometryConfigSha256':m['geometryConfigSha256'],'queryCaptureConfigSha256':manifest['configSha256'],'navigationReady':False,'frames':len(results),'acceptedHypotheses':sum(r['accepted'] for r in results),'results':results}
 output=capture_path.with_name(capture_path.stem+'-query-'+hashlib.sha256(map_bytes).hexdigest()[:12]+'.json');output.write_text(json.dumps(report,allow_nan=False,indent=2))
 print(json.dumps({k:v for k,v in report.items() if k!='results'},indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('map',type=Path);p.add_argument('capture',type=Path);a=p.parse_args();run(a.map,a.capture)

