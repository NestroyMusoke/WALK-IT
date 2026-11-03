import type {IncomingMessage,ServerResponse} from 'node:http';
import {spawn} from 'node:child_process';
import {readPrivateRouteShare} from './route-share.ts';

type Infer=(request:Record<string,unknown>)=>Promise<Record<string,unknown>>;
type Align=(receipts:Record<string,unknown>[],routeId:string)=>Promise<Record<string,unknown>>;
function keepFresh(receipts:Record<string,unknown>[],latest:number,maxAgeMs:number){
 const newest=Math.max(latest,...receipts.map(item=>Number(item.frameAtPhoneMs)));
 return receipts.filter(item=>typeof item.frameAtPhoneMs==='number'&&
  newest-item.frameAtPhoneMs>=0&&newest-item.frameAtPhoneMs<=maxAgeMs)
  .sort((a,b)=>Number(a.frameAtPhoneMs)-Number(b.frameAtPhoneMs));
}
/** Protected, memory-only check before a single author walk. No route is issued here. */
export function createAuthorMarkerCheckHandler(accessKey:string,configSha256:string,infer:Infer,maxBytes=10485760,
 align?:Align,minCount=4,maxCount=10,maxAgeMs=2000){
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
     receipts.push(result);receipts=keepFresh(receipts,Number(result.frameAtPhoneMs),maxAgeMs);
     if(receipts.length>maxCount)receipts.shift();
    }
    if(receipts.length>=minCount)alignment=await align(receipts,session);
   }
   reply(200,alignment?{...result,alignment}:result);
  })().catch(()=>reply(422,{error:'Marker check refused'}));
  return true;
 };
}

export function createMarkerScanHandler(directory:string,configSha256:string,infer:Infer,maxBytes=10485760,
 align?:Align,minCount=4,maxCount=10,maxAgeMs=2000){
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
    const fresh=keepFresh(receipts,Number(result.frameAtPhoneMs),maxAgeMs);
    if(fresh.length>maxCount)fresh.shift();
    sessions.set(key,fresh);
    if(fresh.length>=minCount){
     const fit=await align(fresh,route.routeId);
     alignment={...fit,routeId:route.routeId,sourceCaptureSha256:route.sourceCaptureSha256,configSha256};
    }
   }
   reply(200,alignment?{...result,alignment}:result);
  })().catch(()=>reply(422,{error:'Marker scan refused'}));
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
