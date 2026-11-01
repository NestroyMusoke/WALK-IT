"use client";

import * as React from "react";

/** Thousands of small strokes gather into a readable WALK IT wordmark. */
export interface MurmurationPalette {skyTop:string;skyLow:string;sun:string;ink:string}
export type MurmurationPreset="dusk"|"dawn"|"paper"|"night";
export interface MurmurationWordmarkProps {
  word?:string;birds?:number;preset?:MurmurationPreset;
  palette?:Partial<MurmurationPalette>;flyFor?:number;holdFor?:number;
  reeds?:boolean;interactive?:boolean;fontFamily?:string;
  children?:React.ReactNode;height?:string;className?:string;
}
const PRESETS:Record<MurmurationPreset,MurmurationPalette>={
  dusk:{skyTop:"#1d2b44",skyLow:"#e89a6a",sun:"#ffd2a0",ink:"#14100f"},
  dawn:{skyTop:"#9fb4c9",skyLow:"#f3d6c2",sun:"#fff3df",ink:"#1f2329"},
  paper:{skyTop:"#efe9dd",skyLow:"#e6ddcc",sun:"#ffffff",ink:"#1a1714"},
  night:{skyTop:"#05070d",skyLow:"#1a2236",sun:"#4a5d86",ink:"#dfe6f5"},
};
const SANS_STACK='"Arial Black", "Inter Tight", "Helvetica Neue", Arial, sans-serif';

export function mmwRandom(seed:number){let a=(seed>>>0)||1;return()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
export function mmwCurl(x:number,y:number,t:number){const a=1.7*x+t,b=1.3*y-.6*t,c=2.9*y+1.1*x-.8*t,d=4.3*x-3.7*y+1.3*t;const dx=1.7*Math.cos(a)*Math.cos(b)+.66*Math.cos(c)-1.505*Math.sin(d);const dy=-1.3*Math.sin(a)*Math.sin(b)+1.74*Math.cos(c)+1.295*Math.sin(d);return[dy,-dx];}
export function mmwCentre(t:number){return[.42*Math.sin(t*.21)+.12*Math.sin(t*.53+1),.16*Math.sin(t*.33+2)-.08];}
export function mmwEase(k:number){const x=Math.min(1,Math.max(0,k));return x*x*(3-2*x);}
export function mmwFormationStep(position:number,target:number,dt:number,pull:number){return position+(target-position)*(1-Math.exp(-8*Math.max(0,dt)*Math.min(1,Math.max(0,pull))));}
export function mmwAssign(birds:number,points:number,seed:number){const out=new Int32Array(birds);if(points<=0)return out.fill(-1);const order=Int32Array.from({length:points},(_,i)=>i),rand=mmwRandom(seed);for(let i=points-1;i>0;i--){const j=Math.floor(rand()*(i+1));[order[i],order[j]]=[order[j],order[i]];}for(let i=0;i<birds;i++)out[i]=order[i%points];return out;}
export function mmwAlpha(hex:string,alpha:number){const m=/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex||"").trim());if(!m)return hex;const h=m[1].length===3?m[1].split("").map(c=>c+c).join(""):m[1];return`rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${alpha})`;}

const CSS=`.mmw-root{position:relative;width:100%;overflow:hidden;isolation:isolate;background:var(--mmw-sky)}.mmw-root canvas{position:absolute;inset:0;width:100%;height:100%;display:block;max-width:none}.mmw-over{position:relative;z-index:1;height:100%;pointer-events:none}.mmw-over a,.mmw-over button,.mmw-over [data-interactive]{pointer-events:auto}.mmw-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}`;

