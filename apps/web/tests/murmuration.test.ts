import {expect,it} from 'vitest';
import {mmwAssign,mmwRandom,mmwEase,mmwFormationStep} from '../src/components/ui/murmuration-wordmark';

it('makes a reproducible and bounded formation without using random browser state',()=>{
 const a=[...mmwAssign(32,5,23)];
 expect(a).toEqual([...mmwAssign(32,5,23)]);
 expect(a.every(index=>index>=0&&index<5)).toBe(true);
 expect([...mmwAssign(3,0,23)]).toEqual([-1,-1,-1]);
 expect(mmwRandom(11)()).toBe(mmwRandom(11)());
});

it('keeps formation easing inside its declared range',()=>{
 expect(mmwEase(-1)).toBe(0);
 expect(mmwEase(2)).toBe(1);
 expect(mmwEase(.5)).toBe(.5);
});

it('settles to a word target during the hold without jumping when the flock is free',()=>{
 let x=300;
 for(let i=0;i<60;i++)x=mmwFormationStep(x,50,1/60,1);
 expect(Math.abs(x-50)).toBeLessThan(1);
 expect(mmwFormationStep(300,50,1/60,0)).toBe(300);
});
