import {expect,it} from 'vitest';
import {PerspectiveCamera} from 'three';
import {makeMarkerScanRequest,makeAuthorMarkerCheckRequest} from '../src/marker-scan-client';

const projection=new PerspectiveCamera(60,1,0.01,1000).projectionMatrix.toArray();
const sample={t:1000,videoTime:1,revision:1,tracking:true,width:640,height:480,
 rgba:new Uint8ClampedArray(640*480*4),
 frame:{position:[1,2,3],rotation:[0,0,0,1],projection}};
it('binds a reviewed camera image to its same-frame pose and calibration',()=>{
 const request=makeMarkerScanRequest(sample,'AA==','a'.repeat(64),'b'.repeat(48),'v0',1100,true);
 expect(request.trackerPosition).toEqual([1,2,3]);
 expect(request.frameAtPhoneMs).toBe(1000);
 expect(request.intrinsics).toHaveLength(9);
 expect(request.privacyReviewed).toBe(true);
 expect(request.imageJpegBase64).toBe('AA==');
});
it('refuses stale frame or missing privacy review',()=>{
 expect(()=>makeMarkerScanRequest(sample,'AA==','a'.repeat(64),'b'.repeat(48),'v0',2000,true)).toThrow();
 expect(()=>makeMarkerScanRequest(sample,'AA==','a'.repeat(64),'b'.repeat(48),'v0',1100,false)).toThrow();
});
it('prechecks the author marker from a fresh reviewed frame without a visitor route',()=>{
 const request=makeAuthorMarkerCheckRequest(sample,'AA==','a'.repeat(64),'pre0',1100,true);
 expect(request).not.toHaveProperty('routeToken');
 expect(request.frameAtPhoneMs).toBe(1000);
 expect(()=>makeAuthorMarkerCheckRequest(sample,'AA==','a'.repeat(64),'pre0',2000,true)).toThrow();
});
