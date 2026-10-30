"""Bind one reviewed capture to its OpenCV sparse map; never authorize navigation."""
import argparse
import hashlib
import json
import re
from pathlib import Path
import numpy as np
from map_query import validate_map


def sha(raw):return hashlib.sha256(raw).hexdigest()
def vector(value,length):
 a=np.asarray(value,dtype=float)
 if a.shape!=(length,) or not np.isfinite(a).all():raise ValueError('Invalid route vector')
 return a.tolist()


def build_route_artifact(capture_bytes,map_bytes):
 capture=json.loads(capture_bytes);m=json.loads(map_bytes)
 validate_map(m)
 manifest=capture['manifest']
 if manifest.get('schemaVersion')!=1 or manifest.get('source')!='captured' or manifest.get('units')!='tracker' or manifest.get('scaleVerified') is not False or manifest.get('privacy')!={'capturePermitted':True,'imagesReviewed':True}:raise ValueError('Unsupported or unreviewed capture')
 if not isinstance(manifest.get('routeId'),str) or not re.fullmatch('[a-zA-Z0-9_-]+',manifest['routeId']):raise ValueError('Invalid route ID')
 if m['captureSha256']!=sha(capture_bytes) or m['captureConfigSha256']!=manifest['configSha256']:raise ValueError('Map/capture provenance mismatch')
 if not str(m.get('opencv','')).startswith('5.'):raise ValueError('OpenCV 5 map required')
 frames=manifest['keyframes'];path=manifest['path']
 if len(frames)<2 or len(path)!=len(frames):raise ValueError('Incomplete route path')
 ids=set();safe_frames=[]
 for frame in frames:
  fid=frame['id']
  if not isinstance(fid,str) or not re.fullmatch('[a-zA-Z0-9_-]+',fid) or fid in ids:raise ValueError('Invalid keyframe identities')
  ids.add(fid)
  w,h=frame['width'],frame['height']
  if type(w) is not int or type(h) is not int or min(w,h)<=0:raise ValueError('Invalid frame dimensions')
  k=vector(frame['intrinsics'],9);position=vector(frame['position'],3);rotation=vector(frame['rotation'],4)
  if k[0]<=0 or k[4]<=0 or k[2]<0 or k[2]>=w or k[5]<0 or k[5]>=h or k[6:]!=[0,0,1]:raise ValueError('Invalid calibration')
  if abs(np.linalg.norm(rotation)-1)>.01:raise ValueError('Invalid camera orientation')
  safe_frames.append({'id':fid,'width':w,'height':h,'intrinsics':k,'position':position,'rotation':rotation})
 safe_path=[]
 for point,frame in zip(path,safe_frames,strict=True):
  if point['keyframeId']!=frame['id'] or vector(point['position'],3)!=frame['position']:raise ValueError('Path disagrees with camera centers')
  safe_path.append({'keyframeId':frame['id'],'position':frame['position']})
 destination=manifest['destination']
 if destination!={'pathIndex':len(path)-1,'keyframeId':frames[-1]['id']}:raise ValueError('Invalid destination')
 frame_by_id={f['id']:f for f in safe_frames}
 for landmark in m['landmarks']:
  for obs in landmark['observations']:
   frame=frame_by_id.get(obs['keyframeId'])
   if frame is None:raise ValueError('Unknown observation frame')
   x,y=obs['pixel']
   if x>=frame['width'] or y>=frame['height']:raise ValueError('Observation outside source image')
 return {'schemaVersion':1,'artifactType':'sparse-route-v1','routeId':manifest['routeId'],
         'sourceCaptureSha256':sha(capture_bytes),'sparseMapSha256':sha(map_bytes),
         'captureConfigSha256':manifest['configSha256'],'geometryConfigSha256':m['geometryConfigSha256'],
         'opencv':m['opencv'],'descriptorType':m['descriptorType'],'units':'tracker',
         'scaleVerified':False,'navigationReady':False,'privacy':manifest['privacy'],
         'keyframes':safe_frames,'path':safe_path,'destination':destination,
         'landmarks':m['landmarks']}


def main():
 p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('map',type=Path);p.add_argument('output',type=Path);a=p.parse_args()
 if a.output.resolve() in (a.capture.resolve(),a.map.resolve()):raise ValueError('Output would overwrite input')
 artifact=build_route_artifact(a.capture.read_bytes(),a.map.read_bytes())
 a.output.write_text(json.dumps(artifact,allow_nan=False,indent=2))
 print(json.dumps({k:v for k,v in artifact.items() if k not in ('landmarks','keyframes','path')},indent=2))
 print('keyframes',len(artifact['keyframes']),'landmarks',len(artifact['landmarks']))
if __name__=='__main__':main()
