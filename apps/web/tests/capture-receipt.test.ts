import {it,expect} from 'vitest';
import {validateCapture} from '../../../server/capture-schema';
import {PerspectiveCamera} from 'three';
import {HostCapture} from '../src/host-capture';
import {createReceiver} from '../../../server/receiver';
import {createServer} from 'node:http';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const limits={HOST_MAX_KEYFRAMES_COUNT:60,HOST_IMAGE_MAX_EDGE_PX:640,QUATERNION_NORM_TOLERANCE:.01};
function fixture(){
 const r=new HostCapture('route','a'.repeat(64),true);r.start();
 for(let i=0;i<2;i++)r.offer({t:i*1000,videoTime:i,revision:1,tracking:true,width:1,height:1,rgba:new Uint8ClampedArray(4),frame:{position:[i,0,0],rotation:[0,0,0,1],projection:new PerspectiveCamera().projectionMatrix.toArray()}},i*1000);
 r.finish();r.review('kf0',[]);r.review('kf1',[]);const out=r.exportReviewed();
 const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0u8AAAAASUVORK5CYII=';
 return {...out,images:out.images.map(f=>({id:f.id,png}))};
}
it('accepts a reviewed bounded capture and rejects missing images, wrong calibration, privacy and timestamps',()=>{
 const f=fixture();expect(validateCapture(f,limits).images.length).toBe(2);
 expect(()=>validateCapture({...f,images:[]},limits)).toThrow();
 expect(()=>validateCapture({...f,manifest:{...f.manifest,privacy:{capturePermitted:true,imagesReviewed:false}}},limits)).toThrow();
 expect(()=>validateCapture({...f,images:f.images.map(i=>({...i,png:'not an image'}))},limits)).toThrow();
 expect(()=>validateCapture({...f,timing:[f.timing[0],f.timing[0]]},limits)).toThrow();
 f.manifest.keyframes[0].width=2;expect(()=>validateCapture(f,limits)).toThrow();
});
it('persists privately before receipt, retries identically and rejects unauthenticated or conflicting uploads',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'walkit-capture-')),receiver=createReceiver(dir,'test-key');
 const server=createServer((req,res)=>receiver(req,res,()=>{res.statusCode=404;res.end();}));
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
 try{
  const session=await(await fetch(base+'/__walkit/session',{method:'POST',headers:{'X-Walkit-Access':'test-key'}})).json() as {id:string;token:string};
  const f=fixture();f.manifest.configSha256=createHash('sha256').update(await readFile(new URL('../../../config/vision.yaml',import.meta.url))).digest('hex');
  const send=(token=session.token)=>fetch(base+'/__walkit/capture',{method:'POST',headers:{'Content-Type':'application/json','X-Walkit-Token':token},body:JSON.stringify({id:session.id,report:f})});
  expect((await send('wrong')).status).toBe(403);
  const first=await send();expect(first.status).toBe(201);const receipt=await first.json() as {sha256:string};
  const saved=await readFile(join(dir,session.id+'-capture.json'),'utf8');expect(createHash('sha256').update(saved).digest('hex')).toBe(receipt.sha256);
  expect((await send()).status).toBe(201);expect((await fetch(base+`/${session.id}-capture.json`)).status).toBe(404);
  f.manifest.routeId='different';expect((await send()).status).toBe(409);
 }finally{await new Promise<void>(r=>server.close(()=>r()));await rm(dir,{recursive:true,force:true});}
});
