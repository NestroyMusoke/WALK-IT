import {expect,it} from 'vitest';
import {parseVisitorRoute,routeTokenFromSearch} from '../src/visitor-route';

function route(){return {routeId:'r1',sourceCaptureSha256:'a'.repeat(64),
 configSha256:'b'.repeat(64),units:'metres',markerObservationCount:5,
 path:[{keyframeId:'kf0',position:[0,0,0]},{keyframeId:'kf1',position:[1,0,0]}],
 destination:{pathIndex:1,keyframeId:'kf1'},expiresAtMs:60000,
 scaleVerified:false,navigationReady:false,arrowAuthorized:false};}
it('loads only an unexpired marker-route candidate and leaves arrows unauthorized',()=>{
 expect(routeTokenFromSearch(`?route=${'c'.repeat(48)}`)).toBe('c'.repeat(48));
 expect(parseVisitorRoute(route(),1000).arrowAuthorized).toBe(false);
});
it('refuses expired, forged and malformed shares',()=>{
 expect(()=>parseVisitorRoute(route(),60001)).toThrow();
 expect(()=>parseVisitorRoute({...route(),arrowAuthorized:true},1000)).toThrow();
 expect(()=>parseVisitorRoute({...route(),path:[]},1000)).toThrow();
 expect(()=>routeTokenFromSearch('?route=../bad')).toThrow();
});
