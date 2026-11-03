import {expect,it} from 'vitest';
import {routeProgress} from '../src/route-progress';

const path=[[0,0,0],[2,0,0],[2,0,-2],[4,0,-2]];
const transform={direction:'map-to-session',scale:4,
 rotation:[1,0,0,0,1,0,0,0,1],translation:[10,0,5]};
const session=(p:number[])=>p.map((v,i)=>v*4+transform.translation[i]);

it('advances only to the adjacent segment near a real waypoint despite tracker scale',()=>{
 expect(routeProgress(path,transform,session([0.5,0,0]),0).pathIndex).toBe(0);
 expect(routeProgress(path,transform,session([1.9,0,-0.1]),0).pathIndex).toBe(1);
 expect(routeProgress(path,transform,session([2,0,-1.1]),1).pathIndex).toBe(1);
});

it('pauses off route and at a nonadjacent crossing',()=>{
 expect(routeProgress(path,transform,session([5,0,4]),0).accepted).toBe(false);
 const crossing=[[0,0,0],[2,0,0],[2,0,-2],[0,0,-2],[0,0,0]];
 expect(routeProgress(crossing,transform,session([0.1,0,0]),0).reason).toBe('ambiguous-crossing');
});

it('rejects invalid or unverified inputs',()=>{
 expect(routeProgress(path,{...transform,scale:0},session([0,0,0]),0).accepted).toBe(false);
 expect(routeProgress(path,transform,session([0,0,0]),path.length-1).accepted).toBe(false);
});
