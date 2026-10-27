import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,sep,extname} from 'node:path';
import {gzip} from 'node:zlib';
import {promisify} from 'node:util';
import {createReceiver} from './receiver.ts';
const root=resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const privateRoot=fileURLToPath(new URL('../eval/sessions/',import.meta.url));
const accessKey=randomBytes(24).toString('hex');
const receiver=createReceiver(privateRoot,accessKey);
const compress=promisify(gzip);
const compressed=new Map<string,{modified:number;data:Buffer}>();
const mime:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.wasm':'application/wasm','.json':'application/json','.svg':'image/svg+xml'};
await mkdir(new URL('../tmp/',import.meta.url),{recursive:true});
await writeFile(new URL('../tmp/phone-access.json',import.meta.url),JSON.stringify({accessKey,port:5180}));
createServer((req,res)=>receiver(req,res,()=>{void(async()=>{
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
})().catch(()=>{if(!res.headersSent)res.writeHead(404);res.end();});})).listen(5180,'127.0.0.1',()=>console.log('Phone test receiver ready on http://127.0.0.1:5180'));
