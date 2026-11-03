import {expect,it} from 'vitest';
import {coachMarkerPreflight} from '../src/marker-preflight-ui';

it('coaches the binding live calibration reason with measured numbers',()=>{
 expect(coachMarkerPreflight('inconsistent-marker-orientation',{maxOrientationDisagreementDeg:22.4})).toContain('22.4°');
 expect(coachMarkerPreflight('insufficient-metric-baseline',{markerBaselineM:0.31})).toContain('0.31 m');
 expect(coachMarkerPreflight('marker-too-far',{})).toContain('Move closer');
 expect(coachMarkerPreflight('planar-ambiguous',{})).toContain('Tilt');
});
