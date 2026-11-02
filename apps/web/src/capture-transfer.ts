import {settings} from './settings';

type Session={id:string;token:string};
type Receipt={saved:true;id:string;frames:number;sha256:string};

function receipt(value:unknown,id:string):Receipt{
 if(!value||typeof value!=='object')throw Error('Invalid route receipt');
 const r=value as Receipt;
 if(r.saved!==true||r.id!==id||!Number.isSafeInteger(r.frames)||r.frames<2||!/^[a-f0-9]{64}$/.test(r.sha256))throw Error('Invalid route receipt');
 return r;
}

/** Upload reviewed images in persisted parts. A second call skips parts the receiver has. */
export async function transferReviewedCapture(base:string,session:Session,report:unknown,fetcher:typeof fetch=fetch):Promise<Receipt>{
 const bytes=new TextEncoder().encode(JSON.stringify(report));
 if(bytes.length===0||bytes.length>settings.HOST_UPLOAD_LIMIT_BYTES)throw Error('Route exceeds upload capacity');
 const chunkSize=Math.floor(settings.HOST_UPLOAD_LIMIT_BYTES/settings.HOST_MAX_KEYFRAMES_COUNT);
 const count=Math.ceil(bytes.length/chunkSize);
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
 const meta={id:session.id,count,total:bytes.length,sha256:digest};
 const headers={'Content-Type':'application/json','X-Walkit-Token':session.token};
 const status=await fetcher(base+'/__walkit/capture-status',{method:'POST',headers,body:JSON.stringify(meta),signal:AbortSignal.timeout(settings.DIAGNOSTIC_REQUEST_TIMEOUT_MS)});
 if(!status.ok)throw Error(`Route transfer status failed (${status.status})`);
 const state=await status.json() as {received:unknown;completed:unknown;receipt?:unknown};
 if(state.completed===true)return receipt(state.receipt,session.id);
 if(state.completed!==false||!Array.isArray(state.received)||state.received.some(index=>!Number.isSafeInteger(index)||index<0||index>=count))throw Error('Invalid transfer status');
 const received=new Set<number>(state.received);
 for(let index=0;index<count;index++){
  if(received.has(index))continue;
  const part=bytes.slice(index*chunkSize,(index+1)*chunkSize);
  const response=await fetcher(base+'/__walkit/capture-part',{method:'POST',headers:{'X-Walkit-Token':session.token,'X-Walkit-ID':session.id,'X-Walkit-Index':String(index),'X-Walkit-Count':String(count),'X-Walkit-Total':String(bytes.length),'X-Walkit-Sha256':digest},body:part.buffer as ArrayBuffer,signal:AbortSignal.timeout(settings.HOST_UPLOAD_TIMEOUT_MS)});
  if(!response.ok)throw Error(`Route part ${index+1}/${count} failed (${response.status})`);
  const saved=await response.json() as {saved?:boolean;id?:string;index?:number};
  if(saved.saved!==true||saved.id!==session.id||saved.index!==index)throw Error('Invalid part receipt');
 }
 const complete=await fetcher(base+'/__walkit/capture-complete',{method:'POST',headers,body:JSON.stringify(meta),signal:AbortSignal.timeout(settings.HOST_UPLOAD_TIMEOUT_MS)});
 if(!complete.ok)throw Error(`Route completion failed (${complete.status})`);
 return receipt(await complete.json(),session.id);
}
