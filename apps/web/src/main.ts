import {XR8Promise} from '@8thwall/engine-binary';
import {prepareSdk} from './sdk';
import {settings,configurationHash} from './settings';
import {startTestSession,deliverReport,type TestSession} from './delivery';
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
const receiptStatus=document.querySelector<HTMLElement>('#receipt-status')!;
const retry=document.querySelector<HTMLButtonElement>('#retry')!;
const download=document.querySelector<HTMLButtonElement>('#download')!;
let pending:{session:TestSession|null;report:unknown}|null=null;
try{pending=JSON.parse(localStorage.getItem('walkit-pending-display-report')||'null');}catch{/* Memory fallback remains available. */}
function retain(){try{localStorage.setItem('walkit-pending-display-report',JSON.stringify(pending));}catch{receiptStatus.textContent='Browser storage unavailable: keep this page open and download the report if sending fails.';}}
if(pending){receiptStatus.textContent='An unsent result is waiting. Press Retry sending.';retry.hidden=false;download.hidden=false;checks.disabled=true;}
async function send(){
  if(!pending)return;
  receiptStatus.textContent='Step 3 of 3 · Sending result to the laptop…';retry.disabled=true;
  try{
    pending.session??=await startTestSession();retain();
    const receipt=await deliverReport(pending.report,pending.session);
    receiptStatus.textContent=`Saved on laptop · ${receipt.id} · ${receipt.passed?'PASS':'FAIL / incomplete'}. You can return to the chat.`;
    pending=null;try{localStorage.removeItem('walkit-pending-display-report');}catch{}
    retry.hidden=true;checks.disabled=false;
  }catch{
    if(pending)pending.session=null;retain();
    receiptStatus.textContent='NOT SAVED on laptop. Keep this page open. Press Retry sending, or Download result as a backup.';
    retry.hidden=false;download.hidden=false;
  }finally{retry.disabled=false;}
}
retry.addEventListener('click',()=>void send());
download.addEventListener('click',()=>{
  const text=pending?JSON.stringify(pending.report,null,2):document.querySelector('#report')!.textContent!;
  const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),link=document.createElement('a');
  link.href=url;link.download='walkit-display-result.json';link.click();URL.revokeObjectURL(url);
});
checks.addEventListener('click',async()=>{
  checks.disabled=true;const resultText=document.querySelector('#check-status')!;
  let session:TestSession|null=null;
  receiptStatus.textContent='Step 1 of 3 · Connecting to the laptop…';
  try{session=await startTestSession();}catch{receiptStatus.textContent='Laptop connection unavailable; the test will still produce a downloadable result.';}
  resultText.textContent='Step 2 of 3 · Running all eight synthetic GPU checks. Keep this page open…';
  try{
    const report=await runDisplayCheck();document.querySelector('#report')!.textContent=JSON.stringify(report,null,2);
    pending={session,report};retain();download.hidden=false;
    resultText.textContent=`${report.passed?'PASS':'FAIL'} · ${report.results.filter(r=>r.passed).length}/${report.results.length} synthetic cases. This does not measure phone tracking.`;
  }catch(error){
    const report={build:'E02-1',kind:'synthetic GPU rasterization; not phone tracking',configSha256:await configurationHash(),passed:false,results:[],failure:'webgl-check-failed'};
    pending={session,report};retain();download.hidden=false;
    document.querySelector('#report')!.textContent=JSON.stringify(report,null,2);
    resultText.textContent=`The drawing test could not finish: ${(error as Error).message}`;
  }
  await send();
});
