import {validateManifest,summarize,type EvidenceCase} from './evidence-data';
import './evidence.css';
const status=document.querySelector<HTMLParagraphElement>('#status')!;
const casesElement=document.querySelector<HTMLDivElement>('#cases')!;
const split=document.querySelector<HTMLSelectElement>('#split')!;
function text<K extends keyof HTMLElementTagNameMap>(tag:K,value:string){const node=document.createElement(tag);node.textContent=value;return node;}
function picture(file:string,caption:string){const figure=document.createElement('figure');const img=document.createElement('img');img.src=`./evidence/${file}`;img.alt=caption;img.loading='lazy';img.addEventListener('error',()=>{img.hidden=true;figure.append(text('p','Image unavailable — this case is incomplete.'));});figure.append(img,text('figcaption',caption));return figure;}
function card(c:EvidenceCase){
 const article=document.createElement('article');article.append(text('h3',c.id),text('p',`${c.label} · ${c.split} · Ground truth: ${c.groundTruth}`));
 const images=document.createElement('div');images.className='images';images.append(picture(c.image,'Reviewed destination crop'),picture(c.overlay,'SAM mask overlay on the same crop'));article.append(images);
 article.append(text('p',`With models: ${c.withModels.verdict} — ${c.withModels.reason}`),text('p',`Without models: ${c.withoutModels.verdict} — ${c.withoutModels.reason}`));
 for(const [name,evidence]of [['Spark',c.spark],['SAM',c.sam]]as const){const details=document.createElement('details');details.append(text('summary',`${name}: ${evidence.model}`),text('p',`Receipt: ${evidence.receipt}`),text('pre',JSON.stringify(evidence.output,null,2)));article.append(details);}
 const provenance=document.createElement('details');provenance.append(text('summary','Input and configuration identity'),text('pre',`Input SHA-256: ${c.inputSha256}\nConfig SHA-256: ${c.configSha256}`));article.append(provenance);return article;
}
async function load(){
 try{
  const response=await fetch('./evidence/manifest.json');if(!response.ok)throw Error('Manifest unavailable');
  const manifest=validateManifest(await response.json());
  status.textContent=manifest.cases.length?`${manifest.cases.length} reviewed replay cases published. These are saved results.`:'No real cases published yet. Meta inference and the paired ablation remain unproven.';
  const render=()=>{
   const cases=manifest.cases.filter(c=>c.split===split.value);const result=summarize(cases);
   document.querySelector('#scope')!.textContent=`${cases.length} published ${split.value} cases. Planned held-out approach denominator: ${manifest.declaredApproachCount}; this is a target, not a completed-trial count.`;
   const table=document.createElement('table');const head=document.createElement('tr');for(const name of ['Arm','Confirmed','Refused','Abstained','Failed','False confirmations'])head.append(text('th',name));table.append(head);
   for(const arm of ['withModels','withoutModels']as const){const row=document.createElement('tr');const c=result[arm];for(const value of [arm==='withModels'?'With models':'Without models',c.confirmed,c.refused,c.abstained,c.failed,c.falseConfirmations])row.append(text('td',String(value)));table.append(row);}
   document.querySelector('#counts')!.replaceChildren(table);
   casesElement.replaceChildren(...(cases.length?cases.map(card):[text('p','No reviewed cases in this split. There are no example images or invented model responses here.')]));
  };split.addEventListener('change',render);render();
 }catch{status.textContent='Evidence could not be loaded or failed validation. No case results are displayed.';casesElement.replaceChildren();split.disabled=true;}
}
void load();
