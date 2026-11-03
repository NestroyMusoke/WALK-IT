import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {createReceiver} from './server/receiver.ts';
import {handleRouteShare} from './server/route-share-handler.ts';
import {createMarkerScanHandler,createPythonMarkerInfer,createPythonMarkerAlign} from './server/marker-scan-handler.ts';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export default defineConfig({root:'apps/web',base:'./',resolve:{alias:{'@':fileURLToPath(new URL('./apps/web/src/',import.meta.url))}},plugins:[react(),tailwindcss(),{name:'walkit-local-diagnostics',configureServer(server){
  const directory=fileURLToPath(new URL('./eval/sessions/',import.meta.url));
  const configRaw=readFileSync(new URL('./config/vision.yaml',import.meta.url));
  const config=JSON.parse(configRaw.toString());
  const markerScan=createMarkerScanHandler(directory,createHash('sha256').update(configRaw).digest('hex'),
   createPythonMarkerInfer(fileURLToPath(new URL('./.venv/Scripts/python.exe',import.meta.url)),
    fileURLToPath(new URL('./',import.meta.url)),config.MARKER_SCAN_REQUEST_TIMEOUT_MS),
   config.E05_IMAGE_MAX_INPUT_BYTES,
   createPythonMarkerAlign(fileURLToPath(new URL('./.venv/Scripts/python.exe',import.meta.url)),
    fileURLToPath(new URL('./',import.meta.url)),config.MARKER_SCAN_REQUEST_TIMEOUT_MS),
   config.ALIGNMENT_MIN_PAIRS_COUNT,config.ALIGNMENT_WINDOW_MAX_PAIRS_COUNT);
  server.middlewares.use((req,res,next)=>{if(!handleRouteShare(req,res,directory))next();});
  server.middlewares.use((req,res,next)=>{if(!markerScan(req,res))next();});
  server.middlewares.use(createReceiver(directory));
}}],server:{host:'127.0.0.1',port:5173,strictPort:true},build:{outDir:process.env.WALKIT_VERIFY_BUILD==='1'?'../../tmp/check-dist':'../../dist',emptyOutDir:true,rolldownOptions:{input:{arrowCheck:fileURLToPath(new URL('./apps/web/arrow-check.html',import.meta.url)),diagnostic:fileURLToPath(new URL('./apps/web/diagnostic.html',import.meta.url)),evidence:fileURLToPath(new URL('./apps/web/evidence.html',import.meta.url)),index:fileURLToPath(new URL('./apps/web/index.html',import.meta.url)),live:fileURLToPath(new URL('./apps/web/live.html',import.meta.url)),replay:fileURLToPath(new URL('./apps/web/replay.html',import.meta.url)),welcome:fileURLToPath(new URL('./apps/web/welcome.html',import.meta.url))}}}});
