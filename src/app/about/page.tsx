"use client";
import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { Smartphone, Zap, Map, ArrowRight, MapPin, Users, Flag, Radio } from 'lucide-react';

function useCounter(end: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState<number>(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
}

interface StatProps {
  value: number;
  suffix?: string;
  label: string;
  start: boolean;
}

function Stat({ value, suffix = '', label, start }: StatProps) {
  const n = useCounter(value, 1800, start);
  return (
    <div style={{padding:'48px 32px', borderRight:'3px solid #222', textAlign:'left'}}>
      <div style={{fontFamily:'Barlow Condensed,sans-serif', fontSize:'clamp(56px,7vw,96px)', fontWeight:900, color:'#E8190A', letterSpacing:'-0.02em', lineHeight:1}}>{n}{suffix}</div>
      <div style={{fontFamily:'Space Mono,monospace', fontSize:11, textTransform:'uppercase', letterSpacing:'0.12em', color:'#666', marginTop:8}}>{label}</div>
    </div>
  );
}

const S = {
  r:'#E8190A', k:'#0A0A0A', w:'#F5F2EE',
  border:'3px solid #0A0A0A',
  mono:{fontFamily:'Space Mono,monospace'},
  cond:{fontFamily:'Barlow Condensed,sans-serif'},
};

const sectionLabel = (txt: string) => (
  <div style={{...S.mono, fontSize:10, textTransform:'uppercase', letterSpacing:'0.2em', color:S.r, marginBottom:20, display:'flex', alignItems:'center', gap:10}}>
    {txt}<span style={{width:60, height:2, background:S.r, display:'inline-block'}}/>
  </div>
);

const sectionTitle = (node: ReactNode) => (
  <h2 style={{...S.cond, fontSize:'clamp(40px,6vw,80px)', fontWeight:900, textTransform:'uppercase', lineHeight:0.92, letterSpacing:'-0.02em', marginBottom:32}}>{node}</h2>
);

export default function AboutPage() {
  const statsRef = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, {threshold:0.3});
    if (statsRef.current) ob.observe(statsRef.current);
    return () => ob.disconnect();
  }, []);

  const events = [
    {id:'01', loc:'Kirtipur',    status:'COMPLETE',  detail:'First live GPS checkpoint test. Proof of concept validated.'},
    {id:'02', loc:'Thamel',      status:'COMPLETE',  detail:'Stress-tested geofencing in dense urban grid. Live leaderboard synced.'},
    {id:'03', loc:'Basantapur',  status:'COMPLETE',  detail:'Highest participation to date. Lore unlocks debuted.'},
    {id:'04', loc:'Basantapur',  status:'COMPLETE',  detail:'Bigger map. More checkpoints. Heritage layer expanded.'},
    {id:'05', loc:'TBA',         status:'LIVE SOON', detail:'Demo 5 — next frontier. Stay tuned.'},
  ];

  const tech = [
    {icon:<Smartphone size={24}/>, t:'Web-App Native',  b:'Next.js + Firebase. No app store required.'},
    {icon:<Map size={24}/>,        t:'Live Geofencing', b:'MapLibre GL JS tracks position in real-time.'},
    {icon:<Zap size={24}/>,        t:'Lore Unlocks',    b:'Capturing landmarks reveals hidden city history.'},
    {icon:<Radio size={24}/>,      t:'Real-Time Sync',  b:'Scores update live across all players instantly.'},
    {icon:<Flag size={24}/>,       t:'Route Engine',    b:'Deploy new city maps across any neighborhood.'},
    {icon:<Users size={24}/>,      t:'Beta Community',  b:'100+ users across 4 Kathmandu pilot events.'},
  ];

  const sponsors = [
    {n:'01', t:'Verified Reach',    b:'GPS-confirmed, timestamped brand presence — not just impressions.'},
    {n:'02', t:'Scalable Instantly',b:'One platform. Deploy branded checkpoints across a district overnight.'},
    {n:'03', t:'Engaged Audience',  b:'100+ active beta users who walk, explore, and compete.'},
    {n:'04', t:'Real Behavior Data',b:'Route completion rates, dwell times, checkpoint analytics.'},
  ];

  const faqs = [
    {q:'Do I need to be a professional trekker?',        a:'Not at all. Anyone who enjoys walking at their own pace.'},
    {q:'How are rewards earned?',                         a:'By walking trails, discovering places, and completing GPS checkpoints.'},
    {q:'Is there any cost to join?',                      a:'Participation is free. Just time, curiosity, and comfortable shoes.'},
    {q:"Can I contribute if I'm not from the area?",      a:'Yes — volunteer, support mapping, or help spread the movement.'},
  ];

  const sec: React.CSSProperties = {padding:'80px 40px', borderBottom:S.border, maxWidth:1200, margin:'0 auto'};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,900;1,900&family=Barlow:wght@400;600&family=Space+Mono:wght@400;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#F5F2EE;color:#0A0A0A;font-family:Barlow,sans-serif;overflow-x:hidden}
        ::selection{background:#E8190A;color:#F5F2EE}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 3px rgba(232,25,10,.3)}50%{box-shadow:0 0 0 8px rgba(232,25,10,.1)}}
        .tech-card:hover{background:#0A0A0A;color:#F5F2EE}
        .tech-card:hover .ti{background:#E8190A;color:#F5F2EE}
        .tech-card:hover .tb{color:#aaa}
        .event-row:hover{background:#f5f0e8}
        .btn-p:hover{background:#0A0A0A;color:#F5F2EE;transform:translate(-2px,-2px)}
        .btn-s:hover{border-color:#F5F2EE;background:rgba(255,255,255,.1)}
        .faq-item summary::-webkit-details-marker{display:none}
        .faq-item[open] summary .plus{transform:rotate(45deg);display:inline-block}
        @media(max-width:768px){
          .hero-body{grid-template-columns:1fr!important}
          .phone{display:none}
          .strip{display:none}
          .stats-grid{grid-template-columns:repeat(2,1fr)!important}
          .tech-grid{grid-template-columns:1fr!important}
          .event-row{grid-template-columns:48px 1fr!important}
          .two-col{grid-template-columns:1fr!important}
        }
      `}</style>

      {/* HERO */}
      <header style={{minHeight:'100vh', display:'grid', gridTemplateRows:'auto 1fr auto', borderBottom:S.border, background:S.w}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 40px', borderBottom:S.border, ...S.mono, fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em'}}>
          <span>Ghumante Yuwa / About</span>
          <span style={{background:S.r, color:S.w, padding:'4px 12px', fontSize:10, fontWeight:700, letterSpacing:'0.15em', animation:'blink 2s step-end infinite'}}>● Beta Live — Pilot 05 Coming</span>
          <span>KTM, Nepal</span>
        </div>

        <div className="hero-body" style={{display:'grid', gridTemplateColumns:'1fr 1fr', alignItems:'end', padding:'60px 40px 0', gap:40}}>
          <div>
            <h1 style={{...S.cond, fontSize:'clamp(72px,12vw,160px)', fontWeight:900, lineHeight:0.88, textTransform:'uppercase', letterSpacing:'-0.02em'}}>
              The City<br/><span style={{color:S.r, fontStyle:'italic'}}>In Your</span><br/>Pocket.
            </h1>
            <p style={{fontSize:'clamp(16px,2vw,22px)', fontWeight:600, color:'#444', lineHeight:1.5, marginTop:32, maxWidth:480}}>
              Ghumante Yuwa is a GPS-powered urban exploration app built in Kathmandu. Real landmarks, real streets, live game board.
            </p>
          </div>
          <div className="phone" style={{display:'flex', justifyContent:'flex-end', alignItems:'flex-end'}}>
            <div style={{width:220, height:440, border:'6px solid #0A0A0A', borderRadius:32, background:'#1a1a1a', position:'relative', boxShadow:'12px 0 0 0 #E8190A', overflow:'hidden'}}>
              <div style={{position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:80, height:24, background:'#0A0A0A', borderRadius:'0 0 16px 16px', zIndex:2}}/>
              <div style={{width:'100%', height:'100%', padding:'32px 12px 16px', display:'flex', flexDirection:'column', gap:8}}>
                <div style={{flex:1, background:'#2a2a2a', borderRadius:8, position:'relative', overflow:'hidden'}}>
                  <div style={{position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(232,25,10,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(232,25,10,.15) 1px,transparent 1px)', backgroundSize:'24px 24px'}}/>
                  {[[30,40],[55,65],[70,25]].map(([t,l],i) => (
                    <div key={i} style={{position:'absolute', top:`${t}%`, left:`${l}%`, width:10, height:10, borderRadius:'50%', background:S.r, animation:`pulse 2s ease-in-out ${i*0.7}s infinite`}}/>
                  ))}
                </div>
                <div style={{background:S.r, color:S.w, ...S.mono, fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', padding:'6px 10px', borderRadius:4, textAlign:'center'}}>3 Checkpoints Nearby</div>
                <div style={{height:8, background:'#333', borderRadius:4}}/>
                <div style={{height:8, background:S.r, borderRadius:4, width:'60%'}}/>
              </div>
            </div>
          </div>
        </div>

        <div className="strip" style={{borderTop:S.border, display:'flex', overflow:'hidden'}}>
          {['Next.js + Firebase','MapLibre GL JS','Live Leaderboard','Beta v1.0'].map((item,i) => (
            <div key={i} style={{flex:1, padding:'16px 24px', borderRight: i<3 ? S.border:'none', ...S.mono, fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', display:'flex', alignItems:'center', gap:8}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:S.r,flexShrink:0}}/>{item}
            </div>
          ))}
        </div>
      </header>

      {/* STATS */}
      <div className="stats-grid" ref={statsRef} style={{background:S.k, color:S.w, borderBottom:S.border, display:'grid', gridTemplateColumns:'repeat(4,1fr)'}}>
        <Stat value={100} suffix="+" label="Users Completed Routes" start={vis}/>
        <Stat value={4} label="Pilot Events Run" start={vis}/>
        <Stat value={3} label="Kathmandu Districts" start={vis}/>
        <Stat value={5} label="Pilot Events Total" start={vis}/>
      </div>

      {/* TECH */}
      <div style={{borderBottom:S.border}}>
        <section style={sec}>
          {sectionLabel('The Platform')}
          {sectionTitle(<>Built for<br/><em style={{color:S.r}}>the streets.</em></>)}
          <p style={{maxWidth:560, fontWeight:600, color:'#555', fontSize:16, lineHeight:1.6}}>No download. No friction. Runs in any mobile browser.</p>
          <div className="tech-grid" style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', border:S.border, marginTop:40}}>
            {tech.map((c,i) => (
              <div key={i} className="tech-card" style={{padding:'32px 28px', borderRight: (i+1)%3!==0?S.border:'none', borderBottom: i<3?S.border:'none', transition:'background .2s,color .2s'}}>
                <div className="ti" style={{width:48,height:48,background:S.k,color:S.w,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20,transition:'background .2s,color .2s'}}>{c.icon}</div>
                <div style={{...S.cond, fontSize:22, fontWeight:900, textTransform:'uppercase', marginBottom:8}}>{c.t}</div>
                <div className="tb" style={{fontSize:14, color:'#555', fontWeight:600, lineHeight:1.5, transition:'color .2s'}}>{c.b}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* EVENTS */}
      <div style={{borderBottom:S.border}}>
        <section style={sec}>
          {sectionLabel('Field Validation')}
          {sectionTitle(<>Every event<br/><em style={{color:S.r}}>is a test.</em></>)}
          <div style={{marginTop:40, border:S.border}}>
            {events.map((e,i) => (
              <div key={e.id} className="event-row" style={{display:'grid', gridTemplateColumns:'64px 160px 1fr auto', alignItems:'center', padding:'28px 32px', borderBottom: i<events.length-1?S.border:'none', gap:24, transition:'background .15s'}}>
                <div style={{...S.mono, fontSize:28, fontWeight:700, color:'#ccc'}}>{e.id}</div>
                <div style={{...S.cond, fontSize:28, fontWeight:900, textTransform:'uppercase'}}>{e.loc}</div>
                <div style={{fontSize:14, fontWeight:600, color:'#555', lineHeight:1.4}}>{e.detail}</div>
                <div style={{...S.mono, fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', padding:'6px 14px', border: e.status==='LIVE SOON'?`2px solid ${S.r}`:`2px solid ${S.k}`, background: e.status==='LIVE SOON'?S.r:'transparent', color: e.status==='LIVE SOON'?S.w:S.k, whiteSpace:'nowrap', animation: e.status==='LIVE SOON'?'blink 2s step-end infinite':'none'}}>{e.status}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* SPONSOR */}
      <div style={{background:S.k, color:S.w, padding:'80px 40px', borderBottom:S.border}}>
        <div style={{maxWidth:1200, margin:'0 auto'}}>
          {sectionLabel('For Partners & Sponsors')}
          {sectionTitle(<>More than<br/><em style={{color:S.r}}>an event.</em></>)}
          <p style={{maxWidth:560, fontWeight:600, color:'#666', fontSize:16, lineHeight:1.6}}>Your sponsorship buys verified, physical presence.</p>
          <div className="two-col" style={{display:'grid', gridTemplateColumns:'1fr 1fr', border:'3px solid #333', marginTop:48}}>
            {sponsors.map((s,i) => (
              <div key={i} style={{padding:'40px 36px', borderRight: i%2===0?'3px solid #333':'none', borderBottom: i<2?'3px solid #333':'none'}}>
                <div style={{...S.cond, fontSize:64, fontWeight:900, color:'#1f1f1f', lineHeight:1}}>{s.n}</div>
                <div style={{...S.cond, fontSize:26, fontWeight:900, textTransform:'uppercase', color:S.r, marginBottom:12}}>{s.t}</div>
                <div style={{fontSize:14, fontWeight:600, color:'#666', lineHeight:1.6}}>{s.b}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WHY */}
      <div style={{borderBottom:S.border}}>
        <section style={sec}>
          {sectionLabel('Origin')}
          {sectionTitle(<>Why we<br/><em style={{color:S.r}}>made this.</em></>)}
          <div className="two-col" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'start', marginTop:40}}>
            <div style={{display:'flex', flexDirection:'column', gap:20}}>
              {[
                'We noticed that people were moving less, exploring less, and losing connection with places around them.',
                'Streets became shortcuts, not stories. Walking became a task, not an experience.',
                'Ghumante Yuwa was created to change that — walk with intention, discover local paths, reconnect with your city.',
              ].map((p,i) => (
                <p key={i} style={{fontSize:18, fontWeight:600, color:'#444', lineHeight:1.65, borderLeft:`4px solid ${i===2?S.r:'#e0dbd3'}`, paddingLeft:20}}>{p}</p>
              ))}
            </div>
            <div style={{border:S.border, padding:32, background:'#f9f6f1'}}>
              <div style={{...S.mono, fontSize:10, textTransform:'uppercase', letterSpacing:'0.2em', color:S.r, marginBottom:16}}>The Mission</div>
              <p style={{...S.cond, fontSize:36, fontWeight:900, textTransform:'uppercase', lineHeight:1, letterSpacing:'-0.02em', marginBottom:16}}>Walk with intention.<br/>Discover the city.<br/>Build community.</p>
              <p style={{fontSize:14, fontWeight:600, color:'#666', lineHeight:1.6}}>No special skills. No equipment. Just curiosity and your phone.</p>
            </div>
          </div>
        </section>
      </div>

      {/* JOIN */}
      <div style={{borderBottom:S.border}}>
        <section style={sec}>
          {sectionLabel('Get Involved')}
          {sectionTitle(<>Join the<br/><em style={{color:S.r}}>movement.</em></>)}
          <div className="two-col" style={{display:'grid', gridTemplateColumns:'1fr 1fr', border:S.border, marginTop:40}}>
            <div style={{padding:'40px 36px', borderRight:S.border}}>
              <div style={{...S.mono, fontSize:10, textTransform:'uppercase', letterSpacing:'0.2em', color:'#888', marginBottom:12}}>Option A</div>
              <h3 style={{...S.cond, fontSize:40, fontWeight:900, textTransform:'uppercase', lineHeight:1, marginBottom:16}}>Become a<br/><span style={{color:S.r}}>Volunteer</span></h3>
              <p style={{fontSize:14, fontWeight:600, color:'#555', lineHeight:1.65, marginBottom:24}}>Help map trails, guide participants, or support events. No special skills — just the love to walk.</p>
              <a href="#" style={{...S.cond, fontSize:18, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.05em', color:S.k, textDecoration:'none', borderBottom:`3px solid ${S.k}`, paddingBottom:2, display:'inline-flex', alignItems:'center', gap:8}}>Join as Volunteer <ArrowRight size={16}/></a>
            </div>
            <div style={{padding:'40px 36px', background:S.k, color:S.w}}>
              <div style={{...S.mono, fontSize:10, textTransform:'uppercase', letterSpacing:'0.2em', color:'#555', marginBottom:12}}>Option B</div>
              <h3 style={{...S.cond, fontSize:40, fontWeight:900, textTransform:'uppercase', lineHeight:1, marginBottom:16}}>Partner as a<br/><span style={{color:S.r}}>Sponsor</span></h3>
              <p style={{fontSize:14, fontWeight:600, color:'#666', lineHeight:1.65, marginBottom:24}}>Support youth-led exploration. Your brand becomes part of real journeys and real impact.</p>
              <a href="#" style={{...S.cond, fontSize:18, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.05em', color:S.r, textDecoration:'none', borderBottom:`3px solid ${S.r}`, paddingBottom:2, display:'inline-flex', alignItems:'center', gap:8}}>Become a Sponsor <ArrowRight size={16}/></a>
            </div>
          </div>
        </section>
      </div>

      {/* FAQ */}
      <div style={{borderBottom:S.border}}>
        <section style={sec}>
          {sectionLabel('FAQ')}
          {sectionTitle(<>Questions<br/><em style={{color:S.r}}>you may have.</em></>)}
          <div style={{marginTop:40, border:S.border}}>
            {faqs.map((item,i) => (
              <details key={i} style={{borderBottom: i<faqs.length-1?S.border:'none'}} className="faq-item">
                <summary style={{display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', padding:'24px 32px', fontSize:18, fontWeight:700, listStyle:'none', ...S.cond, textTransform:'uppercase', letterSpacing:'-0.01em'}}>
                  {item.q}<span className="plus" style={{color:S.r, fontSize:28, fontWeight:900, flexShrink:0, marginLeft:16}}>+</span>
                </summary>
                <p style={{padding:'0 32px 24px', paddingTop:16, fontSize:15, fontWeight:600, color:'#555', lineHeight:1.65, borderTop:'2px solid #eee'}}>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      {/* CTA */}
      <footer style={{background:S.r, color:S.w, padding:'100px 40px', textAlign:'center', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', ...S.cond, fontSize:'clamp(120px,20vw,280px)', fontWeight:900, textTransform:'uppercase', color:'rgba(255,255,255,.06)', whiteSpace:'nowrap', pointerEvents:'none', letterSpacing:'-0.04em', lineHeight:1}}>Play</div>
        <h2 style={{...S.cond, fontSize:'clamp(56px,10vw,120px)', fontWeight:900, textTransform:'uppercase', lineHeight:0.9, letterSpacing:'-0.03em', marginBottom:24, position:'relative', zIndex:1}}>Join the<br/>Beta.</h2>
        <p style={{fontSize:18, fontWeight:600, opacity:.85, marginBottom:48, position:'relative', zIndex:1}}>Pilot 05 is coming. Be there.</p>
        <div style={{display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap', position:'relative', zIndex:1}}>
          <a href="/play" className="btn-p" style={{background:S.w, color:S.k, ...S.cond, fontSize:22, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.05em', padding:'18px 40px', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:10, textDecoration:'none', transition:'background .15s,color .15s,transform .1s', boxShadow:'6px 6px 0 rgba(0,0,0,.2)'}}>Launch App <ArrowRight size={22}/></a>
        
        </div>
        <div style={{...S.mono, marginTop:64, fontSize:10, textTransform:'uppercase', letterSpacing:'0.2em', opacity:.4, position:'relative', zIndex:1}}>Kathmandu · Nepal · Since 2025</div>
      </footer>
    </>
  );
}