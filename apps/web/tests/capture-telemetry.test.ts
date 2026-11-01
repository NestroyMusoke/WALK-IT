import {expect,it} from 'vitest';
import {medianWorldPointDepth,serializeSdkCall} from '../src/capture-telemetry';

it('preserves exact SDK call args and call times in a parsable receipt',()=>{
 const record=serializeSdkCall('configure',{scale:'absolute',enableWorldPoints:true},12,40);
 expect(JSON.parse(record.label)).toEqual({method:'configure',args:{scale:'absolute',enableWorldPoints:true}});
 expect(record.values).toEqual([12,-28]);
});

it('measures median forward depth of valid world points without recording their coordinates',()=>{
 const camera={position:[0,0,0],rotation:[0,0,0,1]};
 const points=[{position:{x:0,y:0,z:-1}},{position:{x:0,y:1,z:-3}},{position:{x:0,y:0,z:-5}},{position:{x:0,y:0,z:2}}];
 expect(medianWorldPointDepth(points,camera)).toEqual({count:4,validDepthCount:3,medianDepth:3});
 const turned={position:[0,0,0],rotation:[0,Math.SQRT1_2,0,Math.SQRT1_2]};
 expect(medianWorldPointDepth([{position:{x:-3,y:0,z:0}}],turned).medianDepth).toBeCloseTo(3);
});
