import {expect,it} from 'vitest';
import {PerspectiveCamera} from 'three';
import {HostCapture,imageIntrinsics} from '../src/host-capture';
import {parseReplayCapture,projectionFromIntrinsics} from '../src/replay-data';

const PNG='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0u8AAAAASUVORK5CYII=';
function fixture(){
 const host=new HostCapture('replay-test','a'.repeat(64),true);host.start();
 const projection=new PerspectiveCamera().projectionMatrix.toArray();
 for(let i=0;i<2;i++)host.offer({t:i*1000,videoTime:i,revision:1,tracking:true,width:1,height:1,
  rgba:new Uint8ClampedArray(4),frame:{position:[i,0,0],rotation:[0,0,0,1],projection}},i*1000);
 host.finish();host.review('kf0',[]);host.review('kf1',[]);
 const capture=host.exportReviewed();
 return {...capture,images:capture.images.map(({id})=>({id,png:PNG}))};
}
it('accepts only a reviewed ordered local capture and never grants an anchor',()=>{
 const replay=parseReplayCapture(fixture());
 expect(replay.frames.map(f=>f.id)).toEqual(['kf0','kf1']);
 expect(replay.frames.map(f=>f.videoTime)).toEqual([0,1]);
 expect(replay.frames[0].imageUrl).toMatch(/^data:image\/png;base64,/);
 expect(replay.frames[1].frame.position).toEqual([1,0,0]);
 expect(replay.anchorAuthorized).toBe(false);
});
it('refuses private-review, image, timing and identity violations',()=>{
 const cases=[];
 const unreviewed=structuredClone(fixture()) as unknown as {manifest:{privacy:{imagesReviewed:boolean}}};unreviewed.manifest.privacy.imagesReviewed=false;cases.push(unreviewed);
 const wrongImage=fixture();wrongImage.images[0].png='bad';cases.push(wrongImage);
 const wrongId=fixture();wrongId.images[0].id='other';cases.push(wrongId);
 const wrongTime=fixture();wrongTime.timing[1].videoTime=0;cases.push(wrongTime);
 for(const input of cases)expect(()=>parseReplayCapture(input)).toThrow();
});
it('reconstructs a projection that matches the saved image calibration',()=>{
 const {manifest}=fixture();const k=manifest.keyframes[0].intrinsics;
 const p=projectionFromIntrinsics(k,1,1);
 expect(imageIntrinsics(p,1,1)).toEqual(k);
});
