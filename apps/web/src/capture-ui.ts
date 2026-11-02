import {HostCapture,type MaskRect} from './host-capture';
import {copyCaptureFrame} from './capture-frame';
import {configurationHash} from './settings';
import {settings} from './settings';
import type {CameraFrame} from './display';
import type {LiveUpload} from './live-upload';
import {makePrivateRouteBackup} from './route-backup';
export class CaptureUI{
 private recorder?:HostCapture;private index=0;private masks:MaskRect[]=[];private pendingFinish=false;private startPoint?:{x:number;y:number};private reviewedReport?:unknown;
 private mode:'author-route'|'visitor-start-scan'='author-route';
 private canvas=document.getElementById('review-image') as HTMLCanvasElement;
 private message=document.getElementById('capture-status')!;
 private btn=(id:string)=>document.getElementById(id) as HTMLButtonElement;
 constructor(private upload:LiveUpload,private ready:()=>boolean,private finishCamera:()=>void){
  this.btn('sway-first').onclick=()=>{
   if(!this.ready()){this.message.textContent='Wait for NORMAL tracking, then start the sway.';return;}
   const started=performance.now();this.btn('sway-first').disabled=true;this.message.textContent='Slowly sway sideways while keeping the scene visible. Record will unlock after three seconds.';
   this.upload.add('step','sway-start',[started]);
   setTimeout(()=>{this.btn('record-walk').disabled=false;this.btn('record-start-scan').disabled=false;this.message.textContent='Sway interval ended. If tracking is NORMAL, choose author walk or visitor start scan.';this.upload.add('step','sway-interval-ended',[performance.now()-started]);},3000);
  };
  this.btn('record-walk').onclick=()=>void this.startCapture('author-route');
  this.btn('record-start-scan').onclick=()=>void this.startCapture('visitor-start-scan');
  this.btn('finish-walk').onclick=()=>{
   if(this.mode==='visitor-start-scan'&&this.recorder!.count<settings.START_MAP_FRAME_CAPACITY_COUNT){this.message.textContent=`Keep scanning until at least ${settings.START_MAP_FRAME_CAPACITY_COUNT} tracked images are recorded.`;return;}
   this.pendingFinish=true;this.message.textContent=this.mode==='visitor-start-scan'?'Hold still while the final start-scan frame is captured…':'Hold still at the destination while the final frame is captured…';
  };
  this.btn('discard-walk').onclick=()=>{this.recorder?.dispose();this.reviewedReport=undefined;this.clearReview();this.btn('backup-reviewed-route').hidden=true;this.btn('mark-distance').hidden=true;this.message.textContent='Discarded from memory. Reload to start a new session.';this.finishCamera();};
  this.canvas.onpointerdown=e=>{this.startPoint=this.point(e);this.canvas.setPointerCapture(e.pointerId);};
  this.canvas.onpointerup=e=>{
   if(!this.startPoint)return;const end=this.point(e),start=this.startPoint;this.startPoint=undefined;
   const rect={x:Math.min(start.x,end.x),y:Math.min(start.y,end.y),width:Math.abs(end.x-start.x),height:Math.abs(end.y-start.y)};
   if(rect.width&&rect.height){this.masks.push(rect);this.draw();}
  };
  this.btn('clear-masks').onclick=()=>{this.masks=[];this.draw();};
  this.btn('approve-frame').onclick=()=>{
   try{this.recorder!.review(`kf${this.index}`,this.masks);this.index++;this.masks=[];
    if(this.index<this.recorder!.count)this.draw();else{this.clearReview();this.btn('save-walk').hidden=false;this.btn('backup-reviewed-route').hidden=false;this.message.textContent=this.mode==='visitor-start-scan'?'Every start-scan image reviewed. Save a private backup and upload the scan for offline testing.':'Every image reviewed. Saving will first download a private backup with the route and numeric logs.';}
   }catch(e){this.message.textContent=(e as Error).message;}
  };
  this.btn('save-walk').onclick=()=>void this.save();
  this.btn('backup-reviewed-route').onclick=()=>{
   try{this.downloadPrivateBackup();this.message.textContent='Private reviewed images and numeric log downloaded together. Keep this off Git; you can still retry Save to laptop.';}
   catch(e){this.message.textContent=(e as Error).message;}
  };
 }
 private async startCapture(mode:'author-route'|'visitor-start-scan'){
   try{
    if(!this.ready())throw Error('Wait for NORMAL tracking before recording.');
    this.btn('record-walk').disabled=true;this.btn('record-start-scan').disabled=true;
    const sha=await configurationHash();if(!this.ready())throw Error('Tracking changed. Wait for NORMAL and retry.');
    this.mode=mode;this.recorder?.dispose();this.reviewedReport=undefined;this.recorder=new HostCapture(crypto.randomUUID(),sha,true,mode);this.recorder.start();document.dispatchEvent(new Event('walkit-record-start'));
    this.btn('finish-walk').hidden=false;this.btn('finish-walk').textContent=mode==='visitor-start-scan'?'Finish start scan':'Mark destination';
    this.btn('mark-distance').hidden=mode==='visitor-start-scan';this.upload.add('step',mode==='visitor-start-scan'?'visitor-start-scan-started':'host-recording-started');
    this.message.textContent=mode==='visitor-start-scan'?`Scan the known starting place while moving slowly sideways. Record at least ${settings.START_MAP_FRAME_CAPACITY_COUNT} tracked images. This is offline evidence, not live guidance.`:'Recording. Walk slowly; keep the phone upright. Tap each measured mark if using the 10 m line.';
   }catch(e){this.btn('record-walk').disabled=false;this.btn('record-start-scan').disabled=false;this.message.textContent=(e as Error).message;}
 }
 private point(e:PointerEvent){const r=this.canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(this.canvas.width,Math.round((e.clientX-r.left)*this.canvas.width/r.width))),y:Math.max(0,Math.min(this.canvas.height,Math.round((e.clientY-r.top)*this.canvas.height/r.height)))};}
 private clearReview(){document.getElementById('image-review')!.hidden=true;this.canvas.width=this.canvas.height=0;this.masks=[];}
 private draw(){
  const p=this.recorder!.preview(`kf${this.index}`);this.canvas.width=p.width;this.canvas.height=p.height;
  const ctx=this.canvas.getContext('2d')!;ctx.putImageData(new ImageData(new Uint8ClampedArray(p.rgba),p.width,p.height),0,0);p.rgba.fill(0);
  ctx.fillStyle='#000';for(const m of this.masks)ctx.fillRect(m.x,m.y,m.width,m.height);
  this.message.textContent=`Review image ${this.index+1} of ${this.recorder!.count}. Drag rectangles over faces, plates or private details. Then approve.`;
 }
 get recording(){return this.recorder?.state==='recording';}
 interrupt(reason:string){if(this.recorder?.state!=='recording')return;this.recorder.abort();this.pendingFinish=false;this.btn('finish-walk').hidden=true;this.btn('mark-distance').hidden=true;this.btn('record-walk').disabled=true;this.btn('sway-first').disabled=false;this.message.textContent=`Recording discarded: ${reason}. Wait for stable tracking, repeat the sway and start again.`;this.upload.add('error','host-capture-aborted');}
 frame(source:HTMLCanvasElement,frame:CameraFrame,t:number,videoTime:number,revision:number){
  const r=this.recorder;if(r?.state!=='recording'||!r.needsFrame(t))return;
  try{
   const sample=copyCaptureFrame(source,{frame,t,videoTime,revision});
   let accepted=false;try{accepted=r.offer(sample,performance.now());}finally{sample.rgba.fill(0);}
   if((r.state as string)==='aborted')throw Error('Invalid capture frame');
   if(accepted){this.message.textContent=`Recorded ${r.count} images. ${this.pendingFinish?'Finishing…':this.mode==='visitor-start-scan'?'Continue scanning the starting place.':'Continue slowly, then mark your destination.'}`;
    if(this.pendingFinish){r.finish();this.pendingFinish=false;this.btn('finish-walk').hidden=true;this.btn('mark-distance').hidden=true;this.finishCamera();this.index=0;document.getElementById('image-review')!.hidden=false;this.draw();}
   }
  }catch(e){if(r.state==='recording')this.interrupt((e as Error).message);else{this.message.textContent=(e as Error).message;this.btn('record-walk').disabled=false;}}
 }
 private prepareReviewedReport(){
   if(this.reviewedReport)return this.reviewedReport;
   const out=this.recorder!.exportReviewed();
   const images=out.images.map(f=>{
    const c=document.createElement('canvas');c.width=f.width;c.height=f.height;
    c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(f.rgba),f.width,f.height),0,0);
    const png=c.toDataURL('image/png').split(',')[1];f.rgba.fill(0);c.width=c.height=0;return {id:f.id,png};
   });
   this.reviewedReport={purpose:out.purpose,manifest:out.manifest,images,timing:out.timing};
   return this.reviewedReport;
 }
 private downloadPrivateBackup(){
   const body=JSON.stringify(makePrivateRouteBackup(this.prepareReviewedReport(),this.upload.diagnosticSnapshot()));
   const url=URL.createObjectURL(new Blob([body],{type:'application/json'}));
   const link=document.createElement('a');link.href=url;link.download=this.mode==='visitor-start-scan'?'walkit-reviewed-start-scan-evidence.json':'walkit-reviewed-route-evidence.json';link.click();
   setTimeout(()=>URL.revokeObjectURL(url),30_000);
 }
 private async save(){
  this.btn('save-walk').disabled=true;
  try{
   this.downloadPrivateBackup();
   this.message.textContent=this.mode==='visitor-start-scan'?'Private backup downloaded. Saving reviewed start scan to laptop. Keep this page open…':'Private evidence backup downloaded. Saving reviewed route to laptop. Keep this page open…';
   const receipt=await this.upload.saveCapture(this.prepareReviewedReport());
   this.message.textContent=`Saved on laptop: ${receipt.frames} images. Receipt ${receipt.sha256.slice(0,12)}. You can close this page.`;
   this.upload.add('step',this.mode==='visitor-start-scan'?'visitor-start-scan-saved':'host-route-saved',[receipt.frames]);void this.upload.flush();this.recorder!.dispose();this.reviewedReport=undefined;this.btn('save-walk').hidden=true;this.btn('backup-reviewed-route').hidden=true;
  }catch(e){this.message.textContent=(e as Error).message;}finally{this.btn('save-walk').disabled=false;}
 }
}
