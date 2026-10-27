import {it,expect} from 'vitest';
import {PerspectiveCamera} from 'three';
import {readReality} from '../src/tracker';
import {validateLiveBatch} from '../../../server/live-schema';
const reality=()=>({trackingStatus:'NORMAL',position:{x:0,y:0,z:0},rotation:{x:0,y:0,z:0,w:1},intrinsics:new PerspectiveCamera().projectionMatrix.toArray()});
it('accepts a complete normal pose and rejects degraded or malformed camera data',()=>{
  expect(readReality(reality())).not.toBeNull();
  expect(readReality({...reality(),trackingStatus:'LIMITED'})).toBeNull();
  expect(readReality({...reality(),intrinsics:Array(16).fill(0)})).toBeNull();
  expect(readReality({...reality(),position:{x:NaN,y:0,z:0}})).toBeNull();
});
it('retains timestamped rejected frames while rejecting image payloads and nonfinite data',()=>{
  const batch={configSha256:'a'.repeat(64),seq:0,events:[{t:10,kind:'frame',label:'LIMITED',values:[0,428,781]}]};
  expect(validateLiveBatch(batch).events[0].label).toBe('LIMITED');
  expect(()=>validateLiveBatch({...batch,image:'private'})).toThrow();
  expect(()=>validateLiveBatch({...batch,events:[{...batch.events[0],values:[NaN]}]})).toThrow();
});
