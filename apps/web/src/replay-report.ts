type FrameResult={frameId:string;imageSha256:string;status:'abstain'|'candidate'|'confirmed';
 reason:string;confirmed:boolean;modelEvidence:'missing'|'caller-supplied'};
export type ReplayReport={schemaVersion:1;sourceClass:'RECORDED REPLAY'|'SYNTHETIC';
 captureSha256:string;configSha256:string;routeId:string;anchorAuthorized:false;frames:FrameResult[]};
const sha=(value:unknown)=>typeof value==='string'&&/^[0-9a-f]{64}$/.test(value);
export function validateReplayReport(value:unknown,capture:{routeId:string;configSha256:string;frames:{id:string}[]},
 captureSha256:string,imageHashes:string[]):ReplayReport{
 const report=value as ReplayReport;
 if(!report||report.schemaVersion!==1||!['RECORDED REPLAY','SYNTHETIC'].includes(report.sourceClass)||
  !sha(report.captureSha256)||report.captureSha256!==captureSha256||
  report.configSha256!==capture.configSha256||report.routeId!==capture.routeId||
  report.anchorAuthorized!==false||!Array.isArray(report.frames)||
  report.frames.length!==capture.frames.length||imageHashes.length!==capture.frames.length)throw Error('Replay report does not match the loaded capture');
 for(let i=0;i<report.frames.length;i++){
  const frame=report.frames[i];
  if(!frame||frame.frameId!==capture.frames[i].id||!sha(frame.imageSha256)||
   frame.imageSha256!==imageHashes[i]||!['abstain','candidate','confirmed'].includes(frame.status)||
   typeof frame.reason!=='string'||!frame.reason||
   frame.confirmed!==(frame.status==='confirmed')||
   !['missing','caller-supplied'].includes(frame.modelEvidence)||
   (frame.status!=='abstain'&&frame.modelEvidence!=='caller-supplied'))throw Error('Replay frame evidence does not match the image');
 }
 return report;
}
