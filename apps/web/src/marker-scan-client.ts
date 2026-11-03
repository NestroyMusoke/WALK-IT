import {imageIntrinsics,type CaptureSample} from './host-capture';
import {settings} from './settings';

/** Explicit operator-reviewed frame only. The image is never persisted by this request. */
function markerFrame(sample:CaptureSample,imageJpegBase64:string,
 configSha256:string,frameId:string,nowMs:number,reviewedNoPeopleOrPlates:boolean){
 if(!reviewedNoPeopleOrPlates||!sample.tracking||
  !Number.isFinite(nowMs)||nowMs-sample.t<0||nowMs-sample.t>settings.MARKER_MAX_AGE_MS||
  !/^[a-f0-9]{64}$/.test(configSha256)||
  !/^[a-zA-Z0-9_-]{1,64}$/.test(frameId)||
  typeof imageJpegBase64!=='string'||!imageJpegBase64||
  imageJpegBase64.length>settings.E05_IMAGE_MAX_INPUT_BYTES*2)throw Error('Marker frame stale, unreviewed or invalid');
 return {configSha256,privacyReviewed:true,frameId,
  frameAtPhoneMs:sample.t,videoTime:sample.videoTime,
  trackerPosition:[...sample.frame.position],trackerRotation:[...sample.frame.rotation],
  width:sample.width,height:sample.height,
  intrinsics:imageIntrinsics(sample.frame.projection,sample.width,sample.height),
  imageJpegBase64};
}
export function makeMarkerScanRequest(sample:CaptureSample,imageJpegBase64:string,
 configSha256:string,routeToken:string,frameId:string,nowMs:number,reviewedNoPeopleOrPlates:boolean){
 if(!/^[a-f0-9]{48}$/.test(routeToken))throw Error('Invalid private route token');
 return {routeToken,...markerFrame(sample,imageJpegBase64,configSha256,frameId,nowMs,reviewedNoPeopleOrPlates)};
}
export function makeAuthorMarkerCheckRequest(sample:CaptureSample,imageJpegBase64:string,
 configSha256:string,frameId:string,nowMs:number,reviewedNoPeopleOrPlates:boolean,authorSessionId:string){
 if(!/^[a-zA-Z0-9_-]{8,64}$/.test(authorSessionId))throw Error('Invalid author calibration session');
 return {authorSessionId,...markerFrame(sample,imageJpegBase64,configSha256,frameId,nowMs,reviewedNoPeopleOrPlates)};
}
