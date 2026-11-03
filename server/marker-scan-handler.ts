import type {IncomingMessage,ServerResponse} from 'node:http';
import {spawn,type ChildProcess} from 'node:child_process';
import {readPrivateRouteShare} from './route-share.ts';

type Infer=(request:Record<string,unknown>)=>Promise<Record<string,unknown>>;
type Align=(receipts:Record<string,unknown>[],routeId:string)=>Promise<Record<string,unknown>>;
export type ReceiptLog=(entry:Record<string,unknown>)=>void;
/** Newest contiguous run inside the evidence window: an interrupted view of the marker is stale evidence. */
function keepFresh(receipts:Record<string,unknown>[],latest:number,maxAgeMs:number,maxGapMs=Infinity){
 const newest=Math.max(latest,...receipts.map(item=>Number(item.frameAtPhoneMs)));
 const fresh=receipts.filter(item=>typeof item.frameAtPhoneMs==='number'&&
  newest-item.frameAtPhoneMs>=0&&newest-item.frameAtPhoneMs<=maxAgeMs)
  .sort((a,b)=>Number(a.frameAtPhoneMs)-Number(b.frameAtPhoneMs));
 let cut=0;
 for(let index=fresh.length-1;index>0;index--){
  if(Number(fresh[index].frameAtPhoneMs)-Number(fresh[index-1].frameAtPhoneMs)>maxGapMs){cut=index;break;}
 }
 return fresh.slice(cut);
}
/** Allowlist, so no submitted pixel can ever reach a log file. */
const RECEIPT_TELEMETRY_FIELDS=['frameId','frameAtPhoneMs','imageVideoTime','poseVideoTime','markerId','accepted',
 'reason','opencvVersion','reprojectionRmsPx','imageSha256','configSha256','cameraCenterMarkerM',
 'markerToCameraRotation','trackerCameraCenter','trackerRotation','panelCount',
 'nonCoplanarityRankRatio'] as const;
const ALIGNMENT_TELEMETRY_FIELDS=['accepted','reason','markerBaselineM','maxOrientationDisagreementDeg',
 'maxPairwiseScaleDisagreementFraction','maxRelativeResidual','markerObservationCount',
 'discardedLeadingObservationCount','sourceFrameAtPhoneMs','windowSelection'] as const;
export function receiptTelemetry(receipt:Record<string,unknown>){
 const entry:Record<string,unknown>={};
 for(const field of RECEIPT_TELEMETRY_FIELDS)if(field in receipt)entry[field]=receipt[field];
 return entry;
}
export function alignmentTelemetry(alignment:Record<string,unknown>){
 const entry:Record<string,unknown>={};
 for(const field of ALIGNMENT_TELEMETRY_FIELDS)if(field in alignment)entry[field]=alignment[field];
 return entry;
}
function report(log:ReceiptLog|undefined,entry:Record<string,unknown>){
 if(!log)return;
 try{log(entry);}catch{/* a telemetry failure must never break a calibration */}
}
/** Protected, memory-only check before a single author walk. No route is issued here. */
export function createAuthorMarkerCheckHandler(accessKey:string,configSha256:string,infer:Infer,maxBytes=10485760,
 align?:Align,minCount=4,maxCount=10,maxAgeMs=2000,maxGapMs=Infinity,log?:ReceiptLog){
 let activeSession='',receipts:Record<string,unknown>[]=[];
 return (req:IncomingMessage,res:ServerResponse)=>{
  if(new URL(req.url||'/', 'http://localhost').pathname!=='/__walkit/author-marker-check')return false;
  const reply=(status:number,value:unknown)=>{res.writeHead(status,{'Content-Type':'application/json',
   'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});
   res.end(JSON.stringify(value));};
  void (async()=>{
   if(req.method!=='POST'){reply(405,{error:'POST required'});return;}
   if(req.headers['x-walkit-access']!==accessKey){reply(403,{error:'Protected phone link required'});return;}
   if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)throw Error();}
    catch{reply(403,{error:'Origin rejected'});return;}}
   let body='';
   for await(const part of req){body+=part.toString();if(Buffer.byteLength(body)>maxBytes*2){reply(413,{error:'Frame too large'});return;}}
   const request=JSON.parse(body) as Record<string,unknown>;
   if(request.configSha256!==configSha256||request.privacyReviewed!==true){
    reply(403,{error:'Current configuration and image review required'});return;
   }
   if(align&&(typeof request.authorSessionId!=='string'||
    !/^[a-zA-Z0-9_-]{8,64}$/.test(request.authorSessionId))){
    reply(422,{error:'Invalid author calibration session'});return;
   }
   const result=await infer(request);
   if(result.configSha256!==configSha256||result.arrowAuthorized!==false){
    reply(422,{error:'Untrusted marker response'});return;
   }
   let alignment:Record<string,unknown>|undefined;
   if(align){
    const session=String(request.authorSessionId);
    if(activeSession!==session){activeSession=session;receipts=[];}
    if(result.accepted===true&&!receipts.some(item=>item.frameId===result.frameId||
     item.imageSha256===result.imageSha256)){
     receipts.push(result);receipts=keepFresh(receipts,Number(result.frameAtPhoneMs),maxAgeMs,maxGapMs);
     while(receipts.length>maxCount)receipts.shift();
    }
    if(receipts.length>=minCount)alignment=await align(receipts,session);
    report(log,{at:Date.now(),channel:'author-marker-check',authorSessionId:session,
     bufferSize:receipts.length,
     bufferFrameAtPhoneMs:receipts.map(item=>Number(item.frameAtPhoneMs)),
     receipt:receiptTelemetry(result),alignment:alignment?alignmentTelemetry(alignment):undefined});
   }
   reply(200,alignment?{...result,alignment}:result);
  })().catch(error=>{report(log,{at:Date.now(),channel:'author-marker-check',
   failure:(error as Error).message});reply(422,{error:'Marker check refused'});});
  return true;
 };
}

