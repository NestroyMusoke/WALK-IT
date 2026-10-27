import {it,expect} from 'vitest';
import {mkdtemp,readFile,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {createReceiver,validateReport} from '../../../server/receiver';
function report(){return {build:'E02-1',kind:'synthetic GPU rasterization; not phone tracking',configSha256:'a'.repeat(64),passed:true,
  results:[428,781].flatMap(width=>[1,2].flatMap(dpr=>[false,true].map(moved=>({width,height:width===428?781:428,dpr,moved,bufferWidth:width*dpr,bufferHeight:(width===428?781:428)*dpr,pixels:100,errorPx:0.1,shapeErrorPx:0,glError:0,passed:true}))))};}
it('derives the result from measurements and rejects missing cases or extra data',()=>{
  expect(validateReport(report()).passed).toBe(true);
  const bad=report();bad.results[0].pixels=0;
  expect(validateReport(bad).passed).toBe(false);
  expect(()=>validateReport({...report(),results:[]})).toThrow();
  expect(()=>validateReport({...report(),image:'private'})).toThrow();
  expect(validateReport({...report(),results:[],passed:false,failure:'webgl-check-failed'}).passed).toBe(false);
});
it('receives a complete result, acknowledges only after saving, and retries idempotently',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'walkit-receipt-'));
  const receiver=createReceiver(dir);
  const server=createServer((req,res)=>receiver(req,res,()=>{res.statusCode=404;res.end();}));
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=(server.address() as {port:number}).port,base=`http://127.0.0.1:${port}`;
  try{
    const session=await (await fetch(base+'/__walkit/session',{method:'POST'})).json() as {id:string;token:string};
    const send=()=>fetch(base+'/__walkit/result',{method:'POST',headers:{'Content-Type':'application/json','X-Walkit-Token':session.token},body:JSON.stringify({id:session.id,report:report()})});
    expect((await send()).status).toBe(201);
    expect((await send()).status).toBe(200);
    expect((await readdir(dir)).length).toBe(1);
    const saved=JSON.parse(await readFile(join(dir,session.id+'.json'),'utf8'));
    expect(saved.report.results.length).toBe(8);expect(saved.report.passed).toBe(true);
    expect(JSON.stringify(saved)).not.toContain(session.token);
    const batch={configSha256:'a'.repeat(64),seq:0,events:[{t:1,kind:'frame',label:'LIMITED',values:[1,0]}]};
    const live=()=>fetch(base+'/__walkit/live',{method:'POST',headers:{'Content-Type':'application/json','X-Walkit-Token':session.token},body:JSON.stringify({id:session.id,report:batch})});
    expect((await live()).status).toBe(201);
    expect((await live()).status).toBe(201);
    const liveSaved=JSON.parse(await readFile(join(dir,session.id+'-live-0.json'),'utf8'));
    expect(liveSaved.events[0].label).toBe('LIMITED');
    expect((await fetch(base+'/__walkit/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'../escape',report:report()})})).status).toBe(403);
    expect((await fetch(base+'/__walkit/session',{method:'POST',headers:{Origin:'https://unrelated.example'}})).status).toBe(403);
  }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));await rm(dir,{recursive:true,force:true});}
});
