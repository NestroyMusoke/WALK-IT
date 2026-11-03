import {expect,it} from 'vitest';
import {createServer} from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createPrivateRouteShare} from '../../../server/route-share';
import {handleRouteShare} from '../../../server/route-share-handler';

it('serves only an unexpired bearer route candidate and refuses unknown tokens',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'walkit-route-http-'));
 const share=await createPrivateRouteShare(directory,{accepted:true,sourceCaptureSha256:'a'.repeat(64),
  configSha256:'b'.repeat(64),routeId:'r1',units:'metres',markerObservationCount:5,
  path:[{keyframeId:'kf0',position:[0,0,0]},{keyframeId:'kf1',position:[1,0,0]}],
  destination:{pathIndex:1,keyframeId:'kf1'},scaleVerified:false,navigationReady:false,arrowAuthorized:false},
 Date.now(),60000);
 const server=createServer((req,res)=>{if(!handleRouteShare(req,res,directory))res.writeHead(404).end();});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address();if(!address||typeof address==='string')throw Error('No port');
 const base=`http://127.0.0.1:${address.port}`;
 try{
  const good=await fetch(`${base}/__walkit/route/${share.token}`);
  expect(good.status).toBe(200);
  const route=await good.json();
  expect(route.arrowAuthorized).toBe(false);
  expect(route).not.toHaveProperty('images');
  expect((await fetch(`${base}/__walkit/route/${'c'.repeat(48)}`)).status).toBe(404);
  expect((await fetch(`${base}/__walkit/route/${share.token}`,{method:'POST'})).status).toBe(405);
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));await rm(directory,{recursive:true,force:true});}
});