export function createMarkerScanHandler(directory:string,configSha256:string,infer:Infer,maxBytes=10485760,
 align?:Align,minCount=4,maxCount=10,maxAgeMs=2000,maxGapMs=Infinity,log?:ReceiptLog){
 const sessions=new Map<string,Record<string,unknown>[]>();
 return (req:IncomingMessage,res:ServerResponse)=>{
  if(new URL(req.url||'/', 'http://localhost').pathname!=='/__walkit/marker-scan')return false;
  const headers={'Content-Type':'application/json','Cache-Control':'no-store',
   'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
  const reply=(status:number,value:unknown)=>{res.writeHead(status,headers);res.end(JSON.stringify(value));};
  void (async()=>{
   if(req.method!=='POST'){reply(405,{error:'POST required'});return;}
   if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)throw Error();}
    catch{reply(403,{error:'Origin rejected'});return;}}
   let body='';
   for await(const piece of req){body+=piece.toString();if(Buffer.byteLength(body)>maxBytes*2){reply(413,{error:'Marker frame too large'});return;}}
   const request=JSON.parse(body) as Record<string,unknown>;
   if(request.configSha256!==configSha256||request.privacyReviewed!==true){reply(403,{error:'Config or privacy review required'});return;}
   if(typeof request.visitorSessionId!=='string'||!/^[a-zA-Z0-9_-]{8,64}$/.test(request.visitorSessionId)){
    reply(422,{error:'Invalid visitor session'});return;
   }
   const route=await readPrivateRouteShare(directory,String(request.routeToken),Date.now());
   if(!route||route.configSha256!==configSha256){reply(403,{error:'Private route unavailable'});return;}
   const result=await infer(request);
   if(result.configSha256&&result.configSha256!==configSha256){reply(422,{error:'Marker result config mismatch'});return;}
   let alignment:Record<string,unknown>|undefined;
   if(result.accepted===true&&result.arrowAuthorized===false&&align){
    const key=`${request.routeToken}:${request.visitorSessionId}`;
    const receipts=sessions.get(key)||[];
    if(!receipts.some(item=>item.imageSha256===result.imageSha256||item.frameId===result.frameId))receipts.push(result);
    const fresh=keepFresh(receipts,Number(result.frameAtPhoneMs),maxAgeMs,maxGapMs);
    while(fresh.length>maxCount)fresh.shift();
    sessions.set(key,fresh);
    if(fresh.length>=minCount){
     const fit=await align(fresh,route.routeId);
     alignment={...fit,routeId:route.routeId,sourceCaptureSha256:route.sourceCaptureSha256,configSha256};
    }
    report(log,{at:Date.now(),channel:'visitor-marker-scan',visitorSessionId:String(request.visitorSessionId),
     routeId:route.routeId,bufferSize:fresh.length,
     bufferFrameAtPhoneMs:fresh.map(item=>Number(item.frameAtPhoneMs)),
     receipt:receiptTelemetry(result),alignment:alignment?alignmentTelemetry(alignment):undefined});
   }
   reply(200,alignment?{...result,alignment}:result);
  })().catch(error=>{report(log,{at:Date.now(),channel:'visitor-marker-scan',
   failure:(error as Error).message});reply(422,{error:'Marker scan refused'});});
  return true;
 };
}

/** One process per explicit scan. Image bytes stay in memory and are never logged. */
export function createPythonMarkerInfer(python:string,root:string,timeoutMs:number):Infer{
 return request=>new Promise((resolve,reject)=>{
  const child=spawn(python,['-m','geometry.marker_scan'],{cwd:root,windowsHide:true,stdio:['pipe','pipe','pipe']});
  let output='',error='';
  const timer=setTimeout(()=>{child.kill();reject(Error('Marker inference timed out'));},timeoutMs);
  child.stdout.on('data',part=>{output+=part.toString();if(output.length>65536)child.kill();});
  child.stderr.on('data',part=>{error+=part.toString();if(error.length>4096)child.kill();});
  child.on('error',reason=>{clearTimeout(timer);reject(reason);});
  child.on('close',code=>{
   clearTimeout(timer);
   if(code!==0){reject(Error('OpenCV marker inference failed'));return;}
   try{resolve(JSON.parse(output));}catch{reject(Error('Invalid marker inference output'));}
  });
  child.stdin.end(JSON.stringify(request));
 });
}

