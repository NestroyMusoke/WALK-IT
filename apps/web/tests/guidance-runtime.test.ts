import {expect,it} from 'vitest';
import {PerspectiveCamera} from 'three';
import {GuidanceRuntime} from '../src/guidance-runtime';
import {settings} from '../src/settings';
import type {RouteBundle} from '../src/route-bundle';

function fixture(){
 const camera=new PerspectiveCamera(60,1,0.01,1000);
 const frame={position:[0,0,0],rotation:[0,0,0,1],projection:camera.projectionMatrix.toArray()};
 const keyframes=[0,1].map(i=>({id:`kf${i}`,image:`frames/kf${i}.png`,width:500,height:500,
  intrinsics:[433,0,250,0,433,250,0,0,1],position:[i,0,-2-i],rotation:[0,0,0,1]}));
 const route:RouteBundle={schemaVersion:1,routeId:'route-a',configSha256:'a'.repeat(64),source:'captured',units:'metres',scaleVerified:true,
  privacy:{capturePermitted:true,imagesReviewed:true},keyframes,
  path:keyframes.map(k=>({position:k.position,keyframeId:k.id})),destination:{pathIndex:1,keyframeId:'kf1'}};
 const anchor={accepted:true,ambiguous:false,opencvVersion:'5.0.0',routeId:'route-a',sourceFrameAtPhoneMs:100,
  metricScaleVerified:true,navigationReady:true,arrowAuthorized:true,
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
 expect(guidance.read(frame,'NORMAL',101+settings.VERIFY_MAX_GEOMETRY_AGE_MS+1,100,500,500)).toBeNull();
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
