export type LiveEvent={t:number;kind:string;label:string;values:number[]};
export function validateLiveBatch(value:unknown){
  if(!value||typeof value!=='object')throw Error('Missing batch');
  const b=value as {configSha256:string;seq:number;events:LiveEvent[]};
  if(Object.keys(b).sort().join(',')!=='configSha256,events,seq'||!/^[a-f0-9]{64}$/.test(b.configSha256)||!Number.isSafeInteger(b.seq)||b.seq<0||!Array.isArray(b.events))throw Error('Invalid batch');
  for(const e of b.events){
    if(!e||Object.keys(e).sort().join(',')!=='kind,label,t,values'||!Number.isFinite(e.t)||e.t<0||!['frame','status','placement','step','answer','end','error','begin'].includes(e.kind)||typeof e.label!=='string'||e.label.length>128||!/^[a-zA-Z0-9 _.:/-]*$/.test(e.label)||!Array.isArray(e.values)||e.values.length>64||!e.values.every(Number.isFinite))throw Error('Invalid event');
  }
  return b;
}
