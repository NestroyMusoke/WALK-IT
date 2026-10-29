"""Development motion evidence, never an anchor or an accuracy verdict."""
import argparse
import hashlib
import json
from pathlib import Path
import cv2
import numpy as np
from reconstruct import extrinsic


def compare_motion(map_centers, session_centers, map_to_session_rotations):
 x=np.asarray(map_centers,dtype=float);y=np.asarray(session_centers,dtype=float)
 rs=np.asarray(map_to_session_rotations,dtype=float)
 if x.ndim!=2 or x.shape[1:]!=(3,) or y.shape!=x.shape or rs.shape!=(len(x),3,3):
  raise ValueError('Mismatched pose arrays')
 if not all(np.isfinite(v).all() for v in (x,y,rs)):raise ValueError('Nonfinite poses')
 # Project small floating-point rotation errors onto SO(3); no acceptance threshold.
 rotations=[]
 for r in rs:
  u,_,vt=np.linalg.svd(r);d=np.eye(3);d[-1,-1]=np.linalg.det(u@vt)
  rotations.append(u@d@vt)
 pairs=[]
 for i in range(len(x)):
  for j in range(i+1,len(x)):
   md=float(np.linalg.norm(x[j]-x[i]));sd=float(np.linalg.norm(y[j]-y[i]))
   angle=float(np.degrees(np.arccos(np.clip((np.trace(rotations[i]@rotations[j].T)-1)/2,-1,1))))
   pairs.append({'indices':[i,j],'mapDistanceUnits':md,'sessionDistanceUnits':sd,
                 'sessionUnitsPerMapUnit':sd/md if md>0 else None,'rotationDisagreementDeg':angle})
 return {'navigationReady':False,'groundTruthAvailable':False,'pairs':pairs}


def main():
 p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('query',type=Path);p.add_argument('output',type=Path)
 args=p.parse_args()
 capture_bytes=args.capture.read_bytes();query_bytes=args.query.read_bytes()
 capture=json.loads(capture_bytes);query=json.loads(query_bytes)
 sha=lambda b:hashlib.sha256(b).hexdigest()
 if query['queryCaptureSha256']!=sha(capture_bytes):raise ValueError('Query/capture identity mismatch')
 frames={k['id']:k for k in capture['manifest']['keyframes']}
 accepted=[r for r in query['results'] if r['accepted']]
 ids=[r['queryFrame'] for r in accepted]
 if len(set(ids))!=len(ids) or any(i not in frames for i in ids):raise ValueError('Invalid query frame identity')
 if not accepted:raise ValueError('No pose hypotheses to compare')
 rotations=[extrinsic(frames[r['queryFrame']])[:,:3].T@cv2.Rodrigues(np.asarray(r['rotationVector'],dtype=float))[0] for r in accepted]
 result=compare_motion([r['cameraCenter'] for r in accepted],[frames[i]['position'] for i in ids],rotations)
 result.update(kind='development author motion consistency, not localization accuracy',queryFrames=ids,
               queryReportSha256=sha(query_bytes),captureSha256=sha(capture_bytes),
               configSha256=sha((Path(__file__).resolve().parents[1]/'config/vision.yaml').read_bytes()),configHashEncoding='raw-file',opencvVersion=cv2.__version__)
 args.output.write_text(json.dumps(result,indent=2,allow_nan=False))
 print(json.dumps(result,indent=2,allow_nan=False))

if __name__=='__main__':main()
