import {Matrix4,Quaternion,Vector3,Vector4} from 'three';
import {settings} from './settings';
export type CameraFrame={position:number[];rotation:number[];projection:number[]};
export type WorldPoint=[number,number,number];
export class ViewportCalibration {
  private revision=0;
  private signature='';
  sync(canvas:{width:number;height:number},cssWidth:number,cssHeight:number,pixelRatio:number){
    if(![cssWidth,cssHeight,pixelRatio].every(n=>Number.isFinite(n)&&n>0))throw Error('Invalid display dimensions');
    const ratio=Math.min(pixelRatio,settings.MAX_DEVICE_PIXEL_RATIO);
    const width=Math.max(1,Math.round(cssWidth*ratio)),height=Math.max(1,Math.round(cssHeight*ratio));
    const signature=`${cssWidth}/${cssHeight}/${width}/${height}`;
    const changed=signature!==this.signature||canvas.width!==width||canvas.height!==height;
    if(changed){canvas.width=width;canvas.height=height;this.signature=signature;this.revision++;}
    return {width,height,cssWidth,cssHeight,ratio,revision:this.revision,changed};
  }
}
export function projectReference(point:WorldPoint,frame:CameraFrame,cssWidth:number,cssHeight:number){
  if(frame.position.length!==3||frame.rotation.length!==4||frame.projection.length!==16)return null;
  if(![...point,...frame.position,...frame.rotation,...frame.projection,cssWidth,cssHeight].every(Number.isFinite))return null;
  if(cssWidth<=0||cssHeight<=0||Math.abs(Math.hypot(...frame.rotation)-1)>settings.QUATERNION_NORM_TOLERANCE)return null;
  const worldFromCamera=new Matrix4().compose(new Vector3().fromArray(frame.position),new Quaternion().fromArray(frame.rotation),new Vector3(1,1,1));
  const clip=new Vector4(...point,1).applyMatrix4(worldFromCamera.invert()).applyMatrix4(new Matrix4().fromArray(frame.projection));
  if(clip.w<=settings.CLIP_W_EPSILON)return null;
  const ndc=[clip.x/clip.w,clip.y/clip.w,clip.z/clip.w];
  if(ndc.some(n=>!Number.isFinite(n)||Math.abs(n)>1))return null;
  return {x:(ndc[0]+1)*cssWidth/2,y:(1-ndc[1])*cssHeight/2};
}
// Diagnostic only: never authorizes a route arrow or arrival.
export class DiagnosticAnchor {
  private point:WorldPoint|null=null;
  private revision=0;
  place(point:WorldPoint,revision:number){
    if(!point.every(Number.isFinite))throw Error('Invalid point');
    this.point=[...point];this.revision=revision;
  }
  clear(){this.point=null;}
  read({revision,tracking,frameMs,nowMs}:{revision:number;tracking:boolean;frameMs:number;nowMs:number}){
    const age=nowMs-frameMs;
    if(revision!==this.revision||!tracking||!Number.isFinite(age)||age<0||age>settings.MARKER_MAX_AGE_MS)this.clear();
    return this.point?[...this.point] as WorldPoint:null;
  }
}
