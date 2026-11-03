import {PerspectiveCamera} from 'three';
import {selectRouteArrow} from './route-arrow';
import {ReferenceRenderer} from './reference-renderer';
import {runArrowRasterCheck} from './display-check';
import type {RouteBundle} from './route-bundle';

const canvas=document.getElementById('arrow-canvas') as HTMLCanvasElement;
const status=document.getElementById('arrow-result')!;
try{
 const camera=new PerspectiveCamera(60,1,0.01,1000);
 const frame={position:[0,0,0],rotation:[0,0,0,1],projection:camera.projectionMatrix.toArray()};
 const keyframes=[0,1].map(i=>({id:`kf${i}`,image:`frames/kf${i}.png`,width:500,height:500,
  intrinsics:[433,0,250,0,433,250,0,0,1],position:[i,0,-2-i],rotation:[0,0,0,1]}));
 const route:RouteBundle={schemaVersion:1,routeId:'synthetic-route',configSha256:'a'.repeat(64),source:'captured',units:'metres',scaleVerified:true,
  privacy:{capturePermitted:true,imagesReviewed:true},keyframes,
  path:keyframes.map(k=>({position:k.position,keyframeId:k.id})),destination:{pathIndex:1,keyframeId:'kf1'}};
 const arrow=selectRouteArrow({route,anchor:{accepted:true,ambiguous:false,opencvVersion:'5.0.0',routeId:route.routeId,sourceFrameAtPhoneMs:100,
  metricScaleVerified:true,navigationReady:true,arrowAuthorized:true,mode:'marker-vio',fieldGatePassed:true,
  startTrackerPosition:[0,0,0],estimatedDriftBoundM:0.1,
  routeToSession:{direction:'map-to-session',scale:1,rotation:[1,0,0,0,1,0,0,0,1],translation:[0,0,0]}},
  frame,nowMs:101,frameMs:100,trackingStatus:'NORMAL',pathIndex:0,cssWidth:500,cssHeight:500});
 if(!arrow)throw Error('Synthetic route arrow refused');
 const check=runArrowRasterCheck(arrow,frame);
 const renderer=new ReferenceRenderer(canvas);renderer.draw(null,frame,500,500,1,true,arrow);
 status.textContent=JSON.stringify(check,null,2);
}catch(error){status.textContent=`Arrow raster failed: ${(error as Error).message}`;}
