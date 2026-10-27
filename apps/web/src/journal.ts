import {settings} from './settings';

type Identity={build:string;configSha256:string;source:'synthetic'|'live'};
type FrameSample={receivedAtMs:number;videoTimeMs:number|null;status:string};
type Transition={receivedAtMs:number;kind:string};

/** In-memory timing evidence, not a durable capture store or navigation authority.
 * The adapter must stop recording on false, offer export, and report incompleteness.
 * No silent ring-buffer overwrites; transitions have a separate capacity.
 */
export class DiagnosticJournal {
  private identity:Identity;
  private frames:FrameSample[]=[];
  private transitions:Transition[]=[];
  private omitted={frames:0,transitions:0};
  constructor(identity:Identity,
    private frameCapacity=settings.DIAGNOSTIC_FRAME_CAPACITY_COUNT,
    private transitionCapacity=settings.DIAGNOSTIC_TRANSITION_CAPACITY_COUNT){
    if(!identity.build||!/^[a-f0-9]{64}$/i.test(identity.configSha256)
      ||!['synthetic','live'].includes(identity.source))throw Error('Invalid diagnostic identity');
    if(![frameCapacity,transitionCapacity].every(n=>Number.isSafeInteger(n)&&n>0))throw Error('Invalid capacity');
    this.identity={...identity};
  }
  frame(sample:FrameSample){
    this.clock(sample.receivedAtMs);
    if(sample.videoTimeMs!==null)this.clock(sample.videoTimeMs);
    if(!sample.status)throw Error('Missing tracking status');
    if(this.frames.length>=this.frameCapacity){this.omitted.frames++;return false;}
    // Explicit fields exclude images, credentials and arbitrary payloads.
    this.frames.push({receivedAtMs:sample.receivedAtMs,videoTimeMs:sample.videoTimeMs,status:sample.status});
    return true;
  }
  transition(event:Transition){
    this.clock(event.receivedAtMs);
    if(!event.kind)throw Error('Missing transition kind');
    if(this.transitions.length>=this.transitionCapacity){this.omitted.transitions++;return false;}
    this.transitions.push({receivedAtMs:event.receivedAtMs,kind:event.kind});return true;
  }
  export(){return structuredClone({identity:this.identity,frames:this.frames,transitions:this.transitions,
    omitted:this.omitted,complete:this.omitted.frames===0&&this.omitted.transitions===0});}
  private clock(value:number){if(!Number.isFinite(value)||value<0)throw Error('Invalid diagnostic timestamp');}
}
