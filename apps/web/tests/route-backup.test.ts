import {expect,it} from 'vitest';
import {makePrivateRouteBackup,parsePrivateRouteBackup} from '../src/route-backup';
import {HostCapture} from '../src/host-capture';
import {PerspectiveCamera} from 'three';
import {validateCapture} from '../../../server/capture-schema';

const sha='a'.repeat(64);
const capture={manifest:{configSha256:sha},images:[],timing:[]};
const diagnostic={configSha256:sha,events:[{t:5,kind:'step',label:'mark-2m',values:[5,2,1,0,0]}]};

it('keeps mark events in the same private download as the reviewed route',()=>{
 const backup=makePrivateRouteBackup(capture,diagnostic);
 expect(backup.schemaVersion).toBe(2);
 expect(backup.diagnostic.events[0].label).toBe('mark-2m');
 expect(parsePrivateRouteBackup(backup).capture).toEqual(capture);
});

it('rejects secrets and mismatched configuration, while reading older route-only backups',()=>{
 expect(()=>makePrivateRouteBackup(capture,{...diagnostic,token:'secret'})).toThrow();
 expect(()=>makePrivateRouteBackup(capture,{...diagnostic,configSha256:'b'.repeat(64)})).toThrow();
 expect(parsePrivateRouteBackup(capture)).toEqual({capture,diagnostic:null});
});

it('recovers a complete reviewed route and mark taps after offline download',()=>{
 const host=new HostCapture('offline-route',sha,true);host.start();
 for(let i=0;i<2;i++)host.offer({t:i*1000,videoTime:i,revision:1,tracking:true,width:1,height:1,rgba:new Uint8ClampedArray(4),frame:{position:[i,0,0],rotation:[0,0,0,1],projection:new PerspectiveCamera().projectionMatrix.toArray()}},i*1000);
 host.finish();host.review('kf0',[]);host.review('kf1',[]);
 const reviewed=host.exportReviewed();
 const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0u8AAAAASUVORK5CYII=';
 const report={...reviewed,images:reviewed.images.map(frame=>({id:frame.id,png}))};
 const saved=JSON.parse(JSON.stringify(makePrivateRouteBackup(report,diagnostic)));
 const recovered=parsePrivateRouteBackup(saved);
 expect(validateCapture(recovered.capture,{HOST_MAX_KEYFRAMES_COUNT:60,HOST_IMAGE_MAX_EDGE_PX:640,QUATERNION_NORM_TOLERANCE:.01}).images).toHaveLength(2);
 expect(recovered.diagnostic?.events.map(event=>event.label)).toEqual(['mark-2m']);
 expect(JSON.stringify(saved)).not.toContain('token');
});
it('retains visitor start-scan purpose in a private evidence backup',()=>{
 const visitor={...capture,purpose:'visitor-start-scan'};
 const backup=makePrivateRouteBackup(visitor,diagnostic);
 expect(parsePrivateRouteBackup(backup).capture.purpose).toBe('visitor-start-scan');
});
