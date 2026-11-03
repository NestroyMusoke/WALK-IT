import {validateRouteBundle} from './route-bundle';
import type {CameraFrame} from './display';
import {settings} from './settings';

export type ReplayFrame={id:string;videoTime:number;receivedAtMs:number;imageUrl:string;
 width:number;height:number;frame:CameraFrame};
export type ReplayCapture={purpose:'author-route'|'visitor-start-scan';routeId:string;
 configSha256:string;frames:ReplayFrame[];anchorAuthorized:false};

function record(value:unknown):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid replay capture');
 return value as Record<string,unknown>;
}
function pngDimensions(encoded:string){
 if(!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))throw Error('Invalid PNG encoding');
 let binary:string;
 try{binary=atob(encoded);}catch{throw Error('Invalid PNG encoding');}
 if(btoa(binary)!==encoded||binary.length<33||binary.slice(0,8)!=='\x89PNG\r\n\x1a\n'||binary.slice(12,16)!=='IHDR')throw Error('Invalid PNG header');
 const dimension=(at:number)=>((binary.charCodeAt(at)*2**24)+(binary.charCodeAt(at+1)<<16)+(binary.charCodeAt(at+2)<<8)+binary.charCodeAt(at+3));
 return {width:dimension(16),height:dimension(20)};
}
/** OpenGL projection in Three.js column-major order from saved image K. */
export function projectionFromIntrinsics(k:number[],width:number,height:number){
 if(k.length!==9||![...k,width,height].every(Number.isFinite)||width<=0||height<=0||
  k[0]<=0||k[4]<=0||k[1]!==0||k[3]!==0||k[6]!==0||k[7]!==0||k[8]!==1)throw Error('Invalid replay calibration');
 const near=settings.NEAR_CLIP_M,far=settings.FAR_CLIP_M;
 return [2*k[0]/width,0,0,0,0,2*k[4]/height,0,0,
  1-2*k[2]/width,2*k[5]/height-1,-(far+near)/(far-near),-1,
  0,0,-2*far*near/(far-near),0];
}
/** Local-only playback input. A recording itself never grants a navigation anchor. */
export function parseReplayCapture(value:unknown):ReplayCapture{
 const outer=record(value);
 if('schemaVersion' in outer){
  if(outer.schemaVersion!==2)throw Error('Unsupported backup envelope');
  value=outer.capture;
 }
 const capture=record(value),purpose=capture.purpose??'author-route';
 if(purpose!=='author-route'&&purpose!=='visitor-start-scan')throw Error('Invalid replay purpose');
 const route=validateRouteBundle(capture.manifest);
 if(route.source!=='captured'||route.units!=='tracker'||route.scaleVerified!==false||
  route.privacy.capturePermitted!==true||route.privacy.imagesReviewed!==true)throw Error('Unreviewed capture');
 if(!Array.isArray(capture.images)||!Array.isArray(capture.timing)||
  capture.images.length!==route.keyframes.length||capture.timing.length!==route.keyframes.length||
  route.keyframes.length>settings.HOST_MAX_KEYFRAMES_COUNT)throw Error('Incomplete capture');
 if(purpose==='visitor-start-scan'&&route.keyframes.length<settings.START_MAP_FRAME_CAPACITY_COUNT)throw Error('Incomplete visitor scan');
 let lastReceived=-Infinity,lastVideo=-Infinity;
 const frames=route.keyframes.map((keyframe,i)=>{
  const image=record((capture.images as unknown[])[i]),timing=record((capture.timing as unknown[])[i]);
  if(image.id!==keyframe.id||timing.id!==keyframe.id||
   typeof image.png!=='string'||typeof timing.receivedAtMs!=='number'||typeof timing.videoTime!=='number'||
   !Number.isFinite(timing.receivedAtMs)||!Number.isFinite(timing.videoTime)||
   timing.receivedAtMs<0||timing.receivedAtMs<=lastReceived||timing.videoTime<=lastVideo||
   keyframe.width>settings.HOST_IMAGE_MAX_EDGE_PX||keyframe.height>settings.HOST_IMAGE_MAX_EDGE_PX)throw Error('Unpaired replay frame');
  const dimensions=pngDimensions(image.png);
  if(dimensions.width!==keyframe.width||dimensions.height!==keyframe.height)throw Error('PNG calibration mismatch');
  lastReceived=timing.receivedAtMs;lastVideo=timing.videoTime;
  return {id:keyframe.id,videoTime:timing.videoTime,receivedAtMs:timing.receivedAtMs,
   imageUrl:`data:image/png;base64,${image.png}`,width:keyframe.width,height:keyframe.height,
   frame:{position:keyframe.position,rotation:keyframe.rotation,
    projection:projectionFromIntrinsics(keyframe.intrinsics,keyframe.width,keyframe.height)}};
 });
 return {purpose,routeId:route.routeId,configSha256:route.configSha256,frames,anchorAuthorized:false};
}
