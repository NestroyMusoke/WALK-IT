import {expect,it} from 'vitest';
import {PerspectiveCamera} from 'three';
import {SameSessionTrail} from '../src/same-session-trail';

it('records positions only and labels the same-session arrow without issuing a verified certificate',()=>{
 const trail=new SameSessionTrail();
 trail.begin();trail.add([0,0,-2],0);trail.add([0.1,0,-2],1000);trail.add([0.2,0,-2],2000);
 expect(trail.finish()).toBe(true);
 const camera=new PerspectiveCamera(60,1,0.01,1000);
 const frame={position:[0,0,0],rotation:[0,0,0,1],projection:camera.projectionMatrix.toArray()};
 const arrow=trail.read(frame,'NORMAL',3000,2999,500,500);
 expect(arrow?.mode).toBe('same-session-live-replay');
 expect(arrow).not.toHaveProperty('arrowAuthorized');
 expect(trail.read(frame,'LIMITED',3000,2999,500,500)).toBeNull();
});
