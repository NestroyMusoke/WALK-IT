import {settings} from './settings';

type Transform={direction:string;scale:number;rotation:number[];translation:number[]};
type Progress={accepted:boolean;reason:string;pathIndex:number;offRouteM?:number};
const dot=(a:number[],b:number[])=>a.reduce((sum,v,i)=>sum+v*b[i],0);
const subtract=(a:number[],b:number[])=>a.map((v,i)=>v-b[i]);
const distance=(a:number[],b:number[])=>Math.hypot(...subtract(a,b));

function segmentDistance(point:number[],a:number[],b:number[]){
 const delta=subtract(b,a),extent=dot(delta,delta);
 if(extent<=0)return distance(point,a);
 const t=Math.max(0,Math.min(1,dot(subtract(point,a),delta)/extent));
 return distance(point,a.map((v,i)=>v+t*delta[i]));
}

/** Candidate progress only. Callers must independently enforce live geometry and tracking gates. */
export function routeProgress(path:number[][],transform:Transform,sessionPosition:number[],pathIndex:number):Progress{
 const refuse=(reason:string):Progress=>({accepted:false,reason,pathIndex});
 if(!Array.isArray(path)||path.length<2||path.some(p=>!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite))||
  !Number.isSafeInteger(pathIndex)||pathIndex<0||pathIndex>=path.length-1||
  !Array.isArray(sessionPosition)||sessionPosition.length!==3||!sessionPosition.every(Number.isFinite)||
  !transform||transform.direction!=='map-to-session'||!Number.isFinite(transform.scale)||transform.scale<=0||
  !Array.isArray(transform.rotation)||transform.rotation.length!==9||!transform.rotation.every(Number.isFinite)||
  !Array.isArray(transform.translation)||transform.translation.length!==3||!transform.translation.every(Number.isFinite))return refuse('invalid-route-or-pose');
 const r=transform.rotation,t=transform.translation,scaled=subtract(sessionPosition,t).map(v=>v/transform.scale);
 const point=[r[0]*scaled[0]+r[3]*scaled[1]+r[6]*scaled[2],
              r[1]*scaled[0]+r[4]*scaled[1]+r[7]*scaled[2],
              r[2]*scaled[0]+r[5]*scaled[1]+r[8]*scaled[2]];
 const current=segmentDistance(point,path[pathIndex],path[pathIndex+1]);
 const next=pathIndex+2<path.length?segmentDistance(point,path[pathIndex+1],path[pathIndex+2]):Infinity;
 const best=Math.min(current,next);
 if(best>settings.ROUTE_PROGRESS_MAX_OFFROUTE_M)return {...refuse('off-route'),offRouteM:best};
 for(let i=0;i<path.length-1;i++){
  if(i===pathIndex||i===pathIndex+1)continue;
  if(segmentDistance(point,path[i],path[i+1])<=best+settings.ROUTE_PROGRESS_AMBIGUITY_MARGIN_M)
   return {...refuse('ambiguous-crossing'),offRouteM:best};
 }
 const advance=next<Infinity&&distance(point,path[pathIndex+1])<=settings.ROUTE_PROGRESS_ADVANCE_RADIUS_M;
 return {accepted:true,reason:advance?'adjacent-waypoint':'current-segment',
  pathIndex:advance?pathIndex+1:pathIndex,offRouteM:best};
}
