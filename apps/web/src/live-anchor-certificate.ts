import {settings} from './settings';
import type {VerifiedAnchor} from './route-arrow';

type RouteIdentity={routeId:string;sourceCaptureSha256:string;configSha256:string};
type Fit=Partial<VerifiedAnchor>&{markerObservationCount?:number;reason?:string;maxRelativeResidual?:number;
 markerBaselineM?:number;maxOrientationDisagreementDeg?:number;maxPairwiseScaleDisagreementFraction?:number};
const sha=(value:unknown)=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const point=(value:unknown)=>Array.isArray(value)&&value.length===3&&value.every(Number.isFinite);
function validTransform(value:unknown){
 const t=value as VerifiedAnchor['routeToSession'];
 return t?.direction==='map-to-session'&&Number.isFinite(t.scale)&&t.scale>0&&
  Array.isArray(t.rotation)&&t.rotation.length===9&&t.rotation.every(Number.isFinite)&&point(t.translation);
}

/** Only a fresh, server-bound OpenCV fit can issue a live geometry certificate. */
export function buildLiveAnchor(route:RouteIdentity,fit:Fit,trackingStatus:string,nowMs:number,
 measuredFieldGate?:{routeId:string;sourceCaptureSha256:string;configSha256:string;endErrorM:number;evidenceSha256:string}):VerifiedAnchor|null{
 if(trackingStatus!=='NORMAL'||fit.accepted!==true||fit.ambiguous!==false||
  fit.routeId!==route.routeId||fit.sourceCaptureSha256!==route.sourceCaptureSha256||
  fit.configSha256!==route.configSha256||!sha(fit.configSha256)||!sha(fit.sourceCaptureSha256)||
  !/^5\./.test(fit.opencvVersion||'')||
  !Number.isSafeInteger(fit.markerObservationCount)||fit.markerObservationCount!<settings.ALIGNMENT_MIN_PAIRS_COUNT||
  !Number.isFinite(fit.markerBaselineM)||fit.markerBaselineM!<settings.ANCHOR_MIN_START_BASELINE_M||
  !Number.isFinite(fit.maxOrientationDisagreementDeg)||fit.maxOrientationDisagreementDeg!>settings.ANCHOR_MAX_ORIENTATION_DISAGREEMENT_DEG||
  !Number.isFinite(fit.maxPairwiseScaleDisagreementFraction)||fit.maxPairwiseScaleDisagreementFraction!>settings.ANCHOR_MAX_PAIRWISE_SCALE_DISAGREEMENT_FRACTION||
  !Number.isFinite(fit.maxRelativeResidual)||fit.maxRelativeResidual!>settings.ALIGNMENT_MAX_RELATIVE_RESIDUAL||
  !Number.isFinite(fit.sourceFrameAtPhoneMs)||!Number.isFinite(nowMs)||
  nowMs-fit.sourceFrameAtPhoneMs!<0||nowMs-fit.sourceFrameAtPhoneMs!>settings.ALIGNMENT_WINDOW_MAX_AGE_MS||
  !point(fit.startTrackerPosition)||!validTransform(fit.routeToSession))return null;
 const fieldGatePassed=Boolean(measuredFieldGate&&measuredFieldGate.routeId===route.routeId&&
  measuredFieldGate.sourceCaptureSha256===route.sourceCaptureSha256&&measuredFieldGate.configSha256===route.configSha256&&
  sha(measuredFieldGate.evidenceSha256)&&Number.isFinite(measuredFieldGate.endErrorM)&&
  measuredFieldGate.endErrorM>=0&&measuredFieldGate.endErrorM<=settings.ROUTE_END_ERROR_BUDGET_M);
 return {accepted:true,ambiguous:false,opencvVersion:fit.opencvVersion!,routeId:route.routeId,
  sourceCaptureSha256:route.sourceCaptureSha256,configSha256:route.configSha256,
  sourceFrameAtPhoneMs:fit.sourceFrameAtPhoneMs!,startTrackerPosition:[...fit.startTrackerPosition!],
  routeToSession:structuredClone(fit.routeToSession!),mode:'marker-vio',estimatedDriftBoundM:settings.VIO_DRIFT_START_BOUND_M,
  metricScaleVerified:true,navigationReady:true,arrowAuthorized:true,fieldGatePassed};
}
