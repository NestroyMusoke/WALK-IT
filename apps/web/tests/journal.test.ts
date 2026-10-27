import {describe,it,expect} from 'vitest';
import {DiagnosticJournal} from '../src/journal';
const identity={build:'fixture',configSha256:'a'.repeat(64),source:'synthetic' as const};
const frame=(time:number,status='LIMITED')=>({receivedAtMs:time,videoTimeMs:time-1,status});
describe('diagnostic journal',()=>{
  it('preserves rejected-frame timing and transitions separately from samples',()=>{
    const journal=new DiagnosticJournal(identity,2,2);
    expect(journal.frame(frame(10))).toBe(true);
    journal.transition({receivedAtMs:11,kind:'tracking-lost'});
    journal.frame(frame(12,'NORMAL'));
    const output=journal.export();
    expect(output.frames.map(f=>f.receivedAtMs)).toEqual([10,12]);
    expect(output.frames[0].status).toBe('LIMITED');
    expect(output.transitions[0].kind).toBe('tracking-lost');
    expect(output.identity).toEqual(identity);
  });
  it('does not overwrite evidence when full and marks incomplete recording explicitly',()=>{
    const journal=new DiagnosticJournal(identity,1,1);
    journal.frame(frame(10));
    expect(journal.frame(frame(20))).toBe(false);
    journal.transition({receivedAtMs:21,kind:'tracking-lost'});
    expect(journal.transition({receivedAtMs:22,kind:'tracking-recovered'})).toBe(false);
    const output=journal.export();
    expect(output.complete).toBe(false);
    expect(output.omitted).toEqual({frames:1,transitions:1});
    expect(output.frames[0].receivedAtMs).toBe(10);
    expect(output.transitions[0].receivedAtMs).toBe(21);
  });
  it('copies inputs/exports and rejects missing clocks or invalid identity',()=>{
    const journal=new DiagnosticJournal(identity,2,2);
    const sample=frame(10);journal.frame(sample);sample.status='MUTATED';
    journal.export().frames[0].status='MUTATED AGAIN';
    expect(journal.export().frames[0].status).toBe('LIMITED');
    expect(()=>journal.frame(frame(NaN))).toThrow();
    expect(()=>new DiagnosticJournal({...identity,configSha256:''},2,2)).toThrow();
  });
});
