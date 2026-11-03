/** Short-lived local candidate shares. A token never authorizes navigation. */
import {randomBytes} from 'node:crypto';
import {mkdir,readFile,writeFile,unlink} from 'node:fs/promises';
import {join} from 'node:path';

type Candidate={accepted:boolean;sourceCaptureSha256:string;configSha256:string;
 routeId:string;units:string;markerObservationCount:number;
 path:{keyframeId:string;position:number[]}[];
 destination:{pathIndex:number;keyframeId:string};
 scaleVerified:boolean;navigationReady:boolean;arrowAuthorized:boolean};
const digest=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const tokenOk=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{48}$/.test(v);
function validated(input:Candidate){
 if(!input||input.accepted!==true||!digest(input.sourceCaptureSha256)||
  !digest(input.configSha256)||typeof input.routeId!=='string'||
  !/^[a-zA-Z0-9_-]+$/.test(input.routeId)||input.units!=='metres'||
  input.scaleVerified!==false||input.navigationReady!==false||input.arrowAuthorized!==false||
  !Number.isSafeInteger(input.markerObservationCount)||input.markerObservationCount<1||
  !Array.isArray(input.path)||input.path.length<2||input.path.length>60||
  input.path.some(p=>!p||typeof p.keyframeId!=='string'||!/^[a-zA-Z0-9_-]+$/.test(p.keyframeId)||
   !Array.isArray(p.position)||p.position.length!==3||!p.position.every(Number.isFinite))||
  !input.destination||input.destination.pathIndex!==input.path.length-1||
  input.destination.keyframeId!==input.path.at(-1)?.keyframeId)throw Error('Unverified or invalid route candidate');
 return {routeId:input.routeId,sourceCaptureSha256:input.sourceCaptureSha256,
  configSha256:input.configSha256,units:'metres' as const,
  markerObservationCount:input.markerObservationCount,
  path:input.path.map(p=>({keyframeId:p.keyframeId,position:[...p.position]})),
  destination:{...input.destination},scaleVerified:false as const,
  navigationReady:false as const,arrowAuthorized:false as const};
}
export async function createPrivateRouteShare(directory:string,input:Candidate,nowMs:number,ttlMs:number){
 const route=validated(input);
 if(!Number.isSafeInteger(nowMs)||!Number.isSafeInteger(ttlMs)||ttlMs<=0)throw Error('Invalid expiry');
 const token=randomBytes(24).toString('hex'),expiresAtMs=nowMs+ttlMs;
 await mkdir(directory,{recursive:true});
 await writeFile(join(directory,`route-share-${token}.json`),JSON.stringify({...route,expiresAtMs}),{flag:'wx'});
 return {token,expiresAtMs,routeId:route.routeId};
}
export async function readPrivateRouteShare(directory:string,token:string,nowMs:number){
 if(!tokenOk(token)||!Number.isSafeInteger(nowMs))return null;
 try{
  const route=JSON.parse(await readFile(join(directory,`route-share-${token}.json`),'utf8'));
  if(!Number.isSafeInteger(route.expiresAtMs)||nowMs>route.expiresAtMs)return null;
  const {expiresAtMs,...candidate}=route;
  return {...validated({...candidate,accepted:true}),expiresAtMs};
 }catch{return null;}
}
export async function revokePrivateRouteShare(directory:string,token:string){
 if(!tokenOk(token))throw Error('Invalid route token');
 try{await unlink(join(directory,`route-share-${token}.json`));}
 catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
}
export function makeVisitorUrl(baseUrl:string,token:string){
 if(!tokenOk(token))throw Error('Invalid route token');
 const url=new URL(baseUrl);
 if(url.protocol!=='https:'||url.pathname!=='/live.html'||!url.hash.startsWith('#key='))
  throw Error('Protected HTTPS phone link required');
 url.searchParams.set('route',token);
 return url.toString();
}
