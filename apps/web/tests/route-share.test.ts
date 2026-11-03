import {expect,it} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createPrivateRouteShare,readPrivateRouteShare,revokePrivateRouteShare,makeVisitorUrl} from '../../../server/route-share';

const SHA='a'.repeat(64);
function candidate(){return {accepted:true,sourceCaptureSha256:SHA,configSha256:SHA,
 routeId:'route1',units:'metres',markerObservationCount:5,
 path:[{keyframeId:'kf0',position:[0,0,0]},{keyframeId:'kf1',position:[1,0,0]}],
 destination:{pathIndex:1,keyframeId:'kf1'},
 scaleVerified:false,navigationReady:false,arrowAuthorized:false};}

it('issues an expiring private marker-route candidate without authorizing an arrow',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'walkit-share-'));
 try{
  const result=await createPrivateRouteShare(dir,candidate(),1000,60000);
  expect(result.token).toMatch(/^[a-f0-9]{48}$/);
  const loaded=await readPrivateRouteShare(dir,result.token,1100);
  expect(loaded?.routeId).toBe('route1');
  expect(loaded?.arrowAuthorized).toBe(false);
  expect(loaded).not.toHaveProperty('images');
  expect(await readPrivateRouteShare(dir,result.token,61001)).toBeNull();
  await revokePrivateRouteShare(dir,result.token);
  expect(await readPrivateRouteShare(dir,result.token,1100)).toBeNull();
 }finally{await rm(dir,{recursive:true,force:true});}
});
it('refuses unaccepted or already-authorized input',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'walkit-share-'));
 try{
  for(const bad of [{...candidate(),accepted:false},{...candidate(),arrowAuthorized:true}])
   await expect(createPrivateRouteShare(dir,bad,1000,60000)).rejects.toThrow();
 }finally{await rm(dir,{recursive:true,force:true});}
});
it('adds the route token to the temporary visitor URL without dropping its session key',()=>{
 const token='a'.repeat(48);
 expect(makeVisitorUrl('https://example.test/live.html#key=private',token))
  .toBe(`https://example.test/live.html?route=${token}#key=private`);
 expect(()=>makeVisitorUrl('http://example.test/live.html#key=private',token)).toThrow();
});
