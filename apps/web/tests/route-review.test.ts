import {it,expect} from 'vitest';
import {joinReview} from '../../../server/route-review';
it('joins actual frame evidence and never upgrades hypotheses into navigation',()=>{
 const capture={manifest:{keyframes:[{id:'kf0',position:[0,0,0]}]},images:[{id:'kf0',png:'pixels'}]};
 const query={queryCaptureSha256:'a'.repeat(64),results:[{queryFrame:'kf0',accepted:true,reason:'geometric-hypothesis-only',inliers:9}]};
 const r=joinReview(capture,query,'a'.repeat(64));expect(r.frames[0].status).toBe('Pose hypothesis');expect(r.navigationReady).toBe(false);
 expect(()=>joinReview(capture,query,'b'.repeat(64))).toThrow();
 expect(()=>joinReview(capture,{...query,results:[...query.results,...query.results]},'a'.repeat(64))).toThrow();
 expect(joinReview(capture,{...query,results:[]},'a'.repeat(64)).frames[0].status).toBe('Not evaluated');
});
