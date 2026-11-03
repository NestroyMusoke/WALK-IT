import type {IncomingMessage,ServerResponse} from 'node:http';
import {readPrivateRouteShare} from './route-share.ts';

/** Bearer-token read only. The payload is a route hypothesis with no images or permission to draw arrows. */
export function handleRouteShare(req:IncomingMessage,res:ServerResponse,directory:string){
 const pathname=new URL(req.url||'/', 'http://localhost').pathname;
 if(!pathname.startsWith('/__walkit/route/'))return false;
 const headers={'Content-Type':'application/json','Cache-Control':'no-store',
  'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
 if(req.method!=='GET'){res.writeHead(405,headers);res.end(JSON.stringify({error:'GET required'}));return true;}
 const token=pathname.slice('/__walkit/route/'.length);
 void readPrivateRouteShare(directory,token,Date.now()).then(route=>{
  res.writeHead(route?200:404,headers);
  res.end(JSON.stringify(route||{error:'Route unavailable or expired'}));
 }).catch(()=>{res.writeHead(404,headers);res.end(JSON.stringify({error:'Route unavailable'}));});
 return true;
}
