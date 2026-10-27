import {XR8Promise} from '@8thwall/engine-binary';
import {prepareSdk} from './sdk';
import {settings} from './settings';
import {DiagnosticAnchor,ViewportCalibration,projectReference,type WorldPoint} from './display';
import {ReferenceRenderer} from './reference-renderer';
import {fixtureCamera,runDisplayCheck} from './display-check';
import './style.css';
const status=document.querySelector<HTMLElement>('#status')!;
prepareSdk(XR8Promise,settings.SDK_READY_TIMEOUT_MS).then(()=>{
  status.textContent='Engine ready · camera has not started';
}).catch((error:Error)=>{status.textContent=`Setup needs attention: ${error.message}`;});

const canvas=document.querySelector<HTMLCanvasElement>('#display')!;
const stage=document.querySelector<HTMLElement>('#stage')!;
const ring=document.querySelector<HTMLElement>('#overlay')!;
const displayStatus=document.querySelector<HTMLElement>('#display-status')!;
const binding=new ViewportCalibration(),anchor=new DiagnosticAnchor();
const point:WorldPoint=[0.15,0.2,-2];let moved=false,tracking=true;
let renderer:ReferenceRenderer;
function size(){const r=stage.getBoundingClientRect();return binding.sync(canvas,r.width,r.height,devicePixelRatio);}
function render(){
  const s=size();if(s.changed)anchor.clear();
  const frame=fixtureCamera(s.cssWidth,s.cssHeight,moved),now=performance.now();
  const reference=anchor.read({revision:s.revision,tracking,frameMs:now,nowMs:now});
  const screen=reference?projectReference(reference,frame,s.cssWidth,s.cssHeight):null;
  renderer.draw(screen?reference:null,frame,s.width,s.height,s.ratio,true);
  ring.hidden=!screen;if(screen){ring.style.left=`${screen.x}px`;ring.style.top=`${screen.y}px`;}
  displayStatus.textContent=`Buffer ${s.width} × ${s.height} · display ${Math.round(s.cssWidth)} × ${Math.round(s.cssHeight)} · ${reference?'reference placed':'reference cleared'}`;
}
try{
  renderer=new ReferenceRenderer(canvas);
  new ResizeObserver(()=>render()).observe(stage);
  document.querySelector('#place')!.addEventListener('click',()=>{const s=size();tracking=true;anchor.place(point,s.revision);render();});
  document.querySelector('#move')!.addEventListener('click',()=>{moved=!moved;render();});
  document.querySelector('#loss')!.addEventListener('click',()=>{tracking=false;render();});
}catch(error){displayStatus.textContent=`WebGL setup failed: ${(error as Error).message}`;}
const checks=document.querySelector<HTMLButtonElement>('#checks')!;
checks.addEventListener('click',async()=>{
  checks.disabled=true;const resultText=document.querySelector('#check-status')!;
  resultText.textContent='Running synthetic GPU checks…';
  try{
    const report=await runDisplayCheck();document.querySelector('#report')!.textContent=JSON.stringify(report,null,2);
    resultText.textContent=`${report.passed?'PASS':'FAIL'} · ${report.results.filter(r=>r.passed).length}/${report.results.length} synthetic cases. This does not measure phone tracking.`;
  }catch(error){resultText.textContent=`FAIL · ${(error as Error).message}`;}
  finally{checks.disabled=false;}
});
