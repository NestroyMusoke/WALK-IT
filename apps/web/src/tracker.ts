import {Matrix4} from 'three';
import {settings} from './settings';
import type {CameraFrame} from './display';
export function readReality(value:unknown):CameraFrame|null{
  if(!value||typeof value!=='object')return null;
  const r=value as {trackingStatus?:string;position?:{x:number;y:number;z:number};rotation?:{x:number;y:number;z:number;w:number};intrinsics?:ArrayLike<number>};
  if(r.trackingStatus!=='NORMAL'||!r.position||!r.rotation||r.intrinsics?.length!==16)return null;
  const frame={position:[r.position.x,r.position.y,r.position.z],rotation:[r.rotation.x,r.rotation.y,r.rotation.z,r.rotation.w],projection:Array.from(r.intrinsics)};
  if(![...frame.position,...frame.rotation,...frame.projection].every(Number.isFinite)||Math.abs(Math.hypot(...frame.rotation)-1)>settings.QUATERNION_NORM_TOLERANCE||Math.abs(new Matrix4().fromArray(frame.projection).determinant())<settings.PROJECTION_DETERMINANT_EPSILON)return null;
  return frame;
}
