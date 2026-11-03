import {settings} from './settings';
type GateMargins=Record<string,number>;
export type WindowSelection={totalObservationCount?:number;candidateWindowCount?:number;
 passingWindowCount?:number;selectedObservationCount?:number|null;
 discardedLeadingObservationCount?:number;gateMargins?:GateMargins;reasonSource?:string};
export type Metrics={maxOrientationDisagreementDeg?:number;markerBaselineM?:number;
 maxPairwiseScaleDisagreementFraction?:number;maxRelativeResidual?:number;
 windowSelection?:WindowSelection};
const GATE_NAMES:Record<string,string>={metricBaseline:'span',orientation:'spread',
 pairwiseScale:'scale',relativeResidual:'fit'};
function budgetLine(label:string,value:number|undefined,budget:number,unit:string,digits:number,percent=false){
 if(typeof value!=='number'||!Number.isFinite(value)||typeof budget!=='number'||!Number.isFinite(budget)||budget<=0)return null;
 const shown=percent?value*100:value,allowed=percent?budget*100:budget;
 const ok=unit===' m'?shown>=allowed:shown<=allowed;
 return `${label} ${shown.toFixed(digits)}${unit} of ${allowed.toFixed(digits)}${unit}${ok?'':' ✗'}`;
}
/** Measured progress against the untouched gate budgets, so a refusal says what to change. */
export function calibrationProgress(metrics:Metrics){
 const selection=metrics.windowSelection,lines:string[]=[];
 for(const line of [
  budgetLine('span',metrics.markerBaselineM,settings.ANCHOR_MIN_START_BASELINE_M,' m',2),
  budgetLine('spread',metrics.maxOrientationDisagreementDeg,settings.ANCHOR_MAX_ORIENTATION_DISAGREEMENT_DEG,'°',1),
  budgetLine('scale',metrics.maxPairwiseScaleDisagreementFraction,settings.ANCHOR_MAX_PAIRWISE_SCALE_DISAGREEMENT_FRACTION,'%',1,true),
  budgetLine('fit',metrics.maxRelativeResidual,settings.ALIGNMENT_MAX_RELATIVE_RESIDUAL,'%',1,true)])
  if(line)lines.push(line);
 if(!selection)return lines.join(' · ');
 const kept=selection.selectedObservationCount;
 lines.push(typeof kept==='number'?`${kept} of ${selection.totalObservationCount??kept} views kept`:
  `${selection.totalObservationCount??0} views buffered`);
 if(selection.discardedLeadingObservationCount)
  lines.push(`${selection.discardedLeadingObservationCount} early views set aside`);
 const margins=Object.entries(selection.gateMargins||{}).filter(([,margin])=>Number.isFinite(margin));
 if(margins.length){
  const [name,margin]=margins.reduce((worst,next)=>(next[1]<worst[1]?next:worst));
  lines.push(margin<1?`tightest gate ${GATE_NAMES[name]||name} ${(1/margin).toFixed(2)}× over budget`:
   `tightest gate ${GATE_NAMES[name]||name} ${margin.toFixed(2)}× margin`);
 }
 return lines.join(' · ');
}
export function coachMarkerPreflight(reason:string,metrics:Metrics){
 const progress=calibrationProgress(metrics);
 const coaching:Record<string,string>={
  'inconsistent-marker-orientation':'Stand to one side of the sheet and aim at it from an angle, then move in one smooth direction. Head-on views and settling tracking both corrupt the measured tilt.',
  'insufficient-metric-baseline':'Move your whole body, not just the phone: take real steps sideways about half a metre while the sheet stays in view. Leaning or turning in place does not count.',
  'insufficient-tracker-baseline':'Each view must come from a different spot. Take proper steps between views instead of swaying your arms.',
  'marker-not-found':'Point at the printed marker and hold it in view.',
  'marker-too-small':'Move closer to the marker.',
  'marker-too-far':'Move closer to the marker.',
  'planar-ambiguous':'Tilt the phone or stand to one side so the marker is not head-on.',
  'inconsistent-scale':'Keep the phone upright and move in one smooth direction at a steady pace. Avoid curving back and forth.',
  'insufficient-observations':'Keep the marker in view and keep stepping; more views are being collected.'};
 return `${coaching[reason]||`Keep the marker visible and continue scanning (${reason}).`}${progress?` ${progress}`:''}`;
}
