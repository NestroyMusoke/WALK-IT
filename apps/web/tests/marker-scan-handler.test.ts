import {expect,it} from 'vitest';
import {createServer} from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createPrivateRouteShare} from '../../../server/route-share';
import {createMarkerScanHandler} from '../../../server/marker-scan-handler';

it('requires an active matching private route before running marker inference',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'walkit-marker-http-'));
 const sha='b'.repeat(64);
 const share=await createPrivateRouteShare(dir,{accepted:true,sourceCaptureSha256:'a'.repeat(64),
  configSha256:sha,routeId:'r1',units:'metres',markerObservationCount:5,
  path:[{keyframeId:'kf0',position:[0,0,0]},{keyframeId:'kf1',position:[1,0,0]}],
  destination:{pathIndex:1,keyframeId:'kf1'},scaleVerified:false,navigationReady:false,arrowAuthorized:false},
 Date.now(),60000);
 let calls=0,alignCalls=0;
 const marker=createMarkerScanHandler(dir,sha,async()=>{calls++;return {accepted:true,reason:'single-frame-marker-pose-only',
  frameId:`v${calls}`,frameAtPhoneMs:[250,750,500,1000][calls-1],imageSha256:`${calls}`.padStart(64,'0'),
  markerId:0,configSha256:sha,arrowAuthorized:false};},10485760,
  async receipts=>{alignCalls++;expect(receipts.map(item=>item.frameAtPhoneMs)).toEqual([250,500,750,1000]);
   return {accepted:true,reason:'marker-session-transform-hypothesis-only',arrowAuthorized:false};},4);
 const server=createServer((req,res)=>{if(!marker(req,res))res.writeHead(404).end();});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address();if(!address||typeof address==='string')throw Error('No port');
 const url=`http://127.0.0.1:${address.port}/__walkit/marker-scan`;
 try{
  const body={routeToken:share.token,visitorSessionId:'session-one',configSha256:sha,privacyReviewed:true};
  const valid=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  expect(valid.status).toBe(200);expect((await valid.json()).reason).toBe('single-frame-marker-pose-only');
  for(let i=0;i<3;i++){
   const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   expect(response.status).toBe(200);
   const result=await response.json();
   if(i===2)expect(result.alignment?.accepted).toBe(true);
  }
  const missing=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,routeToken:'c'.repeat(48)})});
  expect(missing.status).toBe(403);expect(calls).toBe(4);expect(alignCalls).toBe(1);
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));await rm(dir,{recursive:true,force:true});}
});

it('does not align a stale mix of marker frames across a settling ramp',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'walkit-marker-age-'));
 const sha='a'.repeat(64);
 const share=await createPrivateRouteShare(dir,{accepted:true,sourceCaptureSha256:'b'.repeat(64),
  configSha256:sha,routeId:'r1',units:'metres',markerObservationCount:5,
  path:[{keyframeId:'kf0',position:[0,0,0]},{keyframeId:'kf1',position:[1,0,0]}],
  destination:{pathIndex:1,keyframeId:'kf1'},scaleVerified:false,navigationReady:false,arrowAuthorized:false},Date.now(),60000);
 let calls=0,alignCalls=0;
 const marker=createMarkerScanHandler(dir,sha,async()=>{calls++;return {accepted:true,frameId:`v${calls}`,
  frameAtPhoneMs:[100,200,300,5000][calls-1],imageSha256:`${calls}`.padStart(64,'0'),
  markerId:0,configSha256:sha,arrowAuthorized:false};},10485760,
  async()=>{alignCalls++;return {accepted:true};},4);
 const server=createServer((req,res)=>{if(!marker(req,res))res.writeHead(404).end();});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address();if(!address||typeof address==='string')throw Error('No port');
 try{
  for(let i=0;i<4;i++){
   const response=await fetch(`http://127.0.0.1:${address.port}/__walkit/marker-scan`,{method:'POST',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({routeToken:share.token,visitorSessionId:'session-one',configSha256:sha,privacyReviewed:true})});
   expect(response.status).toBe(200);
  }
  expect(alignCalls).toBe(0);
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));await rm(dir,{recursive:true,force:true});}
});
