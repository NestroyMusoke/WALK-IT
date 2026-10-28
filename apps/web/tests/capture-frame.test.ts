import {it,expect} from 'vitest';
import {captureDimensions,copyCaptureFrame,viewportCoversCanvas} from '../src/capture-frame';
it('accepts the observed iPhone fill crop but rejects letterboxing and invalid viewports',()=>{
 expect(viewportCoversCanvas([1171.5,1562,-157.75,0],856,1562)).toBe(true);
 expect(viewportCoversCanvas([856,1562,0,0],856,1562)).toBe(true);
 expect(viewportCoversCanvas([856,1200,0,181],856,1562)).toBe(false);
 expect(viewportCoversCanvas([1171.5,1562,157.75,0],856,1562)).toBe(false);
 expect(viewportCoversCanvas([0,0,0,0],856,1562)).toBe(false);
 expect(viewportCoversCanvas([NaN,1562,0,0],856,1562)).toBe(false);
});
it('preserves portrait and landscape aspect within pixel rounding',()=>{
 expect(captureDimensions(856,1562)).toEqual({width:351,height:640});
 expect(captureDimensions(1562,856)).toEqual({width:640,height:351});
 expect(()=>captureDimensions(0,10)).toThrow();
});
it('copies pixels synchronously with the supplied pose and does not retain mutable pose arrays',()=>{
 const order:string[]=[];
 const pose={position:[1,2,3],rotation:[0,0,0,1],projection:Array(16).fill(0)};
 const result=copyCaptureFrame({width:4,height:3} as HTMLCanvasElement,{t:10,videoTime:5,revision:2,frame:pose},(source,w,h)=>{
  order.push('copy');expect(source.width).toBe(4);return new Uint8ClampedArray(w*h*4);
 });
 order.push('overlay');pose.position[0]=99;
 expect(order).toEqual(['copy','overlay']);expect(result.frame.position[0]).toBe(1);
 expect(result.t).toBe(10);expect(result.videoTime).toBe(5);
});
