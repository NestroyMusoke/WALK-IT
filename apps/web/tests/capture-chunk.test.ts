import {it,expect} from 'vitest';
import {createServer} from 'node:http';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createReceiver} from '../../../server/receiver';
import {PerspectiveCamera} from 'three';
import {HostCapture} from '../src/host-capture';
import {transferReviewedCapture} from '../src/capture-transfer';

it('resumes a private route after an interrupted multipart transfer and refuses conflicts',async()=>{
 const settings=JSON.parse(await readFile(new URL('../../../config/vision.yaml',import.meta.url),'utf8')) as Record<string,number>;
 const configSha=createHash('sha256').update(await readFile(new URL('../../../config/vision.yaml',import.meta.url))).digest('hex');
 const host=new HostCapture('chunk-test',configSha,true);host.start();
 for(let i=0;i<2;i++)host.offer({t:i*1000,videoTime:i,revision:1,tracking:true,width:1,height:1,rgba:new Uint8ClampedArray(4),frame:{position:[i,0,0],rotation:[0,0,0,1],projection:new PerspectiveCamera().projectionMatrix.toArray()}},i*1000);
 host.finish();host.review('kf0',[]);host.review('kf1',[]);
 const f=host.exportReviewed();
 const png=Buffer.concat([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0u8AAAAASUVORK5CYII=','base64'),Buffer.alloc(1_000_000)]).toString('base64');
 const report={...f,images:f.images.map(image=>({id:image.id,png}))};
 const body=Buffer.from(JSON.stringify(report));
 const chunkSize=Math.floor(settings.HOST_UPLOAD_LIMIT_BYTES/settings.HOST_MAX_KEYFRAMES_COUNT);
 const chunks=Array.from({length:Math.ceil(body.length/chunkSize)},(_,i)=>body.subarray(i*chunkSize,(i+1)*chunkSize));
 expect(chunks.length).toBeGreaterThan(1);
 const digest=createHash('sha256').update(body).digest('hex');
 const dir=await mkdtemp(join(tmpdir(),'walkit-chunks-'));
 const receiver=createReceiver(dir,'test-key');
 const server=createServer((req,res)=>receiver(req,res,()=>{res.statusCode=404;res.end();}));
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
 try{
  const session=await(await fetch(base+'/__walkit/session',{method:'POST',headers:{'X-Walkit-Access':'test-key'}})).json() as {id:string;token:string};
  const headers={'X-Walkit-Token':session.token};
  const meta={id:session.id,count:chunks.length,total:body.length,sha256:digest};
  const part=(i:number,token=session.token,bytes=chunks[i])=>fetch(base+'/__walkit/capture-part',{method:'POST',headers:{'X-Walkit-Token':token,'X-Walkit-ID':session.id,'X-Walkit-Index':String(i),'X-Walkit-Count':String(chunks.length),'X-Walkit-Total':String(body.length),'X-Walkit-Sha256':digest},body:bytes});
  expect((await part(0,'wrong')).status).toBe(403);
  expect((await part(0)).status).toBe(201);
  expect((await part(0)).status).toBe(201);
  expect((await part(0,session.token,Buffer.alloc(chunks[0].length))).status).toBe(409);
  const status=await(await fetch(base+'/__walkit/capture-status',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(meta)})).json() as {received:number[]};
  expect(status.received).toEqual([0]);
  expect((await fetch(base+'/__walkit/capture-complete',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(meta)})).status).toBe(409);
  for(let i=1;i<chunks.length;i++)expect((await part(i)).status).toBe(201);
  const complete=()=>fetch(base+'/__walkit/capture-complete',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(meta)});
  const response=await complete();expect(response.status).toBe(201);
  const receipt=await response.json() as {frames:number;sha256:string};expect(receipt.frames).toBe(2);
  expect((await complete()).status).toBe(201);
  const saved=await readFile(join(dir,session.id+'-capture.json'),'utf8');
  expect(createHash('sha256').update(saved).digest('hex')).toBe(receipt.sha256);
  await expect(readFile(join(dir,session.id+'-capture-part-0'))).rejects.toMatchObject({code:'ENOENT'});
  const second=await(await fetch(base+'/__walkit/session',{method:'POST',headers:{'X-Walkit-Access':'test-key'}})).json() as {id:string;token:string};
  let dropped=false;
  const brokenFetch:typeof fetch=async(input,init)=>{
   const response=await fetch(input,init);
   if(String(input).endsWith('/__walkit/capture-part')&&!dropped){dropped=true;throw new TypeError('simulated lost response');}
   return response;
  };
  await expect(transferReviewedCapture(base,second,report,brokenFetch)).rejects.toThrow();
  let resumedParts=0;
  const countingFetch:typeof fetch=async(input,init)=>{if(String(input).endsWith('/__walkit/capture-part'))resumedParts++;return fetch(input,init);};
  const resumed=await transferReviewedCapture(base,second,report,countingFetch);
  expect(resumed.frames).toBe(2);
  expect(resumedParts).toBe(chunks.length-1);
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));await rm(dir,{recursive:true,force:true});}
});
