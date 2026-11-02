import {selectRouteArrow,type AuthorizedRouteArrow,type VerifiedAnchor} from './route-arrow';
import type {CameraFrame} from './display';
import {validateRouteBundle,type RouteBundle} from './route-bundle';
import {settings} from './settings';

/** Holds only a candidate installed by a trusted localization flow. Loss revokes it. */
export class GuidanceRuntime{
 private route:RouteBundle|undefined;
 private anchor:VerifiedAnchor|undefined;
 private pathIndex=0;
 private guidanceStatus:'awaiting-verification'|'following'|'paused'='awaiting-verification';
 get status(){return this.guidanceStatus;}

 install(inputRoute:RouteBundle,anchor:VerifiedAnchor,pathIndex:number){
  this.clear();
  const route=validateRouteBundle(inputRoute);
  if(route.source!=='captured'||route.units!=='metres'||route.scaleVerified!==true||
   !anchor||anchor.routeId!==route.routeId||anchor.accepted!==true||anchor.ambiguous!==false||
   anchor.metricScaleVerified!==true||anchor.navigationReady!==true||anchor.arrowAuthorized!==true||
   !/^5\./.test(anchor.opencvVersion)||!Number.isSafeInteger(pathIndex)||pathIndex<0||pathIndex+1>=route.path.length)
   throw Error('Verified route and matching OpenCV anchor required');
  this.route=route;this.anchor=structuredClone(anchor);this.pathIndex=pathIndex;
  this.guidanceStatus='awaiting-verification';
 }

 clear(){if(this.route||this.guidanceStatus==='following')this.guidanceStatus='paused';this.route=undefined;this.anchor=undefined;this.pathIndex=0;}

 read(frame:CameraFrame,trackingStatus:string,nowMs:number,frameMs:number,cssWidth:number,cssHeight:number):AuthorizedRouteArrow|null{
  if(!this.route||!this.anchor)return null;
  const trackerAge=nowMs-frameMs,geometryAge=nowMs-this.anchor.sourceFrameAtPhoneMs;
  if(trackingStatus!=='NORMAL'||!Number.isFinite(trackerAge)||trackerAge<0||trackerAge>settings.MARKER_MAX_AGE_MS||
   !Number.isFinite(geometryAge)||geometryAge<0||geometryAge>settings.VERIFY_MAX_GEOMETRY_AGE_MS){this.clear();return null;}
  const arrow=selectRouteArrow({route:this.route,anchor:this.anchor,frame,nowMs,frameMs,trackingStatus,
   pathIndex:this.pathIndex,cssWidth,cssHeight});
  this.guidanceStatus=arrow?'following':'paused';
  return arrow;
 }
}
