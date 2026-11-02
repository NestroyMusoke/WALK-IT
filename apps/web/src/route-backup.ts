import {validateLiveBatch,type LiveEvent} from '../../../server/live-schema';

type Capture={manifest:{configSha256:string};images:unknown[];timing:unknown[]};
type Diagnostic={configSha256:string;events:LiveEvent[]};

function record(value:unknown,keys:string[]):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid private backup');
 const obj=value as Record<string,unknown>;
 if(Object.keys(obj).sort().join(',')!==keys.sort().join(','))throw Error('Unexpected private backup fields');
 return obj;
}

export function makePrivateRouteBackup(capture:unknown,diagnostic:unknown){
 const c=record(capture,['manifest','images','timing']) as Capture;
 const manifest=c.manifest;
 if(!manifest||!/^[a-f0-9]{64}$/.test(manifest.configSha256)||!Array.isArray(c.images)||!Array.isArray(c.timing))throw Error('Invalid reviewed capture');
 const d=record(diagnostic,['configSha256','events']) as Diagnostic;
 if(d.configSha256!==manifest.configSha256)throw Error('Diagnostic configuration differs from route');
 validateLiveBatch({configSha256:d.configSha256,seq:0,events:d.events});
 return {schemaVersion:2,capture:c,diagnostic:d};
}

export function parsePrivateRouteBackup(input:unknown):{capture:Capture;diagnostic:Diagnostic|null}{
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid private backup');
 if('schemaVersion' in input){
  const envelope=record(input,['schemaVersion','capture','diagnostic']);
  if(envelope.schemaVersion!==2)throw Error('Unsupported private backup version');
  const checked=makePrivateRouteBackup(envelope.capture,envelope.diagnostic);
  return {capture:checked.capture,diagnostic:checked.diagnostic};
 }
 const capture=record(input,['manifest','images','timing']) as Capture;
 if(!capture.manifest||!/^[a-f0-9]{64}$/.test(capture.manifest.configSha256))throw Error('Invalid legacy capture');
 return {capture,diagnostic:null};
}
