import type {IncomingMessage,ServerResponse} from 'node:http';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {validateLiveBatch} from './live-schema.ts';
import {validateCapture} from './capture-schema.ts';
import {join} from 'node:path';
const raw=readFileSync(new URL('../config/vision.yaml',import.meta.url),'utf8');
const settings=JSON.parse(raw) as Record<string,number>;
const configSha256=createHash('sha256').update(raw).digest('hex');
function object(value:unknown,keys:string[]){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Expected object');
  const v=value as Record<string,unknown>;
  if(Object.keys(v).length!==keys.length||keys.some(k=>!(k in v)))throw Error('Unexpected fields');
  return v;
}
export function validateReport(value:unknown){
  if(value&&typeof value==='object'&&'failure' in value){
    const failed=object(value,['build','kind','configSha256','passed','results','failure']);
    if(failed.build!=='E02-1'||failed.kind!=='synthetic GPU rasterization; not phone tracking'||typeof failed.configSha256!=='string'||!/^[a-f0-9]{64}$/.test(failed.configSha256)||failed.passed!==false||failed.failure!=='webgl-check-failed'||!Array.isArray(failed.results)||failed.results.length!==0)throw Error('Invalid failed run');
    return {...failed,configSha256:failed.configSha256,passed:false,results:[]};
  }
  const r=object(value,['build','kind','configSha256','passed','results']);
  if(r.build!=='E02-1'||r.kind!=='synthetic GPU rasterization; not phone tracking'||typeof r.configSha256!=='string'||!/^[a-f0-9]{64}$/.test(r.configSha256)||typeof r.passed!=='boolean'||!Array.isArray(r.results)||r.results.length!==8)throw Error('Incomplete report');
  const seen=new Set<string>();
  const results=r.results.map(item=>{
    const c=object(item,['width','height','dpr','moved','bufferWidth','bufferHeight','pixels','errorPx','shapeErrorPx','glError','passed']);
    const {width,height,dpr,moved,pixels,errorPx,shapeErrorPx,glError}=c;
    if(!((width===428&&height===781)||(width===781&&height===428))||!(dpr===1||dpr===2)||typeof moved!=='boolean'||typeof c.passed!=='boolean')throw Error('Invalid case');
    const id=`${width}/${dpr}/${moved}`;if(seen.has(id))throw Error('Duplicate case');seen.add(id);
    if(c.bufferWidth!==width*dpr||c.bufferHeight!==height*dpr||typeof pixels!=='number'||!Number.isSafeInteger(pixels)||pixels<0||pixels>width*height*dpr*dpr||typeof glError!=='number'||!Number.isSafeInteger(glError)||glError<0)throw Error('Invalid raster evidence');
    for(const n of [errorPx,shapeErrorPx])if(n!==null&&(typeof n!=='number'||!Number.isFinite(n)||n<0))throw Error('Invalid error');
    const passed=pixels>0&&typeof errorPx==='number'&&errorPx<=settings.QA_PIXEL_TOLERANCE_PX&&typeof shapeErrorPx==='number'&&shapeErrorPx<=settings.QA_PIXEL_TOLERANCE_PX&&glError===0;
    return {...c,passed};
  });
  return {...r,configSha256:r.configSha256,passed:results.every(c=>c.passed),results};
}
export function createReceiver(directory:string,accessKey?:string){
  const sessions=new Map<string,{token:string;expires:number;saved?:string}>();
  return (req:IncomingMessage,res:ServerResponse,next:()=>void)=>{
    if(!req.url?.startsWith('/__walkit/')){next();return;}
    const reply=(status:number,value:unknown)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
    void (async()=>{
      if(req.method!=='POST'){reply(405,{error:'POST required'});return;}
      if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)throw Error();}catch{reply(403,{error:'Origin rejected'});return;}}
      if(req.url==='/__walkit/session'){
        if(accessKey&&req.headers['x-walkit-access']!==accessKey){reply(403,{error:'Open the complete test link'});return;}
        for(const [id,s] of sessions)if(s.expires<Date.now())sessions.delete(id);
        if(sessions.size>=settings.DIAGNOSTIC_SESSION_LIMIT_COUNT){reply(429,{error:'Session limit reached'});return;}
        const id=randomUUID(),token=randomBytes(24).toString('hex');
        await mkdir(directory,{recursive:true});
        await writeFile(join(directory,`${id}.json`),JSON.stringify({status:'started; awaiting result',receivedAt:new Date().toISOString(),serverConfigSha256:configSha256}),{flag:'wx'});
        sessions.set(id,{token,expires:Date.now()+settings.DIAGNOSTIC_SESSION_TTL_MS});
        reply(201,{id,token});return;
      }
      if(req.url!=='/__walkit/result'&&req.url!=='/__walkit/live'&&req.url!=='/__walkit/capture'){reply(404,{error:'Unknown endpoint'});return;}
      if(req.url==='/__walkit/capture'&&![...sessions.values()].some(s=>s.expires>=Date.now()&&s.token===req.headers['x-walkit-token'])){reply(403,{error:'Invalid session'});return;}
      let body='';
      const limit=req.url==='/__walkit/capture'?settings.HOST_UPLOAD_LIMIT_BYTES:settings.DIAGNOSTIC_UPLOAD_LIMIT_BYTES;
      for await(const chunk of req){body+=chunk.toString();if(Buffer.byteLength(body)>limit){reply(413,{error:'Result too large'});return;}}
      const payload=object(JSON.parse(body),['id','report']);
      const session=typeof payload.id==='string'?sessions.get(payload.id):undefined;
      if(!session||session.expires<Date.now()||req.headers['x-walkit-token']!==session.token){reply(403,{error:'Test session expired or invalid'});return;}
      if(req.url==='/__walkit/capture'){
        const capture=validateCapture(payload.report,settings);
        if(capture.manifest.configSha256!==configSha256){reply(409,{error:'Reload the current build before recording'});return;}
        const encoded=JSON.stringify(capture),path=join(directory,`${payload.id}-capture.json`);
        try{await writeFile(path,encoded,{flag:'wx'});}catch(error){
          if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;
          if(await readFile(path,'utf8')!==encoded){reply(409,{error:'A different route is already saved in this session'});return;}
        }
        reply(201,{saved:true,id:payload.id,frames:capture.images.length,sha256:createHash('sha256').update(encoded).digest('hex')});return;
      }
      if(req.url==='/__walkit/live'){
        const batch=validateLiveBatch(payload.report);
        if(batch.events.length>settings.LIVE_BATCH_EVENT_COUNT||batch.seq>=settings.LIVE_BATCH_LIMIT_COUNT){reply(413,{error:'Test capacity reached'});return;}
        const path=join(directory,`${payload.id}-live-${batch.seq}.json`),encoded=JSON.stringify(batch);
        try{await writeFile(path,encoded,{flag:'wx'});}catch(error){
          if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;
          if(await readFile(path,'utf8')!==encoded){reply(409,{error:'Batch conflict'});return;}
        }
        reply(201,{saved:true,id:payload.id,seq:batch.seq});return;
      }
      const report=validateReport(payload.report),serialized=JSON.stringify(report);
      if(session.saved){if(session.saved!==serialized){reply(409,{error:'A different result was already saved'});return;}reply(200,{saved:true,id:payload.id,passed:report.passed});return;}
      await mkdir(directory,{recursive:true});
      await writeFile(join(directory,`${payload.id}.json`),JSON.stringify({status:'received',receivedAt:new Date().toISOString(),serverConfigSha256:configSha256,configurationMatches:report.configSha256===configSha256,report},null,2));
      session.saved=serialized;
      reply(201,{saved:true,id:payload.id,passed:report.passed});
    })().catch(error=>reply(error instanceof SyntaxError?400:422,{error:'Result not saved; retry or download evidence'}));
  };
}
