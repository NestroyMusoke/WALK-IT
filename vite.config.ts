import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {createReceiver} from './server/receiver.ts';
export default defineConfig({root:'apps/web',base:'./',resolve:{alias:{'@':fileURLToPath(new URL('./apps/web/src/',import.meta.url))}},plugins:[react(),tailwindcss(),{name:'walkit-local-diagnostics',configureServer(server){
  server.middlewares.use(createReceiver(fileURLToPath(new URL('./eval/sessions/',import.meta.url))));
}}],server:{host:'127.0.0.1',port:5173,strictPort:true},build:{outDir:process.env.WALKIT_VERIFY_BUILD==='1'?'../../tmp/check-dist':'../../dist',emptyOutDir:true,rolldownOptions:{input:{diagnostic:fileURLToPath(new URL('./apps/web/diagnostic.html',import.meta.url)),evidence:fileURLToPath(new URL('./apps/web/evidence.html',import.meta.url)),index:fileURLToPath(new URL('./apps/web/index.html',import.meta.url)),live:fileURLToPath(new URL('./apps/web/live.html',import.meta.url)),welcome:fileURLToPath(new URL('./apps/web/welcome.html',import.meta.url))}}}});
