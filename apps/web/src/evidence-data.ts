export type Verdict='confirmed'|'refused'|'abstained'|'failed';
export type Outcome={verdict:Verdict;reason:string};
export type EvidenceCase={id:string;label:'RECORDED REPLAY';split:'validation'|'held-out';privacyReviewed:true;publicationApproved:true;image:string;overlay:string;inputSha256:string;configSha256:string;groundTruth:'correct'|'decoy'|'wrong-direction'|'wrong-start';spark:ModelEvidence;sam:ModelEvidence;withModels:Outcome;withoutModels:Outcome};
type ModelEvidence={model:string;receipt:string;output:Record<string,unknown>};
export type EvidenceManifest={schemaVersion:'walkit-evidence-v1';declaredApproachCount:number;cases:EvidenceCase[]};
function obj(v:unknown):Record<string,unknown>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Expected object');return v as Record<string,unknown>;}
function str(v:unknown):string{if(typeof v!=='string'||!v.trim())throw Error('Missing text');return v;}
function choice<T extends string>(v:unknown,allowed:readonly T[]):T{if(!allowed.includes(v as T))throw Error('Invalid evidence label');return v as T;}
function asset(v:unknown){const s=str(v);if(!/^[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp)$/.test(s))throw Error('Only reviewed local image filenames are allowed');return s;}
function sha(v:unknown){const s=str(v);if(!/^[a-f0-9]{64}$/.test(s))throw Error('Missing provenance SHA');return s;}
function noCredentials(v:unknown):void{
 if(Array.isArray(v)){v.forEach(noCredentials);return;}
 if(v&&typeof v==='object')for(const [k,value]of Object.entries(v)){
  if(/api.?key|authorization|secret|access.?token/i.test(k))throw Error('Credential field cannot be published');
  noCredentials(value);
 }
}
function model(v:unknown):ModelEvidence{const o=obj(v);const output=obj(o.output);noCredentials(output);return {model:str(o.model),receipt:str(o.receipt),output};}
function outcome(v:unknown):Outcome{const o=obj(v);return {verdict:choice(o.verdict,['confirmed','refused','abstained','failed']),reason:str(o.reason)};}
export function validateManifest(value:unknown):EvidenceManifest{
 const m=obj(value);if(m.schemaVersion!=='walkit-evidence-v1'||!Array.isArray(m.cases))throw Error('Invalid manifest');
 const count=m.declaredApproachCount;if(typeof count!=='number'||!Number.isSafeInteger(count)||count<0||count<m.cases.length)throw Error('Invalid declared denominator');
 const ids=new Set<string>();
 const cases=m.cases.map((value):EvidenceCase=>{
  const c=obj(value);const id=str(c.id);if(ids.has(id))throw Error('Duplicate case ID');ids.add(id);
  if(c.privacyReviewed!==true||c.publicationApproved!==true)throw Error('Public review and consent required');
  return {id,label:choice(c.label,['RECORDED REPLAY']),split:choice(c.split,['validation','held-out']),privacyReviewed:true,publicationApproved:true,
   image:asset(c.image),overlay:asset(c.overlay),inputSha256:sha(c.inputSha256),configSha256:sha(c.configSha256),
   groundTruth:choice(c.groundTruth,['correct','decoy','wrong-direction','wrong-start']),spark:model(c.spark),sam:model(c.sam),
   withModels:outcome(c.withModels),withoutModels:outcome(c.withoutModels)};
 });
 return {schemaVersion:'walkit-evidence-v1',declaredApproachCount:count,cases};
}
export function summarize(cases:EvidenceCase[]){
 const counts=()=>({confirmed:0,refused:0,abstained:0,failed:0,falseConfirmations:0});
 const result={withModels:counts(),withoutModels:counts()};
 for(const c of cases)for(const arm of ['withModels','withoutModels']as const){
  result[arm][c[arm].verdict]++;
  if(c[arm].verdict==='confirmed'&&c.groundTruth!=='correct')result[arm].falseConfirmations++;
 }
 return result;
}
