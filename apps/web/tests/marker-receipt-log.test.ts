import {expect,it} from 'vitest';
import {createServer,type IncomingMessage,type ServerResponse} from 'node:http';
import {createAuthorMarkerCheckHandler,receiptTelemetry,alignmentTelemetry} from '../../../server/marker-scan-handler';

const KEY='secret-access',SHA='c'.repeat(64);

async function withServer(handler:(req:IncomingMessage,res:ServerResponse)=>boolean,
 run:(port:number)=>Promise<void>){
 const server=createServer((req,res)=>{if(!handler(req,res))res.writeHead(404).end();});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address();if(!address||typeof address==='string')throw Error('No port');
 try{await run(address.port);}finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
}

it('never lets reviewed pixels or their hashes reach the telemetry log',async()=>{
 const imageJpegBase64='/9j/4AAQSkZJRgABAQ'.repeat(40);
 const entries:Record<string,unknown>[]=[];
 const check=createAuthorMarkerCheckHandler(KEY,SHA,async request=>{
  const index=Number(String(request.frameId).slice(1));
  return {accepted:true,configSha256:SHA,frameId:request.frameId,frameAtPhoneMs:1000+index*250,
   imageSha256:String(index+1).padStart(64,'0'),imageJpegBase64,
   reason:'single-frame-marker-pose-only',arrowAuthorized:false,
   reprojectionRmsPx:0.31,cameraCenterMarkerM:[0.1,0.2,1.1]};},10485760,
  async()=>({accepted:false,reason:'insufficient-metric-baseline',arrowAuthorized:false,
   markerBaselineM:0.31,routeToSession:{scale:1.2},imageJpegBase64,
   windowSelection:{totalObservationCount:4,passingWindowCount:0,gateMargins:{metricBaseline:0.78}}}),
  4,10,6000,2000,entry=>entries.push(entry));
 await withServer(check,async port=>{
  for(let index=0;index<4;index++){
   const response=await fetch(`http://127.0.0.1:${port}/__walkit/author-marker-check`,{method:'POST',
    headers:{'Content-Type':'application/json','X-Walkit-Access':KEY},
    body:JSON.stringify({configSha256:SHA,privacyReviewed:true,authorSessionId:'author1234',
     frameId:`a${index}`,imageJpegBase64})});
   expect(response.status).toBe(200);
  }
 });
 expect(entries).toHaveLength(4);
 const text=JSON.stringify(entries);
 expect(text).not.toContain(imageJpegBase64);
 expect(text).not.toContain('imageJpegBase64');
 expect(text).not.toContain('routeToSession');
 const last=entries[3];
 const receipt=last.receipt as Record<string,unknown>;
 expect(receipt.frameId).toBe('a3');
 expect(receipt.reprojectionRmsPx).toBe(0.31);
 expect(receipt.imageJpegBase64).toBeUndefined();
 expect(last.bufferSize).toBe(4);
 expect(last.bufferFrameAtPhoneMs).toEqual([1000,1250,1500,1750]);
 const alignment=last.alignment as Record<string,unknown>;
 expect(alignment.reason).toBe('insufficient-metric-baseline');
 expect(alignment.markerBaselineM).toBe(0.31);
 expect(alignment.windowSelection).toEqual({totalObservationCount:4,passingWindowCount:0,
  gateMargins:{metricBaseline:0.78}});
});

it('drops unlisted fields from receipts and alignments rather than passing them through',()=>{
 const telemetry=receiptTelemetry({frameId:'a1',accepted:true,imageJpegBase64:'SECRET',
  rgba:[1,2,3],frameAtPhoneMs:1000,configSha256:SHA,reprojectionRmsPx:0.4,
  trackerCameraCenter:[0,0,0],markerToCameraRotation:[1,0,0,0,1,0,0,0,1]});
 expect(Object.keys(telemetry).sort()).toEqual(['accepted','configSha256','frameAtPhoneMs','frameId',
  'markerToCameraRotation','reprojectionRmsPx','trackerCameraCenter']);
 expect(JSON.stringify(telemetry)).not.toContain('SECRET');
 const alignment=alignmentTelemetry({accepted:true,reason:'marker-session-transform-hypothesis-only',
  routeToSession:{scale:1.2},imageJpegBase64:'SECRET',markerBaselineM:0.62,
  windowSelection:{totalObservationCount:6,gateMargins:{orientation:2.4}}});
 expect(JSON.stringify(alignment)).not.toContain('SECRET');
 expect(JSON.stringify(alignment)).not.toContain('routeToSession');
 expect(alignment.markerBaselineM).toBe(0.62);
 expect(alignment.windowSelection).toEqual({totalObservationCount:6,gateMargins:{orientation:2.4}});
});

it('records a failure reason instead of silently losing a refused calibration',async()=>{
 const entries:Record<string,unknown>[]=[];
 const check=createAuthorMarkerCheckHandler(KEY,SHA,async()=>{throw Error('python worker exited');},
  10485760,undefined,4,10,6000,2000,entry=>entries.push(entry));
 await withServer(check,async port=>{
  const response=await fetch(`http://127.0.0.1:${port}/__walkit/author-marker-check`,{method:'POST',
   headers:{'Content-Type':'application/json','X-Walkit-Access':KEY},
   body:JSON.stringify({configSha256:SHA,privacyReviewed:true,frameId:'a0'})});
  expect(response.status).toBe(422);
 });
 expect(entries.some(entry=>String(entry.failure).includes('python worker exited'))).toBe(true);
});
