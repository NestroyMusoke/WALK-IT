import {XR8Promise} from '@8thwall/engine-binary';
import {prepareSdk} from './sdk';
import {settings} from './settings';
import {ViewportCalibration,DiagnosticAnchor,projectReference,type CameraFrame} from './display';
import {ReferenceRenderer} from './reference-renderer';
import {readReality} from './tracker';
import {LiveUpload} from './live-upload';
import {CaptureUI} from './capture-ui';
import {viewportCoversCanvas} from './capture-frame';
import {medianWorldPointDepth,serializeSdkCall} from './capture-telemetry';
import {GuidanceRuntime} from './guidance-runtime';
import './live.css';
type Pipeline=Record<string,unknown>;
type LiveSdk={initialize:()=>Promise<void>;run:(options:Record<string,unknown>)=>void;stop:()=>void;clearCameraPipelineModules:()=>void;addCameraPipelineModules:(modules:Pipeline[])=>void;
  GlTextureRenderer:{pipelineModule:()=>Pipeline;getGLctxParameters:(gl:WebGL2RenderingContext,units:number[])=>unknown;setGLctxParameters:(gl:WebGL2RenderingContext,state:unknown)=>void};
  XrController:{configure:(options:Record<string,unknown>)=>void;pipelineModule:()=>Pipeline;updateCameraProjectionMatrix:(options:Record<string,unknown>)=>void;hitTest:(x:number,y:number,types:string[])=>{position:{x:number;y:number;z:number};type:string;distance:number}[]}};
