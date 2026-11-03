export type VisitorRoute={routeId:string;sourceCaptureSha256:string;configSha256:string;
 units:'metres';markerObservationCount:number;
 path:{keyframeId:string;position:number[]}[];
 destination:{pathIndex:number;keyframeId:string};expiresAtMs:number;
 scaleVerified:false;navigationReady:false;arrowAuthorized:false};
const sha=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const token=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{48}$/.test(v);
export function routeTokenFromSearch(search:string){
 const value=new URLSearchParams(search).get('route');
 if(!token(value))throw Error('Missing or invalid private route token');
 return value as string;
}
export function parseVisitorRoute(value:unknown,nowMs:number):VisitorRoute{
 const v=value as VisitorRoute;
 if(!v||typeof v.routeId!=='string'||!/^[a-zA-Z0-9_-]+$/.test(v.routeId)||
  !sha(v.sourceCaptureSha256)||!sha(v.configSha256)||v.units!=='metres'||
  !Number.isSafeInteger(v.markerObservationCount)||v.markerObservationCount<1||
  !Number.isSafeInteger(v.expiresAtMs)||!Number.isSafeInteger(nowMs)||nowMs>v.expiresAtMs||
  v.scaleVerified!==false||v.navigationReady!==false||v.arrowAuthorized!==false||
  !Array.isArray(v.path)||v.path.length<2||v.path.length>60||
  v.path.some(p=>!p||typeof p.keyframeId!=='string'||!/^[a-zA-Z0-9_-]+$/.test(p.keyframeId)||
   !Array.isArray(p.position)||p.position.length!==3||!p.position.every(Number.isFinite))||
  !v.destination||v.destination.pathIndex!==v.path.length-1||
  v.destination.keyframeId!==v.path.at(-1)?.keyframeId)throw Error('Route unavailable or unverified');
 return v;
}
export async function loadVisitorRoute(search:string,nowMs:number){
 const routeToken=routeTokenFromSearch(search);
 const response=await fetch(`/__walkit/route/${routeToken}`,{cache:'no-store'});
 if(!response.ok)throw Error('Private route expired or unavailable');
 return parseVisitorRoute(await response.json(),nowMs);
}
