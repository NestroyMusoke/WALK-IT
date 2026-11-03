import {projectReference,type CameraFrame,type WorldPoint} from './display';
import {validateRouteBundle,type RouteBundle} from './route-bundle';
import {settings} from './settings';

type Transform={direction:string;scale:number;rotation:number[];translation:number[]};
export type VerifiedAnchor={accepted:boolean;ambiguous:boolean;opencvVersion:string;routeId:string;sourceFrameAtPhoneMs:number;
 metricScaleVerified:boolean;navigationReady:boolean;arrowAuthorized:boolean;routeToSession:Transform;
 mode:'marker-vio';fieldGatePassed:boolean;startTrackerPosition:number[];estimatedDriftBoundM:number;
 sourceCaptureSha256?:string;configSha256?:string};
export type MetricPath={source:'captured';units:'metres';scaleVerified:true;routeId:string;configSha256:string;
 path:{position:number[];keyframeId:string}[];destination:{pathIndex:number;keyframeId:string}};
type ArrowInput={route:RouteBundle|MetricPath;anchor:VerifiedAnchor;frame:CameraFrame;nowMs:number;frameMs:number;
 trackingStatus:string;pathIndex:number;cssWidth:number;cssHeight:number};
const authorizedArrow=Symbol('verified-route-arrow');
export type AuthorizedRouteArrow={worldPoint:WorldPoint;angleRad:number;arrowAuthorized:true;routeId:string;sourceFrameAtPhoneMs:number;[authorizedArrow]:true};
export function isAuthorizedRouteArrow(value:unknown):value is AuthorizedRouteArrow{
 return Boolean(value&&typeof value==='object'&&(value as AuthorizedRouteArrow)[authorizedArrow]===true);
}

function validTransform(t:Transform){
 if(t.direction!=='map-to-session'||!Number.isFinite(t.scale)||t.scale<=0||
  !Array.isArray(t.rotation)||t.rotation.length!==9||!Array.isArray(t.translation)||t.translation.length!==3||
  ![...t.rotation,...t.translation].every(Number.isFinite))return false;
 const r=t.rotation,tolerance=settings.QUATERNION_NORM_TOLERANCE;
 const columns=[[r[0],r[3],r[6]],[r[1],r[4],r[7]],[r[2],r[5],r[8]]];
 const dot=(a:number[],b:number[])=>a.reduce((sum,v,i)=>sum+v*b[i],0);
 if(columns.some(c=>Math.abs(dot(c,c)-1)>tolerance))return false;
 if(Math.abs(dot(columns[0],columns[1]))>tolerance||Math.abs(dot(columns[0],columns[2]))>tolerance||Math.abs(dot(columns[1],columns[2]))>tolerance)return false;
 const determinant=r[0]*(r[4]*r[8]-r[5]*r[7])-r[1]*(r[3]*r[8]-r[5]*r[6])+r[2]*(r[3]*r[7]-r[4]*r[6]);
 return Math.abs(determinant-1)<=tolerance;
}

function transform(point:number[],t:Transform):WorldPoint{
 const r=t.rotation;
 return [
  t.scale*(r[0]*point[0]+r[1]*point[1]+r[2]*point[2])+t.translation[0],
  t.scale*(r[3]*point[0]+r[4]*point[1]+r[5]*point[2])+t.translation[1],
  t.scale*(r[6]*point[0]+r[7]*point[1]+r[8]*point[2])+t.translation[2],
 ];
}
function validMetricPath(value:MetricPath){
 return value?.source==='captured'&&value.units==='metres'&&value.scaleVerified===true&&
  /^[a-zA-Z0-9_-]+$/.test(value.routeId)&&/^[a-f0-9]{64}$/.test(value.configSha256)&&
  Array.isArray(value.path)&&value.path.length>=2&&value.path.every(p=>
   /^[a-zA-Z0-9_-]+$/.test(p.keyframeId)&&Array.isArray(p.position)&&
   p.position.length===3&&p.position.every(Number.isFinite))&&
  value.destination?.pathIndex===value.path.length-1&&
  value.destination?.keyframeId===value.path.at(-1)?.keyframeId;
}

/** Selects one world-locked camera arrow. All evidence is required on each frame. */
export function selectRouteArrow(input:ArrowInput):AuthorizedRouteArrow|null{
 const {anchor,frame,nowMs,frameMs,trackingStatus,pathIndex,cssWidth,cssHeight}=input;
 if(trackingStatus!=='NORMAL'||!Number.isFinite(nowMs)||!Number.isFinite(frameMs)||
  nowMs-frameMs<0||nowMs-frameMs>settings.MARKER_MAX_AGE_MS||
  !anchor||anchor.accepted!==true||anchor.ambiguous!==false||
  anchor.navigationReady!==true||anchor.metricScaleVerified!==true||anchor.arrowAuthorized!==true||
  !/^5\./.test(anchor.opencvVersion)||!Number.isFinite(anchor.sourceFrameAtPhoneMs)||
  nowMs-anchor.sourceFrameAtPhoneMs<0||
  anchor.mode!=='marker-vio'||
  !Number.isFinite(anchor.estimatedDriftBoundM)||anchor.estimatedDriftBoundM<0||
  anchor.estimatedDriftBoundM>settings.VIO_DRIFT_BUDGET_M||
  !anchor.routeToSession||!validTransform(anchor.routeToSession))return null;
 let route:RouteBundle|MetricPath;
 if('keyframes' in input.route){try{route=validateRouteBundle(input.route);}catch{return null;}}
 else{if(!validMetricPath(input.route))return null;route=input.route;}
 if(route.source!=='captured'||route.units!=='metres'||route.scaleVerified!==true||route.routeId!==anchor.routeId||
  !Number.isSafeInteger(pathIndex)||pathIndex<0||pathIndex+1>=route.path.length)return null;
 const first=route.path[pathIndex].position,second=route.path[pathIndex+1].position;
 const centre=transform(first.map((v,i)=>(v+second[i])/2),anchor.routeToSession);
 const ahead=transform(second,anchor.routeToSession);
 const startScreen=projectReference(centre,frame,cssWidth,cssHeight);
 const endScreen=projectReference(ahead,frame,cssWidth,cssHeight);
 if(!startScreen||!endScreen)return null;
 const dx=endScreen.x-startScreen.x,dy=endScreen.y-startScreen.y;
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.hypot(dx,dy)===0)return null;
 return {worldPoint:centre,angleRad:Math.atan2(dy,dx),arrowAuthorized:true,routeId:route.routeId,sourceFrameAtPhoneMs:anchor.sourceFrameAtPhoneMs,[authorizedArrow]:true};
}
