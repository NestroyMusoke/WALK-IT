import {settings,configurationHash} from './settings';
import type {LiveEvent} from '../../../server/live-schema';
export class LiveUpload{
  events:LiveEvent[]=[];private sent=0;private seq=0;private busy=false;
  private session?:{id:string;token:string};private sha='';
  constructor(private notify:(message:string)=>void){}
  async start(){
    this.sha=await configurationHash();
    const key=new URLSearchParams(location.hash.slice(1)).get('key')||sessionStorage.getItem('walkit-live-access')||'';
    if(key)sessionStorage.setItem('walkit-live-access',key);
    const r=await fetch('/__walkit/session',{method:'POST',headers:{'X-Walkit-Access':key},signal:AbortSignal.timeout(settings.DIAGNOSTIC_REQUEST_TIMEOUT_MS)});
    if(!r.ok)throw Error('Connection failed. Open the complete test link and retry.');
    this.session=await r.json();this.notify('Connected to laptop. Logs send automatically.');
  }
  add(kind:string,label:string,values:number[]=[]){
    if(this.events.length>=settings.DIAGNOSTIC_FRAME_CAPACITY_COUNT)return false;
    this.events.push({t:performance.now(),kind,label:label.replace(/[^a-zA-Z0-9 _.:/-]/g,' ').slice(0,128),values:values.map(n=>Number.isFinite(n)?n:-1)});return true;
  }
  async flush(){
    if(this.busy||!this.session)return;this.busy=true;
    try{
      while(this.sent<this.events.length){
        const events=this.events.slice(this.sent,this.sent+settings.LIVE_BATCH_EVENT_COUNT);
        const response=await fetch('/__walkit/live',{method:'POST',headers:{'Content-Type':'application/json','X-Walkit-Token':this.session.token},
          body:JSON.stringify({id:this.session.id,report:{configSha256:this.sha,seq:this.seq,events}}),signal:AbortSignal.timeout(settings.DIAGNOSTIC_REQUEST_TIMEOUT_MS)});
        if(!response.ok)throw Error('Upload pending');
        const receipt=await response.json();if(receipt.saved!==true||receipt.seq!==this.seq||receipt.id!==this.session.id)throw Error('Invalid receipt');
        this.sent+=events.length;this.seq++;
      }
      this.notify(`Saved on laptop: ${this.sent} events. ${this.events.some(e=>e.kind==='end')?'Test finished.':''}`);
    }catch{this.notify(`Upload pending: ${this.events.length-this.sent} events. Keep this page open; retry is automatic.`);}
    finally{this.busy=false;}
  }
  download(){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify({build:'E03-1',configSha256:this.sha,sent:this.sent,events:this.events})],{type:'application/json'}));a.href=url;a.download='walkit-live-diagnostic.json';a.click();URL.revokeObjectURL(url);}
}
