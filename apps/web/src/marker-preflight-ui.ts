type Metrics={maxOrientationDisagreementDeg?:number;markerBaselineM?:number;maxPairwiseScaleDisagreementFraction?:number};
export function coachMarkerPreflight(reason:string,metrics:Metrics){
 const values=[Number.isFinite(metrics.maxOrientationDisagreementDeg)?`spread ${metrics.maxOrientationDisagreementDeg!.toFixed(1)}°`:null,
  Number.isFinite(metrics.markerBaselineM)?`span ${metrics.markerBaselineM!.toFixed(2)} m`:null,
  Number.isFinite(metrics.maxPairwiseScaleDisagreementFraction)?`scale disagreement ${(100*metrics.maxPairwiseScaleDisagreementFraction!).toFixed(1)}%`:null]
  .filter(Boolean).join(' · ');
 const coaching:Record<string,string>={
  'inconsistent-marker-orientation':'Hold steady; the tracker is still settling. Keep swaying gently.',
  'insufficient-metric-baseline':'Sway wider, side to side, while keeping the marker visible.',
  'insufficient-tracker-baseline':'Sway wider, side to side, while keeping the marker visible.',
  'marker-too-small':'Move closer to the marker.',
  'marker-too-far':'Move closer to the marker.',
  'planar-ambiguous':'Tilt the phone slightly so the marker is not head-on.',
  'inconsistent-scale':'Keep swaying gently; tracker scale is still settling.'};
 return `${coaching[reason]||`Keep the marker visible and continue scanning (${reason}).`}${values?` ${values}`:''}`;
}
