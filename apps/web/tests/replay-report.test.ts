import {expect,it} from 'vitest';
import {validateReplayReport} from '../src/replay-report';

const H='a'.repeat(64),C='b'.repeat(64),I='c'.repeat(64);
const capture={routeId:'r',configSha256:C,frames:[{id:'kf0'}]};
const report={schemaVersion:1,sourceClass:'RECORDED REPLAY',captureSha256:H,
 configSha256:C,routeId:'r',anchorAuthorized:false,
 frames:[{frameId:'kf0',imageSha256:I,status:'abstain',reason:'missing-receipt-or-context',
  confirmed:false,modelEvidence:'missing'}]};
it('binds a report to exact capture, config and image hashes without granting an arrow',()=>{
 const result=validateReplayReport(report,capture,H,[I]);
 expect(result.frames[0].reason).toBe('missing-receipt-or-context');
 expect(result.anchorAuthorized).toBe(false);
});
it('refuses a report from another capture, image, route or unsupported status',()=>{
 for(const bad of [
  {...report,captureSha256:'d'.repeat(64)},
  {...report,routeId:'other'},
  {...report,frames:[{...report.frames[0],imageSha256:'e'.repeat(64)}]},
  {...report,frames:[{...report.frames[0],status:'confirmed',confirmed:true}]},
 ])expect(()=>validateReplayReport(bad,capture,H,[I])).toThrow();
});
