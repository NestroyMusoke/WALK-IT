import {readFile,writeFile} from 'node:fs/promises';
import {createHash,randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import {joinReview} from '../server/route-review.ts';
import {validateCapture} from '../server/capture-schema.ts';
const [capturePath,queryPath,alignmentPath]=process.argv.slice(2);
if(!capturePath||!queryPath||!alignmentPath)throw Error('Usage: node scripts/review-route.ts capture.json query.json alignment.json');
const raw=await readFile(capturePath,'utf8');
const cfg=JSON.parse(await readFile(new URL('../config/vision.yaml',import.meta.url),'utf8'));
const capture=validateCapture(JSON.parse(raw),cfg),query=JSON.parse(await readFile(queryPath,'utf8'));
const alignment=JSON.parse(await readFile(alignmentPath,'utf8'));
const querySha=createHash('sha256').update(await readFile(queryPath)).digest('hex');
if(alignment.queryReportSha256!==querySha)throw Error('Alignment report belongs to another query');
const model={...joinReview(capture,query,createHash('sha256').update(raw).digest('hex')),alignment:alignment.result};
const encoded=JSON.stringify(model).replaceAll('<','\\u003c');
const html=String.raw`<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WALK IT · Recorded route review</title>
<style>body{margin:0;background:#10201c;color:#edf4ec;font:16px system-ui}main{max-width:1100px;margin:auto;padding:24px}h1{font-size:32px;margin-bottom:8px}.notice{background:#463719;padding:14px;border-radius:10px}section{display:grid;grid-template-columns:minmax(240px,1fr) 1fr;gap:24px;margin-top:20px}img{width:100%;max-height:65vh;object-fit:contain;background:#08120f;border-radius:12px}svg{width:100%;height:250px;background:#182e26;border-radius:12px}input{width:100%}button{padding:12px 20px;margin:12px 8px 0 0;background:#d0eab5;border:0;border-radius:8px;color:#10201c}pre{white-space:pre-wrap;font:14px system-ui;color:#bacdbf}small{color:#b7c7bc}@media(max-width:650px){section{grid-template-columns:1fr}}</style>
<main><small>WALK IT · PRIVATE LOCAL REVIEW</small><h1>Your recorded walk</h1><p class="notice">Recorded diagnostic—not live navigation. A pose hypothesis is not a verified location. AR guidance is disabled.</p><p id="summary"></p><section><div><img id="photo" alt="Reviewed captured route frame"><input id="frame" aria-label="Frame" type="range" min="0" value="0"><button id="previous">Previous</button><button id="next">Next</button></div><div><h2 id="title"></h2><p id="status"></p><pre id="evidence"></pre><svg id="route" viewBox="0 0 400 250" aria-label="Recorded camera trajectory"></svg><small>Top view of recorded camera positions · tracker units, not verified metres. Amber dots are pose hypotheses; grey dots are rejected or unevaluated.</small><h3>Alignment check</h3><p id="alignment"></p></div></section></main>
<script>const data=${encoded};const el=id=>document.getElementById(id);el('frame').max=data.frames.length-1;el('summary').textContent=data.frames.length+' recorded frames · '+data.accepted+' pose hypotheses · images stay on this laptop';el('alignment').textContent=data.alignment.accepted?'Diagnostic fit passed; navigation remains disabled.':'Rejected: '+data.alignment.reason+(data.alignment.maxRelativeResidual!=null?' · maximum relative residual '+(100*data.alignment.maxRelativeResidual).toFixed(1)+'%':'');
const xs=data.frames.map(f=>f.position[0]),zs=data.frames.map(f=>f.position[2]);const minX=Math.min(...xs),minZ=Math.min(...zs);const extent=Math.max(Math.max(...xs)-minX,Math.max(...zs)-minZ,Number.EPSILON);const coords=data.frames.map(f=>[20+200*(f.position[0]-minX)/extent,230-200*(f.position[2]-minZ)/extent]);
function show(){const i=Number(el('frame').value),f=data.frames[i];el('photo').src='data:image/png;base64,'+f.png;el('title').textContent='Frame '+(i+1)+' / '+data.frames.length;el('status').textContent=f.status;el('evidence').textContent='Reason: '+f.reason+'\nMatches: '+(f.matches??'—')+'\nInliers: '+(f.inliers??'—')+'\nMaximum inlier error: '+(f.errorPx==null?'—':f.errorPx.toFixed(2)+' px');el('route').innerHTML='<polyline fill="none" stroke="#718778" stroke-width="2" points="'+coords.map(p=>p.join(',')).join(' ')+'"/>'+coords.map((p,n)=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(n===i?7:3)+'" fill="'+(n===i?'#fff':data.frames[n].status==='Pose hypothesis'?'#e8b357':'#718778')+'"/>').join('');}el('frame').oninput=show;el('previous').onclick=()=>{el('frame').value=Math.max(0,Number(el('frame').value)-1);show()};el('next').onclick=()=>{el('frame').value=Math.min(data.frames.length-1,Number(el('frame').value)+1);show()};show();</script></html>`;
const token=randomBytes(24).toString('hex');
const server=createServer((req,res)=>{
 if(req.method!=='GET'||req.url!=='/'+token||!req.headers.host?.startsWith('127.0.0.1:')){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'});res.end(html);
});
server.listen(0,'127.0.0.1',async()=>{const port=(server.address() as {port:number}).port;const url='http://127.0.0.1:'+port+'/'+token;await writeFile(new URL('../tmp/route-review-link.txt',import.meta.url),url);console.log('Private route review ready: '+url);});
