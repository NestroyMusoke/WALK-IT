type Capture={manifest:{keyframes:{id:string;position:number[]}[]};images:{id:string;png:string}[]};
type Query={queryCaptureSha256:string;results:{queryFrame:string;accepted:boolean;reason:string;inliers?:number;descriptorMatches?:number;maxInlierErrorPx?:number}[]};
export function joinReview(capture:Capture,query:Query,sha:string){
 if(query.queryCaptureSha256!==sha)throw Error('Query does not belong to this capture');
 const byId=new Map(query.results.map(r=>[r.queryFrame,r]));
 if(byId.size!==query.results.length)throw Error('Duplicate query frames');
 const known=new Set(capture.manifest.keyframes.map(k=>k.id));
 if(query.results.some(r=>!known.has(r.queryFrame)))throw Error('Unknown query frame');
 const frames=capture.manifest.keyframes.map((k,i)=>{
  const image=capture.images[i];if(!image||image.id!==k.id)throw Error('Image order mismatch');
  const r=byId.get(k.id);
  return {id:k.id,position:k.position,png:image.png,status:!r?'Not evaluated':r.accepted?'Pose hypothesis':'Rejected',reason:r?.reason??'No query result',inliers:r?.inliers??null,matches:r?.descriptorMatches??null,errorPx:r?.maxInlierErrorPx??null};
 });
 return {frames,navigationReady:false,accepted:frames.filter(f=>f.status==='Pose hypothesis').length};
}
