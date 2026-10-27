import {it,expect} from 'vitest';
import {validateRouteBundle,requireMetricScale} from '../src/route-bundle';
function fixture(){return {schemaVersion:1,routeId:'synthetic-route',configSha256:'a'.repeat(64),source:'synthetic',units:'tracker',scaleVerified:false,
  privacy:{capturePermitted:true,imagesReviewed:true},
  keyframes:[{id:'kf0',image:'frames/000.jpg',width:640,height:480,intrinsics:[500,0,320,0,500,240,0,0,1],position:[0,0,0],rotation:[0,0,0,1]}],
  path:[{position:[0,0,0],keyframeId:'kf0'},{position:[0,0,-1],keyframeId:'kf0'}],
  destination:{pathIndex:1,keyframeId:'kf0'}};}
it('accepts a labelled capture manifest but does not authorize synthetic or unscaled navigation',()=>{
  const bundle=validateRouteBundle(fixture());expect(bundle.routeId).toBe('synthetic-route');
  expect(()=>requireMetricScale(bundle)).toThrow();
  const measured=fixture();measured.source='captured';measured.units='metres';measured.scaleVerified=true;
  expect(()=>requireMetricScale(validateRouteBundle(measured))).not.toThrow();
});
it('rejects inconsistent calibration, nonfinite poses and missing destination references',()=>{
  const bad=fixture();bad.keyframes[0].intrinsics[0]=0;expect(()=>validateRouteBundle(bad)).toThrow();
  const pose=fixture();pose.keyframes[0].position[0]=NaN;expect(()=>validateRouteBundle(pose)).toThrow();
  const target=fixture();target.destination.keyframeId='unknown';expect(()=>validateRouteBundle(target)).toThrow();
});
it('rejects traversal paths, unreviewed images, duplicate identities and unsupported schema',()=>{
  const traversal=fixture();traversal.keyframes[0].image='../private.jpg';expect(()=>validateRouteBundle(traversal)).toThrow();
  const privacy=fixture();privacy.privacy.imagesReviewed=false;expect(()=>validateRouteBundle(privacy)).toThrow();
  const duplicate=fixture();duplicate.keyframes.push({...duplicate.keyframes[0]});expect(()=>validateRouteBundle(duplicate)).toThrow();
  expect(()=>validateRouteBundle({...fixture(),schemaVersion:2})).toThrow();
});
