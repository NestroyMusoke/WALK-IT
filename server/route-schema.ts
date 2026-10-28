
type Keyframe={id:string;image:string;width:number;height:number;intrinsics:number[];position:number[];rotation:number[]};
export type RouteBundle={schemaVersion:1;routeId:string;configSha256:string;source:'synthetic'|'captured';units:'tracker'|'metres';scaleVerified:boolean;
  privacy:{capturePermitted:true;imagesReviewed:true};keyframes:Keyframe[];path:{position:number[];keyframeId:string}[];destination:{pathIndex:number;keyframeId:string}};
function record(value:unknown,keys:string[]){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Expected manifest object');
  const r=value as Record<string,unknown>;
  if(Object.keys(r).length!==keys.length||keys.some(k=>!(k in r)))throw Error('Unexpected manifest fields');
  return r;
}
function id(value:unknown){if(typeof value!=='string'||!/^[a-zA-Z0-9_-]+$/.test(value))throw Error('Invalid identifier');return value;}
function vector(value:unknown,length:number){if(!Array.isArray(value)||value.length!==length||!value.every(n=>typeof n==='number'&&Number.isFinite(n)))throw Error('Invalid numeric vector');return [...value] as number[];}
function dimension(value:unknown){if(typeof value!=='number'||!Number.isSafeInteger(value)||value<=0)throw Error('Invalid image dimensions');return value;}
/** Capture manifest validation only. Does not authorize rendering, localization or arrival. */
export function validateRouteBundle(value:unknown,quaternionTolerance:number):RouteBundle{
  const r=record(value,['schemaVersion','routeId','configSha256','source','units','scaleVerified','privacy','keyframes','path','destination']);
  if(r.schemaVersion!==1)throw Error('Unsupported route schema');
  if(typeof r.configSha256!=='string'||!/^[a-f0-9]{64}$/.test(r.configSha256))throw Error('Missing configuration identity');
  if(!['synthetic','captured'].includes(String(r.source))||!['tracker','metres'].includes(String(r.units))||typeof r.scaleVerified!=='boolean')throw Error('Invalid provenance or units');
  if(r.scaleVerified&&r.units!=='metres')throw Error('Verified scale requires metric units');
  const privacy=record(r.privacy,['capturePermitted','imagesReviewed']);
  if(privacy.capturePermitted!==true||privacy.imagesReviewed!==true)throw Error('Permission and image review required before bundling');
  if(!Array.isArray(r.keyframes)||!r.keyframes.length||!Array.isArray(r.path)||r.path.length<2)throw Error('Route requires keyframes and a path');
  const ids=new Set<string>();
  const keyframes=r.keyframes.map(value=>{
    const k=record(value,['id','image','width','height','intrinsics','position','rotation']);const key=id(k.id);
    if(ids.has(key))throw Error('Duplicate keyframe');ids.add(key);
    if(typeof k.image!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_./-]*\.(jpg|jpeg|png)$/.test(k.image)||k.image.split('/').some(part=>!part||part==='.'||part==='..'))throw Error('Unsafe image reference');
    const width=dimension(k.width),height=dimension(k.height),intrinsics=vector(k.intrinsics,9),rotation=vector(k.rotation,4);
    if(intrinsics[0]<=0||intrinsics[4]<=0||intrinsics[3]!==0||intrinsics[6]!==0||intrinsics[7]!==0||intrinsics[8]!==1||intrinsics[2]<0||intrinsics[2]>=width||intrinsics[5]<0||intrinsics[5]>=height)throw Error('Invalid image calibration');
    if(Math.abs(Math.hypot(...rotation)-1)>quaternionTolerance)throw Error('Invalid camera rotation');
    return {id:key,image:k.image,width,height,intrinsics,position:vector(k.position,3),rotation};
  });
  const reference=(value:unknown)=>{const key=id(value);if(!ids.has(key))throw Error('Unknown keyframe reference');return key;};
  const path=r.path.map(value=>{const p=record(value,['position','keyframeId']);return {position:vector(p.position,3),keyframeId:reference(p.keyframeId)};});
  const d=record(r.destination,['pathIndex','keyframeId']);
  if(d.pathIndex!==path.length-1)throw Error('Destination must identify the path endpoint');
  return {schemaVersion:1,routeId:id(r.routeId),configSha256:r.configSha256,source:r.source as RouteBundle['source'],units:r.units as RouteBundle['units'],scaleVerified:r.scaleVerified,
    privacy:{capturePermitted:true,imagesReviewed:true},keyframes,path,destination:{pathIndex:path.length-1,keyframeId:reference(d.keyframeId)}};
}
/** A prerequisite only: fresh localization, ambiguity and tracking gates are still mandatory. */
export function requireMetricScale(bundle:RouteBundle){
  if(bundle.source!=='captured'||bundle.units!=='metres'||!bundle.scaleVerified)throw Error('Real capture with independently verified metric scale is required');
}
