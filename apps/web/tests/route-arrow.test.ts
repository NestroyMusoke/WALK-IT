import {expect,it} from 'vitest';
import {PerspectiveCamera} from 'three';
import {selectRouteArrow,isAuthorizedRouteArrow} from '../src/route-arrow';
import {settings} from '../src/settings';
import type {RouteBundle} from '../src/route-bundle';

function fixture(){
 const camera=new PerspectiveCamera(60,1,0.01,1000);
 const frame={position:[0,0,0],rotation:[0,0,0,1],projection:camera.projectionMatrix.toArray()};
 const keyframes=[0,1].map(i=>({id:`kf${i}`,image:`frames/kf${i}.png`,width:100,height:100,
  intrinsics:[86.6,0,50,0,86.6,50,0,0,1],position:[i,0,-2-i],rotation:[0,0,0,1]}));
 const route:RouteBundle={schemaVersion:1,routeId:'route-a',configSha256:'a'.repeat(64),source:'captured',units:'metres',scaleVerified:true,
  privacy:{capturePermitted:true,imagesReviewed:true},keyframes,
  path:keyframes.map(k=>({position:k.position,keyframeId:k.id})),destination:{pathIndex:1,keyframeId:'kf1'}};
 const anchor={accepted:true,ambiguous:false,opencvVersion:'5.0.0',routeId:'route-a',sourceFrameAtPhoneMs:100,
  metricScaleVerified:true,navigationReady:true,arrowAuthorized:true,
  routeToSession:{direction:'map-to-session',scale:1,rotation:[1,0,0,0,1,0,0,0,1],translation:[0,0,0]}};
 return {route,anchor,frame,nowMs:101,frameMs:100,trackingStatus:'NORMAL',pathIndex:0,cssWidth:500,cssHeight:500};
}

it('selects a camera-canvas arrow that points along the projected route',()=>{
 const input=fixture();const arrow=selectRouteArrow(input);
 expect(arrow).not.toBeNull();
 expect(arrow!.worldPoint).toEqual([.5,0,-2.5]);
 expect(arrow!.angleRad).toBeCloseTo(0,4);
 expect(arrow!.arrowAuthorized).toBe(true);
 expect(isAuthorizedRouteArrow(arrow)).toBe(true);
 expect(isAuthorizedRouteArrow({...arrow})).toBe(true);
 expect(isAuthorizedRouteArrow({worldPoint:[0,0,-2],angleRad:0,arrowAuthorized:true})).toBe(false);
});

it('hides the arrow for stale, lost, ambiguous, wrong-route and nonmetric evidence',()=>{
 const input=fixture();
 for(const change of [
  {trackingStatus:'LIMITED'},
  {nowMs:100+settings.VERIFY_MAX_GEOMETRY_AGE_MS+1},
  {frameMs:100-settings.MARKER_MAX_AGE_MS-1},
  {anchor:{...input.anchor,ambiguous:true}},
  {anchor:{...input.anchor,routeId:'different'}},
  {anchor:{...input.anchor,opencvVersion:'4.12.0'}},
  {anchor:{...input.anchor,arrowAuthorized:false}},
  {anchor:{...input.anchor,sourceFrameAtPhoneMs:100-settings.VERIFY_MAX_GEOMETRY_AGE_MS-1}},
  {route:{...input.route,scaleVerified:false,units:'tracker' as const}},
  {pathIndex:1},
 ])expect(selectRouteArrow({...input,...change})).toBeNull();
});

it('hides an arrow with an invalid transform or a point behind the camera',()=>{
 const input=fixture();
 expect(selectRouteArrow({...input,anchor:{...input.anchor,routeToSession:{...input.anchor.routeToSession,scale:0}}})).toBeNull();
 expect(selectRouteArrow({...input,anchor:{...input.anchor,routeToSession:{...input.anchor.routeToSession,rotation:undefined as unknown as number[]}}})).toBeNull();
 const route={...input.route,path:input.route.path.map(p=>({...p,position:p.position.map((v,i)=>i===2?-v:v)}))};
 expect(selectRouteArrow({...input,route})).toBeNull();
});
