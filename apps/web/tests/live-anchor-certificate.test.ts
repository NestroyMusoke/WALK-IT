import {expect,it} from 'vitest';
import {buildLiveAnchor} from '../src/live-anchor-certificate';
import {GuidanceRuntime} from '../src/guidance-runtime';
import {PerspectiveCamera} from 'three';

const route={routeId:'r1',sourceCaptureSha256:'b'.repeat(64),configSha256:'a'.repeat(64)};
const fit={accepted:true,ambiguous:false,reason:'marker-session-transform-hypothesis-only',routeId:'r1',
 sourceCaptureSha256:'b'.repeat(64),configSha256:'a'.repeat(64),opencvVersion:'5.0.0',
 markerObservationCount:4,sourceFrameAtPhoneMs:100,startTrackerPosition:[0,0,-1],
 markerBaselineM:0.6,maxOrientationDisagreementDeg:3,maxPairwiseScaleDisagreementFraction:0.02,maxRelativeResidual:0.01,
 routeToSession:{direction:'map-to-session',scale:1,rotation:[1,0,0,0,1,0,0,0,1],translation:[0,0,0]}};

it('derives live geometry authorization from a matching OpenCV 5 preflight, without claiming a field pass',()=>{
 const anchor=buildLiveAnchor(route,fit,'NORMAL',101);
 expect(anchor?.arrowAuthorized).toBe(true);
 expect(anchor?.fieldGatePassed).toBe(false);
 const camera=new PerspectiveCamera(60,1,0.01,1000);
 const frame={position:[0,0,-1],rotation:[0,0,0,1],projection:camera.projectionMatrix.toArray()};
 const candidate={...route,units:'metres' as const,markerObservationCount:4,expiresAtMs:10000,
  path:[{keyframeId:'kf0',position:[0,0,-2]},{keyframeId:'kf1',position:[1,0,-3]}],
  destination:{pathIndex:1,keyframeId:'kf1'},scaleVerified:false as const,
  navigationReady:false as const,arrowAuthorized:false as const};
 const guidance=new GuidanceRuntime();guidance.installMarkerPath(candidate,anchor!,0);
 expect(guidance.read(frame,'NORMAL',102,101,500,500)?.arrowAuthorized).toBe(true);
});

it('refuses installation if any single proof is absent or mismatched',()=>{
 const variants=[{...fit,accepted:false},{...fit,ambiguous:undefined},{...fit,markerObservationCount:3},
  {...fit,opencvVersion:'4.9.0'},{...fit,routeId:'other'},
  {...fit,sourceCaptureSha256:'c'.repeat(64)},{...fit,configSha256:'c'.repeat(64)},
  {...fit,startTrackerPosition:undefined},{...fit,routeToSession:undefined},
  {...fit,markerBaselineM:undefined},{...fit,maxOrientationDisagreementDeg:undefined},
  {...fit,maxPairwiseScaleDisagreementFraction:undefined},{...fit,maxRelativeResidual:undefined}];
 for(const candidate of variants)expect(buildLiveAnchor(route,candidate,'NORMAL',101)).toBeNull();
 expect(buildLiveAnchor(route,fit,'LIMITED',101)).toBeNull();
 expect(buildLiveAnchor(route,fit,'NORMAL',2101)).toBeNull();
});
