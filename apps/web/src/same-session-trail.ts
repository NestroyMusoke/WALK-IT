import {projectReference,type CameraFrame,type WorldPoint} from './display';
import {settings} from './settings';

export type SameSessionReplayArrow={mode:'same-session-live-replay';worldPoint:WorldPoint;angleRad:number};

/** Position-only diagnostic path. It never creates a route certificate or stores images. */
export class SameSessionTrail{
 private points:WorldPoint[]=[];
 private recording=false;
 private ready=false;
 private lastSampleAt=-Infinity;
 private progress=0;
 get count(){return this.points.length;}
 get isRecording(){return this.recording;}
 get isReady(){return this.ready;}
 begin(){this.points=[];this.recording=true;this.ready=false;this.lastSampleAt=-Infinity;this.progress=0;}
 add(position:number[],atMs:number){
  if(!this.recording||!Array.isArray(position)||position.length!==3||!position.every(Number.isFinite)||
   !Number.isFinite(atMs)||atMs-this.lastSampleAt<settings.HOST_KEYFRAME_INTERVAL_MS)return false;
  this.points.push([...position] as WorldPoint);this.lastSampleAt=atMs;return true;
 }
 finish(){this.recording=false;this.ready=this.points.length>=2;return this.ready;}
 clear(){this.points=[];this.recording=false;this.ready=false;this.progress=0;}
 read(frame:CameraFrame,trackingStatus:string,nowMs:number,frameMs:number,cssWidth:number,cssHeight:number):SameSessionReplayArrow|null{
  if(!this.ready||trackingStatus!=='NORMAL'||!Number.isFinite(nowMs)||!Number.isFinite(frameMs)||
   nowMs-frameMs<0||nowMs-frameMs>settings.MARKER_MAX_AGE_MS)return null;
  const distance=(p:WorldPoint)=>Math.hypot(...p.map((v,i)=>v-frame.position[i]));
  let nearest=this.progress;
  for(let i=this.progress+1;i<this.points.length-1;i++)if(distance(this.points[i])<distance(this.points[nearest]))nearest=i;
  this.progress=nearest;
  const a=this.points[nearest],b=this.points[nearest+1];if(!b)return null;
  const middle=a.map((v,i)=>(v+b[i])/2) as WorldPoint;
  const screenA=projectReference(middle,frame,cssWidth,cssHeight),screenB=projectReference(b,frame,cssWidth,cssHeight);
  if(!screenA||!screenB)return null;
  const dx=screenB.x-screenA.x,dy=screenB.y-screenA.y;
  if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.hypot(dx,dy)===0)return null;
  return {mode:'same-session-live-replay',worldPoint:middle,angleRad:Math.atan2(dy,dx)};
 }
}
