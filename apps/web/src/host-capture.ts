import {settings} from './settings';
import {readReality} from './tracker';
import {validateRouteBundle,type RouteBundle} from './route-bundle';
import type {CameraFrame} from './display';
export type MaskRect={x:number;y:number;width:number;height:number};
export type CaptureSample={t:number;videoTime:number;revision:number;tracking:boolean;width:number;height:number;rgba:Uint8ClampedArray;frame:CameraFrame};
type SavedFrame={id:string;sample:CaptureSample;reviewed:boolean};
/** K for an upright, full-viewport camera image copied before virtual rendering.
 * Camera poses remain OpenGL (forward -Z, up +Y); K uses image +u right/+v down.
 */
export function imageIntrinsics(p:number[],width:number,height:number){
  if(p.length!==16||!p.every(Number.isFinite)||![width,height].every(n=>Number.isSafeInteger(n)&&n>0))throw Error('Invalid image projection');
  const eps=settings.PROJECTION_FORM_TOLERANCE;
  if(p[0]<=0||p[5]<=0||Math.abs(p[11]+1)>eps||[1,2,3,4,6,7,12,13,15].some(i=>Math.abs(p[i])>eps))throw Error('Unsupported projection form');
  return [p[0]*width/2,0,(1-p[8])*width/2,0,p[5]*height/2,(1+p[9])*height/2,0,0,1];
}
/** In-memory capture only. No network, disk or privacy auto-approval. */
export class HostCapture{
  state:'idle'|'recording'|'review'|'aborted'='idle';
  private frames:SavedFrame[]=[];private revision?:number;private lastVideo=-Infinity;
  constructor(private routeId:string,private configSha256:string,private permitted:boolean){}
  start(){if(!this.permitted)throw Error('Site permission required');if(this.state!=='idle')throw Error('Recording already started');this.state='recording';}
  get count(){return this.frames.length;}
  needsFrame(t:number){return this.state==='recording'&&(!this.frames.length||t-this.frames.at(-1)!.sample.t>=settings.HOST_KEYFRAME_INTERVAL_MS);}
  abort(){this.state='aborted';this.clearPixels();}
  private clearPixels(){for(const f of this.frames)f.sample.rgba.fill(0);this.frames=[];}
  offer(sample:CaptureSample,now:number){
    if(this.state!=='recording')throw Error('Capture is not recording');
    const age=now-sample.t;
    const f=sample.frame;
    const valid=readReality({trackingStatus:sample.tracking?'NORMAL':'LIMITED',position:{x:f.position[0],y:f.position[1],z:f.position[2]},rotation:{x:f.rotation[0],y:f.rotation[1],z:f.rotation[2],w:f.rotation[3]},intrinsics:f.projection});
    if(!valid||!Number.isFinite(age)||age<0||age>settings.MARKER_MAX_AGE_MS||!Number.isFinite(sample.videoTime)||(this.revision!==undefined&&sample.revision!==this.revision)){
      this.abort();return false;
    }
    if(![sample.width,sample.height].every(n=>Number.isSafeInteger(n)&&n>0&&n<=settings.HOST_IMAGE_MAX_EDGE_PX)||sample.rgba.length!==sample.width*sample.height*4){this.abort();throw Error('Invalid camera pixel buffer');}
    try{imageIntrinsics(f.projection,sample.width,sample.height);}catch(error){this.abort();throw error;}
    if(sample.videoTime<=this.lastVideo)return false;
    if(!this.needsFrame(sample.t))return false;
    if(this.frames.length>=settings.HOST_MAX_KEYFRAMES_COUNT){this.abort();throw Error('Capture capacity reached');}
    this.revision=sample.revision;this.lastVideo=sample.videoTime;
    this.frames.push({id:`kf${this.frames.length}`,reviewed:false,sample:{...sample,rgba:sample.rgba.slice(),frame:{position:[...f.position],rotation:[...f.rotation],projection:[...f.projection]}}});return true;
  }
  finish(){
    if(this.state!=='recording'||this.frames.length<2)throw Error('At least two tracked keyframes required');
    const start=this.frames[0].sample.frame.position;
    if(!this.frames.some(f=>f.sample.frame.position.some((n,i)=>n!==start[i])))throw Error('Translation required; a stationary pan is insufficient');
    this.state='review';
  }
  preview(id:string){const f=this.frames.find(f=>f.id===id);if(!f||this.state!=='review')throw Error('Frame unavailable');return {id,width:f.sample.width,height:f.sample.height,rgba:f.sample.rgba.slice(),reviewed:f.reviewed};}
  review(id:string,masks:MaskRect[]){
    if(this.state!=='review')throw Error('Finish recording before review');
    const f=this.frames.find(f=>f.id===id);if(!f)throw Error('Unknown keyframe');
    for(const m of masks)if(![m.x,m.y,m.width,m.height].every(Number.isSafeInteger)||m.x<0||m.y<0||m.width<=0||m.height<=0||m.x+m.width>f.sample.width||m.y+m.height>f.sample.height)throw Error('Invalid privacy mask');
    for(const m of masks)for(let y=m.y;y<m.y+m.height;y++)for(let x=m.x;x<m.x+m.width;x++)f.sample.rgba.set([0,0,0,255],4*(y*f.sample.width+x));
    f.reviewed=true;
  }
  exportReviewed():{manifest:RouteBundle;images:{id:string;width:number;height:number;rgba:Uint8ClampedArray}[];timing:{id:string;receivedAtMs:number;videoTime:number}[]}{
    if(this.state!=='review'||!this.frames.length||this.frames.some(f=>!f.reviewed))throw Error('Review every image before export');
    const keyframes=this.frames.map(({id,sample:s})=>({id,image:`frames/${id}.png`,width:s.width,height:s.height,intrinsics:imageIntrinsics(s.frame.projection,s.width,s.height),position:s.frame.position,rotation:s.frame.rotation}));
    const manifest=validateRouteBundle({schemaVersion:1,routeId:this.routeId,configSha256:this.configSha256,source:'captured',units:'tracker',scaleVerified:false,
      privacy:{capturePermitted:true,imagesReviewed:true},keyframes,path:keyframes.map(k=>({position:k.position,keyframeId:k.id})),destination:{pathIndex:keyframes.length-1,keyframeId:keyframes.at(-1)!.id}});
    return {manifest,images:this.frames.map(f=>({id:f.id,width:f.sample.width,height:f.sample.height,rgba:f.sample.rgba.slice()})),timing:this.frames.map(f=>({id:f.id,receivedAtMs:f.sample.t,videoTime:f.sample.videoTime}))};
  }
  dispose(){this.clearPixels();this.state='aborted';}
}
