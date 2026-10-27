import {it,expect} from 'vitest';
import {PerspectiveCamera,Vector3} from 'three';
import {HostCapture,imageIntrinsics} from '../src/host-capture';
import {settings} from '../src/settings';
const camera=new PerspectiveCamera(60,4/3,0.01,1000);
function sample(t:number,z:number){return {t,videoTime:t,revision:1,tracking:true,width:4,height:3,rgba:new Uint8ClampedArray(4*3*4).fill(180),frame:{position:[0,0,z],rotation:[0,0,0,1],projection:camera.projectionMatrix.toArray()}};}
function recorded(){const recorder=new HostCapture('test-route','a'.repeat(64),true);recorder.start();recorder.offer(sample(0,0),0);recorder.offer(sample(1000,-1),1000);recorder.finish();return recorder;}
it('derives image calibration consistent with actual projection, including principal-point offset',()=>{
 const c=new PerspectiveCamera(60,4/3,0.01,1000);c.filmOffset=5;c.updateProjectionMatrix();c.updateMatrixWorld();
 const k=imageIntrinsics(c.projectionMatrix.toArray(),640,480),p=new Vector3(.3,.2,-2),q=p.clone().project(c);
 expect(k[0]*p.x/-p.z+k[2]).toBeCloseTo((q.x+1)*320,8);
 expect(-k[4]*p.y/-p.z+k[5]).toBeCloseTo((1-q.y)*240,8);
 expect(()=>imageIntrinsics(Array(16).fill(0),640,480)).toThrow();
});
it('requires permission and refuses export until each image is reviewed',()=>{
 expect(()=>new HostCapture('test','a'.repeat(64),false).start()).toThrow();
 const r=recorded();expect(()=>r.exportReviewed()).toThrow();r.review('kf0',[]);r.review('kf1',[]);
 const out=r.exportReviewed();expect(out.manifest.units).toBe('tracker');expect(out.manifest.scaleVerified).toBe(false);
 expect(out.manifest.destination.pathIndex).toBe(1);expect(out.images.length).toBe(2);
 expect(out.timing).toEqual([{id:'kf0',receivedAtMs:0,videoTime:0},{id:'kf1',receivedAtMs:1000,videoTime:1000}]);
});
it('masks reviewed pixels and exports independent copies',()=>{
 const r=recorded();r.review('kf0',[{x:1,y:1,width:2,height:1}]);r.review('kf1',[]);
 const a=r.exportReviewed();expect([...a.images[0].rgba.slice(20,24)]).toEqual([0,0,0,255]);
 a.images[0].rgba[0]=0;expect(r.exportReviewed().images[0].rgba[0]).toBe(180);
});
it('aborts on lost tracking, stale frames or a changed calibration instead of bridging a gap',()=>{
 for(const reason of ['lost','stale','resize']){
  const r=new HostCapture('test','a'.repeat(64),true);r.start();r.offer(sample(0,0),0);
  const next=sample(1000,-1);if(reason==='lost')next.tracking=false;if(reason==='resize')next.revision=2;
  r.offer(next,reason==='stale'?1000+settings.MARKER_MAX_AGE_MS+1:1000);
  expect(r.state).toBe('aborted');expect(()=>r.finish()).toThrow();
 }
});
it('rejects mismatched pixel buffers and stationary-only capture',()=>{
 const r=new HostCapture('test','a'.repeat(64),true);r.start();const s=sample(0,0);s.rgba=new Uint8ClampedArray(1);
 expect(()=>r.offer(s,0)).toThrow();
 const stationary=new HostCapture('test','a'.repeat(64),true);stationary.start();stationary.offer(sample(0,0),0);stationary.offer(sample(1000,0),1000);
 expect(()=>stationary.finish()).toThrow();
});
