export type InitializableSdk = {initialize:()=>void|Promise<void>};
export async function prepareSdk<T extends InitializableSdk>(ready:Promise<T>,timeoutMs:number):Promise<T>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  const deadline=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('SDK loading timed out. Reload to retry.')),timeoutMs);});
  try{
    return await Promise.race([ready.then(async sdk=>{await sdk.initialize();return sdk;}),deadline]);
  }finally{clearTimeout(timer);}
}
