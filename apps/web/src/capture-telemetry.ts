import type {CameraFrame} from './display';

export function serializeSdkCall(method:'configure'|'updateCameraProjectionMatrix'|'run',args:Record<string,unknown>,calledAtMs:number,runAtMs:number){
 return {kind:'sdk',label:JSON.stringify({method,args}),values:[calledAtMs,Number.isFinite(runAtMs)?calledAtMs-runAtMs:-1]};
}

export function medianWorldPointDepth(points:unknown,camera:Pick<CameraFrame,'position'|'rotation'>){
 if(!Array.isArray(points))return {count:0,validDepthCount:0,medianDepth:null};
 const [qx,qy,qz,qw]=camera.rotation;
 // Camera forward is local -Z. Rotate it into the world using the GL quaternion.
 const forward=[-2*(qx*qz+qw*qy),-2*(qy*qz-qw*qx),-(1-2*(qx*qx+qy*qy))];
 const depths:number[]=[];
 for(const item of points){
  const p=item?.position;if(!p||![p.x,p.y,p.z].every(Number.isFinite))continue;
  const depth=forward[0]*(p.x-camera.position[0])+forward[1]*(p.y-camera.position[1])+forward[2]*(p.z-camera.position[2]);
  if(Number.isFinite(depth)&&depth>0)depths.push(depth);
 }
 depths.sort((a,b)=>a-b);
 const n=depths.length;
 return {count:points.length,validDepthCount:n,medianDepth:n?((depths[(n-1)>>1]+depths[n>>1])/2):null};
}
