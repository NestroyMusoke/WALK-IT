/** A small paved walk: the stones turn and end at one raised threshold. */
const {Cam,fit,proj,facing,rings,prism,solid,put,mk,place,tween,tset,tval,tdone,register,pointer,disposer}=HL;

// The dogleg is readable without arrows: stones continue past a turn to one threshold.
const STONES=[[-70,-46],[-48,-46],[-26,-46],[-4,-46],[16,-37],[30,-20],[30,2],[30,24],[30,46]];
function mount({stage,svg,read},value){
  const bag=disposer(),C=Cam(45,.5,2.7);
  fit(C,[[-85,-65,0],[52,65,0],[-85,65,0],[52,-65,0],[-85,-65,30],[52,65,30]],200,166);
  const P=proj(C),front=facing(C),group=mk('g',{},svg);
  const items=STONES.map(([x,y],i)=>{
    const [ring,inner]=rings(x-8,y-7,x+8,y+7,3,1.2);
    const drawing=solid(group),rise=tween(i===0?7:i===8?13:3);
    return {x,y,i,ring,inner,drawing,rise,last:NaN};
  });
  const endpoint=mk('circle',{r:2.6,class:'dot m'},group);
  place(endpoint,P(STONES[8][0],STONES[8][1],17));
  function draw(it,now){const z=tval(it.rise,now);if(z===it.last)return;it.last=z;put(it.drawing,prism(P,front,it.ring,it.inner,0,z));}
  const clock=register(stage,(_dt,now)=>{let moving=false;for(const it of items){draw(it,now);moving ||= !tdone(it.rise,now);}return moving;});
  bag.add(clock.unregister);for(const it of items)draw(it,performance.now());
  let active=-1,spread=value;
  function select(index){if(index===active)return;active=index;const now=performance.now();items.forEach((it,i)=>{
    const rest=i===0?7:i===8?13:3;
    const near=index>=0?Math.max(0,1-Math.abs(i-index)/4):0;
    tset(it.rise,rest+near*spread,now,index<0?0:Math.abs(i-index)*35);
    it.drawing.sil.classList.toggle('hi',index===i||(index<0&&i===0));
  });
  endpoint.setAttribute('class',active===8?'dot':'dot m');
  read.textContent=index<0?'rest':index===0?'start':index===8?'arrive':index===4?'turn':'along';
  clock.wake();}
  // Pick from the fixed resting centres, so lifting a stone never changes its hit area.
  function hit([sx,sy]){let chosen=-1,dist=27;items.forEach((it,i)=>{const p=P(it.x,it.y,it.i===0?7:it.i===8?13:3),d=Math.hypot(sx-p[0],sy-p[1]);if(d<dist){dist=d;chosen=i;}});return chosen;}
  items[0].drawing.sil.classList.add('hi');
  bag.add(pointer(stage,{move:p=>select(hit(p)),leave:()=>select(-1)}));
  bag.add(()=>svg.replaceChildren());
  return {set(v){spread=v;if(active>=0){const a=active;active=-1;select(a);}},destroy:bag.dispose};
}
hairline({name:'route-stones',means:'A walk continues through a turn to one raised destination. Touch a stone to trace the way.',rules:[1,2,4,5,7,9,10],range:[4,9,15],tour:[[114,193],[165,173],[234,159],null],mount});
