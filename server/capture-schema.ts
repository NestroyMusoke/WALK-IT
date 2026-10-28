import {validateRouteBundle} from './route-schema.ts';
function object(v:unknown,keys:string[]){
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==keys.length||keys.some(k=>!(k in v)))throw Error('Unexpected capture fields');
 return v as Record<string,unknown>;
}
export function validateCapture(value:unknown,limits:Record<string,number>){
 const c=object(value,['manifest','images','timing']);
 const manifest=validateRouteBundle(c.manifest,limits.QUATERNION_NORM_TOLERANCE);
 if(manifest.source!=='captured'||manifest.keyframes.length>limits.HOST_MAX_KEYFRAMES_COUNT)throw Error('Invalid capture source or capacity');
 if(!Array.isArray(c.images)||!Array.isArray(c.timing)||c.images.length!==manifest.keyframes.length||c.timing.length!==manifest.keyframes.length)throw Error('Incomplete capture');
 const images=c.images.map((v,i)=>{
  const f=object(v,['id','png']),k=manifest.keyframes[i];
  if(f.id!==k.id||k.image!==`frames/${k.id}.png`||k.width>limits.HOST_IMAGE_MAX_EDGE_PX||k.height>limits.HOST_IMAGE_MAX_EDGE_PX||typeof f.png!=='string'||!(/^[A-Za-z0-9+/]+={0,2}$/).test(f.png))throw Error('Invalid capture image');
  const b=Buffer.from(f.png,'base64');
  if(b.length<33||b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||b.subarray(12,16).toString()!=='IHDR'||b.readUInt32BE(16)!==k.width||b.readUInt32BE(20)!==k.height)throw Error('PNG calibration mismatch');
  return {id:k.id,png:f.png};
 });
 let lastT=-Infinity,lastVideo=-Infinity;
 const timing=c.timing.map((v,i)=>{
  const t=object(v,['id','receivedAtMs','videoTime']);
  if(t.id!==manifest.keyframes[i].id||typeof t.receivedAtMs!=='number'||!Number.isFinite(t.receivedAtMs)||t.receivedAtMs<0||t.receivedAtMs<=lastT||typeof t.videoTime!=='number'||!Number.isFinite(t.videoTime)||t.videoTime<=lastVideo)throw Error('Invalid capture timing');
  lastT=t.receivedAtMs;lastVideo=t.videoTime;return {id:t.id,receivedAtMs:lastT,videoTime:lastVideo};
 });
 return {manifest,images,timing};
}
