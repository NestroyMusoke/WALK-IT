import {HostCapture,type MaskRect} from './host-capture';
import {copyCaptureFrame} from './capture-frame';
import {configurationHash} from './settings';
import type {CameraFrame} from './display';
import type {LiveUpload} from './live-upload';
export class CaptureUI{
 private recorder?:HostCapture;private index=0;private masks:MaskRect[]=[];private pendingFinish=false;private startPoint?:{x:number;y:number};
 private canvas=document.getElementById('review-image') as HTMLCanvasElement;
 private message=document.getElementById('capture-status')!;
 private btn=(id:string)=>document.getElementById(id) as HTMLButtonElement;
 constructor(private upload:LiveUpload,private ready:()=>boolean,private finishCamera:()=>void){
  this.btn('record-walk').onclick=async()=>{
   try{
    if(!this.ready())throw Error('Wait for NORMAL tracking before recording.');
    this.btn('record-walk').disabled=true;
    const sha=await configurationHash();if(!this.ready())throw Error('Tracking changed. Wait for NORMAL and retry.');
    this.recorder?.dispose();this.recorder=new HostCapture(crypto.randomUUID(),sha,true);this.recorder.start();
    this.btn('finish-walk').hidden=false;this.upload.add('step','host-recording-started');this.message.textContent='Recording. Walk slowly; keep the phone upright. Stop at your destination and tap Mark destination.';
   }catch(e){this.btn('record-walk').disabled=false;this.message.textContent=(e as Error).message;}
  };
  this.btn('finish-walk').onclick=()=>{this.pendingFinish=true;this.message.textContent='Hold still at the destination while the final frame is captured…';};
  this.btn('discard-walk').onclick=()=>{this.recorder?.dispose();this.clearReview();this.message.textContent='Discarded from memory. Reload to start a new session.';this.finishCamera();};
  this.canvas.onpointerdown=e=>{this.startPoint=this.point(e);this.canvas.setPointerCapture(e.pointerId);};
  this.canvas.onpointerup=e=>{
   if(!this.startPoint)return;const end=this.point(e),start=this.startPoint;this.startPoint=undefined;
   const rect={x:Math.min(start.x,end.x),y:Math.min(start.y,end.y),width:Math.abs(end.x-start.x),height:Math.abs(end.y-start.y)};
   if(rect.width&&rect.height){this.masks.push(rect);this.draw();}
  };
  this.btn('clear-masks').onclick=()=>{this.masks=[];this.draw();};
  this.btn('approve-frame').onclick=()=>{
   try{this.recorder!.review(`kf${this.index}`,this.masks);this.index++;this.masks=[];
    if(this.index<this.recorder!.count)this.draw();else{this.clearReview();this.btn('save-walk').hidden=false;this.message.textContent='Every image reviewed. Save the route privately to your laptop.';}
   }catch(e){this.message.textContent=(e as Error).message;}
  };
  this.btn('save-walk').onclick=()=>void this.save();
 }
 private point(e:PointerEvent){const r=this.canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(this.canvas.width,Math.round((e.clientX-r.left)*this.canvas.width/r.width))),y:Math.max(0,Math.min(this.canvas.height,Math.round((e.clientY-r.top)*this.canvas.height/r.height)))};}
 private clearReview(){document.getElementById('image-review')!.hidden=true;this.canvas.width=this.canvas.height=0;this.masks=[];}
 private draw(){
  const p=this.recorder!.preview(`kf${this.index}`);this.canvas.width=p.width;this.canvas.height=p.height;
  const ctx=this.canvas.getContext('2d')!;ctx.putImageData(new ImageData(new Uint8ClampedArray(p.rgba),p.width,p.height),0,0);p.rgba.fill(0);
  ctx.fillStyle='#000';for(const m of this.masks)ctx.fillRect(m.x,m.y,m.width,m.height);
  this.message.textContent=`Review image ${this.index+1} of ${this.recorder!.count}. Drag rectangles over faces, plates or private details. Then approve.`;
 }
 interrupt(reason:string){if(this.recorder?.state!=='recording')return;this.recorder.abort();this.pendingFinish=false;this.btn('finish-walk').hidden=true;this.btn('record-walk').disabled=false;this.message.textContent=`Recording discarded: ${reason}. Wait for stable tracking and start again.`;this.upload.add('error','host-capture-aborted');}
 frame(source:HTMLCanvasElement,frame:CameraFrame,t:number,videoTime:number,revision:number){
  const r=this.recorder;if(r?.state!=='recording'||!r.needsFrame(t))return;
  try{
   const sample=copyCaptureFrame(source,{frame,t,videoTime,revision});
   let accepted=false;try{accepted=r.offer(sample,performance.now());}finally{sample.rgba.fill(0);}
   if((r.state as string)==='aborted')throw Error('Invalid capture frame');
   if(accepted){this.message.textContent=`Recorded ${r.count} images. ${this.pendingFinish?'Finishing…':'Continue slowly, then mark your destination.'}`;
    if(this.pendingFinish){r.finish();this.pendingFinish=false;this.btn('finish-walk').hidden=true;this.finishCamera();this.index=0;document.getElementById('image-review')!.hidden=false;this.draw();}
   }
  }catch(e){if(r.state==='recording')this.interrupt((e as Error).message);else{this.message.textContent=(e as Error).message;this.btn('record-walk').disabled=false;}}
 }
 private async save(){
  this.btn('save-walk').disabled=true;
  try{
   const out=this.recorder!.exportReviewed();
   const images=out.images.map(f=>{
    const c=document.createElement('canvas');c.width=f.width;c.height=f.height;
    c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(f.rgba),f.width,f.height),0,0);
    const png=c.toDataURL('image/png').split(',')[1];f.rgba.fill(0);c.width=c.height=0;return {id:f.id,png};
   });
   this.message.textContent='Saving reviewed route to laptop. Keep this page open…';
   const receipt=await this.upload.saveCapture({manifest:out.manifest,images,timing:out.timing});
   this.message.textContent=`Saved on laptop: ${receipt.frames} images. Receipt ${receipt.sha256.slice(0,12)}. You can close this page.`;
   this.upload.add('step','host-route-saved',[receipt.frames]);void this.upload.flush();this.recorder!.dispose();this.btn('save-walk').hidden=true;
  }catch(e){this.message.textContent=(e as Error).message;}finally{this.btn('save-walk').disabled=false;}
 }
}
