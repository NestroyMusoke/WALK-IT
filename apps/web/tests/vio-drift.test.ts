import {expect,it} from 'vitest';
import {VioDriftBudget} from '../src/vio-drift';
import {settings} from '../src/settings';

it('starts at a calibrated marker and accumulates metric travel across tracker frames',()=>{
 const budget=new VioDriftBudget(4,[0,0,0]);
 const a=budget.update([4,0,0],'NORMAL');
 expect(a.accepted).toBe(true);
 expect(a.travelledM).toBeCloseTo(1);
 expect(a.estimatedDriftBoundM).toBeCloseTo(settings.VIO_DRIFT_START_BOUND_M+settings.VIO_DRIFT_RATE_M_PER_M);
 const b=budget.update([8,0,0],'NORMAL');
 expect(b.travelledM).toBeCloseTo(2);
 expect(b.accepted).toBe(true);
});

it('revokes on tracking loss, discontinuity and accumulated budget exhaustion',()=>{
 const lost=new VioDriftBudget(1,[0,0,0]);
 expect(lost.update([0.2,0,0],'LIMITED').accepted).toBe(false);
 expect(lost.update([0.3,0,0],'NORMAL').accepted).toBe(false);
 const jumped=new VioDriftBudget(1,[0,0,0]);
 expect(jumped.update([settings.VIO_MAX_FRAME_STEP_M+0.1,0,0],'NORMAL').reason).toBe('tracker-jump');
 const walk=new VioDriftBudget(1,[0,0,0]);
 let result;
 for(let i=1;i<100;i++){
  result=walk.update([i,0,0],'NORMAL');
  if(!result.accepted)break;
 }
 expect(result?.reason).toBe('drift-budget-exhausted');
});

it('rejects missing or impossible calibration',()=>{
 expect(()=>new VioDriftBudget(0,[0,0,0])).toThrow();
 expect(()=>new VioDriftBudget(1,[NaN,0,0])).toThrow();
});