export function createPythonMarkerAlign(python:string,root:string,timeoutMs:number):Align{
 const run=createPythonJson(python,root,'geometry.visitor_marker_alignment',timeoutMs);
 return (receipts,routeId)=>run({receipts,routeId});
}

/**
 * One warm interpreter for every frame, matched by request id. A cold interpreter
 * costs about a second per frame, which is longer than a careful human needs to
 * cross the metric baseline; this removes that ceiling. Any worker failure falls
 * back to the original one-process-per-frame path, so a crash degrades latency
 * instead of ending the calibration.
 */
export function createPythonMarkerWorker(python:string,root:string,timeoutMs:number,maxRestarts=3){
 const fallbackInfer=createPythonMarkerInfer(python,root,timeoutMs);
 const fallbackAlign=createPythonMarkerAlign(python,root,timeoutMs);
 const pending=new Map<number,{resolve:(value:Record<string,unknown>)=>void;reject:(reason:Error)=>void;
  timer:NodeJS.Timeout}>();
 let child:ChildProcess|undefined,buffer='',sequence=0,restarts=0,disabled=false;

 const abandon=(reason:string)=>{
  child=undefined;buffer='';
  for(const [,entry] of pending){clearTimeout(entry.timer);entry.reject(Error(reason));}
  pending.clear();
 };
 const start=()=>{
  const spawned=spawn(python,['-m','geometry.marker_worker'],{cwd:root,windowsHide:true,stdio:['pipe','pipe','pipe']});
  spawned.stdout?.on('data',part=>{
   buffer+=part.toString();
   if(buffer.length>1048576){spawned.kill();return;}
   let newline=buffer.indexOf('\n');
   while(newline>=0){
    const line=buffer.slice(0,newline);buffer=buffer.slice(newline+1);newline=buffer.indexOf('\n');
    let response:Record<string,unknown>;
    try{response=JSON.parse(line) as Record<string,unknown>;}catch{continue;}
    const id=Number(response.id);
    const entry=pending.get(id);
    if(!entry)continue;
    pending.delete(id);clearTimeout(entry.timer);entry.resolve(response);
   }
  });
  spawned.on('error',()=>{abandon('Marker worker unavailable');});
  spawned.on('close',()=>{abandon('Marker worker stopped');});
  child=spawned;
  return spawned;
 };
 const send=(payload:Record<string,unknown>)=>new Promise<Record<string,unknown>>((resolve,reject)=>{
  if(disabled){reject(Error('Marker worker disabled'));return;}
  const worker=child&&child.stdin?.writable?child:start();
  const id=++sequence;
  const timer=setTimeout(()=>{
   pending.delete(id);worker.kill();
   reject(Error('Marker worker timed out'));
  },timeoutMs);
  pending.set(id,{resolve,reject,timer});
  try{worker.stdin?.write(JSON.stringify({...payload,id})+'\n');}
  catch{clearTimeout(timer);pending.delete(id);reject(Error('Marker worker write failed'));}
 });
 const call=(payload:Record<string,unknown>,fallback:()=>Promise<Record<string,unknown>>,label:string)=>{
  if(disabled)return fallback();
  return send(payload).then(response=>{
   if(response.error)throw Error(`${label}: ${String(response.error)}`);
   const {id:_,...rest}=response;
   return rest;
  },()=>{
   if(++restarts>maxRestarts)disabled=true;
   return fallback();
  });
 };
 process.on('exit',()=>{try{child?.kill();}catch{/* the process is already leaving */}});
 return {infer:(request:Record<string,unknown>)=>call({kind:'scan',request},
   ()=>fallbackInfer(request),'OpenCV marker inference failed'),
  align:(receipts:Record<string,unknown>[],routeId:string)=>call({kind:'align',receipts,routeId},
   ()=>fallbackAlign(receipts,routeId),'OpenCV worker failed'),
  dispose:()=>{disabled=true;try{child?.kill();}catch{/* already gone */}abandon('Marker worker disposed');}};
}

function createPythonJson(python:string,root:string,module:string,timeoutMs:number){
 return (payload:unknown)=>new Promise<Record<string,unknown>>((resolve,reject)=>{
  const child=spawn(python,['-m',module],{cwd:root,windowsHide:true,stdio:['pipe','pipe','pipe']});
  let output='';
  const timer=setTimeout(()=>{child.kill();reject(Error('OpenCV worker timed out'));},timeoutMs);
  child.stdout.on('data',part=>{output+=part.toString();if(output.length>65536)child.kill();});
  child.on('error',reason=>{clearTimeout(timer);reject(reason);});
  child.on('close',code=>{
   clearTimeout(timer);
   if(code!==0){reject(Error('OpenCV worker failed'));return;}
   try{resolve(JSON.parse(output));}catch{reject(Error('Invalid OpenCV worker output'));}
  });
  child.stdin.end(JSON.stringify(payload));
 });
}