export default function MurmurationWordmark({word="WALK IT",birds=4200,preset="night",palette,flyFor=7,holdFor=3.2,reeds=false,interactive=true,fontFamily=SANS_STACK,children,height="100svh",className=""}:MurmurationWordmarkProps){
  const colors={...PRESETS[preset],...palette};
  const rootRef=React.useRef<HTMLDivElement>(null),canvasRef=React.useRef<HTMLCanvasElement>(null);
  const opts=React.useRef({flyFor,holdFor,interactive});opts.current={flyFor,holdFor,interactive};
  const key=[word,birds,colors.skyTop,colors.skyLow,colors.sun,colors.ink,reeds,fontFamily].join("|");
  React.useEffect(()=>{
    const root=rootRef.current,canvas=canvasRef.current,ctx=canvas?.getContext("2d");if(!root||!canvas||!ctx)return;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w=1,h=1,dpr=1,n=0,raf=0,visible=true,sky:HTMLCanvasElement|null=null;
    let px=new Float32Array(0),py=new Float32Array(0),vx=new Float32Array(0),vy=new Float32Array(0),depth=new Float32Array(0),phase=new Float32Array(0),target=new Int32Array(0),tx=new Float32Array(0),ty=new Float32Array(0);
    let hx=-1e5,hy=-1e5,last=performance.now(),clock=0,alive=true;
    const rand=mmwRandom(11);
    const layout=()=>{
      const rect=root.getBoundingClientRect();w=Math.max(1,Math.round(rect.width));h=Math.max(1,Math.round(rect.height));dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
      sky=document.createElement("canvas");sky.width=canvas.width;sky.height=canvas.height;const s=sky.getContext("2d");
      if(s){s.setTransform(dpr,0,0,dpr,0,0);const g=s.createLinearGradient(0,0,0,h);g.addColorStop(0,colors.skyTop);g.addColorStop(.78,colors.skyLow);g.addColorStop(1,colors.skyLow);s.fillStyle=g;s.fillRect(0,0,w,h);const sun=s.createRadialGradient(w*.62,h*.86,0,w*.62,h*.86,Math.max(w,h)*.55);sun.addColorStop(0,mmwAlpha(colors.sun,.55));sun.addColorStop(1,mmwAlpha(colors.sun,0));s.fillStyle=sun;s.fillRect(0,0,w,h);
        if(reeds){const gr=mmwRandom(5),base=h-Math.max(6,h*.012);s.strokeStyle=colors.ink;s.fillStyle=colors.ink;s.fillRect(0,base,w,h-base);for(let x=-10;x<w+10;x+=2+gr()*9){const tall=Math.pow(gr(),1.6)*Math.max(34,h*.13)+6,lean=(gr()-.3)*10;s.lineWidth=.6+gr()*1.2;s.beginPath();s.moveTo(x,base+2);s.quadraticCurveTo(x+lean*.3,base-tall*.6,x+lean,base-tall);s.stroke();}}}
      const m=document.createElement("canvas");m.width=w;m.height=h;const mc=m.getContext("2d",{willReadFrequently:true}),pts:number[]=[];
      if(mc){mc.font=`900 100px ${fontFamily}`;const wordW=mc.measureText(word||" ").width||1;const size=Math.min(w*.78/wordW*100,h*.42/.72);mc.font=`900 ${size}px ${fontFamily}`;mc.textAlign="center";mc.textBaseline="middle";mc.fillText(word||" ",w/2,h*.44);const img=mc.getImageData(0,0,w,h).data;const step=Math.max(2,Math.round(Math.sqrt(w*h/90000)));for(let y=0;y<h;y+=step)for(let x=0;x<w;x+=step)if(img[(y*w+x)*4+3]>128)pts.push(x+(rand()-.5)*step,y+(rand()-.5)*step);}
      tx=new Float32Array(pts.filter((_,i)=>i%2===0));ty=new Float32Array(pts.filter((_,i)=>i%2===1));
      const want=Math.round(Math.max(600,Math.min(9000,birds))*Math.min(1,w*h/(1440*860)));n=Math.max(w<780?900:1500,want);px=new Float32Array(n);py=new Float32Array(n);vx=new Float32Array(n);vy=new Float32Array(n);depth=new Float32Array(n);phase=new Float32Array(n);
      for(let i=0;i<n;i++){const a=rand()*Math.PI*2,r=Math.sqrt(rand());px[i]=w*.5+Math.cos(a)*r*w*.22;py[i]=h*.4+Math.sin(a)*r*h*.16;depth[i]=.55+rand()*.45;phase[i]=rand()*Math.PI*2;}
      target=mmwAssign(n,tx.length,23);if(reduced){for(let i=0;i<n;i++){const j=target[i];if(j>=0){px[i]=tx[j];py[i]=ty[j];}}paint();}
    };
    const paint=()=>{ctx.setTransform(1,0,0,1,0,0);if(sky)ctx.drawImage(sky,0,0);ctx.setTransform(dpr,0,0,dpr,0,0);for(let pass=0;pass<2;pass++){ctx.beginPath();for(let i=0;i<n;i++){const near=depth[i]>.78;if((pass===1)!==near)continue;const s=(1.6+depth[i]*2.2),sp=Math.hypot(vx[i],vy[i])+.001,dx=vx[i]/sp,dy=vy[i]/sp,flap=.55+.45*Math.sin(phase[i]),bx=px[i],by=py[i],wx=-dx*s,wy=-dy*s,nx=-dy*s*flap,ny=dx*s*flap;ctx.moveTo(bx+wx+nx,by+wy+ny);ctx.lineTo(bx,by);ctx.lineTo(bx+wx-nx,by+wy-ny);}ctx.strokeStyle=colors.ink;ctx.globalAlpha=pass===0?.55:.92;ctx.lineWidth=pass===0?.9:1.25;ctx.stroke();}ctx.globalAlpha=1;};
    const frame=(now:number)=>{raf=0;if(!visible||!alive||reduced)return;const dt=Math.min(.05,(now-last)/1000);last=now;clock+=dt;const o=opts.current,fly=Math.max(1,o.flyFor),cycle=fly+2.4+Math.max(.5,o.holdFor)+.6,tc=clock%cycle;let pull=0;if(tc>fly&&tc<=fly+2.4)pull=mmwEase((tc-fly)/2.4);else if(tc>fly+2.4&&tc<=fly+2.4+o.holdFor)pull=1;else if(tc>fly+2.4+o.holdFor)pull=1-mmwEase((tc-fly-2.4-o.holdFor)/.6);
      const u=Math.min(w,h),cen=mmwCentre(clock),cx=w/2+cen[0]*w*.5,cy=h*.42+cen[1]*h,t=clock*.35,hawk=o.interactive&&hx>-1e4,hawkR=u*.16;
      for(let i=0;i<n;i++){const x=px[i],y=py[i];let ax=0,ay=0;const cv=mmwCurl((x-w/2)/u*2.2+depth[i]*.25,(y-h/2)/u*2.2,t),free=1-pull;ax+=cv[0]*420*free;ay+=cv[1]*420*free;const dx=cx-x,dy=(cy-y)*1.6,d=Math.hypot(dx,dy)/u,hold=d<.14?.15:.15+(d-.14)*6;ax+=dx*hold*2.2*free;ay+=dy*hold*1.6*free;const j=target[i];if(pull>0&&j>=0){ax+=(tx[j]-x)*9*pull-vx[i]*3.2*pull;ay+=(ty[j]-y)*9*pull-vy[i]*3.2*pull;}if(hawk){const dx=x-hx,dy=y-hy,d2=dx*dx+dy*dy;if(d2<hawkR*hawkR){const dist=Math.sqrt(d2)+.01,f=(1-dist/hawkR)*5200;ax+=dx/dist*f;ay+=dy/dist*f;}}let nvx=(vx[i]+ax*dt)*(1-1.1*dt),nvy=(vy[i]+ay*dt)*(1-1.1*dt),speed=Math.hypot(nvx,nvy),cap=520+380*pull;if(speed>cap){nvx=nvx/speed*cap;nvy=nvy/speed*cap;}vx[i]=nvx*(1-.35*pull);vy[i]=nvy*(1-.35*pull);const nextX=x+nvx*dt,nextY=y+nvy*dt;px[i]=j>=0?mmwFormationStep(nextX,tx[j],dt,pull):nextX;py[i]=j>=0?mmwFormationStep(nextY,ty[j],dt,pull):nextY;phase[i]+=dt*(9+speed*.02);}
      paint();raf=requestAnimationFrame(frame);
    };
    const start=()=>{if(!raf&&!reduced&&visible){last=performance.now();raf=requestAnimationFrame(frame);}};
    const onMove=(e:PointerEvent)=>{const b=canvas.getBoundingClientRect();hx=e.clientX-b.left;hy=e.clientY-b.top;};
    const onLeave=()=>{hx=-1e5;hy=-1e5;};
    layout();start();root.addEventListener("pointermove",onMove);root.addEventListener("pointerleave",onLeave);
    const ro=new ResizeObserver(()=>layout());ro.observe(root);
    const io=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true;if(visible)start();else if(raf){cancelAnimationFrame(raf);raf=0;}});io.observe(root);
    if(document.fonts?.ready)void document.fonts.ready.then(()=>{if(alive)layout();});
    return()=>{alive=false;if(raf)cancelAnimationFrame(raf);ro.disconnect();io.disconnect();root.removeEventListener("pointermove",onMove);root.removeEventListener("pointerleave",onLeave);};
  },[key]);
  return <div ref={rootRef} className={`mmw-root ${className}`} style={{height,"--mmw-sky":colors.skyTop} as React.CSSProperties}><style>{CSS}</style><canvas ref={canvasRef} aria-hidden="true"/><span className="mmw-sr">{word}</span>{children?<div className="mmw-over">{children}</div>:null}</div>;
}
