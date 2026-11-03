import {selectRouteArrow,type AuthorizedRouteArrow,type VerifiedAnchor,type MetricPath} from './route-arrow';
import type {CameraFrame} from './display';
import {validateRouteBundle,type RouteBundle} from './route-bundle';
import {settings} from './settings';
import {routeProgress} from './route-progress';
import {VioDriftBudget} from './vio-drift';
import {parseVisitorRoute,type VisitorRoute} from './visitor-route';

/** Holds only a candidate installed by a trusted localization flow. Loss revokes it. */
export class GuidanceRuntime{
 private route:RouteBundle|MetricPath|undefined;
 private anchor:VerifiedAnchor|undefined;
 private vioDrift:VioDriftBudget|undefined;
 private pathIndex=0;
 private guidanceStatus:'awaiting-verification'|'following'|'paused'='awaiting-verification';
 get status(){return this.guidanceStatus;}
 get segmentIndex(){return this.route?this.pathIndex:null;}

 install(inputRoute:RouteBundle,anchor:VerifiedAnchor,pathIndex:number){
  this.clear();
  const route=validateRouteBundle(inputRoute);
  if(route.source!=='captured'||route.units!=='metres'||route.scaleVerified!==true||
   !anchor||anchor.routeId!==route.routeId||anchor.accepted!==true||anchor.ambiguous!==false||
   anchor.metricScaleVerified!==true||anchor.navigationReady!==true||anchor.arrowAuthorized!==true||
   anchor.mode!=='marker-vio'||anchor.fieldGatePassed!==true||!anchor.startTrackerPosition||
   !/^5\./.test(anchor.opencvVersion)||!Number.isSafeInteger(pathIndex)||pathIndex<0||pathIndex+1>=route.path.length)
   throw Error('Verified route and matching OpenCV anchor required');
  this.vioDrift=new VioDriftBudget(anchor.routeToSession.scale,anchor.startTrackerPosition);
  this.route=route;this.anchor=structuredClone(anchor);this.pathIndex=pathIndex;
  this.guidanceStatus='awaiting-verification';
 }

 /** The browser route candidate becomes navigable only with a matching field-qualified certificate. */
 installMarkerPath(inputRoute:VisitorRoute,anchor:VerifiedAnchor,nowMs:number){
  this.clear();
  const route=parseVisitorRoute(inputRoute,nowMs);
  if(anchor.mode!=='marker-vio'||
   anchor.accepted!==true||anchor.ambiguous!==false||!/^5\./.test(anchor.opencvVersion)||
   anchor.metricScaleVerified!==true||anchor.navigationReady!==true||anchor.arrowAuthorized!==true||
   anchor.routeId!==route.routeId||anchor.configSha256!==route.configSha256||
   anchor.sourceCaptureSha256!==route.sourceCaptureSha256||!anchor.startTrackerPosition)
   throw Error('Matching field-qualified marker certificate required');
  const metricRoute:MetricPath={source:'captured',units:'metres',scaleVerified:true,
   routeId:route.routeId,configSha256:route.configSha256,
   path:route.path.map(p=>({keyframeId:p.keyframeId,position:[...p.position]})),
   destination:{...route.destination}};
  this.vioDrift=new VioDriftBudget(anchor.routeToSession.scale,anchor.startTrackerPosition);
  this.route=metricRoute;this.anchor=structuredClone(anchor);this.pathIndex=0;
  this.guidanceStatus='awaiting-verification';
 }

 clear(){if(this.route||this.guidanceStatus==='following')this.guidanceStatus='paused';this.route=undefined;this.anchor=undefined;this.vioDrift=undefined;this.pathIndex=0;}

 read(frame:CameraFrame,trackingStatus:string,nowMs:number,frameMs:number,cssWidth:number,cssHeight:number):AuthorizedRouteArrow|null{
  if(!this.route||!this.anchor)return null;
  const trackerAge=nowMs-frameMs;
  if(trackingStatus!=='NORMAL'||!Number.isFinite(trackerAge)||trackerAge<0||trackerAge>settings.MARKER_MAX_AGE_MS||
   !this.vioDrift){this.clear();return null;}
  const drift=this.vioDrift.update(frame.position,trackingStatus);
  if(!drift.accepted){this.clear();return null;}
  this.anchor.estimatedDriftBoundM=drift.estimatedDriftBoundM;
  const progress=routeProgress(this.route.path.map(p=>p.position),this.anchor.routeToSession,frame.position,this.pathIndex);
  if(!progress.accepted){this.clear();return null;}
  this.pathIndex=progress.pathIndex;
  const arrow=selectRouteArrow({route:this.route,anchor:this.anchor,frame,nowMs,frameMs,trackingStatus,
   pathIndex:this.pathIndex,cssWidth,cssHeight});
  this.guidanceStatus=arrow?'following':'paused';
  return arrow;
 }
}
