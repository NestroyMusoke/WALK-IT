import {settings} from './settings';
type GateMargins=Record<string,number>;
export type WindowSelection={totalObservationCount?:number;candidateWindowCount?:number;
 passingWindowCount?:number;selectedObservationCount?:number|null;
 discardedLeadingObservationCount?:number;gateMargins?:GateMargins;reasonSource?:string};
export type Metrics={maxOrientationDisagreementDeg?:number;markerBaselineM?:number;
 maxPairwiseScaleDisagreementFraction?:number;maxRelativeResidual?:number;
 panelCount?:number;windowSelection?:WindowSelection};
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
/** The opening instruction, so the stance is stated before anything has been refused. */
export function markerStanceInstruction(){
 if(!(settings.MARKER_PANEL_COUNT>1))
  return 'Take real sideways steps, about half a metre, with the marker visible until the live window passes. Leaning or turning in place does not count.';
 return 'Face the crease of the folded target so BOTH sheets show at once, 0.7 to 1.0 m away, then take real sideways steps of about half a metre while they stay in view. Leaning or turning in place does not count.';
}
/** A folded target solves jointly only with every panel in frame. One panel seen from the
 *  crease is exactly today's ambiguous square, so the stance is said first and always. */
function stanceHint(metrics:Metrics){
 if(!(settings.MARKER_PANEL_COUNT>1))return '';
 const seen=metrics.panelCount;
 if(typeof seen==='number'&&Number.isFinite(seen)&&seen>=settings.MARKER_PANEL_COUNT)return '';
 return `Stand at the fold, not square-on to it: face the crease so BOTH sheets show at once`+
  `${typeof seen==='number'?` (only ${seen} visible now)`:''}, about 0.7 to 1.0 m away. `;
}
export function coachMarkerPreflight(reason:string,metrics:Metrics){
 const progress=calibrationProgress(metrics),stance=stanceHint(metrics);
 const coaching:Record<string,string>={
  'inconsistent-marker-orientation':'Stand to one side of the sheet and aim at it from an angle, then move in one smooth direction. Head-on views and settling tracking both corrupt the measured tilt.',
  'insufficient-metric-baseline':'Move your whole body, not just the phone: take real steps sideways about half a metre while the sheet stays in view. Leaning or turning in place does not count.',
  'insufficient-tracker-baseline':'Each view must come from a different spot. Take proper steps between views instead of swaying your arms.',
  'marker-not-found':'Point at the printed marker and hold it in view, fully lit and unobstructed.',
  'marker-too-small':'Move closer: about 0.7 to 1.0 m from the fold.',
  'marker-too-far':'Move closer: about 0.7 to 1.0 m from the fold.',
  'planar-ambiguous':'One sheet seen square-on has two equally good poses, so it is refused. Face the crease at an angle instead of head-on.',
  'insufficient-marker-panels':'Both printed sheets must be in frame at the same time. Back up slightly and turn to face the crease.',
  'coplanar-target-ambiguous':'The two sheets must be FOLDED, not laid flat side by side. Tape them at the white border and fold to 90 degrees: a flat pair carries the same ambiguity as a single sheet and is refused.',
  'high-reprojection-error':'Hold the phone still and steady, keep both sheets sharp, and avoid tilting it sideways.',
  'pnp-failed':'Move a little closer and hold the phone steady until both sheets are sharp.',
  'inconsistent-scale':'Keep the phone upright and move in one smooth direction at a steady pace. Avoid curving back and forth.',
  'insufficient-observations':'Keep the marker in view and keep stepping; more views are being collected.'};
 return `${stance}${coaching[reason]||`Keep the marker visible and continue scanning (${reason}).`}${progress?` ${progress}`:''}`;
}
