import * as React from 'react';
import {createRoot} from 'react-dom/client';
import MurmurationWordmark from '@/components/ui/murmuration-wordmark';
import {LiquidButton} from '@/components/ui/liquid-glass-button';
import './welcome.css';

export function App(){
  return <div className="site" data-layout="editorial">
    <header className="site-header wrap">
      <a className="brand" href="./" aria-label="WALK IT home"><span className="brand-mark" aria-hidden="true"><i/><i/></span><span>WALK IT</span></a>
      <nav aria-label="Main navigation">
        <a className="nav-link" href="#idea">The idea</a>
        <a className="nav-link" href="#route">The route</a>
        <a className="nav-link" href="./evidence.html">Evidence</a>
        <LiquidButton asChild size="sm" className="nav-action"><a href="./live.html">Open field build <span aria-hidden="true">↗</span></a></LiquidButton>
      </nav>
    </header>

    <main>
      <section className="hero wrap" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot"/> WAYFINDING, FROM A REAL WALK</p>
          <h1 id="hero-title">From nearby<br/>to <em>right here.</em></h1>
          <p className="hero-lede">A map can bring someone close. WALK IT is for the part after that: the turn, the entrance, the stall, the exact door.</p>
          <div className="hero-actions">
            <LiquidButton asChild variant="primary" size="lg" className="hero-button"><a href="./live.html">Open field build <span aria-hidden="true">↗</span></a></LiquidButton>
            <a className="line-link" href="#idea">See the idea <span aria-hidden="true">↓</span></a>
          </div>
          <p className="hero-note">A product in field testing. Route accuracy is still being measured.</p>
        </div>
        <div className="hero-art">
          <div className="art-label"><span>WALK / 001</span><span>ONE PERSON SHOWS THE WAY</span></div>
          <MurmurationWordmark word="WALK IT" preset="dusk" palette={{skyTop:'#0b2630',skyLow:'#47676a',sun:'#e8ad77',ink:'#f7f2e8'}} birds={3600} flyFor={3.8} holdFor={4} reeds={false} height="clamp(300px, 36vw, 530px)" className="hero-wordmark"/>
          <div className="art-foot"><span className="art-foot-mark" aria-hidden="true">✳</span><span>The path becomes shareable.</span><span>01 / 03</span></div>
        </div>
      </section>

      <section id="idea" className="idea-section" aria-labelledby="idea-title">
        <div className="wrap idea-grid">
          <div className="section-label"><span className="section-index">01</span><span>THE GAP</span></div>
          <div>
            <h2 id="idea-title">A pin is a point.<br/>Getting there is a path.</h2>
            <p className="section-lede">Someone can reach the right street and still be lost. Which gate? Which side of the market? Which room in a block of similar doors? The missing part is usually a walk another person already knows.</p>
          </div>
        </div>
        <div className="wrap place-strip" aria-label="Examples of exact destinations"><span>THE ENTRANCE</span><span>THE MARKET STALL</span><span>THE ROOM</span><span>THE MEETING POINT</span></div>
      </section>

      <section id="route" className="route-section wrap" aria-labelledby="route-title">
        <div className="section-label"><span className="section-index">02</span><span>THE WALK</span></div>
        <div className="route-grid">
          <div className="figure-shell">
            <div className="figure-top"><span>ROUTE STUDY</span><span>START / TURN / ARRIVE</span></div>
            <div className="figure-viewport"><iframe src="./hairline-route-stones.html?theme=light&play=1" title="Interactive route study: a walk from a familiar start through a turn to one exact destination" loading="lazy" scrolling="no"/></div>
            <p className="figure-caption">Touch the stones to trace the route. <a href="./hairline-route-stones.html?theme=light&play=1" target="_blank" rel="noopener noreferrer">Open the full study ↗</a></p>
          </div>
          <div className="route-copy">
            <h2 id="route-title">Walk it once.<br/><em>Pass it on.</em></h2>
            <p className="route-intro">The person who knows the way records it once. The next person gets the turns and visual landmarks, not just another pin.</p>
            <ol className="route-steps">
              <li><span>01</span><div><h3>Start at a place people know</h3><p>A recognizable landmark gives both people the same beginning.</p></div></li>
              <li><span>02</span><div><h3>Follow the turns</h3><p>The recorded walk carries the route through the part the map cannot describe.</p></div></li>
              <li><span>03</span><div><h3>Arrive at the exact place</h3><p>The intended destination is an entrance, stall, room, or meeting point.</p></div></li>
            </ol>
          </div>
        </div>
      </section>

      <section className="trust-section" aria-labelledby="trust-title"><div className="wrap trust-grid"><div className="section-label"><span className="section-index">03</span><span>THE RULE</span></div><div><h2 id="trust-title">If the way is unclear,<br/>the arrow waits.</h2><p>Visual guidance should follow only a verified route. When the camera loses its place or two places look alike, WALK IT must pause instead of pointing with false confidence.</p></div><span className="pause-symbol" aria-hidden="true"><i/><i/></span></div></section>

      <section className="build-section" aria-labelledby="build-title"><div className="wrap build-grid"><div><p className="eyebrow">THE CURRENT BUILD</p><h2 id="build-title">See what works.<br/>See what is still being tested.</h2><p>Capture and tracking tools are available now. Relocalization, route accuracy, and live navigation remain under evaluation. The evidence page separates working parts from open gates.</p></div><div className="build-actions"><LiquidButton asChild variant="primary" size="lg"><a href="./live.html">Open the field build <span aria-hidden="true">↗</span></a></LiquidButton><a className="line-link" href="./evidence.html">Review the evidence <span aria-hidden="true">↗</span></a></div></div></section>
    </main>

    <footer className="site-footer wrap"><a className="footer-brand" href="./">WALK IT</a><span>From nearby to right here.</span><span>Made in Uganda, for anywhere a pin falls short.</span></footer>
  </div>;
}

if(typeof document!=='undefined'){
  const mount=document.getElementById('root') as (HTMLElement & {walkitRoot?:ReturnType<typeof createRoot>})|null;
  if(mount){
    mount.walkitRoot??=createRoot(mount);
    mount.walkitRoot.render(<React.StrictMode><App/></React.StrictMode>);
  }
}