const el=(id:string)=>document.getElementById(id)!;
const button=(id:string)=>el(id) as HTMLButtonElement;
const canvas=el('camera') as HTMLCanvasElement;
const calibration=new ViewportCalibration(),anchor=new DiagnosticAnchor();
const guidance=new GuidanceRuntime();
function showGuidanceStatus(){
 const message=guidance.status==='following'?'Following the verified route. Keep walking and watching your surroundings.':
  guidance.status==='paused'?'Guidance paused. No route arrow. Stop and rescan the starting place.':
  'Waiting for a verified start. No route arrow yet.';
 if(el('guidance-status').textContent!==message)el('guidance-status').textContent=message;
}
const upload=new LiveUpload(message=>{el('upload').textContent=message;});
let sdk:LiveSdk,renderer:ReferenceRenderer|undefined,gl:WebGL2RenderingContext|undefined;
let running=false,frame:CameraFrame|null=null,lastFresh=-Infinity,lastStatus='',phase=0,lastUi=0;
let size=calibration.sync(canvas,innerWidth,innerHeight,devicePixelRatio);
let viewport=[0,0,0,0];
let videoTime=NaN,repeatFrame=true;
let runAtMs=NaN,markIndex=0;
const marks=[0,2,4,6,8,10];
function logSdk(method:'configure'|'updateCameraProjectionMatrix'|'run',args:Record<string,unknown>){const call=serializeSdkCall(method,args,performance.now(),runAtMs);upload.add(call.kind,call.label,call.values);}
function updateProjection(args:Record<string,unknown>){logSdk('updateCameraProjectionMatrix',args);sdk.XrController.updateCameraProjectionMatrix(args);}
const capture=new CaptureUI(upload,()=>running&&Boolean(frame)&&performance.now()-lastFresh<=settings.MARKER_MAX_AGE_MS,()=>stop('host-capture-review'));
const instructions=[
  'Slowly move the phone sideways to scan the textured floor. Aim the centre crosshair at a tile corner or distinctive mark, then press Place reference.',
  '1/3 · Keep the phone still for about 10 seconds. Look for a magenta cross on your chosen spot. Then press Next step.',
  '2/3 · Move sideways about half a metre, keeping that spot visible, then return. Watch whether the magenta cross slides. Then press Next step.',
  '3/3 · While standing still, cover the rear camera for 2 seconds, then uncover it. The reference should hide on tracking loss. It must be placed again after recovery. Then press Next step.'
];
function hide(reason:string){anchor.clear();el('blocked').hidden=false;el('blocked').style.background='#081514';el('blocked').textContent=reason;}
function geometry(){
  const rect=canvas.getBoundingClientRect();size=calibration.sync(canvas,rect.width,rect.height,devicePixelRatio);
  if(size.changed){capture.interrupt('display resized');anchor.clear();guidance.clear();frame=null;
    if(sdk&&running)updateProjection({cam:{pixelRectWidth:size.width,pixelRectHeight:size.height,nearClipPlane:settings.NEAR_CLIP_M,farClipPlane:settings.FAR_CLIP_M}});
    upload.add('status','display-resized',[size.width,size.height,size.cssWidth,size.cssHeight,size.ratio]);
  }
}
function stop(reason='user-finished'){
  capture.interrupt(reason);
  guidance.clear();
  window.removeEventListener('devicemotion',onDeviceMotion);
  if(!running)return;running=false;upload.add('end',reason);hide('Test ended. Keep this page open until logs are saved.');
  try{sdk.stop();sdk.clearCameraPipelineModules();}catch{}
  renderer?.dispose();renderer=undefined;button('place').hidden=true;button('next').hidden=true;button('stop').hidden=true;el('answers').hidden=true;
  void upload.flush();
}
function fail(message:string){upload.add('error',message);el('tracking').textContent=message;stop('error');hide(message);void upload.flush();}
window.addEventListener('resize',geometry);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)stop('page-hidden');});
window.addEventListener('pagehide',()=>{capture.interrupt('page closed');if(running){sdk.stop();running=false;}});
setInterval(()=>{
  if(running&&performance.now()-lastFresh>settings.MARKER_MAX_AGE_MS){capture.interrupt('tracking became stale');hide('Tracking unavailable. Slowly scan a textured area.');}
},settings.LIVE_WATCHDOG_INTERVAL_MS);
setInterval(()=>void upload.flush(),settings.LIVE_UPLOAD_INTERVAL_MS);
prepareSdk(XR8Promise,settings.SDK_READY_TIMEOUT_MS).then(value=>{
  sdk=value as unknown as LiveSdk;button('start').disabled=false;el('tracking').textContent='Ready. Start the camera test and allow camera access.';
}).catch(error=>{el('tracking').textContent=`Engine load failed: ${error.message}. Reload with an internet connection.`;});
button('start').addEventListener('click',async()=>{
  button('start').disabled=true;
  try{
    const motionPermission=typeof DeviceMotionEvent==='undefined'?undefined:(DeviceMotionEvent as typeof DeviceMotionEvent & {requestPermission?:()=>Promise<string>}).requestPermission;
    if(motionPermission){
      try{const granted=await motionPermission.call(DeviceMotionEvent);upload.add('status',`motion-permission-${granted}`);if(granted==='granted')window.addEventListener('devicemotion',onDeviceMotion);}catch{upload.add('status','motion-permission-error');}
    }else if(typeof DeviceMotionEvent!=='undefined')window.addEventListener('devicemotion',onDeviceMotion);
    await upload.start();upload.add('begin','E03-1');running=true;geometry();
    const configureArgs={disableWorldTracking:false,enableWorldPoints:true,scale:'absolute'};
    logSdk('configure',configureArgs);sdk.XrController.configure(configureArgs);
    sdk.clearCameraPipelineModules();
    sdk.addCameraPipelineModules([
      sdk.GlTextureRenderer.pipelineModule(),sdk.XrController.pipelineModule(),{
        name:'walkit-live-reference',
        onAttach:({version}:{version?:string})=>upload.add('status',`engine-${version||'unreported'}`),
        onStart:({GLctx}:{GLctx:WebGL2RenderingContext})=>{
          try{
            if(!(GLctx instanceof WebGL2RenderingContext))throw Error('WebGL2 unavailable');
            gl=GLctx;const state=sdk.GlTextureRenderer.getGLctxParameters(gl,[gl.TEXTURE0]);
            try{renderer=new ReferenceRenderer(canvas,gl);}finally{sdk.GlTextureRenderer.setGLctxParameters(gl,state);}
            updateProjection({cam:{pixelRectWidth:canvas.width,pixelRectHeight:canvas.height,nearClipPlane:settings.NEAR_CLIP_M,farClipPlane:settings.FAR_CLIP_M},origin:{x:0,y:0,z:0},facing:{x:0,y:0,z:0,w:1}});
            upload.add('status','camera-started');el('instruction').textContent=instructions[0];
          }catch(error){fail((error as Error).message);}
        },
        onUpdate:({frameStartResult,processCpuResult,processGpuResult}:{frameStartResult?:{videoTime?:number;repeatFrame?:boolean};processCpuResult?:{reality?:unknown};processGpuResult?:{gltexturerenderer?:{viewport?:{width:number;height:number;offsetX:number;offsetY:number}}}})=>{
          if(!running)return;
          const now=performance.now(),reality=processCpuResult?.reality as {trackingStatus?:string;worldPoints?:unknown}|undefined;
          const status=reality?.trackingStatus||'UNAVAILABLE';frame=readReality(reality);
          videoTime=frameStartResult?.videoTime??NaN;repeatFrame=frameStartResult?.repeatFrame??true;
          if(!frame)capture.interrupt('tracking lost');
          const vp=processGpuResult?.gltexturerenderer?.viewport;viewport=vp?[vp.width,vp.height,vp.offsetX,vp.offsetY]:[0,0,0,0];
          if(frame&&!frameStartResult?.repeatFrame)lastFresh=now;
          if(!frame){anchor.clear();guidance.clear();showGuidanceStatus();}
          if(status!==lastStatus){upload.add('status',status);lastStatus=status;}
          const depth=frame?medianWorldPointDepth(reality?.worldPoints,frame):{count:0,validDepthCount:0,medianDepth:null};
          upload.add('world-points',status,[depth.count,depth.validDepthCount,depth.medianDepth??-1,videoTime,now]);
          if(!upload.add('frame',status,[frameStartResult?.videoTime??-1,frameStartResult?.repeatFrame?1:0,frame?1:0,canvas.width,canvas.height,size.cssWidth,size.cssHeight,size.ratio,...viewport,...(frame?[...frame.position,...frame.rotation,...frame.projection]:[])])){stop('recording-capacity');return;}
          el('blocked').hidden=Boolean(frame&&now-lastFresh<=settings.MARKER_MAX_AGE_MS);
          if(!frame){el('blocked').style.background='#08151466';el('blocked').textContent='Tracking limited. Slowly scan a textured area.';}
          if(now-lastUi>settings.LIVE_STATUS_INTERVAL_MS){el('tracking').textContent=`${status} · ${upload.events.length} events · ${canvas.width} × ${canvas.height}`;lastUi=now;}
        },
        onRender:()=>{
          if(!running||!renderer||!gl||!frame)return;
          if(!viewportCoversCanvas(viewport,canvas.width,canvas.height))capture.interrupt('camera image does not cover the calibrated canvas');
          else if(!repeatFrame){capture.frame(canvas,frame,lastFresh,videoTime,size.revision);if(!running)return;}
          const point=anchor.read({revision:size.revision,tracking:true,frameMs:lastFresh,nowMs:performance.now()});
          const visible=point&&projectReference(point,frame,size.cssWidth,size.cssHeight);
          const state=sdk.GlTextureRenderer.getGLctxParameters(gl,[gl.TEXTURE0]);
          const routeArrow=guidance.read(frame,lastStatus,performance.now(),lastFresh,size.cssWidth,size.cssHeight);
          showGuidanceStatus();
          try{renderer.draw(visible?point:null,frame,canvas.width,canvas.height,size.ratio,false,routeArrow);}finally{sdk.GlTextureRenderer.setGLctxParameters(gl,state);}
        },
        onException:(error:unknown)=>fail(error instanceof Error?error.message:'Camera engine exception'),
        onCameraStatusChange:({status}:{status:string})=>{upload.add('status',`camera-${status}`);if(status==='failed')fail('Camera permission or device failed');}
      }
    ]);
    const runArgs={canvas:'camera',webgl2:true,glContextConfig:{alpha:false,antialias:false}};
    runAtMs=performance.now();logSdk('run',runArgs);
    sdk.run({canvas,webgl2:true,glContextConfig:runArgs.glContextConfig});
    button('start').hidden=true;button('place').hidden=false;button('stop').hidden=false;button('backup').hidden=false;
  }catch(error){fail((error as Error).message);button('start').disabled=false;}
});
function onDeviceMotion(event:DeviceMotionEvent){
 const a=event.acceleration,gravity=event.accelerationIncludingGravity,r=event.rotationRate;
 upload.add('motion','devicemotion',[event.timeStamp,performance.now(),event.interval??-1,a?.x??-1,a?.y??-1,a?.z??-1,gravity?.x??-1,gravity?.y??-1,gravity?.z??-1,r?.alpha??-1,r?.beta??-1,r?.gamma??-1]);
}
button('mark-distance').addEventListener('click',()=>{
 if(!capture.recording||!frame||performance.now()-lastFresh>settings.MARKER_MAX_AGE_MS){el('capture-status').textContent='Wait for a fresh NORMAL pose at the floor mark.';return;}
 const mark=marks[markIndex];
 upload.add('step',`mark-${mark}m`,[performance.now(),videoTime,...frame.position,...frame.rotation]);
 markIndex++;
 if(markIndex>=marks.length){button('mark-distance').hidden=true;el('capture-status').textContent='All six marks logged. Finish and review the recording.';}
 else button('mark-distance').textContent=`Tap at ${marks[markIndex]} m mark`;
});
document.addEventListener('walkit-record-start',()=>{markIndex=0;button('mark-distance').textContent='Tap at 0 m mark';});
button('place').addEventListener('click',()=>{
  if(!frame||performance.now()-lastFresh>settings.MARKER_MAX_AGE_MS){el('instruction').textContent='Wait for NORMAL tracking, then try placing again.';return;}
  const hit=sdk.XrController.hitTest(0.5,0.5,['FEATURE_POINT']).find(h=>[h.position.x,h.position.y,h.position.z,h.distance].every(Number.isFinite));
  if(!hit){upload.add('placement','no-hit');el('instruction').textContent='No surface point yet. Move slowly sideways, aim at a textured spot, and try again.';return;}
  anchor.place([hit.position.x,hit.position.y,hit.position.z],size.revision);
  upload.add('placement',hit.type,[hit.position.x,hit.position.y,hit.position.z,hit.distance]);
  if(phase===0)phase=1;el('instruction').textContent=instructions[phase];button('next').hidden=false;
});
button('next').addEventListener('click',()=>{
  upload.add('step','completed',[phase]);phase++;
  if(phase<instructions.length)el('instruction').textContent=instructions[phase];
  else{button('next').hidden=true;el('answers').hidden=false;el('instruction').textContent='Choose what you saw. This is your observation, not an automatic stability verdict.';}
});
document.querySelectorAll<HTMLButtonElement>('[data-answer]').forEach(b=>b.addEventListener('click',()=>{upload.add('answer',b.dataset.answer!);stop('guided-test-finished');}));
button('stop').addEventListener('click',()=>stop('user-finished-early'));
button('backup').addEventListener('click',()=>upload.download());
