import {expect,it} from 'vitest';
import {PerspectiveCamera} from 'three';
import {GuidanceRuntime} from '../src/guidance-runtime';
import {settings} from '../src/settings';
import type {RouteBundle} from '../src/route-bundle';

function fixture(){
 const camera=new PerspectiveCamera(60,1,0.01,1000);
 const frame={position:[0,0,-1.2],rotation:[0,0,0,1],projection:camera.projectionMatrix.toArray()};
 const keyframes=[0,1].map(i=>({id:`kf${i}`,image:`frames/kf${i}.png`,width:500,height:500,
  intrinsics:[433,0,250,0,433,250,0,0,1],position:[i,0,-2-i],rotation:[0,0,0,1]}));
 const route:RouteBundle={schemaVersion:1,routeId:'route-a',configSha256:'a'.repeat(64),source:'captured',units:'metres',scaleVerified:true,
  privacy:{capturePermitted:true,imagesReviewed:true},keyframes,
  path:keyframes.map(k=>({position:k.position,keyframeId:k.id})),destination:{pathIndex:1,keyframeId:'kf1'}};
 const anchor={accepted:true,ambiguous:false,opencvVersion:'5.0.0',routeId:'route-a',sourceFrameAtPhoneMs:100,
  metricScaleVerified:true,navigationReady:true,arrowAuthorized:true,mode:'marker-vio' as const,
  fieldGatePassed:true,startTrackerPosition:[...frame.position],estimatedDriftBoundM:0.1,
  routeToSession:{direction:'map-to-session',scale:1,rotation:[1,0,0,0,1,0,0,0,1],translation:[0,0,0]}};
 return {route,anchor,frame};
}

it('feeds the live camera arrow only while tracking and geometry are current',()=>{
 const {route,anchor,frame}=fixture(),guidance=new GuidanceRuntime();
 expect(guidance.read(frame,'NORMAL',101,100,500,500)).toBeNull();
 guidance.install(route,anchor,0);
 expect(guidance.read(frame,'NORMAL',101,100,500,500)?.arrowAuthorized).toBe(true);
 expect(guidance.read(frame,'LIMITED',102,101,500,500)).toBeNull();
 expect(guidance.read(frame,'NORMAL',103,102,500,500)).toBeNull();
 guidance.install(route,anchor,0);
 const later=101+settings.VERIFY_MAX_GEOMETRY_AGE_MS+1;
 expect(guidance.read(frame,'NORMAL',later,later-1,500,500)).not.toBeNull();
 expect(guidance.read(frame,'NORMAL',later+settings.MARKER_MAX_AGE_MS+2,later,500,500)).toBeNull();
 expect(guidance.read(frame,'NORMAL',102,101,500,500)).toBeNull();
});

it('refuses unverified routes and a mismatched anchor',()=>{
 const {route,anchor,frame}=fixture(),guidance=new GuidanceRuntime();
 guidance.install(route,anchor,0);
 expect(guidance.read(frame,'NORMAL',101,100,500,500)).not.toBeNull();
 expect(()=>guidance.install({...route,scaleVerified:false,units:'tracker'},anchor,0)).toThrow();
 expect(guidance.read(frame,'NORMAL',101,100,500,500)).toBeNull();
 guidance.install(route,anchor,0);
 expect(()=>guidance.install(route,{...anchor,routeId:'elsewhere'},0)).toThrow();
 expect(guidance.read(frame,'NORMAL',101,100,500,500)).toBeNull();
});

it('reports visitor guidance honestly on the live camera',()=>{
 const {route,anchor,frame}=fixture(),guidance=new GuidanceRuntime();
 expect(guidance.status).toBe('awaiting-verification');
 expect(guidance.read(frame,'NORMAL',101,100,500,500)).toBeNull();
 expect(guidance.status).toBe('awaiting-verification');
 guidance.install(route,anchor,0);
 expect(guidance.read(frame,'NORMAL',101,100,500,500)).not.toBeNull();
 expect(guidance.status).toBe('following');
 expect(guidance.read(frame,'LIMITED',102,101,500,500)).toBeNull();
 expect(guidance.status).toBe('paused');
 expect(guidance.read(frame,'NORMAL',103,102,500,500)).toBeNull();
 expect(guidance.status).toBe('paused');
});

