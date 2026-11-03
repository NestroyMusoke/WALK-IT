import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {randomBytes,createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,sep,extname} from 'node:path';
import {gzip} from 'node:zlib';
import {promisify} from 'node:util';
import {createReceiver} from './receiver.ts';
import {handleRouteShare} from './route-share-handler.ts';
import {createMarkerScanHandler,createAuthorMarkerCheckHandler,createPythonMarkerInfer,createPythonMarkerAlign} from './marker-scan-handler.ts';
const root=resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const privateRoot=fileURLToPath(new URL('../eval/sessions/',import.meta.url));
const accessKey=randomBytes(24).toString('hex');
const receiver=createReceiver(privateRoot,accessKey);
const configRaw=readFileSync(new URL('../config/vision.yaml',import.meta.url));
const config=JSON.parse(configRaw.toString());
const configSha=createHash('sha256').update(configRaw).digest('hex');
const markerInfer=createPythonMarkerInfer(fileURLToPath(new URL('../.venv/Scripts/python.exe',import.meta.url)),
 fileURLToPath(new URL('../',import.meta.url)),config.MARKER_SCAN_REQUEST_TIMEOUT_MS);
const markerAlign=createPythonMarkerAlign(fileURLToPath(new URL('../.venv/Scripts/python.exe',import.meta.url)),
 fileURLToPath(new URL('../',import.meta.url)),config.MARKER_SCAN_REQUEST_TIMEOUT_MS);
const authorMarkerCheck=createAuthorMarkerCheckHandler(accessKey,configSha,markerInfer,
 config.E05_IMAGE_MAX_INPUT_BYTES,markerAlign,config.ALIGNMENT_MIN_PAIRS_COUNT,
 config.ALIGNMENT_WINDOW_MAX_PAIRS_COUNT,config.ALIGNMENT_WINDOW_MAX_AGE_MS);
const markerScan=createMarkerScanHandler(privateRoot,configSha,
 markerInfer,
 config.E05_IMAGE_MAX_INPUT_BYTES,
 markerAlign,
 config.ALIGNMENT_MIN_PAIRS_COUNT,config.ALIGNMENT_WINDOW_MAX_PAIRS_COUNT,config.ALIGNMENT_WINDOW_MAX_AGE_MS);
const compress=promisify(gzip);
const compressed=new Map<string,{modified:number;data:Buffer}>();
const mime:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.wasm':'application/wasm','.json':'application/json','.svg':'image/svg+xml'};
await mkdir(new URL('../tmp/',import.meta.url),{recursive:true});
createServer((req,res)=>{
  if(handleRouteShare(req,res,privateRoot))return;
  if(authorMarkerCheck(req,res))return;
  if(markerScan(req,res))return;
  receiver(req,res,()=>{void(async()=>{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
  const pathname=decodeURIComponent(new URL(req.url||'/', 'http://localhost').pathname);
  const file=resolve(root,'.'+(pathname==='/'?'/live.html':pathname));
  if(!file.startsWith(root+sep)&&file!==root){res.writeHead(403);res.end();return;}
  const info=await stat(file);if(!info.isFile())throw Error();
  const useGzip=/gzip/.test(req.headers['accept-encoding']||'')&&['.js','.css','.html'].includes(extname(file));
  let data:Buffer;
  if(useGzip){let cached=compressed.get(file);if(!cached||cached.modified!==info.mtimeMs){cached={modified:info.mtimeMs,data:await compress(await readFile(file))};compressed.set(file,cached);}data=cached.data;}else data=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Content-Length':data.length,'Cache-Control':pathname.startsWith('/vendor/')?'public, max-age=3600':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Vary':'Accept-Encoding',...(useGzip?{'Content-Encoding':'gzip'}:{})});
  res.end(req.method==='HEAD'?undefined:data);
})().catch(()=>{if(!res.headersSent)res.writeHead(404);res.end();});});
}).listen(5180,'127.0.0.1',()=>{
  void writeFile(new URL('../tmp/phone-access.json',import.meta.url),JSON.stringify({accessKey,port:5180}))
    .then(()=>console.log('Phone test receiver ready on http://127.0.0.1:5180'));
});
