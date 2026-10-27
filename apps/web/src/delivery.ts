import {settings} from './settings';
export type TestSession={id:string;token:string};
export async function startTestSession():Promise<TestSession>{
  const response=await fetch('/__walkit/session',{method:'POST',signal:AbortSignal.timeout(settings.DIAGNOSTIC_REQUEST_TIMEOUT_MS)});
  if(!response.ok)throw Error('Laptop receiver unavailable');
  const session=await response.json();
  if(typeof session.id!=='string'||typeof session.token!=='string')throw Error('Invalid test session');
  return session;
}
export async function deliverReport(report:unknown,session:TestSession,request:typeof fetch=fetch){
  const response=await request('/__walkit/result',{method:'POST',headers:{'Content-Type':'application/json','X-Walkit-Token':session.token},
    body:JSON.stringify({id:session.id,report}),signal:AbortSignal.timeout(settings.DIAGNOSTIC_REQUEST_TIMEOUT_MS)});
  if(!response.ok)throw Error('Laptop has not confirmed receipt');
  const receipt=await response.json();
  if(receipt.saved!==true||receipt.id!==session.id)throw Error('Invalid laptop receipt');
  return receipt as {saved:true;id:string;passed:boolean};
}