it('advances a verified live arrow along adjacent segments and clears it off route',()=>{
 const {route,anchor,frame}=fixture(),guidance=new GuidanceRuntime();
 const extended={...route,keyframes:[...route.keyframes,{...route.keyframes[1],id:'kf2',image:'frames/kf2.png',position:[2,0,-4]}],
  path:[...route.path,{position:[2,0,-4],keyframeId:'kf2'}],destination:{pathIndex:2,keyframeId:'kf2'}};
 guidance.install(extended,anchor,0);
 expect(guidance.read(frame,'NORMAL',101,100,500,500)).not.toBeNull();
 expect(guidance.segmentIndex).toBe(0);
 guidance.read({...frame,position:[0.4,0,-2]},'NORMAL',101.5,101,500,500);
 const nearTurn={...frame,position:[0.8,0,-2.8]};
 guidance.read(nearTurn,'NORMAL',102,101,500,500);
 expect(guidance.segmentIndex).toBe(1);
 expect(guidance.read({...frame,position:[10,0,-3]},'NORMAL',103,102,500,500)).toBeNull();
 expect(guidance.status).toBe('paused');
});

it('uses one calibrated start plus fresh NORMAL VIO instead of expiring after 1.5 seconds',()=>{
 const {route,anchor,frame}=fixture(),guidance=new GuidanceRuntime();
 const marker={...anchor,mode:'marker-vio' as const,fieldGatePassed:true,
  startTrackerPosition:[...frame.position],estimatedDriftBoundM:0.1};
 guidance.install(route,marker,0);
 expect(guidance.read(frame,'NORMAL',100+settings.VERIFY_MAX_GEOMETRY_AGE_MS+1000,
  100+settings.VERIFY_MAX_GEOMETRY_AGE_MS+999,500,500)).not.toBeNull();
 expect(guidance.read(frame,'LIMITED',3000,2999,500,500)).toBeNull();
 expect(guidance.status).toBe('paused');
 expect(()=>guidance.install(route,{...marker,fieldGatePassed:false},0)).toThrow();
 expect(guidance.read(frame,'NORMAL',3001,3000,500,500)).toBeNull();
});

it('accepts a private metric path with matching live geometry while field accuracy remains unmeasured',()=>{
 const {anchor,frame}=fixture(),guidance=new GuidanceRuntime();
 const candidate={routeId:'route-a',sourceCaptureSha256:'b'.repeat(64),configSha256:'a'.repeat(64),
  units:'metres' as const,markerObservationCount:5,expiresAtMs:10000,
  path:[{keyframeId:'kf0',position:[0,0,-2]},{keyframeId:'kf1',position:[1,0,-3]}],
  destination:{pathIndex:1,keyframeId:'kf1'},scaleVerified:false as const,
  navigationReady:false as const,arrowAuthorized:false as const};
 const proof={...anchor,mode:'marker-vio' as const,fieldGatePassed:true,
  sourceCaptureSha256:candidate.sourceCaptureSha256,configSha256:candidate.configSha256,
  startTrackerPosition:[...frame.position],estimatedDriftBoundM:0.1};
 expect(()=>guidance.installMarkerPath(candidate,{...proof,fieldGatePassed:false,arrowAuthorized:false},0)).toThrow();
 expect(()=>guidance.installMarkerPath(candidate,{...proof,sourceCaptureSha256:'c'.repeat(64)},0)).toThrow();
 guidance.installMarkerPath(candidate,{...proof,fieldGatePassed:false},0);
 expect(guidance.read(frame,'NORMAL',2500,2499,500,500)).not.toBeNull();
 expect(guidance.segmentIndex).toBe(0);
});
