import {ReferenceRenderer} from './reference-renderer';
import {GuidanceRuntime} from './guidance-runtime';
import {parseReplayCapture,type ReplayCapture} from './replay-data';
import {validateReplayReport,type ReplayReport} from './replay-report';
import './replay.css';

const id=<T extends HTMLElement>(name:string)=>document.getElementById(name) as T;
const file=id<HTMLInputElement>('capture-file'),play=id<HTMLButtonElement>('play');
const previous=id<HTMLButtonElement>('previous'),next=id<HTMLButtonElement>('next');
const scrub=id<HTMLInputElement>('scrub'),image=id<HTMLImageElement>('recorded-frame');
const canvas=id<HTMLCanvasElement>('replay-overlay');
const status=id<HTMLElement>('status'),arrowStatus=id<HTMLElement>('arrow-status');
const doorStatus=id<HTMLElement>('door-status');
const reportFile=id<HTMLInputElement>('report-file');
const guidance=new GuidanceRuntime();
let renderer:ReferenceRenderer|undefined,capture:ReplayCapture|undefined,index=0;
let report:ReplayReport|undefined,captureSha='',imageHashes:string[]=[];
let playing=false,clockStart=0,videoStart=0,raf=0;

async function hash(bytes:BufferSource){
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('');
}
async function imageHash(url:string){
 const binary=atob(url.slice('data:image/png;base64,'.length));
 const bytes=Uint8Array.from(binary,character=>character.charCodeAt(0));
 return hash(bytes);
}

function pause(){playing=false;play.textContent='Play';cancelAnimationFrame(raf);}
function paint(frameIndex:number){
 if(!capture)return;
 index=Math.max(0,Math.min(frameIndex,capture.frames.length-1));
 const sample=capture.frames[index];
 image.src=sample.imageUrl;image.hidden=false;
 canvas.width=sample.width;canvas.height=sample.height;
 id<HTMLElement>('stage-placeholder').hidden=true;
 id<HTMLElement>('frame-label').textContent=`${capture.purpose==='visitor-start-scan'?'Visitor scan':'Author walk'} · ${sample.id}`;
 id<HTMLElement>('frame-counter').textContent=`${index+1} / ${capture.frames.length}`;
 scrub.value=String(index);
 const now=performance.now();
 const arrow=guidance.read(sample.frame,'NORMAL',now,now,sample.width,sample.height);
 try{
  renderer?.draw(null,sample.frame,sample.width,sample.height,1,true,arrow);
 }catch(error){status.textContent=`Renderer unavailable: ${(error as Error).message}`;}
 arrowStatus.textContent=arrow?'Arrow: verified recorded anchor.':'Arrow withheld: this capture has no verified visitor anchor or metric route.';
 const evidence=report?.frames[index];
 doorStatus.textContent=evidence?`Door ${evidence.status}: ${evidence.reason}.`:
  'Door abstained: no frame-bound Spark and SAM report was loaded.';
 id<HTMLElement>('model-status').textContent=evidence?
  `Model evidence: ${evidence.modelEvidence}. Report label: ${report?.sourceClass}. A local file does not authenticate provider calls.`:
  'Model evidence: none loaded.';
}
function tick(now:number){
 if(!playing||!capture)return;
 const target=videoStart+(now-clockStart)/1000;
 let nextIndex=index;
 while(nextIndex+1<capture.frames.length&&capture.frames[nextIndex+1].videoTime<=target)nextIndex++;
 if(nextIndex!==index)paint(nextIndex);
 if(index===capture.frames.length-1){pause();return;}
 raf=requestAnimationFrame(tick);
}
file.addEventListener('change',async()=>{
 pause();guidance.clear();capture=undefined;report=undefined;captureSha='';imageHashes=[];renderer?.dispose();renderer=undefined;
 reportFile.disabled=true;reportFile.value='';id<HTMLElement>('report-status').textContent='Load a capture first.';
 play.disabled=previous.disabled=next.disabled=scrub.disabled=true;
 const selected=file.files?.[0];if(!selected)return;
 try{
  if(selected.size===0)throw Error('Empty capture');
  capture=parseReplayCapture(JSON.parse(await selected.text()));
  captureSha=await hash(await selected.arrayBuffer());
  imageHashes=await Promise.all(capture.frames.map(frame=>imageHash(frame.imageUrl)));
  renderer=new ReferenceRenderer(canvas,undefined,true);
  scrub.max=String(capture.frames.length-1);
  play.disabled=previous.disabled=next.disabled=scrub.disabled=false;
  reportFile.disabled=false;
  id<HTMLElement>('report-status').textContent='Optional: load an offline verifier report for these exact frames.';
  id<HTMLElement>('provenance').textContent=`Local file SHA-256: ${captureSha}\nRoute: ${capture.routeId}\nCapture config SHA-256: ${capture.configSha256}\nFrames: ${capture.frames.length}\nPurpose: ${capture.purpose}`;
  status.textContent=`Loaded ${capture.frames.length} reviewed frames. No network upload or model call was made.`;
  paint(0);
 }catch(error){status.textContent=`Capture refused: ${(error as Error).message}`;image.hidden=true;id<HTMLElement>('stage-placeholder').hidden=false;}
});
reportFile.addEventListener('change',async()=>{
 report=undefined;
 const selected=reportFile.files?.[0];
 if(!selected||!capture)return;
 try{
  report=validateReplayReport(JSON.parse(await selected.text()),capture,captureSha,imageHashes);
  id<HTMLElement>('report-status').textContent=`Matched ${report.frames.length} frame hashes. ${report.sourceClass}.`;
 }catch(error){id<HTMLElement>('report-status').textContent=`Report refused: ${(error as Error).message}`;}
 paint(index);
});
play.addEventListener('click',()=>{
 if(!capture)return;
 if(playing){pause();return;}
 if(index===capture.frames.length-1)paint(0);
 playing=true;play.textContent='Pause';clockStart=performance.now();videoStart=capture.frames[index].videoTime;
 raf=requestAnimationFrame(tick);
});
previous.addEventListener('click',()=>{pause();paint(index-1);});
next.addEventListener('click',()=>{pause();paint(index+1);});
scrub.addEventListener('input',()=>{pause();paint(Number(scrub.value));});
window.addEventListener('pagehide',()=>{pause();renderer?.dispose();});
