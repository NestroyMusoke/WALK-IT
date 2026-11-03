import {settings} from './settings';

type DriftState={accepted:boolean;reason:string;travelledM:number;estimatedDriftBoundM:number};
const validPoint=(value:number[])=>Array.isArray(value)&&value.length===3&&value.every(Number.isFinite);

/** Predeclared travel-based uncertainty proxy. It cannot observe actual VIO drift. */
export class VioDriftBudget{
 private last:number[];
 private travelled=0;
 private revoked=false;
 constructor(private trackerUnitsPerMetre:number,startTrackerPosition:number[]){
  if(!Number.isFinite(trackerUnitsPerMetre)||trackerUnitsPerMetre<=0||!validPoint(startTrackerPosition))
   throw Error('Valid marker-calibrated tracker scale and position required');
  this.last=[...startTrackerPosition];
 }
 get state():DriftState{
  const estimatedDriftBoundM=settings.VIO_DRIFT_START_BOUND_M+
   this.travelled*settings.VIO_DRIFT_RATE_M_PER_M;
  return {accepted:!this.revoked&&estimatedDriftBoundM<=settings.VIO_DRIFT_BUDGET_M,
   reason:this.revoked?'revoked':estimatedDriftBoundM>settings.VIO_DRIFT_BUDGET_M?
    'drift-budget-exhausted':'within-predeclared-budget-proxy',
   travelledM:this.travelled,estimatedDriftBoundM};
 }
 update(trackerPosition:number[],trackingStatus:string):DriftState{
  if(this.revoked)return this.state;
  if(trackingStatus!=='NORMAL'||!validPoint(trackerPosition)){
   this.revoked=true;return {...this.state,reason:'tracking-lost'};
  }
  const stepM=Math.hypot(...trackerPosition.map((v,i)=>v-this.last[i]))/this.trackerUnitsPerMetre;
  if(!Number.isFinite(stepM)||stepM>settings.VIO_MAX_FRAME_STEP_M){
   this.revoked=true;return {...this.state,reason:'tracker-jump'};
  }
  this.last=[...trackerPosition];this.travelled+=stepM;
  const state=this.state;
  if(!state.accepted){this.revoked=true;return {...state,reason:'drift-budget-exhausted'};}
  return state;
 }
}
