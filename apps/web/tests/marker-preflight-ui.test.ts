import {expect,it} from 'vitest';
import {calibrationProgress,coachMarkerPreflight,markerStanceInstruction} from '../src/marker-preflight-ui';
import {settings} from '../src/settings';

it('coaches the binding live calibration reason with measured numbers',()=>{
 expect(coachMarkerPreflight('inconsistent-marker-orientation',{maxOrientationDisagreementDeg:22.4})).toContain('22.4°');
 expect(coachMarkerPreflight('insufficient-metric-baseline',{markerBaselineM:0.31})).toContain('0.31 m');
 expect(coachMarkerPreflight('marker-too-far',{})).toContain('Move closer');
 expect(coachMarkerPreflight('planar-ambiguous',{})).toContain('square-on');
});
it('coaches real body translation because the baseline is measured in the marker frame',()=>{
 const coach=coachMarkerPreflight('insufficient-metric-baseline',{markerBaselineM:0.04});
 expect(coach).toContain('whole body');
 expect(coach).not.toMatch(/sway wider/i);
 expect(coach).toContain('0.04 m');
 expect(coachMarkerPreflight('insufficient-tracker-baseline',{})).toContain('different spot');
 expect(coachMarkerPreflight('marker-not-found',{})).toContain('printed marker');
});
it('reads each measured gate against its own configured budget',()=>{
 const progress=calibrationProgress({markerBaselineM:0.481,maxOrientationDisagreementDeg:12.46});
 expect(progress).toContain(`span 0.48 m of ${settings.ANCHOR_MIN_START_BASELINE_M.toFixed(2)} m`);
 expect(progress).toContain(`spread 12.5° of ${settings.ANCHOR_MAX_ORIENTATION_DISAGREEMENT_DEG.toFixed(1)}° ✗`);
 expect(progress).not.toContain('views buffered');
});
it('names the tightest gate from the miner margins so the user knows what to change',()=>{
 const near=calibrationProgress({markerBaselineM:0.481,maxOrientationDisagreementDeg:12.46,
  windowSelection:{totalObservationCount:8,selectedObservationCount:5,discardedLeadingObservationCount:3,
   gateMargins:{metricBaseline:1.20,orientation:0.80,pairwiseScale:2.5}}});
 expect(near).toContain('5 of 8 views kept');
 expect(near).toContain('3 early views set aside');
 expect(near).toContain('tightest gate spread 1.25× over budget');
 const passing=calibrationProgress({markerBaselineM:0.62,maxOrientationDisagreementDeg:4.1,
  windowSelection:{totalObservationCount:6,selectedObservationCount:6,
   gateMargins:{metricBaseline:1.55,orientation:2.44}}});
 expect(passing).toContain('tightest gate span 1.55× margin');
 expect(passing).not.toContain('over budget');
});
it('never invents progress when the refusal came before any alignment window',()=>{
 expect(calibrationProgress({})).toBe('');
 expect(coachMarkerPreflight('marker-too-small',{panelCount:settings.MARKER_PANEL_COUNT}))
  .toBe('Move closer: about 0.7 to 1.0 m from the fold.');
});
it('says the folded stance first, because one visible sheet is exactly the ambiguous square',()=>{
 expect(settings.MARKER_PANEL_COUNT).toBeGreaterThan(1);
 expect(markerStanceInstruction()).toContain('BOTH sheets');
 expect(markerStanceInstruction()).toContain('crease');
 // Every panel in frame: no stance nagging, only the reason's own coaching.
 expect(coachMarkerPreflight('insufficient-observations',{panelCount:settings.MARKER_PANEL_COUNT}))
  .not.toContain('crease');
 // One panel short: the stance leads, whatever the refusal reason was.
 for(const reason of ['marker-not-found','planar-ambiguous','insufficient-marker-panels','inconsistent-scale']){
  const coach=coachMarkerPreflight(reason,{panelCount:1});
  expect(coach.startsWith('Stand at the fold')).toBe(true);
  expect(coach).toContain('only 1 visible now');
 }
 // No panel count at all - a refusal raised before any detection - still gets the stance.
 expect(coachMarkerPreflight('marker-not-found',{})).toContain('Stand at the fold');
});
it('refuses a flat pair in words, because a flat pair is refused in code',()=>{
 const coach=coachMarkerPreflight('coplanar-target-ambiguous',{panelCount:settings.MARKER_PANEL_COUNT});
 expect(coach).toContain('FOLDED, not laid flat');
 expect(coach).toContain(`${settings.MARKER_FOLD_ANGLE_DEG} degrees`);
 expect(coach).not.toContain('Stand at the fold');
});
