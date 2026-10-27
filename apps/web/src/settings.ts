import raw from '../../../config/vision.yaml?raw';
export const settings:Record<string,number>=JSON.parse(raw);
export async function configurationHash(){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
}
