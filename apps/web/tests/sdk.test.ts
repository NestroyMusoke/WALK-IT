import {describe,it,expect,vi} from 'vitest';
import {prepareSdk,type InitializableSdk} from '../src/sdk';
describe('SDK readiness',()=>{
  it('waits for SDK readiness and initialization before reporting ready',async()=>{
    let ready!:(value:InitializableSdk)=>void;
    const initialized=vi.fn(async()=>{});
    const waiting=prepareSdk(new Promise<InitializableSdk>(resolve=>{ready=resolve;}),100);
    expect(initialized).not.toHaveBeenCalled();ready({initialize:initialized});
    await waiting;expect(initialized).toHaveBeenCalledOnce();
  });
  it('fails explicitly on initialization failure and timeout',async()=>{
    await expect(prepareSdk(Promise.resolve({initialize:async()=>{throw Error('unsupported');}}),100)).rejects.toThrow('unsupported');
    await expect(prepareSdk(new Promise<InitializableSdk>(()=>{}),1)).rejects.toThrow('timed out');
  });
});
