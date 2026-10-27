import {describe,it,expect} from 'vitest';
import {PerspectiveCamera,Vector3} from 'three';
import {ViewportCalibration,projectReference,DiagnosticAnchor} from '../src/display';
import {settings} from '../src/settings';
describe('calibrated display',()=>{
  it('sets portrait/landscape drawing buffers explicitly and preserves aspect across pixel ratios',()=>{
    for(const [w,h] of [[428,781],[781,428]])for(const dpr of [1,2,3]){
      const canvas={width:300,height:150};const calibration=new ViewportCalibration();
      const result=calibration.sync(canvas,w,h,dpr);
      expect(canvas.width).toBe(w*Math.min(dpr,settings.MAX_DEVICE_PIXEL_RATIO));
      expect(canvas.height).toBe(h*Math.min(dpr,settings.MAX_DEVICE_PIXEL_RATIO));
      expect(canvas.width/canvas.height).toBeCloseTo(w/h,8);expect(result.changed).toBe(true);
      expect(calibration.sync(canvas,w,h,dpr).changed).toBe(false);
    }
  });
  it('rejects zero/nonfinite display sizes; orientation or external buffer mutation changes revision',()=>{
    const c={width:300,height:150};const s=new ViewportCalibration();const a=s.sync(c,428,781,2);
    expect(()=>s.sync(c,0,781,2)).toThrow();expect(()=>s.sync(c,428,NaN,2)).toThrow();
    const b=s.sync(c,781,428,2);expect(b.revision).toBeGreaterThan(a.revision);
    c.width=300;expect(s.sync(c,781,428,2).changed).toBe(true);
  });
  it('projects a noncentral point into the full CSS display, with correct camera motion',()=>{
    const camera=new PerspectiveCamera(60,428/781,0.01,1000);camera.position.set(0.2,0.1,0);camera.rotation.y=0.1;camera.updateMatrixWorld();
    const point:[number,number,number]=[0.1,0.2,-2];const expected=new Vector3(...point).project(camera);
    const frame={position:camera.position.toArray(),rotation:camera.quaternion.toArray(),projection:camera.projectionMatrix.toArray()};
    const screen=projectReference(point,frame,428,781)!;
    expect(screen.x).toBeCloseTo((expected.x+1)*428/2,7);
    expect(screen.y).toBeCloseTo((1-expected.y)*781/2,7);
    expect(projectReference([0,0,2],frame,428,781)).toBeNull();
    expect(projectReference(point,{...frame,projection:[NaN]},428,781)).toBeNull();
  });
  it('clears a diagnostic placement on resize, loss, stale frame or clock reversal',()=>{
    for(const reason of ['resize','loss','stale','clock']){
      const marker=new DiagnosticAnchor();marker.place([0,0,-2],1);
      expect(marker.read({revision:1,tracking:true,frameMs:100,nowMs:101})).toEqual([0,0,-2]);
      expect(marker.read({revision:reason==='resize'?2:1,tracking:reason!=='loss',frameMs:100,
        nowMs:reason==='stale'?100+settings.MARKER_MAX_AGE_MS+1:reason==='clock'?99:101})).toBeNull();
      expect(marker.read({revision:1,tracking:true,frameMs:100,nowMs:101})).toBeNull();
    }
  });
});
