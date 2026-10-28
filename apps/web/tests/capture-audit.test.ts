import {it,expect} from 'vitest';
import {summarizeTrajectory} from '../../../server/capture-audit';
it('reports timing and tracker distances without calling them metres or authorizing navigation',()=>{
 const r=summarizeTrajectory([[0,0,0],[3,0,0],[3,0,4]],[10,1010,2010]);
 expect(r.pathLengthTrackerUnits).toBe(7);expect(r.endpointDistanceTrackerUnits).toBe(5);
 expect(r.durationMs).toBe(2000);expect(r.navigationReady).toBe(false);
});
it('rejects mismatched, reversed or nonfinite trajectory evidence',()=>{
 expect(()=>summarizeTrajectory([[0,0,0],[1,0,0]],[1])).toThrow();
 expect(()=>summarizeTrajectory([[0,0,0],[1,0,0]],[1,0])).toThrow();
 expect(()=>summarizeTrajectory([[0,0,0],[NaN,0,0]],[0,1])).toThrow();
});
