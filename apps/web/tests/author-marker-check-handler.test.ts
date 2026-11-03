import {expect,it} from 'vitest';
import {createServer} from 'node:http';
import {createAuthorMarkerCheckHandler} from '../../../server/marker-scan-handler';

it('checks an author marker before the walk only with protected access and reviewed pixels',async()=>{
 const key='secret-access',sha='a'.repeat(64);
 let calls=0;
 const check=createAuthorMarkerCheckHandler(key,sha,async()=>{
  calls++;return {accepted:true,configSha256:sha,reason:'marker-pose-only',arrowAuthorized:false};
 });
 const server=createServer((req,res)=>{if(!check(req,res))res.writeHead(404).end();});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address();if(!address||typeof address==='string')throw Error('No port');
 const url=`http://127.0.0.1:${address.port}/__walkit/author-marker-check`;
 try{
  const body={configSha256:sha,privacyReviewed:true,frameId:'pre0'};
  const bad=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  expect(bad.status).toBe(403);
  const unreviewed=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-Walkit-Access':key},
   body:JSON.stringify({...body,privacyReviewed:false})});
  expect(unreviewed.status).toBe(403);
  const accepted=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-Walkit-Access':key},
   body:JSON.stringify(body)});
  expect(accepted.status).toBe(200);
  expect(await accepted.json()).toMatchObject({accepted:true,arrowAuthorized:false});
  expect(calls).toBe(1);
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
});

it('does not qualify an author walk from one marker pose and waits for a multiview fit',async()=>{
 const key='secret-access',sha='b'.repeat(64);
 let aligned=0;
 const check=createAuthorMarkerCheckHandler(key,sha,async request=>({accepted:true,configSha256:sha,
  frameId:request.frameId,imageSha256:String(request.frameId).padEnd(64,'0'),
  frameAtPhoneMs:Number(String(request.frameId).slice(1))*250,
  reason:'single-frame-marker-pose-only',arrowAuthorized:false}),10485760,
  async receipts=>{aligned++;return {accepted:receipts.length===4,reason:'four-view-fit',
   arrowAuthorized:false,markerObservationCount:receipts.length};},4,10);
 const server=createServer((req,res)=>{if(!check(req,res))res.writeHead(404).end();});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address();if(!address||typeof address==='string')throw Error('No port');
 try{
  for(let i=0;i<4;i++){
   const response=await fetch(`http://127.0.0.1:${address.port}/__walkit/author-marker-check`,{
    method:'POST',headers:{'Content-Type':'application/json','X-Walkit-Access':key},
    body:JSON.stringify({configSha256:sha,privacyReviewed:true,authorSessionId:'author1234',frameId:`a${i}`})});
   const body=await response.json();
   expect(response.status).toBe(200);
   expect(body.arrowAuthorized).toBe(false);
   expect(body.alignment?.accepted===true).toBe(i===3);
  }
  expect(aligned).toBe(1);
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
