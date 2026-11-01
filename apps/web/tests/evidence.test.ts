import {expect,it} from 'vitest';
import {validateManifest,summarize} from '../src/evidence-data';

// Synthetic contract fixture only; never shipped as a real case.
const fixture=()=>({schemaVersion:'walkit-evidence-v1',declaredApproachCount:20,cases:[{
 id:'fixture-1',label:'RECORDED REPLAY',split:'held-out',privacyReviewed:true,publicationApproved:true,
 image:'fixture.png',overlay:'fixture-mask.png',inputSha256:'a'.repeat(64),configSha256:'b'.repeat(64),
 groundTruth:'decoy',spark:{model:'fixture-spark',receipt:'fixture-receipt',output:{text:'73'}},
 sam:{model:'fixture-sam',receipt:'fixture-mask-receipt',output:{concept:'green door'}},
 withModels:{verdict:'refused',reason:'Geometry and visible attribute disagree'},
 withoutModels:{verdict:'confirmed',reason:'Baseline accepted'},
}]});

it('keeps empty evidence empty and counts paired outcomes including failures',()=>{
 expect(validateManifest({schemaVersion:'walkit-evidence-v1',declaredApproachCount:20,cases:[]}).cases).toEqual([]);
 const m=validateManifest(fixture());const s=summarize(m.cases);
 expect(s.withModels.refused).toBe(1);expect(s.withModels.falseConfirmations).toBe(0);
 expect(s.withoutModels.falseConfirmations).toBe(1);
 const f=fixture();f.cases[0].withModels.verdict='failed';
 expect(summarize(validateManifest(f).cases).withModels.failed).toBe(1);
});
it('rejects unreviewed cases, private/remote assets and mislabelled provenance',()=>{
 for(const key of ['privacyReviewed','publicationApproved']){
  const f=fixture();Object.assign(f.cases[0],{[key]:false});expect(()=>validateManifest(f)).toThrow();
 }
 for(const path of ['../private.png','https://host/img.png','C:\\private.png','data:image/png;base64,abc','photo.svg']){
  const f=fixture();f.cases[0].image=path;expect(()=>validateManifest(f)).toThrow();
 }
 const f=fixture();f.cases[0].label='LIVE';expect(()=>validateManifest(f)).toThrow();
});
it('rejects duplicates, missing paired outcomes and credential fields',()=>{
 const f=fixture();f.cases.push({...f.cases[0]});expect(()=>validateManifest(f)).toThrow();
 const missing=fixture();Object.assign(missing.cases[0],{withoutModels:null});expect(()=>validateManifest(missing)).toThrow();
 const secret=fixture();Object.assign(secret.cases[0].spark.output,{api_key:'fixture-secret'});expect(()=>validateManifest(secret)).toThrow();
 const invalid=fixture();invalid.cases[0].withModels.verdict='passed';expect(()=>validateManifest(invalid)).toThrow();
});
